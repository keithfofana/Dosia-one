<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        $tokens = $request->user()->tokens()->latest()->get()->map(fn ($token) => [
            'id' => $token->id,
            'name' => $token->name,
            'last_used_at' => $token->last_used_at,
            'created_at' => $token->created_at,
            'is_current' => $token->id === $currentTokenId,
        ]);

        return response()->json($tokens);
    }

    public function destroy(Request $request, int $token): JsonResponse
    {
        $deleted = $request->user()->tokens()->where('id', $token)->delete();

        if (! $deleted) {
            abort(404);
        }

        return response()->json(null, 204);
    }
}
