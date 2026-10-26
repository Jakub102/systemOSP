export interface AlarmData {
  alarmId: string;
  incidentType: string;
  address: string;
  priority: string;
  notes: string;
  stationLat?: number | null;
  stationLng?: number | null;
  responseDeadlineMinutes?: number;
}

export interface AlarmHistoryItem {
  alarmId: string;
  incidentType: string;
  address: string;
  myStatus: "going" | "not_going" | "no_answer";
  createdAt: string;
}

export interface AlarmHistoryResponse {
  alarms: AlarmHistoryItem[];
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  AlarmScreen: { alarmData: AlarmData };
  AlarmConfirm: {
    alarmData: AlarmData;
    status: string;
  };
  History: undefined;
};

export interface Firehouse {
  id: number;
  name: string;
  street?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  firehouse?: Firehouse | null;
  roles: string[];
  full_name: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface MeResponse {
  user: UserProfile;
}
