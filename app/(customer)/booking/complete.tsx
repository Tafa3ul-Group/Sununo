import { HeaderSection } from "@/components/header-section";
import {
    SolarAddCircleBold,
    SolarAltArrowLeftBold,
    SolarAltArrowRightBold,
    SolarCardBold,
    SolarMapPointBold,
    SolarMoonBold,
    SolarSunBold,
    SolarClockCircleBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { GuestCounter } from "@/components/user/guest-counter";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { MainTabs, TabType } from "@/components/user/MainTabs";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useSelector } from "react-redux";
import { 
    useCreateCustomerBookingMutation, 
    useGetCustomerChaletDetailsQuery,
    useGetChaletAvailabilityQuery 
} from "@/store/api/customerApiSlice";
import { useFormatTime } from "../../../hooks/useFormatTime";

const { width: SCREEN_WIDTH } = Dimensions.get("window");



// Helper to generate calendar days for March 2024 (1st is Friday)
const generateMarchDays = () => {
  const days = [];
  const firstDayPadding = 6;
  for (let i = 0; i < firstDayPadding; i++) days.push(null);
  for (let i = 1; i <= 31; i++) days.push(i);
  return days;
};

const ScribbleIcon = () => (
  <View style={styles.scribbleOverlay}>
    <Svg width="27" height="17" viewBox="0 0 27 17" fill="none">
      <Path
        d="M0 16.3342C2.99573 15.595 6.40062 12.1931 8.87516 10.3499C10.7539 8.95056 12.5344 7.38786 14.3058 5.85133C15.4503 4.82162 19.3351 1.01248 20.5624 0.694205L20.6631 0.77428C20.0331 2.22304 14.0786 6.36758 12.7559 7.86821C11.9412 8.79263 7.05325 13.2599 7.16689 14.3823C8.4238 14.2945 20.3323 4.32336 22.0845 3.05699C22.8235 2.52284 25.1521 0.00923939 26.0467 0C25.8574 0.789872 23.2059 2.65758 22.4706 3.29904C20.984 4.59612 19.5563 5.88203 18.1625 7.28613C15.947 9.51811 13.851 11.1722 12.8732 14.3075C17.2857 12.4915 22.1018 7.57582 25.5124 4.21528C25.6825 4.04772 26.0097 3.8791 26.2404 3.85331L26.2836 3.96158C25.6618 5.40745 23.6597 6.68258 22.4926 7.82798C20.8697 9.42081 19.4171 10.9377 17.8686 12.5976C16.584 13.9747 15.835 14.5322 14.6548 16.1655C17.1806 14.0611 19.7304 11.9904 22.3426 9.9975C23.6692 8.98521 25.5394 7.29498 27 6.61685C26.3425 7.94963 24.3386 10.0783 23.3023 11.287C22.466 12.2624 20.8583 14.7933 20.0165 15.4373C20.7405 13.701 23.3785 10.5202 24.6847 9.04787L24.3797 8.92814C22.5227 10.2836 20.7462 11.839 18.9151 13.2C17.789 14.0368 14.9222 16.7536 13.7398 17L13.6411 16.9076C14.0857 15.7752 16.6737 13.1961 17.661 12.3097L17.6004 11.9123C16.9492 12.4276 16.274 12.9107 15.5771 13.36C14.9133 13.7883 13.7034 14.5621 12.9276 14.3859C11.7642 13.343 15.6221 9.27202 16.3942 8.42632L16.5078 7.99092C16.4879 8.0041 16.468 8.017 16.4482 8.03038C14.9312 9.05922 8.00045 15.1758 6.80779 14.882C6.77373 14.8736 6.7407 14.8611 6.70711 14.8507C6.35217 14.031 8.37052 11.9017 8.9202 11.2266L8.66679 10.9995C7.57776 11.9989 1.29986 17.3668 0 16.3342Z"
        fill="#1E293B"
      />
    </Svg>
  </View>
);

