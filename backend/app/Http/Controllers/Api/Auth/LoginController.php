<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginController
{
    public function __invoke(LoginRequest $request): JsonResponse
    {
        $throttleKey = Str::lower($request->email).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => __('auth.throttle', ['seconds' => $seconds])
            ], 429);
        }

        $account = Account::where('email', $request->email)
            ->with(['user.roles', 'user.firehouse'])
            ->first();

        if (!$account || !Hash::check($request->password, $account->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')]
            ]);
        }

        if (!$account->user?->is_active) {
            return response()->json([
                'message' => __('auth.inactive')
            ], 403);
        }

        RateLimiter::clear($throttleKey);
        
        $account->user->update(['last_login' => now()]);
        
        $account->tokens()->where('name', $request->device_name)->delete();

        return response()->json([
            'token' => $account->createToken($request->device_name)->plainTextToken,
            'user' => new UserResource($account->user)
        ], 200);
    }
}