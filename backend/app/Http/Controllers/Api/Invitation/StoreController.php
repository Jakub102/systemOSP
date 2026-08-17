<?php

namespace App\Http\Controllers\Api\Invitation;


use App\Http\Requests\Api\Invitation\StoreRequest; // Użyj swojego requestu
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Models\Invitation;
use App\Mail\UserInvitationMail;
use App\Http\Resources\InvitationResource;

class StoreController
{
    // Zmień typ argumentu na StoreInvitationRequest
    public function __invoke(StoreRequest $request)
    {
        // Teraz ta linia zadziała poprawnie, bo StoreInvitationRequest dziedziczy z FormRequest
        $data = $request->validated(); 

        $invitation = Invitation::firstOrNew(['email' => $data['email']]);

        $invitation->role_id = $data['role_id'];
        $invitation->firehouse_id = $data['firehouse_id'];
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