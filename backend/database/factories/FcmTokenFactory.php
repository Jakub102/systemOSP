<?php

namespace Database\Factories;

use App\Models\FcmToken;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FcmToken>
 */
class FcmTokenFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'token' => 'fcm_token_'.Str::random(48),
            'platform' => 'android',
            'device_name' => 'android-test',
            'last_used_at' => now(),
        ];
    }
}
