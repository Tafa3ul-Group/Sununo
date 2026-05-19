import {
  BookingCancellationSheet,
  BookingCancellationSheetRef } from "@/components/booking-cancellation-modal";
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { PendingApprovalScreen } from "@/components/dashboard/pending-approval";
import {
  SolarAddCircleBold,
  SolarAltArrowDownLinear,
  SolarAltArrowLeftLinear,
  SolarAltArrowRightLinear,
  SolarCalendarBold,
  SolarCalendarMinimalisticBold,
  SolarClockCircleLinear,
  SolarLockBold,
  SolarPhoneBold,
  SolarUserBold } from "@/components/icons/solar-icons";
import { ErrorState } from "@/components/ui/error-state";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
import {
  useCreateExternalBookingMutation,
  useDeleteExternalBookingMutation,
  useGetFullyBookedStatusQuery,
  useGetProviderBookingsQuery,
  useGetProviderProfileQuery,
  useGetShiftAvailabilityQuery,
  useMarkBookingCompletedMutation,
  useRejectBookingMutation,
  useUpdateShiftPricingDayMutation } from "@/store/api/apiSlice";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert, FlatList, ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useSelector } from "react-redux";
import { isRTL } from "@/i18n";

// Status mapping from UI to API
const API_STATUS_MAP: Record<string, string> = {
  new: "pending_payment",
  confirmed: "confirmed",
  finished: "completed",
  cancelled: "cancelled" };

const IDENTITY_BLUE = "#035DF9";

