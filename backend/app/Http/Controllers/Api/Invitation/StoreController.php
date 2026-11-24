<?php

namespace App\Http\Controllers\Api\Invitation;

use App\Http\Requests\Api\Invitation\StoreRequest;
use App\Http\Resources\InvitationResource;
use App\Mail\UserInvitationMail;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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

        if ($invitation->exists && $invitation->isUsed()) {
            return response()->json([
                'message' => 'To zaproszenie zostało już wykorzystane.',
            ], 422);
        }

        // Token CSPRNG (256 bitów) wysyłamy tylko w mailu; w bazie przechowujemy wyłącznie hash SHA-256.
        $plainToken = bin2hex(random_bytes(32));

        $invitation->role_id = $data['role_id'];
        $invitation->firehouse_id = $inviter->firehouse_id;
        $invitation->token = hash('sha256', $plainToken);
        $invitation->expires_at = now()->addHours(48);
        $invitation->used_at = null;

        $invitation->save();

        $invitation->loadMissing(['firehouse', 'role']);

        rescue(
            fn () => Mail::to($invitation->email)->queue(new UserInvitationMail($invitation, $plainToken)),
            fn (\Throwable $e) => Log::error('Błąd kolejkowania maila z zaproszeniem: '.$e->getMessage())
        );

        $message = $invitation->wasRecentlyCreated
            ? __('invitation.created')
            : __('invitation.updated');

        return response()->json([
            'message' => $message,
            'data' => new InvitationResource($invitation),
        ], $invitation->wasRecentlyCreated ? 201 : 200);
    }
}
