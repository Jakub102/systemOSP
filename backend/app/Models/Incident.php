<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'external_id',
        'main_category',
        'sub_category',
        'description',
        'incident_time',
        'address',
        'latitude',
        'longitude',
        'status',
        'raw_payload',
    ];

    protected $casts = [
        'incident_time' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'raw_payload' => 'array',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(IncidentUser::class)
            ->withPivot([
                'attendance_status',
                'confirmed_latitude',
                'confirmed_longitude',
                'confirmed_at'
            ])
            ->withTimestamps();
    }
}