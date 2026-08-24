import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { C } from "./constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type Props = StackScreenProps<RootStackParamList, "Login">;

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "";

// --- Tryb demo logowania ---
// Aktywny tylko dopóki backend nie istnieje (brak adresu lub placeholder w .env).
// Gdy ustawisz prawdziwy EXPO_PUBLIC_API_URL, logowanie automatycznie pójdzie przez API.
const MOCK_LOGIN = !API_BASE || API_BASE.includes("your-osp-backend");
const MOCK_USER = "jan";
const MOCK_PASS = "crmm";

export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionsDenied, setPermissionsDenied] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Podaj login i hasło.");
      return;
    }
    setLoading(true);
    setError(null);
    setPermissionsDenied(false);

    // Tryb demo: testuje samo okno logowania bez backendu (login: jan / hasło: crmm)
    if (MOCK_LOGIN) {
      await new Promise((r) => setTimeout(r, 400)); // symulacja opóźnienia sieci
      if (username.trim() === MOCK_USER && password === MOCK_PASS) {
        await AsyncStorage.setItem("authToken", "dev-mock-token");
        await AsyncStorage.setItem("userName", username.trim());
        setLoading(false);
        navigation.replace("Home");
      } else {
        setError("Nieprawidłowy login lub hasło.");
        setLoading(false);
      }
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        username: username.trim(),
        password,
      });
      const token: string | undefined = res.data?.token;
      if (!token) throw new Error("Brak tokenu w odpowiedzi serwera");
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userName", username.trim());
      navigation.replace("Home");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 401) {
          setError("Nieprawidłowy login lub hasło.");
        } else if (!e.response) {
          setError("Brak połączenia z serwerem.");
        } else {
          setError(
            (e.response.data as { message?: string })?.message ??
              `Błąd serwera (${e.response.status})`,
          );
        }
      } else {
        setError(e instanceof Error ? e.message : "Nieznany błąd.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.red} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>JEDNOSTKA OSP</Text>
            <Text style={styles.heroTitle}>SYSTEM ALARMOWY</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>LOGIN</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Wprowadź login"
              placeholderTextColor={C.textDim}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>HASŁO</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Wprowadź hasło"
              placeholderTextColor={C.textDim}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {permissionsDenied ? (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  Uprawnienia do powiadomień zostały odrzucone. Alarmy nie będą
                  docierać na to urządzenie.
                </Text>
                <TouchableOpacity onPress={() => Linking.openSettings()}>
                  <Text style={styles.warningLink}>Otwórz ustawienia systemowe</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.btnText}>ZALOGUJ SIĘ</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const CARD_SHADOW = {
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { alignItems: "center", marginBottom: 28 },
  heroLabel: {
    color: C.whiteDim,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  heroTitle: {
    color: C.white,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    padding: 24,
    ...CARD_SHADOW,
  },
  fieldLabel: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  fieldLabelSpaced: { marginTop: 18 },
  input: {
    backgroundColor: "#F4F4F6",
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: C.textLight,
    fontWeight: "600",
  },
  errorBanner: {
    marginTop: 16,
    backgroundColor: "#FFE5E5",
    borderRadius: 0,
    padding: 14,
  },
  errorText: { color: C.red, fontSize: 13, fontWeight: "700" },
  warningBanner: {
    marginTop: 16,
    backgroundColor: "#FFF8E1",
    borderRadius: 0,
    padding: 14,
  },
  warningText: { color: C.textLight, fontSize: 13, fontWeight: "500" },
  warningLink: {
    color: C.red,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  btn: {
    marginTop: 28,
    backgroundColor: C.red,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: C.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
