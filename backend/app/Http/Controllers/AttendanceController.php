<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttendanceRequest;
use App\Models\Attendance;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $attendances = Attendance::with('employee')->latest('date')->paginate($request->integer('per_page', 20));

        return response()->json($attendances);
    }

    public function store(AttendanceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['is_late'] = $this->computeIsLate($data['employee_id'], $data['check_in'] ?? null);

        $attendance = Attendance::create($data);

        return response()->json($attendance->load('employee'), 201);
    }

    public function show(Attendance $attendance): JsonResponse
    {
        return response()->json($attendance->load('employee'));
    }

    public function update(AttendanceRequest $request, Attendance $attendance): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('check_in', $data)) {
            $employeeId = $data['employee_id'] ?? $attendance->employee_id;
            $data['is_late'] = $this->computeIsLate($employeeId, $data['check_in']);
        }

        $attendance->update($data);

        return response()->json($attendance->fresh()->load('employee'));
    }

    public function destroy(Attendance $attendance): JsonResponse
    {
        $attendance->delete();

        return response()->json(null, 204);
    }

    private function computeIsLate(int $employeeId, ?string $checkIn): bool
    {
        if (! $checkIn) {
            return false;
        }

        $employee = Employee::withoutGlobalScopes()->with('company')->find($employeeId);
        $threshold = $employee?->company?->late_threshold ?? '09:00:00';

        return Carbon::createFromFormat('H:i', $checkIn)->gt(Carbon::createFromFormat('H:i:s', $threshold));
    }
}
