<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChartOfAccountRequest;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
        $data = $request->validated();

        if (isset($data['type']) && $data['type'] !== $chartOfAccount->type && $chartOfAccount->journalEntryLines()->exists()) {
            throw ValidationException::withMessages([
                'type' => ["Ce compte « {$chartOfAccount->code} » est déjà utilisé dans des écritures comptables : son type ne peut plus être modifié."],
            ]);
        }

        $chartOfAccount->update($data);

        return response()->json($chartOfAccount->fresh());
    }

    public function destroy(ChartOfAccount $chartOfAccount): JsonResponse
    {
        if ($chartOfAccount->journalEntryLines()->exists()) {
            throw ValidationException::withMessages([
                'code' => ["Ce compte « {$chartOfAccount->code} » est déjà utilisé dans des écritures comptables : il ne peut pas être supprimé."],
            ]);
        }

        $chartOfAccount->delete();

        return response()->json(null, 204);
    }
}
