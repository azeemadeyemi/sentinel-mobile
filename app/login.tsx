import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, StatusBar, Animated, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { loginUser } from "@/src/api/client";

const { height: SCREEN_H } = Dimensions.get("window");
const GREEN  = "#15803d";
const DARK_GREEN = "#0f5f2e";
const ORANGE = "#ea580c";
const WHITE  = "#ffffff";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwdFocus,   setPwdFocus]   = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
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
      <StatusBar barStyle="light-content" backgroundColor={DARK_GREEN} />

      {/* ── Top green hero ───────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroPill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>Renaissance Energy · SIS</Text>
        </View>

        <Text style={styles.heroTitle}>Welcome{"\n"}Back.</Text>
        <Text style={styles.heroSub}>
          Sign in to Sentinel — your security{"\n"}intelligence platform.
        </Text>

        {/* Curved white bottom edge */}
        <View style={styles.curve} />
      </View>

      {/* ── White form ───────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.formZone}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error banner */}
        {error && (
          <Animated.View
            style={[styles.errorBox, { transform: [{ translateX: shakeAnim }] }]}
          >
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={[styles.input, emailFocus && styles.inputFocused]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
            placeholder="you@renaissance.com"
            placeholderTextColor="#b0b8c4"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          {emailFocus && <View style={styles.inputBar} />}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.pwdWrap}>
            <TextInput
              style={[styles.input, styles.inputPwd, pwdFocus && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
              placeholder="Enter your password"
              placeholderTextColor="#b0b8c4"
              secureTextEntry={!pwdVisible}
              autoComplete="current-password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setPwdVisible(v => !v)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.eyeText, pwdVisible && { color: GREEN }]}>
                {pwdVisible ? "HIDE" : "SHOW"}
              </Text>
            </TouchableOpacity>
            {pwdFocus && <View style={styles.inputBar} />}
          </View>
        </View>

        {/* Sign In button */}
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={WHITE} size="small" />
            : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>Sign In</Text>
                <Text style={styles.btnArrow}>→</Text>
              </View>
            )
          }
        </TouchableOpacity>

        <Text style={styles.footer}>
          Authorised personnel only · Contact your SIS administrator for access
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HERO_H = SCREEN_H * 0.42;

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: DARK_GREEN },

  // Hero
  hero: {
    height: HERO_H,
    backgroundColor: DARK_GREEN,
    paddingTop: 60,
    paddingHorizontal: 28,
    justifyContent: "flex-end",
    paddingBottom: 52,
  },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "flex-start",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 24,
  },
  pillDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#86efac" },
  pillText: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  heroTitle: {
    color: WHITE,
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 54,
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  heroSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 22,
  },

  curve: {
    position: "absolute",
    bottom: -1, left: 0, right: 0,
    height: 36,
    backgroundColor: WHITE,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },

  // Form
  formZone:    { flex: 1, backgroundColor: WHITE },
  formContent: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40 },

  field:     { marginBottom: 24 },
  label:     { color: "#374151", fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10, textTransform: "uppercase" },

  input: {
    backgroundColor: "#f4f6f8",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: "#111827",
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: GREEN,
    backgroundColor: "#f0fdf4",
  },
  inputPwd: { paddingRight: 64 },
  inputBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 2, backgroundColor: GREEN, borderRadius: 1,
  },

  pwdWrap:  { position: "relative" },
  eyeBtn:   { position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" },
  eyeText:  { color: "#9ca3af", fontSize: 10, fontWeight: "800", letterSpacing: 1 },

  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1.5, borderColor: "#fecaca",
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { color: "#dc2626", fontSize: 13, fontWeight: "600" },

  btn: {
    backgroundColor: DARK_GREEN,
    borderRadius: 16, height: 58,
    alignItems: "center", justifyContent: "center",
    marginTop: 8, marginBottom: 32,
    shadowColor: DARK_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText:  { color: WHITE, fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  btnArrow: { color: WHITE, fontSize: 22 },

  footer: {
    color: "#9ca3af", fontSize: 11,
    textAlign: "center", lineHeight: 17,
  },
});
