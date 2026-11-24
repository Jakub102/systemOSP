<?php

namespace App\Http\Controllers\Api\Incident;

use App\Http\Controllers\Api\Tracker\TrackerController;
use App\Http\Requests\Api\Incident\UpdateLocationRequest;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;

class AlarmTrackingController
{
    public function __invoke(
        UpdateLocationRequest $request,
        Incident $incident,
        TrackerController $trackerController
    ): JsonResponse {
        return $trackerController->update($request, $incident);
    }
}
