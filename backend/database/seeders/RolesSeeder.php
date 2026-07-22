<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        //RolesSeeder
        DB::table('roles')->insert([
            [
                'name' => 'system',
                'display_name' => 'System',
            ],
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
            ],
            [
                'name' => 'firefighter',
                'display_name' => 'Strażak',
            ],
            [
                'name' => 'president',
                'display_name' => 'Prezes',
            ],
            [
                'name' => 'vicepresident',
                'display_name' => 'Zastępca Prezesa',
            ],
            [
                'name' => 'chief',
                'display_name' => 'Naczelnik',
            ],
            [
                'name' => 'chiefassistent',
                'display_name' => 'Zastępca Naczelnika',
            ],
            [
                'name' => 'quartermaster',
                'display_name' => 'Gospodarz',
            ],
            [
                'name' => 'treasurer',
                'display_name' => 'Skarbnik',
            ],
            [
                'name' => 'captain',
                'display_name' => 'Dowódca',
            ],
        ]);
    }
}