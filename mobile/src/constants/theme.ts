export type Palette = {
  bg: string;
  cardBg: string;
  sand: string;
  textLight: string;
  textDim: string;
  red: string;
  redDark: string;
  green: string;
  white: string;
  whiteDim: string;
  border: string;
  inputBg: string;
  errorBg: string;
  trackOff: string;
};

export const lightPalette: Palette = {
  bg: "#E63A2E", // czerwone tło ekranów (emergency)
  cardBg: "#FFFFFF", // białe karty
  sand: "#C9A96E",
  textLight: "#222222", // ciemny tekst na kartach
  textDim: "#9AA0A6", // przygaszony szary
  red: "#E63A2E", // czerwień akcentowa / przyciski
  redDark: "#C32C22", // ciemniejsza czerwień (np. obramowania)
  green: "#2ECC71", // pozytywne akcje (jadę, telefon)
  white: "#FFFFFF",
  whiteDim: "rgba(255,255,255,0.85)", // podtekst na czerwonym tle
  border: "#EEEEEE", // delikatne linie na kartach
  inputBg: "#F4F4F6",
  errorBg: "#FFE5E5",
  trackOff: "#C9CDD2",
};

/**
 * Motyw nocny. Alarm pozostaje czerwony, bo to jego tożsamość, ale sięga po
 * głębszą czerwień, która nie oślepia po przebudzeniu. Karty, które w dzień są
 * białe, stają się ciemne - to one były najbardziej męczące dla oczu w nocy.
 */
export const darkPalette: Palette = {
  bg: "#7A1A13",
  cardBg: "#1C1C1E",
  sand: "#8A7246",
  textLight: "#ECECEC",
  textDim: "#9AA0A6",
  red: "#FF6B5E", // jaśniejsza czerwień, czytelna na ciemnej karcie
  redDark: "#5E1510",
  green: "#3DDC84",
  white: "#FFFFFF",
  whiteDim: "rgba(255,255,255,0.80)",
  border: "#2F2F31",
  inputBg: "#2A2A2C",
  errorBg: "#3A1A18",
  trackOff: "#4A4A4D",
};

/** Paleta dzienna pod starą nazwą - dla kodu, który nie czyta motywu. */
export const C = lightPalette;
