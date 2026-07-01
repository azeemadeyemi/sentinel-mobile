import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL = (Constants.expoConfig?.extra?.API_BASE_URL as string) ?? "http://localhost:3001";
const MOCK     = (Constants.expoConfig?.extra?.MOCK_MODE as boolean) ?? true;

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: "reporter-001",
  name: "John Doe",
  email: "john.doe@renaissance.com",
  role: "REPORTER",
};

const MOCK_REPORTS = [
  {
    incidentRef: "INC-2026-0021",
    title: "Armed robbery on Bonny road",
    domain: "SECURITY",
    riskBand: "HIGH",
    status: "OPEN",
    incidentDate: "2026-06-28",
    createdAt: "2026-06-28T14:32:00Z",
  },
  {
    incidentRef: "INC-2026-0019",
    title: "Community protest near Forcados Terminal",
    domain: "COMMUNITY",
    riskBand: "MEDIUM",
    status: "REPORTED",
    incidentDate: "2026-06-25",
    createdAt: "2026-06-25T08:15:00Z",
  },
];

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  if (MOCK) {
    // Mock: accept any non-empty credentials for demo
    if (!email || !password) throw new Error("Invalid credentials");
    return { token: "mock-jwt-token", user: MOCK_USER };
  }
  const res = await fetch(`${BASE_URL}/api/auth/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  return data as { token: string; user: typeof MOCK_USER };
}

// ── Incident reporting ────────────────────────────────────────────────────────

export type ReportPayload = {
  domain: string;
  riskBand: string;
  title: string;
  narrative: string;
  incidentDate: string;
  incidentTime?: string;
  hub: string;
  state?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reporterName?: string | null;
  reporterContact?: string | null;
  photos?: string[];
};

export async function submitReport(payload: ReportPayload) {
  if (MOCK) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));
    const seq = Math.floor(Math.random() * 50) + 22;
    return { incidentRef: `INC-2026-${String(seq).padStart(4, "0")}`, id: "mock-id" };
  }
  const token = await SecureStore.getItemAsync("sentinel_token");
  const res = await fetch(`${BASE_URL}/api/incidents/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Submission failed");
  return data as { incidentRef: string; id: string };
}

// ── SOS emergency alert ───────────────────────────────────────────────────────

export type SOSPayload = {
  latitude?: number | null;
  longitude?: number | null;
  reporterName?: string;
  reporterContact?: string;
};

export async function sendSOSAlert(payload: SOSPayload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { incidentRef: "INC-2026-SOS-" + Date.now().toString().slice(-4), dispatched: true };
  }
  const token = await SecureStore.getItemAsync("sentinel_token");
  const res = await fetch(`${BASE_URL}/api/incidents/sos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...payload, riskBand: "CRITICAL", domain: "SECURITY", status: "SOS" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "SOS dispatch failed");
  return data as { incidentRef: string; dispatched: boolean };
}

// ── Safety scan — nearby incidents ────────────────────────────────────────────

export type NearbyIncident = {
  ref: string;
  title: string;
  dist: string;
  risk: string;
  domain: string;
  age: string;
};

const MOCK_NEARBY: NearbyIncident[] = [
  { ref: "INC-2026-0021", title: "Armed robbery on Bonny-Bodo road",       dist: "1.2 km", risk: "HIGH",     domain: "SECURITY",  age: "2 days ago"  },
  { ref: "INC-2026-0019", title: "Community protest near Rumuola junction", dist: "2.8 km", risk: "MEDIUM",   domain: "COMMUNITY", age: "5 days ago"  },
  { ref: "INC-2026-0014", title: "Pipeline vandalism — Eleme axis",         dist: "4.1 km", risk: "HIGH",     domain: "HSE",       age: "1 week ago"  },
  { ref: "INC-2026-0011", title: "Cult clash — Diobu area",                 dist: "5.5 km", risk: "CRITICAL", domain: "SECURITY",  age: "10 days ago" },
];

export async function getNearbyIncidents(latitude?: number | null, longitude?: number | null) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 700));
    return { incidents: MOCK_NEARBY, safetyScore: 54 };
  }
  const token = await SecureStore.getItemAsync("sentinel_token");
  const params = latitude && longitude ? `?lat=${latitude}&lng=${longitude}&radius=6` : "";
  const res = await fetch(`${BASE_URL}/api/incidents/nearby${params}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Scan failed");
  return data as { incidents: NearbyIncident[]; safetyScore: number };
}

// ── My reports ────────────────────────────────────────────────────────────────

export async function getMyReports() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600));
    return MOCK_REPORTS;
  }
  const token = await SecureStore.getItemAsync("sentinel_token");
  const res = await fetch(`${BASE_URL}/api/incidents/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load reports");
  return data.incidents as typeof MOCK_REPORTS;
}
