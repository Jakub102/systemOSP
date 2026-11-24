<?php

namespace Tests\Feature;

use App\Mail\UserInvitationMail;
use App\Mail\UserRegisteredMail;
use App\Models\Account;
use App\Models\Firehouse;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvitationAndRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesSeeder::class);
    }

    public function test_invitation_stores_sha256_hash_and_emails_frontend_url_with_plain_token(): void
    {
        Mail::fake();
        config()->set('app.frontend_url', 'https://panel.osp.example');

        $firehouse = Firehouse::factory()->create(['name' => 'OSP Gdynia']);
        $adminAccount = Account::factory()->create();
        $adminUser = User::factory()->create([
            'account_id' => $adminAccount->id,
            'firehouse_id' => $firehouse->id,
        ]);
        $adminUser->roles()->attach(Role::where('name', 'admin')->firstOrFail()->id);

        $firefighterRole = Role::where('name', 'firefighter')->firstOrFail();

        $response = $this->actingAs($adminAccount, 'sanctum')
            ->postJson('/api/invitations', [
                'email' => '  Nowy.Strazak@OSP.PL ',
                'role_id' => $firefighterRole->id,
            ]);

        $response->assertCreated();

        $invitation = Invitation::where('email', 'nowy.strazak@osp.pl')->firstOrFail();
        $plainToken = null;

        Mail::assertSent(UserInvitationMail::class, function (UserInvitationMail $mail) use ($invitation, &$plainToken) {
            $plainToken = $mail->plainToken;
            $content = $mail->content();

            return hash('sha256', $plainToken) === $invitation->token
                && $plainToken !== $invitation->token
                && str_starts_with($content->with['url'], 'https://panel.osp.example/register?token=');
        });

        // Surowy hash z bazy NIE powinien działać w verify
        $this->getJson('/api/invitations/verify/'.$invitation->token)
            ->assertStatus(410);

        // Plain token z maila działa poprawnie
        $this->getJson('/api/invitations/verify/'.$plainToken)
            ->assertOk()
            ->assertJsonPath('data.email', 'nowy.strazak@osp.pl');

        // Rejestracja wykorzystuje token i blokuje ponowne użycie
        $this->postJson('/api/register', [
            'token' => $plainToken,
            'first_name' => 'Kamil',
            'last_name' => 'Nowak',
            'phone_number' => '500600700',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ])->assertCreated();

        Mail::assertSent(UserRegisteredMail::class);
        $this->assertDatabaseHas('accounts', ['email' => 'nowy.strazak@osp.pl']);

        // Ponowne użycie tego samego tokenu kończy się błędem walidacji
        $this->postJson('/api/register', [
            'token' => $plainToken,
            'first_name' => 'Kamil',
            'last_name' => 'Nowak',
            'phone_number' => '500600700',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ])->assertStatus(422);
    }

    public function test_non_admin_cannot_invite_admin_or_system_role(): void
    {
        Mail::fake();

        $firehouse = Firehouse::factory()->create();
        $presidentAccount = Account::factory()->create();
        $presidentUser = User::factory()->create([
            'account_id' => $presidentAccount->id,
            'firehouse_id' => $firehouse->id,
        ]);
        $presidentUser->roles()->attach(Role::where('name', 'president')->firstOrFail()->id);

        $adminRoleId = Role::where('name', 'admin')->firstOrFail()->id;
        $systemRoleId = Role::where('name', 'system')->firstOrFail()->id;

        $this->actingAs($presidentAccount, 'sanctum')
            ->postJson('/api/invitations', [
                'email' => 'escalate@osp.pl',
                'role_id' => $adminRoleId,
            ])
            ->assertStatus(422);

        $this->actingAs($presidentAccount, 'sanctum')
            ->postJson('/api/invitations', [
                'email' => 'escalate2@osp.pl',
                'role_id' => $systemRoleId,
            ])
            ->assertStatus(422);
    }
}
