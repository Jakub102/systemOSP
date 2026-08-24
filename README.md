
> W Expo Go Firebase nie działa natywnie. Aplikacja automatycznie uruchamia mock, po 5 sekundach pojawia się testowy alarm.



Przed prebuild umieść `google-services.json` w `android/app/`.  
Ustaw zmienną środowiskową `EXPO_PUBLIC_API_URL` w pliku `.env`.

 `POST`  `/auth/login`  Logowanie, zwraca `{ token }` 
 `POST`  `/devices/register`  Rejestracja tokenu FCM 
 `POST`  `/devices/unregister` | Wyrejestrowanie tokenu FCM (logout) 
 `POST`  `/alarms/{alarmId}/respond`  Decyzja: `{ decision: 'going' \| 'not_going' }` 
 `GET`  `/alarms/history?page=N` | Historia alarmów użytkownika 

Wszystkie endpointy (poza `/auth/login`) wymagają nagłówka `Authorization: Bearer <token>`.  
Odpowiedź `401` automatycznie wylogowuje użytkownika i przekierowuje do `LoginScreen`.

## Dźwięk alarmu

Apka na wierzchu: `onMessage` wchodzi prosto na `AlarmScreen`, a `useAlarmSound` gra
`assets/sounds/syrena.wav` w pętli (expo-av) aż do odpowiedzi. Bez powiadomienia w belce,
żeby dźwięk nie grał podwójnie.

Apka w tle / ubita: `setBackgroundMessageHandler` wystawia lokalne powiadomienie na kanale
`osp-alarm-v2` (importance MAX, `soundName: syrena.wav`, akcje JADĘ / NIE JADĘ).

Wymagania po stronie serwera: wiadomości FCM **wyłącznie z polem `data`**. Jeśli payload
zawiera `notification`, Android sam wyświetli powiadomienie i handler tła się nie odpali.

Plik dźwięku trafia do `android/app/src/main/res/raw/` przez `plugins/withAlarmSound.js`
(folder `android/` jest generowany, więc ręcznie wrzucony plik zniknąłby przy prebuildzie).
Nazwa musi być zgodna z zasadami zasobów Androida: małe litery, bez myślników.

> Ustawienia kanału są niezmienne po utworzeniu. Zmiana dźwięku wymaga podbicia
> `ALARM_CHANNEL_ID` w `AlarmService.ts` (stare id trafia do `LEGACY_CHANNEL_IDS`
> i jest kasowane przy starcie), inaczej na już zainstalowanych telefonach nic się nie zmieni.
