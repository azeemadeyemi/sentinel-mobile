import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getItem, setItem, deleteItem } from "@/src/lib/storage";
import { registerForPush } from "@/src/lib/push";
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
