import React from 'react';
import { normalize, Spacing } from "@/constants/theme";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get("window");

interface Tab {
  id: string;
  label: string;
  color: string;
}

interface AdvancedSegmentTabProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * AdvancedSegmentTab - A segment picker with custom colors for each tab.
 * Matches the "وين / شوكت / منو" design.
 */
export function AdvancedSegmentTab({
  tabs,
  activeTab,
  onTabChange,
}: AdvancedSegmentTabProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[styles.tab, isActive && { backgroundColor: tab.color }]}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  isActive ? styles.activeLabel : { color: tab.color , fontFamily: "Alexandria-Regular" },
                ]}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.md,
  },
  tabBar: {
    flexDirection: "row-reverse", // RTL
    backgroundColor: "white",
    borderRadius: normalize.radius(35),
    padding: 6,
    height: normalize.height(64),
    // Multi-edge shadow/border effect from image
    borderWidth: 1.5,
    borderColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: normalize.radius(30),
  },
  tabLabel: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Bold",
  },
  activeLabel: {
    color: "white",
   fontFamily: "Alexandria-Regular" },
});
