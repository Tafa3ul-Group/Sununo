import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { RootState } from "@/store";
import { SolarIcon } from "@/components/ui/solar-icon";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { 
  SolarHomeSmileBoldDuotone, 
  SolarBellBingBoldDuotone, 
  SolarHeartBold, 
  SolarMapBoldDuotone 
} from "@/components/icons/solar-icons";

export default function TabLayout() {
  const { t } = useTranslation();
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(customer)"
        options={{
          href: userType === "owner" ? null : "/(tabs)/(customer)",
        }}
      />
      <Tabs.Screen
        name="(dashboard)"
        options={{
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/home",
        }}
      />
    </Tabs>
  );
}
