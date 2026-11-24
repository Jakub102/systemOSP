<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Invitation;

use App\Http\Resources\InvitationResource;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;

class VerifyController
{
    public function __invoke(string $token): InvitationResource|JsonResponse
    {
        $invitation = Invitation::with(['firehouse', 'role'])
            ->where('token', hash('sha256', $token))
            ->first();

        if (!$invitation || !$invitation->isValid()) {
            return response()->json([
                'message' => __('invitation.invalid_or_expired'),
            ], 410);
        }

        return new InvitationResource($invitation);
    }
}
