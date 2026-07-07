<?php

namespace App\Http\Controllers;

use App\Http\Requests\EvaluationRequest;
use App\Models\Evaluation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $evaluations = Evaluation::with('employee')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($evaluations);
    }

    public function store(EvaluationRequest $request): JsonResponse
    {
        $evaluation = Evaluation::create($request->validated());

        return response()->json($evaluation->load('employee'), 201);
    }

    public function show(Evaluation $evaluation): JsonResponse
    {
        return response()->json($evaluation->load('employee'));
    }

    public function update(EvaluationRequest $request, Evaluation $evaluation): JsonResponse
    {
        $evaluation->update($request->validated());

        return response()->json($evaluation->fresh()->load('employee'));
    }

    public function destroy(Evaluation $evaluation): JsonResponse
    {
        $evaluation->delete();

        return response()->json(null, 204);
    }
}
