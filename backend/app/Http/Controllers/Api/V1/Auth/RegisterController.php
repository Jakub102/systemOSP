<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\{Hash, DB};
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Models\{Account, User, Invitation};
use App\Mail\UserRegisteredMail;

class RegisterController
{
    public function __invoke(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $invitation = Invitation::where('token', $data['token'])->first();

        if (!$invitation || !$invitation->isValid()) {
            throw ValidationException::withMessages(['token' =>  [__('auth.token')]]);
        }

        if (Account::where('email', $invitation->email)->exists()) {
            throw ValidationException::withMessages(['email' =>  [__('auth.email')]]);
        }

        $user = null;

        DB::transaction(function () use ($data, $invitation, &$user) {
            $account = Account::create([
                'email' => $invitation->email,
                'password' => Hash::make($data['password']),
            ]);

            $user = User::create([
                'account_id' => $account->id,
                'invitation_id' => $invitation->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone_number' => $data['phone_number'],
                'firehouse_id' => $invitation->firehouse_id,
                'is_active' => true,
                'status' => 'READY',
            ]);

            $user->roles()->attach($invitation->role_id);
            $invitation->update(['used_at' => now()]);
        });

        if ($user) {
            Mail::to($user->account->email)->send(new UserRegisteredMail($user->first_name));
        }

        return response()->json(['message' => 'Konto zostało utworzone.'], 201);
    }
}

