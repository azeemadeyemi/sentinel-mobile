import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, StatusBar, Image, Animated, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { loginUser } from "@/src/api/client";

const { height: SCREEN_H } = Dimensions.get("window");
const GREEN  = "#15803d";
const ORANGE = "#ea580c";
const WHITE  = "#ffffff";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwdFocus,   setPwdFocus]   = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      shake();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await loginUser(email.trim(), password);
      await signIn(token, user);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid credentials. Try again.");
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* ── Top green zone ──────────────────────────────────────────────── */}
      <View style={styles.topZone}>
        {/* Logo card */}
        <View style={styles.logoCard}>
          <Image
            source={require("@/assets/renaissance-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>SENTINEL</Text>
        <Text style={styles.tagline}>Security Intelligence System</Text>

        {/* Wave shape at bottom of green zone */}
        <View style={styles.wave} />
      </View>

      {/* ── White form zone ─────────────────────────────────────────────── */}
      <ScrollView
        style={styles.formZone}
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.formTitle}>Welcome back</Text>
        <Text style={styles.formSub}>Sign in to your SIS account</Text>

        {/* Error */}
        {error && (
          <Animated.View
            style={[styles.errorBox, { transform: [{ translateX: shakeAnim }] }]}
          >
            <View style={styles.errorDot} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Email field */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email address</Text>
          <View style={[styles.inputRow, emailFocus && styles.inputRowFocused]}>
            <View style={styles.inputIcon}>
              {/* Person icon */}
              <View style={styles.iconPersonHead} />
              <View style={styles.iconPersonBody} />
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="you@renaissance.com"
              placeholderTextColor="#c4c9d0"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
        </View>

        {/* Password field */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={[styles.inputRow, pwdFocus && styles.inputRowFocused]}>
            <View style={styles.inputIcon}>
              {/* Lock icon */}
              <View style={styles.iconLockBody} />
              <View style={styles.iconLockArch} />
            </View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
              placeholder="Enter your password"
              placeholderTextColor="#c4c9d0"
              secureTextEntry={!pwdVisible}
              autoComplete="current-password"
            />
            <TouchableOpacity
              onPress={() => setPwdVisible(v => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[styles.eyeOuter, pwdVisible && { borderColor: GREEN }]}>
                <View style={[styles.eyeInner, pwdVisible && { backgroundColor: GREEN }]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In button */}
        <TouchableOpacity
          style={[styles.signInBtn, loading && { opacity: 0.75 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={WHITE} />
            : (
              <View style={styles.signInInner}>
                <Text style={styles.signInText}>Sign In</Text>
                <Text style={styles.signInArrow}>→</Text>
              </View>
            )
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Restricted access</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.footer}>
          Authorised SIS personnel only.{"\n"}Contact your administrator for access.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const TOP_H = SCREEN_H * 0.38;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GREEN },

  // ── Top green zone ────────────────────────────────────────────────────────
  topZone: {
    height: TOP_H,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 36,
    paddingBottom: 36,
    position: "relative",
  },

  logoCard: {
    width: 90, height: 90,
    borderRadius: 22,
    backgroundColor: WHITE,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 14,
  },
  logo:    { width: 74, height: 74 },
  appName: {
    color: WHITE, fontSize: 20, fontWeight: "900",
    letterSpacing: 6, marginBottom: 4,
  },
  tagline: { color: "rgba(255,255,255,0.65)", fontSize: 12, letterSpacing: 0.5 },

  // Wave / curved bottom edge
  wave: {
    position: "absolute",
    bottom: -1, left: 0, right: 0,
    height: 40,
    backgroundColor: WHITE,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // ── White form zone ───────────────────────────────────────────────────────
  formZone: { flex: 1, backgroundColor: WHITE },
  formScroll: {
    paddingTop: 16,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  formTitle: {
    color: "#111827", fontSize: 26, fontWeight: "800",
    letterSpacing: -0.5, marginBottom: 4,
  },
  formSub: { color: "#9ca3af", fontSize: 14, marginBottom: 28 },

  // Error
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626", flexShrink: 0 },
  errorText: { color: "#dc2626", fontSize: 13, flex: 1, lineHeight: 18 },

  // Input fields
  fieldWrap: { marginBottom: 20 },
  fieldLabel: { color: "#374151", fontSize: 13, fontWeight: "600", marginBottom: 8 },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5, borderColor: "#e5e7eb",
    borderRadius: 14, paddingHorizontal: 14,
    minHeight: 54,
  },
  inputRowFocused: {
    borderColor: GREEN, backgroundColor: "#f0fdf4",
  },

  inputIcon: { width: 24, alignItems: "center", justifyContent: "center", marginRight: 10 },

  // Person icon shapes
  iconPersonHead: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: "#9ca3af",
    marginBottom: 2,
  },
  iconPersonBody: {
    width: 14, height: 7,
    borderTopLeftRadius: 7, borderTopRightRadius: 7,
    borderWidth: 1.5, borderColor: "#9ca3af", borderBottomWidth: 0,
  },
  // Lock icon shapes
  iconLockBody: {
    position: "absolute", bottom: 0,
    width: 14, height: 9,
    backgroundColor: "#9ca3af", borderRadius: 3,
  },
  iconLockArch: {
    position: "absolute", top: 0,
    width: 10, height: 8,
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
    borderWidth: 1.5, borderColor: "#9ca3af", borderBottomWidth: 0,
  },

  input: {
    flex: 1, color: "#111827", fontSize: 15, paddingVertical: 14,
  },

  eyeBtn: { padding: 4 },
  eyeOuter: {
    width: 18, height: 12, borderRadius: 9,
    borderWidth: 1.5, borderColor: "#9ca3af",
    alignItems: "center", justifyContent: "center",
  },
  eyeInner: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#9ca3af",
  },

  // Sign In button
  signInBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14, height: 56,
    alignItems: "center", justifyContent: "center",
    marginTop: 8, marginBottom: 28,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  signInInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  signInText:  { color: WHITE, fontSize: 17, fontWeight: "800" },
  signInArrow: { color: WHITE, fontSize: 20, fontWeight: "300" },

  // Divider
  dividerRow: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { color: "#9ca3af", fontSize: 11, fontWeight: "600" },

  footer: {
    color: "#9ca3af", fontSize: 12, textAlign: "center", lineHeight: 18,
  },
});
