import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { subHours, subDays } from 'date-fns';
import type { AlarmData, AlarmHistoryResponse } from './types';

const isNative = !!NativeModules.RNPushNotification || !!NativeModules.RNFBAppModule;

type MessagingFn = () => FirebaseMessagingTypes.Module;
type PushNotificationModule = {
  createChannel: (channel: Record<string, unknown>, callback: () => void) => void;
  deleteChannel: (channelId: string) => void;
  localNotification: (details: Record<string, unknown>) => void;
  cancelLocalNotification: (id: string) => void;
};

// Ustawienia kanału (dźwięk, ważność) są w Androidzie niezmienne po jego
// utworzeniu - każda zmiana dźwięku wymaga NOWEGO channelId, inaczej na już
// zainstalowanych telefonach nic się nie zmieni. Stare kanały kasujemy niżej.
export const ALARM_CHANNEL_ID = 'osp-alarm-v2';
const LEGACY_CHANNEL_IDS = ['osp-alarm'];
// Plik z android/app/src/main/res/raw (kopiowany przez plugins/withAlarmSound.js)
const ALARM_SOUND = 'syrena.wav';

let messagingFn: MessagingFn | null = null;
let PushNotification: PushNotificationModule | null = null;

if (isNative) {
  try {
    messagingFn = require('@react-native-firebase/messaging').default as MessagingFn;
    PushNotification = require('react-native-push-notification') as PushNotificationModule;
  } catch {
    console.log('Moduły natywne niedostępne, tryb demo');
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

// Callback rejestrowany przez App.tsx, wywoływany przy odpowiedzi 401
let onUnauthorizedCallback: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorizedCallback = handler;
};

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        AsyncStorage.removeItem('authToken').catch(() => {});
        onUnauthorizedCallback?.();
      }
      let customMessage = 'Wystąpił nieznany błąd';
      if (error.code === 'ECONNABORTED') {
        customMessage = 'Przekroczono czas połączenia z serwerem';
      } else if (!error.response) {
        customMessage = 'Brak połączenia z serwerem';
      } else {
        customMessage =
          (error.response.data as { message?: string })?.message ??
          `Błąd serwera: ${error.response.status}`;
      }
      (error as typeof error & { customMessage: string }).customMessage = customMessage;
    }
    return Promise.reject(error);
  },
);

export const setupNotificationChannels = () => {
  LEGACY_CHANNEL_IDS.forEach((channelId) => PushNotification?.deleteChannel(channelId));

  PushNotification?.createChannel(
    {
      channelId: ALARM_CHANNEL_ID,
      channelName: 'Alarmy OSP',
      channelDescription: 'Wezwania do wyjazdu - syrena i wibracja',
      importance: 5, // MAX: heads-up + dźwięk
      soundName: ALARM_SOUND,
      playSound: true,
      vibrate: true,
    },
    () => {},
  );
};

