import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CATEGORIES } from "@/src/constants/dark";
import { useTheme, glow, type Palette } from "@/src/theme";
import { useLocation } from "@/src/hooks/useLocation";

export default function HomeScreen() {
  const router = useRouter();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const [query, setQuery] = useState("");
  const { address, status } = useLocation();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(x => x.label.toLowerCase().includes(q) || x.desc.toLowerCase().includes(q));
  }, [query]);

  const locationLabel = status === "denied" ? "Location off, tap to set"
    : address ?? "Locating you...";

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      <View style={s.header}>
        <TouchableOpacity style={s.locBtn} activeOpacity={0.7}>
          <Ionicons name="location" size={16} color={c.green} />
          <Text style={s.locText} numberOfLines={1}>{locationLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color={c.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={c.text} />
          <View style={s.bellDot} />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={c.faint} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search...e.g robbery, fire, bandit..."
          placeholderTextColor={c.faint}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Broadcast quick action */}
        <TouchableOpacity style={s.broadcast} activeOpacity={0.9} onPress={() => router.push("/broadcast")}>
          <View style={s.broadcastIcon}>
            <Ionicons name="megaphone" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.broadcastTitle}>Broadcast an alert</Text>
            <Text style={s.broadcastSub}>Warn people near you within seconds</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <Text style={s.sectionLabel}>What are you reporting?</Text>
        <View style={s.grid}>
          {results.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/(tabs)/report", params: { domain: cat.domain, category: cat.key } })}
            >
              <View style={[s.iconCircle, { backgroundColor: cat.color + "22" }]}>
                <Ionicons name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <Text style={s.cardTitle}>{cat.label}</Text>
              <Text style={s.cardDesc}>{cat.desc}</Text>
            </TouchableOpacity>
          ))}
          {results.length === 0 && (
            <Text style={s.empty}>No matching incident type. Try another word.</Text>
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, gap: 12,
  },
  locBtn: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  locText: { color: c.text, fontSize: 14, fontWeight: "700", flexShrink: 1 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, alignItems: "center", justifyContent: "center",
  },
  bellDot: {
    position: "absolute", top: 11, right: 12, width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: c.red, borderWidth: 1.5, borderColor: c.bg,
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginBottom: 8,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine,
    borderRadius: 16, paddingHorizontal: 16, minHeight: 52,
  },
  searchInput: { flex: 1, color: c.text, fontSize: 15, paddingVertical: 14 },

  scroll: { paddingHorizontal: 20, paddingTop: 14 },

  broadcast: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: c.red, borderRadius: 18, padding: 16, marginBottom: 22,
    shadowColor: c.red, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  broadcastIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  broadcastTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  broadcastSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },

  sectionLabel: { color: c.faint, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 },
  card: {
    width: "48.5%", backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine,
    borderRadius: 20, padding: 16, minHeight: 140, justifyContent: "space-between",
  },
  iconCircle: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  cardTitle: { color: c.text, fontSize: 15, fontWeight: "800", marginBottom: 4 },
  cardDesc: { color: c.muted, fontSize: 12, lineHeight: 16 },
  empty: { color: c.muted, fontSize: 14, textAlign: "center", width: "100%", paddingVertical: 40 },
});
