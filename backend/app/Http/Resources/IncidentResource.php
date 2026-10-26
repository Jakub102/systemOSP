<?php

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
            'raw_payload' => $this->raw_payload,
            'users' => UserResource::collection($this->whenLoaded('users')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}