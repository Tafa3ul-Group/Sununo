import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { RootState } from "@/store";
import { SolarIcon } from "@/components/ui/solar-icon";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

export default function TabLayout() {
  const { t } = useTranslation();
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: "#2B66FF",
        tabBarInactiveTintColor: "white",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      {/* CUSTOMER TABS */}
      {/* 1. Map (Isolated Button) */}
      <Tabs.Screen
        name="index"
        options={{
          href: userType === "owner" ? null : "/(tabs)",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="map-point-linear" size={size} color={color} />
          ),
        }}
      />
      
      {/* 2. Main/Home (Inside Capsule) */}
      <Tabs.Screen
        name="profile"
        options={{
          href: userType === "owner" ? null : "/(tabs)/profile",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="home-smile-linear" size={size} color={color} />
          ),
        }}
      />

      {/* 3. Notifications (Inside Capsule) */}
      <Tabs.Screen
        name="bookings"
        options={{
          href: userType === "owner" ? null : "/(tabs)/bookings",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="bell-linear" size={size} color={color} />
          ),
        }}
      />

      {/* 4. Favorites (Inside Capsule) */}
      <Tabs.Screen
        name="favorites"
        options={{
          href: userType === "owner" ? null : "/(tabs)/favorites",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="heart-linear" size={size} color={color} />
          ),
        }}
      />

      {/* DASHBOARD TABS (OWNER ONLY - AS PREVIOUSLY CONFIGURED) */}
      <Tabs.Screen
        name="(dashboard)/home"
        options={{
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/home",
          tabBarIcon: ({ color, size }) => <SolarIcon name="home-2-linear" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(dashboard)/bookings"
        options={{
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/bookings",
          tabBarIcon: ({ color, size }) => <SolarIcon name="notes-linear" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(dashboard)/revenue"
        options={{
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/revenue",
          tabBarIcon: ({ color, size }) => <SolarIcon name="banknote-linear" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(dashboard)/provider-profile"
        options={{
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/provider-profile",
          tabBarIcon: ({ color, size }) => <SolarIcon name="settings-linear" size={size} color={color} />,
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="(dashboard)/shifts" options={{ href: null }} />
      <Tabs.Screen name="(dashboard)/add-chalet" options={{ href: null }} />
      <Tabs.Screen name="(dashboard)/customers" options={{ href: null }} />
      <Tabs.Screen name="(dashboard)/notifications" options={{ href: null }} />
      <Tabs.Screen name="(dashboard)/edit-chalet" options={{ href: null }} />
      <Tabs.Screen name="(dashboard)/chalet-details" options={{ href: null }} />
      <Tabs.Screen name="(dashboard)/transactions" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />

    </Tabs>
  );
}