const formatDate = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const format12H = (time: string | undefined | null, isRTL: boolean) => {
  if (!time) return "";
  const timePart = time.includes(" ") ? time.split(" ")[1] : time;
  const parts = timePart.split(":");
  if (parts.length < 2) return time;
  let h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? (isRTL ? "م" : "PM") : isRTL ? "ص" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m.padStart(2, "0")} ${ampm}`;
};

const getShiftIcon = (shift: any) => {
  const type = (shift?.type || shift?.shift?.type || "").toUpperCase();
  if (type === "MORNING") {
    return require("../../../assets/shifts/sun.svg");
  }
  if (type === "EVENING" || type === "NIGHT") {
    return require("../../../assets/shifts/night.svg");
  }
  if (type === "OVERNIGHT") {
    return require("../../../assets/shifts/sleep.svg");
  }
  if (type === "CUSTOM" || type === "CUSTEM") {
    return require("../../../assets/shifts/sun.svg");
  }

  // Fallback to isOvernight flag
  if (shift?.isOvernight || shift?.shift?.isOvernight) {
    return require("../../../assets/shifts/sleep.svg");
  }

  // Fallback to name checking
  const nameAr = (shift?.shiftName?.ar || shift?.shiftName || "").toLowerCase();
  const nameEn = (shift?.shiftName?.en || shift?.shiftName || "").toLowerCase();
  if (nameAr.includes("صباح") || nameEn.includes("morning")) {
    return require("../../../assets/shifts/sun.svg");
  }
  if (nameAr.includes("مساء") || nameAr.includes("ليل") || nameEn.includes("evening") || nameEn.includes("night") || nameEn.includes("eveningShift")) {
    return require("../../../assets/shifts/night.svg");
  }
  if (nameAr.includes("مبيت") || nameEn.includes("overnight")) {
    return require("../../../assets/shifts/sleep.svg");
  }

  // Fallback to time-based detection
  const startTime = shift?.startTime || "";
  if (startTime) {
    const hour = parseInt(startTime.split(":")[0]);
    if (!isNaN(hour)) {
      if (hour >= 5 && hour < 14) {
        return require("../../../assets/shifts/sun.svg");
      } else if (hour >= 14 && hour < 20) {
        return require("../../../assets/shifts/night.svg");
      } else {
        return require("../../../assets/shifts/sleep.svg");
      }
    }
  }

  // Default fallback
  return require("../../../assets/shifts/sun.svg");
};

export default function HomeScreen() {
  const router = useRouter();
  const { language, selectedChalet, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("new");
  const textAlign = 'left';
  const startAlign = 'flex-start';
  const endAlign = 'flex-end';

  const { data: profileResponse, refetch: refetchProfile } = useGetProviderProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse;

  const [markAsCompleted, { isLoading: isStatusLoading }] =
    useMarkBookingCompletedMutation();
  const [createExternalBooking, { isLoading: isCreatingExternal }] =
    useCreateExternalBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] =
    useDeleteExternalBookingMutation();
  const [updateShiftPricingDay, { isLoading: isUpdatingPricing }] =
    useUpdateShiftPricingDayMutation();

  const [externalNotes, setExternalNotes] = React.useState("");
  const [externalCustomerName, setExternalCustomerName] = React.useState("");
  const [externalCustomerPhone, setExternalCustomerPhone] = React.useState("");
  const [baseDate, setBaseDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isFilterByDate] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedBookingId, setSelectedBookingId] = React.useState<
    string | null
  >(null);
  const [selectedShiftForAction, setSelectedShiftForAction] =
    React.useState<any>(null);
  const [showExternalSuccess, setShowExternalSuccess] = React.useState(false);

  const cancelSheetRef = React.useRef<BookingCancellationSheetRef>(null);
  const shiftSheetRef = React.useRef<BottomSheetModal>(null);
  const monthSheetRef = React.useRef<BottomSheetModal>(null);
  const dayScrollRef = React.useRef<ScrollView>(null);
  const listRef = React.useRef<any>(null);

  const [rejectBooking, { isLoading: isRejectLoading }] =
    useRejectBookingMutation();
  const [cancellingBookingData, setCancellingBookingData] =
    React.useState<any>(null);

  const handleOpenCancelSheet = (data: any) => {
    setCancellingBookingData(data);
    const bIsExternal = data.status === "external" || data.bIsExternal;
    const customerName = bIsExternal
      ? data.externalCustomerName
      : (data.customer?.fullName || data.customer?.name);
    const customerPhone = bIsExternal
      ? data.externalCustomerPhone
      : (data.customer?.phone || data.customer?.phoneNumber);

    setTimeout(() => {
      cancelSheetRef.current?.present(customerName, customerPhone);
    }, 100);
  };

  const handleConfirmCancellation = async (reason: string) => {
    if (!cancellingBookingData) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isExternal =
        cancellingBookingData.status === "external" ||
        cancellingBookingData.bIsExternal;

      if (isExternal) {
        await deleteExternalBooking(cancellingBookingData.id).unwrap();
      } else {
        await rejectBooking({
          id: cancellingBookingData.id,
          reason:
            reason || (isRTL ? "إلغاء من قبل المشغل" : "Cancelled by provider") }).unwrap();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshAvailability();

      // Close sheet if it's open
      shiftSheetRef.current?.dismiss();

      // Show success in cancellation sheet
      cancelSheetRef.current?.showSuccess(
        isRTL ? "تم الإلغاء بنجاح." : "Cancelled successfully.",
      );
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      cancelSheetRef.current?.showError(
        e?.data?.message || (isRTL ? "فشل الإلغاء" : "Failed to cancel"),
      );
    }
  };

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2000, i, 1);
      return {
        id: i,
        name: d.toLocaleString(language === "ar" ? "ar-IQ" : "en-US", {
          month: "long" }) };
    });
  }, [language]);

  const weekDays = React.useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const dateString = React.useMemo(
    () => formatDate(selectedDate),
    [selectedDate],
  );

  const [itemLayouts, setItemLayouts] = React.useState<Record<string, number>>(
    {},
  );

  const handleDatePress = (date: Date, index: number) => {
    setSelectedDate(date);
    const key = `date-${index}`;
    if (itemLayouts[key] !== undefined) {
      dayScrollRef.current?.scrollTo({
        x: itemLayouts[key] - 50,
        animated: true });
    }
  };

  React.useEffect(() => {
    const todayIndex = weekDays.findIndex(
      (d) => d.toDateString() === selectedDate.toDateString(),
    );
    if (todayIndex !== -1) {
      const key = `date-${todayIndex}`;
      if (itemLayouts[key] !== undefined) {
        dayScrollRef.current?.scrollTo({
          x: itemLayouts[key] - 50,
          animated: true });
      }
    }
  }, [itemLayouts, selectedDate, weekDays]);

  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
    error: bookingsError,
    refetch: refetchBookings } = useGetProviderBookingsQuery(
    {
      status: API_STATUS_MAP[activeTab],
      date: isFilterByDate ? dateString : undefined,
      chaletId: selectedChalet?.id || undefined,
      page: currentPage,
      limit: 8 },
    { refetchOnMountOrArgChange: true },
  );

  const loadMore = () => {
    if (isBookingsFetching || isBookingsLoading) return;

    const meta = bookingsData?.meta;
    if (meta && meta.page < meta.totalPages) {
      setCurrentPage(meta.page + 1);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleDateChange = (date: Date, index: number) => {
    handleDatePress(date, index);
    setCurrentPage(1);
  };

  const {
    data: availabilityData,
    isFetching: isAvailabilityFetching,
    refetch: refetchAvailabilityData } = useGetShiftAvailabilityQuery(
    {
      chaletId: selectedChalet?.id!,
      from: dateString,
      to: dateString },
    {
      skip: !selectedChalet?.id || selectedChalet?.id === "all",
      refetchOnMountOrArgChange: true },
  );

  const {
    data: daysStatus = [],
    refetch: refetchDaysStatus } = useGetFullyBookedStatusQuery(
    {
      chaletId: selectedChalet?.id!,
      from: formatDate(weekDays[0]),
      to: formatDate(weekDays[weekDays.length - 1]) },
    {
      skip: !selectedChalet?.id || selectedChalet?.id === "all",
      refetchOnMountOrArgChange: true },
  );

  const fullyBookedDays = React.useMemo(() => {
    if (!Array.isArray(daysStatus)) return [];
    return daysStatus.filter((d: any) => d.isFullyBooked).map((d: any) => d.date);
  }, [daysStatus]);

  const refreshAvailability = () => {
    refetchBookings();
    if (selectedChalet?.id) {
      refetchAvailabilityData();
      refetchDaysStatus();
    }
  };

  const changeWeek = (direction: "prev" | "next") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + (direction === "next" ? 7 : -7));
    setBaseDate(newDate);
  };

  const selectMonthYear = (month: number, year: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    newDate.setMonth(month);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (newDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }

    setSelectedDate(newDate);
    setBaseDate(newDate);
    monthSheetRef.current?.dismiss();
  };

  const openBookingDetails = (id: string) => {
    router.push({ pathname: "/(dashboard)/booking-details", params: { id } });
  };

  const openShiftActions = (shift: any) => {
    setSelectedShiftForAction(shift);
    shiftSheetRef.current?.present();
  };

  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );


  const renderShiftsGrid = () => {
    if (isAvailabilityFetching)
      return (
        <ActivityIndicator color={IDENTITY_BLUE} style={{ padding: 20 }} />
      );
    const shifts = Array.isArray(availabilityData) ? availabilityData : [];
    if (shifts.length === 0) return null;

    return (
      <View style={styles.shiftsGridContainer}>
        {shifts.map((shift: any, idx: number) => {
          const name = isRTL
            ? shift.shiftName?.ar || shift.shiftName
            : shift.shiftName?.en || shift.shiftName;
          const isNight = shift.isOvernight;
          const isAvailable = shift.isAvailable;
          const accentColor = isNight ? "#7C3AED" : "#035DF9";
          const bgColor = isNight ? "#F5F3FF" : "#EFF6FF";

          return (
            <TouchableOpacity
              key={shift.shiftId || idx}
              style={[
                styles.shiftTile,
                shift.isClosed ? styles.shiftTileClosed : (!isAvailable && styles.shiftTileBooked),
                {
                  borderLeftWidth: isRTL ? 1 : 4,
                  borderRightWidth: isRTL ? 4 : 1,
                  borderLeftColor: isRTL ? "#F1F5F9" : accentColor,
                  borderRightColor: isRTL ? accentColor : "#F1F5F9" },
              ]}
              onPress={() => openShiftActions(shift)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shiftTileContent,
                  { flexDirection: 'row' },
                ]}
              >
                <View
                  style={[
                    styles.shiftTileCore,
                    { flexDirection: 'row' },
                  ]}
                >
                    <ExpoImage
                      source={getShiftIcon(shift)}
                      style={{
                        width: 28,
                        height: 28,
                      }}
                    />
                  <View
                    style={[
                      styles.shiftNameGroup,
                      { alignItems: startAlign },
                    ]}
                  >
                    <Text
                      style={[styles.shiftTileName, { color: accentColor, textAlign }]}
                    >
                      {name}
                    </Text>
                    <View
                      style={[
                        styles.shiftTimeGroup,
                        { flexDirection: 'row' },
                      ]}
                    >
                      <SolarClockCircleLinear size={14} color="#94A3B8" />
                      <Text style={[styles.shiftTileTime, { textAlign }]}>
                        {format12H(shift.startTime, isRTL)} -{" "}
                        {format12H(shift.endTime, isRTL)}
                      </Text>
                    </View>
                    {!isAvailable && shift.booking && (
                      <View
                        style={[
                          styles.bookingMiniInfo,
                          { flexDirection: 'row', marginTop: 6 },
                        ]}
                      >
                        <SolarUserBold size={12} color={accentColor} />
                        <Text
                          style={[styles.bookingMiniId, { color: accentColor }]}
                          numberOfLines={1}
                        >
                          {shift.booking.customer?.name ||
                            shift.booking.externalCustomerName ||
                            (shift.booking.status === "external"
                              ? isRTL ? "حجز خارجي" : "External"
                              : isRTL ? "زبون" : "Customer")}
                        </Text>
                        {shift.booking.status === "external" && (
                          <View
                            style={[
                              styles.bookingTypeBadge,
                              { backgroundColor: "#FEE2E2" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.bookingTypeBadgeText,
                                { color: "#EF4444" },
                              ]}
                            >
                              {isRTL ? "خارجي" : "External"}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.shiftStatusColumn,
                    {
                      alignItems: endAlign,
                      paddingLeft: isRTL ? 0 : 12,
                      paddingRight: isRTL ? 12 : 0 },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 2,
                      paddingVertical: 2,
                    }}
                  >
                    {/* Glowing outer circle + solid inner circle */}
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: isAvailable
                          ? "rgba(16, 185, 129, 0.15)" // Emerald glow
                          : (shift.isClosed ? "rgba(239, 68, 68, 0.15)" : "rgba(100, 116, 139, 0.15)"),
                        justifyContent: 'center',
                        alignItems: 'center',
                        [isRTL ? "marginLeft" : "marginRight"]: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: isAvailable
                            ? "#10B981"
                            : (shift.isClosed ? "#EF4444" : "#64748B"),
                        }}
                      />
                    </View>
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: isAvailable
                            ? "#059669" // Darker premium emerald green for text
                            : (shift.isClosed ? "#DC2626" : "#64748B"),
                          lineHeight: normalize.font(22),
                          paddingBottom: 2,
                          fontSize: normalize.font(12),
                          fontFamily: "Alexandria-Bold", // Slightly bolder for premium look
                        },
                      ]}
                    >
                      {isAvailable
                        ? isRTL
                          ? "متاح"
                          : "Available"
                        : shift.isClosed
                          ? isRTL
                            ? "مغلق"
                            : "Closed"
                          : isRTL
                            ? "محجوز"
                            : "Booked"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderBookingItem = ({ item, index }: { item: any; index: number }) => {
    const customer = item.customer;
    const customerImageId =
      typeof customer?.image === "string"
        ? customer.image
        : customer?.image?.url || customer?.image?.id || customer?.imageUrl;

    const chaletName = isRTL
      ? item.chalet?.name?.ar || item.chalet?.name
      : item.chalet?.name?.en || item.chalet?.name;
    const customerName = item.status === 'external'
      ? item.externalCustomerName || (isRTL ? "حجز خارجي" : "External Booking")
      : item.customer?.name || t("common.user");
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={{ width: "100%" }}
      >
        <TouchableOpacity
          style={[styles.bookingCard]}
          onPress={() => openBookingDetails(item.id)}
        >
          <View
            style={[
              styles.bookingHeader,
              { flexDirection: 'row' },
            ]}
          >
            <View
              style={[
                styles.customerSection,
                { flexDirection: 'row' },
              ]}
            >
              <View style={styles.avatarPlaceholder}>
                {customerImageId ? (
                  <ExpoImage
                    source={getImageSrc(customerImageId)}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <SolarUserBold size={20} color="#FFF" />
                )}
              </View>
              <View style={{ alignItems: startAlign, flex: 1 }}>
                <Text style={[styles.customerName, { textAlign }]}>{customerName}</Text>
                <Text style={[styles.chaletName, { textAlign }]}>{chaletName}</Text>
              </View>
            </View>
            <View style={{ alignItems: endAlign }}>
              <Text style={[styles.priceText, { textAlign: isRTL ? "left" : "right" }]}>
                {Number(item.totalPrice).toLocaleString()} {t("common.iqd")}
              </Text>
              {item.providerEarnings && (
                <Text
                  style={{
                    fontSize: normalize.font(10),
                    fontFamily: "Alexandria-SemiBold",
                    color: "#16A34A",
                    marginTop: 2,
                    textAlign: isRTL ? "left" : "right" }}
                >
                  {isRTL ? "صافي الربح:" : "Net Earnings:"}{" "}
                  {Number(item.providerEarnings).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
          <View
            style={[
              styles.dateHighlight,
              { flexDirection: 'row', marginTop: 12 },
            ]}
          >
            <SolarCalendarMinimalisticBold size={16} color={IDENTITY_BLUE} />
            <Text style={[styles.dateHighlightText, { textAlign }]}>
              {item.bookingDate} -{" "}
              {isRTL
                ? item.shift?.name?.ar || item.shift?.name
                : item.shift?.name?.en || item.shift?.name}
              {item.shiftStartTime && ` (${item.shiftStartTime.substring(0, 5)} - ${item.shiftEndTime.substring(0, 5)})`}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12 }}
          >
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "confirmed"
                      ? "#ECFDF5"
                      : item.status === "completed" || item.status === "finished"
                        ? "#EFF6FF"
                        : item.status === "cancelled"
                          ? "#FEF2F2"
                          : "#FFFBEB",
                  borderColor:
                    item.status === "confirmed"
                      ? "#10B98120"
                      : item.status === "completed" || item.status === "finished"
                        ? "#3B82F620"
                        : item.status === "cancelled"
                          ? "#EF444420"
                          : "#F59E0B20",
                  borderWidth: 1
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "confirmed"
                        ? "#10B981"
                        : item.status === "completed" || item.status === "finished"
                          ? "#3B82F6"
                          : item.status === "cancelled"
                            ? "#EF4444"
                            : "#F59E0B" },
                ]}
              >
                {(() => {
                  if (item.status === 'completed' || item.status === 'finished') {
                    return isRTL ? 'مدفوع بالكامل' : 'Paid in Full';
                  }
                  if (item.status === 'cancelled') {
                    const wasDepositPaid = item.paymentModel === 'deposit' && (Number(item.depositAmount) > 0);
                    return wasDepositPaid
                      ? (isRTL ? 'مدفوع العربون وملغي' : 'Deposit Paid & Cancelled')
                      : (isRTL ? 'ملغي' : 'Cancelled');
                  }
                  if (item.status === 'confirmed') {
                    const isDeposit = item.paymentModel === 'deposit';
                    return isDeposit
                      ? (isRTL ? 'مؤكد بعربون' : 'Confirmed w/ Deposit')
                      : (isRTL ? 'مدفوع بالكامل' : 'Paid in Full');
                  }
                  return isRTL ? 'انتظار الدفع' : 'Pending';
                })()}
              </Text>
            </View>
            <Text style={[styles.codeText, { textAlign: isRTL ? "left" : "right" }]}>{item.bookingCode}</Text>
          </View>

          {item.paymentModel === "deposit" && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: "space-between",
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#F1F5F9" }}
            >
              <Text
                style={{
                  fontSize: normalize.font(11),
                  fontFamily: "Alexandria-Regular",
                  color: "#64748B",
                  textAlign }}
              >
                {isRTL ? "العربون:" : "Deposit:"}{" "}
                <Text style={{ fontFamily: "Alexandria-SemiBold" }}>
                  {Number(item.depositAmount).toLocaleString()}
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: normalize.font(11),
                  fontFamily: "Alexandria-Regular",
                  color: "#64748B",
                  textAlign: isRTL ? "left" : "right" }}
              >
                {isRTL ? "المتبقي:" : "Remaining:"}{" "}
                <Text style={{ fontFamily: "Alexandria-SemiBold", color: "#EF4444" }}>
                  {Number(item.remainingAmount).toLocaleString()}
                </Text>
              </Text>
            </View>
          )}
          {/* Actions removed as requested */}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (user && (profile ? !profile.isApproved : !user?.isApproved)) {
    return <PendingApprovalScreen onRefresh={refetchProfile} />;
  }

  if (bookingsError) {
    const is404 = (bookingsError as any)?.status === 404;
    const errorMessage = (bookingsError as any)?.data?.message || (bookingsError as any)?.message;
    return (
      <ErrorState
        type={is404 ? "error404" : "failed"}
        message={errorMessage}
        onBack={() => router.back()}
        onRetry={() => refetchBookings()}
      />
    );
  }

  return (
    <View style={[styles.safeArea, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <DashboardHeader
        showLogo={true}
        showSearch={false}
        onSearchPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />


      <View style={styles.calendarContainer}>
        <View
          style={[
            styles.calendarHeader,
            { flexDirection: 'row' },
          ]}
        >
          <TouchableOpacity onPress={() => changeWeek(isRTL ? "prev" : "next")} style={{ padding: 6 }}>
            <ExpoImage
              source={require("../../../assets/button/back.svg")}
              style={{
                width: 13,
                height: 18,
                transform: [{ rotate: isRTL ? '180deg' : '0deg' }]
              }}
            />
          </TouchableOpacity>

          <Text style={styles.monthLabel}>
            {baseDate.toLocaleString(isRTL ? "ar-IQ-u-nu-latn" : "en-US", {
              month: "long",
              year: "numeric" })}
          </Text>

          <TouchableOpacity onPress={() => changeWeek(isRTL ? "next" : "prev")} style={{ padding: 6 }}>
            <ExpoImage
              source={require("../../../assets/button/back.svg")}
              style={{
                width: 13,
                height: 18,
                transform: [{ rotate: isRTL ? '0deg' : '180deg' }]
              }}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.daysScroll,
            { flexDirection: 'row' },
          ]}
        >
          {weekDays.map((date, idx) => {
            const isSelected =
              selectedDate.toDateString() === date.toDateString();
            const isFullyBooked = fullyBookedDays.includes(formatDate(date));
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayItem,
                  isSelected && (isFullyBooked ? styles.selectedFullyBookedDay : styles.selectedDayItem),
                  isFullyBooked && !isSelected && styles.fullyBookedDayItem,
                ]}
                onLayout={(e) => {
                  const x = e.nativeEvent.layout.x;
                  setItemLayouts((prev) => ({ ...prev, [`date-${idx}`]: x }));
                }}
                onPress={() => handleDateChange(date, idx)}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.selectedDayLabel,
                    isFullyBooked && !isSelected && styles.fullyBookedText,
                  ]}
                >
                  {date
                    .toLocaleString(isRTL ? "ar-IQ" : "en-US", {
                      weekday: "short" })
                    .slice(0, 2)}
                </Text>
                <View
                  style={[
                    styles.dateCircle,
                    isSelected && styles.selectedDateCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      isSelected && styles.selectedDateText,
                      isFullyBooked && !isSelected && styles.fullyBookedText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {isFullyBooked && (
                    <View style={styles.scribbleContainer}>
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "-28deg" }], top: "35%", width: "100%" }]} />
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "12deg" }], top: "55%", width: "95%" }]} />
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "-8deg" }], top: "45%", width: "110%" }]} />
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "22deg" }], top: "40%", width: "90%" }]} />
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "-15deg" }], top: "50%", width: "105%" }]} />
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "5deg" }], top: "48%", width: "100%" }]} />
                      <View style={[styles.scribbleLine, { transform: [{ rotate: "-35deg" }], top: "42%", width: "85%" }]} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedChalet?.id && (
        <View style={styles.availabilitySection}>{renderShiftsGrid()}</View>
      )}

      <FlatList
        ref={listRef}
        data={bookingsData?.data || []}
        renderItem={renderBookingItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        style={{ flex: 1 }}
        extraData={bookingsData?.data}
        onRefresh={() => {
          setCurrentPage(1);
          refreshAvailability();
        }}
        refreshing={isBookingsFetching && currentPage === 1}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        keyExtractor={(item: any) => item.id}
        ListFooterComponent={() => {
          if (isBookingsFetching && currentPage > 1) {
            return (
              <ActivityIndicator
                color={IDENTITY_BLUE}
                style={{ marginVertical: 20 }}
              />
            );
          }
          return null;
        }}
      />

      <BottomSheetModal
        ref={shiftSheetRef}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onDismiss={() => {
          setSelectedShiftForAction(null);
          setExternalNotes("");
          setExternalCustomerName("");
          setExternalCustomerPhone("");
          setShowExternalSuccess(false);
        }}
      >
        <BottomSheetView
          style={[styles.sheetContent]}
        >
          {selectedShiftForAction && (
            <>
              {showExternalSuccess ? (
                <View style={styles.successAnimationContainer}>
                  <LottieView
                    source={require("../../../components/icons/motions/success.json")}
                    autoPlay
                    loop={false}
                    onAnimationFinish={() => {
                      shiftSheetRef.current?.dismiss();
                    }}
                    style={[styles.successLottie, { height: 300 }]}
                    resizeMode="contain"
                  />
                  <Text style={styles.successAnimationText}>
                    {isRTL
                      ? "تم تأكيد الحجز الخارجي بنجاح"
                      : "External booking confirmed successfully"}
                  </Text>
                </View>
              ) : selectedShiftForAction.isAvailable ? (
                <View style={{ padding: 24 }}>
                  {/* Premium Shift info summary card header */}
                  <View
                    style={{
                      backgroundColor: "#F8FAFC",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      marginBottom: 24,
                      gap: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={{
                          fontSize: normalize.font(16),
                          fontFamily: "Alexandria-Bold",
                          color: "#1E293B",
                          textAlign,
                        }}
                      >
                        {isRTL
                          ? selectedShiftForAction.shiftName?.ar || selectedShiftForAction.shiftName
                          : selectedShiftForAction.shiftName?.en || selectedShiftForAction.shiftName}
                      </Text>
                      {/* Beautiful glowing dot inside the shift header */}
                      <View
                        style={{
                          backgroundColor: "#ECFDF5",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 9999,
                          borderWidth: 1,
                          borderColor: "#A7F3D0",
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#10B981",
                            [isRTL ? "marginLeft" : "marginRight"]: 6,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: normalize.font(11),
                            fontFamily: "Alexandria-Bold",
                            color: "#059669",
                          }}
                        >
                          {isRTL ? "متاح للحجز" : "Available"}
                        </Text>
                      </View>
                    </View>

                    {/* Date and Time Details */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 16,
                        borderTopWidth: 1,
                        borderTopColor: "#E2E8F0",
                        paddingTop: 12,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <SolarCalendarBold size={16} color={IDENTITY_BLUE} />
                        <Text
                          style={{
                            fontSize: normalize.font(12),
                            fontFamily: "Alexandria-SemiBold",
                            color: "#475569",
                          }}
                        >
                          {dateString}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <SolarClockCircleLinear size={16} color={IDENTITY_BLUE} />
                        <Text
                          style={{
                            fontSize: normalize.font(12),
                            fontFamily: "Alexandria-SemiBold",
                            color: "#475569",
                          }}
                        >
                          {format12H(selectedShiftForAction.startTime, isRTL)} -{" "}
                          {format12H(selectedShiftForAction.endTime, isRTL)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: "100%" }}>
                    {/* Customer Name Input with embedded icon */}
                    <Text
                      style={[
                        styles.inputLabel,
                        { textAlign, color: "#475569", fontFamily: "Alexandria-SemiBold" }
                      ]}
                    >
                      {isRTL ? "اسم الزبون (اختياري)" : "Customer Name (Optional)"}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: "#F8FAFC",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        height: 54,
                        paddingHorizontal: 16,
                        marginBottom: 20,
                        gap: 10,
                      }}
                    >
                      <SolarUserBold size={18} color="#94A3B8" />
                      <BottomSheetTextInput
                        style={{
                          flex: 1,
                          height: "100%",
                          fontFamily: "Alexandria-Regular",
                          fontSize: normalize.font(14),
                          color: "#1E293B",
                          textAlign,
                        }}
                        placeholder={isRTL ? "أدخل اسم الزبون..." : "Enter customer name..."}
                        placeholderTextColor="#94A3B8"
                        value={externalCustomerName}
                        onChangeText={setExternalCustomerName}
                      />
                    </View>

                    {/* Customer Phone Input with embedded icon */}
                    <Text
                      style={[
                        styles.inputLabel,
                        { textAlign, color: "#475569", fontFamily: "Alexandria-SemiBold" }
                      ]}
                    >
                      {isRTL ? "رقم الهاتف (اختياري)" : "Phone Number (Optional)"}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: "#F8FAFC",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        height: 54,
                        paddingHorizontal: 16,
                        marginBottom: 20,
                        gap: 10,
                      }}
                    >
                      <SolarPhoneBold size={18} color="#94A3B8" />
                      <BottomSheetTextInput
                        style={{
                          flex: 1,
                          height: "100%",
                          fontFamily: "Alexandria-Regular",
                          fontSize: normalize.font(14),
                          color: "#1E293B",
                          textAlign,
                        }}
                        placeholder={isRTL ? "07xxxxxxxx" : "07xxxxxxxx"}
                        placeholderTextColor="#94A3B8"
                        value={externalCustomerPhone}
                        onChangeText={setExternalCustomerPhone}
                        keyboardType="phone-pad"
                      />
                    </View>

                    {/* Notes TextArea with modern border container */}
                    <Text
                      style={[
                        styles.inputLabel,
                        { textAlign, color: "#475569", fontFamily: "Alexandria-SemiBold" }
                      ]}
                    >
                      {isRTL
                        ? "ملاحظات إضافية (اختياري)"
                        : "Additional Notes (Optional)"}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        padding: 12,
                        minHeight: 100,
                        marginBottom: 24,
                      }}
                    >
                      <BottomSheetTextInput
                        style={{
                          flex: 1,
                          fontFamily: "Alexandria-Regular",
                          fontSize: normalize.font(14),
                          color: "#1E293B",
                          textAlign,
                          textAlignVertical: "top",
                        }}
                        placeholder={
                          isRTL
                            ? "أدخل أي ملاحظات أخرى (مثال: دفعة مقدمة)..."
                            : "Enter any other notes (e.g. down payment)..."
                        }
                        placeholderTextColor="#94A3B8"
                        value={externalNotes}
                        onChangeText={setExternalNotes}
                        multiline
                      />
                    </View>

                    <SecondaryButton
                      label={
                        isRTL
                          ? "تأكيد الحجز الخارجي"
                          : "Confirm External Booking"
                      }
                      onPress={async () => {
                        try {
                          console.log("Starting external booking creation...");
                          const result = await createExternalBooking({
                            chaletId: selectedChalet?.id!,
                            shiftId:
                              selectedShiftForAction.shiftId ||
                              selectedShiftForAction.id,
                            date: dateString,
                            notes: externalNotes,
                            customerName: externalCustomerName,
                            customerPhone: externalCustomerPhone }).unwrap();
                          console.log("Booking created successfully:", result);

                          refreshAvailability();
                          setExternalNotes("");
                          setShowExternalSuccess(true);
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success,
                          );

                          // Fallback: If animation doesn't finish or play, dismiss after 3 seconds
                          setTimeout(() => {
                            shiftSheetRef.current?.dismiss();
                          }, 3500);
                        } catch (e: any) {
                          console.error("External booking failed:", e);
                          Alert.alert("Error", e?.data?.message || "Failed");
                        }
                      }}
                      isActive={true}
                      activeColor={IDENTITY_BLUE}
                      isLoading={isCreatingExternal}
                      style={{ height: 50 }}
                    />
                  </View>
                </View>
              ) : selectedShiftForAction.isClosed ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <View style={[styles.avatarPlaceholder, { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F1F5F9", marginBottom: 20 }]}>
                    <SolarLockBold size={40} color="#64748B" />
                  </View>
                  <Text style={[styles.sheetTitle, { marginBottom: 8 }]}>
                    {isRTL ? "هذه الفترة مغلقة" : "This shift is closed"}
                  </Text>
                  <Text style={{ textAlign: "center", color: "#64748B", fontFamily: "Alexandria-Regular", fontSize: normalize.font(14), marginBottom: 32 }}>
                    {isRTL
                      ? "لقد قمت بإغلاق هذه الفترة يدوياً. لن يتمكن الزبائن من حجزها حتى تقوم بإعادة فتحها."
                      : "You have manually closed this shift. Customers won't be able to book it until you reopen it."}
                  </Text>

                  <SecondaryButton
                    label={isRTL ? "إلغاء الإغلاق (إعادة الفتح)" : "Un-close (Reopen)"}
                    onPress={async () => {
                      try {
                        if (!selectedShiftForAction.pricingId) {
                          throw new Error("Pricing ID not found");
                        }
                        await updateShiftPricingDay({
                          shiftId: selectedShiftForAction.shiftId || selectedShiftForAction.id,
                          pricingId: selectedShiftForAction.pricingId,
                          price: 50000, // Default price or could be something else
                        }).unwrap();

                        refreshAvailability();
                        shiftSheetRef.current?.dismiss();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch (e: any) {
                        Alert.alert("Error", e?.data?.message || "Failed to reopen");
                      }
                    }}
                    isActive={true}
                    activeColor={IDENTITY_BLUE}
                    isLoading={isUpdatingPricing}
                    style={{ height: 56, width: "100%" }}
                  />
                </View>
              ) : (
                <View style={{ padding: 24 }}>
                  <View style={{ alignItems: "center", marginBottom: 28 }}>
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        {
                          width: 72,
                          height: 72,
                          borderRadius: 24,
                          marginBottom: 16,
                          elevation: 4,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.1,
                          shadowRadius: 8 },
                      ]}
                    >
                      {(() => {
                        const customer = selectedShiftForAction.booking?.customer;
                        const customerImageId =
                          typeof customer?.image === "string"
                            ? customer.image
                            : customer?.image?.url ||
                            customer?.image?.id ||
                            customer?.imageUrl;

                        return customerImageId ? (
                          <ExpoImage
                            source={getImageSrc(customerImageId)}
                            style={{ width: "100%", height: "100%" }}
                          />
                        ) : (
                          <SolarUserBold size={36} color="#FFF" />
                        );
                      })()}
                    </View>
                    <Text
                      style={[
                        styles.sheetTitle,
                        { marginBottom: 2, fontSize: normalize.font(20) },
                      ]}
                    >
                      {selectedShiftForAction.booking?.customer?.name ||
                        selectedShiftForAction.booking?.externalCustomerName ||
                        (selectedShiftForAction.booking?.status === "external"
                          ? isRTL
                            ? "حجز خارجي"
                            : "External Booking"
                          : isRTL
                            ? "زبون"
                            : "Customer")}
                    </Text>
                    {(selectedShiftForAction.booking?.customer?.phone ||
                      selectedShiftForAction.booking?.externalCustomerPhone) && (
                        <Text
                          style={[
                            styles.customerPhone,
                            { marginBottom: 8, direction: "ltr" },
                          ]}
                        >
                          {selectedShiftForAction.booking?.customer?.phone ||
                            selectedShiftForAction.booking?.externalCustomerPhone}
                        </Text>
                      )}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: "center",
                        gap: 8 }}
                    >
                      <Text
                        style={{
                          color: "#64748B",
                          fontFamily: "Alexandria-SemiBold",
                          fontSize: normalize.font(14),
                          letterSpacing: 0.5 }}
                      >
                        {selectedShiftForAction.booking?.bookingCode || "#---"}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            backgroundColor:
                              selectedShiftForAction.booking?.status ===
                                "confirmed"
                                ? "#ECFDF5"
                                : selectedShiftForAction.booking?.status ===
                                  "external"
                                  ? "#FEF2F2"
                                  : "#F1F5F9",
                            borderColor: "transparent",
                            borderRadius: 6 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              fontSize: normalize.font(11),
                              color:
                                selectedShiftForAction.booking?.status ===
                                  "confirmed"
                                  ? "#10B981"
                                  : selectedShiftForAction.booking?.status ===
                                    "external"
                                    ? "#EF4444"
                                    : "#64748B" },
                          ]}
                        >
                          {selectedShiftForAction.booking?.status ===
                            "confirmed"
                            ? isRTL
                              ? "حجز مؤكد"
                              : "Confirmed"
                            : selectedShiftForAction.booking?.status ===
                              "external"
                              ? isRTL
                                ? "حجز خارجي"
                                : "External"
                              : selectedShiftForAction.booking?.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: "#F1F5F9",
                      marginBottom: 24 }}
                  />

                  <View style={{ gap: 14 }}>
                    <SecondaryButton
                      label={
                        isRTL ? "عرض تفاصيل الحجز" : "View Booking Details"
                      }
                      onPress={() => {
                        shiftSheetRef.current?.dismiss();
                        openBookingDetails(
                          selectedShiftForAction.booking?.id ||
                          selectedShiftForAction.bookingId,
                        );
                      }}
                      isActive={true}
                      activeColor={IDENTITY_BLUE}
                      style={{ height: 56, width: "100%" }}
                    />

                    {(selectedShiftForAction.booking?.status === "confirmed" ||
                      selectedShiftForAction.booking?.status === "external" ||
                      selectedShiftForAction.booking?.status ===
                      "pending_payment") && (
                        <SecondaryButton
                          label={isRTL ? "إلغاء الحجز" : "Cancel Booking"}
                          onPress={() => {
                            shiftSheetRef.current?.dismiss();
                            handleOpenCancelSheet(
                              selectedShiftForAction.booking,
                            );
                          }}
                          isActive={true}
                          activeColor="#EF4444"
                          style={{ height: 56, width: "100%" }}
                        />
                      )}
                  </View>
                </View>
              )}
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      <BookingCancellationSheet
        ref={cancelSheetRef}
        onConfirm={handleConfirmCancellation}
        isLoading={isRejectLoading || isDeletingExternal}
        isRTL={isRTL}
        isExternal={cancellingBookingData?.status === "external" || cancellingBookingData?.bIsExternal}
        depositAmount={cancellingBookingData?.depositAmount || 0}
        totalPrice={cancellingBookingData?.totalPrice || 0}
        paymentModel={cancellingBookingData?.paymentModel || 'deposit'}
      />

      <BottomSheetModal
        ref={monthSheetRef}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetView style={[styles.sheetContent]}>
          <View style={{ padding: 24 }}>
            <View
              style={[
                styles.sheetHeaderLabelRow,
                { flexDirection: 'row' },
              ]}
            >
              <View style={styles.modalIconCircle}>
                <SolarCalendarBold size={20} color={IDENTITY_BLUE} />
              </View>
              <Text
                style={[
                  styles.sheetTitle,
                  { textAlign, marginBottom: 0 },
                ]}
              >
                {isRTL ? "تحديد الفترة" : "Select Period"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                height: 300,
                gap: 16,
                marginTop: 24 }}
            >
              {/* Month Selection */}
              <View style={{ flex: 1.5 }}>
                <Text
                  style={[
                    styles.pickerColLabel,
                    { textAlign },
                  ]}
                >
                  {isRTL ? "الشهر" : "Month"}
                </Text>
                <BottomSheetScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {months.map((m) => {
                    const isSelected = selectedDate.getMonth() === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() =>
                          selectMonthYear(m.id, selectedDate.getFullYear())
                        }
                        style={[
                          styles.pickerItemNew,
                          { flexDirection: 'row' },
                          isSelected && styles.pickerItemActiveNew,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerItemTextNew,
                            isSelected && styles.pickerItemTextActiveNew,
                          ]}
                        >
                          {m.name}
                        </Text>
                        {isSelected && <View style={styles.activeDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </BottomSheetScrollView>
              </View>

              {/* Year Selection */}
              <View
                style={{
                  flex: 1,
                  borderLeftWidth: isRTL ? 0 : 1,
                  borderRightWidth: isRTL ? 1 : 0,
                  borderColor: "#F1F5F9",
                  paddingLeft: isRTL ? 0 : 16,
                  paddingRight: isRTL ? 16 : 0 }}
              >
                <Text
                  style={[
                    styles.pickerColLabel,
                    { textAlign },
                  ]}
                >
                  {isRTL ? "السنة" : "Year"}
                </Text>
                <BottomSheetScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {years.map((y) => {
                    const isSelected = selectedDate.getFullYear() === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        onPress={() =>
                          selectMonthYear(selectedDate.getMonth(), y)
                        }
                        style={[
                          styles.pickerItemNew,
                          { flexDirection: 'row' },
                          isSelected && styles.pickerItemActiveNew,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerItemTextNew,
                            isSelected && styles.pickerItemTextActiveNew,
                          ]}
                        >
                          {y}
                        </Text>
                        {isSelected && <View style={styles.activeDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </BottomSheetScrollView>
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  tabContainer: {
    paddingHorizontal: normalize.width(16),
    marginBottom: normalize.height(12) },
  tabs: {
    backgroundColor: "#F1F5F9",
    borderRadius: normalize.radius(12),
    padding: normalize.width(4) },
  tab: {
    flex: 1,
    paddingVertical: normalize.height(10),
    alignItems: "center",
    borderRadius: normalize.radius(10) },
  activeTab: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4 },
  tabText: {
    fontSize: normalize.font(14),
    color: "#64748B",
    fontFamily: "Alexandria-SemiBold",
    paddingVertical: normalize.height(2),
    lineHeight: normalize.font(20) },
  activeTabText: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-SemiBold",
    paddingVertical: normalize.height(2),
    lineHeight: normalize.font(20) },
  filterRow: {
    paddingHorizontal: normalize.width(16),
    marginBottom: normalize.height(16),
    justifyContent: "space-between",
    alignItems: "center" },
  filterToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  filterToggleText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: "#64748B" },
  todayButton: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: "center" },
  todayButtonText: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-SemiBold",
    fontSize: normalize.font(12),
    lineHeight: normalize.font(16) },
  calendarContainer: {
    paddingHorizontal: normalize.width(16),
    marginBottom: normalize.height(16) },
  calendarHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize.height(12) },
  monthLabel: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-SemiBold",
    color: IDENTITY_BLUE },
  daysScroll: { gap: normalize.width(10) },
  dayItem: {
    alignItems: "center",
    width: normalize.width(45),
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(12) },
  selectedDayItem: { backgroundColor: IDENTITY_BLUE },
  dayLabel: {
    fontSize: normalize.font(12),
    color: "#64748B",
    marginBottom: 4,
    fontFamily: "Alexandria-Regular" },
  selectedDayLabel: {
    color: "#FFF",
    fontFamily: "Alexandria-Regular",
    lineHeight: normalize.font(16) },
  dateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center" },
  selectedDateCircle: { backgroundColor: "#FFF" },
  scribbleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10 },
  scribbleLine: {
    position: "absolute",
    height: 0.8,
    backgroundColor: "#94A3B8",
    opacity: 0.7 },
  fullyBookedDayItem: {
    // Original background
  },
  fullyBookedText: {
    color: "#94A3B8" },
  dateText: { fontSize: normalize.font(14), fontFamily: "Alexandria-SemiBold" },
  selectedDateText: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-Regular",
    lineHeight: normalize.font(18) },
  selectedFullyBookedDay: {
    backgroundColor: "#94A3B8", // Gray background for the whole item
  },
  availabilitySection: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9" },
  chaletChipsScroll: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  chaletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0" },
  chaletChipActive: {
    backgroundColor: IDENTITY_BLUE,
    borderColor: IDENTITY_BLUE },
  chaletChipText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-SemiBold",
    lineHeight: normalize.font(16),
    paddingTop: normalize.height(2) },

  shiftsGridContainer: { paddingHorizontal: 16, gap: 12 },
  shiftTile: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderLeftWidth: 4, // Accent border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden" },
  shiftTileBooked: { opacity: 0.6, backgroundColor: "#F8FAFC" },
  shiftTileClosed: {
    opacity: 0.9,
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE4E6",
    borderStyle: "dashed"
  },
  shiftTileContent: {
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center" },
  shiftTileCore: { gap: 12, alignItems: "center", flex: 1 },
  shiftIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center" },
  shiftNameGroup: { gap: 2, flex: 1 },
  shiftTileName: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-SemiBold",
    lineHeight: normalize.font(22),
    paddingBottom: 4,
  },
  shiftTimeGroup: { alignItems: "center", gap: 4 },
  shiftTileTime: {
    fontSize: normalize.font(12),
    color: "#94A3B8",
    fontFamily: "Alexandria-SemiBold" },
  shiftStatusColumn: { paddingLeft: 12 },
  statusGlassBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1 },
  statusBadgeText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-SemiBold",
    lineHeight: normalize.font(18),
    paddingVertical: normalize.height(2) },

  bookingMiniInfo: { marginTop: 6, alignItems: "center", gap: 6 },
  bookingMiniId: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-SemiBold",
    letterSpacing: 0.5,
    flexShrink: 1, // Prevent pushing the badge off-screen
    lineHeight: normalize.font(16),
    paddingBottom: 2,
  },
  bookingTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookingTypeBadgeText: {
    fontSize: normalize.font(9),
    fontFamily: "Alexandria-SemiBold",
    textTransform: "uppercase",
    lineHeight: normalize.font(13),
    paddingBottom: 1,
  },

  noAvailabilityText: {
    textAlign: "center",
    color: "#64748B",
    fontFamily: "Alexandria-SemiBold" },
  bookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9" },
  bookingHeader: { justifyContent: "space-between", alignItems: "center" },
  customerSection: { gap: 10, alignItems: "center" },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: IDENTITY_BLUE,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden" },
  customerName: { fontSize: normalize.font(15), fontFamily: "Alexandria-SemiBold" },
  chaletName: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Regular" },
  priceText: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-SemiBold",
    color: IDENTITY_BLUE },
  dateHighlight: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    gap: 8,
    alignItems: "center" },
  dateHighlightText: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-SemiBold",
    color: "#1E293B" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center" },
  statusText: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-SemiBold",
    lineHeight: normalize.font(16) },
  codeText: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Medium" },
  sheetLoading: { padding: 50, alignItems: "center" },
  sheetScroll: { padding: 20 },
  sheetTopRow: { marginBottom: 20 },
  sheetHeroTitle: { fontSize: normalize.font(18), fontFamily: "Alexandria-SemiBold" },
  customerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16 },
  customerRow: { alignItems: "center" },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: IDENTITY_BLUE,
    justifyContent: "center",
    alignItems: "center" },
  customerAvatarImg: { width: 44, height: 44, borderRadius: 12 },
  customerNameSheet: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-SemiBold" },
  customerPhone: {
    fontSize: normalize.font(13),
    color: "#64748B",
    fontFamily: "Alexandria-Regular" },
  contactActions: { gap: 8 },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1 },
  contactBtnCall: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  contactBtnChat: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" },
  detailCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9" },
  detailCardHeader: { alignItems: "center", gap: 8, marginBottom: 8 },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center" },
  detailCardTitle: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-SemiBold",
    flex: 1 },
  detailSubRow: {
    paddingLeft: 40,
    alignItems: "center",
    gap: 6,
    marginBottom: 12 },
  detailSubText: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Regular" },
  scheduleBlock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    overflow: "hidden" },
  scheduleRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
    gap: 8 },
  scheduleDate: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-SemiBold",
    flex: 1 },
  shiftChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6 },
  shiftChipText: { fontSize: normalize.font(10), fontFamily: "Alexandria-SemiBold" },
  timeLabel: {
    fontSize: normalize.font(10),
    color: "#94A3B8",
    fontFamily: "Alexandria-SemiBold",
    textTransform: "uppercase" },
  timeValue: { fontSize: normalize.font(14), fontFamily: "Alexandria-SemiBold" },
  timeArrow: { paddingHorizontal: 8 },
  paymentTotalValue: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-SemiBold",
    color: IDENTITY_BLUE },
  paymentCard: { padding: 12, backgroundColor: "#F8FAFC", borderRadius: 10 },
  paymentTotalRow: { justifyContent: "space-between", alignItems: "center" },
  paymentTotalLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-SemiBold" },
  sheetContent: { paddingBottom: normalize.height(24) },
  sheetTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-SemiBold",
    marginBottom: 16 },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontFamily: "Alexandria-Regular",
    fontSize: normalize.font(14) },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 16,
    minHeight: 100,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontFamily: "Alexandria-Regular",
    fontSize: normalize.font(14),
    textAlignVertical: "top" },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: "#64748B",
    marginBottom: 8 },
  timeBlock: { gap: 2 },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE" },
  sheetHeaderLabelRow: { alignItems: "center", gap: 8 },
  pickerColLabel: {
    fontSize: normalize.font(12),
    color: "#94A3B8",
    fontFamily: "Alexandria-SemiBold",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5 },
  pickerItemNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4 },
  pickerItemActiveNew: { backgroundColor: "#F0F9FF" },
  pickerItemTextNew: {
    fontSize: normalize.font(15),
    color: "#64748B",
    fontFamily: "Alexandria-SemiBold" },
  pickerItemTextActiveNew: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-SemiBold" },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IDENTITY_BLUE },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center" },
  notesContainer: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9" },
  notesLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-SemiBold",
    color: IDENTITY_BLUE },
  notesText: {
    fontSize: normalize.font(13),
    color: "#475569",
    lineHeight: 18,
    fontFamily: "Alexandria-Regular" },
  row: { flexDirection: "row" },
  successAnimationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300 },
  successLottie: {
    width: "100%",
    height: 400 },
  successAnimationText: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-SemiBold",
    color: IDENTITY_BLUE,
    marginTop: 16,
    textAlign: "center" } });
