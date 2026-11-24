<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Requests\Api\Auth\UpdateReadinessRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController
{
    public function refresh(Request $request): JsonResponse
    {
        $account = $request->user();
        $deviceName = $account->currentAccessToken()?->name ?? 'osp-api-token';

        $newToken = DB::transaction(function () use ($account, $deviceName): string {
            $account->currentAccessToken()?->delete();
            $token = $account->createToken($deviceName)->plainTextToken;
            $account->user?->update(['last_login' => now()]);

            return $token;
        });

        return response()->json([
            'token' => $newToken,
            'user' => new UserResource($account->loadMissing(['user.roles', 'user.firehouse'])->user),
        ], 200);
    }

    public function me(Request $request): JsonResponse
    {
        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);

        return response()->json(['user' => new UserResource($account->user)], 200);
    }

    public function updateReadiness(UpdateReadinessRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);
        $user = $account->user;

        if (!$user) {
            return response()->json([
                'message' => 'Nie znaleziono profilu strażaka przypisanego do konta.',
            ], 404);
        }

        $user->update([
            'readiness_status' => $validated['readiness_status'],
        ]);

        return response()->json([
            'message' => 'Zaktualizowano status gotowości.',
            'user' => new UserResource($user),
        ], 200);
    }
}
