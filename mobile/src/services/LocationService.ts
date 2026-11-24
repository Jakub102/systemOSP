import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { api, IS_MOCK_API } from './api';

// Nazwa zadania musi byc stala, bo system odwoluje sie do niej takze wtedy,
// gdy aplikacja jest zamknieta, a proces zostal wskrzeszony przez Androida.
export const LOCATION_TASK = 'osp-location-tracking';

// Pod tym kluczem trzyma sie id zdarzenia, do ktorego jedzie strazak. Zadanie
// w tle nie ma dostepu do stanu Reacta, wiec musi odczytac je z pamieci.
const INCIDENT_KEY = 'trackingIncidentId';

const UPDATE_INTERVAL_MS = 15000;
const UPDATE_DISTANCE_M = 50;

export type TrackingPermission = 'granted' | 'foreground-only' | 'denied';

interface TrackResponse {
  message?: string;
  attendance_status?: string;
  distance_meters?: number;
  should_stop_tracking?: boolean;
}

export const isTracking = async (): Promise<boolean> => {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    return false;
  }
};

export const stopTracking = async (): Promise<void> => {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  } catch (e) {
    console.warn('[GPS] nie udalo sie zatrzymac sledzenia:', e);
  }

  await AsyncStorage.removeItem(INCIDENT_KEY).catch(() => {});
};

// Zwraca true, gdy serwer uznal, ze strazak dotarl na miejsce i mozna
// przestac nadawac pozycje.
const sendPosition = async (
  incidentId: string,
  latitude: number,
  longitude: number,
): Promise<boolean> => {
  if (IS_MOCK_API) {
    console.log(
      `[GPS] mock, zdarzenie ${incidentId}: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    );
    return false;
  }

  try {
    const { data } = await api.post<TrackResponse>(
      `/incidents/${incidentId}/track`,
      { latitude, longitude },
    );

    if (data?.should_stop_tracking) {
      await stopTracking();
      return true;
    }
  } catch (e) {
    // Dziura w zasiegu w drodze do remizy to norma, kolejna pozycja poleci
    // za kilkanascie sekund. Dlatego blad tylko logujemy.
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[GPS] wysylka pozycji nieudana:', message);
  }

  return false;
};

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  LOCATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.warn('[GPS] blad zadania w tle:', error.message);
      return;
    }

    const locations = data?.locations ?? [];
    const last = locations[locations.length - 1];
    if (!last) return;

    const incidentId = await AsyncStorage.getItem(INCIDENT_KEY);
    if (!incidentId) {
      // Zadanie przezylo zakonczenie alarmu, nie ma czego raportowac.
      await stopTracking();
      return;
    }

    await sendPosition(incidentId, last.coords.latitude, last.coords.longitude);
  },
);

export const getTrackingPermission = async (): Promise<TrackingPermission> => {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return 'denied';

  const background = await Location.getBackgroundPermissionsAsync();
  return background.status === 'granted' ? 'granted' : 'foreground-only';
};

// Android pyta dwuetapowo: najpierw o lokalizacje w czasie uzywania, a zgoda
// "zawsze" to osobny ekran systemowy. Bez tej drugiej nie da sie nadawac
// pozycji przy zgaszonym ekranie.
export const requestTrackingPermission = async (): Promise<TrackingPermission> => {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return 'denied';

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted' ? 'granted' : 'foreground-only';
};

export const startTracking = async (
  incidentId: string,
): Promise<TrackingPermission> => {
  await AsyncStorage.setItem(INCIDENT_KEY, incidentId);

  let permission = await getTrackingPermission();
  if (permission !== 'granted') {
    permission = await requestTrackingPermission();
  }

  if (permission === 'denied') {
    await AsyncStorage.removeItem(INCIDENT_KEY).catch(() => {});
    return permission;
  }

  // Pierwsza pozycja leci od razu, zeby dyspozytor nie czekal na pierwszy
  // cykl zadania. Dziala takze przy samej zgodzie na czas uzywania.
  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const arrived = await sendPosition(
      incidentId,
      current.coords.latitude,
      current.coords.longitude,
    );
    if (arrived) return permission;
  } catch (e) {
    console.warn('[GPS] nie udalo sie pobrac pozycji startowej:', e);
  }

  if (permission !== 'granted') return permission;

  try {
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: UPDATE_INTERVAL_MS,
      distanceInterval: UPDATE_DISTANCE_M,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Wyjazd do remizy',
        notificationBody:
          'Aplikacja przekazuje Twoją pozycję do czasu dotarcia.',
        notificationColor: '#E63A2E',
        killServiceOnDestroy: false,
      },
    });
  } catch (e) {
    console.warn('[GPS] nie udalo sie wystartowac sledzenia w tle:', e);
    return 'foreground-only';
  }

  return permission;
};
