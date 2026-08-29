<?php

namespace App\Http\Controllers\Api\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\UserResource;

class UserController
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
        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);

        return response()->json(['user' => new UserResource($account->user)], 200);
    }

}
