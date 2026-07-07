<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('role')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($users);
    }

    public function store(UserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create([
            'company_id' => $request->user()->company_id,
            ...$data,
        ]);

        ActivityLog::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'action' => 'create',
            'module' => 'parametres',
            'description' => "Création de l'utilisateur « {$user->name} »",
        ]);

        return response()->json($user->load('role'), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('role'));
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $wasActive = $user->is_active;
        $user->update($data);

        $description = "Modification de l'utilisateur « {$user->name} »";
        if (array_key_exists('is_active', $data) && (bool) $data['is_active'] !== $wasActive) {
            $description = $data['is_active']
                ? "Réactivation de l'utilisateur « {$user->name} »"
                : "Désactivation de l'utilisateur « {$user->name} »";
        }

        ActivityLog::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'action' => 'update',
            'module' => 'parametres',
            'description' => $description,
        ]);

        return response()->json($user->fresh()->load('role'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $name = $user->name;
        $user->delete();

        ActivityLog::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'action' => 'delete',
            'module' => 'parametres',
            'description' => "Suppression de l'utilisateur « {$name} »",
        ]);

        return response()->json(null, 204);
    }
}
