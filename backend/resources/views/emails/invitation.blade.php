<p>Dzień dobry,</p>
<p>Zostałeś zaproszony do dołączenia do systemu OSP dla jednostki: <strong>{{ $firehouse }}</strong>.</p>
<p>Aby dokończyć rejestrację i utworzyć konto, kliknij w poniższy link:</p>
<p><a href="{{ $url }}" style="background: #e3342f; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Zarejestruj się</a></p>
<p>Link jest ważny przez 48 godzin (wygasa: {{ $invitation->expires_at->format('d.m.Y H:i') }}).</p>
<p>Jeśli to nie Ty byłeś adresatem, zignoruj tę wiadomość.</p>