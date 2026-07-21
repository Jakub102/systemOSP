<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $account = $request->user();

        if (!$account || !$account->user || !$account->user->roles()->whereIn('name', $roles)->exists()) {
            return response()->json([
                'message' => __('auth.permission')
            ], 403);
        }

        return $next($request);
    }
}