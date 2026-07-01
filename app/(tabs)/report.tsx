import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, StatusBar, Image,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { submitReport } from "@/src/api/client";
import { colors, spacing, radius, shadow } from "@/src/constants/theme";

const DOMAINS = [
  { key: "SECURITY",  label: "Security",  color: "#dc2626", bg: "#fef2f2" },
  { key: "COMMUNITY", label: "Community", color: "#2563eb", bg: "#eff6ff" },
  { key: "HSE",       label: "HSE",       color: "#ca8a04", bg: "#fefce8" },
  { key: "POLITICAL", label: "Political", color: "#7c3aed", bg: "#f5f3ff" },
  { key: "MARITIME",  label: "Maritime",  color: "#0d9488", bg: "#f0fdfa" },
];

const SEVERITY = [
  { key: "LOW",      label: "Low",      color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "MEDIUM",   label: "Medium",   color: "#ca8a04", bg: "#fefce8", border: "#fde68a" },
  { key: "HIGH",     label: "High",     color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  { key: "CRITICAL", label: "Critical", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
];

type GpsState = "idle" | "requesting" | "captured" | "denied";

function SectionHeader({ label, step }: { label: string; step: number }) {
  return (
    <View style={sh.row}>
      <View style={sh.step}>
        <Text style={sh.stepText}>{step}</Text>
      </View>
      <Text style={sh.label}>{label}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.md },
  step:     { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  stepText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  label:    { color: colors.text, fontSize: 15, fontWeight: "700" },
});

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ domain?: string }>();

  const [gpsState,  setGpsState]  = useState<GpsState>("idle");
  const [coords,    setCoords]    = useState<{ lat: number; lng: number } | null>(null);
  const [domain,    setDomain]    = useState(params.domain ?? "");
  const [severity,  setSeverity]  = useState("MEDIUM");
  const [title,     setTitle]     = useState("");
  const [narrative, setNarrative] = useState("");
  const [location,  setLocation]  = useState("");
  const [name,      setName]      = useState("");
  const [contact,   setContact]   = useState("");
  const [media,     setMedia]     = useState<{ uri: string; type: "photo" | "video" }[]>([]);
  const [submitting,setSubmitting]= useState(false);
  const didRequest = useRef(false);

  useEffect(() => {
    if (didRequest.current) return;
    didRequest.current = true;
    requestGps();
  }, []);

  async function requestGps() {
    setGpsState("requesting");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setGpsState("denied"); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setGpsState("captured");
    } catch {
      setGpsState("denied");
    }
  }

  async function pickFromCamera(type: "photo" | "video") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Camera access is required."); return; }
    const result = type === "photo"
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
      : await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: 60 });
    if (!result.canceled && result.assets[0]) {
      setMedia(prev => [...prev, { uri: result.assets[0].uri, type }]);
    }
  }

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Photo library access is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"], allowsMultipleSelection: true, quality: 0.8,
    });
    if (!result.canceled) {
      const picked = result.assets.map(a => ({
        uri: a.uri,
        type: (a.type === "video" ? "video" : "photo") as "photo" | "video",
      }));
      setMedia(prev => [...prev, ...picked]);
    }
  }

  async function handleSubmit() {
    if (!domain)           { Alert.alert("Required", "Select the type of incident."); return; }
    if (!title.trim())     { Alert.alert("Required", "Enter a brief title."); return; }
    if (!narrative.trim()) { Alert.alert("Required", "Describe what happened."); return; }
    setSubmitting(true);
    try {
      const result = await submitReport({
        domain, riskBand: severity,
        title: title.trim(), narrative: narrative.trim(),
        incidentDate: new Date().toISOString().slice(0, 10),
        incidentTime: new Date().toTimeString().slice(0, 5),
        hub: "EAST",
        location: location.trim() || null,
        latitude:  coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        reporterName:    name.trim()    || null,
        reporterContact: contact.trim() || null,
      });
      router.push({ pathname: "/confirm", params: { ref: result.incidentRef } });
    } catch (e: unknown) {
      Alert.alert("Submission failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <Text style={styles.headerSub}>Sent directly to SIS Operations</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* 1. Location */}
        <View style={[styles.card, shadow.sm]}>
          <SectionHeader label="Location" step={1} />

          {gpsState === "idle" && (
            <TouchableOpacity style={styles.gpsBtn} onPress={requestGps} activeOpacity={0.8}>
              <Text style={styles.gpsBtnText}>Detect my GPS location</Text>
            </TouchableOpacity>
          )}
          {gpsState === "requesting" && (
            <View style={styles.gpsRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.gpsRowText}>Detecting location…</Text>
            </View>
          )}
          {gpsState === "captured" && coords && (
            <View style={styles.gpsCaptured}>
              <View style={styles.gpsSuccessDot} />
              <Text style={styles.gpsCapturedText} numberOfLines={1}>
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </Text>
              <TouchableOpacity onPress={requestGps}>
                <Text style={styles.gpsRetry}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {gpsState === "denied" && (
            <View style={styles.gpsDenied}>
              <Text style={styles.gpsDeniedText}>
                GPS denied — enter location manually below
              </Text>
            </View>
          )}

          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            value={location}
            onChangeText={setLocation}
            placeholder="Community / landmark / road name"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* 2. Type */}
        <View style={[styles.card, shadow.sm]}>
          <SectionHeader label="Type of Incident" step={2} />
          <View style={styles.domainGrid}>
            {DOMAINS.map(d => {
              const active = domain === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.domainBtn,
                    { backgroundColor: active ? d.bg : colors.bgSecondary, borderColor: active ? d.color : colors.border },
                  ]}
                  onPress={() => setDomain(d.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.domainDot, { backgroundColor: d.color, opacity: active ? 1 : 0.4 }]} />
                  <Text style={[styles.domainLabel, { color: active ? d.color : colors.textSecondary }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. What happened */}
        <View style={[styles.card, shadow.sm]}>
          <SectionHeader label="What Happened" step={3} />
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Brief title — e.g. Armed robbery on Bonny road"
            placeholderTextColor={colors.textMuted}
            maxLength={200}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            value={narrative}
            onChangeText={setNarrative}
            placeholder={"Full description — include who, what, vehicles, weapons, direction of travel, number of people involved."}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* 4. Evidence */}
        <View style={[styles.card, shadow.sm]}>
          <SectionHeader label="Evidence (Optional)" step={4} />
          <Text style={styles.cardNote}>Attach photos or video to support your report.</Text>

          {/* Captured media thumbnails */}
          {media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
              {media.map((m, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri: m.uri }} style={styles.thumb} />
                  {m.type === "video" && (
                    <View style={styles.videoTag}>
                      <Text style={styles.videoTagText}>VID</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.thumbRemove}
                    onPress={() => setMedia(prev => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={styles.thumbRemoveText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Capture buttons */}
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => pickFromCamera("photo")} activeOpacity={0.8}>
              <Text style={styles.mediaBtnIcon}>📷</Text>
              <Text style={styles.mediaBtnText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={() => pickFromCamera("video")} activeOpacity={0.8}>
              <Text style={styles.mediaBtnIcon}>🎥</Text>
              <Text style={styles.mediaBtnText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={pickFromLibrary} activeOpacity={0.8}>
              <Text style={styles.mediaBtnIcon}>🖼️</Text>
              <Text style={styles.mediaBtnText}>Library</Text>
            </TouchableOpacity>
          </View>

          {media.length > 0 && (
            <Text style={styles.mediaCount}>{media.length} file{media.length !== 1 ? "s" : ""} attached</Text>
          )}
        </View>

        {/* 5. Severity */}
        <View style={[styles.card, shadow.sm]}>
          <SectionHeader label="Severity" step={5} />
          <View style={styles.severityRow}>
            {SEVERITY.map(s => {
              const active = severity === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.severityBtn,
                    { borderColor: active ? s.color : colors.border, backgroundColor: active ? s.bg : colors.bg },
                  ]}
                  onPress={() => setSeverity(s.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.severityDot, { backgroundColor: active ? s.color : colors.border }]} />
                  <Text style={[styles.severityLabel, { color: active ? s.color : colors.textSecondary }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Contact */}
        <View style={[styles.card, shadow.sm]}>
          <SectionHeader label="Your Contact (Optional)" step={6} />
          <Text style={styles.cardNote}>So SIS can follow up with you about this report.</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={[styles.input, { marginTop: spacing.sm }]}
            value={contact}
            onChangeText={setContact}
            placeholder="+234 8XX XXX XXXX or email"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky submit */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Submit Report to SIS</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bgSecondary },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 52, paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTop: { flexDirection: "row", marginBottom: spacing.sm },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#86efac" },
  liveText:  { color: "#d1fae5", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSub:   { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },

  scroll: { padding: spacing.lg, gap: spacing.md },

  card: {
    backgroundColor: colors.bg, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  cardNote: { color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm, marginTop: -spacing.sm },

  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, color: colors.text, fontSize: 14,
  },
  textarea: { minHeight: 110, paddingTop: 12 },

  gpsBtn: {
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed",
    borderRadius: radius.md, paddingVertical: 13,
    alignItems: "center", backgroundColor: colors.primaryFaint,
  },
  gpsBtnText:    { color: colors.primary, fontSize: 14, fontWeight: "600" },
  gpsRow:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  gpsRowText:    { color: colors.textSecondary, fontSize: 14 },
  gpsCaptured:   { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  gpsSuccessDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  gpsCapturedText: { color: colors.text, fontSize: 13, flex: 1, fontFamily: "monospace" },
  gpsRetry:      { color: colors.primary, fontSize: 12, fontWeight: "600" },
  gpsDenied: {
    backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde68a",
    borderRadius: radius.md, padding: spacing.sm,
  },
  gpsDeniedText: { color: "#92400e", fontSize: 12 },

  domainGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  domainBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  domainDot:   { width: 8, height: 8, borderRadius: 4 },
  domainLabel: { fontSize: 12, fontWeight: "700" },

  severityRow: { flexDirection: "row", gap: spacing.sm },
  severityBtn: {
    flex: 1, alignItems: "center", gap: 5,
    borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 12,
  },
  severityDot:   { width: 8, height: 8, borderRadius: 4 },
  severityLabel: { fontSize: 11, fontWeight: "700" },

  mediaScroll:   { marginBottom: spacing.sm },
  thumbWrap:     { position: "relative", marginRight: spacing.sm },
  thumb:         { width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.border },
  videoTag: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 3,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  videoTagText:  { color: "#fff", fontSize: 8, fontWeight: "700" },
  thumbRemove: {
    position: "absolute", top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.danger, alignItems: "center", justifyContent: "center",
  },
  thumbRemoveText: { color: "#fff", fontSize: 13, fontWeight: "700", lineHeight: 20 },
  mediaButtons: { flexDirection: "row", gap: spacing.sm },
  mediaBtn: {
    flex: 1, flexDirection: "column", alignItems: "center", gap: 4,
    backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: spacing.md,
  },
  mediaBtnIcon: { fontSize: 22 },
  mediaBtnText: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  mediaCount:   { color: colors.primary, fontSize: 12, fontWeight: "600", textAlign: "center", marginTop: spacing.sm },

  submitBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.md,
    ...shadow.sm,
  },
  submitBtn: {
    backgroundColor: colors.orange, borderRadius: radius.md,
    paddingVertical: 16, alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
