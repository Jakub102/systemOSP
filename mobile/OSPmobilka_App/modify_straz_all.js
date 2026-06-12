const fs = require('fs');

const path = require('path');
const projDir = 'd:/Projekty/JavaScript Native/Florian/Florian_App';

const file = (p) => path.join(projDir, p);
const readFile = (p) => fs.readFileSync(file(p), 'utf8');
const writeFile = (p, c) => fs.writeFileSync(file(p), c, 'utf8');

// Step 1: Fix AlarmService.js fetch errors
let srv = readFile('AlarmService.js');
srv = srv.replace(/export const sendAlarmResponse = async[\s\S]*?return response.data;\n\};/g, 
`export const sendAlarmResponse = async (alarmId, status) => {
  // Tryb mock — symulacja opóźnienia sieciowego
  await new Promise(resolve => setTimeout(resolve, 400));
  console.log(\`[MOCK] Odpowiedź na alarm \${alarmId}: \${status}\`);
  return { success: true };
};`);
srv = srv.replace(/export const fetchAlarmDetails = async[\s\S]*?return response.data;\n\};/g, 
`export const fetchAlarmDetails = async (alarmId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    respondents: [
      { userId: '1', name: 'Jan Kowalski', status: 'going', role: 'Dowódca' },
      { userId: '2', name: 'Adam Nowak', status: 'going', role: 'Kierowca' },
      { userId: '3', name: 'Piotr Wiśniewski', status: 'not_going', role: 'Strażak' },
    ]
  };
};`);
srv = srv.replace(/export const fetchAlarmHistory = async[\s\S]*?return response.data;\n\};/g, 
`export const fetchAlarmHistory = async (page = 1) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    alarms: [
      { alarmId: 'H-001', incidentType: 'Pożar lasu', address: 'ul. Leśna 5, Florianów', myStatus: 'going', goingCount: 4, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { alarmId: 'H-002', incidentType: 'Wypadek drogowy', address: 'DK7 km 142, Florianów', myStatus: 'not_going', goingCount: 6, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { alarmId: 'H-003', incidentType: 'Pożar budynku', address: 'ul. Strażacka 3', myStatus: 'no_answer', goingCount: 3, createdAt: new Date(Date.now() - 172800000).toISOString() },
    ]
  };
};`);
writeFile('AlarmService.js', srv);

// Step 2: Write theme.js
const themeCode = `// constants/theme.js
// StrazApp — paleta europejskiej straży pożarnej

export const C = {
  // Tła
  bg:         '#111111',
  bgCard:     '#1E1E1E',
  bgCardAlt:  '#252525',

  // Główny akcent — czerwień strażacka
  red:        '#CC0000',
  redDark:    '#990000',

  // Akcje
  green:      '#2E7D32',
  greenLight: '#4CAF50',

  // Tekst
  white:      '#FFFFFF',
  silver:     '#CCCCCC',
  muted:      '#888888',
  mutedLight: 'rgba(255,255,255,0.15)',

  // Granica/separator
  border:     '#2E2E2E',
  borderCard: '#CC000033',
};
`;
writeFile('constants/theme.js', themeCode);

// Step 6: HistoryScreen.js
let hist = readFile('HistoryScreen.js');
hist = hist.replace(/const C = \{[\s\S]*?\n\};\n?/m, `import { C as TC } from './constants/theme';\nconst C = {
  bg:        TC.bg,
  bgCard:    TC.bgCard,
  green:     TC.greenLight,
  greenLight: '#9FE1CB',
  red:       '#E24B4A',
  redLight:  '#F7C1C1',
  amber:     TC.muted,
  white:     TC.white,
  text:      TC.silver,
  textMuted: TC.muted,
  border:    TC.border,
};
`);
writeFile('HistoryScreen.js', hist);

// Step 7: app.json and package.json
let appjson = readFile('app.json');
appjson = appjson.replace(/"name": "Florian_App"/g, '"name": "StrazApp"');
appjson = appjson.replace(/"slug": "Florian_App"/g, '"slug": "strazapp"');
appjson = appjson.replace(/"scheme": "florianapp"/g, '"scheme": "strazapp"');
appjson = appjson.replace(/"package": "com.anonymous.Florian_App"/g, '"package": "com.anonymous.strazapp"');
writeFile('app.json', appjson);

let pkgjson = readFile('package.json');
pkgjson = pkgjson.replace(/"name": "florian-app"/g, '"name": "strazapp"');
writeFile('package.json', pkgjson);

console.log('Node script completed for steps 1c, 2, 6, 7');
