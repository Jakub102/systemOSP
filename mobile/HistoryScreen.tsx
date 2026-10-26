import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchAlarmHistory } from "./AlarmService";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { C } from "./constants/theme";
import { AlarmHistoryItem as IAlarmHistoryItem, RootStackParamList } from "./types";
import { StackScreenProps } from "@react-navigation/stack";

type Props = StackScreenProps<RootStackParamList, "History">;

const PAGE_SIZE = 20;

function HistoryCard({ item }: { item: IAlarmHistoryItem }) {
  const isGoing = item.myStatus === "going";
  const date = item.createdAt
    ? format(new Date(item.createdAt), "d MMM yyyy, HH:mm", { locale: pl })
    : "brak daty";

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>
        {isGoing ? "WYJAZD POTWIERDZONY" : "WYJAZD ODWOŁANY"}
      </Text>
      <Text style={styles.itemType}>{item.incidentType || "ZDARZENIE"}</Text>
      <Text style={styles.itemAddr}>{item.address}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.itemDate}>{date}</Text>
        <View
          style={[styles.pill, { backgroundColor: isGoing ? C.green : C.red }]}
        >
          <Text style={styles.pillText}>
            {isGoing ? "JECHAŁEM" : "NIE JECHAŁEM"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen(_: Props) {
  const [items, setItems] = useState<IAlarmHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const data = await fetchAlarmHistory(pageNum);
      const newItems = data.alarms ?? [];
      setItems((prev) => (replace ? newItems : [...prev, ...newItems]));
      setHasMore(newItems.length >= PAGE_SIZE);
    } catch {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || loading || error) return;
    const next = page + 1;
    setPage(next);
    load(next, false);
  };

  const renderEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyError}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(1, true)}>
            <Text style={styles.retryText}>SPRÓBUJ PONOWNIE</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <Text style={styles.empty}>BRAK HISTORII ALARMÓW</Text>;
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.red} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>JEDNOSTKA OSP</Text>
          <Text style={styles.headerTitle}>HISTORIA ALARMÓW</Text>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator style={styles.loader} color={C.white} size="large" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.alarmId}
            renderItem={({ item }) => <HistoryCard item={item} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.white}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={C.white} style={styles.footerLoader} />
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const CARD_SHADOW = {
  elevation: 5,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.13,
  shadowRadius: 10,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headerLabel: {
    color: C.whiteDim,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: C.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  loader: { flex: 1, marginTop: 60 },
  listContent: { padding: 20, paddingBottom: 32 },
  card: {
    backgroundColor: C.cardBg,
    padding: 18,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    marginBottom: 14,
    ...CARD_SHADOW,
  },
  cardLabel: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 1.2,
  },
  itemType: { color: C.textLight, fontSize: 19, fontWeight: "900" },
  itemAddr: { color: C.textDim, fontSize: 14, marginTop: 2, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  itemDate: { color: C.textDim, fontSize: 12, fontWeight: "700" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
  },
  pillText: { color: C.white, fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  footerLoader: { marginVertical: 16 },
  emptyContainer: { alignItems: "center", marginTop: 60, padding: 20 },
  emptyError: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: C.whiteDim,
    fontWeight: "800",
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: C.white,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: C.sand,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  retryText: { color: C.red, fontSize: 13, fontWeight: "900" },
});
