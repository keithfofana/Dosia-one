<?php

namespace App\Http\Controllers;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    public function enable(Request $request): JsonResponse
    {
        $user = $request->user();
        $google2fa = app(Google2FA::class);
        $secret = $google2fa->generateSecretKey();

        $user->two_factor_secret = $secret;
        $user->two_factor_enabled = false;
        $user->save();

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email ?? $user->phone ?? $user->name,
            $secret
        );

        $renderer = new ImageRenderer(new RendererStyle(200), new SvgImageBackEnd);
        $svg = (new Writer($renderer))->writeString($qrCodeUrl);

        return response()->json([
            'secret' => $secret,
            'qr_code' => 'data:image/svg+xml;base64,'.base64_encode($svg),
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'code' => ["Aucune procédure d'activation du 2FA en cours. Recommence depuis le début."],
            ]);
        }

        if (! app(Google2FA::class)->verifyKey($user->two_factor_secret, $request->string('code')->toString())) {
            throw ValidationException::withMessages([
                'code' => ['Code invalide.'],
            ]);
        }

        $user->two_factor_enabled = true;
        $user->save();

        return response()->json(['two_factor_enabled' => true]);
    }

    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Mot de passe incorrect.'],
            ]);
        }

        $user->two_factor_secret = null;
        $user->two_factor_enabled = false;
        $user->save();

        return response()->json(['two_factor_enabled' => false]);
    }
}
