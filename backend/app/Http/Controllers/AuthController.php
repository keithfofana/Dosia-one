<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Company;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data) {
            $company = Company::create([
                'name' => $data['company_name'],
                'currency_symbol' => $data['currency_symbol'] ?? 'FCFA',
            ]);

            $gerant = (new RoleSeeder)->createForCompany($company);
            (new ChartOfAccountSeeder)->createForCompany($company);

            return User::create([
                'company_id' => $company->id,
                'role_id' => $gerant->id,
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'is_active' => true,
            ]);
        });

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user->load(['company', 'role.permissions']),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->string('login')->toString();

        $user = User::withoutGlobalScopes()
            ->where(function ($query) use ($login) {
                $query->whereRaw('LOWER(email) = ?', [mb_strtolower($login)])
                    ->orWhere('phone', $login);
            })
            ->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Identifiants incorrects.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Ce compte a été désactivé.'],
            ]);
        }

        if ($user->two_factor_enabled) {
            $challenge = Str::uuid()->toString();

            Cache::put("2fa:challenge:{$challenge}", $user->id, now()->addMinutes(5));

            return response()->json([
                'two_factor_required' => true,
                'challenge' => $challenge,
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user->load(['company', 'role.permissions']),
            'token' => $token,
        ]);
    }

    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'challenge' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        $userId = Cache::get("2fa:challenge:{$request->string('challenge')}");

        if (! $userId) {
            throw ValidationException::withMessages([
                'challenge' => ['Challenge invalide ou expiré.'],
            ]);
        }

        $user = User::withoutGlobalScopes()->findOrFail($userId);

        if (! $user->two_factor_secret || ! app(Google2FA::class)->verifyKey($user->two_factor_secret, $request->string('code')->toString())) {
            throw ValidationException::withMessages([
                'code' => ['Code invalide.'],
            ]);
        }

        Cache::forget("2fa:challenge:{$request->string('challenge')}");
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user->load(['company', 'role.permissions']),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }
}
