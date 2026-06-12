<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Firehouse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Pobierz ID pierwszej jednostki straży pożarnej (zakładamy, że FirehouseSeeder już ją utworzył)
        $firehouse = Firehouse::first();

        DB::table('users')->insert([
            [
                'account_id' => 1,
                'first_name' => 'Jan',
                'last_name' => 'Kowalski',
                'phone_number' => '111222333',
                'is_active' => true,
                'status' => 'READY',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 2,
                'first_name' => 'Adam',
                'last_name' => 'Nowak',
                'phone_number' => '222333444',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 3,
                'first_name' => 'Piotr',
                'last_name' => 'Wiśniewski',
                'phone_number' => '333444555',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 4,
                'first_name' => 'Michał',
                'last_name' => 'Wójcik',
                'phone_number' => '444555666',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 5,
                'first_name' => 'Tomasz',
                'last_name' => 'Kamiński',
                'phone_number' => '555666777',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 6,
                'first_name' => 'Kamil',
                'last_name' => 'Zieliński',
                'phone_number' => '666777888',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 7,
                'first_name' => 'Łukasz',
                'last_name' => 'Szymański',
                'phone_number' => '777888999',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 8,
                'first_name' => 'Marcin',
                'last_name' => 'Dąbrowski',
                'phone_number' => '888999000',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 9,
                'first_name' => 'Paweł',
                'last_name' => 'Kozłowski',
                'phone_number' => '999000111',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 10,
                'first_name' => 'Maciej',
                'last_name' => 'Jankowski',
                'phone_number' => '000111222',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 11,
                'first_name' => 'Krzysztof',
                'last_name' => 'Mazur',
                'phone_number' => '111222333',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 12,
                'first_name' => 'Marek',
                'last_name' => 'Krawczyk',
                'phone_number' => '222333444',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'account_id' => 13,
                'first_name' => 'Szymon',
                'last_name' => 'Wróbel',
                'phone_number' => '333444555',
                'is_active' => true,
                'status' => 'IN ACTION',
                'firehouse_id' => $firehouse->id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}