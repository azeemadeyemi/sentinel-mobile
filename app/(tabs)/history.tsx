import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, StatusBar,
} from "react-native";
import { getMyReports } from "@/src/api/client";
import { colors, spacing, radius, shadow } from "@/src/constants/theme";

type Report = {
  incidentRef: string; title: string; domain: string;
  riskBand: string; status: string; incidentDate: string;
};

const RISK: Record<string, { color: string; bg: string }> = {
  CRITICAL: { color: "#dc2626", bg: "#fef2f2" },
  HIGH:     { color: "#ea580c", bg: "#fff7ed" },
  MEDIUM:   { color: "#ca8a04", bg: "#fefce8" },
  LOW:      { color: "#15803d", bg: "#f0fdf4" },
};
const DOMAIN_COLOR: Record<string, string> = {
  SECURITY: "#dc2626", COMMUNITY: "#2563eb", HSE: "#ca8a04",
  POLITICAL: "#7c3aed", MARITIME: "#0d9488",
};
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  REPORTED:   { label: "Pending",    color: "#7c3aed", bg: "#f5f3ff" },
  OPEN:       { label: "Open",       color: "#2563eb", bg: "#eff6ff" },
  MONITORING: { label: "Monitoring", color: "#ca8a04", bg: "#fefce8" },
  ESCALATED:  { label: "Escalated",  color: "#dc2626", bg: "#fef2f2" },
  CLOSED:     { label: "Closed",     color: "#6b7280", bg: "#f9fafb" },
};

export default function HistoryScreen() {
  const [reports,    setReports]    = useState<Report[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { setReports((await getMyReports()) as Report[]); } catch {}
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Reports</Text>
          <Text style={styles.headerSub}>{reports.length} submission{reports.length !== 1 ? "s" : ""}</Text>
        </View>
        {/* Report count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countNumber}>{reports.length}</Text>
          <Text style={styles.countLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={reports}
        keyExtractor={r => r.incidentRef}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyCard, shadow.sm]}>
            <View style={styles.emptyIconWrap}>
              <View style={styles.emptyIconInner} />
            </View>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyText}>
              Incidents you report in the field will appear here for tracking.
            </Text>
          </View>
        }
        renderItem={({ item: r }) => {
          const risk   = RISK[r.riskBand]  ?? { color: colors.textMuted, bg: colors.bgSecondary };
          const status = STATUS[r.status]  ?? { label: r.status, color: colors.textMuted, bg: colors.bgSecondary };
          const dc     = DOMAIN_COLOR[r.domain] ?? colors.textMuted;
          return (
            <View style={[styles.card, shadow.sm]}>
              {/* Thick risk bar on left */}
              <View style={[styles.riskBar, { backgroundColor: risk.color }]} />

              <View style={styles.cardBody}>
                {/* Ref + Status */}
                <View style={styles.cardTop}>
                  <Text style={styles.ref}>{r.incidentRef}</Text>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                {/* Title — larger & bolder */}
                <Text style={styles.cardTitle} numberOfLines={2}>{r.title}</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <View style={[styles.domainPill, { backgroundColor: dc + "18" }]}>
                    <View style={[styles.dot, { backgroundColor: dc }]} />
                    <Text style={[styles.metaChip, { color: dc }]}>{r.domain}</Text>
                  </View>
                  <View style={[styles.riskPill, { backgroundColor: risk.bg }]}>
                    <Text style={[styles.metaChip, { color: risk.color }]}>{r.riskBand}</Text>
                  </View>
                  <Text style={styles.dateText}>{r.incidentDate}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bgSecondary },
  centered:{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgSecondary },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 52, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 3 },
  countBadge: {
    alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.xl, paddingHorizontal: 16, paddingVertical: 8,
  },
  countNumber: { color: "#fff", fontSize: 26, fontWeight: "900" },
  countLabel:  { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "700", letterSpacing: 1 },

  list: { padding: spacing.lg, gap: spacing.md },

  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: "row", overflow: "hidden",
  },
  riskBar:  { width: 6 },
  cardBody: { flex: 1, padding: spacing.md },

  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  ref:     { color: colors.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },

  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800" },

  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 22, marginBottom: 10 },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: 10 },

  metaRow:    { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  domainPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 4 },
  riskPill:   { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 4 },
  dot:        { width: 7, height: 7, borderRadius: 3.5 },
  metaChip:   { fontSize: 10, fontWeight: "800" },
  dateText:   { color: colors.textMuted, fontSize: 11, marginLeft: "auto" },

  emptyCard: {
    backgroundColor: colors.bg, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, alignItems: "center", marginTop: spacing.lg, gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryFaint,
    alignItems: "center", justifyContent: "center",
  },
  emptyIconInner: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2.5, borderColor: colors.primary,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  emptyText:  { color: colors.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 20 },
});
