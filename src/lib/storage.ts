import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Cross-platform key/value storage. Uses expo-secure-store on native (encrypted),
// and falls back to localStorage on web (SecureStore has no web implementation,
// so calling it in the Expo web preview throws "…is not a function").

const ls = (): Storage | null => {
  try {
    return typeof (globalThis as { localStorage?: Storage }).localStorage !== "undefined"
      ? (globalThis as { localStorage: Storage }).localStorage
      : null;
  } catch {
    return null;
  }
};

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") return ls()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") { ls()?.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") { ls()?.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}
