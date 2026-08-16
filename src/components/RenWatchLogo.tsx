import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/src/theme";

// The RenWatch mark — shield + check, mirroring the web app's logo.
export function ShieldMark({ size = 48, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5 4.5 5.2v6.1c0 4.6 3.2 7.7 7.5 9.2 4.3-1.5 7.5-4.6 7.5-9.2V5.2L12 2.5Z"
        stroke={color} strokeWidth={1.7} strokeLinejoin="round"
      />
      <Path
        d="M9.1 12.2l2 2 3.7-4.1"
        stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// Two-tone wordmark: REN (ink) + WATCH (accent).
export function Wordmark({ fontSize = 24, letterSpacing = 8 }: { fontSize?: number; letterSpacing?: number }) {
  const c = useTheme();
  return (
    <Text style={[styles.word, { color: c.text, fontSize, letterSpacing }]}>
      REN<Text style={{ color: c.green }}>WATCH</Text>
    </Text>
  );
}

// Full lockup (mark above wordmark) used on the splash / login hero.
export function RenWatchLogo({ markSize = 52 }: { markSize?: number }) {
  const c = useTheme();
  return (
    <View style={styles.lockup}>
      <ShieldMark size={markSize} color={c.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  word: { fontWeight: "900" },
  lockup: { alignItems: "center", justifyContent: "center" },
});
