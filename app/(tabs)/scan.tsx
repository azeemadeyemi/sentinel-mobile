import { useState, useEffect, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useTheme, glow, type Palette } from "@/src/theme";
import { useLocation } from "@/src/hooks/useLocation";
import MiniMap from "@/src/components/MiniMap";
import { getNearbyIncidents, type NearbyIncident } from "@/src/api/client";

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e",
};
function scoreColor(x: number) { return x >= 80 ? "#22c55e" : x >= 55 ? "#eab308" : "#ef4444"; }
function scoreLabel(x: number) { return x >= 80 ? "Clear" : x >= 55 ? "Moderate" : "High Risk"; }
function distKm(d: string) { const n = parseFloat(d); return isNaN(n) ? 99 : n; }

function ScoreRing({ score, color, textColor, trackColor }: { score: number; color: string; textColor: string; trackColor: string }) {
  const size = 120, stroke = 11, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </Svg>
      <Text style={{ color: textColor, fontSize: 32, fontWeight: "900" }}>{score}</Text>
      <Text style={{ color, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>SCORE</Text>
    </View>
  );
}

export default function ScanScreen() {
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const { coords, address } = useLocation();

  const [nearby, setNearby] = useState<NearbyIncident[]>([]);
  const [score, setScore] = useState(54);
  const [scanning, setScanning] = useState(false);

  useEffect(() => { runScan(); }, []);
  useEffect(() => { if (coords) runScan(); }, [coords?.lat, coords?.lng]);

  async function runScan() {
    setScanning(true);
    try {
      const result = await getNearbyIncidents(coords?.lat, coords?.lng);
      setNearby(result.incidents);
      setScore(result.safetyScore);
    } finally { setScanning(false); }
  }

  const SC = scoreColor(score);
  const SL = scoreLabel(score);
  const immediate = nearby.filter(i => distKm(i.dist) <= 0.5);

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Safety Scan</Text>
          <View style={s.locRow}>
            <Ionicons name="location" size={13} color={c.green} />
            <Text style={s.locText} numberOfLines={1}>{address ?? "Detecting location..."}</Text>
          </View>
        </View>
        <TouchableOpacity style={s.rescan} onPress={runScan} disabled={scanning} activeOpacity={0.8}>
          <Ionicons name="refresh" size={14} color={c.green} />
          <Text style={s.rescanText}>{scanning ? "Scanning" : "Re-scan"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Map */}
        <MiniMap coords={coords} radius={500} isDark={c.isDark} accent={c.green} height={180} />

        {/* 3-stat row */}
        <View style={s.statRow}>
          <View style={s.statCol}>
            <ScoreRing score={score} color={SC} textColor={c.text} trackColor={c.cardLine} />
          </View>
          <View style={s.statDivider} />
          <View style={s.statColCenter}>
            <Text style={s.statValue}>{nearby.length}</Text>
            <Text style={s.statLabel}>Recent{"\n"}Incidents</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statColCenter}>
            <View style={[s.ratingDot, { backgroundColor: SC }]} />
            <Text style={[s.ratingText, { color: SC }]}>{SL}</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Advice */}
        <View style={[s.advice, { borderColor: SC + "44", backgroundColor: SC + "12" }]}>
          <Ionicons name={score >= 80 ? "shield-checkmark" : score >= 55 ? "alert-circle" : "warning"} size={20} color={SC} />
          <View style={{ flex: 1 }}>
            <Text style={[s.adviceTitle, { color: SC }]}>
              {score >= 80 ? "Area appears clear" : score >= 55 ? "Exercise caution" : "Elevated risk, stay vigilant"}
            </Text>
            <Text style={s.adviceText}>
              {score >= 80 ? "No significant incidents detected in your immediate area."
                : score >= 55 ? "Some incidents reported nearby. Maintain awareness and avoid isolated areas."
                : "Multiple high-risk incidents nearby. Limit movement and report anything suspicious."}
            </Text>
          </View>
        </View>

        {/* Immediate area */}
        <Text style={s.sectionLabel}>Immediate area (500m radius)</Text>
        <View style={s.card}>
          {immediate.length === 0 ? (
            <Text style={s.emptyRow}>No incident reports found within 500m.</Text>
          ) : immediate.map((item, i) => (
            <Row key={item.ref} item={item} c={c} s={s} last={i === immediate.length - 1} />
          ))}
        </View>

        {/* Nearby */}
        <Text style={s.sectionLabel}>Nearby incidents (within 6km)</Text>
        <View style={s.card}>
          {nearby.map((item, i) => (
            <Row key={item.ref} item={item} c={c} s={s} last={i === nearby.length - 1} />
          ))}
          {nearby.length === 0 && (
            <Text style={s.emptyRow}>{scanning ? "Scanning area..." : "No incidents detected nearby."}</Text>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Row({ item, c, s, last }: { item: NearbyIncident; c: Palette; s: any; last: boolean }) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={[s.riskBar, { backgroundColor: RISK_COLOR[item.risk] ?? c.muted }]} />
      <View style={{ flex: 1 }}>
        <View style={s.rowTop}>
          <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={[s.rowDist, { color: RISK_COLOR[item.risk] ?? c.muted }]}>{item.dist}</Text>
        </View>
        <View style={s.rowMeta}>
          <View style={s.domainPill}><Text style={s.domainText}>{item.domain}</Text></View>
          <Text style={s.age}>{item.age}</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },

  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  title: { color: c.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.3 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locText: { color: c.muted, fontSize: 13, flexShrink: 1 },
  rescan: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9,
  },
  rescanText: { color: c.green, fontSize: 12, fontWeight: "800" },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  statRow: {
    flexDirection: "row", alignItems: "center", marginTop: 16,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine, borderRadius: 20, padding: 16,
  },
  statCol: { flex: 1.2, alignItems: "center" },
  statColCenter: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 70, backgroundColor: c.cardLine, marginHorizontal: 6 },
  statValue: { color: c.text, fontSize: 30, fontWeight: "900" },
  statLabel: { color: c.faint, fontSize: 10, fontWeight: "700", textAlign: "center", letterSpacing: 0.3 },
  ratingDot: { width: 16, height: 16, borderRadius: 8 },
  ratingText: { fontSize: 14, fontWeight: "800" },

  advice: { flexDirection: "row", gap: 12, alignItems: "flex-start", borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 16 },
  adviceTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  adviceText: { color: c.muted, fontSize: 13, lineHeight: 19 },

  sectionLabel: { color: c.faint, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 24, marginBottom: 12 },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine, borderRadius: 18, overflow: "hidden" },
  emptyRow: { color: c.muted, fontSize: 14, textAlign: "center", padding: 24 },

  row: { flexDirection: "row" },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.cardLine },
  riskBar: { width: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, paddingBottom: 6 },
  rowTitle: { color: c.text, fontSize: 14, fontWeight: "600", flex: 1, paddingRight: 8 },
  rowDist: { fontSize: 12, fontWeight: "800" },
  rowMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 },
  domainPill: { backgroundColor: c.isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  domainText: { color: c.muted, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  age: { color: c.faint, fontSize: 11 },
});
