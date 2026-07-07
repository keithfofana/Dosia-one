<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductionOrderRequest;
use App\Models\BillOfMaterial;
use App\Models\Product;
use App\Models\ProductionCost;
use App\Models\ProductionOrder;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductionOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = ProductionOrder::with('product')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    public function store(ProductionOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $order = DB::transaction(function () use ($data, $companyId) {
            $order = ProductionOrder::create([
                'company_id' => $companyId,
                'product_id' => $data['product_id'],
                'quantity_to_produce' => $data['quantity_to_produce'],
                'status' => 'planifie',
            ]);

            $this->snapshotBillOfMaterials($order, $data['quantity_to_produce']);

            return $order;
        });

        $order->load('billOfMaterials.rawMaterial', 'product');

        $payload = $order->toArray();
        $payload['stock_warnings'] = $this->stockWarnings($order);

        return response()->json($payload, 201);
    }

    public function show(ProductionOrder $productionOrder): JsonResponse
    {
        return response()->json($productionOrder->load('billOfMaterials.rawMaterial', 'product', 'productionCosts'));
    }

    public function update(ProductionOrderRequest $request, ProductionOrder $productionOrder): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $productionOrder) {
            $newQuantity = $data['quantity_to_produce'] ?? $productionOrder->quantity_to_produce;

            if ($newQuantity !== $productionOrder->quantity_to_produce) {
                if ($productionOrder->status !== 'planifie') {
                    throw ValidationException::withMessages([
                        'quantity_to_produce' => ["Impossible de modifier la quantité d'un ordre déjà démarré."],
                    ]);
                }

                $productionOrder->quantity_to_produce = $newQuantity;
                $this->snapshotBillOfMaterials($productionOrder, $newQuantity);
            }

            if (isset($data['status']) && $data['status'] !== $productionOrder->status) {
                $this->applyTransition($productionOrder, $data['status'], $data);
            }

            $productionOrder->save();
        });

        return response()->json($productionOrder->fresh()->load('billOfMaterials.rawMaterial', 'product', 'productionCosts'));
    }

    public function destroy(ProductionOrder $productionOrder): JsonResponse
    {
        if ($productionOrder->status !== 'planifie') {
            throw ValidationException::withMessages([
                'status' => ["Impossible de supprimer un ordre de production déjà démarré."],
            ]);
        }

        $productionOrder->delete();

        return response()->json(null, 204);
    }

    public function cost(ProductionOrder $productionOrder): JsonResponse
    {
        $existing = $productionOrder->productionCosts()->latest()->first();

        if ($existing) {
            return response()->json([
                'material_cost' => (float) $existing->material_cost,
                'labor_cost' => (float) $existing->labor_cost,
                'overhead_cost' => (float) $existing->overhead_cost,
                'total' => (float) ($existing->material_cost + $existing->labor_cost + $existing->overhead_cost),
                'estimated' => false,
            ]);
        }

        $materialCost = $this->computeMaterialCost($productionOrder);

        return response()->json([
            'material_cost' => $materialCost,
            'labor_cost' => 0,
            'overhead_cost' => 0,
            'total' => $materialCost,
            'estimated' => true,
        ]);
    }

    private function snapshotBillOfMaterials(ProductionOrder $order, int $quantityToProduce): void
    {
        $masterLines = BillOfMaterial::where('product_id', $order->product_id)
            ->whereNull('production_order_id')
            ->get();

        if ($masterLines->isEmpty()) {
            throw ValidationException::withMessages([
                'product_id' => ["Aucune nomenclature (BOM) n'est définie pour ce produit. Définissez-la avant de créer un ordre de fabrication."],
            ]);
        }

        $order->billOfMaterials()->delete();

        $order->billOfMaterials()->createMany(
            $masterLines->map(fn ($line) => [
                'raw_material_id' => $line->raw_material_id,
                'quantity_used' => $line->quantity_used * $quantityToProduce,
            ])->all()
        );
    }

    private function stockWarnings(ProductionOrder $order): array
    {
        return $order->billOfMaterials()
            ->with('rawMaterial')
            ->get()
            ->filter(fn ($line) => $line->rawMaterial->quantity < $line->quantity_used)
            ->map(fn ($line) => [
                'raw_material_id' => $line->raw_material_id,
                'raw_material_name' => $line->rawMaterial->name,
                'required' => (float) $line->quantity_used,
                'available' => (float) $line->rawMaterial->quantity,
            ])
            ->values()
            ->all();
    }

    private function applyTransition(ProductionOrder $order, string $newStatus, array $data): void
    {
        $from = $order->status;

        $steps = match (true) {
            $from === 'planifie' && $newStatus === 'en_cours' => ['consume'],
            $from === 'en_cours' && $newStatus === 'termine' => ['produce'],
            $from === 'planifie' && $newStatus === 'termine' => ['consume', 'produce'],
            default => null,
        };

        if ($steps === null) {
            throw ValidationException::withMessages([
                'status' => ["Transition de statut invalide : {$from} → {$newStatus}."],
            ]);
        }

        foreach ($steps as $step) {
            if ($step === 'consume') {
                $this->consumeRawMaterials($order);
            } else {
                $this->produceFinishedGoods($order, $data);
            }
        }

        $order->status = $newStatus;
    }

    private function consumeRawMaterials(ProductionOrder $order): void
    {
        $lines = $order->billOfMaterials()->with('rawMaterial')->get();

        foreach ($lines as $line) {
            if ($line->rawMaterial->quantity < $line->quantity_used) {
                throw ValidationException::withMessages([
                    'items' => ["Stock insuffisant pour la matière première « {$line->rawMaterial->name} »."],
                ]);
            }
        }

        foreach ($lines as $line) {
            RawMaterial::whereKey($line->raw_material_id)->decrement('quantity', $line->quantity_used);
        }
    }

    private function produceFinishedGoods(ProductionOrder $order, array $data): void
    {
        Product::whereKey($order->product_id)->increment('quantity', $order->quantity_to_produce);

        StockMovement::create([
            'company_id' => $order->company_id,
            'product_id' => $order->product_id,
            'type' => 'entree',
            'quantity' => $order->quantity_to_produce,
            'reason' => "Production terminée - ordre #{$order->id}",
            'user_id' => request()->user()?->id,
        ]);

        $cost = ProductionCost::create([
            'production_order_id' => $order->id,
            'material_cost' => $this->computeMaterialCost($order),
            'labor_cost' => $data['labor_cost'] ?? 0,
            'overhead_cost' => $data['overhead_cost'] ?? 0,
        ]);

        app(AccountingService::class)->recordProductionCompletion($order, $cost);
    }

    private function computeMaterialCost(ProductionOrder $order): float
    {
        return (float) $order->billOfMaterials()
            ->with('rawMaterial')
            ->get()
            ->sum(fn ($line) => $line->quantity_used * $line->rawMaterial->unit_cost);
    }
}
