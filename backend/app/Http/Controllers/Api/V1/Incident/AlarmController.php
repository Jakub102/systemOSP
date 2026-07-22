<?php

namespace App\Http\Controllers\Api\V1\Incident;

use App\Http\Requests\Api\V1\Incident\IncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;

class AlarmController
{
    public function __construct(protected FcmService $fcmService) {}

    public function __invoke(IncidentRequest $request, IncidentController $incidentController): IncidentResource
    {
        $incidentResource = $incidentController->store($request);
        
        $incident = $incidentResource->resource;

        $fcmMessageId = $this->fcmService->sendIncidentAlert($incident);

        if ($fcmMessageId) {
            Log::info("Powiadomienie wysłane do FCM. ID: " . $fcmMessageId);
        } else {
            Log::error("Błąd wysyłki powiadomienia dla incydentu o ID: " . $incident->id);
        }

        return new IncidentResource($incident->load('users'));
    }
}