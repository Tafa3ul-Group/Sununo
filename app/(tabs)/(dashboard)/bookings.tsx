import {
  BookingCancellationSheet,
  BookingCancellationSheetRef,
} from "@/components/booking-cancellation-modal";
import { HeaderSection } from "@/components/header-section";
import {
  SolarAddCircleBold,
  SolarAltArrowDownLinear,
  SolarAltArrowLeftLinear,
  SolarAltArrowRightLinear,
  SolarCalendarBold,
  SolarCalendarMinimalisticBold,
  SolarClockCircleLinear,
  SolarLockBold,
  SolarUserBold,
} from "@/components/icons/solar-icons";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import {
  useCreateExternalBookingMutation,
  useDeleteExternalBookingMutation,
  useGetProviderBookingsQuery,
  useGetShiftAvailabilityQuery,
  useMarkBookingCompletedMutation,
  useRejectBookingMutation,
} from "@/store/api/apiSlice";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

// Status mapping from UI to API
const API_STATUS_MAP: Record<string, string> = {
  new: "pending_payment",
  confirmed: "confirmed",
  finished: "completed",
  cancelled: "cancelled",
};

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

export default function BookingsScreen() {
  const router = useRouter();
  const { language, selectedChalet } = useSelector(
    (state: RootState) => state.auth,
  );
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("new");
  const isRTL = language === "ar";

  const [markAsCompleted, { isLoading: isStatusLoading }] =
    useMarkBookingCompletedMutation();
  const [createExternalBooking, { isLoading: isCreatingExternal }] =
    useCreateExternalBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] =
    useDeleteExternalBookingMutation();

  const [externalNotes, setExternalNotes] = React.useState("");
  const [baseDate, setBaseDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isFilterByDate] = React.useState(true);
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

  const [rejectBooking, { isLoading: isRejectLoading }] =
    useRejectBookingMutation();
  const [cancellingBookingData, setCancellingBookingData] =
    React.useState<any>(null);

  const handleOpenCancelSheet = (data: any) => {
    setCancellingBookingData(data);
    setTimeout(() => {
      cancelSheetRef.current?.present();
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
            reason || (isRTL ? "إلغاء من قبل المشغل" : "Cancelled by provider"),
        }).unwrap();
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
          month: "long",
        }),
      };
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
        animated: true,
      });
    }
  };

  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
  } = useGetProviderBookingsQuery(
    {
      status: API_STATUS_MAP[activeTab],
      date: isFilterByDate ? dateString : undefined,
      chaletId: selectedChalet?.id || undefined,
    },
    { refetchOnMountOrArgChange: true },
  );

  const {
    data: availabilityData,
    isFetching: isAvailabilityFetching,
    refetch: refetchAvailabilityData,
  } = useGetShiftAvailabilityQuery(
    {
      chaletId: selectedChalet?.id!,
      from: dateString,
      to: dateString,
    },
    {
      skip:
        !selectedChalet?.id || selectedChalet?.id === "all" || !isFilterByDate,
      refetchOnMountOrArgChange: true,
    },
  );

  const refreshAvailability = () => {
    refetchBookings();
    if (selectedChalet?.id) refetchAvailabilityData();
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
                !isAvailable && styles.shiftTileBooked,
                { borderLeftColor: accentColor },
              ]}
              onPress={() => openShiftActions(shift)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.shiftTileContent,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View
                  style={[
                    styles.shiftTileCore,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <View
                    style={[
                      styles.shiftNameGroup,
                      { alignItems: isRTL ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text
                      style={[styles.shiftTileName, { color: accentColor }]}
                    >
                      {name}
                    </Text>
                    <View
                      style={[
                        styles.shiftTimeGroup,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <SolarClockCircleLinear size={14} color="#94A3B8" />
                      <Text style={styles.shiftTileTime}>
                        {format12H(shift.startTime, isRTL)} -{" "}
                        {format12H(shift.endTime, isRTL)}
                      </Text>
                    </View>
                    {!isAvailable && shift.booking && (
                      <View
                        style={[
                          styles.bookingMiniInfo,
                          { flexDirection: isRTL ? "row-reverse" : "row" },
                        ]}
                      >
                        <Text
                          style={[styles.bookingMiniId, { color: accentColor }]}
                        >
                          #
                          {shift.booking.bookingCode?.split("-").slice(-1)[0] ||
                            "---"}
                        </Text>
                        <View
                          style={[
                            styles.bookingTypeBadge,
                            {
                              backgroundColor:
                                shift.booking.status === "external"
                                  ? "#FEE2E2"
                                  : "#DBEAFE",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bookingTypeBadgeText,
                              {
                                color:
                                  shift.booking.status === "external"
                                    ? "#EF4444"
                                    : IDENTITY_BLUE,
                              },
                            ]}
                          >
                            {shift.booking.status === "external"
                              ? isRTL
                                ? "خارجي"
                                : "External"
                              : isRTL
                                ? "تطبيق"
                                : "App"}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.shiftStatusColumn,
                    { alignItems: isRTL ? "flex-start" : "flex-end" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusGlassBadge,
                      {
                        backgroundColor: isAvailable ? "#DCFCE7" : "#F1F5F9",
                        borderColor: isAvailable ? "#BBF7D0" : "#E2E8F0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isAvailable ? "#16A34A" : "#64748B" },
                      ]}
                    >
                      {isAvailable
                        ? isRTL
                          ? "متاح"
                          : "Available"
                        : isRTL
                          ? "محجوز"
                          : "Booked"}
                    </Text>
                    {isAvailable ? (
                      <SolarAddCircleBold
                        size={14}
                        color="#16A34A"
                        style={{ [isRTL ? "marginRight" : "marginLeft"]: 6 }}
                      />
                    ) : (
                      <SolarLockBold
                        size={14}
                        color="#64748B"
                        style={{ [isRTL ? "marginRight" : "marginLeft"]: 6 }}
                      />
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const chaletName = isRTL
      ? item.chalet?.name?.ar || item.chalet?.name
      : item.chalet?.name?.en || item.chalet?.name;
    const customerName = item.customer?.name || t("common.user");
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => openBookingDetails(item.id)}
      >
        <View
          style={[
            styles.bookingHeader,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View
            style={[
              styles.customerSection,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={styles.avatarPlaceholder}>
              <SolarUserBold size={20} color="#FFF" />
            </View>
            <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.chaletName}>{chaletName}</Text>
            </View>
          </View>
          <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
            <Text style={styles.priceText}>
              {Number(item.totalPrice).toLocaleString()} {t("common.iqd")}
            </Text>
            {item.providerEarnings && (
              <Text
                style={{
                  fontSize: normalize.font(10),
                  fontFamily: "Alexandria-Bold",
                  color: "#16A34A",
                  marginTop: 2,
                }}
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
            { flexDirection: isRTL ? "row-reverse" : "row", marginTop: 12 },
          ]}
        >
          <SolarCalendarMinimalisticBold size={16} color={IDENTITY_BLUE} />
          <Text style={styles.dateHighlightText}>
            {item.bookingDate} -{" "}
            {isRTL
              ? item.shift?.name?.ar || item.shift?.name
              : item.shift?.name?.en || item.shift?.name}
          </Text>
        </View>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === "confirmed"
                      ? "#DCFCE7"
                      : item.status === "completed"
                        ? "#DBEAFE"
                        : item.status === "cancelled"
                          ? "#FEE2E2"
                          : "#FEF3C7",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === "confirmed"
                        ? "#16A34A"
                        : item.status === "completed"
                          ? "#1E40AF"
                          : item.status === "cancelled"
                            ? "#EF4444"
                            : "#D97706",
                  },
                ]}
              >
                {t(`dashboard.bookings.status.${item.status}`)}
              </Text>
            </View>
            <Text style={styles.codeText}>#{item.bookingCode}</Text>
          </View>

          {item.paymentModel === "deposit" && (
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                justifyContent: "space-between",
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: "#F1F5F9",
              }}
            >
              <Text
                style={{
                  fontSize: normalize.font(11),
                  fontFamily: "Alexandria-Regular",
                  color: "#64748B",
                }}
              >
                {isRTL ? "العربون:" : "Deposit:"}{" "}
                <Text style={{ fontFamily: "Alexandria-Bold" }}>
                  {Number(item.depositAmount).toLocaleString()}
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: normalize.font(11),
                  fontFamily: "Alexandria-Regular",
                  color: "#64748B",
                }}
              >
                {isRTL ? "المتبقي:" : "Remaining:"}{" "}
                <Text style={{ fontFamily: "Alexandria-Bold", color: "#EF4444" }}>
                  {Number(item.remainingAmount).toLocaleString()}
                </Text>
              </Text>
            </View>
          )}
        {item.status === "confirmed" && (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              gap: 12,
              marginTop: 16,
            }}
          >
            <SecondaryButton
              label={t("dashboard.bookings.complete")}
              onPress={async () => {
                try {
                  await markAsCompleted(item.id).unwrap();
                  refreshAvailability();
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                } catch (e) {
                  Alert.alert("Error", "Update failed");
                }
              }}
              isLoading={isStatusLoading}
              isActive={true}
              activeColor={Colors.primary}
              style={{ flex: 1, height: 44 }}
            />
            <SecondaryButton
              label={t("dashboard.bookings.cancel")}
              onPress={() => handleOpenCancelSheet(item)}
              isLoading={isRejectLoading || isDeletingExternal}
              isActive={true}
              activeColor="#EF4444"
              style={{ flex: 1, height: 44 }}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection
        title={isRTL ? "الحجوزات" : "Bookings"}
        showBackButton={true}
        showSearch={false}
        showCategories={false}
        showExtra={false}
      />

      <View style={styles.tabContainer}>
        <View
          style={[styles.tabs, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "new" && styles.activeTab]}
            onPress={() => setActiveTab("new")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "new" && styles.activeTabText,
              ]}
            >
              {isRTL ? "انتظار الدفع" : "Pending"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "confirmed" && styles.activeTab]}
            onPress={() => setActiveTab("confirmed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "confirmed" && styles.activeTabText,
              ]}
            >
              {isRTL ? "المؤكدة" : "Confirmed"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "finished" && styles.activeTab]}
            onPress={() => setActiveTab("finished")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "finished" && styles.activeTabText,
              ]}
            >
              {isRTL ? "المنتهية" : "Finished"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "cancelled" && styles.activeTab]}
            onPress={() => setActiveTab("cancelled")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "cancelled" && styles.activeTabText,
              ]}
            >
              {isRTL ? "الملغاة" : "Cancelled"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <View
          style={[
            styles.calendarHeader,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity onPress={() => changeWeek(isRTL ? "prev" : "next")}>
            {isRTL ? (
              <SolarAltArrowRightLinear size={20} color="#64748B" />
            ) : (
              <SolarAltArrowLeftLinear size={20} color="#64748B" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => monthSheetRef.current?.present()}
            style={styles.monthSelector}
          >
            <Text style={styles.monthLabel}>
              {baseDate.toLocaleString(isRTL ? "ar-IQ" : "en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <SolarAltArrowDownLinear
              size={14}
              color={IDENTITY_BLUE}
              style={{ [isRTL ? "marginRight" : "marginLeft"]: 4 }}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => changeWeek(isRTL ? "next" : "prev")}>
            {isRTL ? (
              <SolarAltArrowLeftLinear size={20} color="#64748B" />
            ) : (
              <SolarAltArrowRightLinear size={20} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.daysScroll,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          {weekDays.map((date, idx) => {
            const isSelected =
              selectedDate.toDateString() === date.toDateString();
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayItem, isSelected && styles.selectedDayItem]}
                onLayout={(e) => {
                  const x = e.nativeEvent.layout.x;
                  setItemLayouts((prev) => ({ ...prev, [`date-${idx}`]: x }));
                }}
                onPress={() => handleDatePress(date, idx)}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.selectedDayLabel,
                  ]}
                >
                  {date
                    .toLocaleString(isRTL ? "ar-IQ" : "en-US", {
                      weekday: "short",
                    })
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
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedChalet?.id && (
        <View style={styles.availabilitySection}>{renderShiftsGrid()}</View>
      )}

      <FlashList
        data={bookingsData?.data || []}
        renderItem={renderBookingItem}
        // @ts-ignore
        estimatedItemSize={150}
        contentContainerStyle={{ padding: 16 }}
        onRefresh={refreshAvailability}
        refreshing={isBookingsLoading}
      />

      <BottomSheetModal
        ref={shiftSheetRef}
        snapPoints={selectedShiftForAction?.isAvailable ? ["60%"] : ["85%"]}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onDismiss={() => {
          setSelectedShiftForAction(null);
          setExternalNotes("");
          setShowExternalSuccess(false);
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
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
                  <Text
                    style={[
                      styles.sheetTitle,
                      { textAlign: isRTL ? "right" : "left", marginBottom: 24 },
                    ]}
                  >
                    {isRTL
                      ? selectedShiftForAction.shiftName?.ar ||
                        selectedShiftForAction.shiftName
                      : selectedShiftForAction.shiftName?.en ||
                        selectedShiftForAction.shiftName}
                  </Text>
                  <View style={{ width: "100%" }}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {isRTL
                        ? "ملاحظات الحجز الخارجي"
                        : "External Booking Notes"}
                    </Text>
                    <BottomSheetTextInput
                      style={[
                        styles.textInput,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                      placeholder={
                        isRTL
                          ? "اسم الزبون، ملاحظات إضافية..."
                          : "Customer name, notes..."
                      }
                      value={externalNotes}
                      onChangeText={setExternalNotes}
                      multiline
                    />
                    <SecondaryButton
                      label={
                        isRTL
                          ? "تأكيد الإغلاق الخارجي"
                          : "Confirm External Closing"
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
                          }).unwrap();
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
              ) : (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { textAlign: "center", marginBottom: 24 },
                    ]}
                  >
                    {isRTL ? "الحجز موجود" : "Booking Exists"}
                  </Text>
                  <SecondaryButton
                    label={isRTL ? "عرض تفاصيل الحجز" : "View Booking Details"}
                    onPress={() => {
                      shiftSheetRef.current?.dismiss();
                      openBookingDetails(
                        selectedShiftForAction.booking?.id ||
                          selectedShiftForAction.bookingId,
                      );
                    }}
                    isActive={true}
                    activeColor={IDENTITY_BLUE}
                    style={{ height: 50, width: "100%" }}
                  />
                </View>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      <BookingCancellationSheet
        ref={cancelSheetRef}
        onConfirm={handleConfirmCancellation}
        isLoading={isRejectLoading || isDeletingExternal}
        isRTL={isRTL}
        isExternal={
          cancellingBookingData?.status === "external" ||
          cancellingBookingData?.bIsExternal
        }
        depositAmount={cancellingBookingData?.downPayment || "50,000"}
      />

      <BottomSheetModal
        ref={monthSheetRef}
        snapPoints={["50%"]}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={{ padding: 24 }}>
            <View
              style={[
                styles.sheetHeaderLabelRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View style={styles.modalIconCircle}>
                <SolarCalendarBold size={20} color={IDENTITY_BLUE} />
              </View>
              <Text
                style={[
                  styles.sheetTitle,
                  { textAlign: isRTL ? "right" : "left", marginBottom: 0 },
                ]}
              >
                {isRTL ? "تحديد الفترة" : "Select Period"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                height: 300,
                gap: 16,
                marginTop: 24,
              }}
            >
              {/* Month Selection */}
              <View style={{ flex: 1.5 }}>
                <Text
                  style={[
                    styles.pickerColLabel,
                    { textAlign: isRTL ? "right" : "left" },
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
                  paddingRight: isRTL ? 16 : 0,
                }}
              >
                <Text
                  style={[
                    styles.pickerColLabel,
                    { textAlign: isRTL ? "right" : "left" },
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  tabContainer: {
    paddingHorizontal: normalize.width(16),
    marginBottom: normalize.height(12),
  },
  tabs: {
    backgroundColor: "#F1F5F9",
    borderRadius: normalize.radius(12),
    padding: normalize.width(4),
  },
  tab: {
    flex: 1,
    paddingVertical: normalize.height(10),
    alignItems: "center",
    borderRadius: normalize.radius(10),
  },
  activeTab: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: normalize.font(14),
    color: "#64748B",
    fontFamily: "Alexandria-SemiBold",
    paddingVertical: normalize.height(2),
    lineHeight: normalize.font(20),
  },
  activeTabText: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-Bold",
    paddingVertical: normalize.height(2),
    lineHeight: normalize.font(20),
  },
  filterRow: {
    paddingHorizontal: normalize.width(16),
    marginBottom: normalize.height(16),
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  filterToggleText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: "#64748B",
  },
  todayButton: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: "center",
  },
  todayButtonText: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-Bold",
    fontSize: normalize.font(12),
    lineHeight: normalize.font(16),
  },
  calendarContainer: {
    paddingHorizontal: normalize.width(16),
    marginBottom: normalize.height(16),
  },
  calendarHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize.height(12),
  },
  monthLabel: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: IDENTITY_BLUE,
  },
  daysScroll: { gap: normalize.width(10) },
  dayItem: {
    alignItems: "center",
    width: normalize.width(45),
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(12),
  },
  selectedDayItem: { backgroundColor: IDENTITY_BLUE },
  dayLabel: {
    fontSize: normalize.font(12),
    color: "#64748B",
    marginBottom: 4,
    fontFamily: "Alexandria-Regular",
  },
  selectedDayLabel: {
    color: "#FFF",
    fontFamily: "Alexandria-Regular",
    lineHeight: normalize.font(16),
  },
  dateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDateCircle: { backgroundColor: "#FFF" },
  dateText: { fontSize: normalize.font(14), fontFamily: "Alexandria-Bold" },
  selectedDateText: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-Regular",
    lineHeight: normalize.font(18),
  },
  availabilitySection: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
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
    borderColor: "#E2E8F0",
  },
  chaletChipActive: {
    backgroundColor: IDENTITY_BLUE,
    borderColor: IDENTITY_BLUE,
  },
  chaletChipText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-SemiBold",
    lineHeight: normalize.font(16),
    paddingTop: normalize.height(2),
  },

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
    overflow: "hidden",
  },
  shiftTileBooked: { opacity: 0.6, backgroundColor: "#F8FAFC" },
  shiftTileContent: {
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftTileCore: { gap: 12, alignItems: "center", flex: 1 },
  shiftIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  shiftNameGroup: { gap: 2, flex: 1 },
  shiftTileName: { fontSize: normalize.font(16), fontFamily: "Alexandria-Black" },
  shiftTimeGroup: { alignItems: "center", gap: 4 },
  shiftTileTime: {
    fontSize: normalize.font(12),
    color: "#94A3B8",
    fontFamily: "Alexandria-SemiBold",
  },
  shiftStatusColumn: { paddingLeft: 12 },
  statusGlassBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Bold",
    lineHeight: normalize.font(18),
    paddingVertical: normalize.height(2),
  },

  bookingMiniInfo: { marginTop: 6, alignItems: "center", gap: 6 },
  bookingMiniId: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Bold",
    letterSpacing: 0.5,
  },
  bookingTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bookingTypeBadgeText: {
    fontSize: normalize.font(9),
    fontFamily: "Alexandria-Black",
    textTransform: "uppercase",
  },

  noAvailabilityText: {
    textAlign: "center",
    color: "#64748B",
    fontFamily: "Alexandria-SemiBold",
  },
  bookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  bookingHeader: { justifyContent: "space-between", alignItems: "center" },
  customerSection: { gap: 10, alignItems: "center" },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: IDENTITY_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  customerName: { fontSize: normalize.font(15), fontFamily: "Alexandria-Bold" },
  chaletName: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Regular",
  },
  priceText: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Black",
    color: IDENTITY_BLUE,
  },
  dateHighlight: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
    gap: 8,
    alignItems: "center",
  },
  dateHighlightText: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-SemiBold",
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
  },
  statusText: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Bold",
    lineHeight: normalize.font(16),
  },
  codeText: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Medium",
  },
  sheetLoading: { padding: 50, alignItems: "center" },
  sheetScroll: { padding: 20 },
  sheetTopRow: { marginBottom: 20 },
  sheetHeroTitle: { fontSize: normalize.font(18), fontFamily: "Alexandria-Black" },
  customerCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  customerRow: { alignItems: "center" },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: IDENTITY_BLUE,
    justifyContent: "center",
    alignItems: "center",
  },
  customerAvatarImg: { width: 44, height: 44, borderRadius: 12 },
  customerNameSheet: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Bold",
  },
  customerPhone: {
    fontSize: normalize.font(13),
    color: "#64748B",
    fontFamily: "Alexandria-Regular",
  },
  contactActions: { gap: 8 },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  contactBtnCall: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  contactBtnChat: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" },
  detailCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailCardHeader: { alignItems: "center", gap: 8, marginBottom: 8 },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  detailCardTitle: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Bold",
    flex: 1,
  },
  detailSubRow: {
    paddingLeft: 40,
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  detailSubText: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Regular",
  },
  scheduleBlock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    overflow: "hidden",
  },
  scheduleRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
    gap: 8,
  },
  scheduleDate: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    flex: 1,
  },
  shiftChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shiftChipText: { fontSize: normalize.font(10), fontFamily: "Alexandria-Bold" },
  timeLabel: {
    fontSize: normalize.font(10),
    color: "#94A3B8",
    fontFamily: "Alexandria-Bold",
    textTransform: "uppercase",
  },
  timeValue: { fontSize: normalize.font(14), fontFamily: "Alexandria-Black" },
  timeArrow: { paddingHorizontal: 8 },
  paymentTotalValue: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: IDENTITY_BLUE,
  },
  paymentCard: { padding: 12, backgroundColor: "#F8FAFC", borderRadius: 10 },
  paymentTotalRow: { justifyContent: "space-between", alignItems: "center" },
  paymentTotalLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-SemiBold",
  },
  sheetContent: { flex: 1 },
  sheetTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Black",
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: "#64748B",
    marginBottom: 8,
  },
  timeBlock: { gap: 2 },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  sheetHeaderLabelRow: { alignItems: "center", gap: 8 },
  pickerColLabel: {
    fontSize: normalize.font(12),
    color: "#94A3B8",
    fontFamily: "Alexandria-Black",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  pickerItemNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerItemActiveNew: { backgroundColor: "#F0F9FF" },
  pickerItemTextNew: {
    fontSize: normalize.font(15),
    color: "#64748B",
    fontFamily: "Alexandria-SemiBold",
  },
  pickerItemTextActiveNew: {
    color: IDENTITY_BLUE,
    fontFamily: "Alexandria-Black",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IDENTITY_BLUE,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
  },
  notesContainer: {
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  notesLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: IDENTITY_BLUE,
  },
  notesText: {
    fontSize: normalize.font(13),
    color: "#475569",
    lineHeight: 18,
    fontFamily: "Alexandria-Regular",
  },
  row: { flexDirection: "row" },
  successAnimationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300,
  },
  successLottie: {
    width: "100%",
    height: 400,
  },
  successAnimationText: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Bold",
    color: IDENTITY_BLUE,
    marginTop: 16,
    textAlign: "center",
  },
});
