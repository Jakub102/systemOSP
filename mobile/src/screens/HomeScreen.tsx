import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  Image,
  AppState,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Palette } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import {
  fetchMe,
  logout,
  showAlarmNotification,
} from "../services/AlarmService";
import {
  getTrackingPermission,
  requestTrackingPermission,
} from "../services/LocationService";
import type { TrackingPermission } from "../services/LocationService";
import { StackScreenProps } from "@react-navigation/stack";
import { AlarmData, RootStackParamList } from "../types";

type Props = StackScreenProps<RootStackParamList, "Home">;

type Styles = ReturnType<typeof makeStyles>;

// Zgloszenie uzywane przez oba przyciski testowe w trybie deweloperskim.
const TEST_ALARM: AlarmData = {
  alarmId: "TEST-123",
  incidentType: "POŻAR BUDYNKU",
  address: "ul. Strażacka 15, Florianów",
  priority: "ALARMOWY",
  notes: "Możliwe osoby w budynku",
  stationLat: 52.4006,
  stationLng: 16.9229,
  responseDeadlineMinutes: 3,
};


function Toggle({
  value,
  onChange,
  c,
  styles,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  c: Palette;
  styles: Styles;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onChange(!value)}>
      <View style={[styles.track, { backgroundColor: value ? c.green : c.trackOff }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [userName, setUserName] = useState("");
  const [available, setAvailable] = useState(true);
  const [locationPermission, setLocationPermission] =
    useState<TrackingPermission | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userName")
      .then((n) => n && setUserName(n.toUpperCase()))
      .catch(() => {});

    AsyncStorage.getItem("available")
      .then((val) => {
        if (val !== null) setAvailable(val === "true");
      })
      .catch(() => {});

    
    fetchMe()
      .then((user) => {
        if (user?.full_name) setUserName(user.full_name.toUpperCase());
      })
      .catch(() => {});
  }, []);

  // Zgody pytamy tutaj, a nie dopiero przy alarmie. Strażak nie powinien
  // szukać ustawień systemowych w chwili, gdy wyje syrena.
  const refreshLocationPermission = useCallback(() => {
    getTrackingPermission()
      .then(setLocationPermission)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshLocationPermission();

    // Powrót z ustawień systemowych nie zmienia ekranu, więc stan zgody
    // sprawdzamy ponownie przy każdym ożywieniu aplikacji.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshLocationPermission();
    });

    return () => subscription.remove();
  }, [refreshLocationPermission]);

  const handleLocationPermission = useCallback(async () => {
    let result: TrackingPermission = "denied";
    try {
      result = await requestTrackingPermission();
    } catch {
      result = "denied";
    }

    setLocationPermission(result);
    if (result === "granted") return;

    Alert.alert(
      "Zgoda na lokalizację",
      'Aby remiza widziała, że jesteś w drodze, ustaw dostęp do lokalizacji na "Zezwalaj zawsze".',
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Otwórz ustawienia",
          onPress: () => {
            Linking.openSettings().catch(() => {});
          },
        },
      ],
    );
  }, []);

  const handleAvailableChange = (value: boolean) => {
    setAvailable(value);
    AsyncStorage.setItem("available", String(value)).catch(() => {});
  };

  const handleLogout = useCallback(() => {
    Alert.alert("Wylogowanie", "Czy na pewno chcesz się wylogować?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Wyloguj",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.replace("Login");
        },
      },
    ]);
  }, [navigation]);

  const testAlarmPopup = () => {
    navigation.navigate("AlarmScreen", { alarmData: TEST_ALARM });
  };

  // Jedyny sposob, zeby sprawdzic kanal alarmowy bez dzialajacego serwera.
  // Powiadomienie pojawia sie z opoznieniem, zeby zdazyc zablokowac ekran.
  const testAlarmNotification = () => {
    showAlarmNotification(TEST_ALARM, 10).catch((e) =>
      console.warn("Nie udalo sie zaplanowac powiadomienia testowego:", e),
    );

    Alert.alert(
      "Powiadomienie testowe",
      "Zablokuj ekran. Alarm pojawi się za 10 sekund.",
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.userName}>{userName || "STRAŻAK"}</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>WYLOGUJ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusTextWrap}>
                <Text style={styles.cardLabel}>STATUS GOTOWOŚCI</Text>
                <Text
                  style={[
                    styles.statusValue,
                    { color: available ? c.green : c.textDim },
                  ]}
                >
                  {available ? "JESTEM W GOTOWOŚCI" : "BRAK GOTOWOŚCI"}
                </Text>
              </View>
              <Toggle
                value={available}
                onChange={handleAvailableChange}
                c={c}
                styles={styles}
              />
            </View>
          </View>

          {locationPermission !== null && locationPermission !== "granted" && (
            <TouchableOpacity
              style={styles.warnCard}
              onPress={handleLocationPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.warnTitle}>
                BRAK ZGODY NA LOKALIZACJĘ W TLE
              </Text>
              <Text style={styles.warnText}>
                Bez niej remiza nie zobaczy, że jedziesz. Dotknij, aby nadać
                zgodę.
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.rowCard}
            onPress={() => navigation.navigate("History")}
            activeOpacity={0.85}
          >
            <Text style={styles.rowTitle}>HISTORIA WYJAZDÓW</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.testBtn}
              onPress={testAlarmPopup}
              activeOpacity={0.85}
            >
              <Text style={styles.testBtnText}>URUCHOM ALARM TESTOWY</Text>
            </TouchableOpacity>
          )}

          {__DEV__ && (
            <TouchableOpacity
              style={styles.testBtn}
              onPress={testAlarmNotification}
              activeOpacity={0.85}
            >
              <Text style={styles.testBtnText}>
                POWIADOMIENIE TESTOWE ZA 10 S
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.brand}>
            <Image
              source={require("../../assets/images/android-icon-foreground.png")}
              style={styles.brandImg}
              resizeMode="contain"
            />
          </View>
        </View>
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  unitLabel: {
    color: c.whiteDim,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  userName: { color: c.white, fontSize: 30, fontWeight: "900", marginTop: 4 },
  logoutBtn: { paddingVertical: 4 },
  logoutText: {
    color: c.whiteDim,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  body: { flex: 1, paddingHorizontal: 20, gap: 16 },

  card: {
    backgroundColor: c.cardBg,
    padding: 22,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    ...CARD_SHADOW,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusTextWrap: { flex: 1 },
  cardLabel: {
    color: c.textDim,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  statusValue: { fontSize: 18, fontWeight: "900" },

  // Przełącznik
  track: {
    width: 70,
    height: 40,
    padding: 4,
    borderWidth: 4,
    borderColor: c.sand,
    justifyContent: "center",
  },
  knob: {
    width: 24,
    height: 24,
    backgroundColor: c.cardBg,
  },

  rowCard: {
    backgroundColor: c.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...CARD_SHADOW,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: c.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { color: c.red, fontSize: 22, fontWeight: "900" },
  rowTextWrap: { flex: 1, marginLeft: 14 },
  rowTitle: { flex: 1, color: c.textLight, fontSize: 16, fontWeight: "900" },
  rowSub: { color: c.textDim, fontSize: 12, marginTop: 2, fontWeight: "600" },
  chevron: { color: c.textDim, fontSize: 26, fontWeight: "300" },

  warnCard: {
    backgroundColor: c.errorBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.red,
    padding: 16,
    ...CARD_SHADOW,
  },
  warnTitle: {
    color: c.red,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  warnText: {
    color: c.textLight,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },

  testBtn: {
    paddingVertical: 18,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: c.sand,
    backgroundColor: c.redDark,
    alignItems: "center",
  },
  testBtnText: {
    color: c.white,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  brand: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandImg: {
    width: 360,
    height: 360,
    opacity: 0.95,
  },
});
