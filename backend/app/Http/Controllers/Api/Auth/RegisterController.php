<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\ReadinessStatus;
use App\Http\Requests\Api\Auth\RegisterRequest;
use App\Mail\UserRegisteredMail;
use App\Models\Account;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegisterController
{
    public function __invoke(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $tokenHash = hash('sha256', $data['token']);

        $user = DB::transaction(function () use ($data, $tokenHash): User {
            $invitation = Invitation::where('token', $tokenHash)
                ->lockForUpdate()
                ->first();

            if (!$invitation || !$invitation->isValid()) {
                throw ValidationException::withMessages(['token' => [__('auth.token')]]);
            }

            $email = Str::lower(trim($invitation->email));

            if (Account::where('email', $email)->exists()) {
                throw ValidationException::withMessages(['email' => [__('auth.email')]]);
            }

            $account = Account::create([
                'email' => $email,
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
                'readiness_status' => ReadinessStatus::ACTIVE->value,
            ]);

            $user->roles()->attach($invitation->role_id);
            $invitation->update(['used_at' => now()]);

            return $user->load('account');
        });

        rescue(
            fn () => Mail::to($user->account->email)->queue(new UserRegisteredMail($user->first_name)),
            fn (\Throwable $e) => Log::error('Błąd kolejkowania maila po rejestracji: '.$e->getMessage())
        );

        return response()->json(['message' => 'Konto zostało utworzone.'], 201);
    }
}
