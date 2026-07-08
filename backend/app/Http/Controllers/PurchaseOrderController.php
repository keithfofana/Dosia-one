<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\GeneratesDocumentNumber;
use App\Http\Requests\PurchaseOrderRequest;
use App\Models\GoodsReceipt;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{
    use GeneratesDocumentNumber;

    public function index(Request $request): JsonResponse
    {
        $orders = PurchaseOrder::with('supplier')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    public function store(PurchaseOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $order = DB::transaction(function () use ($data, $companyId) {
            $total = collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

            $order = PurchaseOrder::create([
                'company_id' => $companyId,
                'supplier_id' => $data['supplier_id'],
                'number' => $this->generateNumber(PurchaseOrder::class, 'BC', $companyId),
                'status' => 'brouillon',
                'total' => $total,
            ]);

            $order->purchaseOrderItems()->createMany($data['items']);

            return $order;
        });

        return response()->json($order->load('purchaseOrderItems.product', 'supplier'), 201);
    }

    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        return response()->json($purchaseOrder->load('purchaseOrderItems.product', 'supplier', 'goodsReceipts'));
    }

    public function update(PurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $data = $request->validated();

        if ($purchaseOrder->goodsReceipts()->exists() && isset($data['items'])) {
            throw ValidationException::withMessages([
                'items' => ['Cette commande a déjà des réceptions de marchandises enregistrées : ses lignes ne peuvent plus être modifiées.'],
            ]);
        }

        DB::transaction(function () use ($data, $purchaseOrder) {
            if (isset($data['items'])) {
                $total = collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);
                $purchaseOrder->purchaseOrderItems()->delete();
                $purchaseOrder->purchaseOrderItems()->createMany($data['items']);
                $data['total'] = $total;
            }

            $purchaseOrder->update(collect($data)->except('items')->toArray());
        });

        return response()->json($purchaseOrder->fresh()->load('purchaseOrderItems.product', 'supplier'));
    }

    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        if ($purchaseOrder->goodsReceipts()->exists() || in_array($purchaseOrder->status, ['recue', 'recue_partiel'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Cette commande a déjà des réceptions de marchandises : elle ne peut pas être supprimée. Annulez-la à la place.'],
            ]);
        }

        $purchaseOrder->delete();

        return response()->json(null, 204);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($data, $purchaseOrder, $request) {
            $receivedValue = 0.0;

            foreach ($data['items'] as $item) {
                GoodsReceipt::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $item['product_id'],
                    'quantity_received' => $item['quantity_received'],
                ]);

                $product = Product::findOrFail($item['product_id']);
                $product->increment('quantity', $item['quantity_received']);
                $receivedValue += $item['quantity_received'] * (float) $product->purchase_price;

                StockMovement::create([
                    'company_id' => $purchaseOrder->company_id,
                    'product_id' => $item['product_id'],
                    'type' => 'entree',
                    'quantity' => $item['quantity_received'],
                    'reason' => "Réception commande fournisseur #{$purchaseOrder->number}",
                    'user_id' => $request->user()->id,
                ]);
            }

            $purchaseOrder->update(['status' => $this->resolveReceptionStatus($purchaseOrder)]);

            app(AccountingService::class)->recordGoodsReceipt($purchaseOrder, $receivedValue);
        });

        return response()->json($purchaseOrder->fresh()->load('purchaseOrderItems.product', 'goodsReceipts', 'supplier'));
    }

    private function resolveReceptionStatus(PurchaseOrder $purchaseOrder): string
    {
        $ordered = $purchaseOrder->purchaseOrderItems()->get()->groupBy('product_id')
            ->map(fn ($items) => $items->sum('quantity'));

        $received = $purchaseOrder->goodsReceipts()->get()->groupBy('product_id')
            ->map(fn ($items) => $items->sum('quantity_received'));

        $fullyReceived = $ordered->every(
            fn ($qty, $productId) => ($received->get($productId, 0)) >= $qty
        );

        if ($fullyReceived) {
            return 'recue';
        }

        return $received->isEmpty() ? $purchaseOrder->status : 'recue_partiel';
    }
}
