<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public Invitation $invitation,
        public string $plainToken,
    ) {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Zaproszenie do systemu OSP - Rejestracja konta',
        );
    }

    public function content(): Content
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');
        $registrationUrl = $frontendUrl.'/register?token='.urlencode($this->plainToken);
        $displayTimezone = (string) config('app.display_timezone', 'Europe/Warsaw');

        return new Content(
            view: 'emails.invitation',
            with: [
                'url' => $registrationUrl,
                'firehouse' => $this->invitation->firehouse->name,
                'expiresAtFormatted' => $this->invitation->expires_at
                    ->copy()
                    ->timezone($displayTimezone)
                    ->format('d.m.Y H:i'),
            ],
        );
    }
}
