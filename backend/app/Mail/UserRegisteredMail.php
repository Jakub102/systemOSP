<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserRegisteredMail extends Mailable
{
    use Queueable, SerializesModels;

    // Przekazujemy imię użytkownika do konstruktora
    public function __construct(public string $userName) {}

    public function build()
    {
        return $this->subject('Rejestracja zakończona sukcesem')
                    ->view('emails.successRegistration');
    }
}