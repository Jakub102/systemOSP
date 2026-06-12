// App.js — główny komponent: nawigacja + inicjalizacja FCM

import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { C } from './constants/theme';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {  Platform, NativeModules , View, Text, StyleSheet } from 'react-native';

import { initFCM, setupNotificationChannels, sendAlarmResponse } from './AlarmService';
import AlarmScreen       from './AlarmScreen';
import AlarmConfirmScreen from './AlarmConfirmScreen';
import HistoryScreen     from './HistoryScreen';
import HomeScreen        from './HomeScreen';

// Sprawdź czy moduł natywny powiadomień jest dostępny (nie ma go w Expo Go)
const isNativePushAvailable = !!NativeModules.RNPushNotification;

let PushNotification;
if (isNativePushAvailable) {
  try {
    PushNotification = require('react-native-push-notification');
  } catch (e) {}
}

const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [pendingAlarm, setPendingAlarm] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    // 1. Kanały powiadomień (tylko natywnie)
    if (isNativePushAvailable) {
      setupNotificationChannels();
    }

    // 2. Konfiguracja PushNotification (tylko natywnie)
    if (isNativePushAvailable && PushNotification && PushNotification.configure) {
      try {
        PushNotification.configure({
          onAction: (notification) => {
            if (!notification.userInfo?.alarmId) return;
            const status = notification.action === 'JADĘ' ? 'going' : 'not_going';
            sendAlarmResponse(notification.userInfo.alarmId, status)
              .catch(e => console.warn('Quick response error:', e));
          },
          requestPermissions: Platform.OS === 'ios',
        });
      } catch (e) {
        console.warn('PushNotification.configure error:', e);
      }
    }

    // 3. Inicjalizacja FCM (initFCM sam w sobie jest już zabezpieczony)
    let unsubscribeFCM;
    const setupFCM = async () => {
      unsubscribeFCM = await initFCM((alarmData) => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate('AlarmScreen', { alarmData });
        } else {
          setPendingAlarm(alarmData);
        }
      });
    };
    setupFCM();

    return () => unsubscribeFCM?.();
  }, []);

  const handleNavReady = () => {
    if (pendingAlarm) {
      navigationRef.current?.navigate('AlarmScreen', { alarmData: pendingAlarm });
      setPendingAlarm(null);
    }
  };

  return (
    <>
      {
        isOffline && (
          <View style={offlineStyles.banner}>
            <Text style={offlineStyles.text}>⚠ Brak połączenia z serwerem</Text>
          </View>
        )
      }
      <NavigationContainer ref={navigationRef} onReady={handleNavReady}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#000' },
          animationEnabled: true,
        }}
      >
        <Stack.Screen name="Home"          component={HomeScreen} />
        <Stack.Screen name="AlarmScreen"   component={AlarmScreen} />
        <Stack.Screen name="AlarmConfirm"  component={AlarmConfirmScreen} />
        <Stack.Screen name="History"       component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}


const offlineStyles = StyleSheet.create({
  banner: {
    backgroundColor: C.fireRed,
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: C.white,
    fontWeight: '800',
    fontSize: 12,
  },
});
