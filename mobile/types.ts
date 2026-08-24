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
