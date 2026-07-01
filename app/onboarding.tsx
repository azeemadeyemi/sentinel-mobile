import { useMemo, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SecurityArt from "@/src/components/SecurityArt";
import { useTheme, glow, type Palette } from "@/src/theme";

const { width: SCREEN_W } = Dimensions.get("window");

type Slide = { key: string; title: string; body: string; icon?: string };
const SLIDES: Slide[] = [
  { key: "welcome", title: "Welcome to Sentinel", body: "Report incidents, raise alerts, and stay protected. Your security intelligence platform, anywhere, anytime." },
  { key: "report", title: "Report in seconds", body: "Pick a category, confirm your location, and your report reaches SIS Operations instantly.", icon: "flash" },
  { key: "aware", title: "Stay aware", body: "See nearby incidents and a live safety score for your area, and trigger SOS the moment you need help.", icon: "shield-checkmark" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== index) setIndex(i);
  }

  function next() {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_W, animated: true });
    } else {
      router.push("/login");
    }
  }

  const last = index === SLIDES.length - 1;

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={StyleSheet.absoluteFill} />

      {/* Skip */}
      <TouchableOpacity style={s.skip} onPress={() => router.push("/login")} activeOpacity={0.7}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={s.slides}
      >
        {SLIDES.map(slide => (
          <View key={slide.key} style={s.slide}>
            <View style={s.artZone}>
              <View style={s.artGlow} />
              {slide.icon
                ? <Ionicons name={slide.icon as any} size={120} color={c.green} />
                : <SecurityArt width={SCREEN_W * 0.72} />}
            </View>
            <Text style={s.title}>{slide.title}</Text>
            <Text style={s.subtitle}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, i === index && s.dotActive]} />
        ))}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {last ? (
          <>
            <TouchableOpacity style={s.trackBtn} activeOpacity={0.85} onPress={() => router.push("/login")}>
              <Ionicons name="search-outline" size={18} color={c.text} />
              <Text style={s.trackText}>Track a Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.signInBtn} activeOpacity={0.9} onPress={() => router.push("/login")}>
              <Text style={s.signInText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={s.signInBtn} activeOpacity={0.9} onPress={next}>
            <Text style={s.signInText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={s.footer}>Authorised personnel only</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  skip: { position: "absolute", top: 56, right: 24, zIndex: 10, padding: 6 },
  skipText: { color: c.muted, fontSize: 14, fontWeight: "700" },

  slides: { flex: 1 },
  slide: { width: SCREEN_W, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 40 },
  artZone: { height: SCREEN_W * 0.8, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  artGlow: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: c.isDark ? "rgba(34,197,94,0.16)" : "rgba(34,197,94,0.12)" },
  title: { color: c.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.6, textAlign: "center", marginBottom: 12 },
  subtitle: { color: c.muted, fontSize: 15, lineHeight: 23, textAlign: "center" },

  dots: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" },
  dotActive: { width: 24, backgroundColor: c.green },

  actions: { paddingHorizontal: 28, paddingBottom: 44, paddingTop: 24 },
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
