<?php

namespace App\Http\Controllers\Api\Device;

use App\Http\Requests\Api\Device\RegisterDeviceTokenRequest;
use App\Models\FcmToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController
{
    /**
     * Rejestruje lub aktualizuje token FCM urządzenia dla zalogowanego strażaka.
     * Jeśli token był wcześniej przypisany do innego konta (np. współdzielony telefon),
     * zostaje bezpiecznie przepięty na aktualnie zalogowanego użytkownika.
     */
    public function register(RegisterDeviceTokenRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user()->user;

        $fcmToken = FcmToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $user->id,
                'platform' => $validated['platform'] ?? 'android',
                'device_name' => $validated['device_name'] ?? $request->user()->currentAccessToken()?->name,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Token urządzenia został zarejestrowany.',
            'data' => [
                'id' => $fcmToken->id,
                'platform' => $fcmToken->platform,
                'last_used_at' => $fcmToken->last_used_at?->toIso8601String(),
            ],
        ], 200);
    }

    /**
     * Usuwa token FCM dla bieżącego użytkownika (np. przy wylogowaniu).
     */
    public function unregister(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:512'],
        ]);

        $user = $request->user()->user;

        FcmToken::where('user_id', $user->id)
            ->where('token', $validated['token'])
            ->delete();

        return response()->json([
            'message' => 'Token urządzenia został usunięty.',
        ], 200);
    }
}
