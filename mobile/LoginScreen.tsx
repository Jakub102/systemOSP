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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IS_MOCK_API, login } from "./AlarmService";
import { C } from "./constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type Props = StackScreenProps<RootStackParamList, "Login">;

//Tryb demo logowania

const MOCK_EMAIL = "strazak@vfd.pl";
const MOCK_PASS = "password123";

export default function LoginScreen({ navigation }: Props) {
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
      <StatusBar barStyle="light-content" backgroundColor={C.red} />
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
