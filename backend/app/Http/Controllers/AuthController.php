<?php

namespace App\Http\Controllers;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Bezpieczne logowanie do systemu OSP
     */
    public function login(Request $request): JsonResponse
    {
        // 1. Walidacja pól wejściowych
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // 2. Szukanie konta wraz z załadowaniem profilu użytkownika i jego ról
        $account = Account::where('email', $credentials['email'])
            ->with(['user.roles', 'user.firehouse'])
            ->first();

        // 3. Bezpieczna weryfikacja istnienia konta oraz hasła (odporna na timing attacks)
        if (!$account || !Hash::check($credentials['password'], $account->password)) {
            throw ValidationException::withMessages([
                'email' => ['Podane dane logowania są niepoprawne.'],
            ]);
        }

        // 4. Sprawdzenie, czy profil strażaka jest aktywny
        if (!$account->user || !$account->user->is_active) {
            return response()->json([
                'message' => 'Twoje konto jest nieaktywne. Skontaktuj się z administratorem.'
            ], 403);
        }

        // 5. Aktualizacja metadanych: data ostatniego logowania strażaka
        $account->user->update([
            'last_login' => now(),
        ]);

        // 6. Generowanie tokenu Sanctum (w nazwie tokenu możemy przekazać unikalny identyfikator)
        $token = $account->createToken('osp-api-token')->plainTextToken;

        // 7. Zwrócenie kompletnej odpowiedzi dla Reacta
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $account->user->id,
                'first_name' => $account->user->first_name,
                'last_name' => $account->user->last_name,
                'phone_number' => $account->user->phone_number,
                'firehouse' => $account->user->firehouse,
                'roles' => $account->user->roles->pluck('name'), // Tablica stringów np. ['admin', 'driver']
            ]
        ], 200);
    }

    /**
     * Wylogowanie i unieważnienie tokenu
     */
    public function logout(Request $request): JsonResponse
    {
        // Unieważniamy obecny token, z którego przyszło żądanie
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Pomyślnie wylogowano.'
        ], 200);
    }
}