export default function CompleteBookingScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const { id: chaletIdParam } = useLocalSearchParams();
  const chaletId = chaletIdParam as string;
  const { userType, user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>("WHEN");
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const { formatShiftTime } = useFormatTime();

  // Mapping of Day -> Selected Shift ID
  const [selectedShifts, setSelectedShifts] = useState<Record<number, string>>({});

  // API hooks
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateCustomerBookingMutation();
  const { data: chaletDetails } = useGetCustomerChaletDetailsQuery(chaletId, { skip: !chaletId });
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const getDayOfWeek = (day: number) => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
  }; 
  
  const { data: availabilityData = [] } = useGetChaletAvailabilityQuery({
    id: chaletId,
    month: currentMonth.getMonth() + 1,
    year: currentMonth.getFullYear()
  }, { skip: !chaletId });

  // Map availability to fully booked dates
  const bookedDates = useMemo(() => {
    if (!availabilityData || !Array.isArray(availabilityData) || !chaletDetails?.shifts) return [];
    
    const dateCounts: Record<number, number> = {};
    const viewedMonth = currentMonth.getMonth();
    const viewedYear = currentMonth.getFullYear();

    availabilityData.forEach((b: any) => {
      const bDate = new Date(b.bookingDate);
      if (bDate.getMonth() === viewedMonth && bDate.getFullYear() === viewedYear) {
        const d = bDate.getDate();
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      }
    });

    const totalShifts = chaletDetails.shifts.length;
    if (totalShifts === 0) return [];

    return Object.keys(dateCounts)
      .filter((d) => dateCounts[Number(d)] >= totalShifts)
      .map(Number);
  }, [availabilityData, chaletDetails, currentMonth]);

  // Success Sheet Ref
  const successSheetRef = React.useRef<BottomSheetModal>(null);
  const calendarSheetRef = React.useRef<BottomSheetModal>(null);

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Card Details State
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [notes, setNotes] = useState("");

  const [adultCount, setAdultCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(1);


  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const generateMonthDays = (baseDate: Date) => {
    const days = [];
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

    // Offset to start from Saturday (6 in JS is Sat, but we want padding if not Sat)
    // If firstDay is 6 (Sat), padding 0. If 0 (Sun), padding 1...
    const padding = (firstDay + 1) % 7;

    for (let i = 0; i < padding; i++) days.push(null);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const calendarDays = useMemo(
    () => generateMonthDays(currentMonth),
    [currentMonth],
  );
  const monthLabel = currentMonth.toLocaleString(i18n.language, {
    month: "long",
    year: "numeric",
  }).toUpperCase();
  const dayHeadersRaw = t("booking.days", { returnObjects: true });
  const dayHeaders = Array.isArray(dayHeadersRaw) ? dayHeadersRaw : [];


  const selectedShiftPrice = useMemo(() => {
    let total = 0;
    selectedDates.forEach(day => {
        const shiftId = selectedShifts[day];
        if (shiftId) {
          const shift = chaletDetails?.shifts?.find((s: any) => s.id === shiftId);
          if (shift) {
            const dayOfWeek = getDayOfWeek(day);
            const pricing = shift.pricing?.find((p: any) => p.dayOfWeek === dayOfWeek);
            total += pricing ? Number(pricing.price) : Number(chaletDetails?.basePrice || 0);
          }
        }
    });
    return total;
  }, [selectedShifts, selectedDates, chaletDetails, currentMonth]);

  const extraGuestsPrice = 0;

  const isShiftBookedForDay = useCallback((day: number, shiftId: string) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return availabilityData.some((b: any) => {
      const bDate = new Date(b.bookingDate).toISOString().split('T')[0];
      return bDate === dateStr && b.shift?.id === shiftId;
    });
  }, [availabilityData, currentMonth]);


  const calculateTotalPrice = () => {
    let total = 0;
    selectedDates.forEach(day => {
      const shiftId = selectedShifts[day];
      if (shiftId) {
        const shift = chaletDetails?.shifts?.find((s: any) => s.id === shiftId);
        if (shift) {
          const dayOfWeek = getDayOfWeek(day);
          const pricing = shift.pricing?.find((p: any) => p.dayOfWeek === dayOfWeek);
          total += pricing ? Number(pricing.price) : Number(chaletDetails?.basePrice || 0);
        }
      }
    });
    return total;
  };

  const totalPrice = calculateTotalPrice();
  const depositPercentage = Number(chaletDetails?.depositPercentage || 0);
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);
  const remainingAmount = totalPrice - depositAmount;

  const bookingDateString = selectedDates.length > 0 
    ? selectedDates.map(d => `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`).join(", ")
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
        Alert.alert(isRTL ? "تنبيه" : "Alert", isRTL ? "يرجى اختيار تاريخ الحجز" : "Please select a booking date");
        setActiveTab("WHEN");
        return;
      }

      const allDaysHaveShifts = selectedDates.every(day => selectedShifts[day]);
      if (!allDaysHaveShifts) {
        Alert.alert(isRTL ? "تنبيه" : "Alert", isRTL ? "يرجى اختيار فترة لكل يوم مختار" : "Please select a shift for every selected day");
        setActiveTab("WHEN");
        return;
      }

      if (chaletId) {
        const bookings = selectedDates.map(day => ({
          bookingDate: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          shiftId: selectedShifts[day]
        }));

        const result = await createBooking({
          chaletId,
          shiftId: bookings[0].shiftId,
          bookingDate: bookings[0].bookingDate,
          adultsCount: adultCount,
          childrenCount: childrenCount,
          paymentModel: paymentType.toLowerCase() as any,
          useWalletBalance: paymentType === "FULL",
          notes,
          cardHolderName: cardName,
          cardNumber: cardNum,
          expiry,
          cvv,
        }).unwrap();
          
          setCreatedBookingId(result.booking.id);
          successSheetRef.current?.present();
        } else {
          Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "معلومات الشاليه غير مكتملة" : "Chalet information is incomplete");
        }
      } catch (error: any) {
        Alert.alert(
          t('common.error') || 'Error',
          error?.data?.message || t('booking.bookingError') || 'Failed to create booking',
        );
      }
    }
  };

  const toggleDayDate = (day: number) => {
    if (bookedDates.includes(day)) return;
    setSelectedDates((prev) => {
      if (prev.includes(day)) {
        Alert.alert(
          isRTL ? "حذف اليوم" : "Delete Day",
          isRTL ? "هل أنت متأكد من حذف هذا اليوم؟" : "Are you sure you want to delete this day?",
          [
            { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
            {
              text: isRTL ? "حذف" : "Delete",
              style: "destructive",
              onPress: () => {
                setSelectedDates(curr => curr.filter(d => d !== day));
                setSelectedShifts(prevShifts => {
                  const next = { ...prevShifts };
                  delete next[day];
                  return next;
                });
              }
            }
          ]
        );
        return prev; // Deletion handled in Alert onPress
      }
      const updated = [...prev, day].sort((a, b) => a - b);
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleShiftForDay = (day: number, shiftId: string) => {
    if (isShiftBookedForDay(day, shiftId)) return;
    setSelectedShifts(prev => ({
      ...prev,
      [day]: prev[day] === shiftId ? "" : shiftId
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderDetailsTab = () => (
    <View style={styles.detailsContainer}>
      <HorizontalCard
        chalet={{
          id: chaletDetails?.id || "",
          title: isRTL ? (chaletDetails?.nameAr || chaletDetails?.name || "") : (chaletDetails?.nameEn || chaletDetails?.name || ""),
          location: isRTL ? (chaletDetails?.region?.nameAr || chaletDetails?.region?.name || "") : (chaletDetails?.region?.nameEn || chaletDetails?.region?.name || ""),
          rating: chaletDetails?.averageRating || 0,
          price: chaletDetails?.basePrice ? Number(chaletDetails.basePrice).toLocaleString() : "0",
          image: chaletDetails?.images?.[0]?.url || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop",
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
            ? (chaletDetails?.region?.nameAr || chaletDetails?.region?.name || "")
            : (chaletDetails?.region?.nameEn || chaletDetails?.region?.name || "")}
        </ThemedText>
      </View>

      <View style={styles.infoSectionCard}>
        <ThemedText
          style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}
        >
          {t("booking.customerInfo")}
        </ThemedText>
        <View style={styles.divider} />
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.infoLabel}>{t("booking.name")}</ThemedText>
          <ThemedText style={styles.infoValue}>
            {user?.name || t("booking.nameValue")}
          </ThemedText>
        </View>
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.infoLabel}>{t("booking.phone")}</ThemedText>
          <ThemedText style={[styles.infoValue, { direction: "ltr" }]}>
            {user?.phone || t("booking.phoneValue")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.infoSectionCard}>
        <View
          style={[
            styles.sectionHeaderRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
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
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.infoLabel}>{t("booking.date")}</ThemedText>
          <ThemedText style={styles.infoValue}>
            {bookingDateString}
          </ThemedText>
        </View>
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.infoLabel}>{t("booking.shift")}</ThemedText>
          <ThemedText style={styles.infoValue}>
            {selectedDates.length > 1 
              ? (isRTL ? "فترات متعددة" : "Multiple Shifts")
              : (function() {
                  const day = selectedDates[0];
                  const shiftId = selectedShifts[day];
                  const shift = chaletDetails?.shifts?.find((s: any) => s.id === shiftId);
                  return shift ? (isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name)) : t("booking.noShift");
                })()
            }
          </ThemedText>
        </View>
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.infoLabel}>
            {t("booking.guests")}
          </ThemedText>
          <ThemedText style={styles.infoValue}>
            {adultCount + childrenCount}
          </ThemedText>
        </View>
        <View style={styles.divider} />
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={styles.infoLabel}>{t("booking.shiftPrice") || (isRTL ? "سعر الفترة" : "Shift Price")}</ThemedText>
          <ThemedText style={styles.infoValue}>
            {selectedShiftPrice.toLocaleString()} {t("common.iqd")}
          </ThemedText>
        </View>
        {extraGuestsPrice > 0 && (
          <View
            style={[
              styles.infoRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <ThemedText style={styles.infoLabel}>{isRTL ? "رسوم الأشخاص الإضافيين" : "Extra Guest Fees"}</ThemedText>
            <ThemedText style={styles.infoValue}>
              {extraGuestsPrice.toLocaleString()} {t("common.iqd")}
            </ThemedText>
          </View>
        )}
        <View
          style={[
            styles.infoRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <ThemedText style={[styles.infoLabel, { fontWeight: '700' }]}>
            {t("booking.totalAmount")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { fontWeight: '700', color: Colors.primary }]}>
            {totalPrice.toLocaleString()} {t("common.iqd")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.infoSectionCard}>
        <ThemedText
          style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}
        >
          {isRTL ? "ملاحظات إضافية" : "Special Requests"}
        </ThemedText>
        <View style={styles.divider} />
        <TextInput
          style={[styles.textInput, { height: 100, textAlignVertical: 'top', paddingTop: 12, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={isRTL ? "أي طلبات خاصة أو ملاحظات للمالك..." : "Any special requests or notes for the owner..."}
          placeholderTextColor="#94A3B8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <ThemedText
        style={[
          styles.paymentMainTitle,
          { textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {t("booking.paymentTitle")}
      </ThemedText>

      <TouchableOpacity
        style={[
          styles.paymentOptionCard,
          paymentType === "DEPOSIT" && styles.paymentOptionActive,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onPress={() => setPaymentType("DEPOSIT")}
      >
        <ThemedText
          style={[
            styles.paymentLabel,
            paymentType === "DEPOSIT" && styles.paymentLabelActive,
          ]}
        >
          {t("booking.depositPay")}
        </ThemedText>
        <ThemedText
          style={[
            styles.paymentVal,
            paymentType === "DEPOSIT" && styles.paymentValActive,
          ]}
        >
          {depositAmount.toLocaleString()} {t("common.iqd")}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOptionCard,
          paymentType === "FULL" && styles.paymentOptionActive,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
        onPress={() => setPaymentType("FULL")}
      >
        <ThemedText
          style={[
            styles.paymentLabel,
            paymentType === "FULL" && styles.paymentLabelActive,
          ]}
        >
          {t("booking.fullPay")}
        </ThemedText>
        <ThemedText
          style={[
            styles.paymentVal,
            paymentType === "FULL" && styles.paymentValActive,
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

      <View style={styles.inlinePaymentSection}>
        <ThemedText
          style={[
            styles.inlinePaymentTitle,
            { textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("booking.paymentDetails")}
        </ThemedText>

        <View style={styles.paymentForm}>
          <View style={styles.inputGroup}>
            <ThemedText
              style={[
                styles.inputLabel,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("booking.cardNum")}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              placeholder="**** **** **** ****"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={cardNum}
              onChangeText={setCardNum}
            />
          </View>

          <View
            style={[
              styles.rowInputs,
              { gap: 15, flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={styles.inputGroupFull}>
              <ThemedText
                style={[
                  styles.inputLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("booking.expiry")}
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
                placeholder="MM/YYYY"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={expiry}
                onChangeText={setExpiry}
              />
            </View>
            <View style={styles.inputGroupFixed}>
              <ThemedText
                style={[
                  styles.inputLabel,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("booking.cvv")}
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
                placeholder="***"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={cvv}
                onChangeText={setCvv}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText
              style={[
                styles.inputLabel,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("booking.cardName")}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { textAlign: isRTL ? "right" : "left" },
              ]}
              placeholder={t("booking.enterName")}
              placeholderTextColor="#94A3B8"
              value={cardName}
              onChangeText={setCardName}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderCalendarSheet = () => (
    <BottomSheetModal
      ref={calendarSheetRef}
      snapPoints={["60%"]}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetView style={styles.calendarSheetContent}>
        <View style={styles.calendarCardDrawer}>
          <View
            style={[
              styles.calendarMonthHeader,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
              {isRTL ? (
                <SolarAltArrowRightBold size={20} color={Colors.primary} />
              ) : (
                <SolarAltArrowLeftBold size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
            <ThemedText style={styles.calendarMonthTitle}>
              {monthLabel}
            </ThemedText>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
              {isRTL ? (
                <SolarAltArrowLeftBold size={20} color={Colors.primary} />
              ) : (
                <SolarAltArrowRightBold size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.daysHeader,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            {Array.isArray(dayHeaders) &&
              dayHeaders.map((d, i) => (
                <ThemedText key={`${d}-${i}`} style={styles.dayHeaderCell}>
                  {d}
                </ThemedText>
              ))}
          </View>
          <View
            style={[
              styles.daysGrid,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            {calendarDays.map((day, index) => renderCalendarDay(day, index))}
          </View>
          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label={isRTL ? "تم" : "Done"}
              onPress={() => calendarSheetRef.current?.dismiss()}
              style={{ shadowOpacity: 0, elevation: 0, height: 56 }}
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
              params: { id: createdBookingId }
            });
          }}
          activeColor="#15AB64"
          style={styles.successBtn}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );

  const renderCalendarDay = (day: number | null, index: number) => {
    if (day === null)
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    const isBooked = bookedDates.includes(day);
    const isSelected = selectedDates.includes(day);

    return (
      <TouchableOpacity
        key={day}
        disabled={isBooked}
        style={[styles.dayCell, isSelected && styles.activeDayCell]}
        onPress={() => {
          if (!isSelected) toggleDayDate(day);
        }}
      >
        <ThemedText
          style={[
            styles.dayText,
            isSelected && styles.activeDayText,
            isBooked && styles.bookedDayText,
          ]}
        >
          {day}
        </ThemedText>
        {isBooked && <ScribbleIcon />}
      </TouchableOpacity>
    );
  };

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
            <MainTabs activeTab={activeTab} onChange={setActiveTab} />
          </View>

          {activeTab === "WHEN" ? (
            <>
              {/* Date badges removed */}

              {selectedDates.length === 0 && (
                <View style={styles.daySelectionSection}>
                  <View style={[styles.dayHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <ThemedText style={styles.dayHeaderText}>
                      {isRTL ? "اختر يوماً للبدء" : "Select a day to start"}
                    </ThemedText>
                  </View>
                  <View style={styles.shiftsContainer}>
                    {chaletDetails?.shifts?.map((shift: any) => {
                      const shiftName = isRTL
                        ? shift.name?.ar || shift.name
                        : shift.name?.en || shift.name;
                      const isMorning = shift.type === 'MORNING' || (shift.name?.en?.toLowerCase().includes('morning')) || (shift.name?.ar?.includes('صباح'));

                      return (
                        <View
                          key={`preview-${shift.id}`}
                          style={[
                            styles.shiftCardFlat,
                            { flexDirection: isRTL ? "row-reverse" : "row", opacity: 0.6, backgroundColor: '#fff' },
                          ]}
                        >
                          <View style={styles.shiftIconCircleFlat}>
                            {isMorning ? (
                              <SolarSunBold size={22} color="#FBBF24" />
                            ) : (
                              <SolarMoonBold size={22} color="#6366F1" />
                            )}
                          </View>
                          <View style={[styles.shiftInfoFlat, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                            <ThemedText style={styles.shiftNameFlat}>{shiftName}</ThemedText>
                            <ThemedText style={styles.shiftTimeFlat}>
                              {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <PrimaryButton
                    label={isRTL ? "اختيار يوم" : "Choose a Day"}
                    onPress={() => calendarSheetRef.current?.present()}
                    style={{ width: "100%", marginTop: 20, shadowOpacity: 0, elevation: 0 }}
                  />
                </View>
              )}

              {selectedDates.map((day) => (
                <View key={day} style={styles.daySelectionSection}>
                  <View style={[styles.dayHeaderRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <ThemedText style={styles.dayHeaderText}>
                      {isRTL ? `يوم ${day}` : `Day ${day}`}
                    </ThemedText>
                    <TouchableOpacity onPress={() => {
                        Alert.alert(
                          isRTL ? "تأكيد" : "Confirm",
                          isRTL ? "هل أنت متأكد من حذف هذا اليوم؟" : "Are you sure you want to delete this day?",
                          [{ text: isRTL ? "إلغاء" : "Cancel" }, { text: isRTL ? "حذف" : "Delete", onPress: () => toggleDayDate(day), style: 'destructive' }]
                        );
                    }}>
                      <ThemedText style={{ color: "#EF4444", fontFamily: 'Alexandria-Bold' }}>{t("common.delete")}</ThemedText>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.shiftsContainer}>
                    {chaletDetails?.shifts?.map((shift: any) => {
                      const isSelected = selectedShifts[day] === shift.id;
                      const isBooked = isShiftBookedForDay(day, shift.id);
                      const shiftName = isRTL
                        ? shift.name?.ar || shift.name
                        : shift.name?.en || shift.name;

                      const isMorning = shift.type === 'MORNING' || (shift.name?.en?.toLowerCase().includes('morning')) || (shift.name?.ar?.includes('صباح'));
                      
                      return (
                        <TouchableOpacity
                          key={`${day}-${shift.id}`}
                          disabled={isBooked}
                          style={[
                            styles.shiftCardFlat,
                            { flexDirection: isRTL ? "row-reverse" : "row", backgroundColor: '#fff' },
                            isSelected && {
                              borderColor: "#035DF9",
                              borderWidth: 1.5,
                              backgroundColor: "#EBF3FF",
                            },
                            isBooked && { opacity: 0.5, backgroundColor: "#F1F5F9" },
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
                              { alignItems: isRTL ? "flex-end" : "flex-start" },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.shiftNameFlat,
                                isSelected && { color: "#035DF9" },
                              ]}
                            >
                              {shiftName}
                            </ThemedText>
                            <ThemedText style={styles.shiftTimeFlat}>
                              {formatShiftTime(shift.startTime)} -{" "}
                              {formatShiftTime(shift.endTime)}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {selectedDates.length > 0 && (
                <View style={{ paddingHorizontal: 32, marginTop: 10 }}>
                  <PrimaryButton
                    label={isRTL ? "إضافة يوم آخر" : "Add Another Day"}
                    onPress={() => calendarSheetRef.current?.present()}
                    style={{ width: "100%", shadowOpacity: 0, elevation: 0 }}
                  />
                </View>
              )}
            </>
          ) : activeTab === "WHO" ? (
            <View style={styles.whoContainer}>
              <View
                style={[
                  styles.whoCard,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <View
                  style={[
                    styles.guestInfo,
                    { alignItems: isRTL ? "flex-end" : "flex-start" },
                  ]}
                >
                  <ThemedText style={styles.guestLabel}>
                    {t("booking.adults")}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.guestSubLabel,
                      { textAlign: isRTL ? "right" : "left" },
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
                    else Alert.alert(isRTL ? "تنبيه" : "Alert", isRTL ? `الحد الاقصى للبالغين هو ${max}` : `Max adults is ${max}`);
                  }}
                  onDecrement={() => setAdultCount(Math.max(1, adultCount - 1))}
                />
              </View>

              <View
                style={[
                  styles.whoCard,
                  {
                    marginTop: 12,
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <View
                  style={[
                    styles.guestInfo,
                    { alignItems: isRTL ? "flex-end" : "flex-start" },
                  ]}
                >
                  <ThemedText style={styles.guestLabel}>
                    {t("booking.children")}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.guestSubLabel,
                      { textAlign: isRTL ? "right" : "left" },
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
                    else Alert.alert(isRTL ? "تنبيه" : "Alert", isRTL ? `الحد الاقصى للأطفال هو ${max}` : `Max children is ${max}`);
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
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: "#94A3B8",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 42, 
  },
  dateBadgeTextActive: { color: Colors.primary, fontFamily: "Alexandria-Black" },
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
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Black",
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
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Black",
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
  dayText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: "#334155",
    textAlign: "center",
  },
  activeDayText: { color: "#FFF", fontFamily: "Alexandria-Black" },
  bookedDayText: { color: "#CBD5E1", fontFamily: "Alexandria-Regular" },
  scribbleOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -13.5 }, { translateY: -8.5 }],
    zIndex: 2,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
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
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
  },
  shiftTime: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Bold",
  },
  deleteDayText: {
    color: "#EF4444",
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Black",
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  dayHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  dayHeaderText: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Black',
    color: '#1E293B'
  },
  shiftCardFlat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    marginBottom: 10,
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
  },
  shiftNameFlat: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
  },
  shiftTimeFlat: {
    fontSize: normalize.font(12),
    color: "#64748B",
    fontFamily: "Alexandria-Bold",
  },
  shiftPriceFlat: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
  },
  whoContainer: { marginTop: 20 },
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
  guestInfo: { flex: 1, alignItems: "flex-start" },
  guestLabel: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: "#111827",
  },
  guestSubLabel: {
    fontSize: normalize.font(12),
    color: "#9CA3AF",
    fontFamily: "Alexandria-SemiBold",
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
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
    marginBottom: 15,
  },
  paymentForm: { gap: 12 },
  inputGroup: { gap: 6 },
  inputGroupFull: { flex: 1, gap: 6 },
  inputGroupFixed: { width: 90, gap: 6 },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Black",
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
    fontFamily: "Alexandria-Bold",
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
    fontSize: normalize.font(20),
    fontFamily: "Alexandria-Black",
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
    fontFamily: "Alexandria-Regular",
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
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Black",
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
    fontFamily: "Alexandria-Black",
    color: "#15AB64",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  infoRow: { justifyContent: "space-between", marginBottom: 10 },
  infoLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
  },
  infoValue: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: "#64748B",
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
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Black",
  },
  paymentMainTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Black",
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
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Black",
    color: "#64748B",
  },
  paymentValActive: { color: "#1E293B", fontFamily: "Alexandria-Regular" },
  paymentLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Black",
    color: "#64748B",
  },
  paymentLabelActive: { color: "#1E293B", fontFamily: "Alexandria-Regular" },
  agreementWrapper: { paddingVertical: 12, paddingBottom: 35 },
  agreementText: {
    fontSize: normalize.font(12),
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Alexandria-Regular",
  },
  agreementLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
    fontFamily: "Alexandria-Black",
  },
});
