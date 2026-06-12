<?php

use App\Http\Controllers\AlarmController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InvitationController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TaskController;


Route::get('/test', function () {
    return response()->json([
        'status' => 'API dziala'
    ]);
});

Route::apiResource('tasks', TaskController::class);

// Zmienione na 'match', aby można było wejść metodą GET z poziomu przeglądarki na czas testów
Route::match(['get', 'post'], '/reports', [AlarmController::class, 'store']);

// Mechanika Logowania, Rejestracji oraz Generowania zaproszeń
Route::match(['get', 'post'], '/auth/login', [AuthController::class, 'login']);
Route::match(['get', 'post'], '/auth/register', [AuthController::class, 'register']);
Route::match(['get', 'post'], '/invitations/generate', [InvitationController::class, 'generate']);
