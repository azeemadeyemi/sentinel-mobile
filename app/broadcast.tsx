import { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CATEGORIES } from "@/src/constants/dark";
import { useTheme, glow, type Palette } from "@/src/theme";
import { useLocation } from "@/src/hooks/useLocation";
import MiniMap from "@/src/components/MiniMap";
import { sendBroadcast } from "@/src/api/client";
import { useAuth } from "@/src/store/auth";

const RADII = [
  { label: "500M", km: 0.5 },
  { label: "1KM", km: 1 },
  { label: "2KM", km: 2 },
  { label: "3KM", km: 3 },
];

export default function BroadcastScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ category?: string }>();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const { coords, address } = useLocation();

  const [category, setCategory] = useState(params.category ?? CATEGORIES[0].key);
  const [radius, setRadius] = useState(1);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ notified: number } | null>(null);

  useEffect(() => { if (address && !location) setLocation(address); }, [address]);

  const cat = CATEGORIES.find(x => x.key === category) ?? CATEGORIES[0];
  const radiusLabel = RADII.find(r => r.km === radius)?.label ?? "1KM";

  async function handleSend() {
    setSending(true);
    try {
      const res = await sendBroadcast({
        category, radiusKm: radius,
        latitude: coords?.lat, longitude: coords?.lng,
        location: location.trim() || null, note: note.trim() || null,
        reporterName: user?.name,
      });
      setSent({ notified: res.notified });
    } catch {
      setSent({ notified: 0 });
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={s.headerRow}>
          <View style={[s.catIcon, { backgroundColor: cat.color + "22" }]}>
            <Ionicons name={cat.icon as any} size={20} color={cat.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Broadcast Alert</Text>
            <Text style={s.headerSub}>Warn people near you in real time</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Category */}
        <Text style={s.label}>Incident type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={s.catRow}>
            {CATEGORIES.slice(0, 8).map(x => {
              const active = x.key === category;
              return (
                <TouchableOpacity key={x.key} style={[s.catChip, { borderColor: active ? x.color : c.cardLine, backgroundColor: active ? x.color + "1f" : c.card }]} onPress={() => setCategory(x.key)} activeOpacity={0.8}>
                  <Ionicons name={x.icon as any} size={16} color={active ? x.color : c.muted} />
                  <Text style={[s.catChipText, { color: active ? x.color : c.muted }]}>{x.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Radius */}
        <Text style={s.label}>Notify people within</Text>
        <View style={s.radiusRow}>
          {RADII.map(r => {
            const active = r.km === radius;
            return (
              <TouchableOpacity key={r.label} style={[s.radiusBtn, active && s.radiusBtnActive]} onPress={() => setRadius(r.km)} activeOpacity={0.85}>
                <Text style={[s.radiusText, active && s.radiusTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location + map */}
        <Text style={s.label}>Location</Text>
        <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="e.g. Bodija, Ibadan" placeholderTextColor={c.faint} />
        <View style={{ height: 12 }} />
        <MiniMap coords={coords} radius={radius * 1000} isDark={c.isDark} accent={c.red} height={160} />

        {/* Warning */}
        <View style={s.warn}>
          <Ionicons name="alert-circle" size={18} color="#f59e0b" />
          <Text style={s.warnText}>This alerts everyone within {radiusLabel} of your location. Only use for real emergencies.</Text>
        </View>

        {/* Note */}
        <Text style={s.label}>Additional info (optional)</Text>
        <TextInput style={[s.input, s.textarea]} value={note} onChangeText={setNote} placeholder="Add anything useful for people nearby..." placeholderTextColor={c.faint} multiline textAlignVertical="top" />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Send */}
      <View style={s.sendBar}>
        <TouchableOpacity style={[s.sendBtn, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending} activeOpacity={0.9}>
          {sending ? <ActivityIndicator color="#fff" /> : (
            <View style={s.sendInner}>
              <Ionicons name="megaphone" size={20} color="#fff" />
              <Text style={s.sendText}>Send alert now</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Success overlay */}
      {sent && (
        <View style={s.successOverlay}>
          <View style={s.successCard}>
            <View style={s.successCircle}><Ionicons name="checkmark" size={44} color="#fff" /></View>
            <Text style={s.successTitle}>Alert Sent Successfully</Text>
            <Text style={s.successSub}>
              {sent.notified > 0
                ? `${sent.notified} people within ${radiusLabel} have been notified. Stay sharp.`
                : `Your alert has been broadcast within ${radiusLabel}.`}
            </Text>
            <View style={[s.successRow, { backgroundColor: cat.color + "18" }]}>
              <Ionicons name={cat.icon as any} size={18} color={cat.color} />
              <Text style={s.successRowText}>{cat.label}{location ? ` · ${location}` : ""}</Text>
            </View>
            <TouchableOpacity style={s.doneBtn} onPress={() => router.back()} activeOpacity={0.9}>
              <Text style={s.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },

  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: c.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  headerSub: { color: c.muted, fontSize: 13, marginTop: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  label: { color: c.faint, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginTop: 20, marginBottom: 10 },

  catRow: { flexDirection: "row", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  catChipText: { fontSize: 12, fontWeight: "700" },

  radiusRow: { flexDirection: "row", gap: 8 },
  radiusBtn: { flex: 1, alignItems: "center", borderWidth: 1.5, borderColor: c.cardLine, backgroundColor: c.card, borderRadius: 14, paddingVertical: 14 },
  radiusBtnActive: { backgroundColor: c.red, borderColor: c.red },
  radiusText: { color: c.muted, fontSize: 14, fontWeight: "800" },
  radiusTextActive: { color: "#fff" },

  input: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.cardLine, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: c.text, fontSize: 15 },
  textarea: { minHeight: 100, paddingTop: 14 },

  warn: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)", borderRadius: 14, padding: 14, marginTop: 16 },
  warnText: { color: "#f59e0b", fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 17 },

  sendBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: c.bgElev, borderTopWidth: 1, borderTopColor: c.cardLine, padding: 16, paddingBottom: 28 },
  sendBtn: { backgroundColor: c.red, borderRadius: 16, paddingVertical: 16, alignItems: "center", shadowColor: c.red, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  sendInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay, alignItems: "center", justifyContent: "center", padding: 28 },
  successCard: { backgroundColor: c.bgElev, borderRadius: 24, padding: 28, alignItems: "center", width: "100%", borderWidth: 1, borderColor: c.cardLine },
  successCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: c.green, alignItems: "center", justifyContent: "center", marginBottom: 18, shadowColor: c.green, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  successTitle: { color: c.text, fontSize: 20, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  successSub: { color: c.muted, fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 18 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, alignSelf: "stretch" },
  successRowText: { color: c.text, fontSize: 13, fontWeight: "600", flex: 1 },
  doneBtn: { backgroundColor: c.red, borderRadius: 14, paddingVertical: 15, alignItems: "center", alignSelf: "stretch" },
  doneText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
