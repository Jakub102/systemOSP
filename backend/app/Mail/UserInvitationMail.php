<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invitation $invitation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Zaproszenie do systemu OSP - Rejestracja konta',
        );
    }

    public function content(): Content
    {
        $registrationUrl = config('app.frontend_url', config('app.url')) . '/register?token=' . $this->invitation->token;

        return new Content(
            view: 'emails.invitation',
            with: [
                'url' => $registrationUrl,
                'firehouse' => $this->invitation->firehouse->name,
            ],
        );
    }
}