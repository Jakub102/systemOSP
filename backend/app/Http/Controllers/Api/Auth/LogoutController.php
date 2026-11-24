<?php

namespace App\Http\Controllers\Api\Auth;

use App\Models\FcmToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogoutController
{
    public function __invoke(Request $request): JsonResponse
    {
        $account = $request->user();
        $user = $account?->user;

        if ($user && is_string($request->input('fcm_token')) && $request->input('fcm_token') !== '') {
            FcmToken::where('user_id', $user->id)
                ->where('token', $request->input('fcm_token'))
                ->delete();
        }

        $account?->currentAccessToken()?->delete();

        return response()->json([
            'message' => __('auth.logout'),
        ], 200);
    }
}
