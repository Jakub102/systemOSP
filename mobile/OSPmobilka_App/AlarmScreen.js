// AlarmScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Vibration, Animated, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlarm, ALARM_STATUS } from './useAlarm';
import { C } from './constants/theme';

const VIBRATION_PATTERN = [0, 800, 200, 800, 200, 1000];

export default function AlarmScreen({ route, navigation }) {
  const alarmData = route.params?.alarmData;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const {
    status, timeLeftFormatted, timeLeft,
    respondents, goingCount, notGoingCount,
    isLoading, error, retryCount, respond,
  } = useAlarm(alarmData, (newStatus) => {
    if (newStatus === ALARM_STATUS.EXPIRED) return;
    setTimeout(() => {
      navigation.replace('AlarmConfirm', { alarmData, status: newStatus });
    }, 500);
  });

  useEffect(() => {
    Vibration.vibrate(VIBRATION_PATTERN, true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    return () => Vibration.cancel();
  }, [retryCount]);

  const timerUrgent = timeLeft !== null && timeLeft < 60;

  if (!alarmData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Brak danych alarmu</Text>
      </View>
    );
  }

  if (status !== ALARM_STATUS.PENDING && status !== ALARM_STATUS.EXPIRED) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.red} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />

      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerLabel}>ALARM POŻAROWY</Text>
          {retryCount > 0 && <Text style={styles.retryLabel}>Powtórzenie #{retryCount}</Text>}
        </SafeAreaView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.sectionLabel}>TYP ZDARZENIA</Text>
          <Text style={styles.incidentType}>{alarmData.incidentType}</Text>
          <Text style={styles.address}>{alarmData.address}</Text>
          {alarmData.notes ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.notes}>{alarmData.notes}</Text>
            </>
          ) : null}
        </Animated.View>

        <View style={[styles.timerCard, timerUrgent && styles.timerCardUrgent]}>
          <Text style={styles.timerLabel}>CZAS NA ODPOWIEDŹ</Text>
          <Text style={[styles.timerValue, timerUrgent && styles.timerValueUrgent]}>
            {timeLeftFormatted}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{goingCount}</Text>
            <Text style={styles.statLabel}>JADĄ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, styles.statNumRed]}>{notGoingCount}</Text>
            <Text style={styles.statLabel}>ODWOŁALI</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

      </ScrollView>

      <View style={styles.footer}>
        <SafeAreaView edges={['bottom']}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGoing]}
            onPress={() => respond('going')}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTextMain}>JADĘ</Text>
            <Text style={styles.btnTextSubWhite}>Potwierdzam wyjazd do remizy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnNotGoing]}
            onPress={() => respond('not_going')}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnTextMain}>ODWOŁAJ</Text>
            <Text style={styles.btnTextSubWhite}>Nie mogę dojechać</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: C.red, fontSize: 16, fontWeight: '600' },

  header: {
    backgroundColor: C.red,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  headerLabel: {
    color: C.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  retryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: C.cardBg,
    borderRadius: 8,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: C.red,
  },
  sectionLabel: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  incidentType: {
    color: C.textLight,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  address: {
    color: C.textDim,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  notes: {
    color: C.textDim,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },

  timerCard: {
    backgroundColor: C.cardBg,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  timerCardUrgent: {
    borderWidth: 1,
    borderColor: C.red,
  },
  timerLabel: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timerValue: {
    color: C.textLight,
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerValueUrgent: {
    color: C.red,
  },

  statsRow: {
    backgroundColor: C.cardBg,
    borderRadius: 8,
    flexDirection: 'row',
    padding: 20,
  },
  statBox:    { flex: 1, alignItems: 'center' },
  statDivider:{ width: 1, backgroundColor: C.border },
  statNum:    { color: C.green, fontSize: 36, fontWeight: '700' },
  statNumRed: { color: C.red },
  statLabel:  { color: C.textDim, fontSize: 11, fontWeight: '600', marginTop: 4, letterSpacing: 1 },

  errorBanner: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.red,
  },
  errorBannerText: { color: C.red, fontSize: 13 },

  footer: {
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  btn: {
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnGoing:    { backgroundColor: C.green },
  btnNotGoing: { backgroundColor: C.red },
  btnTextMain: { color: C.white, fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  btnTextSubWhite: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3 },
});
