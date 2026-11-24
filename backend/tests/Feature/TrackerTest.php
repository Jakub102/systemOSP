<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Firehouse;
use App\Models\Incident;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesSeeder::class);
    }

    public function test_gps_ping_does_not_auto_accept_pending_firefighter(): void
    {
        $firehouse = Firehouse::factory()->create(['latitude' => 54.52200, 'longitude' => 18.52500]);
        $account = Account::factory()->create();
        $user = User::factory()->create(['account_id' => $account->id, 'firehouse_id' => $firehouse->id]);
        $incident = Incident::factory()->create(['status' => 'ACTIVE']);

        $incident->users()->attach($user->id, ['attendance_status' => 'pending']);

        $this->actingAs($account, 'sanctum')
            ->postJson("/api/incidents/{$incident->id}/location", [
                'latitude' => 54.51000,
                'longitude' => 18.51000,
            ])
            ->assertStatus(409)
            ->assertJsonPath('should_stop_tracking', true);

        $this->assertDatabaseHas('incident_user', [
            'incident_id' => $incident->id,
            'user_id' => $user->id,
            'attendance_status' => 'pending',
        ]);
    }

    public function test_firefighter_responds_tracks_gps_arrives_at_firehouse_and_system_sees_location(): void
    {
        $firehouse = Firehouse::factory()->create(['latitude' => 54.52200, 'longitude' => 18.52500]);
        $firefighterAccount = Account::factory()->create();
        $firefighter = User::factory()->create([
            'account_id' => $firefighterAccount->id,
            'firehouse_id' => $firehouse->id,
        ]);
        $firefighter->roles()->attach(Role::where('name', 'firefighter')->firstOrFail()->id);

        $systemAccount = Account::factory()->create();
        $systemUser = User::factory()->create([
            'account_id' => $systemAccount->id,
            'firehouse_id' => $firehouse->id,
        ]);
        $systemUser->roles()->attach(Role::where('name', 'system')->firstOrFail()->id);

        $incident = Incident::factory()->create(['status' => 'ACTIVE']);

        // 1. Deklaracja udziału z daleka (>100m od remizy) — lekki JSON bez redundantnych danych profilu
        $this->actingAs($firefighterAccount, 'sanctum')
            ->postJson("/api/incidents/{$incident->id}/respond", [
                'attendance_status' => 'accepted',
                'latitude' => 54.51000,
                'longitude' => 18.51000,
            ])
            ->assertOk()
            ->assertJsonPath('attendance_status', 'accepted')
            ->assertJsonPath('should_stop_tracking', false)
            ->assertJsonMissingPath('first_name')
            ->assertJsonMissingPath('roles');

        // 2. Aktualizacja GPS bliżej, wciąż w drodze
        $this->actingAs($firefighterAccount, 'sanctum')
            ->postJson("/api/incidents/{$incident->id}/location", [
                'latitude' => 54.51800,
                'longitude' => 18.52000,
            ])
            ->assertOk()
            ->assertJsonPath('attendance_status', 'accepted')
            ->assertJsonPath('should_stop_tracking', false)
            ->assertJsonMissingPath('first_name')
            ->assertJsonMissingPath('roles');

        // 3. System widzi strażaka na mapie wraz z confirmed_at (świeżość sygnału GPS)
        $this->actingAs($systemAccount, 'sanctum')
            ->getJson("/api/incidents/{$incident->id}/location")
            ->assertOk()
            ->assertJsonCount(1, 'data.users')
            ->assertJsonPath('data.users.0.attendance_status', 'accepted')
            ->assertJsonStructure(['data' => ['users' => [['first_name', 'last_name', 'full_name', 'roles', 'attendance_status', 'latitude', 'longitude', 'confirmed_at']]]]);

        // 3b. Lista aktywnych alarmów dla strażaka zawiera współrzędne zdarzenia
        $this->actingAs($firefighterAccount, 'sanctum')
            ->getJson('/api/incidents/my')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'latitude', 'longitude', 'my_attendance_status']]]);

        // 4. Strażak dociera w promień <= 100m od remizy -> automatyczne on_scene + stop tracking
        $this->actingAs($firefighterAccount, 'sanctum')
            ->postJson("/api/incidents/{$incident->id}/location", [
                'latitude' => 54.52205,
                'longitude' => 18.52505,
            ])
            ->assertOk()
            ->assertJsonPath('attendance_status', 'on_scene')
            ->assertJsonPath('should_stop_tracking', true);
    }

    public function test_authorized_role_can_close_incident_and_firefighter_cannot(): void
    {
        $firehouse = Firehouse::factory()->create();

        $firefighterAccount = Account::factory()->create();
        $firefighter = User::factory()->create([
            'account_id' => $firefighterAccount->id,
            'firehouse_id' => $firehouse->id,
        ]);
        $firefighter->roles()->attach(Role::where('name', 'firefighter')->firstOrFail()->id);

        $chiefAccount = Account::factory()->create();
        $chief = User::factory()->create([
            'account_id' => $chiefAccount->id,
            'firehouse_id' => $firehouse->id,
        ]);
        $chief->roles()->attach(Role::where('name', 'chief')->firstOrFail()->id);

        $incident = Incident::factory()->create(['status' => 'ACTIVE']);

        // Zwykły strażak nie może zamknąć incydentu
        $this->actingAs($firefighterAccount, 'sanctum')
            ->patchJson("/api/incidents/{$incident->id}/close")
            ->assertStatus(403);

        // Naczelnik zamyka incydent
        $this->actingAs($chiefAccount, 'sanctum')
            ->patchJson("/api/incidents/{$incident->id}/close")
            ->assertOk()
            ->assertJsonPath('data.status', 'END');

        // Ponowne zamknięcie zwraca 409 Conflict
        $this->actingAs($chiefAccount, 'sanctum')
            ->patchJson("/api/incidents/{$incident->id}/close")
            ->assertStatus(409);

        // Zamknięty incydent znika z listy aktywnych i zatrzymuje tracking
        $this->actingAs($firefighterAccount, 'sanctum')
            ->getJson('/api/incidents/my')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($firefighterAccount, 'sanctum')
            ->postJson("/api/incidents/{$incident->id}/location", [
                'latitude' => 54.51000,
                'longitude' => 18.51000,
            ])
            ->assertOk()
            ->assertJsonPath('should_stop_tracking', true);
    }
}
