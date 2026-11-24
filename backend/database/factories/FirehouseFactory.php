<?php

namespace Database\Factories;

use App\Models\Firehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Firehouse>
 */
class FirehouseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'OSP '.fake()->city(),
            'street' => fake()->streetName(),
            'address' => (string) fake()->buildingNumber(),
            'postal_code' => '81-222',
            'city' => 'Gdynia',
            'latitude' => 54.52200,
            'longitude' => 18.52500,
        ];
    }
}
