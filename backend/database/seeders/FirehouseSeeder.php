<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FirehouseSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('firehouse')->insert([
            [
                'name' => 'OSP Gdynia',
                'street' => 'Morska',
                'address' => '100',
                'postal_code' => '81-222',
                'city' => 'Gdynia',
                'latitude' => 54.52200,
                'longitude' => 18.52500,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}