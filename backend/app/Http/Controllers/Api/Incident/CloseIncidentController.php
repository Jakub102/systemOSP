<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Incident;

use App\Enums\IncidentStatus;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;

class CloseIncidentController
{
    public function __invoke(Incident $incident): IncidentResource|JsonResponse
    {
        if ($incident->status === IncidentStatus::END->value) {
            return response()->json([
                'message' => 'Zdarzenie zostało już zakończone.',
            ], 409);
        }

        $incident->update([
            'status' => IncidentStatus::END->value,
        ]);

        return new IncidentResource($incident->refresh()->load(['users.roles', 'users.firehouse']));
    }
}
