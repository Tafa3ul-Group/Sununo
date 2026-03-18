import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, isRTL, Shadows, Spacing } from "@/constants/theme";
import { AppButton } from "./app-button";
import { MainTabs, TabType } from "./MainTabs";
import { RangeCalendar } from "./range-calendar";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CITIES = [
  { id: "basra", name: "البصرة", icon: "map" },
  { id: "baghdad", name: "بغداد", icon: "map" },
  { id: "erbil", name: "اربيل", icon: "map" },
  { id: "duhok", name: "دهوك", icon: "map" },
];

export const SearchFilterSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const [activeTab, setActiveTab] = useState<TabType>("WHERE");
  const [selectedCity, setSelectedCity] = useState("basra");

  const snapPoints = useMemo(() => ["95%"], []);

  const handleNext = useCallback(() => {
    if (activeTab === "WHERE") setActiveTab("WHEN");
    else if (activeTab === "WHEN") setActiveTab("WHO");
    else {
      // Completed search
    }
  }, [activeTab]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsAt={-1}
      appearsAt={0}
      opacity={0.3}
      enableTouchThrough={false}
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "rgba(17, 24, 39, 0.4)" },
      ]}
    />
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "transparent" }}
      handleComponent={null}
      enablePanDownToClose={true}
    >
      <BottomSheetView style={styles.container}>
        <View style={{ flex: 1 }} />

        <View style={styles.headerWrapper}>
          <MainTabs activeTab={activeTab} onChange={setActiveTab} />
        </View>

        <View style={[styles.contentCard, Shadows.large]}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.innerContent}>
            {activeTab === "WHERE" ? (
              <View style={{ flex: 1 }}>
                <View style={styles.searchBar}>
                  <TextInput
                    placeholder="ابحث"
                    style={styles.searchInput}
                    placeholderTextColor={Colors.text.muted}
                  />
                  <Ionicons
                    name="search-outline"
                    size={22}
                    color={Colors.text.muted}
                  />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: Spacing.xl }}
                >
                  {CITIES.map((city) => (
                    <TouchableOpacity
                      key={city.id}
                      onPress={() => setSelectedCity(city.id)}
                      style={[
                        styles.cityItem,
                        selectedCity === city.id && styles.selectedCityItem,
                      ]}
                    >
                      <ThemedText style={styles.cityName}>
                        {city.name}
                      </ThemedText>
                      <View style={styles.cityRight}>
                        <MaterialCommunityIcons
                          name="map-outline"
                          size={24}
                          color={Colors.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : activeTab === "WHEN" ? (
              <View style={{ flex: 1 }}>
                <RangeCalendar />
                <View style={styles.calendarFooter}>
                  <View style={styles.legendWrapper}>
                    <View style={styles.legendItem}>
                      <ThemedText style={styles.legendText}>
                        وقت النهاية
                      </ThemedText>
                      <View
                        style={[styles.dot, { backgroundColor: "#15AB64" }]}
                      />
                    </View>
                    <View style={styles.legendItem}>
                      <ThemedText style={styles.legendText}>
                        وقت البداية
                      </ThemedText>
                      <View
                        style={[styles.dot, { backgroundColor: "#035DF9" }]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.whoContainer}>
                <View style={styles.searchBar}>
                  <TextInput
                    placeholder="منو؟ (عدد الأشخاص)"
                    style={styles.searchInput}
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="numeric"
                  />
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={24}
                    color={Colors.text.muted}
                  />
                </View>
                <ThemedText
                  style={{
                    textAlign: "right",
                    marginTop: Spacing.md,
                    paddingHorizontal: 24,
                  }}
                >
                  حدد عدد الضيوف للحصول على نتائج أدق
                </ThemedText>
              </View>
            )}
          </View>

          {/* Fixed Footer for Next Button at the very bottom of the card */}
          <View style={styles.mainFooter}>
            <AppButton
              label={activeTab === "WHO" ? "بحث" : "التالية"}
              onPress={handleNext}
              isActive={true}
              activeColor="#15AB64"
              style={styles.nextButton}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  headerWrapper: {
    marginBottom: 16,
    alignItems: "center",
    zIndex: 10,
    ...Shadows.medium,
  },
  contentCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: SCREEN_HEIGHT * 0.75,
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  dragHandleContainer: {
    width: "100%",
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#F0F2F5",
    borderRadius: 2,
  },
  innerContent: {
    flex: 1,
  },
  searchBar: {
    flexDirection: isRTL ? "row" : "row-reverse",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    marginHorizontal: 24,
  },
  searchInput: {
    flex: 1,
    textAlign: isRTL ? "right" : "left",
    fontSize: 16,
    color: Colors.text.primary,
  },
  cityItem: {
    flexDirection: isRTL ? "row" : "row-reverse",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#F0F4FF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedCityItem: {
    borderColor: Colors.primary,
    backgroundColor: "#E6EFFF",
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
    textAlign: isRTL ? "right" : "left",
    marginHorizontal: 8,
  },
  cityRight: {
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small,
  },
  calendarFooter: {
    marginTop: 10, // 10px gap between calendar and legends
    paddingHorizontal: 24,
    alignItems: "flex-end",
  },
  legendWrapper: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  mainFooter: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    marginTop: 10,
    justifyContent: "center", // Center child vertically
    alignItems: "flex-start", // Button on the left
  },
  nextButton: {
    width: 100,
    height: 32,
  },
  whoContainer: {
    flex: 1,
    paddingTop: 10,
  },
});
