<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeRequest;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $employees = Employee::latest()->paginate($request->integer('per_page', 20));

        return response()->json($employees);
    }

    public function store(EmployeeRequest $request): JsonResponse
    {
        $employee = Employee::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($employee, 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        $employee->load('salaries', 'attendances', 'leaves', 'contracts', 'evaluations', 'company');

        $data = $employee->toArray();
        $data['leave_balance'] = $this->computeLeaveBalance($employee);

        return response()->json($data);
    }

    private function computeLeaveBalance(Employee $employee): int
    {
        $annualDays = $employee->company->annual_leave_days ?? 24;

        $takenDays = $employee->leaves()
            ->where('status', 'approuve')
            ->whereYear('start_date', now()->year)
            ->get()
            ->sum(fn ($leave) => Carbon::parse($leave->start_date)->diffInDays(Carbon::parse($leave->end_date)) + 1);

        return $annualDays - $takenDays;
    }

    public function update(EmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee->update($request->validated());

        return response()->json($employee->fresh());
    }

    public function destroy(Employee $employee): JsonResponse
    {
        // Attendances/leaves/contracts/evaluations sont supprimes en cascade
        // (donnees secondaires) mais un salaire deja paye a genere une
        // ecriture comptable : on ne le laisse pas partir silencieusement.
        if ($employee->salaries()->where('status', 'paye')->exists()) {
            throw ValidationException::withMessages([
                'name' => ["Cet employé « {$employee->name} » a déjà des salaires payés (écritures comptables générées) : il ne peut pas être supprimé."],
            ]);
        }

        $employee->delete();

        return response()->json(null, 204);
    }
}
