<?php

use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\ForceHttps;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'permission' => EnsurePermission::class,
        ]);
        // Railway (et la plupart des PaaS) terminent le HTTPS a leur proxy
        // et transmettent en HTTP en interne. Sans ceci, $request->secure()
        // ignore X-Forwarded-Proto et voit toujours du HTTP -> ForceHttps
        // redirige en boucle. '*' est sûr ici : le conteneur n'est joignable
        // que via ce proxy, jamais directement depuis internet.
        $middleware->trustProxies(at: '*');
        $middleware->append(ForceHttps::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
