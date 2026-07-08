<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockMovementRequest;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::with('product', 'user')
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($movements);
    }

    /**
     * Vue de variation pour un produit sur une periode : quantite en debut de
     * periode -> mouvements de la periode -> quantite en fin de periode.
     * Rejoue l'historique complet du produit (pas seulement la periode) car
     * un mouvement de type "ajustement" fixe une quantite absolue et casse
     * tout calcul base uniquement sur la somme des deltas de la periode.
     */
    public function variation(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $productId = $request->integer('product_id');
        $dateFrom = $request->date('date_from');
        $dateTo = $request->date('date_to');

        $allMovements = StockMovement::with('user')
            ->where('product_id', $productId)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $running = 0;
        $annotated = $allMovements->map(function ($movement) use (&$running) {
            $running = match ($movement->type) {
                'ajustement' => (int) $movement->quantity,
                'entree' => $running + $movement->quantity,
                'sortie' => $running - $movement->quantity,
            };

            return [
                'id' => $movement->id,
                'type' => $movement->type,
                'quantity' => $movement->quantity,
                'reason' => $movement->reason,
                'created_at' => $movement->created_at,
                'user' => $movement->user ? ['id' => $movement->user->id, 'name' => $movement->user->name] : null,
                'quantity_after' => $running,
            ];
        });

        $beforePeriod = $dateFrom
            ? $annotated->filter(fn ($m) => $m['created_at']->lt($dateFrom))
            : collect();
        $openingQuantity = $beforePeriod->isNotEmpty() ? $beforePeriod->last()['quantity_after'] : 0;

        $inPeriod = $annotated->filter(function ($m) use ($dateFrom, $dateTo) {
            if ($dateFrom && $m['created_at']->lt($dateFrom)) {
                return false;
            }
            if ($dateTo && $m['created_at']->gt($dateTo->copy()->endOfDay())) {
                return false;
            }

            return true;
        })->values();

        $closingQuantity = $inPeriod->isNotEmpty() ? $inPeriod->last()['quantity_after'] : $openingQuantity;

        return response()->json([
            'opening_quantity' => $openingQuantity,
            'closing_quantity' => $closingQuantity,
            'variation' => $closingQuantity - $openingQuantity,
            'movements' => $inPeriod->values(),
        ]);
    }

    public function store(StockMovementRequest $request): JsonResponse
    {
        $data = $request->validated();

        $movement = DB::transaction(function () use ($data, $request) {
            $movement = StockMovement::create([
                'company_id' => $request->user()->company_id,
                'product_id' => $data['product_id'],
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'reason' => $data['reason'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            $this->applyMovement($movement, 1);

            return $movement;
        });

        return response()->json($movement->load('product', 'user'), 201);
    }

    public function show(StockMovement $stockMovement): JsonResponse
    {
        return response()->json($stockMovement->load('product', 'user'));
    }

    public function update(StockMovementRequest $request, StockMovement $stockMovement): JsonResponse
    {
        $stockMovement->update($request->validated());

        return response()->json($stockMovement->fresh()->load('product', 'user'));
    }

    public function destroy(StockMovement $stockMovement): JsonResponse
    {
        DB::transaction(function () use ($stockMovement) {
            $this->applyMovement($stockMovement, -1);
            $stockMovement->delete();
        });

        return response()->json(null, 204);
    }

    private function applyMovement(StockMovement $movement, int $direction): void
    {
        if ($movement->type === 'ajustement') {
            if ($direction === 1) {
                Product::whereKey($movement->product_id)->update(['quantity' => $movement->quantity]);
            }

            return;
        }

        $delta = $movement->type === 'entree' ? $movement->quantity : -$movement->quantity;
        Product::whereKey($movement->product_id)->increment('quantity', $delta * $direction);
    }
}
