<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <tr>
        <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <tr>
                    <td align="center" style="background-color: #1a202c; padding: 30px 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">
                            System <span style="color: #e3342f;">OSP</span>
                        </h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 40px 30px 20px 30px; color: #2d3748; font-size: 16px; line-height: 1.6;">
                        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold; color: #1a202c;">
                            Dzień dobry,
                        </p>
                        <p style="margin: 0 0 20px 0;">
                            Zostałeś zaproszony do dołączenia do systemu OSP dla jednostki: <strong style="color: #1a202c;">{{ $firehouse }}</strong>.
                        </p>
                        <p style="margin: 0 0 30px 0;">
                            Aby dokończyć rejestrację i utworzyć konto, kliknij w poniższy przycisk:
                        </p>

                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td align="center" style="padding: 10px 0 30px 0;">
                                    <a href="{{ $url }}" target="_blank" style="background-color: #e3342f; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                                        Zarejestruj się
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff5f5; border-left: 4px solid #e3342f; border-radius: 4px; margin-bottom: 30px;">
                            <tr>
                                <td style="padding: 12px 15px; font-size: 14px; color: #742a2a;">
                                    Link jest ważny przez 48 godzin (wygasa: <strong>{{ $invitation->expires_at->format('d.m.Y H:i') }}</strong>).
                                </td>
                            </tr>
                        </table>

                        <p style="margin: 0; font-size: 14px; color: #718096;">
                            Jeśli to nie Ty byłeś adresatem, zignoruj tę wiadomość.
                        </p>
                    </td>
                </tr>

                <tr>
                    <td align="center" style="padding: 20px 30px 40px 30px; color: #a0aec0; font-size: 12px;">
                        <p style="margin: 0;">Wiadomość wygenerowana automatycznie przez system OSP. Prosimy na nią nie odpowiadać.</p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>