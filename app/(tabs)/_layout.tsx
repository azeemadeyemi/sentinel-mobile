import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/src/store/auth";
import { colors } from "@/src/constants/theme";

// Simple SVG-free icon components using View shapes
function HomeIcon({ focused }: { focused: boolean }) {
  const c = focused ? colors.primary : colors.textMuted;
  return (
    <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: 18, height: 12, borderWidth: 2, borderColor: c, borderRadius: 3, borderBottomWidth: 0, marginBottom: 1 }} />
      <View style={{ width: 24, height: 2.5, backgroundColor: c, borderRadius: 1 }} />
    </View>
  );
}

function ReportIcon() {
  return (
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.orange,
      alignItems: "center", justifyContent: "center",
      marginBottom: 20,
      shadowColor: colors.orange,
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    }}>
      <View style={{ width: 16, height: 2.5, backgroundColor: "#fff", borderRadius: 2 }} />
      <View style={{ position: "absolute", width: 2.5, height: 16, backgroundColor: "#fff", borderRadius: 2 }} />
    </View>
  );
}

function HistoryIcon({ focused }: { focused: boolean }) {
  const c = focused ? colors.primary : colors.textMuted;
  return (
    <View style={{ width: 24, height: 24, justifyContent: "center", gap: 4 }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{ height: 2, backgroundColor: c, borderRadius: 1, width: i === 0 ? 18 : i === 1 ? 14 : 10 }} />
      ))}
    </View>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const c = focused ? colors.primary : colors.textMuted;
  return (
    <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: c, marginBottom: 2 }} />
      <View style={{ width: 20, height: 8, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 2, borderColor: c, borderBottomWidth: 0 }} />
    </View>
  );
}

function SafetyIcon({ focused }: { focused: boolean }) {
  const c = focused ? "#dc2626" : colors.textMuted;
  return (
    <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
      {/* Shield shape */}
      <View style={{
        width: 18, height: 20,
        borderWidth: 2, borderColor: c,
        borderTopLeftRadius: 4, borderTopRightRadius: 4,
        borderBottomLeftRadius: 9, borderBottomRightRadius: 9,
        alignItems: "center", justifyContent: "center",
      }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      </View>
    </View>
  );
}

import { View } from "react-native";

export default function TabLayout() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user]);

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: () => <ReportIcon />,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700", color: colors.orange },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "My Reports",
          tabBarIcon: ({ focused }) => <HistoryIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: "Safety",
          tabBarIcon: ({ focused }) => <SafetyIcon focused={focused} />,
          tabBarActiveTintColor: "#dc2626",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}
