<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'token',
        'role_id',
        'firehouse_id',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function isValid(): bool
    {
        return !$this->isUsed() && $this->expires_at->isFuture();
    }

    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function firehouse(): BelongsTo
    {
        return $this->belongsTo(Firehouse::class);
    }
}