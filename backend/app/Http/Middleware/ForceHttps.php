<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Redirige vers https:// uniquement en production (APP_ENV=production).
 * No-op en local/dev pour ne pas gener le travail en HTTP sur le reseau local.
 */
class ForceHttps
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->secure() && app()->environment('production')) {
            return redirect()->secure($request->getRequestUri(), 308);
        }

        return $next($request);
    }
}
