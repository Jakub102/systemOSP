<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IncidentUserSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Remiza OSP Gdynia (ul. Morska 100): 54.52200, 18.52500
        // Promień dotarcia (on_scene): <= 100 m od remizy

        // Incydent INC-1005 (ID 5) — część zespołu zebrana, część w drodze
        DB::table('incident_user')->insert([
            [
                'incident_id' => 5,
                'user_id' => 4, // Piotr Wiśniewski (Naczelnik, Dowódca)
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52212,
                'confirmed_longitude' => 18.52518,
                'confirmed_at' => $now->copy()->subMinutes(5),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 5,
                'user_id' => 3, // Adam Nowak (Dowódca, Kierowca)
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52192,
                'confirmed_longitude' => 18.52485,
                'confirmed_at' => $now->copy()->subMinutes(4),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 5,
                'user_id' => 5, // Michał Wójcik (Kierowca)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.51720,
                'confirmed_longitude' => 18.52950,
                'confirmed_at' => $now->copy()->subMinutes(2),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 5,
                'user_id' => 6, // Tomasz Kamiński (Ratownik)
                'attendance_status' => 'pending',
                'confirmed_latitude' => null,
                'confirmed_longitude' => null,
                'confirmed_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Incydent INC-1006 (ID 6) — zespół zebrany w remizie (w promieniu ~30 m od 54.52200, 18.52500)
        DB::table('incident_user')->insert([
            [
                'incident_id' => 6,
                'user_id' => 4,
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52205,
                'confirmed_longitude' => 18.52505,
                'confirmed_at' => $now->copy()->subSeconds(45),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6,
                'user_id' => 3,
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52195,
                'confirmed_longitude' => 18.52495,
                'confirmed_at' => $now->copy()->subSeconds(30),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6,
                'user_id' => 5,
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52210,
                'confirmed_longitude' => 18.52510,
                'confirmed_at' => $now->copy()->subSeconds(25),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6,
                'user_id' => 6,
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52200,
                'confirmed_longitude' => 18.52520,
                'confirmed_at' => $now->copy()->subSeconds(15),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 6,
                'user_id' => 7,
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52190,
                'confirmed_longitude' => 18.52490,
                'confirmed_at' => $now->copy()->subSeconds(10),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // =========================================================================
        // OSTATNIE AKTYWNE ZDARZENIE: INC-1007 (ID 7) — pełny scenariusz pod mapę:
        // - 2 strażaków już na miejscu w remizie (on_scene, < 40 m od OSP Gdynia)
        // - 5 strażaków potwierdziło i jedzie do remizy (accepted, okolice Gdyni 0.7–1.8 km)
        // - 2 strażaków odrzuciło udział (rejected, brak GPS)
        // - 2 strażaków jeszcze nie odpowiedziało (pending)
        // =========================================================================
        DB::table('incident_user')->insert([
            // --- NA MIEJSCU W REMIZIE (on_scene) ---
            [
                'incident_id' => 7,
                'user_id' => 4, // Piotr Wiśniewski (Naczelnik, Dowódca, Ratownik) — ~25 m od remizy
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52218,
                'confirmed_longitude' => 18.52525,
                'confirmed_at' => $now->copy()->subSeconds(65),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 5, // Michał Wójcik (Kierowca, Ratownik) — ~28 m od remizy
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => 54.52182,
                'confirmed_longitude' => 18.52470,
                'confirmed_at' => $now->copy()->subSeconds(40),
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // --- POTWIERDZILI I SĄ W DRODZE DO REMIZY (accepted) ---
            [
                'incident_id' => 7,
                'user_id' => 3, // Adam Nowak (Dowódca, Kierowca, Ratownik) — ul. Morska / Leszczynki (~0.9 km)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52680,
                'confirmed_longitude' => 18.51420,
                'confirmed_at' => $now->copy()->subSeconds(12),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 6, // Tomasz Kamiński (Ratownik) — Działki Leśne (~0.8 km)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.51650,
                'confirmed_longitude' => 18.53250,
                'confirmed_at' => $now->copy()->subSeconds(8),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 7, // Kamil Zieliński (Kierowca, Ratownik) — Chylonia (~1.8 km)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.53150,
                'confirmed_longitude' => 18.50300,
                'confirmed_at' => $now->copy()->subSeconds(15),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 8, // Łukasz Szymański (Ratownik) — Śródmieście (~1.5 km)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.51100,
                'confirmed_longitude' => 18.53900,
                'confirmed_at' => $now->copy()->subSeconds(5),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 11, // Maciej Jankowski (Dowódca, Ratownik) — Grabówek (~0.8 km)
                'attendance_status' => 'accepted',
                'confirmed_latitude' => 54.52850,
                'confirmed_longitude' => 18.52900,
                'confirmed_at' => $now->copy()->subSeconds(20),
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // --- ODRZUCILI UDZIAŁ (rejected) ---
            [
                'incident_id' => 7,
                'user_id' => 9, // Marcin Dąbrowski (Kierowca, Ratownik)
                'attendance_status' => 'rejected',
                'confirmed_latitude' => null,
                'confirmed_longitude' => null,
                'confirmed_at' => $now->copy()->subSeconds(90),
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 10, // Paweł Kozłowski (Ratownik)
                'attendance_status' => 'rejected',
                'confirmed_latitude' => null,
                'confirmed_longitude' => null,
                'confirmed_at' => $now->copy()->subSeconds(75),
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // --- OCZEKUJĄ NA ODPOWIEDŹ (pending) ---
            [
                'incident_id' => 7,
                'user_id' => 2, // Jan Kowalski (Administrator, Strażak)
                'attendance_status' => 'pending',
                'confirmed_latitude' => null,
                'confirmed_longitude' => null,
                'confirmed_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'incident_id' => 7,
                'user_id' => 13, // Marek Krawczyk (Dowódca, Kierowca, Ratownik)
                'attendance_status' => 'pending',
                'confirmed_latitude' => null,
                'confirmed_longitude' => null,
                'confirmed_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
