import { DashboardTabBar } from "@/components/dashboard/dashboard-tab-bar";
import { SolarHomeSmileBoldDuotone, SolarNotesBoldDuotone, SolarUserBold } from "@/components/icons/solar-icons";
import { useDirection } from "@/i18n";
import { RootState } from "@/store";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";

export default function DashboardLayout() {
  const { direction } = useDirection();
  const { userType, isAuthenticated, language } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Straight to the tenant section rather than through "/" — that route is the
  // splash screen, and bouncing an owner who just switched modes through it
  // replays the whole animation before landing in the same place.
  if (userType === 'customer') {
    return <Redirect href="/(tabs)/(customer)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <DashboardTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarHomeSmileBoldDuotone size={size} color={color} />
          ) }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarNotesBoldDuotone size={size} color={color} />
          ) }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarUserBold size={size} color={color} />
          ) }}
      />
      <Tabs.Screen name="revenue" options={{ href: null }} />
      <Tabs.Screen name="shifts" options={{ href: null }} />
      <Tabs.Screen name="chalet-details" options={{ href: null }} />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
