import { useEffect, useMemo } from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { useTheme, glow, type Palette } from "@/src/theme";

export default function SplashScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(token ? "/(tabs)" : "/onboarding");
    }, 1500);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={StyleSheet.absoluteFill} />

      <View style={s.center}>
        <View style={s.logoCard}>
          <Image source={require("@/assets/renaissance-logo.png")} style={s.logo} resizeMode="contain" />
        </View>
        <Text style={s.wordmark}>SENTINEL</Text>
        <Text style={s.tagline}>Security Intelligence System</Text>
      </View>

      <View style={s.footer}>
        <ActivityIndicator color={c.green} size="small" />
        <Text style={s.loading}>Please wait...</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center" },
  logoCard: {
    width: 96, height: 96, borderRadius: 26, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 22, elevation: 12, marginBottom: 22,
  },
  logo: { width: 74, height: 74 },
  wordmark: { color: c.text, fontSize: 26, fontWeight: "900", letterSpacing: 9, marginBottom: 8 },
  tagline: { color: c.muted, fontSize: 13, letterSpacing: 0.4 },
  footer: { position: "absolute", bottom: 64, alignItems: "center", gap: 12 },
  loading: { color: c.muted, fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
});
