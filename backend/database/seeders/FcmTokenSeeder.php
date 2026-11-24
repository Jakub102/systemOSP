<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FcmTokenSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('fcm_tokens')->insert([
            [
                'user_id' => 2,
                'token' => 'fcm_dummy_token_phone_'.Str::random(24),
                'platform' => 'android',
                'device_name' => 'android-demo-phone',
                'last_used_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 3,
                'token' => 'fcm_dummy_token_tablet_'.Str::random(24),
                'platform' => 'android',
                'device_name' => 'android-demo-tablet',
                'last_used_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
