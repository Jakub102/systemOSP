import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from './constants/theme';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('STRAŻAK');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('userName')
      .then(n => n && setUserName(n.toUpperCase()))
      .catch(e => console.warn('Błąd odczytu nazwy jednostki:', e));
  }, []);

  const testAlarmPopup = () => {
    navigation.navigate('AlarmScreen', {
      alarmData: {
        alarmId: 'TEST-123',
        incidentType: 'POŻAR BUDYNKU',
        address: 'ul. Strażacka 15, Florianów',
        priority: 'ALARMOWY',
        notes: 'Możliwe osoby w budynku',
        stationLat: 52.2297,
        stationLng: 21.0122,
        responseDeadlineMinutes: 3,
      }
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />

      <View style={styles.topHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.unitLabel}>JEDNOSTKA OSP</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: available ? C.green : C.white }]} />
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <View style={[styles.card, styles.alarmStyleCard]}>
            <Text style={styles.cardLabel}>STATUS GOTOWOŚCI</Text>
            <View style={styles.availRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.availStatus, { color: available ? C.green : '#000000' }]}>
                  {available ? 'JESTEM W GOTOWOŚCI' : 'BRAK GOTOWOŚCI'}
                </Text>
                <Text style={styles.menuSub}>ZMIANA STATUSU POWIADOMIEŃ</Text>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: C.border, true: C.green }}
                thumbColor={C.white}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.card, styles.alarmStyleCard]}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.cardLabel}>LOGI</Text>
            <Text style={styles.menuTitle}>HISTORIA WYJAZDÓW</Text>
            <Text style={styles.menuSub}>PRZEGLĄDAJ RAPORTY</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity style={styles.testBtn} onPress={testAlarmPopup}>
              <Text style={styles.testBtnText}>URUCHOM ALARM TESTOWY ({__DEV__ ? 'DEV' : ''})</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  topHeader: {
    backgroundColor: C.red,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  unitLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  userName:  { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
  statusDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },

  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alarmStyleCard: {
    borderLeftWidth: 6,
    borderLeftColor: C.red,
  },
  cardLabel: { color: '#48484A', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  availRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availStatus: { fontSize: 18, fontWeight: '900' },

  menuTitle: { color: '#000000', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  menuSub:   { color: '#48484A', fontSize: 12, marginTop: 4, fontWeight: '700' },

  testBtn: {
    marginTop: 10,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: C.red,
    alignItems: 'center',
  },
  testBtnText: { color: C.red, fontSize: 14, fontWeight: '900' },
});
