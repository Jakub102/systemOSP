<?php
//TODO: Do usunięcia 
use App\Http\Controllers\InvitationController;

//TODO: Te poniżej są przebudowane
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\UserController;
use App\Http\Controllers\Api\V1\Invitation\StoreController as StoreInvitationController;

Route::prefix('v1')->group(function(){

    Route::post('/login', LoginController::class)->middleware('throttle:5,1');
    Route::post('/register', RegisterController::class)->middleware('throttle:5,1');

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
        // Route::delete('/invitations/{invitation}', DestroyInvitationController::class);
    });
    });


// Trasy zabezpieczone (tylko dla zalogowanego admina)
// Route::middleware(['auth:sanctum', 'throttle:5,1'])->group(function () {
//     Route::post('/invitations', [InvitationController::class, 'store']);
//     Route::delete('/invitations/{invitation}', [InvitationController::class, 'destroy']);
// });


// Trasa publiczna (wywoływana przez formularz rejestracyjny na froncie)
Route::get('/invitations/verify/{token}', [InvitationController::class, 'verify']);
