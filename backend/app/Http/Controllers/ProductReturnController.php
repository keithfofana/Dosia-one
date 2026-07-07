<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductReturnRequest;
use App\Models\Product;
use App\Models\ProductReturn;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $returns = ProductReturn::with('invoice', 'product')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($returns);
    }

    public function store(ProductReturnRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $return = DB::transaction(function () use ($data, $request, $companyId) {
            $return = ProductReturn::create([
                'company_id' => $companyId,
                'invoice_id' => $data['invoice_id'],
                'product_id' => $data['product_id'],
                'quantity' => $data['quantity'],
                'reason' => $data['reason'] ?? null,
            ]);

            Product::whereKey($data['product_id'])->increment('quantity', $data['quantity']);

            StockMovement::create([
                'company_id' => $companyId,
                'product_id' => $data['product_id'],
                'type' => 'entree',
                'quantity' => $data['quantity'],
                'reason' => 'Retour produit sur facture #' . $data['invoice_id'],
                'user_id' => $request->user()->id,
            ]);

            return $return;
        });

        return response()->json($return->load('invoice', 'product'), 201);
    }

    public function show(ProductReturn $productReturn): JsonResponse
    {
        return response()->json($productReturn->load('invoice', 'product'));
    }

    public function update(ProductReturnRequest $request, ProductReturn $productReturn): JsonResponse
    {
        $productReturn->update($request->validated());

        return response()->json($productReturn->fresh()->load('invoice', 'product'));
    }

    public function destroy(ProductReturn $productReturn): JsonResponse
    {
        DB::transaction(function () use ($productReturn) {
            Product::whereKey($productReturn->product_id)->decrement('quantity', $productReturn->quantity);

            StockMovement::create([
                'company_id' => $productReturn->company_id,
                'product_id' => $productReturn->product_id,
                'type' => 'sortie',
                'quantity' => $productReturn->quantity,
                'reason' => 'Annulation retour produit #' . $productReturn->id,
                'user_id' => request()->user()?->id,
            ]);

            $productReturn->delete();
        });

        return response()->json(null, 204);
    }
}
