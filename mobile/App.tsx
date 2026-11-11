import React, { useCallback, useEffect, useState, useMemo } from "react";
import NetInfo from "@react-native-community/netinfo";
import { Palette } from "./src/constants/theme";
import { useTheme } from "./src/hooks/useTheme";
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
} from "./src/services/AlarmService";
import AlarmScreen from "./src/screens/AlarmScreen";
import AlarmConfirmScreen from "./src/screens/AlarmConfirmScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { AlarmData, RootStackParamList } from "./src/types";

const isNativePushAvailable = !!NativeModules.RNPushNotification;


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


registerBackgroundHandler();

const Stack = createStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const c = useTheme();
  const offlineStyles = useMemo(() => makeOfflineStyles(c), [c]);
  const [pendingAlarm, setPendingAlarm] = useState<AlarmData | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"Login" | "Home" | null>(null);


  useEffect(() => {
    AsyncStorage.getItem("authToken")
      .then((token) => setInitialRoute(token ? "Home" : "Login"))
      .catch(() => setInitialRoute("Login"));
  }, []);

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
          onNotification: (notification) => {
            const alarmData = alarmFromEvent(notification);
            if (notification.userInteraction && alarmData) openAlarm(alarmData);
            notification.finish?.("UIBackgroundFetchResultNoData"); // wymagane na iOS
          },
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
          <Text style={offlineStyles.text}>Brak połączenia z serwerem</Text>
        </View>
      )}
      <NavigationContainer ref={navigationRef} onReady={handleNavReady}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: c.bg },
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

const makeOfflineStyles = (c: Palette) =>
  StyleSheet.create({
  banner: { backgroundColor: c.red, padding: 8, alignItems: "center" },
  text: { color: c.white, fontWeight: "800", fontSize: 12 },
});
