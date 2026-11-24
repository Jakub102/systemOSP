import React, { useCallback, useEffect, useState, useMemo } from "react";
import NetInfo from "@react-native-community/netinfo";
import { Palette } from "./src/constants/theme";
import { useTheme } from "./src/hooks/useTheme";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  initFCM,
  setupNotificationChannels,
  sendAlarmResponse,
  setUnauthorizedHandler,
  registerBackgroundHandler,
  cancelAlarmNotification,
  parseAlarmData,
  ACTION_GOING,
  ACTION_NOT_GOING,
} from "./src/services/AlarmService";
import AlarmScreen from "./src/screens/AlarmScreen";
import AlarmConfirmScreen from "./src/screens/AlarmConfirmScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import {
  startTracking,
  stopTracking,
} from "./src/services/LocationService";
import { AlarmData, RootStackParamList } from "./src/types";

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

    setupNotificationChannels().catch((e) =>
      console.warn("Nie udalo sie przygotowac kanalu powiadomien:", e),
    );

    // Reakcja na powiadomienie: tapniecie w tresc otwiera ekran alarmu,
    // a przyciski JADE / NIE JADE wysylaja decyzje od razu.
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const alarmData = parseAlarmData(
        response.notification.request.content.data,
      );
      if (!alarmData) return;

      const action = response.actionIdentifier;

      if (action === ACTION_GOING || action === ACTION_NOT_GOING) {
        const status = action === ACTION_GOING ? "going" : "not_going";
        cancelAlarmNotification(alarmData.alarmId);

        // Decyzja z powiadomienia dziala tak samo jak przycisk w aplikacji.
        if (action === ACTION_GOING) {
          startTracking(alarmData.alarmId).catch(() => {});
        } else {
          stopTracking().catch(() => {});
        }

        sendAlarmResponse(alarmData.alarmId, status)
          .then(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate("AlarmConfirm", { alarmData, status });
            }
          })
          .catch((e) => console.warn("Quick response error:", e));
        return;
      }

      openAlarm(alarmData);
    };

    const responseSub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Alarm, ktory podniosl aplikacje z martwych.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => {});

    let unsubscribeFCM: (() => void) | null = null;
    const setupFCM = async () => {
      unsubscribeFCM = await initFCM(openAlarm);
    };
    setupFCM().catch((e) => console.warn("Inicjalizacja FCM nieudana:", e));

    return () => {
      responseSub.remove();
      unsubscribeFCM?.();
    };
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
