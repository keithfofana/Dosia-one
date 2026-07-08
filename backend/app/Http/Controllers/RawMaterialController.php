<?php

namespace App\Http\Controllers;

use App\Http\Requests\RawMaterialRequest;
use App\Models\RawMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RawMaterialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $materials = RawMaterial::latest()->paginate($request->integer('per_page', 20));

        return response()->json($materials);
    }

    public function store(RawMaterialRequest $request): JsonResponse
    {
        $material = RawMaterial::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($material, 201);
    }

    public function show(RawMaterial $rawMaterial): JsonResponse
    {
        return response()->json($rawMaterial);
    }

    public function update(RawMaterialRequest $request, RawMaterial $rawMaterial): JsonResponse
    {
        $rawMaterial->update($request->validated());

        return response()->json($rawMaterial->fresh());
    }

    public function destroy(RawMaterial $rawMaterial): JsonResponse
    {
        if ($rawMaterial->billOfMaterials()->exists()) {
            throw ValidationException::withMessages([
                'name' => ["Cette matière première « {$rawMaterial->name} » est déjà utilisée dans une nomenclature ou un ordre de fabrication : elle ne peut pas être supprimée."],
            ]);
        }

        $rawMaterial->delete();

        return response()->json(null, 204);
    }
}
