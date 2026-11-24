<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IncidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'external_id' => $this->external_id,
            'main_category' => $this->main_category,
            'sub_category' => $this->sub_category,
            'description' => $this->description,
            'incident_time' => $this->incident_time?->toIso8601String(),
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'status' => $this->status,
            'fcm_sent_count' => $this->fcm_sent_count ?? 0,
            'fcm_dispatched_at' => $this->fcm_dispatched_at?->toIso8601String(),
            'notified_users_count' => $this->whenLoaded('users', fn () => $this->users->count()),
            'users' => IncidentFirefighterResource::collection($this->whenLoaded('users')),
        ];
    }
}
