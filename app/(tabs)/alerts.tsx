import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, StatusBar, Modal, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getMyReports } from "@/src/api/client";
import { useTheme, glow, type Palette } from "@/src/theme";
import MiniMap from "@/src/components/MiniMap";

type Report = {
  incidentRef: string; title: string; domain: string;
  riskBand: string; status: string; incidentDate: string;
  location?: string; narrative?: string; latitude?: number; longitude?: number;
};

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e",
};
const STATUS: Record<string, { label: string; color: string }> = {
  REPORTED: { label: "Pending", color: "#a855f7" },
  OPEN: { label: "Open", color: "#3b82f6" },
  MONITORING: { label: "Monitoring", color: "#eab308" },
  ESCALATED: { label: "Urgent", color: "#ef4444" },
  CLOSED: { label: "Resolved", color: "#22c55e" },
};
const DOMAINS = ["SECURITY", "COMMUNITY", "HSE", "POLITICAL", "MARITIME"];

export default function AlertsScreen() {
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { setReports((await getMyReports()) as Report[]); } catch {}
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => filters.size === 0 ? reports : reports.filter(r => filters.has(r.domain)),
    [reports, filters]
  );

  function toggleFilter(d: string) {
    setFilters(prev => {
      const n = new Set(prev);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>My Alerts</Text>
          <Text style={s.sub}>{visible.length} report{visible.length !== 1 ? "s" : ""}{filters.size ? " filtered" : ""}</Text>
        </View>
        <TouchableOpacity style={[s.filterBtn, filters.size > 0 && s.filterBtnActive]} onPress={() => setFilterOpen(true)} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color={filters.size > 0 ? "#04140a" : c.text} />
          {filters.size > 0 && <View style={s.filterCount}><Text style={s.filterCountText}>{filters.size}</Text></View>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={c.green} /></View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={r => r.incidentRef}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={c.green} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={40} color={c.faint} />
              <Text style={s.emptyTitle}>{filters.size ? "No matching reports" : "No reports yet"}</Text>
              <Text style={s.emptyText}>{filters.size ? "Try clearing the filter." : "Incidents you report will appear here."}</Text>
            </View>
          }
          renderItem={({ item: r }) => {
            const rc = RISK_COLOR[r.riskBand] ?? c.muted;
            const st = STATUS[r.status] ?? { label: r.status, color: c.muted };
            return (
              <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => setSelected(r)}>
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
                    <Text style={s.cardRef} numberOfLines={1}>{r.location ?? r.incidentRef}</Text>
                    <Text style={s.cardDate}>{r.incidentDate}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.faint} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Filter sheet */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={s.sheetOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Filter by category</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}><Ionicons name="close" size={24} color={c.muted} /></TouchableOpacity>
            </View>
            <View style={s.chipWrap}>
              {DOMAINS.map(d => {
                const active = filters.has(d);
                return (
                  <TouchableOpacity key={d} style={[s.chip, active && s.chipActive]} onPress={() => toggleFilter(d)} activeOpacity={0.8}>
                    <Text style={[s.chipText, active && s.chipTextActive]}>{d.charAt(0) + d.slice(1).toLowerCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.sheetActions}>
              <TouchableOpacity style={s.clearBtn} onPress={() => setFilters(new Set())} activeOpacity={0.8}>
                <Text style={s.clearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.applyBtn} onPress={() => setFilterOpen(false)} activeOpacity={0.9}>
                <Text style={s.applyText}>Apply filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail sheet */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.sheetOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            {selected && (() => {
              const rc = RISK_COLOR[selected.riskBand] ?? c.muted;
              const st = STATUS[selected.status] ?? { label: selected.status, color: c.muted };
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={s.detailHead}>
                    <View style={[s.iconCircle, { backgroundColor: rc + "22" }]}>
                      <Ionicons name="warning" size={22} color={rc} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailTitle}>{selected.title}</Text>
                      <Text style={s.detailRef}>{selected.incidentRef} · {selected.incidentDate}</Text>
                    </View>
                    <View style={[s.statusPill, { backgroundColor: st.color + "22" }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  <View style={s.detailChips}>
                    <View style={[s.detailChip, { borderColor: rc + "55" }]}><Text style={[s.detailChipText, { color: rc }]}>{selected.riskBand}</Text></View>
                    <View style={s.detailChip}><Text style={[s.detailChipText, { color: c.muted }]}>{selected.domain}</Text></View>
                  </View>

                  <Text style={s.detailLabel}>Location</Text>
                  <View style={s.detailLocRow}>
                    <Ionicons name="location" size={16} color={c.green} />
                    <Text style={s.detailLocText}>{selected.location ?? "Location not specified"}</Text>
                  </View>
                  {selected.latitude != null && selected.longitude != null && (
                    <MiniMap coords={{ lat: selected.latitude, lng: selected.longitude }} radius={300} isDark={c.isDark} accent={rc} height={150} />
                  )}

                  <Text style={s.detailLabel}>Details</Text>
                  <Text style={s.detailBody}>{selected.narrative ?? "No additional details provided."}</Text>

                  <TouchableOpacity style={s.closeBtn} onPress={() => setSelected(null)} activeOpacity={0.9}>
                    <Text style={s.closeText}>Close</Text>
                  </TouchableOpacity>
                  <View style={{ height: 12 }} />
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  title: { color: c.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  sub: { color: c.muted, fontSize: 13, marginTop: 2 },
  filterBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, alignItems: "center", justifyContent: "center",
  },
  filterBtnActive: { backgroundColor: c.green, borderColor: c.green },
  filterCount: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  filterCountText: { color: "#fff", fontSize: 10, fontWeight: "800" },

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
  cardRef: { color: c.muted, fontSize: 11, fontWeight: "600", flex: 1 },
  cardDate: { color: c.faint, fontSize: 11 },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { color: c.text, fontSize: 17, fontWeight: "800" },
  emptyText: { color: c.muted, fontSize: 13, textAlign: "center" },

  // Sheets
  sheetOverlay: { flex: 1, backgroundColor: c.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: c.bgElev, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34, maxHeight: "85%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.cardLine, alignSelf: "center", marginBottom: 16 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  sheetTitle: { color: c.text, fontSize: 18, fontWeight: "800" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  chip: { borderWidth: 1.5, borderColor: c.cardLine, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  chipActive: { backgroundColor: c.red, borderColor: c.red },
  chipText: { color: c.muted, fontSize: 14, fontWeight: "700" },
  chipTextActive: { color: "#fff" },

  sheetActions: { flexDirection: "row", gap: 12 },
  clearBtn: { flex: 1, borderWidth: 1.5, borderColor: c.cardLine, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  clearText: { color: c.text, fontSize: 15, fontWeight: "700" },
  applyBtn: { flex: 2, backgroundColor: c.green, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  applyText: { color: "#04140a", fontSize: 15, fontWeight: "800" },

  // Detail
  detailHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  detailTitle: { color: c.text, fontSize: 17, fontWeight: "800" },
  detailRef: { color: c.muted, fontSize: 12, marginTop: 2 },
  detailChips: { flexDirection: "row", gap: 8, marginBottom: 20 },
  detailChip: { borderWidth: 1, borderColor: c.cardLine, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  detailChipText: { fontSize: 11, fontWeight: "800" },
  detailLabel: { color: c.faint, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  detailLocRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  detailLocText: { color: c.text, fontSize: 14, flex: 1 },
  detailBody: { color: c.muted, fontSize: 14, lineHeight: 22, marginBottom: 20 },
  closeBtn: { backgroundColor: c.red, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  closeText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
