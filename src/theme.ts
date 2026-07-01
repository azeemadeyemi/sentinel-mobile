import { useColorScheme } from "react-native";

// Sentinel adaptive theme. Same keys in light + dark so screens can be
// written once against `c.<key>` and switch automatically with the phone.
export type Palette = {
  isDark: boolean;
  bg: string;         // screen background
  bgElev: string;     // raised surface (tab bar, sheets)
  card: string;       // card / input fill
  cardLine: string;   // card / input border
  text: string;       // primary text
  muted: string;      // secondary text
  faint: string;      // tertiary text / icons
  green: string;      // brand accent (buttons, active)
  greenSoft: string;  // soft green text
  glow: string;       // top-of-screen gradient anchor
  glowMid: string;    // gradient middle stop
  orange: string;     // primary CTA
  red: string;        // danger / SOS
  overlay: string;    // scrims
};

const dark: Palette = {
  isDark: true,
  bg: "#07120c",
  bgElev: "#0d1a12",
  card: "rgba(255,255,255,0.05)",
  cardLine: "rgba(255,255,255,0.12)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.6)",
  faint: "rgba(255,255,255,0.4)",
  green: "#22c55e",
  greenSoft: "#86efac",
  glow: "#15803d",
  glowMid: "#0a2417",
  orange: "#ea580c",
  red: "#ef4444",
  overlay: "rgba(0,0,0,0.6)",
};

const light: Palette = {
  isDark: false,
  bg: "#f4f7f5",
  bgElev: "#ffffff",
  card: "#ffffff",
  cardLine: "#e5e7eb",
  text: "#0f172a",
  muted: "#64748b",
  faint: "#94a3b8",
  green: "#15803d",
  greenSoft: "#15803d",
  glow: "#22c55e",
  glowMid: "#bbf7d0",
  orange: "#ea580c",
  red: "#dc2626",
  overlay: "rgba(0,0,0,0.4)",
};

export function useTheme(): Palette {
  const scheme = useColorScheme();
  return scheme === "light" ? light : dark;
}

// Top-of-screen glow gradient for the current palette.
export function glow(c: Palette) {
  return c.isDark
    ? { colors: [c.glow, c.glowMid, c.bg] as const, locations: [0, 0.4, 0.85] as const }
    : { colors: [c.glowMid, "#eafaf0", c.bg] as const, locations: [0, 0.45, 0.9] as const };
}
