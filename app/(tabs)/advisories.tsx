"use client";
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, glow } from "@/src/theme";
import { getAdvisories } from "@/src/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────
type Severity = "CRITICAL" | "WARNING" | "INFO";

type Advisory = {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  hub: string;
  area: string | null;
  issuedBy: string;
  issuedAt: string;  // ISO date string
  validUntil: string | null;
  active: boolean;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const SEV_CONFIG: Record<Severity, { color: string; bg: string; border: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  CRITICAL: { color: "#ef4444", bg: "#450a0a", border: "#7f1d1d", icon: "alert-circle",    label: "CRITICAL" },
  WARNING:  { color: "#f97316", bg: "#431407", border: "#7c2d12", icon: "warning",          label: "WARNING"  },
  INFO:     { color: "#22c55e", bg: "#052e16", border: "#14532d", icon: "information-circle", label: "INFO"   },
};

// Hub vocabulary matches the web/DB (EAST | WEST | NATIONWIDE | OFFSHORE).
const HUB_LABEL: Record<string, string> = {
  EAST: "East Hub", WEST: "West Hub", NATIONWIDE: "Nationwide", OFFSHORE: "Offshore",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0)  return `${days}d ago`;
  if (hours > 0)  return `${hours}h ago`;
  if (mins  > 0)  return `${mins}m ago`;
  return "Just now";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Advisory Card ─────────────────────────────────────────────────────────────
function AdvisoryCard({ advisory, c }: { advisory: Advisory; c: ReturnType<typeof useTheme> }) {
  const [expanded, setExpanded] = useState(advisory.severity === "CRITICAL");
  const sev = SEV_CONFIG[advisory.severity] ?? SEV_CONFIG.INFO;

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
      style={[styles.card, {
        backgroundColor: c.isDark ? sev.bg : "#fff",
        borderColor: sev.border,
        opacity: advisory.active ? 1 : 0.55,
      }]}
    >
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={[styles.sevBadge, { backgroundColor: sev.color + "22", borderColor: sev.color + "55" }]}>
          <Ionicons name={sev.icon} size={13} color={sev.color} />
          <Text style={[styles.sevLabel, { color: sev.color }]}>{sev.label}</Text>
        </View>

        <View style={styles.cardHeaderRight}>
          {!advisory.active && (
            <View style={[styles.expiredBadge, { borderColor: c.cardLine }]}>
              <Text style={[styles.expiredText, { color: c.muted }]}>Expired</Text>
            </View>
          )}
          <Text style={[styles.timeAgo, { color: c.faint }]}>{timeAgo(advisory.issuedAt)}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16} color={c.faint}
          />
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={expanded ? undefined : 2}>
        {advisory.title}
      </Text>

      {/* Hub + area */}
      <View style={styles.metaRow}>
        <View style={[styles.hubPill, { backgroundColor: c.card, borderColor: c.cardLine }]}>
          <Ionicons name="location" size={11} color={c.muted} />
          <Text style={[styles.hubText, { color: c.muted }]}>{HUB_LABEL[advisory.hub] ?? advisory.hub}</Text>
        </View>
        <Text style={[styles.areaText, { color: c.faint }]} numberOfLines={1}>{advisory.area}</Text>
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={[styles.expandedBody, { borderTopColor: sev.border }]}>
          <Text style={[styles.message, { color: c.isDark ? "#d4d4d8" : "#374151" }]}>
            {advisory.message}
          </Text>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Ionicons name="person-circle-outline" size={13} color={c.faint} />
              <Text style={[styles.footerText, { color: c.faint }]}>{advisory.issuedBy}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={13} color={c.faint} />
              <Text style={[styles.footerText, { color: c.faint }]}>{formatDate(advisory.issuedAt)}</Text>
            </View>
          </View>
          {advisory.validUntil && (
            <View style={[styles.validUntilRow, { backgroundColor: sev.color + "15" }]}>
              <Ionicons name="alarm-outline" size={13} color={sev.color} />
              <Text style={[styles.validUntilText, { color: sev.color }]}>
                Valid until: {formatDate(advisory.validUntil)}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AdvisoriesScreen() {
  const c = useTheme();
  const glowProps = glow(c);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | Severity>("ALL");

  const load = useCallback(async () => {
    try { setAdvisories((await getAdvisories()) as unknown as Advisory[]); } catch { /* keep last */ }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
    const timer = setInterval(load, 45_000); // stay current without a manual pull
    return () => clearInterval(timer);
  }, [load]);

  const active   = advisories.filter(a => a.active);
  const expired  = advisories.filter(a => !a.active);
  const criticalCount = active.filter(a => a.severity === "CRITICAL").length;

  const displayed = advisories.filter(a =>
    filter === "ALL" || a.severity === filter
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} />

      {/* Gradient header */}
      <LinearGradient
        colors={glowProps.colors as [string, string, string]}
        locations={glowProps.locations as [number, number, number]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: c.text }]}>Advisories</Text>
            <Text style={[styles.headerSub, { color: c.muted }]}>
              {active.length} active · {expired.length} expired
            </Text>
          </View>
          {criticalCount > 0 && (
            <View style={styles.criticalBadge}>
              <Ionicons name="alert-circle" size={16} color="#fff" />
              <Text style={styles.criticalBadgeText}>{criticalCount} Critical</Text>
            </View>
          )}
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map(f => {
            const isActive = filter === f;
            const sev = f !== "ALL" ? SEV_CONFIG[f] : null;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive
                      ? (sev ? sev.color : c.green)
                      : c.card,
                    borderColor: isActive
                      ? (sev ? sev.color : c.green)
                      : c.cardLine,
                  },
                ]}
              >
                {sev && <Ionicons name={sev.icon} size={12} color={isActive ? "#fff" : sev.color} />}
                <Text style={[
                  styles.filterText,
                  { color: isActive ? "#fff" : c.muted },
                ]}>
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.green} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={c.green} />
          </View>
        ) : displayed.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={48} color={c.faint} />
            <Text style={[styles.emptyText, { color: c.muted }]}>No advisories</Text>
            <Text style={[styles.emptySubText, { color: c.faint }]}>
              The control centre will broadcast advisories here
            </Text>
          </View>
        ) : (
          displayed.map(a => <AdvisoryCard key={a.id} advisory={a} c={c} />)
        )}

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color={c.faint} />
          <Text style={[styles.footerNoteText, { color: c.faint }]}>
            Advisories are issued by SIS Control Centre only
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:            { flex: 1 },
  header:          { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  headerContent:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerTitle:     { fontSize: 26, fontWeight: "800" },
  headerSub:       { fontSize: 13, marginTop: 2 },
  criticalBadge:   { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#7f1d1d", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  criticalBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  filterScroll:    { marginHorizontal: -4 },
  filterPill:      { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginHorizontal: 4, marginBottom: 4 },
  filterText:      { fontSize: 12, fontWeight: "600" },

  list:            { padding: 16, paddingBottom: 32, gap: 12 },

  card:            { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sevBadge:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  sevLabel:        { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  expiredBadge:    { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  expiredText:     { fontSize: 10, fontWeight: "600" },
  timeAgo:         { fontSize: 11 },

  cardTitle:       { fontSize: 15, fontWeight: "700", lineHeight: 21 },

  metaRow:         { flexDirection: "row", alignItems: "center", gap: 8 },
  hubPill:         { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  hubText:         { fontSize: 11, fontWeight: "600" },
  areaText:        { fontSize: 11, flex: 1 },

  expandedBody:    { borderTopWidth: 1, paddingTop: 10, gap: 10 },
  message:         { fontSize: 13, lineHeight: 20 },
  footerRow:       { gap: 6 },
  footerItem:      { flexDirection: "row", alignItems: "center", gap: 5 },
  footerText:      { fontSize: 11 },
  validUntilRow:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  validUntilText:  { fontSize: 12, fontWeight: "600" },

  empty:           { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText:       { fontSize: 16, fontWeight: "600" },
  emptySubText:    { fontSize: 13, textAlign: "center", maxWidth: 240 },

  footerNote:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, paddingTop: 16 },
  footerNoteText:  { fontSize: 11 },
});
