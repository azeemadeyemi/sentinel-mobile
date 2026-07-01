import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/store/auth";
import { colors, spacing, radius, shadow } from "@/src/constants/theme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const initials = (user?.name ?? user?.email ?? "U")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const ROLE_LABEL: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ANALYST:     "SIS Analyst",
    REPORTER:    "Field Reporter",
  };

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out", style: "destructive",
        onPress: async () => { await signOut(); router.replace("/login"); },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{user?.name}</Text>
          <Text style={styles.headerEmail}>{user?.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Account info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>
          <View style={[styles.infoCard, shadow.sm]}>
            {[
              { k: "Organisation", v: "Renaissance Africa Energy" },
              { k: "Platform",     v: "Sentinel SIS"              },
              { k: "Hub",          v: user?.role === "REPORTER" ? "Field" : "Operations" },
              { k: "Access level", v: ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "" },
            ].map((row, i, arr) => (
              <View key={row.k} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoKey}>{row.k}</Text>
                <Text style={styles.infoVal}>{row.v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Company logo */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POWERED BY</Text>
          <View style={[styles.logoCard, shadow.sm]}>
            <Image
              source={require("@/assets/renaissance-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Emergency */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EMERGENCY CONTACTS</Text>
          <View style={[styles.infoCard, shadow.sm]}>
            {[
              { k: "SIS Operations",  v: "+234 807 022 8197" },
              { k: "Security Control", v: "+234 XXX XXX XXXX" },
            ].map((row, i, arr) => (
              <View key={row.k} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoKey}>{row.k}</Text>
                <Text style={[styles.infoVal, { color: colors.primary, fontWeight: "700" }]}>{row.v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { paddingBottom: spacing.xxl }]}>
          <TouchableOpacity style={[styles.signOutBtn, shadow.sm]} onPress={handleSignOut} activeOpacity={0.85}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Sentinel v1.0 · Restricted · SIS Operations</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgSecondary },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 52, paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.md,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText:   { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerInfo:   { flex: 1 },
  headerName:   { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerEmail:  { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
  rolePill: {
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3,
  },
  roleText: { color: "#d1fae5", fontSize: 11, fontWeight: "600" },

  section: { padding: spacing.lg, paddingBottom: 0 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 10, fontWeight: "700",
    letterSpacing: 2, marginBottom: spacing.sm,
  },

  infoCard: {
    backgroundColor: colors.bg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", padding: spacing.md },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoKey: { color: colors.textSecondary, fontSize: 14 },
  infoVal: { color: colors.text, fontSize: 14, fontWeight: "500" },

  logoCard: {
    backgroundColor: colors.bg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, alignItems: "center",
  },
  logo: { width: 200, height: 60 },

  signOutBtn: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: "#fecaca",
    paddingVertical: 14, alignItems: "center", marginBottom: spacing.md,
  },
  signOutText:  { color: colors.danger, fontSize: 15, fontWeight: "700" },
  versionText:  { color: colors.textMuted, fontSize: 11, textAlign: "center" },
});
