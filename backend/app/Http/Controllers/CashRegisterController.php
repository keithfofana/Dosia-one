<?php

namespace App\Http\Controllers;

use App\Http\Requests\CashRegisterRequest;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashRegisterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $registers = CashRegister::latest()->paginate($request->integer('per_page', 20));

        return response()->json($registers);
    }

    public function store(CashRegisterRequest $request): JsonResponse
    {
        $register = CashRegister::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($register, 201);
    }

    public function show(CashRegister $cashRegister): JsonResponse
    {
        return response()->json($cashRegister->load('cashMovements'));
    }

    public function update(CashRegisterRequest $request, CashRegister $cashRegister): JsonResponse
    {
        $cashRegister->update($request->validated());

        return response()->json($cashRegister->fresh());
    }

    public function destroy(CashRegister $cashRegister): JsonResponse
    {
        if ((float) $cashRegister->balance !== 0.0 || $cashRegister->cashMovements()->exists()) {
            throw ValidationException::withMessages([
                'name' => ["Cette caisse « {$cashRegister->name} » a un solde non nul ou des mouvements enregistrés : elle ne peut pas être supprimée."],
            ]);
        }

        $cashRegister->delete();

        return response()->json(null, 204);
    }

    public function deposit(Request $request, CashRegister $cashRegister): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data, $cashRegister) {
            CashMovement::create([
                'cash_register_id' => $cashRegister->id,
                'type' => 'depot',
                'amount' => $data['amount'],
                'reason' => $data['reason'] ?? null,
            ]);

            $cashRegister->increment('balance', $data['amount']);
        });

        return response()->json($cashRegister->fresh()->load('cashMovements'));
    }

    public function withdraw(Request $request, CashRegister $cashRegister): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string'],
        ]);

        if ($data['amount'] > $cashRegister->balance) {
            throw ValidationException::withMessages([
                'amount' => ['Solde de caisse insuffisant.'],
            ]);
        }

        DB::transaction(function () use ($data, $cashRegister) {
            $movement = CashMovement::create([
                'cash_register_id' => $cashRegister->id,
                'type' => 'retrait',
                'amount' => $data['amount'],
                'reason' => $data['reason'] ?? null,
            ]);

            $cashRegister->decrement('balance', $data['amount']);

            app(AccountingService::class)->recordCashWithdrawal($movement->load('cashRegister'));
        });

        return response()->json($cashRegister->fresh()->load('cashMovements'));
    }
}
