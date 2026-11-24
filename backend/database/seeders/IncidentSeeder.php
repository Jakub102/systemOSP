<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IncidentSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Wszystkie zdarzenia zlokalizowane realnie w rejonie działania OSP Gdynia (ul. Morska 100: 54.52200, 18.52500)
        DB::table('incidents')->insert([
            [
                'external_id' => 'INC-1001',
                'main_category' => 'F',
                'sub_category' => 'Pożar poszycia leśnego',
                'description' => 'Zgłoszenie pożaru młodnika na skraju Trójmiejskiego Parku Krajobrazowego.',
                'incident_time' => $now->copy()->subHours(6),
                'address' => 'ul. Chwarznieńska 45, Gdynia',
                'latitude' => 54.50650,
                'longitude' => 18.48900,
                'status' => 'END',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'external_id' => 'INC-1002',
                'main_category' => 'A',
                'sub_category' => 'Wypadek drogowy',
                'description' => 'Zderzenie dwóch aut osobowych na skrzyżowaniu, brak osób zakleszczonych.',
                'incident_time' => $now->copy()->subDays(1),
                'address' => 'ul. Morska 210, Gdynia',
                'latitude' => 54.53420,
                'longitude' => 18.49850,
                'status' => 'END',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'external_id' => 'INC-1003',
                'main_category' => 'M',
                'sub_category' => 'Zasłabnięcie',
                'description' => 'Zasłabnięcie starszej osoby na przystanku, OSP na miejscu przed ZRM.',
                'incident_time' => $now->copy()->subHours(3),
                'address' => 'ul. Świętojańska 72, Gdynia',
                'latitude' => 54.51380,
                'longitude' => 18.53820,
                'status' => 'END',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'external_id' => 'INC-1004',
                'main_category' => 'FA',
                'sub_category' => 'Alarm z monitoringu (AFAP)',
                'description' => 'Wzbudzenie czujki na hali magazynowej, brak oznak pożaru.',
                'incident_time' => $now->copy()->subHours(2),
                'address' => 'ul. Hutnicza 18, Gdynia',
                'latitude' => 54.54100,
                'longitude' => 18.49150,
                'status' => 'END',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'external_id' => 'INC-1005',
                'main_category' => 'F',
                'sub_category' => 'Pożar śmietnika',
                'description' => 'Pali się wiata śmietnikowa przy zabudowie wielorodzinnej.',
                'incident_time' => $now->copy()->subMinutes(25),
                'address' => 'ul. Wielkopolska 54, Gdynia',
                'latitude' => 54.48950,
                'longitude' => 18.52100,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'external_id' => 'INC-1006',
                'main_category' => 'F',
                'sub_category' => 'Pożar pojazdu',
                'description' => 'Zgłoszenie pożaru auta na parkingu. Zespół OSP zebrany w remizie.',
                'incident_time' => $now->copy()->subMinutes(10),
                'address' => 'ul. Kartuska 32, Gdynia',
                'latitude' => 54.53580,
                'longitude' => 18.48650,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'external_id' => 'INC-1007',
                'main_category' => 'F',
                'sub_category' => 'Pożar budynku gospodarczego',
                'description' => 'Silne zadymienie z garażu przy zabudowie jednorodzinnej w rejonie Leszczynek. Zastęp w trakcie zbiórki i dojazdu do remizy.',
                'incident_time' => $now->copy()->subMinutes(3),
                'address' => 'ul. Morska 165, Gdynia',
                'latitude' => 54.53050,
                'longitude' => 18.50850,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
