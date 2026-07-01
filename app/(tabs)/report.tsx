import { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, StatusBar, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { submitReport } from "@/src/api/client";
import { CATEGORIES } from "@/src/constants/dark";
import { useTheme, glow, type Palette } from "@/src/theme";
import { useLocation } from "@/src/hooks/useLocation";

const SEVERITY = [
  { key: "LOW", label: "Low", color: "#22c55e" },
  { key: "MEDIUM", label: "Medium", color: "#eab308" },
  { key: "HIGH", label: "High", color: "#f97316" },
  { key: "CRITICAL", label: "Critical", color: "#ef4444" },
];

// Control-centre classification domains. These are what the SIS control
// centre routes and reports on, so every report must carry one.
const DOMAINS = [
  { key: "SECURITY", label: "Security", color: "#ef4444" },
  { key: "COMMUNITY", label: "Community", color: "#3b82f6" },
  { key: "HSE", label: "HSE", color: "#eab308" },
  { key: "POLITICAL", label: "Political", color: "#a855f7" },
  { key: "MARITIME", label: "Maritime", color: "#14b8a6" },
];

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ domain?: string; category?: string }>();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const { coords, address, status } = useLocation();

  const category = CATEGORIES.find(x => x.key === params.category);

  const [domain, setDomain] = useState(params.domain ?? category?.domain ?? "SECURITY");
  const [severity, setSeverity] = useState(category?.risk ?? "MEDIUM");
  const [title, setTitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [media, setMedia] = useState<{ uri: string; type: "photo" | "video" }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (address && !location) setLocation(address); }, [address]);

  async function pickFromCamera(type: "photo" | "video") {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== "granted") { Alert.alert("Permission needed", "Camera access is required."); return; }
    const result = type === "photo"
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: 60 });
    if (!result.canceled && result.assets[0]) setMedia(prev => [...prev, { uri: result.assets[0].uri, type }]);
  }

  async function pickFromLibrary() {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== "granted") { Alert.alert("Permission needed", "Photo library access is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) {
      setMedia(prev => [...prev, ...result.assets.map(a => ({ uri: a.uri, type: (a.type === "video" ? "video" : "photo") as "photo" | "video" }))]);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) { Alert.alert("Required", "Enter a brief title."); return; }
    if (!narrative.trim()) { Alert.alert("Required", "Describe what happened."); return; }
    setSubmitting(true);
    try {
      const result = await submitReport({
        domain,
        riskBand: severity,
        title: title.trim(), narrative: narrative.trim(),
        incidentDate: new Date().toISOString().slice(0, 10),
        incidentTime: new Date().toTimeString().slice(0, 5),
        hub: "EAST",
        location: location.trim() || null,
        latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
        reporterName: name.trim() || null, reporterContact: contact.trim() || null,
      });
      router.push({ pathname: "/confirm", params: { ref: result.incidentRef } });
    } catch (e: unknown) {
      Alert.alert("Submission failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const ph = c.isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={s.headerCat}>
          {category && (
            <View style={[s.catIcon, { backgroundColor: category.color + "22" }]}>
              <Ionicons name={category.icon as any} size={20} color={category.color} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{category?.label ?? "Report Incident"}</Text>
            <Text style={s.headerSub}>{category?.desc ?? "Sent directly to SIS Operations"}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Classification domain (feeds the control centre) */}
        <Text style={s.label}>Incident category</Text>
        <View style={s.domainWrap}>
          {DOMAINS.map(d => {
            const active = domain === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[s.domainChip, { borderColor: active ? d.color : c.cardLine, backgroundColor: active ? d.color + "1f" : c.card }]}
                onPress={() => setDomain(d.key)}
                activeOpacity={0.8}
              >
                <View style={[s.domainDot, { backgroundColor: active ? d.color : c.faint }]} />
                <Text style={[s.domainLabel, { color: active ? d.color : c.muted }]}>{d.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Location */}
        <Text style={s.label}>Location</Text>
        <View style={s.locCard}>
          <Ionicons name="location" size={18} color={c.green} />
          <Text style={s.locText} numberOfLines={1}>
            {status === "loading" ? "Detecting your location..." : status === "denied" ? "Location unavailable" : address ?? "Located"}
          </Text>
          {coords && <View style={s.gpsBadge}><Text style={s.gpsBadgeText}>GPS</Text></View>}
        </View>
        <TextInput
          style={s.input} value={location} onChangeText={setLocation}
          placeholder="Community / landmark / road name" placeholderTextColor={ph}
        />

        {/* What happened */}
        <Text style={s.label}>What happened</Text>
        <TextInput
          style={s.input} value={title} onChangeText={setTitle}
          placeholder="Brief title, e.g. Armed robbery on Bonny road" placeholderTextColor={ph} maxLength={200}
        />
        <TextInput
          style={[s.input, s.textarea]} value={narrative} onChangeText={setNarrative}
          placeholder="Full description. Include who, what, vehicles, weapons, direction of travel, number of people involved."
          placeholderTextColor={ph} multiline numberOfLines={5} textAlignVertical="top"
        />

        {/* Severity */}
        <Text style={s.label}>Severity</Text>
        <View style={s.severityRow}>
          {SEVERITY.map(sv => {
            const active = severity === sv.key;
            return (
              <TouchableOpacity
                key={sv.key}
                style={[s.sevBtn, { borderColor: active ? sv.color : c.cardLine, backgroundColor: active ? sv.color + "1f" : c.card }]}
                onPress={() => setSeverity(sv.key)} activeOpacity={0.8}
              >
                <View style={[s.sevDot, { backgroundColor: active ? sv.color : c.faint }]} />
                <Text style={[s.sevLabel, { color: active ? sv.color : c.muted }]}>{sv.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Evidence */}
        <Text style={s.label}>Evidence (optional)</Text>
        {media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {media.map((m, i) => (
              <View key={i} style={s.thumbWrap}>
                <Image source={{ uri: m.uri }} style={s.thumb} />
                {m.type === "video" && <View style={s.vidTag}><Text style={s.vidTagText}>VID</Text></View>}
                <TouchableOpacity style={s.thumbX} onPress={() => setMedia(prev => prev.filter((_, j) => j !== i))}>
                  <Ionicons name="close" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={s.mediaRow}>
          <TouchableOpacity style={s.mediaBtn} onPress={() => pickFromCamera("photo")} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={22} color={c.green} />
            <Text style={s.mediaText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mediaBtn} onPress={() => pickFromCamera("video")} activeOpacity={0.8}>
            <Ionicons name="videocam-outline" size={22} color={c.green} />
            <Text style={s.mediaText}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.mediaBtn} onPress={pickFromLibrary} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={22} color={c.green} />
            <Text style={s.mediaText}>Library</Text>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <Text style={s.label}>Your contact (optional)</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={ph} />
        <TextInput style={[s.input, { marginTop: 12 }]} value={contact} onChangeText={setContact} placeholder="+234 8XX XXX XXXX or email" placeholderTextColor={ph} keyboardType="phone-pad" />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky submit */}
      <View style={s.submitBar}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.9}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <View style={s.submitInner}>
              <Text style={s.submitText}>Send Report to SIS</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },

  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  headerCat: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: c.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.3 },
  headerSub: { color: c.muted, fontSize: 13, marginTop: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  label: { color: c.faint, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginTop: 20, marginBottom: 10 },

  locCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
  },
  locText: { color: c.text, fontSize: 14, flex: 1 },
  gpsBadge: { backgroundColor: c.green + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  gpsBadgeText: { color: c.green, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  input: {
    backgroundColor: c.card, borderWidth: 1.5, borderColor: c.cardLine,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: c.text, fontSize: 15,
  },
  textarea: { minHeight: 120, marginTop: 12, paddingTop: 14 },

  domainWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  domainChip: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
  },
  domainDot: { width: 8, height: 8, borderRadius: 4 },
  domainLabel: { fontSize: 13, fontWeight: "700" },

  severityRow: { flexDirection: "row", gap: 8 },
  sevBtn: { flex: 1, alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  sevLabel: { fontSize: 12, fontWeight: "700" },

  thumbWrap: { position: "relative", marginRight: 10 },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: c.card },
  vidTag: { position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  vidTagText: { color: "#fff", fontSize: 8, fontWeight: "700" },
  thumbX: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: c.red, alignItems: "center", justifyContent: "center" },

  mediaRow: { flexDirection: "row", gap: 10 },
  mediaBtn: {
    flex: 1, alignItems: "center", gap: 6, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, borderRadius: 14, paddingVertical: 18,
  },
  mediaText: { color: c.muted, fontSize: 12, fontWeight: "600" },

  submitBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: c.bgElev, borderTopWidth: 1, borderTopColor: c.cardLine,
    padding: 16, paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  submitBtn: { backgroundColor: c.orange, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  submitInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
