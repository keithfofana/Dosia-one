<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Models\ActivityLog;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $roles = Role::with('permissions')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($roles);
    }

    public function store(RoleRequest $request): JsonResponse
    {
        $data = $request->validated();

        $role = Role::create([
            'company_id' => $request->user()->company_id,
            'name' => $data['name'],
        ]);

        if (isset($data['permission_ids'])) {
            $role->permissions()->sync($data['permission_ids']);
        }

        ActivityLog::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'action' => 'create',
            'module' => 'parametres',
            'description' => "Création du rôle « {$role->name} »",
        ]);

        return response()->json($role->load('permissions'), 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json($role->load('permissions', 'users'));
    }

    public function update(RoleRequest $request, Role $role): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['name'])) {
            $role->update(['name' => $data['name']]);
        }

        if (isset($data['permission_ids'])) {
            $role->permissions()->sync($data['permission_ids']);
        }

        ActivityLog::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'action' => 'update',
            'module' => 'parametres',
            'description' => "Modification des permissions du rôle « {$role->name} »",
        ]);

        return response()->json($role->fresh()->load('permissions'));
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        $name = $role->name;
        $role->delete();

        ActivityLog::create([
            'company_id' => $request->user()->company_id,
            'user_id' => $request->user()->id,
            'action' => 'delete',
            'module' => 'parametres',
            'description' => "Suppression du rôle « {$name} »",
        ]);

        return response()->json(null, 204);
    }
}
