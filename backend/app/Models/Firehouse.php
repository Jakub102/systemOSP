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
}