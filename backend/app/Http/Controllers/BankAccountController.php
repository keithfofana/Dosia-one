<?php

namespace App\Http\Controllers;

use App\Http\Requests\BankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BankAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = BankAccount::latest()->paginate($request->integer('per_page', 20));

        return response()->json($accounts);
    }

    public function store(BankAccountRequest $request): JsonResponse
    {
        $account = BankAccount::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($account, 201);
    }

    public function show(BankAccount $bankAccount): JsonResponse
    {
        return response()->json($bankAccount->load('bankTransactions'));
    }

    public function update(BankAccountRequest $request, BankAccount $bankAccount): JsonResponse
    {
        $bankAccount->update($request->validated());

        return response()->json($bankAccount->fresh());
    }

    public function destroy(BankAccount $bankAccount): JsonResponse
    {
        if ((float) $bankAccount->balance !== 0.0 || $bankAccount->bankTransactions()->exists()) {
            throw ValidationException::withMessages([
                'bank_name' => ["Ce compte « {$bankAccount->bank_name} » a un solde non nul ou des transactions enregistrées : il ne peut pas être supprimé."],
            ]);
        }

        $bankAccount->delete();

        return response()->json(null, 204);
    }
}
