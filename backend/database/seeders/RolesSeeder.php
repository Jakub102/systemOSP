<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $roles = [
            ['name' => 'system', 'display_name' => 'System'],
            ['name' => 'admin', 'display_name' => 'Administrator'],
            ['name' => 'firefighter', 'display_name' => 'Strażak'],
            ['name' => 'president', 'display_name' => 'Prezes'],
            ['name' => 'vicepresident', 'display_name' => 'Zastępca Prezesa'],
            ['name' => 'chief', 'display_name' => 'Naczelnik'],
            ['name' => 'chiefassistent', 'display_name' => 'Zastępca Naczelnika'],
            ['name' => 'quartermaster', 'display_name' => 'Gospodarz'],
            ['name' => 'treasurer', 'display_name' => 'Skarbnik'],
            ['name' => 'captain', 'display_name' => 'Dowódca'],
            ['name' => 'driver', 'display_name' => 'Kierowca'],
            ['name' => 'lifeguard', 'display_name' => 'Ratownik'],
        ];

        $rows = array_map(fn (array $role) => [
            ...$role,
            'created_at' => $now,
            'updated_at' => $now,
        ], $roles);

        DB::table('roles')->upsert($rows, ['name'], ['display_name', 'updated_at']);
    }
}
