<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function updateLocale(Request $request): JsonResponse
    {
        $data = $request->validate([
            'locale' => ['required', 'string', 'in:fr,en,ar,sw'],
        ]);

        $user = $request->user();
        $user->update(['locale' => $data['locale']]);

        return response()->json($user->fresh());
    }
}
