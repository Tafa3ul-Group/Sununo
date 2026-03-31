// @@iconify-code-gen
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { normalize } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
import { SolarIcon } from "@/components/ui/solar-icon";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: "#2B66FF",
        tabBarInactiveTintColor: "#717171",
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          display: "none", // Standard bar is hidden as we use absolute positioning in CustomTabBar
        },
      }}
    >
      {/* CUSTOMER TABS */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.explore"),
          href: userType === "owner" ? null : "/(tabs)",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="globus-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t("tabs.bookings"),
          href: userType === "owner" ? null : "/(tabs)/bookings",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="calendar-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t("tabs.favorites"),
          href: userType === "owner" ? null : "/(tabs)/favorites",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="heart-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          href: userType === "owner" ? null : "/(tabs)/profile",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="user-linear" size={size} color={color} />
          ),
        }}
      />

      {/* DASHBOARD TABS (OWNER ONLY) */}
      <Tabs.Screen
        name="(dashboard)/home"
        options={{
          title: t("tabs.dashboard"),
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/home",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="home-2-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(dashboard)/bookings"
        options={{
          title: t("tabs.bookings"),
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/bookings",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="notes-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(dashboard)/revenue"
        options={{
          title: isRTL ? 'الأرباح' : 'Revenue',
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/revenue",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="banknote-linear" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(dashboard)/provider-profile"
        options={{
          title: t("tabs.profile"),
          href: userType === "customer" ? null : "/(tabs)/(dashboard)/provider-profile",
          tabBarIcon: ({ color, size }) => (
            <SolarIcon name="settings-linear" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/shifts"
        options={{
          href: null,
          title: isRTL ? 'الفترات والأسعار' : 'Shifts & Prices',
        }}
      />

      <Tabs.Screen
        name="(dashboard)/add-chalet"
        options={{
          href: null,
          title: t("tabs.addChalet"),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/customers"
        options={{
          href: null,
          title: t("tabs.customers"),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/notifications"
        options={{
          href: null,
          title: t("notifications.title"),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/edit-chalet"
        options={{
          href: null,
          title: isRTL ? 'تعديل الشاليه' : 'Edit Chalet',
        }}
      />

      <Tabs.Screen
        name="(dashboard)/chalet-details"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="(dashboard)/transactions"
        options={{
          href: null,
          title: isRTL ? 'سجل المعاملات' : 'Transactions',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileIconContainer: {
    width: normalize.width(24),
    height: normalize.width(24),
    borderRadius: normalize.radius(12),
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
  },
  focusedProfile: {
    borderColor: "#2B66FF",
    borderWidth: 1.5,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
});
