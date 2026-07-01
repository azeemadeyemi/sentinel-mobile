// Sentinel dark theme — the premium green-glow-on-near-black palette
// shared across splash, onboarding, login and the in-app screens.
export const dark = {
  bg:        "#07120c",   // near-black green
  bgElev:    "#0d1a12",   // slightly raised surface
  glow:      "#15803d",   // deep brand green (gradient glow)
  green:     "#22c55e",   // neon accent
  greenSoft: "#86efac",   // light green text
  orange:    "#ea580c",   // brand CTA
  red:       "#ef4444",   // danger / SOS
  white:     "#ffffff",
  text:      "#ffffff",
  muted:     "rgba(255,255,255,0.6)",
  faint:     "rgba(255,255,255,0.4)",
  glass:     "rgba(255,255,255,0.05)",
  glassLine: "rgba(255,255,255,0.12)",
};

// Gradient stops for the top-of-screen green glow.
export const glowGradient = {
  colors: [dark.glow, "#0a2417", dark.bg] as const,
  locations: [0, 0.4, 0.85] as const,
};

// Incident categories shown on the Home grid. `domain` + `risk` feed the
// existing report payload so the report flow keeps working unchanged.
export type Category = {
  key: string;
  label: string;
  desc: string;
  icon: string;      // Ionicons glyph name
  color: string;
  domain: string;    // maps to report payload domain
  risk: string;      // default severity
};

export const CATEGORIES: Category[] = [
  { key: "BANDITRY",    label: "Banditry / attack", desc: "Armed attackers or bandits",  icon: "warning",              color: "#ef4444", domain: "SECURITY",  risk: "HIGH" },
  { key: "ROBBERY",     label: "Robbery / Theft",   desc: "Mugging or theft in progress", icon: "briefcase-outline",   color: "#f59e0b", domain: "SECURITY",  risk: "HIGH" },
  { key: "KIDNAPPING",  label: "Kidnapping",        desc: "Person been abducted",         icon: "person-outline",       color: "#f97316", domain: "SECURITY",  risk: "CRITICAL" },
  { key: "SUSPICIOUS",  label: "Suspicious activity", desc: "Something feels off",        icon: "eye-outline",          color: "#14b8a6", domain: "SECURITY",  risk: "MEDIUM" },
  { key: "ARMED",       label: "Armed robbery",     desc: "Robbery with weapons",         icon: "skull-outline",        color: "#dc2626", domain: "SECURITY",  risk: "CRITICAL" },
  { key: "FIRE",        label: "Fire outbreak",     desc: "Fire burning or spreading",    icon: "flame",                color: "#f97316", domain: "HSE",       risk: "HIGH" },
  { key: "ACCIDENT",    label: "Car accident",      desc: "Road accident or crash",       icon: "car-sport-outline",    color: "#3b82f6", domain: "HSE",       risk: "MEDIUM" },
  { key: "MEDICAL",     label: "Medical emergency", desc: "Someone needs urgent care",    icon: "medkit-outline",       color: "#22c55e", domain: "HSE",       risk: "HIGH" },
  { key: "HERDSMEN",    label: "Herdsmen attack",   desc: "Herder-farmer clash",          icon: "leaf-outline",         color: "#84cc16", domain: "COMMUNITY", risk: "HIGH" },
  { key: "CULT",        label: "Cult activity",     desc: "Cult clash or violence",       icon: "people-outline",       color: "#a855f7", domain: "SECURITY",  risk: "HIGH" },
  { key: "FLOOD",       label: "Flood / disaster",  desc: "Flooding or natural disaster", icon: "water-outline",        color: "#0ea5e9", domain: "HSE",       risk: "MEDIUM" },
  { key: "VANDALISM",   label: "Vandalism",         desc: "Property or pipeline damage",  icon: "hammer-outline",       color: "#eab308", domain: "HSE",       risk: "MEDIUM" },
];
