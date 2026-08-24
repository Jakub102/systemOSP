import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ALARM_STATUS } from "./useAlarm";
import { C } from "./constants/theme";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type Props = StackScreenProps<RootStackParamList, "AlarmConfirm">;

export default function AlarmConfirmScreen({ route, navigation }: Props) {
  const { alarmData, status } = route.params;
  const isGoing = status === ALARM_STATUS.GOING;
  const accent = isGoing ? C.green : C.red;

  const openGoogleMaps = () => {
    const lat = alarmData?.stationLat;
    const lng = alarmData?.stationLng;
    if (!lat || !lng) return;
    Linking.openURL(`google.navigation:q=${lat},${lng}&mode=d`).catch(() =>
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      ),
    );
  };

  const hasCoords = !!(alarmData?.stationLat && alarmData?.stationLng);

  return (
    <View style={[styles.root, { backgroundColor: accent }]}>
      <StatusBar barStyle="light-content" backgroundColor={accent} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.circle}>
              <Text style={[styles.circleMark, { color: accent }]}>
                {isGoing ? "✓" : "✕"}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {isGoing ? "POTWIERDZONO WYJAZD" : "ODWOŁANO"}
            </Text>
            {isGoing && (
              <Text style={styles.heroSub}>
                Dyspozytor wie, że jedziesz do remizy.
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>ZDARZENIE</Text>
            <Text style={styles.incidentType}>
              {alarmData?.incidentType?.toUpperCase() || "ZDARZENIE"}
            </Text>
            <Text style={styles.address}>
              {alarmData?.address?.toUpperCase() || "BRAK ADRESU"}
            </Text>
          </View>

          {isGoing && hasCoords && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={openGoogleMaps}
              activeOpacity={0.85}
            >
              <Text style={styles.navBtnText}>OTWÓRZ NAWIGACJĘ DO REMIZY</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.85}
          >
            <Text style={[styles.backBtnText, { color: accent }]}>
              POWRÓT DO MENU
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
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
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: 24, flexGrow: 1 },
  hero: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.white,
    borderWidth: 5,
    borderColor: C.sand,
    alignItems: "center",
    justifyContent: "center",
    ...CARD_SHADOW,
  },
  circleMark: { fontSize: 64, fontWeight: "900", marginTop: -6 },
  heroTitle: {
    color: C.white,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 20,
    textAlign: "center",
  },
  heroSub: {
    color: C.whiteDim,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: C.cardBg,
    padding: 22,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    marginTop: 28,
    ...CARD_SHADOW,
  },
  label: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  incidentType: { color: C.textLight, fontSize: 24, fontWeight: "900" },
  address: { color: C.textDim, fontSize: 15, fontWeight: "700", marginTop: 6 },
  navBtn: {
    backgroundColor: C.white,
    paddingVertical: 20,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    ...CARD_SHADOW,
  },
  navBtnText: { color: C.green, fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  backBtn: {
    paddingVertical: 18,
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    marginTop: 16,
  },
  backBtnText: { fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
});
