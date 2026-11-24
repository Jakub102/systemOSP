<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'firehouse' => $this->whenLoaded('firehouse', fn () => $this->firehouse?->name),
            'role' => $this->whenLoaded('role', fn () => $this->role?->display_name),
        ];
    }
}
