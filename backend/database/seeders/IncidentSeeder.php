<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class IncidentSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('incidents')->insert([
            [
                'external_id' => 'INC-1001',
                'main_category' => 'F',
                'sub_category' => 'Pożar lasu',
                'description' => 'Zgłoszenie pożaru młodnika obok drogi krajowej.',
                'incident_time' => Carbon::now()->subHours(2),
                'address' => 'ul. Leśna, Warszawa',
                'latitude' => 52.2296756,
                'longitude' => 21.0122287,
                'status' => 'END',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'external_id' => 'INC-1002',
                'main_category' => 'A',
                'sub_category' => 'Wypadek drogowy',
                'description' => 'Zderzenie dwóch aut osobowych, brak osób zakleszczonych.',
                'incident_time' => Carbon::now()->subDays(1),
                'address' => 'al. Jerozolimskie 100, Warszawa',
                'latitude' => 52.2285121,
                'longitude' => 20.9996721,
                'status' => 'END',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'external_id' => 'INC-1003',
                'main_category' => 'M',
                'sub_category' => 'Zasłabnięcie',
                'description' => 'Zasłabnięcie starszej osoby na chodniku, OSP na miejscu przed ZRM.',
                'incident_time' => Carbon::now()->subMinutes(30),
                'address' => 'Rynek Główny, Kraków',
                'latitude' => 50.06143,
                'longitude' => 19.93658,
                'status' => 'END',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'external_id' => 'INC-1004',
                'main_category' => 'FA',
                'sub_category' => 'Alarm z monitoringu (AFAP)',
                'description' => 'Wzbudzenie czujki na hali magazynowej, brak oznak pożaru.',
                'incident_time' => Carbon::now()->subMinutes(15),
                'address' => 'ul. Przemysłowa, Poznań',
                'latitude' => 52.38440,
                'longitude' => 16.92110,
                'status' => 'ACTIVE',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'external_id' => 'INC-1005',
                'main_category' => 'F',
                'sub_category' => 'Pożar śmietnika',
                'description' => 'Pali się wiata śmietnikowa przy gęstej zabudowie.',
                'incident_time' => Carbon::now()->subMinutes(5),
                'address' => 'ul. Wielkopolska, Gdynia',
                'latitude' => 54.47500,
                'longitude' => 18.51500,
                'status' => 'ACTIVE',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'external_id' => 'INC-1006',
                'main_category' => 'F',
                'sub_category' => 'Pożar pojazdu',
                'description' => 'Zgłoszenie pożaru auta na parkingu podziemnym. Zespół OSP zebrany w remizie.',
                'incident_time' => Carbon::now()->subMinutes(10),
                'address' => 'ul. Kartuska, Gdynia',
                'latitude' => 54.53800,
                'longitude' => 18.48000,
                'status' => 'ACTIVE',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'external_id' => 'INC-1007',
                'main_category' => 'M',
                'sub_category' => 'Zalana ulica',
                'description' => 'Pęknięta rura wodociągowa w gęstej zabudowie miejskiej. Zespół w drodze do remizy.',
                'incident_time' => Carbon::now()->subMinutes(2),
                'address' => 'ul. płk. Dąbka, Gdynia',
                'latitude' => 54.55000,
                'longitude' => 18.51000,
                'status' => 'ACTIVE',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}