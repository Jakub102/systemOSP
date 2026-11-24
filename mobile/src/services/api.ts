import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Jeden klient HTTP dla calej aplikacji. Wydzielony z AlarmService, zeby
// zadanie lokalizacji w tle moglo z niego korzystac bez wciagania Firebase
// i powiadomien do kontekstu, ktory dziala przy zamknietej aplikacji.

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export const IS_MOCK_API = !API_BASE || API_BASE.includes('your-osp-backend');

export const api = axios.create({
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
