<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class IncidentUser extends Pivot
{
    protected $table = 'incident_user';

    public $incrementing = true;

    protected $fillable = [
        'incident_id',
        'user_id',
        'attendance_status',
        'confirmed_latitude',
        'confirmed_longitude',
        'confirmed_at',
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
    ];
}