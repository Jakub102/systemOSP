<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'account_id',
        'invitation_id',
        'first_name',
        'last_name',
        'phone_number',
        'is_active',
        'status',
        'last_login',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function incidents(): BelongsToMany
    {
        return $this->belongsToMany(Incident::class)
            ->using(IncidentUser::class)
            ->withPivot([
                'attendance_status',
                'confirmed_latitude',
                'confirmed_longitude',
                'confirmed_at'
            ])
            ->withTimestamps();
    }

    /**
     * Get the firehouse that the user belongs to.
     */
    public function firehouse(): BelongsTo
    {
        return $this->belongsTo(Firehouse::class);
    }
}