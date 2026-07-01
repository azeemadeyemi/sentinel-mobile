import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { AuthContext, AuthUser, TOKEN_KEY, USER_KEY } from "@/src/store/auth";
import { colors } from "@/src/constants/theme";

export default function RootLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [user,  setUser]  = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const t = await SecureStore.getItemAsync(TOKEN_KEY);
        const u = await SecureStore.getItemAsync(USER_KEY);
        if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      } catch {}
      setReady(true);
    }
    restore();
  }, []);

  async function signIn(t: string, u: AuthUser) {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    setToken(t); setUser(u);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null); setUser(null);
  }

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut }}>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="confirm" options={{ presentation: "modal" }} />
      </Stack>
    </AuthContext.Provider>
  );
}
