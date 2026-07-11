<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InvitationSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('invitations')->insert([
            [
                'email' => 'kandydat1@vfd.pl',
                'token' => Str::random(32),
                'role_id' => 2,
                'firehouse_id'=> 1,
                'expires_at' => Carbon::now()->addDays(2), // Odkomentuj jeśli zaproszenie wygasa
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        ]);
    }
}