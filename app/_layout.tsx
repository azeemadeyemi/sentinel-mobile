import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getItem, setItem, deleteItem } from "@/src/lib/storage";
import { registerForPush } from "@/src/lib/push";
import { flushOutbox } from "@/src/api/client";
import { AuthContext, AuthUser, TOKEN_KEY, USER_KEY } from "@/src/store/auth";
import { colors } from "@/src/constants/theme";

export default function RootLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [user,  setUser]  = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const t = await getItem(TOKEN_KEY);
        const u = await getItem(USER_KEY);
        if (t && u) { setToken(t); setUser(JSON.parse(u)); registerForPush(); }
      } catch {}
      setReady(true);
    }
    restore();
  }, []);

  // Drain the outbox whenever the app is in use: on sign-in, on return to the
  // foreground, and periodically while open. A queued report that only sends
  // when the reporter happens to file another one is barely a queue at all.
  const flushing = useRef(false);
  useEffect(() => {
    if (!token) return;
    const run = async () => {
      if (flushing.current) return;
      flushing.current = true;
      try { await flushOutbox(); } catch {} finally { flushing.current = false; }
    };
    run();
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") run(); });
    const timer = setInterval(run, 60_000);
    return () => { sub.remove(); clearInterval(timer); };
  }, [token]);

  async function signIn(t: string, u: AuthUser) {
    await setItem(TOKEN_KEY, t);
    await setItem(USER_KEY, JSON.stringify(u));
    setToken(t); setUser(u);
    registerForPush();
  }

  async function signOut() {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
    await deleteItem("sentinel_refresh");
    setToken(null); setUser(null);
  }

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#07120c" } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="confirm" options={{ presentation: "modal" }} />
      </Stack>
    </AuthContext.Provider>
  );
}
