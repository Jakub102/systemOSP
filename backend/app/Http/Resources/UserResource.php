<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'phone_number' => $this->phone_number,
            'readiness_status' => $this->readiness_status,
            'firehouse' => $this->whenLoaded('firehouse', fn () => $this->firehouse ? [
                'id' => $this->firehouse->id,
                'name' => $this->firehouse->name,
                'street' => $this->firehouse->street,
                'address' => $this->firehouse->address,
                'postal_code' => $this->firehouse->postal_code,
                'city' => $this->firehouse->city,
                'latitude' => $this->firehouse->latitude,
                'longitude' => $this->firehouse->longitude,
            ] : null),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('display_name')->values(), []),
            'full_name' => "{$this->first_name} {$this->last_name}",
            'tracking' => $this->whenPivotLoaded('incident_user', fn () => [
                'attendance_status' => $this->pivot->attendance_status,
                'confirmed_latitude' => $this->pivot->confirmed_latitude,
                'confirmed_longitude' => $this->pivot->confirmed_longitude,
                'confirmed_at' => $this->pivot->confirmed_at?->toIso8601String(),
            ]),
        ];
    }
}
