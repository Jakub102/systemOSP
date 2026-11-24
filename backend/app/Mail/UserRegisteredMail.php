<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserRegisteredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $userName) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rejestracja zakończona sukcesem',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.successRegistration',
        );
    }
}
