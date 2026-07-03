import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/store/auth";
import { useTheme } from "@/src/theme";

export default function TabLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user]);

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bgElev,
          borderTopColor: c.cardLine,
          borderTopWidth: 1,
          height: 74 + insets.bottom,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 10,
        },
        tabBarActiveTintColor: c.green,
        tabBarInactiveTintColor: c.faint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts", tabBarIcon: ({ color }) => <Ionicons name="notifications" size={22} color={color} /> }} />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarLabelStyle: { fontSize: 10, fontWeight: "800", color: c.red },
          tabBarIcon: () => (
            <View style={styles.sosWrap}>
              <View style={[styles.sosCircle, { borderColor: c.bgElev }]}>
                <Ionicons name="warning" size={26} color="#fff" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="advisories" options={{ title: "Advisories", tabBarIcon: ({ color }) => <Ionicons name="megaphone" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />

      {/* Hidden from the tab bar but still navigable via router.push */}
      <Tabs.Screen name="report" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="safety" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sosWrap: { alignItems: "center", justifyContent: "center" },
  sosCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#ef4444",
    alignItems: "center", justifyContent: "center", marginBottom: 22,
    shadowColor: "#ef4444", shadowOpacity: 0.5, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8, borderWidth: 4,
  },
});
