import { useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, glow, type Palette } from "@/src/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);
  const [email, setEmail] = useState("");
  const [focus, setFocus] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={c.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.content}>
          {sent ? (
            <View style={s.sentWrap}>
              <View style={s.iconCircle}><Ionicons name="mail-open-outline" size={40} color={c.green} /></View>
              <Text style={s.title}>Check your email</Text>
              <Text style={s.subtitle}>
                If an account exists for {email.trim()}, we have sent password reset instructions to your SIS administrator.
              </Text>
              <TouchableOpacity style={s.btn} onPress={() => router.replace("/login")} activeOpacity={0.9}>
                <Text style={s.btnText}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={s.iconCircle}><Ionicons name="lock-closed-outline" size={36} color={c.green} /></View>
              <Text style={s.title}>Forgot password?</Text>
              <Text style={s.subtitle}>Enter your work email and we will send reset instructions.</Text>

              <View style={[s.inputRow, focus && s.inputFocused]}>
                <Ionicons name="mail-outline" size={20} color={focus ? c.green : c.muted} style={{ marginRight: 12 }} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocus(true)}
                  onBlur={() => setFocus(false)}
                  placeholder="you@renaissance.com"
                  placeholderTextColor={c.isDark ? "rgba(255,255,255,0.35)" : "#9ca3af"}
                  autoCapitalize="none" keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                style={[s.btn, !email.trim() && { opacity: 0.5 }]}
                disabled={!email.trim()}
                onPress={() => setSent(true)}
                activeOpacity={0.9}
              >
                <Text style={s.btnText}>Send reset link</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  backBtn: {
    position: "absolute", top: 56, left: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.card,
    borderWidth: 1, borderColor: c.cardLine, alignItems: "center", justifyContent: "center",
  },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  sentWrap: { alignItems: "flex-start" },
  iconCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: c.isDark ? "rgba(34,197,94,0.14)" : "#dcfce7",
    borderWidth: 1, borderColor: c.isDark ? "rgba(34,197,94,0.3)" : "#bbf7d0",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  title: { color: c.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { color: c.muted, fontSize: 15, lineHeight: 22, marginBottom: 28 },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: c.card, borderWidth: 1.5, borderColor: c.cardLine,
    borderRadius: 16, paddingHorizontal: 16, minHeight: 58, marginBottom: 20,
  },
  inputFocused: { borderColor: c.green, backgroundColor: c.isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4" },
  input: { flex: 1, color: c.text, fontSize: 15, paddingVertical: 16 },

  btn: {
    backgroundColor: c.orange, borderRadius: 16, height: 58, alignSelf: "stretch",
    alignItems: "center", justifyContent: "center",
    shadowColor: c.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
