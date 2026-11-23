import Constants from "expo-constants";
import { getItem, setItem, deleteItem } from "@/src/lib/storage";
import { enqueue, flush, queuedCount, type QueuedItem, type SendResult } from "@/src/lib/queue";

const BASE_URL = (Constants.expoConfig?.extra?.API_BASE_URL as string) ?? "http://localhost:3001";
const MOCK     = (Constants.expoConfig?.extra?.MOCK_MODE as boolean) ?? true;

const TOKEN_KEY = "sentinel_token";
const REFRESH_KEY = "sentinel_refresh";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: "reporter-001",
  name: "John Doe",
  email: "john.doe@renaissance.com",
  role: "REPORTER",
};

// ── Auth + authenticated fetch ─────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  if (MOCK) {
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
  // Keep the long-lived refresh token so the short-lived access token can be
  // renewed silently (no forced re-login). See authFetch below.
  if (data.refreshToken) await setItem(REFRESH_KEY, data.refreshToken);
  return data as { token: string; user: typeof MOCK_USER };
}

// Exchange the refresh token for a fresh access token; clears both on failure
// (so the app falls back to the login screen on next start).
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { await deleteItem(TOKEN_KEY); await deleteItem(REFRESH_KEY); return null; }
    const data = await res.json();
    if (data?.token) { await setItem(TOKEN_KEY, data.token); return data.token; }
    return null;
  } catch { return null; }
}

// Fetch with the current access token; on a 401 it refreshes once and retries,
// so an expired access token never surfaces as a logout to the user.
async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (t: string | null): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  });
  const token = await getItem(TOKEN_KEY);
  let res = await fetch(`${BASE_URL}${path}`, withAuth(token));
  if (res.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await fetch(`${BASE_URL}${path}`, withAuth(fresh));
  }
  return res;
}

/**
 * Post a field submission, holding it on the device when the network is the
 * problem rather than the submission.
 *
 * The distinction matters. A 4xx means the server understood and refused, so
 * retrying forever would never succeed and would hide a real error from the
 * reporter. A thrown fetch (no signal) or a 5xx might well succeed later, and
 * in the Delta it usually will, so those are queued.
 *
 * Every submission carries a clientId so a resend is recognisable as the same
 * event. See the duplicate note in the queue module.
 */
async function postOrQueue(
  path: string,
  kind: "report" | "sos",
  payload: Record<string, unknown>,
): Promise<{ queued: true } | Record<string, unknown>> {
  const body = { clientId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`, ...payload };
  try {
    const res = await authFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return (await res.json()) as Record<string, unknown>;
    if (res.status >= 500) { await enqueue(kind, body); return { queued: true }; }
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Submission failed");
  } catch (e) {
    // A thrown Error with a message came from the branch above: a real refusal.
    if (e instanceof Error && e.message && e.message !== "Network request failed") throw e;
    await enqueue(kind, body);
    return { queued: true };
  }
}

/** Send everything held on the device. Safe to call often; a no-op when empty. */
export async function flushOutbox(): Promise<{ sent: number; remaining: number }> {
  return flush(async (item: QueuedItem): Promise<SendResult> => {
    const path = item.kind === "sos" ? "/api/incidents/sos" : "/api/incidents/report";
    try {
      const res = await authFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (res.ok) return "sent";
      // Still refused after 10 tries: keeping it forever helps nobody.
      if (res.status < 500) return item.attempts >= 10 ? "drop" : "retry";
      return "retry";
    } catch {
      return "retry";
    }
  });
}

export { queuedCount };

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
    await new Promise(r => setTimeout(r, 1200));
    const seq = Math.floor(Math.random() * 50) + 22;
    return { incidentRef: `INC-2026-${String(seq).padStart(4, "0")}`, id: "mock-id" };
  }
  return postOrQueue("/api/incidents/report", "report", payload as unknown as Record<string, unknown>) as Promise<
    { incidentRef: string; id: string } | { queued: true }
  >;
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
  return postOrQueue("/api/incidents/sos", "sos", {
    ...payload, riskBand: "CRITICAL", domain: "SECURITY", status: "SOS",
  } as unknown as Record<string, unknown>) as Promise<
    { incidentRef: string; dispatched: boolean } | { queued: true }
  >;
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
  const res = await authFetch(`/api/advisories/active${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load advisories");
  return (data.advisories ?? []) as Advisory[];
}
