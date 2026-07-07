<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalaryRequest;
use App\Models\Salary;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $salaries = Salary::with('employee')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($salaries);
    }

    public function store(SalaryRequest $request): JsonResponse
    {
        $salary = Salary::create($request->validated());

        return response()->json($salary->load('employee'), 201);
    }

    public function show(Salary $salary): JsonResponse
    {
        return response()->json($salary->load('employee'));
    }

    public function update(SalaryRequest $request, Salary $salary): JsonResponse
    {
        $data = $request->validated();
        $wasPaid = $salary->status === 'paye';

        DB::transaction(function () use ($data, $salary, $wasPaid) {
            $salary->update($data);

            if (! $wasPaid && $salary->status === 'paye') {
                app(AccountingService::class)->recordSalaryPayment($salary->load('employee'));
            }
        });

        return response()->json($salary->fresh()->load('employee'));
    }

    public function destroy(Salary $salary): JsonResponse
    {
        $salary->delete();

        return response()->json(null, 204);
    }
}
