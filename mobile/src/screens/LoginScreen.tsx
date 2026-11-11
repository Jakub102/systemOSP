import React, { useState, useMemo } from "react";
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IS_MOCK_API, login } from "../services/AlarmService";
import { Palette } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

type Props = StackScreenProps<RootStackParamList, "Login">;

//Tryb demo logowania

const MOCK_EMAIL = "strazak@vfd.pl";
const MOCK_PASS = "password123";

export default function LoginScreen({ navigation }: Props) {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Podaj adres e-mail i hasło.");
      return;
    }
    setLoading(true);
    setError(null);

    
    if (IS_MOCK_API) {
      await new Promise((r) => setTimeout(r, 400)); // symulacja opóźnienia sieci
      if (email.trim().toLowerCase() === MOCK_EMAIL && password === MOCK_PASS) {
        await AsyncStorage.multiSet([
          ["authToken", "dev-mock-token"],
          ["userName", "Jan Kowalski"],
        ]);
        navigation.replace("Home");
      } else {
        setError("Nieprawidłowy e-mail lub hasło.");
      }
      setLoading(false);
      return;
    }

    try {
     
      await login(email, password);
      navigation.replace("Home");
    } catch (e: unknown) {
     
      
      const message = (e as { customMessage?: string })?.customMessage;
      setError(
        message ?? (e instanceof Error ? e.message : "Nie udało się zalogować."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>JEDNOSTKA OSP</Text>
            <Text style={styles.heroTitle}>SYSTEM ALARMOWY</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>ADRES E-MAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="Wprowadź adres e-mail"
              placeholderTextColor={c.textDim}
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>HASŁO</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Wprowadź hasło"
              placeholderTextColor={c.textDim}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={c.white} />
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { alignItems: "center", marginBottom: 28 },
  heroLabel: {
    color: c.whiteDim,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  heroTitle: {
    color: c.white,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: c.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    padding: 24,
    ...CARD_SHADOW,
  },
  fieldLabel: {
    color: c.textDim,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  fieldLabelSpaced: { marginTop: 18 },
  input: {
    backgroundColor: c.inputBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: c.textLight,
    fontWeight: "600",
  },
  errorBanner: {
    marginTop: 16,
    backgroundColor: c.errorBg,
    borderRadius: 0,
    padding: 14,
  },
  errorText: { color: c.red, fontSize: 13, fontWeight: "700" },
  btn: {
    marginTop: 28,
    backgroundColor: c.red,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: c.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
