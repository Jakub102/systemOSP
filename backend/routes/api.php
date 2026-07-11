<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InvitationController;
use Illuminate\Support\Facades\Route;

// W routes/api.php
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1'); // max 5 prób na minutę

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});


// Trasy zabezpieczone (tylko dla zalogowanego admina)
Route::middleware(['auth:sanctum', 'throttle:5,1'])->group(function () {
    Route::post('/invitations', [InvitationController::class, 'store']);
    Route::delete('/invitations/{invitation}', [InvitationController::class, 'destroy']);
});


// Trasa publiczna (wywoływana przez formularz rejestracyjny na froncie)
Route::get('/invitations/verify/{token}', [InvitationController::class, 'verify']);

Route::post('/register', [App\Http\Controllers\RegisterController::class, 'register']);