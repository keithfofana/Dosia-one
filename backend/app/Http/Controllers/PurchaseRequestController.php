<?php

namespace App\Http\Controllers;

use App\Http\Requests\PurchaseRequestRequest;
use App\Models\PurchaseRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $requests = PurchaseRequest::with('product', 'requestedBy')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($requests);
    }

    public function store(PurchaseRequestRequest $request): JsonResponse
    {
        $purchaseRequest = PurchaseRequest::create([
            'company_id' => $request->user()->company_id,
            'product_id' => $request->validated('product_id'),
            'quantity' => $request->validated('quantity'),
            'status' => 'en_attente',
            'requested_by' => $request->user()->id,
        ]);

        return response()->json($purchaseRequest->load('product', 'requestedBy'), 201);
    }

    public function show(PurchaseRequest $purchaseRequest): JsonResponse
    {
        return response()->json($purchaseRequest->load('product', 'requestedBy'));
    }

    public function update(PurchaseRequestRequest $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $purchaseRequest->update($request->validated());

        return response()->json($purchaseRequest->fresh()->load('product', 'requestedBy'));
    }

    public function destroy(PurchaseRequest $purchaseRequest): JsonResponse
    {
        $purchaseRequest->delete();

        return response()->json(null, 204);
    }
}
