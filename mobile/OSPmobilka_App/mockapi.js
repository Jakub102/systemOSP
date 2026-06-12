  // Tryb mock — symulacja opóźnienia sieciowego
  await new Promise(resolve => setTimeout(resolve, 400));
  console.log(`[MOCK] Odpowiedź na alarm ${alarmId}: ${status}`);
  return { success: true };
;

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
  return {
    alarms: [
      { alarmId: 'H-001', incidentType: 'Pożar lasu', address: 'ul. Leśna 5, Florianów', myStatus: 'going', goingCount: 4, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { alarmId: 'H-002', incidentType: 'Wypadek drogowy', address: 'DK7 km 142, Florianów', myStatus: 'not_going', goingCount: 6, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { alarmId: 'H-003', incidentType: 'Pożar budynku', address: 'ul. Strażacka 3', myStatus: 'no_answer', goingCount: 3, createdAt: new Date(Date.now() - 172800000).toISOString() },
    ]
  };
};