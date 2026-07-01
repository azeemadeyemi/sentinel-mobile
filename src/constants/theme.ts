// Renaissance Energy — clean light app, brand colors as accents
export const colors = {
  // Backgrounds
  bg:          "#ffffff",
  bgSecondary: "#f5f7f5",   // very light green-tinted gray
  bgCard:      "#ffffff",
  bgInput:     "#f9fafb",
  bgOverlay:   "rgba(0,0,0,0.45)",

  // Renaissance greens (from logo)
  primary:      "#15803d",  // deep brand green (logo text colour)
  primaryMid:   "#16a34a",
  primaryLight: "#dcfce7",  // very light green for tints
  primaryFaint: "#f0fdf4",  // almost white with green tint

  // Flame accents (from logo)
  orange: "#ea580c",        // flame top — urgent CTA
  amber:  "#f59e0b",        // flame body

  // Text
  text:          "#111827",
  textSecondary: "#6b7280",
  textMuted:     "#9ca3af",
  textOnGreen:   "#ffffff",

  // UI
  border:        "#e5e7eb",
  borderFocus:   "#15803d",
  shadow:        "rgba(0,0,0,0.08)",

  // Status / domain colours (unchanged — these are semantic)
  red:    "#dc2626",
  blue:   "#2563eb",
  yellow: "#ca8a04",
  purple: "#7c3aed",
  teal:   "#0d9488",
  green:  "#16a34a",

  // Status badges
  success: "#15803d",
  warning: "#d97706",
  danger:  "#dc2626",
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
