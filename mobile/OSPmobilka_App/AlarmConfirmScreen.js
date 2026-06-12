import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAlarmDetails } from './AlarmService';
import { ALARM_STATUS } from './useAlarm';
import { C } from './constants/theme';

export default function AlarmConfirmScreen({ route, navigation }) {
  const { alarmData = {}, status = '' } = route.params || {};
  const isGoing = status === ALARM_STATUS.GOING;
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!alarmData?.alarmId) {
        setLoading(false);
        return;
      }
      try {
        const details = await fetchAlarmDetails(alarmData.alarmId);
        if (!cancelled && details?.respondents) {
          setRespondents(details.respondents);
        }
      } catch (e) {
        console.warn('Błąd załogi:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [alarmData?.alarmId]);

  const openNav = (type) => {
    const lat = alarmData?.stationLat;
    const lng = alarmData?.stationLng;
    if (!lat || !lng) return;

    let url = type === 'google'
      ? `google.navigation:q=${lat},${lng}&mode=d`
      : `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const goingList = Array.isArray(respondents) ? respondents.filter(r => r.status === 'going') : [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle='light-content' backgroundColor={isGoing ? C.green : C.red} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        <View style={[styles.header, { backgroundColor: isGoing ? C.green : C.red }]}>
          <Text style={styles.headerText}>{isGoing ? 'POTWIERDZONO WYJAZD' : 'ODWOŁANO'}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.card, { borderLeftColor: C.red }]}>
            <Text style={styles.label}>ZDARZENIE</Text>
            <Text style={styles.incidentType}>{alarmData?.incidentType?.toUpperCase() || 'ZDARZENIE'}</Text>
            <Text style={styles.address}>{alarmData?.address?.toUpperCase() || 'BRAK ADRESU'}</Text>
          </View>

          {isGoing && (
            <View style={[styles.card, { borderLeftColor: C.red }]}>
              <Text style={styles.label}>NAWIGACJA DO REMIZY</Text>
              <View style={styles.navButtonsRow}>
                <TouchableOpacity style={[styles.navBtn, { backgroundColor: C.red }]} onPress={() => openNav('google')}>
                  <Text style={styles.navBtnText}>GOOGLE MAPS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, { backgroundColor: C.red }]} onPress={() => openNav('waze')}>
                  <Text style={styles.navBtnText}>WAZE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.card, { borderLeftColor: C.green }]}>
            <Text style={styles.crewTitle}>ZAŁOGA W DRODZE ({goingList.length})</Text>
            {loading ? (
              <ActivityIndicator color={C.red} style={{ marginTop: 20 }} />
            ) : (
              goingList.length > 0 ? (
                goingList.map((r, i) => (
                  <View key={i} style={styles.crewItem}>
                    <Text style={styles.crewName}>{r.name?.toUpperCase()}</Text>
                    <Text style={styles.crewRole}>{r.role?.toUpperCase() || 'STRAŻAK'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyCrew}>BRAK POTWIERDZEŃ</Text>
              )
            )}
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backBtnText}>POWRÓT DO MENU</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  header: { padding: 25, alignItems: 'center', borderBottomLeftRadius: 15, borderBottomRightRadius: 15, elevation: 5 },
  headerText: { color: C.white, fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  content: { flex: 1, padding: 15 },
  card: { backgroundColor: C.cardBg, padding: 20, borderRadius: 10, marginBottom: 15, borderLeftWidth: 8, elevation: 3 },
  label: { color: C.textDim, fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 1 },
  incidentType: { color: C.textLight, fontSize: 24, fontWeight: '900' },
  address: { color: C.textDim, fontSize: 16, fontWeight: '800', marginTop: 4 },

  navButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  navBtn: { flex: 1, padding: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { color: C.white, fontSize: 15, fontWeight: '900' },

  crewTitle: { color: C.textLight, fontSize: 16, fontWeight: '900', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: C.bg, paddingBottom: 10 },
  crewItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.bg },
  crewName: { color: C.textLight, fontSize: 16, fontWeight: '900' },
  crewRole: { color: C.textDim, fontSize: 13, fontWeight: '800' },
  emptyCrew: { textAlign: 'center', color: C.textDim, fontWeight: '800', marginTop: 10 },

  backBtn: { padding: 20, alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 10, borderWidth: 3, borderColor: C.textLight, marginBottom: 30 },
  backBtnText: { color: C.textLight, fontSize: 15, fontWeight: '900' }
});
