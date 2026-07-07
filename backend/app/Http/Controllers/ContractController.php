<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContractRequest;
use App\Models\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $contracts = Contract::with('employee')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($contracts);
    }

    public function store(ContractRequest $request): JsonResponse
    {
        $contract = Contract::create($request->validated());

        return response()->json($contract->load('employee'), 201);
    }

    public function show(Contract $contract): JsonResponse
    {
        return response()->json($contract->load('employee'));
    }

    public function update(ContractRequest $request, Contract $contract): JsonResponse
    {
        $contract->update($request->validated());

        return response()->json($contract->fresh()->load('employee'));
    }

    public function destroy(Contract $contract): JsonResponse
    {
        $contract->delete();

        return response()->json(null, 204);
    }
}