const toNumberOrNull = (value: unknown): number | null => {
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const toStringOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value ? value : fallback;

/**
 * Wspólny parser payloadu: FCM (onMessage / tło) i userInfo z powiadomienia
 * przekazują wszystko jako stringi.
 */
export const parseAlarmData = (
  payload: Record<string, unknown> | null | undefined,
): AlarmData | null => {
  const alarmId = payload?.alarmId;
  if (typeof alarmId !== 'string' || !alarmId) return null;

  const deadline = toNumberOrNull(payload?.responseDeadlineMinutes);

  return {
    alarmId,
    incidentType: toStringOr(payload?.incidentType, 'ALARM'),
    address: toStringOr(payload?.address, ''),
    priority: toStringOr(payload?.priority, ''),
    notes: toStringOr(payload?.notes, ''),
    stationLat: toNumberOrNull(payload?.stationLat),
    stationLng: toNumberOrNull(payload?.stationLng),
    responseDeadlineMinutes: deadline ?? 3,
  };
};

// Powrót do płaskich stringów - tylko takie userInfo przeżywa drogę
// przez powiadomienie systemowe.
const alarmToPayload = (alarm: AlarmData): Record<string, string> => ({
  alarmId: alarm.alarmId,
  incidentType: alarm.incidentType,
  address: alarm.address,
  priority: alarm.priority,
  notes: alarm.notes,
  stationLat: String(alarm.stationLat ?? ''),
  stationLng: String(alarm.stationLng ?? ''),
  responseDeadlineMinutes: String(alarm.responseDeadlineMinutes ?? 3),
});

// Stabilne, dodatnie id powiadomienia dla danego alarmu - żeby dało się
// je potem skasować i żeby ten sam alarm nie zdublował się w belce.
const notificationIdFor = (alarmId: string): string => {
  let hash = 0;
  for (let i = 0; i < alarmId.length; i++) {
    hash = (hash * 31 + alarmId.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash) % 2147483647);
};

export const showAlarmNotification = (alarm: AlarmData) => {
  PushNotification?.localNotification({
    channelId: ALARM_CHANNEL_ID,
    id: notificationIdFor(alarm.alarmId),
    title: alarm.incidentType,
    message: alarm.address || 'Wezwanie do wyjazdu',
    bigText: [alarm.address, alarm.notes].filter(Boolean).join('\n'),
    priority: 'max',
    importance: 'max',
    soundName: ALARM_SOUND,
    playSound: true,
    vibrate: true,
    vibration: 1000,
    autoCancel: true,
    actions: ['JADĘ', 'NIE JADĘ'],
    invokeApp: true, // akcja podnosi apkę - pewniejsze niż headless JS
    userInfo: alarmToPayload(alarm),
  });
};

export const cancelAlarmNotification = (alarmId: string) => {
  PushNotification?.cancelLocalNotification(notificationIdFor(alarmId));
};

let backgroundHandlerRegistered = false;

/**
 * Powiadomienia, gdy apka jest w tle lub ubita. Wymaga wiadomości FCM
 * wyłącznie z polem `data` - przy payloadzie `notification` Android wyświetli
 * powiadomienie sam i ten handler się nie odpali.
 * Musi być wywołane poza cyklem życia komponentów (patrz App.tsx).
 */
export const registerBackgroundHandler = () => {
  if (!messagingFn || backgroundHandlerRegistered) return;

  try {
    messagingFn().setBackgroundMessageHandler(async (remoteMessage) => {
      const alarm = parseAlarmData(remoteMessage.data);
      if (!alarm) return;

      // Apka mogła nie wystartować od ostatniej instalacji - kanał musi istnieć
      setupNotificationChannels();
      showAlarmNotification(alarm);
    });
    backgroundHandlerRegistered = true;
  } catch (e) {
    // Bez google-services.json messaging() rzuca od razu. To leci na poziomie
    // modułu, więc bez tego łapania cała apka wywala się na starcie.
    console.warn('Nie udało się zarejestrować handlera tła:', e);
  }
};

const requestPushPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Uprawnienie do powiadomień',
      message:
        'Aplikacja wymaga uprawnień do wysyłania powiadomień push, aby alarmować o zdarzeniach. Bez tego alarmy nie będą docierać.',
      buttonPositive: 'Zezwól',
      buttonNegative: 'Odmów',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const initFCM = async (
  onAlarmReceived: (data: AlarmData) => void,
): Promise<(() => void) | null> => {
  if (!messagingFn) {
    console.warn('Tryb Demo: Push wyłączone w Expo Go');
    setTimeout(() => {
      onAlarmReceived({
        alarmId: 'TEST-1',
        incidentType: 'POŻAR LASU',
        address: 'Florianów, ul. Leśna 5',
        priority: 'ALARMOWY',
        notes: 'Zagrożone zabudowania',
      });
    }, 5000);
    return null;
  }

  const granted = await requestPushPermission();
  if (!granted) {
    console.warn('[FCM] Użytkownik odmówił uprawnień do powiadomień');
    return null;
  }

  const token = await messagingFn().getToken();
  await registerDeviceToken(token);

  const unsubscribeTokenRefresh = messagingFn().onTokenRefresh(async (newToken) => {
    await registerDeviceToken(newToken);
  });

  // Apka na wierzchu: bez powiadomienia w belce - od razu pełny ekran alarmu
  // z syreną (useAlarmSound), inaczej dźwięk grałby podwójnie.
  const unsubscribeMessage = messagingFn().onMessage(async (remoteMessage) => {
    const alarm = parseAlarmData(remoteMessage.data);
    if (alarm) onAlarmReceived(alarm);
  });

  return () => {
    unsubscribeMessage();
    unsubscribeTokenRefresh();
  };
};

export const sendAlarmResponse = async (
  alarmId: string,
  status: string,
): Promise<{ success: boolean }> => {
  // tymczasowo: endpoint /alarms/{id}/respond nie jest jeszcze podłączony
  await new Promise((resolve) => setTimeout(resolve, 400));
  console.log(`Odpowiedź na alarm ${alarmId}: ${status}`);
  return { success: true };
};

export const fetchAlarmHistory = async (page = 1): Promise<AlarmHistoryResponse> => {
  // dane przykładowe, dopóki nie ma GET /alarms/history
  void page;
  await new Promise((resolve) => setTimeout(resolve, 300));
  const now = new Date();
  return {
    alarms: [
      {
        alarmId: 'H-001',
        incidentType: 'Pożar lasu',
        address: 'ul. Leśna 5, Florianów',
        myStatus: 'going',
        createdAt: subHours(now, 1).toISOString(),
      },
      {
        alarmId: 'H-002',
        incidentType: 'Wypadek drogowy',
        address: 'DK7 km 142, Florianów',
        myStatus: 'not_going',
        createdAt: subDays(now, 1).toISOString(),
      },
      {
        alarmId: 'H-003',
        incidentType: 'Pożar budynku',
        address: 'ul. Strażacka 3',
        myStatus: 'no_answer',
        createdAt: subDays(now, 2).toISOString(),
      },
    ],
  };
};

export const registerDeviceToken = async (token: string): Promise<void> => {
  try {
    await api.post('/devices/register', { token, platform: Platform.OS });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('Rejestracja tokenu nieudana:', message);
  }
};

export const logout = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token && messagingFn) {
      const fcmToken = await messagingFn().getToken();
      await api.post('/devices/unregister', { token: fcmToken }).catch(() => {});
    }
  } finally {
    await AsyncStorage.multiRemove(['authToken', 'userName', 'available']);
  }
};
