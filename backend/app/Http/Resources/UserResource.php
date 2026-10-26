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
            'firehouse' => $this->firehouse, 
            'roles' => $this->roles->pluck('display_name'),
            'full_name' => "{$this->first_name} {$this->last_name}",
        ];
    }
}