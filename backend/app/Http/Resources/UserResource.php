<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Przekształca zasób w tablicę JSON.
     *
     * @param  Request  $request
     */
    public function toArray(Request $request): array
    {
        // $this odnosi się bezpośrednio do instancji modelu User przekazanego w kontrolerze
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'phone_number' => $this->phone_number,
            
            // Bezpieczne ładowanie relacji firehouse (remizy)
            'firehouse' => $this->firehouse, 
            
            // Mapowanie roli do prostej tablicy stringów (np. ["Sprawdź", "Dowódca"])
            'roles' => $this->roles->pluck('display_name'),
            
            // Przykład rozbudowy: możesz tu dynamicznie dorzucać pola
            'full_name' => "{$this->first_name} {$this->last_name}",
        ];
    }
}