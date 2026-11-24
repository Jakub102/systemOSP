<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $account = $request->user();
        $user = $account?->user;

        if (!$user || !$user->is_active) {
            $account?->currentAccessToken()?->delete();

            return response()->json([
                'message' => __('auth.inactive'),
            ], 403);
        }

        return $next($request);
    }
}
