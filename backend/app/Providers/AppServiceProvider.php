<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Ogólny limiter API
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Ochrona przed burstem na /login per IP (wspólne Wi-Fi remizy pozwala na wiele kont,
        // a per-account lockout 5 prób/min pilnuje LoginController po email|ip)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Ochrona przed zgadywaniem tokenów zaproszeń
        RateLimiter::for('invitations-verify', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Wyższy limit dla trackingu GPS z aplikacji mobilnej podczas alarmu
        RateLimiter::for('tracking', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Wysoki limit dla ekranów / stacji systemowej odpytujących mapę dojazdu co 1-2s
        RateLimiter::for('system-polling', function (Request $request) {
            return Limit::perMinute(180)->by($request->user()?->id ?: $request->ip());
        });
    }
}
