<?php

namespace Database\Seeders;

use App\Models\Account;
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
        // Słownik ról jest bezpieczny i idempotentny w każdym środowisku.
        $this->call([
            RolesSeeder::class,
        ]);

        $shouldSeedDemo = app()->environment('local', 'testing')
            || filter_var(env('SEED_DEMO_DATA', false), FILTER_VALIDATE_BOOL);

        if (!$shouldSeedDemo) {
            $this->command?->info('Pominięto dane demonstracyjne (środowisko produkcyjne).');

            return;
        }

        if (Account::exists()) {
            $this->command?->info('Database already seeded. Skipping demo seeders.');

            return;
        }

        $this->call([
            FirehouseSeeder::class,
            AccountSeeder::class,
            InvitationSeeder::class,
            UserSeeder::class,
            IncidentSeeder::class,
            RoleUserSeeder::class,
            IncidentUserSeeder::class,
        ]);
    }
}
