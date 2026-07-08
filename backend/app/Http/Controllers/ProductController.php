<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'alert_threshold');
        }

        $products = $query->latest()->paginate($request->integer('per_page', 20));

        return response()->json($products);
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = Product::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($product->load('category'), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load('category', 'stockMovements'));
    }

    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $product->update($request->validated());

        return response()->json($product->fresh()->load('category'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $hasHistory = $product->stockMovements()->exists()
            || $product->quoteItems()->exists()
            || $product->invoiceItems()->exists()
            || $product->purchaseOrderItems()->exists()
            || $product->purchaseRequests()->exists()
            || $product->productionOrders()->exists()
            || $product->billOfMaterials()->exists();

        if ($hasHistory) {
            throw ValidationException::withMessages([
                'name' => ["Ce produit « {$product->name} » est déjà utilisé (ventes, achats, stock ou production) : il ne peut pas être supprimé."],
            ]);
        }

        $product->delete();

        return response()->json(null, 204);
    }

    public function generateBarcode(Product $product): JsonResponse
    {
        $code = sprintf('%03d%09d1', $product->company_id, $product->id);
        $product->update(['barcode' => $code]);

        return response()->json(['barcode' => $code]);
    }

    public function generateQrcode(Product $product): JsonResponse
    {
        $code = 'DOSIA-' . Str::upper(Str::random(10)) . '-' . $product->id;
        $product->update(['qrcode' => $code]);

        return response()->json(['qrcode' => $code]);
    }
}
