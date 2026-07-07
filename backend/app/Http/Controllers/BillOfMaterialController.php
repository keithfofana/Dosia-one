<?php

namespace App\Http\Controllers;

use App\Http\Requests\BillOfMaterialRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BillOfMaterialController extends Controller
{
    public function show(Product $product): JsonResponse
    {
        return response()->json(
            $product->billOfMaterials()->with('rawMaterial')->get()
        );
    }

    public function update(BillOfMaterialRequest $request, Product $product): JsonResponse
    {
        $items = collect($request->validated()['items'])->map(fn (array $item) => [
            'raw_material_id' => $item['raw_material_id'],
            'quantity_used' => $item['quantity_per_unit'],
        ]);

        DB::transaction(function () use ($product, $items) {
            $product->billOfMaterials()->delete();
            $product->billOfMaterials()->createMany($items);
        });

        return response()->json(
            $product->billOfMaterials()->with('rawMaterial')->get()
        );
    }
}
