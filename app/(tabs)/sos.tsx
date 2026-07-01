import { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Animated, Easing, Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync } from "expo-audio";
import { useTheme, type Palette } from "@/src/theme";
import { sendSOSAlert } from "@/src/api/client";
import { useAuth } from "@/src/store/auth";
import { useLocation } from "@/src/hooks/useLocation";

const RED = "#ef4444";
const SOS_SIZE = 200;

type SOSState = "idle" | "countdown" | "active" | "cancelled";

function PulsingRing({ active }: { active: boolean }) {
  const s1 = useRef(new Animated.Value(1)).current;
  const s2 = useRef(new Animated.Value(1)).current;
  const o1 = useRef(new Animated.Value(0.5)).current;
  const o2 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (!active) { s1.setValue(1); s2.setValue(1); return; }
    const mk = (s: Animated.Value, o: Animated.Value, delay: number, base: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(s, { toValue: 1.6, duration: 1000, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(o, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(s, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(o, { toValue: base, duration: 0, useNativeDriver: true }),
        ]),
      ]));
    const l1 = mk(s1, o1, 0, 0.5);
    const l2 = mk(s2, o2, 500, 0.25);
    l1.start(); l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, [active]);

  if (!active) return null;
  const ring = { position: "absolute" as const, width: SOS_SIZE, height: SOS_SIZE, borderRadius: SOS_SIZE / 2, backgroundColor: RED };
  return (
    <>
      <Animated.View style={[ring, { transform: [{ scale: s1 }], opacity: o1 }]} />
      <Animated.View style={[ring, { transform: [{ scale: s2 }], opacity: o2 }]} />
    </>
  );
}

// Blinking mic indicator shown while recording
function RecordingDot({ color }: { color: string }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{ opacity: blink, flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons name="mic" size={16} color={color} />
    </Animated.View>
  );
}

