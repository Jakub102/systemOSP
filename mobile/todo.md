# TODO

- [ ] ustawić EXPO_PUBLIC_API_URL w .env (i dorzucić .env.example)
- [ ] podłączyć prawdziwe API zamiast mocków w AlarmService (sendAlarmResponse, fetchAlarmHistory)
- [ ] dodać GET /users/me i pobierać imię strażaka po zalogowaniu (teraz na sztywno "STRAŻAK")
- [ ] wrzucić google-services.json do android/app/ po prebuild
- [ ] sprawdzić czy alarm przebija tryb cichy / DND (critical alerts)
- [ ] podmienić wygenerowaną syrenę (assets/sounds/syrena.wav) na docelowe nagranie
- [ ] serwer musi wysyłać FCM data-only (payload `notification` ubija handler tła)
- [ ] przetestować na fizycznym Androidzie 13+: uprawnienie POST_NOTIFICATIONS, kanał, akcje z powiadomienia
- [ ] podmienić domyślne ikony Expo na branding OSP (icon, splash, adaptive)
- [ ] eas.json + test buildu APK (eas build -p android --profile development)
- [ ] ogarnąć strukturę - przenieść do src/ (screens, hooks, services)

zrobione:
- [x] syrena w pętli na ekranie alarmu (expo-av, useAlarmSound)
- [x] własny dźwięk kanału osp-alarm-v2 + plugin kopiujący plik do res/raw
- [x] setBackgroundMessageHandler - powiadomienia gdy apka uśpiona/ubita
- [x] akcje JADĘ / NIE JADĘ w powiadomieniu + kasowanie go po odpowiedzi
- [x] logowanie + token w AsyncStorage
- [x] ekran alarmu z timerem i wibracją
- [x] historia wyjazdów (na mockach)
- [x] obsługa 401 -> wylogowanie
- [x] baner offline
