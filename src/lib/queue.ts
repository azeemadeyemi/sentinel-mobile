import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

/**
 * Durable outbox for field submissions.
 *
 * Parts of the Delta have no signal at all. Without this, a reporter writes a
 * report, presses submit, and it is gone: the one failure mode that makes
 * people stop trusting the app. With it, the submission is held on the device
 * and sent when a connection returns.
 *
 * Stored as a file rather than in SecureStore, which warns above roughly 2KB
 * per value and could not hold a narrative, let alone the photos the report
 * payload is typed for. Web falls back to localStorage, which is only used by
 * the Expo preview.
 */

const FILE = "renwatch-outbox.json";
const MAX_ITEMS = 100;
const WEB_KEY = "renwatch_outbox";

export type QueueKind = "report" | "sos";

export type QueuedItem = {
  /** Generated on the device before the first attempt, and sent with every
   *  retry so the server can recognise a resend. See the note on duplicates. */
  clientId: string;
  kind: QueueKind;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
};

const dir = () => (FileSystem as unknown as { documentDirectory?: string }).documentDirectory ?? "";
const path = () => `${dir()}${FILE}`;

function newId(): string {
  // Date plus randomness: unique per device without pulling in a uuid package.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readRaw(): Promise<QueuedItem[]> {
  try {
    if (Platform.OS === "web") {
      const s = globalThis.localStorage?.getItem(WEB_KEY);
      return s ? (JSON.parse(s) as QueuedItem[]) : [];
    }
    const info = await FileSystem.getInfoAsync(path());
    if (!info.exists) return [];
    return JSON.parse(await FileSystem.readAsStringAsync(path())) as QueuedItem[];
  } catch {
    // A corrupt outbox must not brick reporting. Start clean rather than throw.
    return [];
  }
}

async function writeRaw(items: QueuedItem[]): Promise<void> {
  const body = JSON.stringify(items);
  try {
    if (Platform.OS === "web") { globalThis.localStorage?.setItem(WEB_KEY, body); return; }
    await FileSystem.writeAsStringAsync(path(), body);
  } catch {
    /* out of space or no permission: nothing useful to do here */
  }
}

/** Oldest first, but SOS ahead of everything. A duress alert waiting behind a
 *  queue of routine reports would defeat the point of having one. */
function ordered(items: QueuedItem[]): QueuedItem[] {
  return [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "sos" ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export async function enqueue(kind: QueueKind, payload: Record<string, unknown>): Promise<QueuedItem> {
  const items = await readRaw();
  const item: QueuedItem = {
    clientId: String(payload.clientId ?? newId()),
    kind, payload, createdAt: new Date().toISOString(), attempts: 0,
  };
  const next = ordered([...items, item]);
  // If the cap is hit, drop the oldest ROUTINE item. An SOS is never discarded
  // to make room for a report.
  while (next.length > MAX_ITEMS) {
    const victim = [...next].reverse().find((i) => i.kind === "report");
    if (!victim) break;
    next.splice(next.indexOf(victim), 1);
  }
  await writeRaw(next);
  return item;
}

export async function queued(): Promise<QueuedItem[]> {
  return ordered(await readRaw());
}

export async function queuedCount(): Promise<number> {
  return (await readRaw()).length;
}

export async function remove(clientId: string): Promise<void> {
  await writeRaw((await readRaw()).filter((i) => i.clientId !== clientId));
}

export async function clearAll(): Promise<void> {
  await writeRaw([]);
}

export type SendResult = "sent" | "retry" | "drop";

/**
 * Attempt every queued item, oldest first with SOS prioritised.
 *
 * `send` returns what should happen to the item:
 *   sent  - the server accepted it; remove
 *   retry - the attempt failed in a way that might succeed later; keep
 *   drop  - the server rejected it permanently; remove rather than retry forever
 *
 * Returns how many were sent, so the caller can tell the user.
 */
export async function flush(
  send: (item: QueuedItem) => Promise<SendResult>,
): Promise<{ sent: number; remaining: number }> {
  const items = ordered(await readRaw());
  if (items.length === 0) return { sent: 0, remaining: 0 };

  let sent = 0;
  const keep: QueuedItem[] = [];

  for (const item of items) {
    let result: SendResult = "retry";
    try { result = await send(item); } catch { result = "retry"; }

    if (result === "sent") { sent += 1; continue; }
    if (result === "drop") continue;

    keep.push({ ...item, attempts: item.attempts + 1 });
    // Stop on the first failure: if the network is down, the rest will fail
    // too, and hammering it drains the battery of someone already in a bad spot.
    const idx = items.indexOf(item);
    keep.push(...items.slice(idx + 1));
    break;
  }

  await writeRaw(keep);
  return { sent, remaining: keep.length };
}
