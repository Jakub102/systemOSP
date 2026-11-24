<?php

namespace App\Http\Controllers\Api\Invitation;

use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CancellationController
{
    public function __invoke(Request $request, Invitation $invitation): JsonResponse
    {
        $user = $request->user()?->user;

        if (!$user || $invitation->firehouse_id !== $user->firehouse_id) {
            return response()->json([
                'message' => __('auth.permission'),
            ], 403);
        }

        if ($invitation->isUsed()) {
            return response()->json([
                'message' => 'Nie można anulować zaproszenia, które zostało już wykorzystane.',
            ], 422);
        }

        $invitation->delete();

        return response()->json([
            'message' => __('invitation.cancelled'),
        ], 200);
    }
}
