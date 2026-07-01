import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { useTheme, glow, type Palette } from "@/src/theme";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ANALYST: "SIS Analyst", REPORTER: "Field Reporter",
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const c = useTheme();
  const g = glow(c);
  const s = useMemo(() => makeStyles(c), [c.isDark]);

  const initials = (user?.name ?? user?.email ?? "U")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: async () => { await signOut(); router.replace("/login"); } },
    ]);
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle={c.isDark ? "light-content" : "dark-content"} backgroundColor={c.bg} />
      <LinearGradient colors={g.colors} locations={g.locations} style={s.glow} />

      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <View style={s.rolePill}>
          <View style={s.roleDot} />
          <Text style={s.roleText}>{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.section}>
          <Text style={s.sectionLabel}>Account details</Text>
          <View style={s.card}>
            {[
              { k: "Organisation", v: "Renaissance Africa Energy" },
              { k: "Platform", v: "Sentinel SIS" },
              { k: "Hub", v: user?.role === "REPORTER" ? "Field" : "Operations" },
              { k: "Access level", v: ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "" },
            ].map((row, i, arr) => (
              <View key={row.k} style={[s.infoRow, i < arr.length - 1 && s.infoBorder]}>
                <Text style={s.infoKey}>{row.k}</Text>
                <Text style={s.infoVal}>{row.v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Emergency contacts</Text>
          <View style={s.card}>
            {[
              { k: "SIS Operations", v: "+234 807 022 8197" },
              { k: "Security Control", v: "+234 XXX XXX XXXX" },
            ].map((row, i, arr) => (
              <View key={row.k} style={[s.infoRow, i < arr.length - 1 && s.infoBorder]}>
                <Text style={s.infoKey}>{row.k}</Text>
                <Text style={[s.infoVal, { color: c.green, fontWeight: "700" }]}>{row.v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Powered by</Text>
          <View style={s.logoCard}>
            <Image source={require("@/assets/renaissance-logo.png")} style={s.logo} resizeMode="contain" />
          </View>
        </View>

        <View style={s.section}>
          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color={c.red} />
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
          <Text style={s.version}>Sentinel v1.0 · Restricted · SIS Operations</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },

  header: { paddingTop: 64, paddingBottom: 24, alignItems: "center" },
  avatar: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: c.card,
    borderWidth: 2, borderColor: c.green, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: c.text, fontSize: 26, fontWeight: "900" },
  name: { color: c.text, fontSize: 22, fontWeight: "900" },
  email: { color: c.muted, fontSize: 13, marginTop: 2 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10,
    backgroundColor: c.isDark ? "rgba(34,197,94,0.14)" : "#dcfce7",
    borderWidth: 1, borderColor: c.isDark ? "rgba(34,197,94,0.3)" : "#bbf7d0",
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.green },
  roleText: { color: c.green, fontSize: 12, fontWeight: "700" },

  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: { color: c.faint, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine, borderRadius: 18, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: c.cardLine },
  infoKey: { color: c.muted, fontSize: 14 },
  infoVal: { color: c.text, fontSize: 14, fontWeight: "600" },

  logoCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.cardLine, borderRadius: 18, padding: 20, alignItems: "center" },
  logo: { width: 200, height: 56 },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: c.card, borderRadius: 16, borderWidth: 1.5,
    borderColor: c.isDark ? "rgba(239,68,68,0.4)" : "#fecaca", paddingVertical: 15, marginBottom: 14,
  },
  signOutText: { color: c.red, fontSize: 15, fontWeight: "700" },
  version: { color: c.faint, fontSize: 11, textAlign: "center" },
});
