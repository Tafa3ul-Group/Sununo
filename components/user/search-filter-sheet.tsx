import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    useBottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    Keyboard,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View } from "react-native";

import { SolarBedBold, SolarMagnifierBold, SolarMapPointBold, SolarMoonBold, SolarSunBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize, Shadows, Spacing } from "@/constants/theme";
import {
    useGetCityNamesQuery,
    useGetCustomerChaletDetailsQuery,
    useGetChaletAvailabilityQuery } from "@/store/api/customerApiSlice";
import { PrimaryButton } from "./primary-button";
import { SecondaryButton } from "./secondary-button";
import { GuestCounter } from "./guest-counter";
import { MainTabs, TabType } from "./MainTabs";
import { RangeCalendar } from "./range-calendar";
import { isRTL } from "@/i18n";

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

interface SearchFilterSheetProps {
  onApply?: (filters: any) => void;
  chaletId?: string;
}

export const SearchFilterSheet = forwardRef<BottomSheetModal, SearchFilterSheetProps>((props, ref) => {
  const { onApply, chaletId } = props;
  const { dismiss } = useBottomSheetModal();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [activeTab, setActiveTab] = useState<TabType>("WHERE");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [whenStep, setWhenStep] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Dynamic layout helper to guarantee perfect RTL/LTR alignment under any system RTL state
  const rowDirection = isArabic ? (isRTL ? "row" : "row-reverse") : (isRTL ? "row-reverse" : "row");
  const textAlignment = isArabic ? "right" : "left";
  const buttonAlign = isArabic
    ? (isRTL ? "flex-end" : "flex-start")
    : (isRTL ? "flex-start" : "flex-end");

  // Fetch chalet details if chaletId is provided
  const { data: chaletDetailsResponse } = useGetCustomerChaletDetailsQuery(chaletId || "", {
    skip: !chaletId
  });
  const chaletDetails = chaletDetailsResponse?.data || chaletDetailsResponse;

  // Fetch chalet availability if chaletId is provided
  const { data: availabilityData = [] } = useGetChaletAvailabilityQuery(
    {
      id: chaletId || "",
      month: currentMonth.getMonth() + 1,
      year: currentMonth.getFullYear()
    },
    { skip: !chaletId }
  );

  // Map availability to fully booked dates (format: YYYY-MM-DD to match RangeCalendar reservedDates)
  const bookedDates = useMemo(() => {
    if (
      !chaletId ||
      !availabilityData ||
      !Array.isArray(availabilityData) ||
      !chaletDetails?.shifts
    )
      return [];

    const dateCounts: Record<number, number> = {};
    const viewedMonth = currentMonth.getMonth();
    const viewedYear = currentMonth.getFullYear();

    availabilityData.forEach((b: any) => {
      const parts = b.bookingDate.split("T")[0].split("-");
      const bYear = parseInt(parts[0], 10);
      const bMonth = parseInt(parts[1], 10) - 1;
      const bDay = parseInt(parts[2], 10);

      if (bMonth === viewedMonth && bYear === viewedYear) {
        dateCounts[bDay] = (dateCounts[bDay] || 0) + 1;
      }
    });

    const totalShifts = chaletDetails.shifts.length;
    if (totalShifts === 0) return [];

    return Object.keys(dateCounts)
      .filter((d) => dateCounts[Number(d)] >= totalShifts)
      .map((d) => `${viewedYear}-${String(viewedMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }, [availabilityData, chaletDetails, currentMonth, chaletId]);

  // Fetch cities from backend
  const { data: citiesData } = useGetCityNamesQuery(undefined);
  const cities = useMemo(() => {
    if (!citiesData || citiesData.length === 0) return STATIC_CITIES;
    return citiesData.map((city: any) => ({
      id: city.id,
      name: isArabic
        ? (city.nameAr || city.arName || city.name)
        : (city.nameEn || city.enName || city.name) }));
  }, [citiesData, isArabic]);

  // The sheet takes 85% of screen height
  const snapPoints = useMemo(() => ["85%"], []);

  const handleNext = useCallback(() => {
    Keyboard.dismiss();
    if (activeTab === "WHERE") {
      setActiveTab("WHEN");
    } else if (activeTab === "WHEN") {
      if (whenStep === 1) {
        setWhenStep(2);
      } else {
        setActiveTab("WHO");
      }
    } else if (activeTab === "WHO") {
      // WHO — apply and close
      if (onApply) {
        onApply({
          cityId: selectedCity || null,
          cityName: selectedCityName || null,
          search: searchText || null,
          checkIn: checkIn ? checkIn.toISOString() : null,
          checkOut: checkOut ? checkOut.toISOString() : null,
          period: selectedPeriod,
          maxGuests: adults,
          adults,
          children: 0 });
      }
      dismiss();
    }
  }, [activeTab, whenStep, dismiss, onApply, selectedCity, selectedCityName, searchText, adults, selectedPeriod, checkIn, checkOut]);

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

  const handleDismiss = useCallback(() => {
    setActiveTab("WHERE");
    setWhenStep(1);
  }, []);

  const renderWhereContent = () => (
    <View style={styles.tabContent}>
      <View style={[styles.searchBar, { flexDirection: rowDirection, alignItems: "center" }]}>
        <SolarMagnifierBold size={22} color={Colors.text.muted} />
        <TextInput
          placeholder={t("searchFilter.search")}
          style={[styles.searchInput, { textAlign: textAlignment }]}
          placeholderTextColor={Colors.text.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {cities.filter((city: any) => city.name.includes(searchText)).map((city: any) => (
        <TouchableOpacity
          key={city.id}
          onPress={() => {
            setSelectedCity(city.id);
            setSelectedCityName(city.name);
          }}
          style={[
            styles.cityItem,
            { flexDirection: rowDirection, alignItems: "center", justifyContent: "flex-start" },
            selectedCity === city.id && styles.selectedCityItem,
          ]}
        >
          <View style={[styles.cityRight, isArabic ? { marginLeft: 8 } : { marginRight: 8 }]}>
            <SolarMapPointBold
              size={24}
              color={Colors.primary}
            />
          </View>
          <ThemedText style={[styles.cityName, { textAlign: textAlignment }]}>{city.name}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWhenCalendarContent = () => (
    <View style={[styles.tabContent, { paddingHorizontal: 12 }]}>
      <RangeCalendar
        onSelect={(start, end) => {
          setCheckIn(start);
          setCheckOut(end);
        }}
        initialStartDate={checkIn ?? undefined}
        initialEndDate={checkOut ?? undefined}
        reservedDates={bookedDates}
      />
      <View style={styles.calendarFooter}>
        <View style={styles.legendWrapper}>
          <View style={styles.legendItem}>
            <ThemedText style={styles.legendText}>{t("searchFilter.endTime")}</ThemedText>
            <View style={[styles.dot, { backgroundColor: "#15AB64" }]} />
          </View>
          <View style={styles.legendItem}>
            <ThemedText style={styles.legendText}>{t("searchFilter.startTime")}</ThemedText>
            <View style={[styles.dot, { backgroundColor: "#035DF9" }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderWhenPeriodsContent = () => {
    // Render dynamic shifts if chaletDetails has shifts defined
    if (chaletDetails?.shifts && chaletDetails.shifts.length > 0) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.periodsContainer}>
            <View style={styles.periodList}>
              {chaletDetails.shifts.map((shift: any) => {
                const shiftName = isRTL
                  ? shift.name?.ar || shift.name
                  : shift.name?.en || shift.name;
                const isSelected = selectedPeriod === shift.id;

                const isMorning = shift.name?.en?.toLowerCase().includes("morning") || shift.name?.ar?.includes("صباح");
                const isEvening = shift.name?.en?.toLowerCase().includes("evening") || shift.name?.ar?.includes("مساء");

                return (
                  <TouchableOpacity
                    key={shift.id}
                    style={[
                      styles.periodItem,
                      { flexDirection: rowDirection, justifyContent: "space-between", alignItems: "center" },
                      isSelected && styles.selectedPeriodItem,
                    ]}
                    onPress={() => setSelectedPeriod(shift.id)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: rowDirection, alignItems: "center", gap: 16, flex: 1 }}>
                      {isMorning ? (
                        <SolarSunBold
                          size={34}
                          color={isSelected ? "#F64200" : Colors.text.muted}
                        />
                      ) : isEvening ? (
                        <SolarMoonBold
                          size={34}
                          color={isSelected ? "#035DF9" : Colors.text.muted}
                        />
                      ) : (
                        <SolarBedBold
                          size={34}
                          color={isSelected ? "#15AB64" : Colors.text.muted}
                        />
                      )}
                      <ThemedText style={[styles.periodLabel, { textAlign: textAlignment }]}>
                        {shiftName}
                      </ThemedText>
                    </View>

                    {/* Radio Button Selector */}
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? "#15AB64" : "#D1D5DB",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "white",
                    }}>
                      {isSelected && (
                        <View style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#15AB64",
                        }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    // Fallback to static periods
    return (
      <View style={styles.tabContent}>
        <View style={styles.periodsContainer}>
          <View style={styles.periodList}>
            <TouchableOpacity
              style={[
                styles.periodItem,
                { flexDirection: rowDirection, justifyContent: "space-between", alignItems: "center" },
                selectedPeriod === "morning" && styles.selectedPeriodItem,
              ]}
              onPress={() => setSelectedPeriod("morning")}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: rowDirection, alignItems: "center", gap: 16, flex: 1 }}>
                <SolarSunBold
                  size={34}
                  color={selectedPeriod === "morning" ? "#F64200" : Colors.text.muted}
                />
                <ThemedText style={[styles.periodLabel, { textAlign: textAlignment }]}>
                  {t("searchFilter.morningShift")}
                </ThemedText>
              </View>
              {/* Radio Button Selector */}
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedPeriod === "morning" ? "#15AB64" : "#D1D5DB",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
              }}>
                {selectedPeriod === "morning" && (
                  <View style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#15AB64",
                  }} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodItem,
                { flexDirection: rowDirection, justifyContent: "space-between", alignItems: "center" },
                selectedPeriod === "evening" && styles.selectedPeriodItem,
              ]}
              onPress={() => setSelectedPeriod("evening")}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: rowDirection, alignItems: "center", gap: 16, flex: 1 }}>
                <SolarMoonBold
                  size={34}
                  color={selectedPeriod === "evening" ? "#035DF9" : Colors.text.muted}
                />
                <ThemedText style={[styles.periodLabel, { textAlign: textAlignment }]}>
                  {t("searchFilter.eveningShift")}
                </ThemedText>
              </View>
              {/* Radio Button Selector */}
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedPeriod === "evening" ? "#15AB64" : "#D1D5DB",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
              }}>
                {selectedPeriod === "evening" && (
                  <View style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#15AB64",
                  }} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodItem,
                { flexDirection: rowDirection, justifyContent: "space-between", alignItems: "center" },
                selectedPeriod === "overnight" && styles.selectedPeriodItem,
              ]}
              onPress={() => setSelectedPeriod("overnight")}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: rowDirection, alignItems: "center", gap: 16, flex: 1 }}>
                <SolarBedBold
                  size={34}
                  color={selectedPeriod === "overnight" ? "#15AB64" : Colors.text.muted}
                />
                <ThemedText style={[styles.periodLabel, { textAlign: textAlignment }]}>
                  {t("searchFilter.overnightShift")}
                </ThemedText>
              </View>
              {/* Radio Button Selector */}
              <View style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedPeriod === "overnight" ? "#15AB64" : "#D1D5DB",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
              }}>
                {selectedPeriod === "overnight" && (
                  <View style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#15AB64",
                  }} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderWhoContent = () => (
    <View style={styles.tabContent}>
      <View style={styles.whoContainer}>
        {/* Adults Counter */}
        <View style={[styles.guestItem, { flexDirection: rowDirection, justifyContent: "space-between" }]}>
          <View style={styles.guestInfo}>
            <ThemedText style={[styles.guestLabel, { textAlign: textAlignment }]}>{t("searchFilter.adults")}</ThemedText>
            <ThemedText style={[styles.guestSubLabel, { textAlign: textAlignment }]}>{t("searchFilter.adultsDesc")}</ThemedText>
          </View>
          <GuestCounter
            value={adults}
            onIncrement={() => setAdults(adults + 1)}
            onDecrement={() => setAdults(Math.max(1, adults - 1))}
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
      onDismiss={handleDismiss}
    >
      {/* Tabs Header - sits at the top of the sheet */}
      <View style={styles.headerWrapper}>
        <MainTabs activeTab={activeTab} onChange={setActiveTab} />
      </View>

      {/* Content Area - White card with rounded corners */}
      <View style={styles.contentCard}>
        {/* Step Indicators (Green Dots) - Visible in WHEN tab */}
        {activeTab === "WHEN" && (
          <View style={[
            styles.stepIndicators,
            {
              flexDirection: rowDirection,
              right: isArabic ? undefined : 24,
              left: isArabic ? 24 : undefined
            }
          ]}>
            <TouchableOpacity
              onPress={() => setWhenStep(1)}
              activeOpacity={0.7}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    whenStep === 1 ? "#15AB64" : "#15AB6433" },
              ]}
            />
            <TouchableOpacity
              onPress={() => setWhenStep(2)}
              activeOpacity={0.7}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    whenStep === 2 ? "#15AB64" : "#15AB6433" },
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
          {activeTab === "WHEN" && whenStep === 2 ? (
            <View style={[styles.periodsActionRow, { flexDirection: rowDirection, marginTop: 8, paddingBottom: 16 }]}>
              <View style={styles.periodsActionItem}>
                <SecondaryButton
                  label={t("searchFilter.editDays")}
                  onPress={() => setWhenStep(1)}
                  isActive={false}
                  style={{ width: "100%", flex: 1 }}
                  inactiveTextColor="#15AB64"
                  variant="inverse"
                />
              </View>
              <View style={styles.periodsActionItem}>
                <SecondaryButton
                  label={t("searchFilter.skipToGuests")}
                  onPress={() => setActiveTab("WHO")}
                  isActive={true}
                  style={{ width: "100%", flex: 1 }}
                  activeColor="#15AB64"
                  variant="default"
                />
              </View>
            </View>
          ) : (
            <PrimaryButton
              label={
                activeTab === "WHEN" && whenStep === 1
                  ? (isArabic ? "تم" : "Done")
                  : activeTab === "WHO"
                    ? t("searchFilter.apply")
                    : t("searchFilter.next")
              }
              onPress={handleNext}
              isActive={true}
              activeColor={activeTab === "WHEN" ? "#15AB64" : activeTab === "WHO" ? "#F64200" : "#035DF9"}
              style={StyleSheet.flatten([styles.nextButton, { alignSelf: buttonAlign }])}
            />
          )}
        </View>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "transparent" },
  headerWrapper: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: Spacing.md,
    zIndex: 10 },
  contentCard: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden" },
  dragHandleContainer: {
    width: "100%",
    height: 32,
    justifyContent: "center",
    alignItems: "center" },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#F0F2F5",
    borderRadius: 2 },
  scrollView: {
    flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 48 },
  tabContent: {
    paddingHorizontal: 24 },
  searchBar: {
    alignItems: "center",
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: "Alexandria-Medium" },
  cityItem: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F0F4FF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent" },
  selectedCityItem: {
    borderColor: Colors.primary,
    backgroundColor: "#E6EFFF" },
  cityName: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginHorizontal: 8 },
  cityRight: {
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.small },
  calendarFooter: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: "flex-start" },
  legendWrapper: {
    flexDirection: "row",
    gap: 12 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8 },
  legendText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1A1A1A" },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9 },
  mainFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    backgroundColor: "white",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F2F5" },
  nextButton: {
    width: "100%",
    height: 52,
    borderRadius: 16 },
  whoContainer: {
    paddingTop: 10 },
  stepIndicators: {
    flexDirection: "row",
    position: "absolute",
    top: 16,
    right: 24,
    gap: 8,
    zIndex: 100 },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7 },
  periodsContainer: {
    paddingTop: 10 },
  periodList: {
    gap: 12 },
  periodItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#F7FCF9",
    borderRadius: 16,
    height: 64,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 16 },
  selectedPeriodItem: {
    borderColor: "#15AB64",
    backgroundColor: "#EEFBF4" },
  periodLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1A1A1A" },
  periodsActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingBottom: 10 },
  periodsActionItem: {
    flex: 1 },
  guestItem: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    minHeight: normalize.height(94) },
  guestInfo: { 
  },
  guestLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1A1A1A" },
  guestSubLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
    fontFamily: "Alexandria-Medium" },
  // RTL Utilities
  rtlText: { textAlign: "right" },
  ltrText: { textAlign: "left" },
  rtlRow: { flexDirection: "row-reverse" },
  ltrRow: { flexDirection: "row" },
  rtlAlign: { alignItems: "flex-end" },
  ltrAlign: { alignItems: "flex-start" } });
