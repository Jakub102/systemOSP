<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleUserSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('role_user')->insert([
            [
                'user_id' => 1,
                'role_id' => 1, // admin
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 2,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 3,
                'role_id' => 5, // chief
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 4,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 5,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 6,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 7,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 8,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 9,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 10,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 11,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 12,
                'role_id' => 9, // captain
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 13,
                'role_id' => 2, // firefighter
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}