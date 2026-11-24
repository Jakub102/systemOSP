<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentFirefighterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => "{$this->first_name} {$this->last_name}",
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('display_name')->values(), []),
            'tracking' => $this->whenPivotLoaded('incident_user', fn () => [
                'attendance_status' => $this->pivot->attendance_status,
                'confirmed_latitude' => $this->pivot->confirmed_latitude,
                'confirmed_longitude' => $this->pivot->confirmed_longitude,
                'confirmed_at' => $this->pivot->confirmed_at?->toIso8601String(),
            ]),
        ];
    }
}
