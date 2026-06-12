<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'password',
    ];

    protected $hidden = ['password'];

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }
}