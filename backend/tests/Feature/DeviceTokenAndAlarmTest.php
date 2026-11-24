<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\FcmToken;
use App\Models\Firehouse;
use App\Models\Incident;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\MessageTarget;
use Kreait\Firebase\Messaging\MulticastSendReport;
use Kreait\Firebase\Messaging\SendReport;
use Mockery;
use Tests\TestCase;

class DeviceTokenAndAlarmTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesSeeder::class);
    }

    public function test_device_token_register_rebinds_shared_device_and_unregister_deletes_it(): void
    {
        $accountA = Account::factory()->create();
        $userA = User::factory()->create(['account_id' => $accountA->id]);

        $accountB = Account::factory()->create();
        $userB = User::factory()->create(['account_id' => $accountB->id]);

        $this->actingAs($accountA, 'sanctum')
            ->postJson('/api/devices/register', [
                'token' => 'shared-device-fcm-token',
                'platform' => 'android',
            ])
            ->assertOk();

        $this->assertDatabaseHas('fcm_tokens', [
            'user_id' => $userA->id,
            'token' => 'shared-device-fcm-token',
            'platform' => 'android',
        ]);

        // Inny użytkownik loguje się na tym samym telefonie -> token przepina się na userB
        $this->actingAs($accountB, 'sanctum')
            ->postJson('/api/devices/register', [
                'token' => 'shared-device-fcm-token',
                'platform' => 'ios',
            ])
            ->assertOk();

        $this->assertDatabaseCount('fcm_tokens', 1);
        $this->assertDatabaseHas('fcm_tokens', [
            'user_id' => $userB->id,
            'token' => 'shared-device-fcm-token',
            'platform' => 'ios',
        ]);

        // userA nie może usunąć tokenu należącego już do userB
        $this->actingAs($accountA, 'sanctum')
            ->deleteJson('/api/devices/unregister', ['token' => 'shared-device-fcm-token'])
            ->assertOk();

        $this->assertDatabaseCount('fcm_tokens', 1);

        // userB usuwa swój token
        $this->actingAs($accountB, 'sanctum')
            ->deleteJson('/api/devices/unregister', ['token' => 'shared-device-fcm-token'])
            ->assertOk();

        $this->assertDatabaseCount('fcm_tokens', 0);
    }

    public function test_alarm_sends_multicast_only_to_ready_active_firefighters_forces_active_status_and_prunes_dead_tokens(): void
    {
        $firehouse = Firehouse::factory()->create();
        $systemRole = Role::where('name', 'system')->firstOrFail();
        $firefighterRole = Role::where('name', 'firefighter')->firstOrFail();

        // Konto systemowe (wywołuje alarm — nie powinno dostać pusha nawet gdyby miało token)
        $systemAccount = Account::factory()->create();
        $systemUser = User::factory()->create([
            'account_id' => $systemAccount->id,
            'firehouse_id' => $firehouse->id,
            'is_active' => true,
            'readiness_status' => 'active',
        ]);
        $systemUser->roles()->attach($systemRole->id);
        FcmToken::factory()->create(['user_id' => $systemUser->id, 'token' => 'token-system-device']);

        // Gotowy i aktywny strażak (2 urządzenia: jedno sprawne, jedno wygasłe)
        $readyUser = User::factory()->create([
            'firehouse_id' => $firehouse->id,
            'is_active' => true,
            'readiness_status' => 'active',
        ]);
        $readyUser->roles()->attach($firefighterRole->id);
        FcmToken::factory()->create(['user_id' => $readyUser->id, 'token' => 'token-ready-valid']);
        FcmToken::factory()->create(['user_id' => $readyUser->id, 'token' => 'token-ready-stale']);

        // Strażak NIE w gotowości (in_active) — NIE powinien dostać alarmu
        $notReadyUser = User::factory()->notReady()->create([
            'firehouse_id' => $firehouse->id,
            'is_active' => true,
        ]);
        $notReadyUser->roles()->attach($firefighterRole->id);
        FcmToken::factory()->create(['user_id' => $notReadyUser->id, 'token' => 'token-not-ready']);

        // Zdezaktywowany strażak (is_active = false) — NIE powinien dostać alarmu
        $deactivatedUser = User::factory()->inactive()->create([
            'firehouse_id' => $firehouse->id,
            'readiness_status' => 'active',
        ]);
        $deactivatedUser->roles()->attach($firefighterRole->id);
        FcmToken::factory()->create(['user_id' => $deactivatedUser->id, 'token' => 'token-deactivated']);

        // Mock Firebase Messaging::sendMulticast
        $capturedTokens = [];
        $capturedTime = null;

        $messagingMock = Mockery::mock(Messaging::class);
        $messagingMock->shouldReceive('sendMulticast')
            ->once()
            ->withArgs(function (CloudMessage $message, array $tokens) use (&$capturedTokens, &$capturedTime) {
                $capturedTokens = $tokens;
                $serialized = $message->jsonSerialize();
                $capturedTime = $serialized['data']['incident_time'] ?? null;

                return !isset($serialized['topic']);
            })
            ->andReturn(MulticastSendReport::withItems([
                SendReport::success(
                    MessageTarget::with(MessageTarget::TOKEN, 'token-ready-valid'),
                    ['name' => 'projects/osp/messages/msg-1']
                ),
                SendReport::failure(
                    MessageTarget::with(MessageTarget::TOKEN, 'token-ready-stale'),
                    new NotFound('Requested entity was not found.')
                ),
            ]));

        $this->app->instance(Messaging::class, $messagingMock);

        $response = $this->actingAs($systemAccount, 'sanctum')
            ->postJson('/api/incident/new', [
                'main_category' => 'F',
                'sub_category' => 'Pożar budynku',
                'description' => 'Gęsty dym z dachu',
                'incident_time' => '2026-06-15T10:00:00Z', // 12:00 w Europe/Warsaw (CEST)
                'address' => 'ul. Morska 10, Gdynia',
                'latitude' => 54.523,
                'longitude' => 18.526,
                'status' => 'END', // Próba utworzenia alarmu jako END musi zostać zignorowana
                'raw_payload' => ['source' => 'SWD-PSP'],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'ACTIVE')
            ->assertJsonPath('data.raw_payload.source', 'SWD-PSP')
            ->assertJsonPath('data.fcm_sent_count', 1);

        // Wyłącznie tokeny gotowego, aktywnego strażaka
        $this->assertEqualsCanonicalizing(['token-ready-valid', 'token-ready-stale'], $capturedTokens);

        // Czas w powiadomieniu skonwertowany do strefy Europe/Warsaw (UTC+2 w czerwcu)
        $this->assertSame('15.06.2026 12:00', $capturedTime);

        // Wygasły token został automatycznie usunięty, poprawny został
        $this->assertDatabaseMissing('fcm_tokens', ['token' => 'token-ready-stale']);
        $this->assertDatabaseHas('fcm_tokens', ['token' => 'token-ready-valid']);

        // Incydent ma zapisane metadane FCM bez nadpisywania raw_payload
        $incident = Incident::firstOrFail();
        $this->assertSame('projects/osp/messages/msg-1', $incident->fcm_message_id);
        $this->assertSame(1, $incident->fcm_sent_count);
        $this->assertNotNull($incident->fcm_dispatched_at);
    }
}
