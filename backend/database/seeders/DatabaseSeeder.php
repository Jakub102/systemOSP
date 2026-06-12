<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /**
         * Seed
         */
        $this->call([
            FirehouseSeeder::class,
            AccountSeeder::class,
            RolesSeeder::class,
            InvitationSeeder::class,
            UserSeeder::class,
            IncidentSeeder::class,
            RoleUserSeeder::class,
            IncidentUserSeeder::class,
        ]);
    }
}
