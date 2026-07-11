<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Definicja limitera 'api'
        RateLimiter::for('api', function (Request $request) {
            // Użytkownik może wykonać 60 zapytań na minutę.
            // Limit jest przypisany do ID użytkownika (jeśli jest zalogowany) 
            // lub do jego adresu IP (dla gości).
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}