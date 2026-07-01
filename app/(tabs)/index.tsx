import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { colors, spacing, radius, shadow } from "@/src/constants/theme";

const DOMAINS = [
  { key: "SECURITY",  label: "Security",  color: "#dc2626", bg: "#fef2f2" },
  { key: "COMMUNITY", label: "Community", color: "#2563eb", bg: "#eff6ff" },
  { key: "HSE",       label: "HSE",       color: "#ca8a04", bg: "#fefce8" },
  { key: "POLITICAL", label: "Political", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "MARITIME",  label: "Maritime",  color: "#0d9488", bg: "#f0fdfa" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router   = useRouter();

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "Officer";
  const initials  = (user?.name ?? "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero header ───────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>{greeting}</Text>
              <Text style={styles.heroName}>{firstName}</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          {/* Live badge */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SENTINEL · SIS Operations · Live</Text>
          </View>
        </View>

        {/* ── Big Report CTA ────────────────────────────────────────────── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.reportCTA, shadow.lg]}
            onPress={() => router.push("/(tabs)/report")}
            activeOpacity={0.88}
          >
            {/* Orange pill top */}
            <View style={styles.ctaIconRow}>
              <View style={styles.ctaIconCircle}>
                <View style={styles.ctaIconH} />
                <View style={styles.ctaIconV} />
              </View>
              <View style={styles.ctaBadge}>
                <Text style={styles.ctaBadgeText}>GPS auto-capture</Text>
              </View>
            </View>
            <Text style={styles.ctaTitle}>Report an{"\n"}Incident</Text>
            <Text style={styles.ctaSub}>File a live security report with your current location</Text>
            <View style={styles.ctaArrowRow}>
              <Text style={styles.ctaArrowText}>File now</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SOS quick button ─────────────────────────────────────────── */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, styles.sosCard, shadow.sm]}
            onPress={() => router.push("/(tabs)/safety")}
            activeOpacity={0.85}
          >
            <Text style={styles.sosLabel}>SOS</Text>
            <Text style={styles.sosSubLabel}>Emergency{"\n"}Alert</Text>
          </TouchableOpacity>

          <View style={styles.statsStack}>
            {[
              { label: "AVAILABILITY", value: "24 / 7" },
              { label: "GPS",          value: "Auto"   },
              { label: "RESPONSE",     value: "Live"   },
            ].map((s, i) => (
              <View key={s.label} style={[styles.statItem, i < 2 && styles.statBorder]}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Domain quick-report ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REPORT BY TYPE</Text>
          <View style={styles.domainGrid}>
            {DOMAINS.map(d => (
              <TouchableOpacity
                key={d.key}
                style={[styles.domainBtn, { backgroundColor: d.bg, borderColor: d.color + "30" }]}
                onPress={() => router.push({ pathname: "/(tabs)/report", params: { domain: d.key } })}
                activeOpacity={0.75}
              >
                <View style={[styles.domainDot, { backgroundColor: d.color }]} />
                <Text style={[styles.domainLabel, { color: d.color }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Emergency contact strip ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
          <TouchableOpacity style={[styles.emergencyCard, shadow.sm]} activeOpacity={0.8}>
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyRedDot} />
              <View>
                <Text style={styles.emergencyTitle}>SIS Operations Centre</Text>
                <Text style={styles.emergencyNumber}>+234 807 022 8197</Text>
              </View>
            </View>
            <View style={styles.emergencyCallBtn}>
              <Text style={styles.emergencyCallText}>CALL</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom pad for tab bar */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgSecondary },

  // Hero
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 52, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroGreeting: { color: "rgba(255,255,255,0.7)", fontSize: 13, letterSpacing: 0.3 },
  heroName:     { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 2, letterSpacing: -0.5 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 7, marginTop: spacing.md,
    backgroundColor: "rgba(0,0,0,0.15)", alignSelf: "flex-start",
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#86efac" },
  liveText: { color: "#d1fae5", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },

  // Big CTA
  ctaWrap: { padding: spacing.lg, paddingBottom: 0 },
  reportCTA: {
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaIconRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ctaIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  ctaIconH: { width: 16, height: 2.5, backgroundColor: "#fff", borderRadius: 2, position: "absolute" },
  ctaIconV: { width: 2.5, height: 16, backgroundColor: "#fff", borderRadius: 2, position: "absolute" },
  ctaBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  ctaBadgeText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "600" },
  ctaTitle: { color: "#fff", fontSize: 34, fontWeight: "900", lineHeight: 40, letterSpacing: -0.5 },
  ctaSub:   { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20, marginTop: 2 },
  ctaArrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  ctaArrowText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  ctaArrow:     { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Quick row (SOS + stats)
  quickRow: {
    flexDirection: "row", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
  },
  quickCard: { borderRadius: radius.xl, flex: 1 },
  sosCard: {
    backgroundColor: "#dc2626",
    padding: spacing.lg,
    alignItems: "flex-start", justifyContent: "flex-end",
    minHeight: 100,
  },
  sosLabel:    { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: 2 },
  sosSubLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600", lineHeight: 16 },

  statsStack: {
    flex: 1, backgroundColor: colors.bg,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
  },
  statItem:   { flex: 1, paddingHorizontal: spacing.md, paddingVertical: 10, justifyContent: "center" },
  statBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  statValue:  { color: colors.primary, fontSize: 15, fontWeight: "800" },
  statLabel:  { color: colors.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 1, marginTop: 1 },

  // Section
  section:      { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 2 },

  domainGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  domainBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  domainDot:   { width: 9, height: 9, borderRadius: 4.5 },
  domainLabel: { fontSize: 12, fontWeight: "700" },

  // Emergency
  emergencyCard: {
    backgroundColor: colors.bg, borderRadius: radius.xl,
    borderWidth: 1, borderColor: "#fee2e2",
    padding: spacing.md, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  emergencyLeft:    { flexDirection: "row", alignItems: "center", gap: 12 },
  emergencyRedDot:  { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger },
  emergencyTitle:   { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  emergencyNumber:  { color: colors.danger, fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.5 },
  emergencyCallBtn: {
    backgroundColor: "#dc2626", borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  emergencyCallText: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
});
