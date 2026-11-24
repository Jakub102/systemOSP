import { NativeModules, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { stopTracking } from './LocationService';
import { subHours, subDays } from 'date-fns';
import type {
  AlarmData,
  AlarmHistoryResponse,
  LoginResponse,
  MeResponse,
  UserProfile,
} from '../types';

const isNative = !!NativeModules.RNFBAppModule;

type MessagingFn = () => FirebaseMessagingTypes.Module;

// Ustawienia kanalu sa w Androidzie niezmienne po jego utworzeniu, wiec kazda
// zmiana dzwieku albo kategorii audio wymaga NOWEGO id. Stare kasujemy nizej.
export const ALARM_CHANNEL_ID = 'osp-alarm-v4';
const LEGACY_CHANNEL_IDS = ['osp-alarm', 'osp-alarm-v2', 'osp-alarm-v3'];
const ALARM_SOUND = 'syrena.wav';
// Identyfikator kategorii nie moze zawierac znakow ':' ani '-'.
export const ALARM_CATEGORY_ID = 'ospalarm';
export const ACTION_GOING = 'going';
export const ACTION_NOT_GOING = 'notgoing';
const ALARM_TOPIC = 'system-alert';

let messagingFn: MessagingFn | null = null;

if (isNative) {
  try {
    messagingFn = require('@react-native-firebase/messaging').default as MessagingFn;
  } catch {
    console.log('Moduly natywne niedostepne, tryb demo');
  }
}

// Alarm na pierwszym planie obsluguje AlarmScreen z wlasna syrena, wiec
// powiadomienie w belce byloby drugim zrodlem dzwieku.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Klient HTTP i tryb mock mieszkaja teraz w api.ts. Reeksport zostawiamy,
// zeby ekrany importujace je z AlarmService dzialaly bez zmian.
export { IS_MOCK_API, setUnauthorizedHandler } from './api';

const VIBRATION_PATTERN = [0, 800, 200, 800, 200, 1000];

/**
 * Kanal alarmowy i przyciski powiadomienia.
 *
 * Kluczowe jest audioAttributes.usage ustawione na ALARM: dzieki temu syrena
 * gra na strumieniu alarmowym, a nie multimediow, wiec wyciszona muzyka nie
 * ucisza alarmu. bypassDnd pozwala przebic tryb "Nie przeszkadzac".
 */
export const setupNotificationChannels = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;

  await Promise.all(
    LEGACY_CHANNEL_IDS.map((id) =>
      Notifications.deleteNotificationChannelAsync(id).catch(() => {}),
    ),
  );

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Alarmy OSP',
    description: 'Wezwania do wyjazdu - syrena i wibracja',
    importance: Notifications.AndroidImportance.MAX,
    sound: ALARM_SOUND,
    vibrationPattern: VIBRATION_PATTERN,
    enableVibrate: true,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      flags: {
        enforceAudibility: true,
        requestHardwareAudioVideoSynchronization: false,
      },
    },
  });

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    {
      identifier: ACTION_GOING,
      buttonTitle: 'JADĘ',
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_NOT_GOING,
      buttonTitle: 'NIE JADĘ',
      options: { opensAppToForeground: false },
    },
  ]);
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
  // backend (FcmService) wysyla incident_id, category_name itd. a nie alarmId
  const alarmId = payload?.alarmId ?? payload?.incident_id;
  if (typeof alarmId !== 'string' || !alarmId) return null;

  const deadline = toNumberOrNull(payload?.responseDeadlineMinutes);

  let incidentType = toStringOr(payload?.incidentType, '');
  if (!incidentType) {
    const category = toStringOr(payload?.category_name, 'ALARM');
    const sub = toStringOr(payload?.sub_category, '');
    incidentType = sub ? `${category} - ${sub}` : category;
  }

  return {
    alarmId,
    incidentType: incidentType.toUpperCase(),
    address: toStringOr(payload?.address, ''),
    priority: toStringOr(payload?.priority, ''),
    notes: toStringOr(payload?.notes, toStringOr(payload?.description, '')),
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

export const showAlarmNotification = async (
  alarm: AlarmData,
  delaySeconds = 0,
): Promise<void> => {
  // Kanal podaje sie w triggerze. Przy trigger: null Android publikuje
  // powiadomienie na kanale domyslnym, czyli bez syreny, bez wlasnej
  // wibracji i bez obejscia trybu Nie przeszkadzac.
  const trigger: Notifications.NotificationTriggerInput =
    delaySeconds > 0
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          repeats: false,
          channelId: ALARM_CHANNEL_ID,
        }
      : { channelId: ALARM_CHANNEL_ID };

  await Notifications.scheduleNotificationAsync({
    // alarmId jako identyfikator powiadomienia - ten sam alarm nie zdubluje sie
    // w belce i da sie je potem skasowac po odpowiedzi.
    identifier: alarm.alarmId,
    content: {
      title: alarm.incidentType,
      body: [alarm.address, alarm.notes].filter(Boolean).join('\n') ||
        'Wezwanie do wyjazdu',
      data: alarmToPayload(alarm),
      sound: ALARM_SOUND,
      vibrate: VIBRATION_PATTERN,
      priority: 'max',
      categoryIdentifier: ALARM_CATEGORY_ID,
      autoDismiss: true,
    },
    trigger,
  });
};

export const cancelAlarmNotification = (alarmId: string) => {
  Notifications.dismissNotificationAsync(alarmId).catch(() => {});
};

let backgroundHandlerRegistered = false;

export const registerBackgroundHandler = () => {
  if (!messagingFn || backgroundHandlerRegistered) return;

  try {
    messagingFn().setBackgroundMessageHandler(async (remoteMessage) => {
      const alarm = parseAlarmData(remoteMessage.data);
      if (!alarm) return;

      await setupNotificationChannels();
      await showAlarmNotification(alarm);
    });
    backgroundHandlerRegistered = true;
  } catch (e) {
   
    console.warn('Nie udało się zarejestrować handlera tła:', e);
  }
};

/** Uprawnienie do powiadomien (Android 13+ oraz iOS). */
export const requestPushPermission = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
};

/** Czy aplikacja moze dzis wyswietlac powiadomienia - do ostrzezenia w UI. */
export const hasNotificationPermission = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
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

  // backend wysyla alarmy na topic, wiec trzeba sie zapisac
  try {
    await messagingFn().subscribeToTopic(ALARM_TOPIC);
  } catch (e) {
    console.warn('Nie udalo sie zapisac na topic:', e);
  }

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
    // po wylogowaniu telefon nie powinien dostawac alarmow
    await messagingFn?.().unsubscribeFromTopic(ALARM_TOPIC).catch(() => {});
    // Wylogowany telefon nie ma po co nadawac pozycji.
    await stopTracking().catch(() => {});
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
