import { Tabs, Redirect } from "expo-router";
import React from "react";
import { DashboardTabBar } from "@/components/dashboard/dashboard-tab-bar";
import { SolarIcon } from "@/components/ui/solar-icon";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { userType, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/choose-type" />;
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
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="home-2-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="notes-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="banknote-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="shifts" options={{ href: null }} />
      <Tabs.Screen name="add-chalet" options={{ href: null }} />
      <Tabs.Screen name="edit-chalet" options={{ href: null }} />
      <Tabs.Screen name="chalet-details" options={{ href: null }} />
      <Tabs.Screen name="transactions" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
    </Tabs>
  );
}
