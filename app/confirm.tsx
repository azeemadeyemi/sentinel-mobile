import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, spacing, radius, shadow } from "@/src/constants/theme";

export default function ConfirmScreen() {
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref: string }>();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* Green top accent */}
      <View style={styles.topBar} />

      <View style={styles.content}>

        {/* Success icon */}
        <View style={[styles.iconWrap, shadow.sm]}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>Report Submitted</Text>
        <Text style={styles.sub}>
          Your report has been received by the SIS Operations team and will be reviewed immediately.
        </Text>

        {/* Reference card */}
        <View style={[styles.refCard, shadow.sm]}>
          <Text style={styles.refLabel}>REFERENCE NUMBER</Text>
          <Text style={styles.refValue}>{ref}</Text>
          <View style={styles.refDivider} />
          <Text style={styles.refNote}>
            Keep this reference number for follow-up with SIS Operations.
          </Text>
        </View>

        {/* What happens next */}
        <View style={[styles.nextCard, shadow.sm]}>
          <Text style={styles.nextTitle}>What happens next</Text>
          {[
            "SIS analyst reviews your report",
            "Report verified and classified",
            "Response coordinated if needed",
          ].map((step, i) => (
            <View key={i} style={styles.nextRow}>
              <View style={styles.nextDot}>
                <Text style={styles.nextDotText}>{i + 1}</Text>
              </View>
              <Text style={styles.nextText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/(tabs)/report")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Submit Another Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, shadow.sm]}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bgSecondary },
  topBar: { height: 5, backgroundColor: colors.primary },

  content: {
    flex: 1, padding: spacing.lg, alignItems: "center",
    justifyContent: "center", gap: spacing.md,
  },

  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  checkMark: { color: colors.primary, fontSize: 34, fontWeight: "700" },

  title: { color: colors.text, fontSize: 26, fontWeight: "800", textAlign: "center" },
  sub:   {
    color: colors.textSecondary, fontSize: 14, textAlign: "center",
    lineHeight: 22, maxWidth: 300,
  },

  refCard: {
    backgroundColor: colors.bg, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, alignItems: "center", width: "100%",
  },
  refLabel:   { color: colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 8 },
  refValue:   { color: colors.primary, fontSize: 28, fontWeight: "800" },
  refDivider: { width: "100%", height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  refNote:    { color: colors.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18 },

  nextCard: {
    backgroundColor: colors.bg, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, width: "100%", gap: spacing.sm,
  },
  nextTitle: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 4 },
  nextRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  nextDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  nextDotText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  nextText:    { color: colors.textSecondary, fontSize: 13, flex: 1 },

  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 15, alignItems: "center", width: "100%",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  secondaryBtn: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 15, alignItems: "center", width: "100%",
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: 15 },
});
