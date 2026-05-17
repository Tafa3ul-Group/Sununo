import { DashboardTabBar } from "@/components/dashboard/dashboard-tab-bar";
import { SolarWalletMoneyBold, SolarHomeSmileBoldDuotone, SolarClipboardListBold } from "@/components/icons/solar-icons";
import { RootState } from "@/store";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";
import { isRTL } from "@/i18n";

export default function DashboardLayout() {
  const { userType, isAuthenticated, language } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (userType === 'customer') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      tabBar={(props) => <DashboardTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { } }}
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
            <SolarClipboardListBold size={size} color={color} />
          ) }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarWalletMoneyBold size={size} color={color} />
          ) }}
      />
      <Tabs.Screen name="shifts" options={{ href: null }} />
      <Tabs.Screen name="chalet-details" options={{ href: null }} />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
    </Tabs>
  );
}
