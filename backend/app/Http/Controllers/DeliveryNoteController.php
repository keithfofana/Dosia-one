<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\GeneratesDocumentNumber;
use App\Http\Requests\DeliveryNoteRequest;
use App\Models\DeliveryNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryNoteController extends Controller
{
    use GeneratesDocumentNumber;

    public function index(Request $request): JsonResponse
    {
        $deliveryNotes = DeliveryNote::with('client', 'invoice')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($deliveryNotes);
    }

    public function store(DeliveryNoteRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $deliveryNote = DeliveryNote::create([
            'company_id' => $companyId,
            'client_id' => $data['client_id'],
            'invoice_id' => $data['invoice_id'] ?? null,
            'number' => $this->generateNumber(DeliveryNote::class, 'BL', $companyId),
            'status' => 'prepare',
        ]);

        return response()->json($deliveryNote->load('client', 'invoice'), 201);
    }

    public function show(DeliveryNote $deliveryNote): JsonResponse
    {
        return response()->json($deliveryNote->load('client', 'invoice'));
    }

    public function update(DeliveryNoteRequest $request, DeliveryNote $deliveryNote): JsonResponse
    {
        $deliveryNote->update($request->validated());

        return response()->json($deliveryNote->fresh()->load('client', 'invoice'));
    }

    public function destroy(DeliveryNote $deliveryNote): JsonResponse
    {
        $deliveryNote->delete();

        return response()->json(null, 204);
    }
}
