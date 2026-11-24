<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\FcmToken;
use App\Models\Firehouse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_normalizes_email_and_returns_token_and_user(): void
    {
        $firehouse = Firehouse::factory()->create();
        $account = Account::factory()->create([
            'email' => 'jan.kowalski@osp.pl',
            'password' => Hash::make('Secret123!'),
        ]);
        User::factory()->create([
            'account_id' => $account->id,
            'firehouse_id' => $firehouse->id,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => '  JAN.Kowalski@OSP.PL ',
            'password' => 'Secret123!',
            'device_name' => 'android-pixel',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'first_name', 'last_name', 'full_name', 'roles', 'role_names', 'firehouse' => ['id', 'name', 'latitude', 'longitude']],
            ])
            ->assertJsonMissingPath('user.firehouse.street')
            ->assertJsonMissingPath('user.firehouse.postal_code');
    }

    public function test_update_readiness_returns_slim_payload(): void
    {
        $account = Account::factory()->create();
        User::factory()->create(['account_id' => $account->id, 'readiness_status' => 'active']);

        $this->actingAs($account, 'sanctum')
            ->patchJson('/api/me/readiness', ['readiness_status' => 'in_active'])
            ->assertOk()
            ->assertJsonPath('readiness_status', 'in_active')
            ->assertJsonMissingPath('user');
    }

    public function test_deactivated_user_is_blocked_even_with_existing_sanctum_token_and_token_is_revoked(): void
    {
        $account = Account::factory()->create();
        $user = User::factory()->create([
            'account_id' => $account->id,
            'is_active' => true,
        ]);

        $plainToken = $account->createToken('android-phone')->plainTextToken;
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Dezaktywacja konta po wydaniu tokenu
        $user->update(['is_active' => false]);

        $this->withToken($plainToken)
            ->getJson('/api/me')
            ->assertStatus(403);

        // Token został natychmiast unieważniony
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Nowy token również nie przechodzi /auth/refresh ani /me/readiness
        $anotherToken = $account->createToken('tablet')->plainTextToken;

        $this->withToken($anotherToken)
            ->postJson('/api/auth/refresh')
            ->assertStatus(403);

        $thirdToken = $account->createToken('phone-2')->plainTextToken;

        $this->withToken($thirdToken)
            ->patchJson('/api/me/readiness', ['readiness_status' => 'in_active'])
            ->assertStatus(403);
    }

    public function test_logout_revokes_access_token_and_optional_fcm_token(): void
    {
        $account = Account::factory()->create();
        $user = User::factory()->create(['account_id' => $account->id]);
        $fcm = FcmToken::factory()->create(['user_id' => $user->id, 'token' => 'device-fcm-123']);

        $plainToken = $account->createToken('android-phone')->plainTextToken;

        $this->withToken($plainToken)
            ->postJson('/api/logout', ['fcm_token' => $fcm->token])
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseMissing('fcm_tokens', ['id' => $fcm->id]);
    }

    public function test_refresh_rotates_token_atomically_and_revokes_previous_token(): void
    {
        $account = Account::factory()->create();
        User::factory()->create(['account_id' => $account->id, 'is_active' => true]);

        $oldToken = $account->createToken('android-phone')->plainTextToken;

        $response = $this->withToken($oldToken)
            ->postJson('/api/auth/refresh');

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'full_name']]);

        $newToken = $response->json('token');
        $this->assertNotSame($oldToken, $newToken);
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Nowy token działa poprawnie
        $this->withToken($newToken)
            ->getJson('/api/me')
            ->assertOk();
    }
}
