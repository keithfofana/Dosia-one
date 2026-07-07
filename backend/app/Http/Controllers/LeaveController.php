<?php

namespace App\Http\Controllers;

use App\Http\Requests\LeaveRequest;
use App\Models\Leave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $leaves = Leave::with('employee')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($leaves);
    }

    public function store(LeaveRequest $request): JsonResponse
    {
        $leave = Leave::create([
            'status' => 'en_attente',
            ...$request->validated(),
        ]);

        return response()->json($leave->load('employee'), 201);
    }

    public function show(Leave $leave): JsonResponse
    {
        return response()->json($leave->load('employee'));
    }

    public function update(LeaveRequest $request, Leave $leave): JsonResponse
    {
        $leave->update($request->validated());

        return response()->json($leave->fresh()->load('employee'));
    }

    public function destroy(Leave $leave): JsonResponse
    {
        $leave->delete();

        return response()->json(null, 204);
    }
}
