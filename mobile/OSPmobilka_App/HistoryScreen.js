import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAlarmHistory } from './AlarmService';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { C } from './constants/theme';

function AlarmHistoryItem({ item }) {
  const isGoing = item.myStatus === 'going';
  const date = item.createdAt
    ? format(new Date(item.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })
    : '—';

  return (
    <View style={[styles.card, { borderLeftColor: isGoing ? C.green : C.red }]}>
      <Text style={styles.cardLabel}>{isGoing ? 'WYJAZD POTWIERDZONY' : 'WYJAZD ODWOŁANY'}</Text>
      <Text style={styles.itemType}>{item.incidentType || 'ZDARZENIE'}</Text>
      <Text style={styles.itemAddr}>{item.address}</Text>
      <View style={styles.footer}>
        <Text style={styles.itemDate}>{date}</Text>
        <Text style={[styles.statusText, { color: isGoing ? C.green : C.red }]}>
          {isGoing ? 'JECHAŁEM' : 'NIE JECHAŁEM'}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAlarmHistory(1);
      setItems(data.alarms || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>HISTORIA ALARMÓW</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={item => item.alarmId}
          renderItem={({ item }) => <AlarmHistoryItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.red} />
          }
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={!loading && <Text style={styles.empty}>BRAK HISTORII</Text>}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  safe: { flex: 1 },
  header: { backgroundColor: C.red, padding: 20, paddingBottom: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 6,
    elevation: 3,
  },
  cardLabel: { color: '#48484A', fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  itemType: { color: '#000000', fontSize: 18, fontWeight: '900' },
  itemAddr: { color: '#48484A', fontSize: 14, marginTop: 2, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 8 },
  itemDate: { color: '#48484A', fontSize: 12, fontWeight: '700' },
  statusText: { fontSize: 14, fontWeight: '900' },
  empty: { textAlign: 'center', marginTop: 50, color: '#48484A', fontWeight: '800' }
});
