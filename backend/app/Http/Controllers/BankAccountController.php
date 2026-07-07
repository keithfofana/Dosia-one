<?php

namespace App\Http\Controllers;

use App\Http\Requests\BankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $bankAccount->delete();

        return response()->json(null, 204);
    }
}