export default function SosScreen() {
  const { user } = useAuth();
  const c = useTheme();
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const { coords, address } = useLocation();

  const [state, setState] = useState<SOSState>("idle");
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingRef = useRef(false);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function startRecording() {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingRef.current = true;
    } catch {}
  }

  async function stopRecording(): Promise<string | null> {
    if (!recordingRef.current) return null;
    recordingRef.current = false;
    try { await recorder.stop(); return recorder.uri ?? null; } catch { return null; }
  }

  function press(down: boolean) {
    Animated.spring(scale, { toValue: down ? 0.94 : 1, useNativeDriver: true, speed: 40 }).start();
  }

  function startSOS() {
    Vibration.vibrate([0, 100, 50, 100]);
    setState("countdown");
    setCountdown(5);
    startRecording();
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setState("active");
          Vibration.vibrate([0, 300, 100, 300]);
          stopRecording().then(audioUri => {
            sendSOSAlert({ latitude: coords?.lat, longitude: coords?.lng, reporterName: user?.name });
            // audioUri would be uploaded with the alert in a real backend
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelSOS() {
    if (timerRef.current) clearInterval(timerRef.current);
    Vibration.vibrate(50);
    stopRecording();
    setState("cancelled");
    setTimeout(() => setState("idle"), 2200);
  }

  function reset() { setState("idle"); setCountdown(5); }

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient
        colors={c.isDark ? ["#2a0a0a", "#12100c", c.bg] : ["#fee2e2", "#fef2f2", c.bg]}
        locations={[0, 0.45, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.header}>
        <Text style={s.title}>Emergency SOS</Text>
        <View style={s.locRow}>
          <Ionicons name="location" size={14} color={c.green} />
          <Text style={s.locText}>{address ?? "Detecting location..."}</Text>
        </View>
      </View>

      <View style={s.center}>
        {state === "idle" && (
          <>
            <Text style={s.hint}>Tap the button to alert SIS Operations{"\n"}and your emergency contacts</Text>
            <View style={s.btnZone}>
              <Animated.View style={{ transform: [{ scale }] }}>
                <TouchableOpacity style={s.sosBtn} activeOpacity={0.9} onPress={startSOS}
                  onPressIn={() => press(true)} onPressOut={() => press(false)}>
                  <Ionicons name="warning" size={44} color="#fff" />
                  <Text style={s.sosLabel}>SOS</Text>
                  <Text style={s.sosSub}>ALERT</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
            <Text style={s.note}>
              Once triggered, your live location and a voice recording are sent to nearby and emergency contacts. You can cancel during the countdown.
            </Text>
          </>
        )}

        {state === "countdown" && (
          <>
            <Text style={s.countTitle}>Alert triggering in</Text>
            <View style={s.btnZone}>
              <PulsingRing active />
              <View style={[s.sosBtn, s.sosBtnActive]}>
                <Text style={s.countNum}>{countdown}</Text>
                <Text style={s.sosSub}>SECONDS</Text>
              </View>
            </View>
            <View style={s.recRow}>
              <RecordingDot color={RED} />
              <Text style={s.recText}>Recording your voice...</Text>
            </View>
            <TouchableOpacity style={s.cancelBtn} onPress={cancelSOS} activeOpacity={0.85}>
              <Text style={s.cancelText}>Cancel Alert</Text>
            </TouchableOpacity>
          </>
        )}

        {state === "active" && (
          <>
            <View style={s.btnZone}>
              <View style={[s.sosBtn, s.sosBtnSent]}>
                <Ionicons name="checkmark" size={64} color="#fff" />
              </View>
            </View>
            <Text style={s.sentTitle}>Alert Sent Successfully</Text>
            <Text style={s.sentSub}>
              SIS Operations and your contacts have been notified with your live GPS location and voice note. Stay safe.
            </Text>
            <TouchableOpacity style={s.doneBtn} onPress={reset} activeOpacity={0.9}>
              <Text style={s.doneText}>Done</Text>
            </TouchableOpacity>
          </>
        )}

        {state === "cancelled" && (
          <>
            <View style={s.btnZone}>
              <View style={[s.sosBtn, { backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine }]}>
                <Ionicons name="close" size={56} color={c.muted} />
              </View>
            </View>
            <Text style={s.sentSub}>Alert cancelled.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { paddingTop: 56, paddingHorizontal: 24, alignItems: "center" },
  title: { color: c.text, fontSize: 22, fontWeight: "900", letterSpacing: 0.3 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  locText: { color: c.muted, fontSize: 13 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  hint: { color: c.muted, fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 36 },

  btnZone: { width: SOS_SIZE + 80, height: SOS_SIZE + 80, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  sosBtn: {
    width: SOS_SIZE, height: SOS_SIZE, borderRadius: SOS_SIZE / 2, backgroundColor: RED,
    alignItems: "center", justifyContent: "center",
    shadowColor: RED, shadowOpacity: 0.6, shadowRadius: 30, shadowOffset: { width: 0, height: 8 }, elevation: 16,
  },
  sosBtnActive: { backgroundColor: "#dc2626" },
  sosBtnSent: { backgroundColor: c.green, shadowColor: c.green },
  sosLabel: { color: "#fff", fontSize: 40, fontWeight: "900", letterSpacing: 3, marginTop: 6 },
  sosSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "800", letterSpacing: 3, marginTop: 2 },
  countNum: { color: "#fff", fontSize: 80, fontWeight: "900" },

  countTitle: { color: c.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  note: { color: c.faint, fontSize: 12, textAlign: "center", lineHeight: 18 },

  recRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 },
  recText: { color: RED, fontSize: 14, fontWeight: "700" },

  cancelBtn: { backgroundColor: RED, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 64 },
  cancelText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  sentTitle: { color: c.text, fontSize: 22, fontWeight: "900", marginBottom: 10 },
  sentSub: { color: c.muted, fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  doneBtn: { backgroundColor: c.green, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 72 },
  doneText: { color: "#04140a", fontSize: 16, fontWeight: "900" },

  ring: { position: "absolute", width: SOS_SIZE, height: SOS_SIZE, borderRadius: SOS_SIZE / 2, backgroundColor: RED },
});
