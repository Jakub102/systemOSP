<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\{Account, User, Invitation};
use App\Mail\UserRegisteredMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\{Hash, DB};
use Illuminate\Validation\ValidationException;

class RegisterController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $invitation = Invitation::where('token', $data['token'])->first();

    // 1. Sprawdzenie zaproszenia
        if (!$invitation || !$invitation->isValid()) {
            throw ValidationException::withMessages(['token' => ['Zaproszenie nieprawidłowe.']]);
        }

    // 2. Sprawdzenie unikalności e-maila
        if (Account::where('email', $invitation->email)->exists()) {
            throw ValidationException::withMessages(['email' => ['Konto dla tego e-maila już istnieje.']]);
        }

    // Używamy zmiennej pomocniczej do przechwycenia użytkownika
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

    // 3. Wysyłka maila po udanej transakcji
        if ($user) {
            Mail::to($user->account->email)->send(new UserRegisteredMail($user->first_name));
        }

        return response()->json(['message' => 'Konto zostało utworzone.'], 201);
    }
}