<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Incident;

use App\Enums\AttendanceStatus;
use App\Enums\IncidentStatus;
use App\Enums\ReadinessStatus;
use App\Http\Requests\Api\Incident\IncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Jobs\SendIncidentAlertJob;
use App\Models\Firehouse;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AlarmController
{
    public function __invoke(IncidentRequest $request): IncidentResource
    {
        $validated = $request->validated();
        $validated['status'] = IncidentStatus::ACTIVE->value;

        $firehouseId = $request->user()?->user?->firehouse_id ?? Firehouse::value('id');

        [$incident, $hasReadyFirefighters] = DB::transaction(function () use ($validated, $firehouseId) {
            $incident = Incident::create($validated);

            $readyFirefighterIds = User::query()
                ->when($firehouseId, fn ($query) => $query->where('firehouse_id', $firehouseId))
                ->where('is_active', true)
                ->where('readiness_status', ReadinessStatus::ACTIVE->value)
                ->whereDoesntHave('roles', fn ($query) => $query->where('name', 'system'))
                ->pluck('id');

            if ($readyFirefighterIds->isNotEmpty()) {
                $pivotData = $readyFirefighterIds->mapWithKeys(fn ($userId) => [
                    $userId => [
                        'attendance_status' => AttendanceStatus::PENDING->value,
                        'confirmed_latitude' => null,
                        'confirmed_longitude' => null,
                        'confirmed_at' => null,
                    ],
                ])->all();

                $incident->users()->syncWithoutDetaching($pivotData);
            }

            return [$incident, $readyFirefighterIds->isNotEmpty()];
        });

        if ($hasReadyFirefighters) {
            SendIncidentAlertJob::dispatch($incident->id, $firehouseId)->afterCommit();
        } else {
            Log::warning('Brak strażaków w gotowości (readiness_status = active) dla incydentu.', [
                'incident_id' => $incident->id,
            ]);
        }

        $incident->refresh()->load('users.roles');

        return new IncidentResource($incident);
    }
}
