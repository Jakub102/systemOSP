<?php

namespace App\Http\Controllers\Api\Incident;

use App\Http\Requests\Api\Incident\IncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Models\Firehouse;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;

class AlarmController
{
    public function __construct(protected FcmService $fcmService) {}

    public function __invoke(IncidentRequest $request, IncidentController $incidentController): IncidentResource
    {
        $incidentResource = $incidentController->store($request);
        $incident = $incidentResource->resource;

        $firehouseId = $request->user()?->user?->firehouse_id ?? Firehouse::value('id');

        // Pobieramy tylko aktywnych strażaków z danej remizy, którzy mają gotowość (readiness_status = 'active')
        // oraz pomijamy techniczne konto systemowe (rola 'system')
        $readyFirefighterIds = User::query()
            ->when($firehouseId, fn ($query) => $query->where('firehouse_id', $firehouseId))
            ->where('is_active', true)
            ->where('readiness_status', 'active')
            ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'system'))
            ->pluck('id');

        if ($readyFirefighterIds->isNotEmpty()) {
            $pivotData = $readyFirefighterIds->mapWithKeys(fn ($userId) => [
                $userId => [
                    'attendance_status' => 'pending',
                    'confirmed_latitude' => null,
                    'confirmed_longitude' => null,
                    'confirmed_at' => null,
                ],
            ])->all();

            $incident->users()->syncWithoutDetaching($pivotData);

            $fcmMessageId = $this->fcmService->sendIncidentAlert($incident);

            if (!$fcmMessageId) {
                Log::error("Kontroler odnotował brak ID powiadomienia FCM dla incydentu o ID: " . $incident->id);
            }
        } else {
            Log::warning("Brak strażaków w gotowości (readiness_status = active) dla incydentu o ID: " . $incident->id);
        }

        return new IncidentResource($incident->load(['users.roles', 'users.firehouse']));
    }
}
