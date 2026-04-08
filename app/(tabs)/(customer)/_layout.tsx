import { Tabs, Redirect } from "expo-router";
import React from "react";
import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { SolarIcon } from "@/components/ui/solar-icon";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);

  if (userType === 'owner') {
    return <Redirect href="/(tabs)/(dashboard)/home" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="map-point-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="heart-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="bell-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
