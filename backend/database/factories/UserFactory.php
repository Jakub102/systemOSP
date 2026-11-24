<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Firehouse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'firehouse_id' => Firehouse::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone_number' => fake()->numerify('#########'),
            'is_active' => true,
            'readiness_status' => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function notReady(): static
    {
        return $this->state(fn () => ['readiness_status' => 'in_active']);
    }
}
