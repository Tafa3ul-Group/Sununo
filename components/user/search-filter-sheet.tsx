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
import { Colors, Shadows, Spacing } from "@/constants/theme";
import { AppButton } from "./app-button";
import { GuestCounter } from "./guest-counter";
import { MainTabs, TabType } from "./MainTabs";
import { RangeCalendar } from "./range-calendar";
import { SolarMagnifierBold, SolarMapPointBold, SolarSunBold, SolarMoonBold, SolarBedBold } from "@/components/icons/solar-icons";
import { useGetCityNamesQuery } from "@/store/api/customerApiSlice";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const SearchFilterSheet = forwardRef<BottomSheetModal, { onApply?: (filters: any) => void }>((props, ref) => {
  const { onApply } = props;
  const { dismiss } = useBottomSheetModal();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  const [activeTab, setActiveTab] = useState<TabType>("WHERE");
  const [searchText, setSearchText] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [whenStep, setWhenStep] = useState(1); // 1: Calendar, 2: Periods
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);

  const styles = useMemo(() => makeStyles(isRTL), [isRTL]);

  // Fetch cities from backend
  const { data: citiesData } = useGetCityNamesQuery(undefined);
  const cities = useMemo(() => {
    if (!citiesData) return [];
    return citiesData.map((city: any) => ({
      id: city.id,
      name: isRTL ? (city.nameAr || city.name) : (city.nameEn || city.name),
    }));
  }, [citiesData, isRTL]);

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
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  const renderWhereContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchBar}>
        <SolarMagnifierBold size={22} color={Colors.text.muted} />
        <TextInput
          placeholder="ابحث"
          style={styles.searchInput}
          placeholderTextColor={Colors.text.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
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
          <View style={styles.cityRight}>
            <SolarMapPointBold
              size={24}
              color={Colors.primary}
            />
          </View>
          <ThemedText style={styles.cityName}>{city.name}</ThemedText>
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
            <View style={[styles.dot, { backgroundColor: "#15AB64" }]} />
            <ThemedText style={styles.legendText}>متاح</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: "#FF4D4D" }]} />
            <ThemedText style={styles.legendText}>محجوز</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderWhenPeriodsContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.periodsContainer}>
        <ThemedText style={styles.periodsTitle}>اختر الفترة</ThemedText>
        
        {/* Custom Toggle Sub-tabs */}
        <View style={styles.subTabsContainer}>
          <TouchableOpacity style={[styles.subTabItem, styles.subTabItemActive]}>
            <ThemedText style={styles.subTabTextActive}>فترات</ThemedText>
          </TouchableOpacity>
          <View style={styles.subTabDivider} />
          <TouchableOpacity style={styles.subTabItem}>
            <ThemedText style={styles.subTabTextInactive}>ساعات مخصصة</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.periodList}>
          {[
            { id: "morning", name: "صباحية", icon: SolarSunBold, time: "8:00 ص - 12:00 م" },
            { id: "evening", name: "مسائية", icon: SolarMoonBold, time: "2:00 م - 10:00 م" },
            { id: "overnight", name: "مبيت", icon: SolarBedBold, time: "8:00 م - 8:00 ص" },
          ].map((period) => {
            const Icon = period.icon;
            return (
              <TouchableOpacity
                key={period.id}
                onPress={() => setSelectedPeriod(period.id)}
                style={[
                  styles.periodItem,
                  selectedPeriod === period.id && styles.selectedPeriodItem,
                ]}
              >
                <Icon size={24} color={selectedPeriod === period.id ? "#15AB64" : "#6B7280"} />
                <ThemedText style={styles.periodLabel}>{period.name}</ThemedText>
                <ThemedText style={{ color: "#9CA3AF" }}>{period.time}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderWhoContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.whoContainer}>
        {/* Adults Counter */}
        <View style={styles.guestItem}>
          <View style={styles.guestInfo}>
            <ThemedText style={styles.guestLabel}>البالغين</ThemedText>
            <ThemedText style={styles.guestSubLabel}>18 واكبر</ThemedText>
          </View>
          <GuestCounter
            value={adults}
            onIncrement={() => setAdults(adults + 1)}
            onDecrement={() => setAdults(Math.max(1, adults - 1))}
          />
        </View>

        {/* Children Counter */}
        <View style={styles.guestItem}>
          <View style={styles.guestInfo}>
            <ThemedText style={styles.guestLabel}>الاطفال</ThemedText>
            <ThemedText style={styles.guestSubLabel}>0 - 18</ThemedText>
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
      enablePanDownToClose
      handleComponent={() => (
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>
      )}
    >
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <View style={styles.headerWrapper}>
          <MainTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        <BottomSheetScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderContent()}
        </BottomSheetScrollView>

        <View style={styles.mainFooter}>
          <AppButton
            label={activeTab === "WHO" ? "بحث" : "التالية"}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
});

const makeStyles = (isRTL: boolean) => StyleSheet.create({
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
    flexDirection: isRTL ? "row-reverse" : "row",
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
    fontFamily: "Alexandria-Regular",
  },
  cityItem: {
    flexDirection: isRTL ? "row-reverse" : "row",
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
    alignItems: isRTL ? "flex-start" : "flex-end",
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
    marginTop: 24,
    paddingBottom: 20,
  },
  periodsTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Bold",
    color: "#1A1A1A",
    textAlign: isRTL ? "right" : "left",
    marginBottom: 16,
  },
  subTabsContainer: {
    flexDirection: isRTL ? "row-reverse" : "row",
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
    flexDirection: isRTL ? "row-reverse" : "row",
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
    textAlign: isRTL ? "right" : "left",
  },
  guestItem: {
    flexDirection: isRTL ? "row-reverse" : "row",
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
    textAlign: isRTL ? "right" : "left",
  },
  guestSubLabel: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: isRTL ? "right" : "left",
    marginTop: 2,
    fontFamily: "Alexandria-Regular",
  },
});
