import { Shadows } from "@/constants/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface Category {
  id: string;
  label: string;
  icon: (isActive: boolean) => React.ReactNode;
  activeColor: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: CategoryTabsProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <View
          style={[
            styles.tabsWrapper,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          {categories.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onSelect(cat.id)}
                activeOpacity={0.8}
                style={[
                  styles.tabItem,
                  isActive && { backgroundColor: cat.activeColor },
                ]}
              >
                <View
                  style={[
                    styles.tabContent,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  {cat.icon(isActive)}
                  <ThemedText
                    style={[
                      styles.tabLabel,
                      isActive ? styles.activeLabel : { color: "#64748B" },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingRight: 20,
  },
  tabsWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 6,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    ...Shadows.small,
  },
  tabItem: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
  },
  activeLabel: {
    color: "#FFFFFF",
  },
});
