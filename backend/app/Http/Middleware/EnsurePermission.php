<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $slug): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || ! $user->role->permissions()->where('slug', $slug)->exists()) {
            abort(403, "Vous n'avez pas la permission requise ({$slug}) pour accéder à cette ressource.");
        }

        return $next($request);
    }
}
