import { useState, useRef, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, StatusBar, Image, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { loginUser } from "@/src/api/client";
import { useTheme, glow, type Palette } from "@/src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

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

  async function handleBiometric() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        setError("Biometric sign-in isn't set up on this device.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Sentinel",
        fallbackLabel: "Use password",
      });
      if (!result.success) return;
      setLoading(true);
      const { token, user } = await loginUser("biometric@renaissance.com", "biometric");
      await signIn(token, user);
      router.replace("/(tabs)");
    } catch {
      setError("Biometric sign-in failed. Use your password.");
    } finally {
      setLoading(false);
    }
  }

  const placeholder = c.isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.brand}>
            <View style={s.logoCard}>
              <Image source={require("@/assets/renaissance-logo.png")} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.wordmark}>SENTINEL</Text>
          </View>

          <Text style={s.title}>Sign in to your account</Text>
          <Text style={s.subtitle}>Welcome back. Enter your credentials to continue.</Text>

          {error && (
            <Animated.View style={[s.errorBox, { transform: [{ translateX: shakeAnim }] }]}>
              <Ionicons name="alert-circle" size={16} color={c.red} />
              <Text style={s.errorText}>{error}</Text>
            </Animated.View>
          )}

          <View style={[s.inputRow, emailFocus && s.inputRowFocused]}>
            <Ionicons name="mail-outline" size={20} color={emailFocus ? c.green : c.muted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              placeholder="you@renaissance.com"
              placeholderTextColor={placeholder}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email"
            />
          </View>

          <View style={[s.inputRow, pwdFocus && s.inputRowFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={pwdFocus ? c.green : c.muted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
              placeholder="Enter your password"
              placeholderTextColor={placeholder}
              secureTextEntry={!pwdVisible} autoComplete="current-password"
            />
            <TouchableOpacity onPress={() => setPwdVisible(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={pwdVisible ? "eye-off-outline" : "eye-outline"} size={20} color={c.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.forgotWrap} activeOpacity={0.7} onPress={() => router.push("/forgot-password")}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
              <View style={s.btnInner}>
                <Text style={s.btnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={s.bioBtn} activeOpacity={0.8} onPress={handleBiometric}>
            <Ionicons name="finger-print" size={20} color={c.green} />
            <Text style={s.bioText}>Use biometric login</Text>
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>RESTRICTED ACCESS</Text>
            <View style={s.dividerLine} />
          </View>
          <Text style={s.footer}>
            Authorised personnel only.{"\n"}Contact your SIS administrator for access.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 96, paddingBottom: 48 },

  brand: { alignItems: "center", marginBottom: 40 },
  logoCard: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12, marginBottom: 18,
  },
  logo: { width: 66, height: 66 },
  wordmark: { color: c.text, fontSize: 24, fontWeight: "900", letterSpacing: 8 },

  title: { color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 8, textAlign: "center" },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 21, marginBottom: 28, textAlign: "center" },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: c.isDark ? "rgba(220,38,38,0.12)" : "#fef2f2",
    borderWidth: 1, borderColor: c.isDark ? "rgba(248,113,113,0.4)" : "#fecaca",
    borderRadius: 12, padding: 13, marginBottom: 20,
  },
  errorText: { color: c.red, fontSize: 13, fontWeight: "600", flex: 1 },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: c.card, borderWidth: 1.5, borderColor: c.cardLine,
    borderRadius: 16, paddingHorizontal: 16, minHeight: 58, marginBottom: 16,
  },
  inputRowFocused: { borderColor: c.green, backgroundColor: c.isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4" },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: c.text, fontSize: 15, paddingVertical: 16 },

  forgotWrap: { alignSelf: "flex-end", marginBottom: 24, marginTop: 2 },
  forgotText: { color: c.green, fontSize: 13, fontWeight: "600" },

  btn: {
    backgroundColor: c.orange, borderRadius: 16, height: 58,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
    shadowColor: c.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 10,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },

  bioBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderWidth: 1.5, borderColor: c.cardLine, borderRadius: 16, height: 56, marginBottom: 36,
  },
  bioText: { color: c.text, fontSize: 15, fontWeight: "700" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.cardLine },
  dividerText: { color: c.faint, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  footer: { color: c.faint, fontSize: 12, textAlign: "center", lineHeight: 18 },
});
