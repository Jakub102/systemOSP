import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { subHours, subDays } from 'date-fns';
import type {
  AlarmData,
  AlarmHistoryResponse,
  LoginResponse,
  MeResponse,
  UserProfile,
} from './types';

const isNative = !!NativeModules.RNPushNotification || !!NativeModules.RNFBAppModule;

type MessagingFn = () => FirebaseMessagingTypes.Module;
type PushNotificationModule = {
  createChannel: (channel: Record<string, unknown>, callback: () => void) => void;
  deleteChannel: (channelId: string) => void;
  localNotification: (details: Record<string, unknown>) => void;
  cancelLocalNotification: (id: string) => void;
};

export const ALARM_CHANNEL_ID = 'osp-alarm-v2';
const LEGACY_CHANNEL_IDS = ['osp-alarm'];
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

export const IS_MOCK_API = !API_BASE || API_BASE.includes('your-osp-backend');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

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
    invokeApp: true,
    userInfo: alarmToPayload(alarm),
  });
};

export const cancelAlarmNotification = (alarmId: string) => {
  PushNotification?.cancelLocalNotification(notificationIdFor(alarmId));
};

let backgroundHandlerRegistered = false;

export const registerBackgroundHandler = () => {
  if (!messagingFn || backgroundHandlerRegistered) return;

  try {
    messagingFn().setBackgroundMessageHandler(async (remoteMessage) => {
      const alarm = parseAlarmData(remoteMessage.data);
      if (!alarm) return;

      setupNotificationChannels();
      showAlarmNotification(alarm);
    });
    backgroundHandlerRegistered = true;
  } catch (e) {
   
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
  await new Promise((resolve) => setTimeout(resolve, 400));
  console.log(`Odpowiedź na alarm ${alarmId}: ${status}`);
  return { success: true };
};

export const fetchAlarmHistory = async (page = 1): Promise<AlarmHistoryResponse> => {
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

export const getDeviceName = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem('deviceName');
  if (stored) return stored;

  const generated = `${Platform.OS}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem('deviceName', generated);
  return generated;
};

const persistProfile = async (user?: UserProfile | null): Promise<void> => {
  if (!user) return;

  const entries: [string, string][] = [];

  const fullName = user.full_name?.trim();
  if (fullName) entries.push(['userName', fullName]);

  const lat = toNumberOrNull(user.firehouse?.latitude);
  const lng = toNumberOrNull(user.firehouse?.longitude);
  if (lat !== null && lng !== null) {
    entries.push(['stationLat', String(lat)], ['stationLng', String(lng)]);
  }

  if (entries.length) await AsyncStorage.multiSet(entries);
};

export const login = async (email: string, password: string): Promise<UserProfile> => {
  const deviceName = await getDeviceName();

  const { data } = await api.post<LoginResponse>('/login', {
    email: email.trim(),
    password,
    device_name: deviceName,
  });

  if (!data?.token) throw new Error('Serwer nie zwrocil tokenu logowania');

  await AsyncStorage.setItem('authToken', data.token);
  await persistProfile(data.user);

  return data.user;
};

export const fetchMe = async (): Promise<UserProfile | null> => {
  const { data } = await api.get<MeResponse>('/me');
  await persistProfile(data?.user);
  return data?.user ?? null;
};

export const getStationCoords = async (): Promise<{ lat: number; lng: number } | null> => {
  const stored = await AsyncStorage.multiGet(['stationLat', 'stationLng']);
  const lat = toNumberOrNull(stored[0]?.[1]);
  const lng = toNumberOrNull(stored[1]?.[1]);

  return lat !== null && lng !== null ? { lat, lng } : null;
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
    if (token) await api.post('/logout').catch(() => {});
  } finally {
    await AsyncStorage.multiRemove([
      'authToken',
      'userName',
      'available',
      'stationLat',
      'stationLng',
    ]);
  }
};
