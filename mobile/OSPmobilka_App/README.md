# OSP Mobilka - Aplikacja Powiadamiania Alarmowego

System mobilny dla strażaków OSP wspierający alarmowanie, potwierdzanie wyjazdu oraz nawigację do remizy.

##Tech Stack (Frontend)
- **Framework:** React Native (Expo)
- **Język:** JavaScript (ES6+)
- **Nawigacja:** React Navigation (Stack)
- **Komunikacja:** Axios (z interceptorami auth)
- **Powiadomienia:** Firebase Cloud Messaging (FCM) + Native Push Notifications

##Architektura Systemu

### 1. Alarmowanie (FCM)
Aplikacja oczekuje na powiadomienia typu **Data Message** z Firebase. Backend powinien wysyłać obiekt `data` o następującej strukturze:

```json
{
  "alarmId": "UUID",
  "incidentType": "POŻAR BUDYNKU",
  "address": "ul. Przykładowa 10, Miasto",
  "priority": "ALARMOWY",
  "notes": "Możliwe osoby w środku",
  "stationLat": "52.1234",
  "stationLng": "21.1234",
  "responseDeadlineMinutes": "5"
}
```

### 2. Flow Użytkownika
1. **Odebranie Alarmu:** Po otrzymaniu FCM, aplikacja otwiera `AlarmScreen`. System uruchamia wibracje i dźwięk (zarządzane przez `useAlarm.js`).
2. **Decyzja:** Użytkownik klika **JADĘ** (`going`) lub **ODWOŁAJ** (`not_going`).
3. **Potwierdzenie:** Aplikacja wysyła POST do `/api/alarms/{alarmId}/respond` i przechodzi do `AlarmConfirmScreen`.
4. **Nawigacja:** W przypadku potwierdzenia wyjazdu, użytkownik ma dostęp do szybkich linków nawigacyjnych do remizy (Google Maps / Waze).
5. **Monitoring Załogi:** Aplikacja wykonuje polling (co 5s) lub oczekuje na aktualizację listy załogi przez API, aby wyświetlić kto jeszcze jedzie.

## Integracja API (Backend Requirements)

Główny serwis komunikacyjny znajduje się w `AlarmService.js`. Wymagane endpointy:

### `POST /api/devices/register`
Rejestracja tokenu FCM urządzenia.
- **Body:** `{ token: string, platform: 'android' | 'ios' }`
- **Auth:** Wymagany Bearer Token.

### `POST /api/alarms/{alarmId}/respond`
Wysłanie decyzji strażaka.
- **Body:** `{ decision: 'going' | 'not_going' }`

### `GET /api/alarms/{alarmId}/details`
Pobranie aktualnego stanu załogi dla konkretnego alarmu.
- **Response:**
```json
{
  "respondents": [
    { "userId": "1", "name": "JAN KOWALSKI", "status": "going", "role": "DOWÓDCA" },
    { "userId": "2", "name": "ADAM NOWAK", "status": "going", "role": "KIEROWCA" }
  ]
}
```

### `GET /api/alarms/history`
Pobranie historii alarmów użytkownika (paginacja).

## Design Guidelines
Aplikacja używa **High-Contrast Alarm UI**:
- **Baza:** Jasne tło (`#F2F2F7`), białe karty.
- **Akcenty:** Czerwony (`#FF3B30`) dla alarmów, Zielony (`#34C759`) dla potwierdzeń.
- **Typografia:** Wielkie litery (Caps), czarny tekst (`#000000`), wysoki stopień pogrubienia (900).
- **Karty:** Obowiązkowy gruby lewy margines (6-8px) w kolorze statusu.

## Uruchomienie
1. `cd OSPmobilka_App`
2. `npm install`
3. `npx expo start`
