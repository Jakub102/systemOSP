<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvitationSeeder extends Seeder
{
    public function run(): void
    {
        // Przykładowy token testowy dla dev: "demo-invitation-token-kandydat1"
        $plainDemoToken = 'demo-invitation-token-kandydat1';

        DB::table('invitations')->insert([
            [
                'email' => 'kandydat1@vfd.pl',
                'token' => hash('sha256', $plainDemoToken),
                'role_id' => 3, // firefighter (Strażak)
                'firehouse_id' => 1,
                'expires_at' => Carbon::now()->addDays(2),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}
