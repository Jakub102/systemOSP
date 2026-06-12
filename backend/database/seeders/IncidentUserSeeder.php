<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class IncidentUserSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Przypisanie użytkowników do incydentu INC-1005 (ID 5)
        DB::table('incident_user')->insert([
            [
                'incident_id' => 5, 
                'user_id' => 3, // Dowódca (Piotr Wiśniewski)
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.47502, 
                'confirmed_longitude' => 18.51505, 
                'confirmed_at' => $now->copy()->subMinutes(3),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 5, 
                'user_id' => 2, // Strażak (Adam Nowak)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.47510,
                'confirmed_longitude' => 18.51490,
                'confirmed_at' => $now->copy()->subMinutes(4),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 5, 
                'user_id' => 4, // Strażak (Michał Wójcik)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.47490,
                'confirmed_longitude' => 18.51510,
                'confirmed_at' => $now->copy()->subMinutes(2),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 5, 
                'user_id' => 5, // Strażak (Tomasz Kamiński)
                'attendance_status' => 'pending',
                'confirmed_latitude' => null,
                'confirmed_longitude' => null,
                'confirmed_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);

        // Incydent INC-1006 (ID 6) - strażacy zebrani w remizie
        // Promień bardzo blisko remizy (54.52200, 18.52500)
        DB::table('incident_user')->insert([
            [
                'incident_id' => 6, 
                'user_id' => 3, // Dowódca 1
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52205, 
                'confirmed_longitude' => 18.52505, 
                'confirmed_at' => $now->copy()->subSeconds(45),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6, 
                'user_id' => 2, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52195, 
                'confirmed_longitude' => 18.52495, 
                'confirmed_at' => $now->copy()->subSeconds(30),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6, 
                'user_id' => 4, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52210, 
                'confirmed_longitude' => 18.52510, 
                'confirmed_at' => $now->copy()->subSeconds(25),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6, 
                'user_id' => 5, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52200, 
                'confirmed_longitude' => 18.52520, 
                'confirmed_at' => $now->copy()->subSeconds(15),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6, 
                'user_id' => 6, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52190, 
                'confirmed_longitude' => 18.52490, 
                'confirmed_at' => $now->copy()->subSeconds(10),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6, 
                'user_id' => 7, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52200, 
                'confirmed_longitude' => 18.52500, 
                'confirmed_at' => $now->copy()->subSeconds(5),
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);

        // Incydent INC-1007 (ID 7) - strażacy rozproszeni po mieście (w drodze)
        DB::table('incident_user')->insert([
            [
                'incident_id' => 7, 
                'user_id' => 12, // Dowódca 2
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.51000, 
                'confirmed_longitude' => 18.51000, 
                'confirmed_at' => $now->copy()->subSeconds(10),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7, 
                'user_id' => 8, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.53000, 
                'confirmed_longitude' => 18.54000, 
                'confirmed_at' => $now->copy()->subSeconds(20),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7, 
                'user_id' => 9, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52500, 
                'confirmed_longitude' => 18.50000, 
                'confirmed_at' => $now->copy()->subSeconds(15),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7, 
                'user_id' => 10, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.51500, 
                'confirmed_longitude' => 18.53000, 
                'confirmed_at' => $now->copy()->subSeconds(25),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7, 
                'user_id' => 11, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.53500, 
                'confirmed_longitude' => 18.51500, 
                'confirmed_at' => $now->copy()->subSeconds(5),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7, 
                'user_id' => 13, // Strażak
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.51200, 
                'confirmed_longitude' => 18.52500, 
                'confirmed_at' => $now->copy()->subSeconds(15),
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}