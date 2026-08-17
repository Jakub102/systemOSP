<?php

namespace App\Http\Controllers\Api\Invitation;

use App\Models\Invitation;
use Illuminate\Http\JsonResponse;

class CancellationController
{
    public function __invoke(Invitation $invitation): JsonResponse
    {
        $invitation->delete();

        return response()->json([
            'message' => __('invitation.cancelled')
        ], 200);
    }
}