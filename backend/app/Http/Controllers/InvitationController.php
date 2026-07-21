<?php

namespace App\Http\Controllers\Auth;

use App\Models\Invitation;
use App\Mail\UserInvitationMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'unique:accounts,email'],
            'role_id' => ['required', 'exists:roles,id'],
            'firehouse_id' => ['required', 'exists:firehouse,id'],
        ], [
            'email.unique' => 'Konto z tym adresem e-mail jest już zarejestrowane w systemie.',
        ]);

        $invitation = Invitation::firstOrNew(['email' => $data['email']]);

        $invitation->role_id = $data['role_id'];
        $invitation->firehouse_id = $data['firehouse_id'];
        $invitation->token = Str::random(64);
        $invitation->expires_at = now()->addHours(48);
        $invitation->used_at = null;
        
        $invitation->save();

        Mail::to($invitation->email)->send(new UserInvitationMail($invitation));

        $message = $invitation->wasRecentlyCreated 
            ? 'Zaproszenie zostało pomyślnie wysłane.' 
            : 'Zaproszenie istniało w bazie. Token, czas wygaśnięcia oraz dane zostały zaktualizowane, a mail wysłany ponownie.';

        return response()->json([
            'message' => $message,
        ], $invitation->wasRecentlyCreated ? 201 : 200);
    }

    public function verify(string $token): JsonResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation || !$invitation->isValid()) {
            return response()->json([
                'message' => 'Token jest nieprawidłowy, został już użyty lub wygasł.'
            ], 410);
        }

        return response()->json([
            'email' => $invitation->email,
            'role_id' => $invitation->role_id,
            'firehouse_id' => $invitation->firehouse_id,
        ], 200);
    }

    public function destroy(Invitation $invitation): JsonResponse
    {
        $invitation->delete();

        return response()->json([
        'message' => 'Zaproszenie zostało pomyślnie anulowane.'
        ], 200);
    }  
}