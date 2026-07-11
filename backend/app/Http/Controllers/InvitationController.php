<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Mail\UserInvitationMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    /**
     * Krok 1: Administrator tworzy lub aktualizuje zaproszenie
     */
    public function store(Request $request): JsonResponse
    {
        // Walidacja danych wejściowych
        // Usunęliśmy 'unique:invitations,email', zostawiając tylko sprawdzenie, czy konto nie jest już zarejestrowane
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'unique:accounts,email'],
            'role_id' => ['required', 'exists:roles,id'],
            'firehouse_id' => ['required', 'exists:firehouse,id'], // Poprawione z firehouse na firehouses (liczba mnoga)
        ], [
            'email.unique' => 'Konto z tym adresem e-mail jest już zarejestrowane w systemie.',
        ]);

        // Szukamy istniejącego zaproszenia dla tego maila lub tworzymy pusty obiekt modelu
        $invitation = Invitation::firstOrNew(['email' => $data['email']]);

        // Nadpisujemy / ustawiamy nowe dane, świeży token oraz resetujemy czas do 48 godzin
        $invitation->role_id = $data['role_id'];
        $invitation->firehouse_id = $data['firehouse_id'];
        $invitation->token = Str::random(64);
        $invitation->expires_at = now()->addHours(48);
        $invitation->used_at = null; // Na wypadek, gdyby admin chciał reaktywować stare zaproszenie
        
        // Zapis do bazy (Laravel sam wie, czy zrobić INSERT czy UPDATE na podstawie firstOrNew)
        $invitation->save();

        // Wysyłka maila z nowym tokenem
        Mail::to($invitation->email)->send(new UserInvitationMail($invitation));

        // Sprawdzamy czy rekord istniał wcześniej, aby zwrócić ładny komunikat w API
        $message = $invitation->wasRecentlyCreated 
            ? 'Zaproszenie zostało pomyślnie wysłane.' 
            : 'Zaproszenie istniało w bazie. Token, czas wygaśnięcia oraz dane zostały zaktualizowane, a mail wysłany ponownie.';

        return response()->json([
            'message' => $message,
        ], $invitation->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Krok 2: Frontend pyta API, czy token z URL jest poprawny zanim wyświetli formularz
     */
    public function verify(string $token): JsonResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation || !$invitation->isValid()) {
            return response()->json([
                'message' => 'Token jest nieprawidłowy, został już użyty lub wygasł.'
            ], 410);
        }

        return response()->json([
            'email' => $invitation->email,
            'role_id' => $invitation->role_id,
            'firehouse_id' => $invitation->firehouse_id,
        ], 200);
    }

    public function destroy(Invitation $invitation): JsonResponse
    {
        // Usunięcie zaproszenia natychmiast unieważnia wysłany token
        $invitation->delete();

        return response()->json([
        'message' => 'Zaproszenie zostało pomyślnie anulowane.'
        ], 200);
    }  
}