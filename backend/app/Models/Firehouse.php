<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Firehouse extends Model
{
    use HasFactory;

    protected $table = 'firehouse';

    protected $fillable = [
        'name',
        'street',
        'address',
        'postal_code',
        'city',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /**
     * Get the users (firefighters) for the firehouse.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Oblicza odległość w linii prostej (w metrach) od remizy do podanych współrzędnych GPS (wzór Haversine).
     */
    public function distanceInMetersTo(float $latitude, float $longitude): float
    {
        $earthRadius = 6371000;

        $latFrom = deg2rad((float) $this->latitude);
        $lonFrom = deg2rad((float) $this->longitude);
        $latTo = deg2rad($latitude);
        $lonTo = deg2rad($longitude);

        $dLat = $latTo - $latFrom;
        $dLon = $lonTo - $lonFrom;

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos($latFrom) * cos($latTo)
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}