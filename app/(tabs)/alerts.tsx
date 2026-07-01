import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getMyReports } from "@/src/api/client";
import { useTheme, glow, type Palette } from "@/src/theme";

type Report = {
  incidentRef: string; title: string; domain: string;
  riskBand: string; status: string; incidentDate: string;
};

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e",
};
const STATUS: Record<string, { label: string; color: string }> = {
  REPORTED:   { label: "Pending",    color: "#a855f7" },
  OPEN:       { label: "Open",       color: "#3b82f6" },
  MONITORING: { label: "Monitoring", color: "#eab308" },
  ESCALATED:  { label: "Urgent",     color: "#ef4444" },
  CLOSED:     { label: "Resolved",   color: "#22c55e" },
};

export default function AlertsScreen() {
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { setReports((await getMyReports()) as Report[]); } catch {}
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      <View style={s.header}>
        <Text style={s.title}>My Alerts</Text>
        <Text style={s.sub}>{reports.length} report{reports.length !== 1 ? "s" : ""} you submitted</Text>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={c.green} /></View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.incidentRef}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.green} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={40} color={c.faint} />
              <Text style={s.emptyTitle}>No reports yet</Text>
              <Text style={s.emptyText}>Incidents you report will appear here for tracking.</Text>
            </View>
          }
          renderItem={({ item: r }) => {
            const rc = RISK_COLOR[r.riskBand] ?? c.muted;
            const st = STATUS[r.status] ?? { label: r.status, color: c.muted };
            return (
              <View style={s.card}>
                <View style={[s.iconCircle, { backgroundColor: rc + "22" }]}>
                  <Ionicons name="warning" size={20} color={rc} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTop}>
                    <Text style={s.cardTitle} numberOfLines={1}>{r.title}</Text>
                    <View style={[s.statusPill, { backgroundColor: st.color + "22" }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={s.cardMeta}>
                    <Ionicons name="location-outline" size={12} color={c.faint} />
                    <Text style={s.cardRef}>{r.incidentRef}</Text>
                    <Text style={s.cardDate}>{r.incidentDate}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  title: { color: c.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  sub: { color: c.muted, fontSize: 13, marginTop: 2 },

  list: { padding: 20, gap: 12 },
  card: {
    flexDirection: "row", gap: 12, alignItems: "center",
    backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine, borderRadius: 18, padding: 14,
  },
  iconCircle: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { color: c.text, fontSize: 14, fontWeight: "700", flex: 1 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  cardRef: { color: c.muted, fontSize: 11, fontWeight: "600" },
  cardDate: { color: c.faint, fontSize: 11, marginLeft: "auto" },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { color: c.text, fontSize: 17, fontWeight: "800" },
  emptyText: { color: c.muted, fontSize: 13, textAlign: "center" },
});
