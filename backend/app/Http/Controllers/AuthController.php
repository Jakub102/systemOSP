<?php

namespace App\Http\Controllers\Auth;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\{Hash, Log, RateLimiter};
use Illuminate\Validation\ValidationException;

class AuthController
{
    public function refresh(Request $request): JsonResponse
    {
        $account = $request->user();
        $account->currentAccessToken()?->delete();
        $newToken = $account->createToken('osp-api-token')->plainTextToken;
        $account->user?->update(['last_login' => now()]);

        return response()->json([
            'token' => $newToken,
            'user' => new UserResource($account->loadMissing(['user.roles', 'user.firehouse'])->user)
        ], 200);
    }

    public function me(Request $request): JsonResponse
    {
        // loadMissing nie wykona zapytania, jeśli relacje są już załadowane
        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);

        return response()->json(['user' => new UserResource($account->user)], 200);
    }

}