<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Account;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (Account::exists()) {
            $this->command->info('Database already seeded. Skipping seeders.');
            return;
        }

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