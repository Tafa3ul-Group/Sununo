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
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { Colors, isRTL, Shadows, Spacing } from "@/constants/theme";
import { AppButton } from "./app-button";
import { GuestCounter } from "./guest-counter";
import { MainTabs, TabType } from "./MainTabs";
import { RangeCalendar } from "./range-calendar";
import { SolarMagnifierBold, SolarMapPointBold, SolarSunBold, SolarMoonBold, SolarBedBold } from "@/components/icons/solar-icons";
import { useGetCityNamesQuery } from "@/store/api/customerApiSlice";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATIC_CITIES = [
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
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [activeTab, setActiveTab] = useState<TabType>("WHERE");
  const [selectedCity, setSelectedCity] = useState("basra");
  const [searchText, setSearchText] = useState("");
  const [whenStep, setWhenStep] = useState(1); // 1: Calendar, 2: Periods
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);

  // Fetch cities from backend
  const { data: citiesData } = useGetCityNamesQuery(undefined);
  const cities = useMemo(() => {
    if (!citiesData || citiesData.length === 0) return STATIC_CITIES;
    return citiesData.map((city: any) => ({
      id: city.id,
      name: isArabic ? (city.nameAr || city.name) : (city.nameEn || city.name),
    }));
  }, [citiesData, isArabic]);

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
          period: selectedPeriod,
        });
      }
      dismiss();
    }
  }, [activeTab, whenStep, dismiss, onApply, selectedCity, searchText, adults, children, selectedPeriod]);

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
      <View style={[styles.searchBar, isArabic ? styles.ltrRow : styles.rtlRow]}>
        <TextInput
          placeholder="ابحث"
          style={[styles.searchInput, isArabic ? styles.rtlText : styles.ltrText]}
          placeholderTextColor={Colors.text.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        <SolarMagnifierBold size={22} color={Colors.text.muted} />
      </View>

      {cities.filter(city => city.name.includes(searchText)).map((city) => (
        <TouchableOpacity
          key={city.id}
          onPress={() => setSelectedCity(city.id)}
          style={[
            styles.cityItem,
            isArabic ? styles.ltrRow : styles.rtlRow,
            selectedCity === city.id && styles.selectedCityItem,
          ]}
        >
          <ThemedText style={[styles.cityName, isArabic ? styles.rtlText : styles.ltrText]}>{city.name}</ThemedText>
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
        <View style={[styles.guestItem, isArabic ? styles.rtlRow : styles.ltrRow, { justifyContent: "space-between" }]}>
          <View style={[styles.guestInfo, { marginRight: isArabic ? 12 : 0, marginLeft: isArabic ? 0 : 12 }]}>
            <ThemedText style={[styles.guestLabel, isArabic ? styles.rtlText : styles.ltrText]}>البالغين</ThemedText>
            <ThemedText style={[styles.guestSubLabel, isArabic ? styles.rtlText : styles.ltrText]}>18 واكبر</ThemedText>
          </View>
          <GuestCounter
            value={adults}
            onIncrement={() => setAdults(adults + 1)}
            onDecrement={() => setAdults(Math.max(1, adults - 1))}
          />
        </View>

        {/* Children Counter */}
        <View style={[styles.guestItem, isArabic ? styles.rtlRow : styles.ltrRow, { justifyContent: "space-between" }]}>
          <View style={[styles.guestInfo, { marginRight: isArabic ? 12 : 0, marginLeft: isArabic ? 0 : 12 }]}>
            <ThemedText style={[styles.guestLabel, isArabic ? styles.rtlText : styles.ltrText]}>الاطفال</ThemedText>
            <ThemedText style={[styles.guestSubLabel, isArabic ? styles.rtlText : styles.ltrText]}>0 - 18</ThemedText>
          </View>
          <GuestCounter
            value={children}
            onIncrement={() => setChildren(children + 1)}
            onDecrement={() => setChildren(Math.max(0, children - 1))}
          />
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
          contentContainerStyle={[
            styles.scrollContent,
            activeTab === "WHEN" && { paddingTop: 40 },
          ]}
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
    marginVertical: Spacing.md,
    zIndex: 10,
    ...Shadows.medium,
  },
  contentCard: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  tabContent: {
    paddingHorizontal: 24,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: "LamaSans-Regular",
  },
  cityItem: {
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
    fontFamily: "LamaSans-SemiBold",
    color: Colors.text.primary,
    flex: 1,
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
    fontFamily: "LamaSans-SemiBold",
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
    fontFamily: "LamaSans-Bold",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "right",
  },
  guestItem: {
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
    // Removed flex: 1 to allow space-between to push it
  },
  guestLabel: {
    fontSize: 22,
    fontFamily: "LamaSans-Black",
    color: "#1A1A1A",
  },
  guestSubLabel: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 2,
    fontFamily: "LamaSans-Regular",
  },
  // RTL Utilities
  rtlText: { textAlign: "right" },
  ltrText: { textAlign: "left" },
  rtlRow: { flexDirection: "row-reverse" },
  ltrRow: { flexDirection: "row" },
  rtlAlign: { alignItems: "flex-end" },
  ltrAlign: { alignItems: "flex-start" },
});
