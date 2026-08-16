import Constants from "expo-constants";
import { getItem } from "@/src/lib/storage";

const BASE_URL = (Constants.expoConfig?.extra?.API_BASE_URL as string) ?? "http://localhost:3001";
const MOCK     = (Constants.expoConfig?.extra?.MOCK_MODE as boolean) ?? true;

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: "reporter-001",
  name: "John Doe",
  email: "john.doe@renaissance.com",
  role: "REPORTER",
};

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
  incidentType?: string;   // the specific category picked (e.g. "Illegal bunkering")
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
  const token = await getItem("sentinel_token");
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
  location?: string | null;   // reverse-geocoded address for a human-readable place
  reporterName?: string;
  reporterContact?: string;
};

export async function sendSOSAlert(payload: SOSPayload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { incidentRef: "INC-2026-SOS-" + Date.now().toString().slice(-4), dispatched: true };
  }
  const token = await getItem("sentinel_token");
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

// ── Advisories — control-room broadcasts ──────────────────────────────────────

export type Advisory = {
  id: string;
  severity: string;   // INFO | WARNING | CRITICAL
  title: string;
  message: string;
  hub: string;
  area: string | null;
  issuedBy: string;
  issuedAt: string;
  validUntil: string | null;
  active: boolean;
};

export async function getAdvisories(hub?: string): Promise<Advisory[]> {
  const params = hub ? `?hub=${encodeURIComponent(hub)}` : "";
  const token = await getItem("sentinel_token");
  const res = await fetch(`${BASE_URL}/api/advisories/active${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load advisories");
  return (data.advisories ?? []) as Advisory[];
}
