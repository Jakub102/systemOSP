import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Vibration,
  Animated,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAlarm, ALARM_STATUS } from "./useAlarm";
import { useAlarmSound } from "./useAlarmSound";
import { C } from "./constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

const VIBRATION_PATTERN = [0, 800, 200, 800, 200, 1000];

type Props = StackScreenProps<RootStackParamList, "AlarmScreen">;

export default function AlarmScreen({ route, navigation }: Props) {
  const alarmData = route.params?.alarmData;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { status, elapsed, elapsedFormatted, isLoading, error, respond } = useAlarm(
    alarmData,
    (newStatus) => {
      setTimeout(() => {
        navigation.replace("AlarmConfirm", { alarmData, status: newStatus });
      }, 500);
    },
  );

  // Syrena leci w pętli, dopóki strażak nie odpowie
  useAlarmSound(!!alarmData && status === ALARM_STATUS.PENDING);

  // Blokada przycisku Wstecz podczas trwania alarmu
  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, []);

  // Wibracja w pętli - zabezpieczenie na wyciszone multimedia
  useEffect(() => {
    if (status !== ALARM_STATUS.PENDING) return;
    Vibration.vibrate(VIBRATION_PATTERN, true);
    return () => Vibration.cancel();
  }, [status]);

  // Puls zegara: delikatny co sekundę, mocniejszy co 10 sekund
  useEffect(() => {
    if (elapsed === 0) return;
    const strong = elapsed % 10 === 0;
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: strong ? 1.18 : 1.04,
        duration: strong ? 180 : 150,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: strong ? 4 : 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [elapsed]);

  if (!alarmData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Brak danych alarmu</Text>
      </View>
    );
  }

  if (status !== ALARM_STATUS.PENDING) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.white} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.incidentType}>{alarmData.incidentType}</Text>
          <Text style={styles.address}>{alarmData.address}</Text>

          <Animated.View
            style={[styles.circle, { transform: [{ scale: pulseAnim }] }]}
          >
            <Text style={styles.circleTime}>{elapsedFormatted}</Text>
            <Text style={styles.circleSub}>czas od zgłoszenia</Text>
          </Animated.View>

          {alarmData.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{alarmData.notes}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGoing]}
            onPress={() => respond("going")}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnGoingText}>JADĘ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnNotGoing]}
            onPress={() => respond("not_going")}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnNotGoingText}>NIE JADĘ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: C.white, fontSize: 16, fontWeight: "700" },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  incidentType: {
    color: C.white,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 40,
  },
  address: {
    color: C.whiteDim,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },

  circle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: C.white,
    borderWidth: 10,
    borderColor: C.redDark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  circleTime: {
    color: C.red,
    fontSize: 58,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  circleSub: {
    color: C.textDim,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  notesCard: {
    backgroundColor: C.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    padding: 22,
    alignSelf: "stretch",
    marginTop: 24,
  },
  notesText: {
    color: C.textLight,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "center",
  },

  errorBanner: {
    backgroundColor: C.white,
    borderRadius: 0,
    padding: 14,
    alignSelf: "stretch",
    marginTop: 16,
  },
  errorBannerText: { color: C.red, fontSize: 13, fontWeight: "700" },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  btn: {
    borderRadius: 0,
    paddingVertical: 34,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 6,
    borderColor: C.sand,
    backgroundColor: C.white,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  btnGoing: {},
  btnGoingText: { color: C.green, fontSize: 34, fontWeight: "900", letterSpacing: 1 },
  btnNotGoing: {},
  btnNotGoingText: {
    color: C.red,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
