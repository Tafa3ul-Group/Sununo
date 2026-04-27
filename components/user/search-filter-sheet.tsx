import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetModal,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, isRTL, Shadows, Spacing } from "@/constants/theme";
import { AppButton } from "./app-button";
import { GuestCounter } from "./guest-counter";
import { MainTabs, TabType } from "./MainTabs";
import { RangeCalendar } from "./range-calendar";
import { SolarMagnifierBold, SolarMapPointBold, SolarSunBold, SolarMoonBold, SolarBedBold, SolarIcon } from "@/components/icons/solar-icons";
import { useGetCityNamesQuery } from "@/store/api/customerApiSlice";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const CITIES = [
  { id: "basra", name: "البصرة", icon: "map" },
  { id: "baghdad", name: "بغداد", icon: "map" },
  { id: "erbil", name: "اربيل", icon: "map" },
  { id: "duhok", name: "دهوك", icon: "map" },
  { id: "dhiqar", name: "ذي قار", icon: "map" },
  { id: "najaf", name: "النجف", icon: "map" },
  { id: "karbala", name: "كربلاء", icon: "map" },
  { id: "babylon", name: "بابل", icon: "map" },
];

export const SearchFilterSheet = forwardRef<BottomSheetModal, { onApply?: (filters: any) => void }>((props, ref) => {
  const { onApply } = props;
  const { dismiss } = useBottomSheetModal();
  const [activeTab, setActiveTab] = useState<TabType>("WHERE");
  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [whenStep, setWhenStep] = useState(1); // 1: Calendar, 2: Periods
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);

  // Fetch cities from backend
  const { data: citiesData, isLoading: citiesLoading } = useGetCityNamesQuery(undefined);
  const cities = useMemo(() => {
    if (!citiesData) return [];
    return citiesData.map((city: any) => ({
      id: city.id,
      name: isRTL ? (city.nameAr || city.name) : (city.nameEn || city.name),
    }));
  }, [citiesData, isRTL]);

  // Update selected city once data is loaded if not set
  React.useEffect(() => {
    if (cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0].id);
    }
  }, [cities, selectedCity]);

  // The sheet takes 85% of screen height
  const snapPoints = useMemo(() => ["85%"], []);

  const handleNext = useCallback(() => {
    Keyboard.dismiss();
    if (activeTab === "WHERE") {
      setActiveTab("WHEN");
      setWhenStep(1);
    } else if (activeTab === "WHEN") {
      if (whenStep === 1) {
        setWhenStep(2);
      } else {
        setActiveTab("WHO");
      }
    } else {
      if (onApply) {
        onApply({
          cityId: selectedCity,
          search: searchText,
          maxGuests: adults + children,
        });
      }
      dismiss();
    }
  }, [activeTab, whenStep, dismiss, onApply, selectedCity, searchText, adults, children]);

  const renderBackdrop = useCallback(
    (backdropProps: any) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderWhereContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="ابحث"
          style={styles.searchInput}
          placeholderTextColor={Colors.text.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        <SolarMagnifierBold size={22} color={Colors.text.muted} />
      </View>

      {cities.map((city) => (
        <TouchableOpacity
          key={city.id}
          onPress={() => setSelectedCity(city.id)}
          style={[
            styles.cityItem,
            selectedCity === city.id && styles.selectedCityItem,
          ]}
        >
          <ThemedText style={styles.cityName}>{city.name}</ThemedText>
          <View style={styles.cityRight}>
            <SolarMapPointBold
              size={24}
              color={Colors.primary}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWhenCalendarContent = () => (
    <View style={styles.tabContent}>
      <RangeCalendar />
      <View style={styles.calendarFooter}>
        <View style={styles.legendWrapper}>
          <View style={styles.legendItem}>
            <ThemedText style={styles.legendText}>وقت النهاية</ThemedText>
            <View style={[styles.dot, { backgroundColor: "#15AB64" }]} />
          </View>
          <View style={styles.legendItem}>
            <ThemedText style={styles.legendText}>وقت البداية</ThemedText>
            <View style={[styles.dot, { backgroundColor: "#035DF9" }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderWhenPeriodsContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.periodsContainer}>
        {/* Sub-tabs: Period / Custom Hours */}
        <View style={styles.subTabsContainer}>
          <TouchableOpacity style={styles.subTabItem}>
            <ThemedText style={styles.subTabTextInactive}>
              ساعات مخصصة
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.subTabDivider} />
          <TouchableOpacity
            style={[styles.subTabItem, styles.subTabItemActive]}
          >
            <ThemedText style={styles.subTabTextActive}>فترة</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Period List */}
        <View style={styles.periodList}>
          <TouchableOpacity
            style={[
              styles.periodItem,
              selectedPeriod === "morning" && styles.selectedPeriodItem,
            ]}
            onPress={() => setSelectedPeriod("morning")}
          >
            <SolarSunBold
              size={34}
              color={selectedPeriod === "morning" ? "#F64200" : Colors.text.muted}
            />
            <ThemedText style={styles.periodLabel}>
              الفترة الصباحية
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodItem,
              selectedPeriod === "evening" && styles.selectedPeriodItem,
            ]}
            onPress={() => setSelectedPeriod("evening")}
          >
            <SolarMoonBold
              size={34}
              color={selectedPeriod === "evening" ? "#035DF9" : Colors.text.muted}
            />
            <ThemedText style={styles.periodLabel}>
              الفترة المسائية
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodItem,
              selectedPeriod === "overnight" && styles.selectedPeriodItem,
            ]}
            onPress={() => setSelectedPeriod("overnight")}
          >
            <SolarBedBold
              size={34}
              color={selectedPeriod === "overnight" ? "#15AB64" : Colors.text.muted}
            />
            <ThemedText style={styles.periodLabel}>المبيت</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderWhoContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.whoContainer}>
        {/* Adults Counter */}
        <View style={styles.guestItem}>
          <GuestCounter
            value={adults}
            onIncrement={() => setAdults(adults + 1)}
            onDecrement={() => setAdults(Math.max(1, adults - 1))}
          />
          <View style={styles.guestInfo}>
            <ThemedText style={styles.guestLabel}>البالغين</ThemedText>
            <ThemedText style={styles.guestSubLabel}>18 واكبر</ThemedText>
          </View>
        </View>

        {/* Children Counter */}
        <View style={styles.guestItem}>
          <GuestCounter
            value={children}
            onIncrement={() => setChildren(children + 1)}
            onDecrement={() => setChildren(Math.max(0, children - 1))}
          />
          <View style={styles.guestInfo}>
            <ThemedText style={styles.guestLabel}>الاطفال</ThemedText>
            <ThemedText style={styles.guestSubLabel}>0 - 18</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (activeTab === "WHERE") return renderWhereContent();
    if (activeTab === "WHEN") {
      return whenStep === 1
        ? renderWhenCalendarContent()
        : renderWhenPeriodsContent();
    }
    return renderWhoContent();
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleComponent={() => null}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/* Tabs Header - sits at the top of the sheet */}
      <View style={styles.headerWrapper}>
        <MainTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>

      {/* Content Area - White card with rounded corners */}
      <View style={styles.contentCard}>
        {/* Step Indicators (Green Dots) - Visible in WHEN tab */}
        {activeTab === "WHEN" && (
          <View style={styles.stepIndicators}>
            <TouchableOpacity
              onPress={() => setWhenStep(2)}
              activeOpacity={0.7}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    whenStep === 2 ? "#15AB64" : "#15AB6433",
                },
              ]}
            />
            <TouchableOpacity
              onPress={() => setWhenStep(1)}
              activeOpacity={0.7}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    whenStep === 1 ? "#15AB64" : "#15AB6433",
                },
              ]}
            />
          </View>
        )}

        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* Scrollable inner content */}
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </BottomSheetScrollView>

        {/* Fixed Footer Button */}
        <View style={styles.mainFooter}>
          <AppButton
            label={activeTab === "WHO" ? "بحث" : "التالية"}
            onPress={handleNext}
            isActive={true}
            activeColor={activeTab === "WHO" ? "#F64200" : "#15AB64"}
            style={styles.nextButton}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "transparent",
  },
  headerWrapper: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: Spacing.md, // Clear spacing above and below tabs
    zIndex: 10,
    ...Shadows.medium,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
    // Removed negative margin to prevent "stiched" look
  },
  dragHandleContainer: {
    width: "100%",
    height: 32, // Slightly taller for more breathing room
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#F0F2F5",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24, // Added more bottom padding for better scroll end
  },
  tabContent: {
    paddingHorizontal: 24,
  },
  searchBar: {
    flexDirection: isRTL ? "row" : "row-reverse",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    textAlign: isRTL ? "right" : "left",
    fontSize: 16,
    color: Colors.text.primary,
   fontFamily: "Alexandria-Regular" },
  cityItem: {
    flexDirection: isRTL ? "row" : "row-reverse",
    alignItems: "center",
    padding: 12,
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
    fontFamily: "Alexandria-SemiBold",
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
    marginTop: 10,
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
    fontFamily: "Alexandria-SemiBold",
    color: "#1A1A1A",
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  mainFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    backgroundColor: "white",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F2F5",
  },
  nextButton: {
    width: 100,
    height: 36,
  },
  whoContainer: {
    paddingTop: 10,
  },
  stepIndicators: {
    flexDirection: "row",
    position: "absolute",
    top: 16,
    right: 24,
    gap: 8,
    zIndex: 100,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  periodsContainer: {
    paddingTop: 10,
  },
  subTabsContainer: {
    flexDirection: "row-reverse",
    backgroundColor: "#F8F9FB",
    borderRadius: 20,
    height: 56,
    padding: 4,
    marginBottom: 24,
  },
  subTabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  subTabItemActive: {
    backgroundColor: "white",
    ...Shadows.small,
  },
  subTabDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
  },
  subTabTextActive: {
    fontSize: 18,
    fontFamily: "Alexandria-Bold",
    color: "#1A1A1A",
  },
  subTabTextInactive: {
    fontSize: 18,
    fontFamily: "Alexandria-Medium",
    color: "#717171",
  },
  periodList: {
    gap: 12,
  },
  periodItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#F7FCF9",
    borderRadius: 16,
    height: 64,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 16,
  },
  selectedPeriodItem: {
    borderColor: "#15AB64",
    backgroundColor: "white",
  },
  periodLabel: {
    fontSize: 18,
    fontFamily: "Alexandria-Bold",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "right",
  },
  guestItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    height: 94,
    ...Shadows.small,
  },
  guestInfo: {
    flex: 1,
    marginRight: 12,
  },
  guestLabel: {
    fontSize: 22,
    fontFamily: "Alexandria-Black",
    color: "#1A1A1A",
    textAlign: "right",
  },
  guestSubLabel: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 2,
   fontFamily: "Alexandria-Regular" },
});
