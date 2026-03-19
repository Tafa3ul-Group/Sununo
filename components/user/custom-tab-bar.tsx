import { SolarIcon, SolarIconName } from "@/components/ui/solar-icon";
import { normalize } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/*
 * CustomTabBar - New floating navigation design
 * Height: 50 (Normalized)
 * Left: Map button (circle)
 * Right: Main tabs (capsule)
 */

interface TabProps {
  state: any;
  navigation: any;
}

export const CustomTabBar: React.FC<TabProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Current active route name
  const currentRoute = state.routes[state.index].name;

  const navigateTo = (routeName: string) => {
    if (routeName === "index") {
      router.replace("/(tabs)");
    } else if (routeName === "explore") {
      router.push("/(tabs)/explore");
    } else if (routeName === "(dashboard)/notifications") {
      router.push("/(tabs)/(dashboard)/notifications");
    } else if (routeName === "(dashboard)/home") {
      router.push("/(tabs)/(dashboard)/home");
    } else {
      router.push(routeName as any);
    }
  };

  // Defining the 3 tabs for the capsule
  const tabs = [
    { name: "explore", icon: "heart" as SolarIconName, route: "explore" },
    {
      name: "notifications",
      icon: "bell" as SolarIconName,
      route: "(dashboard)/notifications",
    },
    { name: "home", icon: "home-smile" as SolarIconName, route: "index" },
  ];

  const NAV_HEIGHT = normalize.height(50);

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
      {/* Left: Separate Map Button */}
      <TouchableOpacity
        style={[
          styles.mapButton,
          {
            width: NAV_HEIGHT,
            height: NAV_HEIGHT,
            borderRadius: NAV_HEIGHT / 2,
          },
        ]}
        onPress={() => navigateTo("(dashboard)/home")}
        activeOpacity={0.8}
      >
        <SolarIcon name="map-bold" size={normalize.width(24)} color="white" />
      </TouchableOpacity>

      {/* Right: Main Navigation Capsule */}
      <View
        style={[
          styles.tabCapsule,
          { height: NAV_HEIGHT, borderRadius: NAV_HEIGHT / 2 },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.route;
          const iconSize = normalize.width(22);
          const iconName = isActive
            ? (`${tab.icon}-bold` as SolarIconName)
            : (`${tab.icon}-linear` as SolarIconName);

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigateTo(tab.route)}
              style={[
                styles.tabItem,
                {
                  width: NAV_HEIGHT - 8,
                  height: NAV_HEIGHT - 8,
                  borderRadius: (NAV_HEIGHT - 8) / 2,
                },
                isActive && styles.activeTabItem,
              ]}
              activeOpacity={0.7}
            >
              <SolarIcon
                name={iconName}
                size={iconSize}
                color={isActive ? "#035DF9" : "#ffffffb3"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
  },
  mapButton: {
    backgroundColor: "#035DF9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabCapsule: {
    flexDirection: "row",
    backgroundColor: "#035DF9",
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  activeTabItem: {
    backgroundColor: "white",
  },
});
