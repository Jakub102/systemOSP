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
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $account = Account::where('email', $credentials['email'])
            ->with(['user.roles', 'user.firehouse'])
            ->first();

        if (!$account || !Hash::check($credentials['password'], $account->password)) {
            throw ValidationException::withMessages([
                'email' => ['Podane dane logowania są niepoprawne.'],
            ]);
        }

        if (!$account->user || !$account->user->is_active) {
            return response()->json([
                'message' => 'Twoje konto jest nieaktywne. Skontaktuj się z administratorem.'
            ], 403);
        }

        $account->user->update([
            'last_login' => now(),
        ]);


        $token = $account->createToken('osp-api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $account->user->id,
                'first_name' => $account->user->first_name,
                'last_name' => $account->user->last_name,
                'phone_number' => $account->user->phone_number,
                'firehouse' => $account->user->firehouse,
                'roles' => $account->user->roles->pluck('name'),
            ]
        ], 200);
    }


    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Pomyślnie wylogowano.'
        ], 200);
    }
}