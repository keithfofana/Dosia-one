<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::latest()->paginate($request->integer('per_page', 20));

        return response()->json($suppliers);
    }

    public function store(SupplierRequest $request): JsonResponse
    {
        $supplier = Supplier::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier->load('purchaseOrders'));
    }

    public function update(SupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $supplier->update($request->validated());

        return response()->json($supplier->fresh());
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();

        return response()->json(null, 204);
    }
}
