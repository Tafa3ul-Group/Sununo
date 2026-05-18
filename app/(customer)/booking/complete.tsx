import { HeaderSection } from "@/components/header-section";
import {
  SolarCardBold,
  SolarMapPointBold,
  SolarMoonBold,
  SolarSunBold,
  SolarWalletBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { GuestCounter } from "@/components/user/guest-counter";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { MainTabs, TabType } from "@/components/user/MainTabs";
import { PrimaryButton } from "@/components/user/primary-button";
import { RangeCalendar } from "@/components/user/range-calendar";
import { Colors, normalize } from "@/constants/theme";
import { isRTL } from "@/i18n";
import { RootState } from "@/store";
import {
  useCreateCustomerBookingMutation,
  useGetChaletAvailabilityQuery,
  useGetCustomerChaletDetailsQuery,
  useGetPlatformConfigQuery,
  useLazyGetPaymentStatusQuery,
} from "@/store/api/customerApiSlice";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useFormatTime } from "../../../hooks/useFormatTime";

// dismissAuthSession is iOS-only — Android closes the browser automatically
const dismissBrowser = () => {
  if (Platform.OS === "ios") {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      /* ignore */
    }
  }
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOOKING_TABS: TabType[] = ["WHEN", "WHO", "WHERE"];

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function CompleteBookingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id: chaletIdParam } = useLocalSearchParams();
  const chaletId = chaletIdParam as string;
  const { userType, user } = useSelector((state: RootState) => state.auth);
  const savedFilter = useSelector((state: RootState) => (state as any).filter);

  const [activeTab, setActiveTab] = useState<TabType>("WHEN");
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const { formatShiftTime } = useFormatTime();
  const isArabic = i18n.language === "ar";
  const rowDirection = isArabic
    ? isRTL
      ? "row"
      : "row-reverse"
    : isRTL
      ? "row-reverse"
      : "row";

  // When I18nManager.isRTL is true, React Native natively flips text alignments.
  // "left" renders visually on the right, and "right" renders visually on the left.
  const textStart: "left" | "right" = isArabic === isRTL ? "left" : "right";
  const textEnd: "left" | "right" = isArabic === isRTL ? "right" : "left";

  const getFilterDateRange = (): Date[] => {
    if (!savedFilter?.checkIn) return [];
    const start = new Date(savedFilter.checkIn);
    const end = savedFilter.checkOut ? new Date(savedFilter.checkOut) : start;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

    const timestamps: number[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      timestamps.push(new Date(cur).getTime());
      cur.setDate(cur.getDate() + 1);
    }
    return timestamps.map((time) => new Date(time));
  };

  const filterDateRange = useMemo(getFilterDateRange, [
    savedFilter?.checkIn,
    savedFilter?.checkOut,
  ]);

  const filterDateKeys = useMemo(() => {
    return new Set(filterDateRange.map(getLocalDateKey));
  }, [filterDateRange]);
  const hasFilterDates = filterDateKeys.size > 0;

  const getInitialMonth = () => {
    return filterDateRange[0] ? new Date(filterDateRange[0]) : new Date();
  };

  // Pre-fill dates from filter if available
  const getInitialDates = (): number[] => {
    return filterDateRange.map((date) => date.getDate());
  };

  const [selectedDates, setSelectedDates] = useState<number[]>(getInitialDates);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    filterDateRange[0] ? new Date(filterDateRange[0]) : null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    filterDateRange.length > 1
      ? new Date(filterDateRange[filterDateRange.length - 1])
      : null,
  );
  const selectedDateRange = useMemo(() => {
    if (!selectedStartDate) return [];

    const dates: Date[] = [];
    const cur = new Date(selectedStartDate);
    cur.setHours(0, 0, 0, 0);
    const last = selectedEndDate
      ? new Date(selectedEndDate)
      : new Date(selectedStartDate);
    last.setHours(0, 0, 0, 0);

    while (cur <= last) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return dates;
  }, [selectedEndDate, selectedStartDate]);

  useEffect(() => {
    if (filterDateRange.length === 0) return;

    setSelectedStartDate(new Date(filterDateRange[0]));
    setSelectedEndDate(
      filterDateRange.length > 1
        ? new Date(filterDateRange[filterDateRange.length - 1])
        : null,
    );
    setSelectedDates(filterDateRange.map((date) => date.getDate()));
    setCurrentMonth(new Date(filterDateRange[0]));
  }, [filterDateRange]);

  // Mapping of Day -> Selected Shift ID
  const [selectedShifts, setSelectedShifts] = useState<Record<number, string>>(
    {},
  );

  // API hooks
  const [createBooking, { isLoading: isCreatingBooking }] =
    useCreateCustomerBookingMutation();
  const { data: response } = useGetCustomerChaletDetailsQuery(chaletId, {
    skip: !chaletId,
  });
  const chaletDetails = response?.data || response;

  const filterPeriod = useSelector((state: RootState) => state.filter.period);

  const shiftMatchesFilterPeriod = useCallback(
    (shift: any, period: string | null) => {
      if (!period) return false;
      if (shift.id === period) return true;

      const normalizedPeriod = period.toString().trim().toLowerCase();
      const shiftType = shift.type?.toString().trim().toLowerCase() || "";
      const englishName = shift.name?.en?.toString().toLowerCase() || "";
      const arabicName = shift.name?.ar?.toString() || "";
      const rawName =
        typeof shift.name === "string" ? shift.name.toLowerCase() : "";
      const startHour = Number(shift.startTime?.toString().split(":")[0]);
      const hasStartHour = Number.isFinite(startHour);

      const isMorning =
        shiftType.includes("morning") ||
        shiftType.includes("صباح") ||
        englishName.includes("morning") ||
        rawName.includes("morning") ||
        arabicName.includes("صباح") ||
        (hasStartHour && startHour >= 4 && startHour < 12);
      const isEvening =
        shiftType.includes("evening") ||
        shiftType.includes("مساء") ||
        englishName.includes("evening") ||
        rawName.includes("evening") ||
        arabicName.includes("مساء") ||
        (hasStartHour && startHour >= 12 && startHour < 20);
      const isOvernight =
        shiftType.includes("overnight") ||
        shiftType.includes("night") ||
        shiftType.includes("مبيت") ||
        englishName.includes("overnight") ||
        englishName.includes("night") ||
        rawName.includes("overnight") ||
        rawName.includes("night") ||
        arabicName.includes("مبيت") ||
        arabicName.includes("ليلي") ||
        (hasStartHour && (startHour >= 20 || startHour < 4));

      if (
        ["morning", "am", "صباح", "صباحي", "صباحية"].includes(normalizedPeriod)
      )
        return isMorning;
      if (
        ["evening", "pm", "مساء", "مسائي", "مسائية"].includes(normalizedPeriod)
      )
        return isEvening;
      if (
        ["overnight", "night", "sleep", "مبيت", "ليلي", "ليلية"].includes(
          normalizedPeriod,
        )
      )
        return isOvernight;

      return false;
    },
    [],
  );

  const availableShifts = useMemo(() => {
    if (!chaletDetails?.shifts || chaletDetails.shifts.length === 0) return [];
    return chaletDetails.shifts;
  }, [chaletDetails?.shifts]);

  const filteredSelectedShift = useMemo(() => {
    if (!filterPeriod) return null;
    return (
      availableShifts.find((shift: any) =>
        shiftMatchesFilterPeriod(shift, filterPeriod),
      ) || null
    );
  }, [availableShifts, filterPeriod, shiftMatchesFilterPeriod]);

  // Pre-fill selected shifts from the saved filter when possible.
  useEffect(() => {
    const initialShift =
      filteredSelectedShift ||
      (availableShifts.length === 1 ? availableShifts[0] : null);
    if (initialShift && selectedDates.length > 0) {
      setSelectedShifts((prev) => {
        const next = { ...prev };
        selectedDates.forEach((day) => {
          const currentShift = availableShifts.find(
            (shift: any) => shift.id === next[day],
          );
          const shouldUseFilterShift =
            !!filteredSelectedShift &&
            (!currentShift ||
              !shiftMatchesFilterPeriod(currentShift, filterPeriod));
          if (!next[day] || shouldUseFilterShift) {
            next[day] = initialShift.id;
          }
        });
        return next;
      });
    }
  }, [
    availableShifts,
    filterPeriod,
    filteredSelectedShift,
    selectedDates,
    shiftMatchesFilterPeriod,
  ]);

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth);
  const getDateForDay = useCallback(
    (day: number) =>
      selectedDateRange.find((date) => date.getDate() === day) ||
      filterDateRange.find((date) => date.getDate() === day) ||
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
    [currentMonth, filterDateRange, selectedDateRange],
  );
  const getDayOfWeek = (day: number) => {
    return getDateForDay(day).getDay();
  };

  const { data: availabilityData = [] } = useGetChaletAvailabilityQuery(
    {
      id: chaletId,
      month: currentMonth.getMonth() + 1,
      year: currentMonth.getFullYear(),
    },
    { skip: !chaletId },
  );

  // Map availability to fully booked dates
  const bookedDates = useMemo(() => {
    if (
      !availabilityData ||
      !Array.isArray(availabilityData) ||
      availableShifts.length === 0
    )
      return [];

    const dateCounts: Record<number, number> = {};
    const viewedMonth = currentMonth.getMonth();
    const viewedYear = currentMonth.getFullYear();

    availabilityData.forEach((b: any) => {
      // Expecting YYYY-MM-DD format from backend
      const parts = b.bookingDate.split("T")[0].split("-");
      const bYear = parseInt(parts[0], 10);
      const bMonth = parseInt(parts[1], 10) - 1;
      const bDay = parseInt(parts[2], 10);

      if (bMonth === viewedMonth && bYear === viewedYear) {
        dateCounts[bDay] = (dateCounts[bDay] || 0) + 1;
      }
    });

    const totalShifts = availableShifts.length;
    if (totalShifts === 0) return [];

    return Object.keys(dateCounts)
      .filter((d) => dateCounts[Number(d)] >= totalShifts)
      .map(Number);
  }, [availabilityData, availableShifts, currentMonth]);

  const bookedDateStrings = useMemo(
    () =>
      bookedDates.map((day) =>
        getLocalDateKey(
          new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
        ),
      ),
    [bookedDates, currentMonth],
  );

  // Success Sheet Ref
  const successSheetRef = React.useRef<BottomSheetModal>(null);
  const calendarSheetRef = React.useRef<BottomSheetModal>(null);

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Card Details State
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<
    "sindi_pay" | "wayl" | "wallet"
  >("wayl");

  const { data: platformConfig } = useGetPlatformConfigQuery({});
  const [cardName, setCardName] = useState("");
  const [notes, setNotes] = useState("");

  const [adultCount, setAdultCount] = useState(savedFilter?.adults ?? 2);
  const [childrenCount, setChildrenCount] = useState(
    savedFilter?.children ?? 0,
  );

  // Payment status polling
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<
    "pending" | "success" | "failed" | "timeout"
  >("pending");
  const [paymentTransactionId, setPaymentTransactionId] = useState<
    string | null
  >(null);
  const [checkPaymentStatus] = useLazyGetPaymentStatusQuery();
  const processingSheetRef = React.useRef<BottomSheetModal>(null);

  const getDateKeyForDay = useCallback(
    (day: number) =>
      getLocalDateKey(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      ),
    [currentMonth],
  );
  const isAllowedFilterDay = useCallback(
    (day: number) =>
      !hasFilterDates || filterDateKeys.has(getDateKeyForDay(day)),
    [filterDateKeys, getDateKeyForDay, hasFilterDates],
  );
  const selectedShiftPrice = useMemo(() => {
    let total = 0;
    selectedDates.forEach((day) => {
      const shiftId = selectedShifts[day];
      if (shiftId) {
        const shift = chaletDetails?.shifts?.find((s: any) => s.id === shiftId);
        if (shift) {
          const dayOfWeek = getDayOfWeek(day);
          const pricing = shift.pricing?.find(
            (p: any) => p.dayOfWeek === dayOfWeek,
          );
          total += pricing
            ? Number(pricing.price)
            : Number(chaletDetails?.basePrice || 0);
        }
      }
    });
    return total;
  }, [selectedShifts, selectedDates, chaletDetails, currentMonth]);

  const extraGuestsPrice = 0;

  const isShiftBookedForDay = useCallback(
    (day: number, shiftId: string) => {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return availabilityData.some((b: any) => {
        const bDate = b.bookingDate.split("T")[0];
        return bDate === dateStr && b.shift?.id === shiftId;
      });
    },
    [availabilityData, currentMonth],
  );

  const calculateTotalPrice = () => {
    let total = 0;
    selectedDates.forEach((day) => {
      const shiftId = selectedShifts[day];
      if (shiftId) {
        const shift = chaletDetails?.shifts?.find((s: any) => s.id === shiftId);
        if (shift) {
          const dayOfWeek = getDayOfWeek(day);
          const pricing = shift.pricing?.find(
            (p: any) => p.dayOfWeek === dayOfWeek,
          );
          total += pricing
            ? Number(pricing.price)
            : Number(chaletDetails?.basePrice || 0);
        }
      }
    });
    return total;
  };

  const totalPrice = calculateTotalPrice();
  const depositPercentage = Number(chaletDetails?.depositPercentage || 0);
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);
  const remainingAmount = totalPrice - depositAmount;

  const bookingDateString =
    selectedDates.length > 0
      ? (selectedDateRange.length > 0
          ? selectedDateRange
          : selectedDates.map(getDateForDay)
        )
          .map(
            (date) =>
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
          )
          .join(", ")
      : t("booking.noDate");

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === "WHEN") {
      setActiveTab("WHO");
    } else if (activeTab === "WHO") {
      setActiveTab("WHERE");
    } else {
      // We are on DETAILS tab — create the booking via API
      try {
        if (selectedDates.length === 0) {
          Alert.alert(
            isRTL ? "تنبيه" : "Alert",
            isRTL ? "يرجى اختيار تاريخ الحجز" : "Please select a booking date",
          );
          setActiveTab("WHEN");
          return;
        }

        const allDaysHaveShifts = selectedDates.every(
          (day) => selectedShifts[day],
        );
        if (!allDaysHaveShifts) {
          Alert.alert(
            isRTL ? "تنبيه" : "Alert",
            isRTL
              ? "يرجى اختيار فترة لكل يوم مختار"
              : "Please select a shift for every selected day",
          );
          setActiveTab("WHEN");
          return;
        }

        if (chaletId) {
          const bookings = selectedDates.map((day) => ({
            bookingDate: (() => {
              const date = getDateForDay(day);
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            })(),
            shiftId: selectedShifts[day],
          }));

          const result = await createBooking({
            chaletId,
            shiftId: bookings[0].shiftId,
            bookingDate: bookings[0].bookingDate,
            adultsCount: adultCount,
            childrenCount: childrenCount,
            paymentModel: paymentType.toLowerCase() as any,
            paymentMethod: selectedMethod,
            notes,
          }).unwrap();

          if (result.payment?.paymentUrl) {
            setCreatedBookingId(result.booking.id);
            setPaymentTransactionId(result.payment.transactionId);

            // Open payment URL in auth session to catch the redirect
            setIsWaitingForPayment(true);
            setPollingStatus("pending");
            processingSheetRef.current?.present();

            try {
              const authResult = await WebBrowser.openAuthSessionAsync(
                result.payment.paymentUrl,
                "sununo://payment-callback",
              );

              // Start polling regardless of authResult to be sure
              startPaymentPolling(result.payment.transactionId);
            } catch (e) {
              console.error("Browser error", e);
              setIsWaitingForPayment(false);
              processingSheetRef.current?.dismiss();
            }
          } else if (selectedMethod === "wallet") {
            setCreatedBookingId(result.booking.id);
            successSheetRef.current?.present();
          } else {
            // Handle cases where no URL is returned (e.g. error or test)
            setCreatedBookingId(result.booking.id);
            successSheetRef.current?.present();
          }
        } else {
          Alert.alert(
            isRTL ? "خطأ" : "Error",
            isRTL
              ? "معلومات الشاليه غير مكتملة"
              : "Chalet information is incomplete",
          );
        }
      } catch (error: any) {
        Alert.alert(
          t("common.error") || "Error",
          error?.data?.message ||
            t("booking.bookingError") ||
            "Failed to create booking",
        );
      }
    }
  };

  const toggleDayDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    if (bookedDates.includes(day) || dateToCheck < today) return;
    setSelectedDates((prev) => {
      if (prev.includes(day)) {
        // Remove the day
        setSelectedShifts((prevShifts) => {
          const next = { ...prevShifts };
          delete next[day];
          return next;
        });
        return prev.filter((d) => d !== day);
      }
      // Add the day
      const updated = [...prev, day].sort((a, b) => a - b);
      const initialShift =
        filteredSelectedShift ||
        (availableShifts.length === 1 ? availableShifts[0] : null);
      if (initialShift) {
        setSelectedShifts((prevShifts) => ({
          ...prevShifts,
          [day]: initialShift.id,
        }));
      }
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCalendarSelect = useCallback(
    (start: Date | null, end: Date | null) => {
      setSelectedStartDate(start ? new Date(start) : null);
      setSelectedEndDate(end ? new Date(end) : null);

      if (!start) {
        setSelectedDates([]);
        setSelectedShifts({});
        return;
      }

      const nextDates: Date[] = [];
      const cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const last = end ? new Date(end) : new Date(start);
      last.setHours(0, 0, 0, 0);

      while (cur <= last) {
        nextDates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }

      const nextDays = nextDates.map((date) => date.getDate());
      const preferredShiftId =
        filteredSelectedShift?.id ||
        Object.values(selectedShifts).find(Boolean) ||
        (availableShifts.length === 1 ? availableShifts[0].id : "");

      setCurrentMonth(new Date(start));
      setSelectedDates(nextDays);
      setSelectedShifts((prev) => {
        const next: Record<number, string> = {};
        nextDays.forEach((day) => {
          next[day] = prev[day] || preferredShiftId;
        });
        return next;
      });
    },
    [availableShifts, filteredSelectedShift, selectedShifts],
  );

  const toggleShiftForDay = (day: number, shiftId: string) => {
    if (isShiftBookedForDay(day, shiftId)) return;
    setSelectedShifts((prev) => ({
      ...prev,
      [day]: prev[day] === shiftId ? "" : shiftId,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const startPaymentPolling = async (transactionId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 * 3s = 60s (1 minute)

    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await checkPaymentStatus(transactionId).unwrap();
        if (result?.status === "success") {
          clearInterval(interval);
          setPollingStatus("success");
          dismissBrowser();
          // Wait a bit then show success sheet
          setTimeout(() => {
            processingSheetRef.current?.dismiss();
            successSheetRef.current?.present();
          }, 1500);
        } else if (result?.status === "failed") {
          clearInterval(interval);
          setPollingStatus("failed");
          dismissBrowser();
          setTimeout(() => {
            processingSheetRef.current?.dismiss();
          }, 1500);
        }
      } catch (e) {
        // Only log actual network errors, ignore WebBrowser close errors
        if (e && typeof e === "object" && "status" in e) {
          console.error("Polling error", e);
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollingStatus("timeout");
        dismissBrowser();
        setTimeout(() => {
          processingSheetRef.current?.dismiss();
        }, 1500);
      }
    }, 3000);
  };

  const renderDetailsTab = () => (
    <View style={styles.detailsContainer}>
      <HorizontalCard
        chalet={{
          id: chaletDetails?.id || "",
          title: isRTL
            ? chaletDetails?.nameAr ||
              chaletDetails?.name?.ar ||
              chaletDetails?.name ||
              ""
            : chaletDetails?.nameEn ||
              chaletDetails?.name?.en ||
              chaletDetails?.name ||
              "",
          location: isRTL
            ? chaletDetails?.region?.name?.ar ||
              chaletDetails?.region?.nameAr ||
              chaletDetails?.region?.name ||
              ""
            : chaletDetails?.region?.name?.en ||
              chaletDetails?.region?.nameEn ||
              chaletDetails?.region?.name ||
              "",
          rating: chaletDetails?.averageRating || 0,
          price: chaletDetails?.basePrice
            ? Number(chaletDetails.basePrice).toLocaleString()
            : "0",
          image:
            chaletDetails?.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop",
        }}
        style={styles.chaletCardInstance}
        shapeIndex={2}
        hideFavorite={true}
        onPress={() => {}}
      />

      <View style={styles.detailsMapCard}>
        <View style={styles.mapSnippetWrapper}>
          <ExpoImage
            source={{
              uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/47.98,30.50,13,0/600x300?access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
            }}
            style={styles.mapSnippet}
          />
          <View style={styles.mapMarker}>
            <SolarMapPointBold size={32} color={Colors.primary} />
          </View>
        </View>
        <ThemedText style={styles.mapAddressLabel}>
          {isRTL
            ? chaletDetails?.region?.name?.ar ||
              chaletDetails?.region?.nameAr ||
              chaletDetails?.region?.name ||
              ""
            : chaletDetails?.region?.name?.en ||
              chaletDetails?.region?.nameEn ||
              chaletDetails?.region?.name ||
              ""}
        </ThemedText>
      </View>

      <View style={styles.infoSectionCard}>
        <ThemedText style={[styles.sectionTitle, { textAlign: textStart }]}>
          {t("booking.customerInfo")}
        </ThemedText>
        <View style={styles.divider} />
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
            {t("booking.name")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textEnd }]}>
            {user?.name || t("booking.nameValue")}
          </ThemedText>
        </View>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
            {t("booking.phone")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textEnd, direction: "ltr" }]}>
            {user?.phone || t("booking.phoneValue")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.infoSectionCard}>
        <View style={[styles.sectionHeaderRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.sectionTitle, { textAlign: textStart }]}>
            {t("booking.bookingInfo")}
          </ThemedText>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setActiveTab("WHEN")}
          >
            <ThemedText style={styles.editBtnText}>
              {t("booking.edit")}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
            {t("booking.date")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textEnd }]}>
            {bookingDateString}
          </ThemedText>
        </View>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
            {t("booking.shift")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textEnd }]}>
            {selectedDates.length > 1
              ? isArabic
                ? "فترات متعددة"
                : "Multiple Shifts"
              : (function () {
                  const day = selectedDates[0];
                  const shiftId = selectedShifts[day];
                  const shift = chaletDetails?.shifts?.find(
                    (s: any) => s.id === shiftId,
                  );
                  return shift
                    ? isArabic
                      ? shift.name?.ar || shift.name
                      : shift.name?.en || shift.name
                    : t("booking.noShift");
                })()}
          </ThemedText>
        </View>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
            {t("booking.guests")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textEnd }]}>
            {adultCount + childrenCount}
          </ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
            {t("booking.shiftPrice") || (isArabic ? "سعر الفترة" : "Shift Price")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textEnd }]}>
            {selectedShiftPrice.toLocaleString()} {t("common.iqd")}
          </ThemedText>
        </View>
        {extraGuestsPrice > 0 && (
          <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
            <ThemedText style={[styles.infoLabel, { textAlign: textStart }]}>
              {isArabic ? "رسوم الأشخاص الإضافيين" : "Extra Guest Fees"}
            </ThemedText>
            <ThemedText style={[styles.infoValue, { textAlign: textEnd }]}>
              {extraGuestsPrice.toLocaleString()} {t("common.iqd")}
            </ThemedText>
          </View>
        )}
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { fontWeight: "700", textAlign: textStart }]}>
            {t("booking.totalAmount")}
          </ThemedText>
          <ThemedText
            style={[
              styles.infoValue,
              { fontFamily: "Alexandria-Medium", color: Colors.primary, textAlign: textEnd },
            ]}
          >
            {totalPrice.toLocaleString()} {t("common.iqd")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.infoSectionCard}>
        <ThemedText style={[styles.sectionTitle, { textAlign: textStart }]}>
          {isArabic ? "ملاحظات إضافية" : "Special Requests"}
        </ThemedText>
        <View style={styles.divider} />
        <TextInput
          style={[
            styles.textInput,
            {
              height: 100,
              textAlignVertical: "top",
              paddingTop: 12,
              textAlign: textStart,
            },
          ]}
          placeholder={
            isArabic
              ? "أي طلبات خاصة أو ملاحظات للمالك..."
              : "Any special requests or notes for the owner..."
          }
          placeholderTextColor="#94A3B8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <ThemedText style={[styles.paymentMainTitle, { textAlign: textStart }]}>
        {t("booking.paymentTitle")}
      </ThemedText>

      <TouchableOpacity
        style={[
          styles.paymentOptionCard,
          paymentType === "DEPOSIT" && styles.paymentOptionActive,
          styles.row,
          { flexDirection: rowDirection },
        ]}
        onPress={() => setPaymentType("DEPOSIT")}
      >
        <ThemedText
          style={[
            styles.paymentLabel,
            paymentType === "DEPOSIT" && styles.paymentLabelActive,
            { textAlign: textStart },
          ]}
        >
          {t("booking.depositPay")}
        </ThemedText>
        <ThemedText
          style={[
            styles.paymentVal,
            paymentType === "DEPOSIT" && styles.paymentValActive,
            { textAlign: textEnd },
          ]}
        >
          {depositAmount.toLocaleString()} {t("common.iqd")}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOptionCard,
          paymentType === "FULL" && styles.paymentOptionActive,
          styles.row,
          { flexDirection: rowDirection },
        ]}
        onPress={() => setPaymentType("FULL")}
      >
        <ThemedText
          style={[
            styles.paymentLabel,
            paymentType === "FULL" && styles.paymentLabelActive,
            { textAlign: textStart },
          ]}
        >
          {t("booking.fullPay")}
        </ThemedText>
        <ThemedText
          style={[
            styles.paymentVal,
            paymentType === "FULL" && styles.paymentValActive,
            { textAlign: textEnd },
          ]}
        >
          {totalPrice.toLocaleString()} {t("common.iqd")}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.agreementWrapper}>
        <ThemedText style={styles.agreementText}>
          {t("booking.agreement")}{" "}
          <ThemedText style={styles.agreementLink}>
            {t("booking.terms")}
          </ThemedText>{" "}
          {t("common.and")}{" "}
          <ThemedText style={styles.agreementLink}>
            {t("booking.policy")}
          </ThemedText>
        </ThemedText>
      </View>

      <View style={[styles.infoSectionCard, { marginTop: 8 }]}>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection, marginBottom: 0, alignItems: "center" }]}>
          <ThemedText style={[styles.infoLabel, { fontWeight: "700", textAlign: textStart }]}>
            {t("booking.paymentMethod") || "طريقة الدفع"}
          </ThemedText>
          <View style={{ flexDirection: rowDirection, alignItems: "center", gap: 8 }}>
            <View style={{ backgroundColor: "#ECFDF5", padding: 6, borderRadius: 8 }}>
              <SolarCardBold size={18} color="#10B981" />
            </View>
            <ThemedText style={[styles.infoValue, { color: "#10B981", fontFamily: "Alexandria-SemiBold", textAlign: textEnd }]}>
              {t("booking.wayl")}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCalendarSheet = () => (
    <BottomSheetModal
      ref={calendarSheetRef}
      snapPoints={["70%"]}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetView
        style={[styles.calendarSheetContent, { paddingTop: 40 }]}
      >
        <View style={styles.calendarCardDrawer}>
          <RangeCalendar
            onSelect={handleCalendarSelect}
            initialStartDate={selectedStartDate ?? undefined}
            initialEndDate={selectedEndDate ?? undefined}
            reservedDates={bookedDateStrings}
            selectionMode="single"
          />
          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label={isRTL ? "تم" : "Done"}
              onPress={() => calendarSheetRef.current?.dismiss()}
              style={{
                width: "100%",
                shadowOpacity: 0,
                elevation: 0,
                height: 56,
              }}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );

  const renderSuccessSheet = () => (
    <BottomSheetModal
      ref={successSheetRef}
      index={0}
      snapPoints={["50%"]}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetView style={styles.successSheetContent}>
        <LottieView
          source={require("../../../components/icons/motions/success.json")}
          autoPlay
          loop={false}
          style={[styles.lottieIcon, { height: normalize.height(120) }]}
          resizeMode="contain"
        />
        <ThemedText style={styles.successTitle}>
          {t("booking.successTitle") || "تم الحجز بنجاح!"}
        </ThemedText>
        <ThemedText style={styles.successSub}>
          {t("booking.successMsg") ||
            "لقد تم تأكيد حجزك، يمكنك البدء الآن في متابعة التفاصيل."}
        </ThemedText>

        <PrimaryButton
          label={t("booking.goToDetails") || "استعراض تفاصيل الحجز"}
          onPress={() => {
            successSheetRef.current?.dismiss();
            router.push({
              pathname: "/(tabs)/(customer)/booking-success",
              params: { id: createdBookingId },
            });
          }}
          activeColor="#15AB64"
          style={styles.successBtn}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );

  const renderProcessingSheet = () => (
    <BottomSheetModal
      ref={processingSheetRef}
      index={0}
      snapPoints={["55%"]}
      enablePanDownToClose={pollingStatus !== "pending"}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetView style={styles.successSheetContent}>
        {pollingStatus === "pending" ? (
          <>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: 40, marginBottom: 20 }}
            />
            <ThemedText style={styles.successTitle}>
              {isRTL ? "جاري التحقق من الدفع..." : "Verifying Payment..."}
            </ThemedText>
            <ThemedText style={styles.successSub}>
              {isRTL
                ? "يرجى الانتظار بينما نتأكد من حالة العملية، قد يستغرق ذلك لحظات."
                : "Please wait while we confirm your transaction, this may take a few moments."}
            </ThemedText>
          </>
        ) : pollingStatus === "success" ? (
          <>
            <LottieView
              source={require("../../../components/icons/motions/success.json")}
              autoPlay
              loop={false}
              style={[styles.lottieIcon, { height: normalize.height(120) }]}
              resizeMode="contain"
            />
            <ThemedText style={styles.successTitle}>
              {isRTL ? "تم الدفع بنجاح!" : "Payment Successful!"}
            </ThemedText>
            <ThemedText style={styles.successSub}>
              {isRTL
                ? "تم تأكيد الدفع بنجاح، جاري تحويلك..."
                : "Payment confirmed successfully, redirecting..."}
            </ThemedText>
          </>
        ) : pollingStatus === "failed" ? (
          <>
            <View
              style={[
                styles.methodIconContainer,
                {
                  backgroundColor: "#FEE2E2",
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 20,
                },
              ]}
            >
              <ThemedText style={{ fontSize: 14 }}>❌</ThemedText>
            </View>
            <ThemedText style={[styles.successTitle, { color: "#EF4444" }]}>
              {isRTL ? "فشلت عملية الدفع" : "Payment Failed"}
            </ThemedText>
            <ThemedText style={styles.successSub}>
              {isRTL
                ? "نعتذر، لم نتمكن من تأكيد عملية الدفع. يرجى المحاولة مرة أخرى."
                : "Sorry, we couldn't confirm the payment. Please try again."}
            </ThemedText>
            <PrimaryButton
              label={isRTL ? "إغلاق" : "Close"}
              onPress={() => processingSheetRef.current?.dismiss()}
              style={{ width: "100%", height: 56, marginTop: 10 }}
            />
          </>
        ) : (
          <>
            <View
              style={[
                styles.methodIconContainer,
                {
                  backgroundColor: "#FEF3C7",
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 20,
                },
              ]}
            >
              <ThemedText style={{ fontSize: 14 }}>⏳</ThemedText>
            </View>
            <ThemedText style={[styles.successTitle, { color: "#F59E0B" }]}>
              {isRTL ? "انتهت مهلة التحقق" : "Verification Timeout"}
            </ThemedText>
            <ThemedText style={styles.successSub}>
              {isRTL
                ? "لم نتلقَّ تأكيداً بعد. يرجى مراجعة قائمة حجوزاتك لاحقاً للتأكد من الحالة."
                : "We haven't received confirmation yet. Please check your bookings later for status."}
            </ThemedText>
            <PrimaryButton
              label={isRTL ? "الذهاب للحجوزات" : "Go to Bookings"}
              onPress={() => {
                processingSheetRef.current?.dismiss();
                router.replace("/(tabs)/(customer)/bookings");
              }}
              style={{ width: "100%", height: 56, marginTop: 10 }}
            />
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection
        title={t("headers.bookingComplete")}
        showBackButton
        showLogo={false}
        userType={userType}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabsContainer}>
          <MainTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={BOOKING_TABS}
            labels={{ WHERE: isRTL ? "التفاصيل" : "Details" }}
          />
        </View>

        {activeTab === "WHEN" ? (
          <>
            {/* Date badges removed */}

            {selectedDates.length === 0 && (
              <View style={styles.daySelectionSection}>
                <View
                  style={[styles.dayHeaderRow, { flexDirection: rowDirection }]}
                >
                  <ThemedText style={styles.dayHeaderText}>
                    {isRTL ? "اختر يوماً للبدء" : "Select a day to start"}
                  </ThemedText>
                </View>
                <View style={styles.shiftsContainer}>
                  {availableShifts?.map((shift: any) => {
                    const shiftName = isRTL
                      ? shift.name?.ar || shift.name
                      : shift.name?.en || shift.name;
                    const isMorning =
                      shift.type === "MORNING" ||
                      shift.name?.en?.toLowerCase().includes("morning") ||
                      shift.name?.ar?.includes("صباح");

                    return (
                      <View
                        key={`preview-${shift.id}`}
                        style={[
                          styles.shiftCardFlat,
                          { flexDirection: "row", opacity: 0.6 },
                        ]}
                      >
                        <View style={styles.shiftIconCircleFlat}>
                          {isMorning ? (
                            <SolarSunBold size={22} color="#FBBF24" />
                          ) : (
                            <SolarMoonBold size={22} color="#6366F1" />
                          )}
                        </View>
                        <View
                          style={[
                            styles.shiftInfoFlat,
                            { alignItems: "flex-start" },
                          ]}
                        >
                          <ThemedText style={styles.shiftNameFlat}>
                            {shiftName}
                          </ThemedText>
                          <ThemedText style={styles.shiftTimeFlat}>
                            {formatShiftTime(shift.startTime)} -{" "}
                            {formatShiftTime(shift.endTime)}
                          </ThemedText>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <ThemedText style={styles.shiftPriceFlat}>
                            {(() => {
                              const minPrice =
                                shift.pricing && shift.pricing.length > 0
                                  ? Math.min(
                                      ...shift.pricing.map((p: any) => p.price),
                                    )
                                  : chaletDetails?.basePrice || 0;
                              return Number(minPrice).toLocaleString();
                            })()}{" "}
                            {t("common.iqd")}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
                <PrimaryButton
                  label={isRTL ? "اختيار يوم" : "Choose a Day"}
                  onPress={() => calendarSheetRef.current?.present()}
                  style={{
                    width: "100%",
                    marginTop: 20,
                    shadowOpacity: 0,
                    elevation: 0,
                  }}
                />
              </View>
            )}

            {selectedDates.map((day) => (
              <View key={day} style={styles.daySelectionSection}>
                <View
                  style={[styles.dayHeaderRow, { flexDirection: rowDirection }]}
                >
                  <ThemedText style={styles.dayHeaderText}>
                    {isRTL ? `يوم ${day}` : `Day ${day}`}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        isRTL ? "تأكيد" : "Confirm",
                        isRTL
                          ? "هل أنت متأكد من حذف هذا اليوم؟"
                          : "Are you sure you want to delete this day?",
                        [
                          { text: isRTL ? "إلغاء" : "Cancel" },
                          {
                            text: isRTL ? "حذف" : "Delete",
                            onPress: () => toggleDayDate(day),
                            style: "destructive",
                          },
                        ],
                      );
                    }}
                  >
                    <ThemedText
                      style={{
                        color: "#EF4444",
                        fontFamily: "Alexandria-Medium",
                      }}
                    >
                      {t("common.delete")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.shiftsContainer}>
                  {availableShifts?.map((shift: any) => {
                    const isSelected = selectedShifts[day] === shift.id;
                    const isBooked = isShiftBookedForDay(day, shift.id);
                    const shiftName = isRTL
                      ? shift.name?.ar || shift.name
                      : shift.name?.en || shift.name;

                    const dayOfWeek = getDayOfWeek(day);
                    const shiftPrice =
                      shift.pricing?.find((p: any) => p.dayOfWeek === dayOfWeek)
                        ?.price ||
                      chaletDetails?.basePrice ||
                      0;

                    const isMorning =
                      shift.type === "MORNING" ||
                      shift.name?.en?.toLowerCase().includes("morning") ||
                      shift.name?.ar?.includes("صباح");

                    return (
                      <TouchableOpacity
                        key={`${day}-${shift.id}`}
                        disabled={isBooked}
                        style={[
                          styles.shiftCardFlat,
                          { flexDirection: "row" },
                          isSelected && {
                            borderColor: "#035DF9",
                            borderWidth: 1.5,
                            backgroundColor: "#F0F7FF",
                          },
                          isBooked && {
                            opacity: 0.5,
                            backgroundColor: "#F1F5F9",
                          },
                        ]}
                        onPress={() => toggleShiftForDay(day, shift.id)}
                      >
                        <View
                          style={[
                            styles.shiftIconCircleFlat,
                            isSelected && { backgroundColor: "#035DF9" },
                          ]}
                        >
                          {isMorning ? (
                            <SolarSunBold
                              size={22}
                              color={isSelected ? "white" : "#FBBF24"}
                            />
                          ) : (
                            <SolarMoonBold
                              size={22}
                              color={isSelected ? "white" : "#6366F1"}
                            />
                          )}
                        </View>
                        <View
                          style={[
                            styles.shiftInfoFlat,
                            { alignItems: "flex-start" },
                            { flex: 1 },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.shiftNameFlat,
                              isSelected && {
                                color: "#035DF9",
                                fontFamily: "Alexandria-Medium",
                              },
                            ]}
                          >
                            {shiftName}
                          </ThemedText>
                          <ThemedText
                            style={[
                              styles.shiftTimeFlat,
                              isSelected && { color: "#035DF9" },
                            ]}
                          >
                            {formatShiftTime(shift.startTime)} -{" "}
                            {formatShiftTime(shift.endTime)}
                          </ThemedText>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <ThemedText
                            style={[
                              styles.shiftPriceFlat,
                              isSelected && {
                                color: "#035DF9",
                                fontFamily: "Alexandria-Medium",
                              },
                            ]}
                          >
                            {Number(shiftPrice).toLocaleString()}{" "}
                            {t("common.iqd")}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {selectedDates.length > 0 && (
              <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
                <PrimaryButton
                  label={isRTL ? "تغيير التاريخ" : "Change Date"}
                  onPress={() => calendarSheetRef.current?.present()}
                  style={{ width: "100%", shadowOpacity: 0, elevation: 0 }}
                />
              </View>
            )}
          </>
        ) : activeTab === "WHO" ? (
          <View style={styles.whoContainer}>
            <View style={[styles.whoCard, { flexDirection: "row" }]}>
              <View
                style={[
                  styles.guestInfo,
                  isRTL ? styles.rtlAlign : styles.ltrAlign,
                ]}
              >
                <ThemedText
                  style={[
                    styles.guestLabel,
                    isRTL ? styles.rtlText : styles.ltrText,
                  ]}
                >
                  {t("booking.adults")}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.guestSubLabel,
                    isRTL ? styles.rtlText : styles.ltrText,
                  ]}
                >
                  {t("booking.adultsDesc")}
                </ThemedText>
              </View>
              <GuestCounter
                value={adultCount}
                onIncrement={() => {
                  const max = Number(chaletDetails?.maxAdults || 10);
                  if (adultCount < max) setAdultCount(adultCount + 1);
                  else
                    Alert.alert(
                      isRTL ? "تنبيه" : "Alert",
                      isRTL
                        ? `الحد الاقصى للبالغين هو ${max}`
                        : `Max adults is ${max}`,
                    );
                }}
                onDecrement={() => setAdultCount(Math.max(1, adultCount - 1))}
              />
            </View>

            <View
              style={[
                styles.whoCard,
                {
                  marginTop: 12,
                  flexDirection: "row",
                },
              ]}
            >
              <View
                style={[
                  styles.guestInfo,
                  isRTL ? styles.rtlAlign : styles.ltrAlign,
                ]}
              >
                <ThemedText
                  style={[
                    styles.guestLabel,
                    isRTL ? styles.rtlText : styles.ltrText,
                  ]}
                >
                  {t("booking.children")}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.guestSubLabel,
                    isRTL ? styles.rtlText : styles.ltrText,
                  ]}
                >
                  {t("booking.childrenDesc")}
                </ThemedText>
              </View>
              <GuestCounter
                value={childrenCount}
                onIncrement={() => {
                  const max = Number(chaletDetails?.maxChildren || 10);
                  if (childrenCount < max) setChildrenCount(childrenCount + 1);
                  else
                    Alert.alert(
                      isRTL ? "تنبيه" : "Alert",
                      isRTL
                        ? `الحد الاقصى للأطفال هو ${max}`
                        : `Max children is ${max}`,
                    );
                }}
                onDecrement={() =>
                  setChildrenCount(Math.max(0, childrenCount - 1))
                }
              />
            </View>
          </View>
        ) : (
          renderDetailsTab()
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={
            activeTab === "WHERE"
              ? t("booking.completePayment")
              : t("booking.next")
          }
          onPress={handleNext}
          activeColor={
            activeTab === "WHO"
              ? "#F64200"
              : activeTab === "WHERE"
                ? "#15AB64"
                : "#035DF9"
          }
          style={styles.nextBtn}
        />
      </View>

      {renderCalendarSheet()}
      {renderSuccessSheet()}
      {renderProcessingSheet()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 150, paddingHorizontal: 16 },
  tabsContainer: { marginTop: 15, alignItems: "center" },
  swiperContainer: { marginTop: 20, height: 50 },
  quickDatesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  dateBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  dateBadgeActive: { borderColor: Colors.primary, borderWidth: 2 },
  dateBadgeText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#94A3B8",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 42,
  },
  dateBadgeTextActive: {
    color: Colors.primary,
    fontFamily: "Alexandria-Medium",
  },
  addDateBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarMonthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  calendarMonthTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    textAlign: "center",
    letterSpacing: 2,
    flex: 1,
  },
  monthNavBtn: { padding: 5 },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    marginBottom: 20,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 12,
  },
  dayHeaderCell: {
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: "#94A3B8",
    width: (SCREEN_WIDTH - 100) / 7,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  dayCell: {
    width: (SCREEN_WIDTH - 100) / 7,
    height: (SCREEN_WIDTH - 100) / 7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  activeDayCell: { backgroundColor: Colors.primary, borderRadius: 10 },
  filteredOutDayCell: { opacity: 0.18 },
  dayText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#334155",
    textAlign: "center",
  },
  activeDayText: { color: "#FFF", fontFamily: "Alexandria-Medium" },
  filteredOutDayText: { color: "#94A3B8" },
  bookedDayText: {
    color: "#CBD5E1",
    fontFamily: "Alexandria-Medium",
    opacity: 0.4,
  },
  scribbleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  shiftLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  shiftIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  shiftTime: {
    fontSize: normalize.font(8),
    color: "#64748B",
    fontFamily: "Alexandria-Medium",
  },
  deleteDayText: {
    color: "#EF4444",
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    textDecorationLine: "underline",
  },
  calendarSheetContent: {
    padding: 20,
    flex: 1,
  },
  calendarCardDrawer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 15,
  },
  daySelectionSection: {
    marginTop: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  dayHeaderRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dayHeaderText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  shiftsContainer: {
    gap: 12,
    marginBottom: 10,
  },
  shiftCardFlat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexWrap: "nowrap",
  },
  shiftIconCircleFlat: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftInfoFlat: {
    flex: 1,
    marginHorizontal: 12,
    minWidth: 0,
  },
  shiftNameFlat: {
    fontFamily: "Alexandria-Medium",
    fontSize: 15,
    color: "#1E293B",
    flexShrink: 1,
    lineHeight: 24,
  },
  shiftTimeFlat: {
    fontFamily: "Alexandria-Medium",
    fontSize: 12,
    color: "#64748B",
    flexShrink: 1,
    lineHeight: 20,
  },
  shiftPriceFlat: {
    fontFamily: "Alexandria-Medium",
    fontSize: 14,
    color: "#1E293B",
    flexShrink: 0,
    textAlign: "right",
    lineHeight: 22,
  },
  whoContainer: { marginTop: 10 },
  whoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  guestInfo: {
    // Removed flex: 1 to allow space-between to push it
  },
  guestLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  guestSubLabel: {
    fontSize: normalize.font(8),
    color: "#9CA3AF",
    fontFamily: "Alexandria-Medium",
    marginTop: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    zIndex: 100,
  },
  nextBtn: { width: "100%", height: 56 },

  // Inline Payment Styles
  inlinePaymentSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
    paddingBottom: 15,
  },
  inlinePaymentTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#15AB64",
    marginBottom: 15,
  },
  paymentForm: { gap: 12 },
  inputGroup: { gap: 6 },
  inputGroupFull: { flex: 1, gap: 6 },
  inputGroupFixed: { width: 90, gap: 6 },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  rowInputs: { flexDirection: "row" },

  // Success Sheet Styles
  successSheetContent: {
    padding: 25,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  lottieIcon: {
    width: 140,
    height: 140,
    alignSelf: "center",
    marginBottom: 15,
  },
  successTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  successSub: {
    fontSize: normalize.font(14),
    color: "#64748B",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
    fontFamily: "Alexandria-Medium",
  },
  successBtn: { width: "100%", height: 56 },

  // Details Styles
  detailsContainer: { marginTop: 15 },
  chaletCardInstance: { width: "100%", marginRight: 0, marginBottom: 12 },
  detailsMapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  mapSnippetWrapper: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  mapSnippet: { width: "100%", height: "100%" },
  mapMarker: { position: "absolute", zIndex: 5 },
  mapAddressLabel: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    width: "100%",
  },
  infoSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#15AB64",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  infoRow: { justifyContent: "space-between", marginBottom: 10 },
  infoLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    textAlign: isRTL ? "right" : "left",
  },
  infoValue: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    textAlign: isRTL ? "left" : "right",
  },
  sectionHeaderRow: { justifyContent: "space-between", alignItems: "center" },
  editBtn: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#15AB6433",
  },
  editBtnText: {
    color: "#15AB64",
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
  },
  paymentMainTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#15AB64",
    marginVertical: 12,
  },
  paymentOptionCard: {
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentOptionActive: { borderColor: "#15AB64", backgroundColor: "#F0FDF4" },
  paymentVal: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  paymentValActive: { color: "#1E293B", fontFamily: "Alexandria-Medium" },
  paymentLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  paymentLabelActive: { color: "#1E293B", fontFamily: "Alexandria-Medium" },
  agreementWrapper: { paddingVertical: 12, paddingBottom: 35 },
  agreementText: {
    fontSize: normalize.font(8),
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Alexandria-Medium",
  },
  agreementLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
    fontFamily: "Alexandria-Medium",
  },
  // RTL Utilities
  rtlText: { textAlign: "right" },
  ltrText: { textAlign: "left" },
  row: { flexDirection: "row" },
  rtlRow: { flexDirection: isRTL ? "row-reverse" : "row" },
  ltrRow: { flexDirection: "row" },
  rtlAlign: { alignItems: "flex-end" },
  ltrAlign: { alignItems: "flex-start" },
  paymentMethodsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 15,
  },
  methodCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  methodCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F7FF",
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  methodName: {
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  selectedDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
