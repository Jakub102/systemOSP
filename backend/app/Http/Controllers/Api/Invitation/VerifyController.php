<?php

namespace App\Http\Controllers\Api\Invitation;

use Illuminate\Http\Request;
use App\Models\Invitation;
use App\Http\Resources\InvitationResource;

class VerifyController
{
    public function __invoke(Request $request, string $token)
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation || !$invitation->isValid()) {
            return response()->json([
                'message' => __('invitation.invalid_or_expired')
            ], 410);
        }

        return new InvitationResource($invitation);
    }
}