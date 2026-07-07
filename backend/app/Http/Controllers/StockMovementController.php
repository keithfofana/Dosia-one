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
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($movements);
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
