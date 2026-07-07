<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChartOfAccountRequest;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartOfAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = ChartOfAccount::orderBy('code')->paginate($request->integer('per_page', 50));

        return response()->json($accounts);
    }

    public function store(ChartOfAccountRequest $request): JsonResponse
    {
        $account = ChartOfAccount::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($account, 201);
    }

    public function show(ChartOfAccount $chartOfAccount): JsonResponse
    {
        return response()->json($chartOfAccount);
    }

    public function update(ChartOfAccountRequest $request, ChartOfAccount $chartOfAccount): JsonResponse
    {
        $chartOfAccount->update($request->validated());

        return response()->json($chartOfAccount->fresh());
    }

    public function destroy(ChartOfAccount $chartOfAccount): JsonResponse
    {
        $chartOfAccount->delete();

        return response()->json(null, 204);
    }
}
