<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Publiczna trasa logowania
Route::post('/login', [AuthController::class, 'login']);

// Trasy chronione tokenem
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Zwraca aktualnie zalogowanego użytkownika (przydatne przy odświeżeniu strony w React)
    Route::get('/me', function (Request $request) {
        $account = $request->user()->load(['user.roles', 'user.firehouse']);
        return response()->json([
            'user' => [
                'id' => $account->user->id,
                'first_name' => $account->user->first_name,
                'last_name' => $account->user->last_name,
                'roles' => $account->user->roles->pluck('name'),
            ]
        ]);
    });
});