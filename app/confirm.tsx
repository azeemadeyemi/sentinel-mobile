import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme, glow, type Palette } from "@/src/theme";

export default function ConfirmScreen() {
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      <View style={s.content}>
        <View style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </View>
        </View>

        <Text style={s.title}>Report Submitted</Text>
        <Text style={s.sub}>
          Your report has been received by the SIS Operations team and will be reviewed immediately.
        </Text>

        <View style={s.refCard}>
          <Text style={s.refLabel}>REFERENCE NUMBER</Text>
          <Text style={s.refValue}>{ref}</Text>
          <View style={s.refDivider} />
          <Text style={s.refNote}>Keep this reference number for follow-up with SIS Operations.</Text>
        </View>

        <View style={s.nextCard}>
          <Text style={s.nextTitle}>What happens next</Text>
          {["SIS analyst reviews your report", "Report verified and classified", "Response coordinated if needed"].map((step, i) => (
            <View key={i} style={s.nextRow}>
              <View style={s.nextDot}><Text style={s.nextDotText}>{i + 1}</Text></View>
              <Text style={s.nextText}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/(tabs)")} activeOpacity={0.9}>
          <Text style={s.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  content: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center", gap: 16 },

  iconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: c.green,
    alignItems: "center", justifyContent: "center",
    shadowColor: c.green, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },

  title: { color: c.text, fontSize: 26, fontWeight: "900", textAlign: "center" },
  sub: { color: c.muted, fontSize: 14, textAlign: "center", lineHeight: 22, maxWidth: 300 },

  refCard: { backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.cardLine, padding: 20, alignItems: "center", width: "100%" },
  refLabel: { color: c.faint, fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 8 },
  refValue: { color: c.green, fontSize: 28, fontWeight: "900" },
  refDivider: { width: "100%", height: 1, backgroundColor: c.cardLine, marginVertical: 12 },
  refNote: { color: c.muted, fontSize: 12, textAlign: "center", lineHeight: 18 },

  nextCard: { backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.cardLine, padding: 16, width: "100%", gap: 10 },
  nextTitle: { color: c.text, fontSize: 13, fontWeight: "700", marginBottom: 4 },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nextDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.green + "22", alignItems: "center", justifyContent: "center" },
  nextDotText: { color: c.green, fontSize: 11, fontWeight: "800" },
  nextText: { color: c.muted, fontSize: 13, flex: 1 },

  primaryBtn: { backgroundColor: c.orange, borderRadius: 16, paddingVertical: 16, alignItems: "center", width: "100%", marginTop: 4 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
