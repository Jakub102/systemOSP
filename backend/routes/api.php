<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\UserController;
use App\Http\Controllers\Api\Device\DeviceTokenController;
use App\Http\Controllers\Api\Incident\AlarmController;
use App\Http\Controllers\Api\Invitation\CancellationController as CancelInvitationController;
use App\Http\Controllers\Api\Invitation\StoreController as StoreInvitationController;
use App\Http\Controllers\Api\Invitation\VerifyController as VerifyInvitationController;
use App\Http\Controllers\Api\Tracker\TrackerController;
use Illuminate\Support\Facades\Route;

Route::post('/login', LoginController::class)->middleware('throttle:login');
Route::post('/register', RegisterController::class)->middleware('throttle:5,1');
Route::get('/invitations/verify/{token}', VerifyInvitationController::class)
    ->middleware('throttle:invitations-verify');

Route::middleware(['auth:sanctum', 'active', 'throttle:api'])->group(function () {
    Route::post('/logout', LogoutController::class);
    Route::post('/auth/refresh', [UserController::class, 'refresh']);
    Route::get('/me', [UserController::class, 'me']);
    Route::patch('/me/readiness', [UserController::class, 'updateReadiness']);

    Route::post('/devices/register', [DeviceTokenController::class, 'register']);
    Route::delete('/devices/unregister', [DeviceTokenController::class, 'unregister']);

    Route::get('/incidents/my', [TrackerController::class, 'myIncidents']);
    Route::post('/incidents/{incident}/respond', [TrackerController::class, 'respond']);
    Route::patch('/incidents/{incident}/respond', [TrackerController::class, 'respond']);
});

Route::middleware(['auth:sanctum', 'active', 'throttle:tracking'])->group(function () {
    Route::post('/incidents/{incident}/track', [TrackerController::class, 'update']);
    Route::post('/incidents/{incident}/location', [TrackerController::class, 'update']);
    Route::patch('/incidents/{incident}/location', [TrackerController::class, 'update']);
});

Route::middleware([
    'auth:sanctum',
    'active',
    'throttle:5,1',
    'role:admin,president,vicepresident,chief,chiefassistent,quartermaster,treasurer',
])->group(function () {
    Route::post('/invitations', StoreInvitationController::class);
    Route::delete('/invitations/{invitation}', CancelInvitationController::class);
});

Route::middleware([
    'auth:sanctum',
    'active',
    'role:system',
])->group(function () {
    Route::post('/incident/new', AlarmController::class)->middleware('throttle:5,1');
    Route::get('/incidents/{incident}/location', [TrackerController::class, 'show'])
        ->middleware('throttle:system-polling');
});
