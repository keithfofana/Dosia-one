<?php

namespace App\Http\Controllers;

use App\Http\Requests\RawMaterialMovementRequest;
use App\Models\RawMaterial;
use App\Models\RawMaterialMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RawMaterialMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $movements = RawMaterialMovement::with('rawMaterial', 'user')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($movements);
    }

    public function store(RawMaterialMovementRequest $request): JsonResponse
    {
        $data = $request->validated();

        $movement = DB::transaction(function () use ($data, $request) {
            $movement = RawMaterialMovement::create([
                'company_id' => $request->user()->company_id,
                'raw_material_id' => $data['raw_material_id'],
                'type' => $data['type'],
                'quantity' => $data['quantity'],
                'reason' => $data['reason'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            $this->applyMovement($movement, 1);

            return $movement;
        });

        return response()->json($movement->load('rawMaterial', 'user'), 201);
    }

    public function show(RawMaterialMovement $rawMaterialMovement): JsonResponse
    {
        return response()->json($rawMaterialMovement->load('rawMaterial', 'user'));
    }

    public function update(RawMaterialMovementRequest $request, RawMaterialMovement $rawMaterialMovement): JsonResponse
    {
        $rawMaterialMovement->update($request->validated());

        return response()->json($rawMaterialMovement->fresh()->load('rawMaterial', 'user'));
    }

    public function destroy(RawMaterialMovement $rawMaterialMovement): JsonResponse
    {
        DB::transaction(function () use ($rawMaterialMovement) {
            $this->applyMovement($rawMaterialMovement, -1);
            $rawMaterialMovement->delete();
        });

        return response()->json(null, 204);
    }

    private function applyMovement(RawMaterialMovement $movement, int $direction): void
    {
        if ($movement->type === 'ajustement') {
            if ($direction === 1) {
                RawMaterial::whereKey($movement->raw_material_id)->update(['quantity' => $movement->quantity]);
            }

            return;
        }

        $delta = $movement->type === 'entree' ? $movement->quantity : -$movement->quantity;
        RawMaterial::whereKey($movement->raw_material_id)->increment('quantity', $delta * $direction);
    }
}
