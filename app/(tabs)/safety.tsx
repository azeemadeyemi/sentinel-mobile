import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, Animated, Easing, Vibration,
} from "react-native";
import * as Location from "expo-location";
import { colors, spacing, radius, shadow } from "@/src/constants/theme";
import { sendSOSAlert, getNearbyIncidents, type NearbyIncident } from "@/src/api/client";
import { useAuth } from "@/src/store/auth";

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "#dc2626", HIGH: "#ea580c", MEDIUM: "#ca8a04", LOW: "#15803d",
};
const DOMAIN_COLOR: Record<string, string> = {
  SECURITY: "#dc2626", COMMUNITY: "#2563eb", HSE: "#ca8a04",
  POLITICAL: "#7c3aed", MARITIME: "#0d9488",
};

function scoreColor(s: number) { return s >= 80 ? "#15803d" : s >= 55 ? "#ca8a04" : "#dc2626"; }
function scoreLabel(s: number) { return s >= 80 ? "Clear" : s >= 55 ? "Moderate" : "High Risk"; }

type SOSState = "idle" | "countdown" | "active" | "cancelled";

// ── Pulsing ring component ────────────────────────────────────────────────────
function PulsingRing({ active }: { active: boolean }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!active) { scale1.setValue(1); scale2.setValue(1); return; }
    const loop1 = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale1, { toValue: 1.6, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(opacity1, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale1, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity1, { toValue: 0.6, duration: 0, useNativeDriver: true }),
      ]),
    ]));
    const loop2 = Animated.loop(Animated.sequence([
      Animated.delay(450),
      Animated.parallel([
        Animated.timing(scale2, { toValue: 1.6, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(opacity2, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale2, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity2, { toValue: 0.3, duration: 0, useNativeDriver: true }),
      ]),
    ]));
    loop1.start(); loop2.start();
    return () => { loop1.stop(); loop2.stop(); };
  }, [active]);

  if (!active) return null;
  return (
    <>
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
    </>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 80;
  const strokeW = 7;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Background ring */}
      <View style={{
        position: "absolute", width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeW, borderColor: colors.border,
      }} />
      {/* Score arc — approximated with a colored border on one side */}
      <View style={{
        position: "absolute", width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeW, borderColor: color,
        borderRightColor: "transparent", borderBottomColor: score > 50 ? color : "transparent",
        transform: [{ rotate: "-90deg" }],
      }} />
      <View style={{ alignItems: "center" }}>
        <Text style={{ color, fontSize: 20, fontWeight: "800" }}>{score}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "600" }}>/ 100</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SafetyScreen() {
  const { user } = useAuth();
  const [sosState,    setSosState]   = useState<SOSState>("idle");
  const [countdown,   setCountdown]  = useState(10);
  const [location,    setLocation]   = useState<string | null>(null);
  const [coords,      setCoords]     = useState<{ lat: number; lng: number } | null>(null);
  const [nearby,      setNearby]     = useState<NearbyIncident[]>([]);
  const [safetyScore, setSafetyScore] = useState<number>(54);
  const [scanning,    setScanning]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return;
      Location.getCurrentPositionAsync({}).then(loc => {
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        Location.reverseGeocodeAsync(loc.coords).then(results => {
          const r = results[0];
          if (r) setLocation([r.district ?? r.city, r.region].filter(Boolean).join(", "));
        });
      });
    });
    runScan();
  }, []);

  async function runScan() {
    setScanning(true);
    try {
      const result = await getNearbyIncidents(coords?.lat, coords?.lng);
      setNearby(result.incidents);
      setSafetyScore(result.safetyScore);
    } finally {
      setScanning(false);
    }
  }

  function animatePress(pressed: boolean) {
    Animated.spring(scaleAnim, {
      toValue: pressed ? 0.93 : 1,
      useNativeDriver: true, speed: 40,
    }).start();
  }

  function startSOS() {
    Vibration.vibrate([0, 100, 50, 100]);
    setSosState("countdown");
    setCountdown(10);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setSosState("active");
          Vibration.vibrate([0, 300, 100, 300]);
          sendSOSAlert({ latitude: coords?.lat, longitude: coords?.lng, reporterName: user?.name });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelSOS() {
    if (timerRef.current) clearInterval(timerRef.current);
    Vibration.vibrate(50);
    setSosState("cancelled");
    setTimeout(() => setSosState("idle"), 2500);
  }

  function resetSOS() { setSosState("idle"); setCountdown(10); }

  const SCORE_COLOR = scoreColor(safetyScore);
  const SCORE_LABEL = scoreLabel(safetyScore);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#991b1b" />

      {/* Red header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety & SOS</Text>
        <Text style={styles.headerSub}>
          {location ? `📍 ${location}` : "Detecting location…"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── SOS Section ──────────────────────────────────────────────────── */}
        <View style={styles.sosSection}>

          {/* Idle state */}
          {sosState === "idle" && (
            <View style={styles.sosWrap}>
              <Text style={styles.sosHint}>Press to send emergency alert to SIS Operations</Text>
              <View style={styles.sosButtonWrap}>
                <PulsingRing active={false} />
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={styles.sosButton}
                    onPress={startSOS}
                    onPressIn={() => animatePress(true)}
                    onPressOut={() => animatePress(false)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.sosButtonLabel}>SOS</Text>
                    <Text style={styles.sosButtonSub}>EMERGENCY</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
              <View style={styles.sosInfoRow}>
                {["GPS location", "Voice record", "SIS alert"].map((t, i) => (
                  <View key={t} style={styles.sosInfoItem}>
                    <View style={[styles.sosInfoDot, { backgroundColor: i === 0 ? colors.primary : i === 1 ? colors.orange : "#dc2626" }]} />
                    <Text style={styles.sosInfoText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Countdown state */}
          {sosState === "countdown" && (
            <View style={styles.sosWrap}>
              <Text style={styles.countdownTitle}>Auto-SOS Active</Text>
              <View style={styles.sosButtonWrap}>
                <PulsingRing active={true} />
                <View style={[styles.sosButton, styles.sosButtonCountdown]}>
                  <Text style={styles.countdownNumber}>{String(countdown).padStart(2, "0")}</Text>
                  <Text style={styles.countdownSub}>seconds</Text>
                </View>
              </View>
              <Text style={styles.countdownHint}>Recording your location…</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelSOS} activeOpacity={0.85}>
                <Text style={styles.cancelBtnText}>Cancel Alert</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active/sent state */}
          {sosState === "active" && (
            <View style={styles.sosWrap}>
              <View style={[styles.sosButton, styles.sosButtonSent]}>
                <Text style={styles.sentCheck}>✓</Text>
                <Text style={styles.sentLabel}>SENT</Text>
              </View>
              <Text style={styles.sentTitle}>Alert Dispatched</Text>
              <Text style={styles.sentSub}>
                SIS Operations has been notified with your GPS location. Stay safe.
              </Text>
              <TouchableOpacity style={styles.resetBtn} onPress={resetSOS} activeOpacity={0.85}>
                <Text style={styles.resetBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancelled state */}
          {sosState === "cancelled" && (
            <View style={styles.sosWrap}>
              <View style={[styles.sosButton, { backgroundColor: colors.border }]}>
                <Text style={[styles.sosButtonLabel, { color: colors.textSecondary }]}>SOS</Text>
                <Text style={[styles.sosButtonSub, { color: colors.textMuted }]}>CANCELLED</Text>
              </View>
              <Text style={[styles.sentSub, { marginTop: spacing.md }]}>Alert cancelled.</Text>
            </View>
          )}
        </View>

        {/* ── Safety Scan ───────────────────────────────────────────────────── */}
        <View style={styles.scanSection}>
          <View style={styles.scanHeader}>
            <Text style={styles.scanTitle}>Safety Scan</Text>
            <TouchableOpacity style={styles.rescanBtn} onPress={runScan} disabled={scanning}>
              <Text style={styles.rescanText}>{scanning ? "SCANNING…" : "RE-SCAN"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.scanSub}>Incidents within 6 km of your location</Text>

          {/* Score row */}
          <View style={[styles.scoreRow, shadow.sm]}>
            <View style={styles.scoreItem}>
              <ScoreRing score={safetyScore} color={SCORE_COLOR} />
              <Text style={styles.scoreItemLabel}>Safety Score</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreNumber, { color: colors.text }]}>{nearby.length}</Text>
              <Text style={styles.scoreItemLabel}>Nearby Incidents</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <View style={[styles.ratingDot, { backgroundColor: SCORE_COLOR }]} />
              <Text style={[styles.ratingLabel, { color: SCORE_COLOR }]}>{SCORE_LABEL}</Text>
              <Text style={styles.scoreItemLabel}>Rating</Text>
            </View>
          </View>

          {/* Incident list */}
          <Text style={styles.nearbyLabel}>NEARBY INCIDENTS</Text>
          <View style={[styles.nearbyCard, shadow.sm]}>
            {nearby.map((item, i) => (
              <View key={item.ref} style={[styles.nearbyRow, i < nearby.length - 1 && styles.nearbyRowBorder]}>
                <View style={[styles.nearbyRiskBar, { backgroundColor: RISK_COLOR[item.risk] ?? "#6b7280" }]} />
                <View style={styles.nearbyBody}>
                  <View style={styles.nearbyTop}>
                    <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.nearbyDist, { color: RISK_COLOR[item.risk] ?? "#6b7280" }]}>{item.dist}</Text>
                  </View>
                  <View style={styles.nearbyMeta}>
                    <View style={[styles.nearbyDomainPill, { backgroundColor: (DOMAIN_COLOR[item.domain] ?? "#6b7280") + "18" }]}>
                      <View style={[styles.nearbyDot, { backgroundColor: DOMAIN_COLOR[item.domain] ?? "#6b7280" }]} />
                      <Text style={[styles.nearbyDomainText, { color: DOMAIN_COLOR[item.domain] ?? "#6b7280" }]}>{item.domain}</Text>
                    </View>
                    <Text style={styles.nearbyAge}>{item.age}</Text>
                  </View>
                </View>
              </View>
            ))}
            {nearby.length === 0 && (
              <View style={{ padding: spacing.lg, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  {scanning ? "Scanning area…" : "No incidents detected nearby"}
                </Text>
              </View>
            )}
          </View>

          {/* Advice */}
          <View style={[styles.adviceCard, { borderColor: SCORE_COLOR + "40", backgroundColor: SCORE_COLOR + "0f" }]}>
            <Text style={[styles.adviceTitle, { color: SCORE_COLOR }]}>
              {safetyScore >= 80 ? "Area appears clear" : safetyScore >= 55 ? "Exercise caution" : "Elevated risk, stay vigilant"}
            </Text>
            <Text style={styles.adviceText}>
              {safetyScore >= 80
                ? "No significant incidents detected in your immediate area."
                : safetyScore >= 55
                ? "Some incidents reported nearby. Maintain situational awareness and avoid isolated areas."
                : "Multiple high-risk incidents nearby. Limit movement, report any suspicious activity immediately."}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const SOS_SIZE = 140;

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bgSecondary },

  header: {
    backgroundColor: "#991b1b",
    paddingTop: 52, paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSub:   { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },

  scroll: { paddingBottom: spacing.xxl },

  // SOS section
  sosSection: {
    backgroundColor: colors.bg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sosWrap: { alignItems: "center", paddingHorizontal: spacing.lg },
  sosHint: { color: colors.textSecondary, fontSize: 13, textAlign: "center", marginBottom: spacing.lg },

  sosButtonWrap: {
    width: SOS_SIZE + 60, height: SOS_SIZE + 60,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg,
  },
  pulseRing: {
    position: "absolute",
    width: SOS_SIZE, height: SOS_SIZE, borderRadius: SOS_SIZE / 2,
    backgroundColor: "#dc2626",
  },
  sosButton: {
    width: SOS_SIZE, height: SOS_SIZE, borderRadius: SOS_SIZE / 2,
    backgroundColor: "#dc2626",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#dc2626", shadowOpacity: 0.45, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  sosButtonCountdown: { backgroundColor: "#b91c1c" },
  sosButtonSent:      { backgroundColor: colors.primary },
  sosButtonLabel: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 2 },
  sosButtonSub:   { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginTop: 2 },

  sosInfoRow:  { flexDirection: "row", gap: spacing.lg },
  sosInfoItem: { alignItems: "center", gap: 4 },
  sosInfoDot:  { width: 8, height: 8, borderRadius: 4 },
  sosInfoText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },

  countdownTitle:  { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: spacing.lg },
  countdownNumber: { color: "#fff", fontSize: 44, fontWeight: "900" },
  countdownSub:    { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600", marginTop: -4 },
  countdownHint:   { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.lg },

  cancelBtn: {
    backgroundColor: "#dc2626", borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 48,
  },
  cancelBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  sentCheck: { color: "#fff", fontSize: 40, fontWeight: "700" },
  sentLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  sentTitle: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: spacing.lg },
  sentSub:   { color: colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, marginTop: spacing.sm },

  resetBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 40,
  },
  resetBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Safety Scan
  scanSection: { padding: spacing.lg, gap: spacing.md },
  scanHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scanTitle:   { color: colors.text, fontSize: 20, fontWeight: "800" },
  rescanBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  rescanText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  scanSub:    { color: colors.textSecondary, fontSize: 13, marginTop: -spacing.sm },

  scoreRow: {
    backgroundColor: colors.bg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: "row", padding: spacing.md, alignItems: "center",
  },
  scoreItem:      { flex: 1, alignItems: "center", gap: 4 },
  scoreDivider:   { width: 1, height: 60, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  scoreNumber:    { fontSize: 28, fontWeight: "800" },
  scoreItemLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "600", textAlign: "center" },
  ratingDot:      { width: 16, height: 16, borderRadius: 8 },
  ratingLabel:    { fontSize: 13, fontWeight: "800" },

  nearbyLabel: {
    color: colors.textMuted, fontSize: 10, fontWeight: "700", letterSpacing: 2,
  },
  nearbyCard: {
    backgroundColor: colors.bg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  nearbyRow: { flexDirection: "row" },
  nearbyRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  nearbyRiskBar: { width: 4 },
  nearbyBody: { flex: 1, padding: spacing.md },
  nearbyTop:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  nearbyTitle: { color: colors.text, fontSize: 13, fontWeight: "600", flex: 1, paddingRight: 8 },
  nearbyDist:  { fontSize: 12, fontWeight: "700" },
  nearbyMeta:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nearbyDomainPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  nearbyDot:        { width: 6, height: 6, borderRadius: 3 },
  nearbyDomainText: { fontSize: 10, fontWeight: "700" },
  nearbyAge:        { color: colors.textMuted, fontSize: 11 },

  adviceCard: {
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.md,
  },
  adviceTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  adviceText:  { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
