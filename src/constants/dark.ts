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

// Operational-security taxonomy for the Niger Delta oil & gas environment.
// `domain` matches the web/DB Domain enum (SECURITY | COMMUNITY | HSE | POLITICAL
// | MARITIME); `risk` matches the RiskBand enum; `label` is sent as incidentType.
export const CATEGORIES: Category[] = [
  { key: "ARMED_ATTACK",   label: "Armed attack / banditry",        desc: "Armed attackers or bandits",        icon: "warning",             color: "#ef4444", domain: "SECURITY",  risk: "CRITICAL" },
  { key: "KIDNAPPING",     label: "Kidnapping (K&R)",               desc: "Person abducted or held",           icon: "person-remove-outline", color: "#f97316", domain: "SECURITY", risk: "CRITICAL" },
  { key: "VANDALISM",      label: "Pipeline vandalism / sabotage",  desc: "Damage to pipeline or assets",      icon: "construct-outline",   color: "#eab308", domain: "SECURITY",  risk: "HIGH" },
  { key: "BUNKERING",      label: "Illegal bunkering / crude theft", desc: "Crude tapping or oil theft",       icon: "flask-outline",       color: "#f59e0b", domain: "SECURITY",  risk: "HIGH" },
  { key: "ILLEGAL_REFINING", label: "Illegal refining",             desc: "Artisanal / illegal refining site", icon: "flame-outline",       color: "#f97316", domain: "SECURITY",  risk: "HIGH" },
  { key: "CULT",           label: "Cult / gang violence",           desc: "Cult clash or gang violence",       icon: "people-outline",      color: "#a855f7", domain: "SECURITY",  risk: "HIGH" },
  { key: "SUSPICIOUS",     label: "Suspicious activity / surveillance", desc: "Recon, loitering, something off", icon: "eye-outline",       color: "#14b8a6", domain: "SECURITY",  risk: "MEDIUM" },
  { key: "PROTEST",        label: "Community protest / agitation",  desc: "Demonstration or unrest",           icon: "megaphone-outline",   color: "#3b82f6", domain: "COMMUNITY", risk: "HIGH" },
  { key: "ROADBLOCK",      label: "Restriction of movement / roadblock", desc: "Access blocked or barricaded", icon: "hand-left-outline",   color: "#f59e0b", domain: "COMMUNITY", risk: "HIGH" },
  { key: "OIL_SPILL",      label: "Oil spill / leak",               desc: "Spill, leak or discharge",          icon: "water-outline",       color: "#0ea5e9", domain: "HSE",       risk: "HIGH" },
  { key: "FIRE",           label: "Fire / explosion",               desc: "Fire, blast or explosion",          icon: "flame",               color: "#f97316", domain: "HSE",       risk: "HIGH" },
  { key: "FLOOD",          label: "Flooding / natural hazard",      desc: "Flood or natural hazard",           icon: "rainy-outline",       color: "#0ea5e9", domain: "HSE",       risk: "MEDIUM" },
  { key: "PIRACY",         label: "Piracy / vessel attack",         desc: "Attack on vessel or waterway",      icon: "boat-outline",        color: "#14b8a6", domain: "MARITIME",  risk: "HIGH" },
  { key: "POLITICAL",      label: "Political tension / unrest",     desc: "Political friction or threat",      icon: "flag-outline",        color: "#a855f7", domain: "POLITICAL", risk: "MEDIUM" },
];
