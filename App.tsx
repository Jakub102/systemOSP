import React, { useCallback, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { C } from "./constants/theme";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Platform, NativeModules, View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  initFCM,
  setupNotificationChannels,
  sendAlarmResponse,
  setUnauthorizedHandler,
  registerBackgroundHandler,
  cancelAlarmNotification,
  parseAlarmData,
} from "./AlarmService";
import AlarmScreen from "./AlarmScreen";
import AlarmConfirmScreen from "./AlarmConfirmScreen";
import HistoryScreen from "./HistoryScreen";
import HomeScreen from "./HomeScreen";
import LoginScreen from "./LoginScreen";
import { AlarmData, RootStackParamList } from "./types";

const isNativePushAvailable = !!NativeModules.RNPushNotification;

// Dane alarmu wracają z powiadomienia raz jako `data`, raz jako `userInfo`
// - zależnie od tego, czy to tapnięcie w treść, czy w przycisk akcji.
type PushNotificationEvent = {
  data?: Record<string, unknown>;
  userInfo?: Record<string, unknown>;
  action?: string;
  userInteraction?: boolean;
  finish?: (result: string) => void;
};
type PushNotificationConfig = {
  onNotification: (notification: PushNotificationEvent) => void;
  onAction: (notification: PushNotificationEvent) => void;
  popInitialNotification: boolean;
  requestPermissions: boolean;
};
type PushNotificationStatic = { configure: (cfg: PushNotificationConfig) => void };

const alarmFromEvent = (notification: PushNotificationEvent) =>
  parseAlarmData({ ...notification.data, ...notification.userInfo });

let PushNotification: PushNotificationStatic | null = null;
if (isNativePushAvailable) {
  try {
    PushNotification = require("react-native-push-notification") as PushNotificationStatic;
  } catch {}
}

// Poza cyklem życia komponentu - handler musi być zarejestrowany, zanim
// system odpali apkę w tle na wiadomość FCM.
registerBackgroundHandler();

const Stack = createStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const [pendingAlarm, setPendingAlarm] = useState<AlarmData | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"Login" | "Home" | null>(null);

  // Sprawdź token i ustal punkt startowy nawigacji
  useEffect(() => {
    AsyncStorage.getItem("authToken")
      .then((token) => setInitialRoute(token ? "Home" : "Login"))
      .catch(() => setInitialRoute("Login"));
  }, []);

  // Przekieruj do Login po wygaśnięciu sesji (401)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate("Login");
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Nawigacja może jeszcze nie być gotowa (alarm z ubitej apki) - wtedy alarm
  // czeka w stanie i odpala się w onReady.
  const openAlarm = useCallback((alarmData: AlarmData) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("AlarmScreen", { alarmData });
    } else {
      setPendingAlarm(alarmData);
    }
  }, []);

  useEffect(() => {
    if (!initialRoute) return;

    if (isNativePushAvailable) setupNotificationChannels();

    if (isNativePushAvailable && PushNotification) {
      try {
        PushNotification.configure({
          // Tapnięcie w treść powiadomienia - pełny ekran alarmu
          onNotification: (notification) => {
            const alarmData = alarmFromEvent(notification);
            if (notification.userInteraction && alarmData) openAlarm(alarmData);
            notification.finish?.("UIBackgroundFetchResultNoData"); // wymagane na iOS
          },
          // Szybka odpowiedź z przycisku w powiadomieniu
          onAction: (notification) => {
            const alarmData = alarmFromEvent(notification);
            if (!alarmData) return;

            const status = notification.action === "JADĘ" ? "going" : "not_going";
            cancelAlarmNotification(alarmData.alarmId);

            sendAlarmResponse(alarmData.alarmId, status)
              .then(() => {
                if (navigationRef.isReady()) {
                  navigationRef.navigate("AlarmConfirm", { alarmData, status });
                }
              })
              .catch((e) => console.warn("Quick response error:", e));
          },
          popInitialNotification: true, // alarm, który podniósł apkę z martwych
          requestPermissions: Platform.OS === "ios",
        });
      } catch (e) {
        console.warn("PushNotification.configure error:", e);
      }
    }

    let unsubscribeFCM: (() => void) | null = null;
    const setupFCM = async () => {
      unsubscribeFCM = await initFCM(openAlarm);
    };
    // Bez google-services.json Firebase nie wstanie - to nie może wywalić apki
    setupFCM().catch((e) => console.warn("Inicjalizacja FCM nieudana:", e));

    return () => unsubscribeFCM?.();
  }, [initialRoute, openAlarm]);

  const handleNavReady = () => {
    if (pendingAlarm) {
      navigationRef.navigate("AlarmScreen", { alarmData: pendingAlarm });
      setPendingAlarm(null);
    }
  };

  if (!initialRoute) return null;

  return (
    <>
      {isOffline && (
        <View style={offlineStyles.banner}>
          <Text style={offlineStyles.text}>⚠ Brak połączenia z serwerem</Text>
        </View>
      )}
      <NavigationContainer ref={navigationRef} onReady={handleNavReady}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: C.bg },
            animationEnabled: true,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AlarmScreen" component={AlarmScreen} />
          <Stack.Screen name="AlarmConfirm" component={AlarmConfirmScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const offlineStyles = StyleSheet.create({
  banner: { backgroundColor: C.red, padding: 8, alignItems: "center" },
  text: { color: C.white, fontWeight: "800", fontSize: 12 },
});
