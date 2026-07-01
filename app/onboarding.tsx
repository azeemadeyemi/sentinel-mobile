import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SecurityArt from "@/src/components/SecurityArt";
import { useTheme, glow, type Palette } from "@/src/theme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={StyleSheet.absoluteFill} />

      <View style={s.artZone}>
        <View style={s.artGlow} />
        <SecurityArt width={SCREEN_W * 0.78} />
      </View>

      <View style={s.copy}>
        <Text style={s.title}>Welcome to Sentinel</Text>
        <Text style={s.subtitle}>
          Report incidents, raise alerts, and stay protected. Your security
          intelligence platform, anywhere, anytime.
        </Text>
        <View style={s.dots}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.trackBtn} activeOpacity={0.85} onPress={() => router.push("/login")}>
          <Ionicons name="search-outline" size={18} color={c.text} />
          <Text style={s.trackText}>Track a Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.signInBtn} activeOpacity={0.9} onPress={() => router.push("/login")}>
          <Text style={s.signInText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={s.footer}>Authorised personnel only</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  artZone: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  artGlow: {
    position: "absolute", width: 320, height: 320, borderRadius: 160,
    backgroundColor: c.isDark ? "rgba(34,197,94,0.16)" : "rgba(34,197,94,0.12)",
  },
  copy: { paddingHorizontal: 32, alignItems: "center" },
  title: { color: c.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.6, textAlign: "center", marginBottom: 12 },
  subtitle: { color: c.muted, fontSize: 15, lineHeight: 23, textAlign: "center" },
  dots: { flexDirection: "row", gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" },
  dotActive: { width: 24, backgroundColor: c.green },
  actions: { paddingHorizontal: 28, paddingBottom: 44, paddingTop: 32 },
  trackBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1.5, borderColor: c.cardLine, borderRadius: 16, height: 56, marginBottom: 14,
  },
  trackText: { color: c.text, fontSize: 15, fontWeight: "700" },
  signInBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: c.orange, borderRadius: 16, height: 58,
    shadowColor: c.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
  signInText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  footer: { color: c.faint, fontSize: 12, textAlign: "center", marginTop: 20 },
});
