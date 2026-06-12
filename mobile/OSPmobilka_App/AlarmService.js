// AlarmService.js
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { subHours, subDays } from 'date-fns';

const isNative = !!NativeModules.RNPushNotification || !!NativeModules.RNFBAppModule;

let messaging = null;
let PushNotification = null;

if (isNative) {
  try {
    messaging = require('@react-native-firebase/messaging').default;
    PushNotification = require('react-native-push-notification');
  } catch (e) {
    console.log('Moduły natywne niedostępne, tryb demo');
  }
}

const API_BASE = 'https://your-osp-backend.pl/api'; // ← ZMIEŃ NA SWÓJ URL
const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

// Interceptor — dołącza token autoryzacji do każdego żądania
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor — jednolita obsługa błędów
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let customMessage = 'Wystąpił nieznany błąd';
    if (error.code === 'ECONNABORTED') {
      customMessage = 'Przekroczono czas połączenia z serwerem';
    } else if (!error.response) {
      customMessage = 'Brak połączenia z serwerem';
    } else {
      customMessage = error.response.data?.message || `Błąd serwera: ${error.response.status}`;
    }
    error.customMessage = customMessage;
    return Promise.reject(error);
  }
);

export const setupNotificationChannels = () => {
  if (PushNotification?.createChannel) {
    PushNotification.createChannel({
      channelId: 'osp-alarm',
      channelName: 'Alarmy OSP',
      importance: 4,
      playSound: true,
    }, () => {});
  }
};

export const initFCM = async (onAlarmReceived) => {
  if (!messaging) {
    console.warn('Tryb Demo: Push wyłączone w Expo Go');
    setTimeout(() => {
      onAlarmReceived?.({
        alarmId: 'TEST-1',
        incidentType: 'POŻAR LASU',
        address: 'Florianów, ul. Leśna 5',
        priority: 'ALARMOWY',
        notes: 'Zagrożone zabudowania',
      });
    }, 5000);
    return null;
  }

  const token = await messaging().getToken();
  await registerDeviceToken(token);

  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage.data;
    if (data?.alarmId) {
      onAlarmReceived?.({
        alarmId: data.alarmId,
        incidentType: data.incidentType || 'ALARM',
        address: data.address || '',
        priority: data.priority || '',
        notes: data.notes || '',
        stationLat: data.stationLat ? parseFloat(data.stationLat) : null,
        stationLng: data.stationLng ? parseFloat(data.stationLng) : null,
        responseDeadlineMinutes: data.responseDeadlineMinutes
          ? parseInt(data.responseDeadlineMinutes)
          : 3,
      });
    }
  });

  return unsubscribe;
};

export const sendAlarmResponse = async (alarmId, status) => {
  // Tryb mock — symulacja opóźnienia sieciowego
  await new Promise(resolve => setTimeout(resolve, 400));
  console.log(`[MOCK] Odpowiedź na alarm ${alarmId}: ${status}`);
  return { success: true };
};

export const fetchAlarmDetails = async (alarmId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    respondents: [
      { userId: '1', name: 'Jan Kowalski', status: 'going', role: 'Dowódca' },
      { userId: '2', name: 'Adam Nowak', status: 'going', role: 'Kierowca' },
      { userId: '3', name: 'Piotr Wiśniewski', status: 'not_going', role: 'Strażak' },
    ]
  };
};

export const fetchAlarmHistory = async (page = 1) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const now = new Date();
  return {
    alarms: [
      { alarmId: 'H-001', incidentType: 'Pożar lasu', address: 'ul. Leśna 5, Florianów', myStatus: 'going', goingCount: 4, createdAt: subHours(now, 1).toISOString() },
      { alarmId: 'H-002', incidentType: 'Wypadek drogowy', address: 'DK7 km 142, Florianów', myStatus: 'not_going', goingCount: 6, createdAt: subDays(now, 1).toISOString() },
      { alarmId: 'H-003', incidentType: 'Pożar budynku', address: 'ul. Strażacka 3', myStatus: 'no_answer', goingCount: 3, createdAt: subDays(now, 2).toISOString() },
    ]
  };
};

export const registerDeviceToken = async (token) => {
  try {
    await api.post('/devices/register', { token, platform: 'android' });
  } catch (e) {
    console.warn('Rejestracja tokenu nieudana:', e.message);
  }
};
