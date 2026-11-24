<?php

namespace Database\Factories;

use App\Models\Incident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'main_category' => fake()->randomElement(Incident::MAIN_CATEGORIES),
            'sub_category' => 'Pożar budynku',
            'description' => fake()->sentence(),
            'incident_time' => now(),
            'address' => fake()->address(),
            'latitude' => 54.52500,
            'longitude' => 18.53000,
            'status' => 'ACTIVE',
        ];
    }

    public function ended(): static
    {
        return $this->state(fn () => ['status' => 'END']);
    }
}
