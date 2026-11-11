import React, { useEffect, useRef, useMemo } from "react";
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
import { useAlarm, ALARM_STATUS } from "../hooks/useAlarm";
import { useAlarmSound } from "../hooks/useAlarmSound";
import { Palette } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

const VIBRATION_PATTERN = [0, 800, 200, 800, 200, 1000];

type Props = StackScreenProps<RootStackParamList, "AlarmScreen">;

export default function AlarmScreen({ route, navigation }: Props) {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const alarmData = route.params?.alarmData;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    status,
    elapsed,
    displayTime,
    displayLabel,
    isOverdue,
    isAnswered,
    isLoading,
    error,
    respond,
  } = useAlarm(
    alarmData,
    (newStatus) => {
      setTimeout(() => {
        navigation.replace("AlarmConfirm", { alarmData, status: newStatus });
      }, 500);
    },
  );

  useAlarmSound(!!alarmData && status === ALARM_STATUS.PENDING);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => handler.remove();
  }, []);

  useEffect(() => {
    if (status !== ALARM_STATUS.PENDING) return;
    Vibration.vibrate(VIBRATION_PATTERN, true);
    return () => Vibration.cancel();
  }, [status]);

  useEffect(() => {
    if (elapsed === 0 || isOverdue) return;
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
  }, [elapsed, isOverdue]);

  if (!alarmData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Brak danych alarmu</Text>
      </View>
    );
  }

  if (isAnswered) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={c.white} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.incidentType}>{alarmData.incidentType}</Text>
          <Text style={styles.address}>{alarmData.address}</Text>

          <Animated.View
            style={[styles.circle, { transform: [{ scale: pulseAnim }] }]}
          >
            <Text style={[styles.circleTime, isOverdue && styles.circleTimeOverdue]}>
              {displayTime}
            </Text>
            <Text style={styles.circleSub}>{displayLabel}</Text>
          </Animated.View>

          {isOverdue ? (
            <View style={styles.overdueBanner}>
              <Text style={styles.overdueText}>
                Minął czas na odpowiedź. Nadal możesz zadeklarować wyjazd.
              </Text>
            </View>
          ) : null}

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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  safe: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: c.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: c.white, fontSize: 16, fontWeight: "700" },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: "center",
  },
  incidentType: {
    color: c.white,
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 40,
  },
  address: {
    color: c.whiteDim,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },

  circle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: c.cardBg,
    borderWidth: 10,
    borderColor: c.redDark,
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
    color: c.red,
    fontSize: 58,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  circleTimeOverdue: { color: c.textDim },
  circleSub: {
    color: c.textDim,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  overdueBanner: {
    backgroundColor: c.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "stretch",
    marginTop: 20,
  },
  overdueText: {
    color: c.textLight,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  notesCard: {
    backgroundColor: c.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    padding: 22,
    alignSelf: "stretch",
    marginTop: 24,
  },
  notesText: {
    color: c.textLight,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "center",
  },

  errorBanner: {
    backgroundColor: c.cardBg,
    borderRadius: 0,
    padding: 14,
    alignSelf: "stretch",
    marginTop: 16,
  },
  errorBannerText: { color: c.red, fontSize: 13, fontWeight: "700" },

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
    borderColor: c.sand,
    backgroundColor: c.cardBg,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  btnGoing: {},
  btnGoingText: { color: c.green, fontSize: 34, fontWeight: "900", letterSpacing: 1 },
  btnNotGoing: {},
  btnNotGoingText: {
    color: c.red,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
