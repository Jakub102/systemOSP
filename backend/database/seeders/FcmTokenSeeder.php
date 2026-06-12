<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class FcmTokenSeeder extends Seeder
{
    public function run(): void
    {
        // Zakładamy, że AdminSeeder utworzył już konto z ID 1
        DB::table('fcm_tokens')->insert([
            [
                'user_id' => 1,
                'token' => 'fcm_dummy_token_phone_' . Str::random(24),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'user_id' => 1,
                'token' => 'fcm_dummy_token_tablet_' . Str::random(24),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'user_id' => 1,
                'token' => 'fcm_dummy_token_web_' . Str::random(24),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        ]);
    }
}