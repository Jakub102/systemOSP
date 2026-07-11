<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\{Hash, Log, RateLimiter};
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $throttleKey = Str::lower($request->email).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json(['message' => 'Zbyt wiele prób logowania.'], 429);
        }

        $account = Account::where('email', $request->email)
            ->with(['user.roles', 'user.firehouse'])
            ->first();

        if (!$account || !Hash::check($request->password, $account->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages(['email' => ['Nieprawidłowe dane logowania.']]);
        }

        if (!$account->user?->is_active) {
            return response()->json(['message' => 'Konto nieaktywne.'], 403);
        }

        RateLimiter::clear($throttleKey);
        $account->user->update(['last_login' => now()]);
        $account->tokens()->where('name', $request->device_name)->delete();

        return response()->json([
            'token' => $account->createToken('osp-api-token')->plainTextToken,
            'user' => new UserResource($account->user)
        ], 200);
    }

    public function refresh(Request $request): JsonResponse
    {
        $account = $request->user();
        $account->currentAccessToken()?->delete();
        $newToken = $account->createToken('osp-api-token')->plainTextToken;
        $account->user?->update(['last_login' => now()]);

        return response()->json([
            'token' => $newToken,
            'user' => new UserResource($account->loadMissing(['user.roles', 'user.firehouse'])->user)
        ], 200);
    }

    public function me(Request $request): JsonResponse
    {
        // loadMissing nie wykona zapytania, jeśli relacje są już załadowane
        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);

        return response()->json(['user' => new UserResource($account->user)], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Pomyślnie wylogowano.'], 200);
    }
}