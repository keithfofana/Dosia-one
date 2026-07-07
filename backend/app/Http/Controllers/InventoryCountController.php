<?php

namespace App\Http\Controllers;

use App\Http\Requests\InventoryCountRequest;
use App\Models\InventoryCount;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryCountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $counts = InventoryCount::with('product', 'user')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($counts);
    }

    public function store(InventoryCountRequest $request): JsonResponse
    {
        $data = $request->validated();

        $count = DB::transaction(function () use ($data, $request) {
            $product = Product::findOrFail($data['product_id']);
            $theoreticalQty = $product->quantity;
            $delta = $data['counted_qty'] - $theoreticalQty;

            $count = InventoryCount::create([
                'company_id' => $request->user()->company_id,
                'product_id' => $product->id,
                'theoretical_qty' => $theoreticalQty,
                'counted_qty' => $data['counted_qty'],
                'user_id' => $request->user()->id,
            ]);

            if ($delta !== 0) {
                $product->update(['quantity' => $data['counted_qty']]);

                StockMovement::create([
                    'company_id' => $request->user()->company_id,
                    'product_id' => $product->id,
                    'type' => 'ajustement',
                    'quantity' => abs($delta),
                    'reason' => "Ajustement suite inventaire #{$count->id}",
                    'user_id' => $request->user()->id,
                ]);
            }

            return $count;
        });

        return response()->json($count->load('product', 'user'), 201);
    }

    public function show(InventoryCount $inventoryCount): JsonResponse
    {
        return response()->json($inventoryCount->load('product', 'user'));
    }

    public function update(InventoryCountRequest $request, InventoryCount $inventoryCount): JsonResponse
    {
        $inventoryCount->update(['counted_qty' => $request->validated()['counted_qty']]);

        return response()->json($inventoryCount->fresh()->load('product', 'user'));
    }

    public function destroy(InventoryCount $inventoryCount): JsonResponse
    {
        $inventoryCount->delete();

        return response()->json(null, 204);
    }
}
