<?php

//TODO: Te poniżej są przebudowane
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\UserController;
use App\Http\Controllers\Api\Invitation\StoreController as StoreInvitationController;
use App\Http\Controllers\Api\Invitation\VerifyController as VerifyInvitationController;
use App\Http\Controllers\Api\Invitation\CancellationController as CancelInvitationController;

Route::prefix('v1')->group(function(){

    Route::post('/login', LoginController::class)->middleware('throttle:5,1');
    Route::post('/register', RegisterController::class)->middleware('throttle:5,1');
    Route::get('/invitations/verify/{token}', VerifyInvitationController::class);

    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
            Route::post('/logout', LogoutController::class);
            Route::post('/auth/refresh', [UserController::class, 'refresh']);
            Route::get('/me', [UserController::class, 'me']);
        });

    Route::middleware([
        'auth:sanctum', 
        'throttle:5,1', 
        'role:admin,president,vicepresident,chief,chiefassistent,quartermaster,treasurer'
    ])->group(function () {
        Route::post('/invitations', StoreInvitationController::class);
        Route::delete('/invitations/{invitation}', CancelInvitationController::class);
    });

    Route::middleware([
        'auth:sanctum', 
        'throttle:5,1', 
        'role:system'
    ])->group(function () {
        Route::post('/incident/new', AlarmController::class);
    });

    });

