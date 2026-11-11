import { useColorScheme } from "react-native";
import { darkPalette, lightPalette, Palette } from "../constants/theme";

/**
 * Paleta zgodna z ustawieniem motywu w systemie. app.json ma
 * userInterfaceStyle: "automatic", więc aplikacja podąża za telefonem.
 */
export const useTheme = (): Palette =>
  useColorScheme() === "dark" ? darkPalette : lightPalette;
