// @@iconify-code-gen
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { normalize } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SolarIcon } from "@/components/ui/solar-icon";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);

  const isOwner = userType === "owner";

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
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          href: userType === "owner" ? null : "/(tabs)",
          tabBarIcon: ({ color, focused }) => (
            <SolarIcon
              size={normalize.width(22)}
              name={focused ? "home-smile-bold" : "home-smile-linear"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/home"
        options={{
          title: userType === "owner" ? t("tabs.home") : t("tabs.myChalets"),
          href: userType === "owner" ? "/(tabs)/(dashboard)/home" : null,
          tabBarIcon: ({ color, focused }) => (
            <SolarIcon
              size={normalize.width(22)}
              name={focused ? "map-bold" : "map-linear"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/bookings"
        options={{
          title: t("tabs.bookings"),
          href: userType === "owner" ? "/(tabs)/(dashboard)/bookings" : null,
          tabBarIcon: ({ color, focused }) => (
            <SolarIcon
              size={normalize.width(22)}
              name={focused ? "bell-bold" : "bell-linear"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/customers"
        options={{
          title: t("tabs.customers"),
          href: userType === "owner" ? "/(tabs)/(dashboard)/customers" : null,
          tabBarIcon: ({ color, focused }) => (
            <SolarIcon
              size={normalize.width(22)}
              name={focused ? "bell-bold" : "bell-linear"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/revenue"
        options={{
          title: t("tabs.revenue"),
          href: userType === "owner" ? "/(tabs)/(dashboard)/revenue" : null,
          tabBarIcon: ({ color, focused }) => (
            <SolarIcon
              size={normalize.width(22)}
              name={focused ? "heart-bold" : "heart-linear"}
              color={color}
            />
          ),
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
        name="(dashboard)/chalet-details"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="(dashboard)/add-chalet"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="(dashboard)/edit-chalet"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="(dashboard)/calendar"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.profileIconContainer,
                focused && styles.focusedProfile,
              ]}
            >
              <Image
                source={getImageSrc("https://i.pravatar.cc/100")}
                style={styles.profileImage}
              />
            </View>
          ),
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
