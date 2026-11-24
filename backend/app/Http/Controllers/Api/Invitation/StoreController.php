<?php

namespace App\Http\Controllers\Api\Invitation;

use App\Http\Requests\Api\Invitation\StoreRequest;
use App\Http\Resources\InvitationResource;
use App\Mail\UserInvitationMail;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StoreController
{
    public function __invoke(StoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $inviter = $request->user()->user;

        $invitation = Invitation::firstOrNew(['email' => $data['email']]);

        if ($invitation->exists && $invitation->firehouse_id !== $inviter->firehouse_id) {
            return response()->json([
                'message' => 'Dla tego adresu e-mail istnieje już zaproszenie w innej jednostce OSP.',
            ], 403);
        }

        if ($invitation->exists && $invitation->used_at !== null) {
            return response()->json([
                'message' => 'To zaproszenie zostało już wykorzystane.',
            ], 422);
        }

        $invitation->role_id = $data['role_id'];
        $invitation->firehouse_id = $inviter->firehouse_id;
        $invitation->token = Str::random(64);
        $invitation->expires_at = now()->addHours(48);
        $invitation->used_at = null;

        $invitation->save();

        Mail::to($invitation->email)->send(new UserInvitationMail($invitation));

        $message = $invitation->wasRecentlyCreated
            ? __('invitation.created')
            : __('invitation.updated');

        return response()->json([
            'message' => $message,
            'data' => new InvitationResource($invitation),
        ], $invitation->wasRecentlyCreated ? 201 : 200);
    }
}
