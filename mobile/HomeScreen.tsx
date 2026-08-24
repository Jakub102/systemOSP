import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C } from "./constants/theme";
import { logout } from "./AlarmService";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type Props = StackScreenProps<RootStackParamList, "Home">;

// Przełącznik on/off w stylu ustawień (kanciasty, dopasowany do reszty UI)
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
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
      <View style={[styles.track, { backgroundColor: value ? C.green : "#C9CDD2" }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const [userName, setUserName] = useState("STRAŻAK");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("userName")
      .then((n) => n && setUserName(n.toUpperCase()))
      .catch(() => {});

    AsyncStorage.getItem("available")
      .then((val) => {
        if (val !== null) setAvailable(val === "true");
      })
      .catch(() => {});
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
    navigation.navigate("AlarmScreen", {
      alarmData: {
        alarmId: "TEST-123",
        incidentType: "POŻAR BUDYNKU",
        address: "ul. Strażacka 15, Florianów",
        priority: "ALARMOWY",
        notes: "Możliwe osoby w budynku",
        stationLat: 52.4006,
        stationLng: 16.9229,
        responseDeadlineMinutes: 3,
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.userName}>{userName}</Text>
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
                    { color: available ? C.green : C.textDim },
                  ]}
                >
                  {available ? "JESTEM W GOTOWOŚCI" : "BRAK GOTOWOŚCI"}
                </Text>
              </View>
              <Toggle value={available} onChange={handleAvailableChange} />
            </View>
          </View>

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

          <View style={styles.brand}>
            <Image
              source={require("./assets/images/android-icon-foreground.png")}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
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
    color: C.whiteDim,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  userName: { color: C.white, fontSize: 30, fontWeight: "900", marginTop: 4 },
  logoutBtn: { paddingVertical: 4 },
  logoutText: {
    color: C.whiteDim,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  body: { flex: 1, paddingHorizontal: 20, gap: 16 },

  card: {
    backgroundColor: C.cardBg,
    padding: 22,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    ...CARD_SHADOW,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusTextWrap: { flex: 1 },
  cardLabel: {
    color: C.textDim,
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
    borderColor: C.sand,
    justifyContent: "center",
  },
  knob: {
    width: 24,
    height: 24,
    backgroundColor: C.white,
  },

  rowCard: {
    backgroundColor: C.cardBg,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...CARD_SHADOW,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: "#FDE7E4",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { color: C.red, fontSize: 22, fontWeight: "900" },
  rowTextWrap: { flex: 1, marginLeft: 14 },
  rowTitle: { flex: 1, color: C.textLight, fontSize: 16, fontWeight: "900" },
  rowSub: { color: C.textDim, fontSize: 12, marginTop: 2, fontWeight: "600" },
  chevron: { color: C.textDim, fontSize: 26, fontWeight: "300" },

  testBtn: {
    paddingVertical: 18,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    backgroundColor: C.redDark,
    alignItems: "center",
  },
  testBtnText: {
    color: C.white,
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
