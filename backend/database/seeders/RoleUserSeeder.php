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

        // Mapowanie ról dla każdego użytkownika (14 kont z AccountSeeder / UserSeeder)
        // ID ról z RolesSeeder:
        // 1: system, 2: admin, 3: firefighter (Strażak), 6: chief (Naczelnik),
        // 10: captain (Dowódca), 11: driver (Kierowca), 12: lifeguard (Ratownik)
        $userRoles = [
            1  => [1],                   // System device (system@vfd.pl): System
            2  => [2, 3],                // Jan Kowalski (admin@vfd.pl): Administrator, Strażak
            3  => [3, 10, 11, 12],       // Adam Nowak (strazak@vfd.pl): Strażak, Dowódca, Kierowca, Ratownik
            4  => [3, 6, 10, 12],        // Piotr Wiśniewski (dowodca@vfd.pl): Strażak, Naczelnik, Dowódca, Ratownik
            5  => [3, 11, 12],           // Michał Wójcik (kierowca@vfd.pl): Strażak, Kierowca, Ratownik
            6  => [3, 12],               // Tomasz Kamiński (ratownik@vfd.pl): Strażak, Ratownik
            7  => [3, 11, 12],           // Kamil Zieliński (strazak2@vfd.pl): Strażak, Kierowca, Ratownik
            8  => [3, 12],               // Łukasz Szymański (strazak3@vfd.pl): Strażak, Ratownik
            9  => [3, 11, 12],           // Marcin Dąbrowski (strazak4@vfd.pl): Strażak, Kierowca, Ratownik
            10 => [3, 12],               // Paweł Kozłowski (strazak5@vfd.pl): Strażak, Ratownik
            11 => [3, 10, 12],           // Maciej Jankowski (strazak6@vfd.pl): Strażak, Dowódca, Ratownik
            12 => [3, 12],               // Krzysztof Mazur (strazak7@vfd.pl): Strażak, Ratownik
            13 => [3, 10, 11, 12],       // Marek Krawczyk (dowodca2@vfd.pl): Strażak, Dowódca, Kierowca, Ratownik
            14 => [3],                   // Szymon Wróbel (strazak8@vfd.pl): Strażak
        ];

        $rows = [];
        foreach ($userRoles as $userId => $roleIds) {
            foreach ($roleIds as $roleId) {
                $rows[] = [
                    'user_id' => $userId,
                    'role_id' => $roleId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('role_user')->insert($rows);
    }
}
