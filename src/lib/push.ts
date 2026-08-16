import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { getItem } from "@/src/lib/storage";

const BASE_URL = (Constants.expoConfig?.extra?.API_BASE_URL as string) ?? "http://localhost:3001";

// Show advisories as a banner + sound even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask for permission, get the Expo push token, and register it with the backend
// so advisories reach this device even when the app is closed. Best-effort:
// never throws. NOTE: remote push requires a development/production build —
// Expo Go (SDK 53+) does not deliver remote notifications.
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulators/emulators can't get a token

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Advisories",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22c55e",
      });
    }

    const projectId =
      (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    const authToken = await getItem("sentinel_token");
    if (!authToken || !pushToken) return;

    await fetch(`${BASE_URL}/api/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
    });
  } catch (e) {
    console.warn("[push] register failed", e);
  }
}
