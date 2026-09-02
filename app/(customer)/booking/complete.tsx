import { HeaderSection } from "@/components/header-section";
import {
  SolarCardBold,
  SolarInfoCircleBold,
  SolarMapPointBold,
  SolarMoonBold,
  SolarSunBold,
  SolarUsersGroupRoundedBold,
  SolarWalletBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { BookingReceiptSheet } from "@/components/booking/booking-receipt-sheet";
import { CancellationPolicyCard } from "@/components/booking/cancellation-policy-card";
import { ChaletTermsSheet } from "@/components/booking/chalet-terms-sheet";
import { CouponField } from "@/components/booking/coupon-field";
import { PaymentProcessingSheet } from "@/components/booking/payment-processing-sheet";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonBox } from "@/components/ui/skeleton-loader";
import { GuestCounter } from "@/components/user/guest-counter";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { MainTabs, TabType } from "@/components/user/MainTabs";
import { PrimaryButton } from "@/components/user/primary-button";
import { RangeCalendar } from "@/components/user/range-calendar";
import { Colors, normalize } from "@/constants/theme";

import { RootState } from "@/store";
import { ImagePrepareError, prepareImageUpload } from "@/utils/prepare-image-upload";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS, ANALYTICS_CURRENCY } from "@/constants/analytics-events";
import {
  useCreateCustomerBookingMutation,
  useGetChaletDiscountQuery,
  useGetCustomerChaletDetailsQuery,
  useValidateCouponMutation,
  useUploadIdCardImagesMutation,
  usePayDelayedBookingMutation,
  useGetChaletCancellationPoliciesQuery,
  useGetCustomerWalletQuery,
} from "@/store/api/customerApiSlice";
import { useGetAppConfigQuery } from "@/store/api/apiSlice";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useFormatTime } from "../../../hooks/useFormatTime";
import { usePaymentSession } from "@/hooks/usePaymentSession";
import {
  getLocalDateKey,
  useChaletAvailability,
} from "@/hooks/useChaletAvailability";
import { pickTranslation, useDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOOKING_TABS: TabType[] = ["WHEN", "WHO", "WHERE"];

/**
 * The two ways checkout can settle. `wayl` is the card gateway (a hosted page,
 * a webhook, a booking that stays PENDING_PAYMENT until it lands); `wallet` is
 * settled inline by the API, which debits the balance and returns the booking
 * already CONFIRMED with no payment URL to open.
 *
 * The screen used to hardcode `wayl` because nothing ever set the state — the
 * wallet branch existed on the API and on the booking-details screen, but not
 * here.
 */
type PaymentMethod = "wayl" | "wallet";
const DEFAULT_PAYMENT_METHOD: PaymentMethod = "wayl";

// Caches the descending-by-guestCount sort per capacityPricings array reference,
// so the spread + sort runs once instead of on every pricing recomputation.
const sortedCapacityCache = new WeakMap<object, any[]>();
const getSortedCapacityTiers = (capacityPricings: any[]) => {
  const cached = sortedCapacityCache.get(capacityPricings);
  if (cached) return cached;
  const sorted = [...capacityPricings].sort(
    (a: any, b: any) => b.guestCount - a.guestCount,
  );
  sortedCapacityCache.set(capacityPricings, sorted);
  return sorted;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// hook-based shared value cannot be created at the parent's top level. Press
// feedback is suppressed when `disabled` so non-clickable cards don't animate.
const PressableScale = React.memo(function PressableScale({
  disabled,
  onPress,
  style,
  activeOpacity,
  haptic = true,
  children,
}: {
  disabled?: boolean;
  onPress?: () => void;
  style?: any;
  activeOpacity?: number;
  haptic?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatedTouchable
      disabled={disabled}
      activeOpacity={activeOpacity}
      style={style}
      onPress={() => {
        if (disabled) return;
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    >
      {children}
    </AnimatedTouchable>
  );
});

// Append a picked image to FormData as a real file part. Web FormData needs a
// Blob (an RN {uri,name,type} object would serialize to "[object Object]" and
// the backend would reject it as "does not contain file"); native uses the
// {uri,name,type} object. prepareImageUpload fixes the mime (".jpg" ≠
// "image/jpg") and re-encodes HEIC/WebP picks to the jpeg/png the backend
// accepts.
async function appendImagePart(
  formData: FormData,
  field: string,
  uri: string,
  fallback: string,
) {
  const prepared = await prepareImageUpload(uri);
  const rawName = uri.split("?")[0].split("/").pop() || "";
  // Keep the picked filename when it was already jpeg/png; otherwise use the
  // stable id_front/id_back fallback (matches the pre-helper behavior).
  const name = /\.(jpe?g|png)$/i.test(rawName) ? prepared.name : `${fallback}.jpg`;

  if (Platform.OS === "web") {
    const res = await fetch(prepared.uri);
    const blob = await res.blob();
    formData.append(field, blob, name);
  } else {
    formData.append(field, { uri: prepared.uri, name, type: prepared.type } as any);
  }
}

export default function CompleteBookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: chaletIdParam } = useLocalSearchParams();
  const chaletId = chaletIdParam as string;
  const { userType, user } = useSelector((state: RootState) => state.auth);
  const savedFilter = useSelector((state: RootState) => (state as any).filter);

  const [activeTab, setActiveTab] = useState<TabType>("WHEN");
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const { formatShiftTime } = useFormatTime();
  const { isRTL, rowDirection, textAlign, textAlignEnd, inputTextAlign } = useDirection();
  const isArabic = isRTL;

  const pickImage = async (imageNumber: 1 | 2) => {
    // No permissions request is needed for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (imageNumber === 1) {
        setIdImage1(result.assets[0].uri);
      } else {
        setIdImage2(result.assets[0].uri);
      }
    }
  };

  // The search filter's dates are discovery criteria only — they must NEVER
  // pre-fill the booking calendar. The global filter is persisted and applies
  // app-wide, so inheriting its dates leaked the filter's days into every
  // chalet's booking (even after the user moved on). The customer always picks
  // the booking date explicitly, so the calendar starts empty.
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
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

  // Mapping of Day -> Selected Shift ID
  const [selectedShifts, setSelectedShifts] = useState<Record<number, string>>(
    {},
  );

  // API hooks
  const [createBooking, { isLoading: isCreatingBooking }] =
    useCreateCustomerBookingMutation();
  const [uploadIdCardImages, { isLoading: isUploadingId }] =
    useUploadIdCardImagesMutation();
  // isLoading/isError are load-bearing here, not optional extras: every price on
  // this screen is derived from `chaletDetails`, so rendering before it arrives
  // quoted the customer 0 IQD with an empty shift list, and a failed request
  // looked exactly the same with no way to retry.
  const {
    data: response,
    isLoading: isLoadingChalet,
    isError: isChaletError,
    refetch: refetchChalet,
  } = useGetCustomerChaletDetailsQuery(chaletId, {
    skip: !chaletId,
  });
  const chaletDetails = response?.data || response;

  const {
    data: cancellationPolicies,
    isLoading: isLoadingCancellationPolicies,
  } = useGetChaletCancellationPoliciesQuery(chaletId, { skip: !chaletId });

  // Sorted so the customer reads the most generous window first, the way the
  // policy is actually applied (the API returns them in the owner's sort order).
  const cancellationTiers = useMemo(
    () =>
      [...(cancellationPolicies || [])].sort(
        (a, b) => Number(b.daysBeforeBooking) - Number(a.daysBeforeBooking),
      ),
    [cancellationPolicies],
  );

  // ── Chalet terms gate ──────────────────────────────────────────────────────
  // The customer has to be shown the chalet's terms and tap موافق before the
  // booking is created — on BOTH paths. Checkout previously carried a sentence
  // saying they "acknowledge" the terms, with the terms a navigation away and
  // nothing stopping a booking that never opened them; a delayed chalet showed
  // not even that.
  //
  // Acceptance is per-chalet and lives only for this screen: nothing is sent to
  // the API, because `booking` has no acceptance column and `chalet.terms` has
  // no version to record against. It survives a failed submit so a retry does
  // not re-ask.
  const termsSheetRef = React.useRef<BottomSheetModal>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  // The sheet dismisses with an animation, so its موافق button stays tappable
  // for a beat after the first tap — and the submit it schedules has not set
  // `isCreatingBooking` yet. This latch is the guard for that window; a ref
  // rather than state because a second tap in the same frame must see it.
  const termsSubmitRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTermsAccepted(false);
  }, [chaletId]);

  // A pending submit must not fire into an unmounted screen: it would create a
  // booking (and, on the wallet path, debit the balance) with nothing on screen
  // to show for it.
  useEffect(
    () => () => {
      if (termsSubmitRef.current) clearTimeout(termsSubmitRef.current);
    },
    [],
  );

  const openChaletInfo = useCallback(
    (type: "terms" | "policies") => {
      if (!chaletId) return;
      router.push({
        // Generated expo-router types only include routes seen by a running
        // `expo start`, so this one needs the cast — same as the chalet-details
        // screen that links here.
        pathname: `/(customer)/chalet-details/info/${chaletId}` as any,
        params: { type },
      });
    },
    [chaletId, router],
  );

  /** Amenity names arrive as `{ ar, en }`; fall back rather than render blank. */
  const amenityName = useCallback(
    (value: any): string =>
      typeof value === "string" ? value : (isArabic ? value?.ar : value?.en) || value?.ar || value?.en || "",
    [isArabic],
  );

  // ── Paid amenities ─────────────────────────────────────────────────────────
  // Two kinds, and the difference matters for the price shown on this screen:
  //   mandatory — the server adds it to EVERY booking, so it must be part of the
  //     total the guest agrees to. Leaving it out is how the screen would quote
  //     less than the amount actually charged.
  //   optional  — only charged when the guest picks it, and only then is its id
  //     sent back as `amenityIds`.
  const paidAmenities = useMemo(
    () => ((chaletDetails?.amenities || []) as any[]).filter((a) => a?.isPaid && Number(a?.price) > 0),
    [chaletDetails?.amenities],
  );
  const mandatoryAmenities = useMemo(
    () => paidAmenities.filter((a) => !a.isOptional),
    [paidAmenities],
  );
  const optionalAmenities = useMemo(
    () => paidAmenities.filter((a) => a.isOptional),
    [paidAmenities],
  );

  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const toggleAmenity = useCallback((id: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const mandatoryAmenitiesPrice = useMemo(
    () => mandatoryAmenities.reduce((sum, a) => sum + Number(a.price || 0), 0),
    [mandatoryAmenities],
  );
  const optionalAmenitiesPrice = useMemo(
    () =>
      optionalAmenities
        .filter((a) => selectedAmenityIds.includes(a.chaletAmenityId))
        .reduce((sum, a) => sum + Number(a.price || 0), 0),
    [optionalAmenities, selectedAmenityIds],
  );
  const amenitiesPrice = mandatoryAmenitiesPrice + optionalAmenitiesPrice;

  // Same rule as the dates: only honor the filter's period while the filter is
  // actively applied, so a cleared filter doesn't pre-select a shift.
  const filterPeriod = useSelector((state: RootState) =>
    state.filter.isActive ? state.filter.period : null,
  );

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

  // Precompute the "starts from" minimum price per shift once, instead of running
  // a map + filter + Math.min spread inline on every render of the preview list.
  const shiftMinPrices = useMemo(() => {
    const fallback = chaletDetails?.basePrice || 0;
    const map: Record<string, number> = {};
    availableShifts.forEach((shift: any) => {
      // Exclude closed days (price <= 1 sentinel) from the min price.
      const valid = (shift.pricing || [])
        .map((p: any) => Number(p.price))
        .filter((p: number) => p > 1);
      map[shift.id] =
        valid.length > 0 ? Math.min(...valid) : Number(fallback);
    });
    return map;
  }, [availableShifts, chaletDetails?.basePrice]);

  const filteredSelectedShift = useMemo(() => {
    if (!filterPeriod) return null;
    return (
      availableShifts.find((shift: any) =>
        shiftMatchesFilterPeriod(shift, filterPeriod),
      ) || null
    );
  }, [availableShifts, filterPeriod, shiftMatchesFilterPeriod]);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  // The month the CALENDAR SHEET is showing. It moves with the sheet's arrows /
  // year picker, independently of the month the picked date lives in, and it is
  // what the availability query and the scribbled-out days follow. Before this
  // existed the query only ever ran for the *selection's* month, so paging to
  // the next month drew it with the previous month's occupancy and a fully
  // booked day rendered as selectable.
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const getDateForDay = useCallback(
    (day: number) =>
      selectedDateRange.find((date) => date.getDate() === day) ||
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
    [currentMonth, selectedDateRange],
  );
  const getDayOfWeek = useCallback(
    (day: number) => getDateForDay(day).getDay(),
    [getDateForDay],
  );

  // Occupancy is fetched for BOTH the month the selection lives in and the month
  // the calendar is showing, and merged. They are the same month most of the
  // time — RTK Query then serves one cache entry and only one request goes out —
  // but they diverge the moment the user pages the calendar forward, and the
  // selected day's shift rows must keep their real availability while they do.
  const {
    isCalendarMonthLoading,
    bookedDates,
    bookedDateStrings,
    isShiftBookedForDay,
    isShiftBookedOnDate,
    isShiftPastForDay,
    isShiftClosedForDay,
  } = useChaletAvailability({
    chaletId,
    selectionMonth: currentMonth,
    calendarMonth,
    availableShifts,
    getDateForDay,
  });

  // Pre-fill selected shifts from the saved filter when possible.
  useEffect(() => {
    // Default to the first shift that actually has pricing (so the total/deposit
    // isn't 0 when a chalet has multiple shifts and no period was pre-filtered).
    const initialShift =
      filteredSelectedShift ||
      availableShifts.find((s: any) =>
        s.pricing?.some((p: any) => Number(p.price) > 1),
      ) ||
      availableShifts[0] ||
      null;
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
          
          if (!next[day] || shouldUseFilterShift || isShiftBookedForDay(day, next[day])) {
            const chosenShiftId = initialShift.id;
            if (isShiftBookedForDay(day, chosenShiftId)) {
              const alternativeShift = availableShifts.find(
                (s: any) => !isShiftBookedForDay(day, s.id),
              );
              next[day] = alternativeShift ? alternativeShift.id : chosenShiftId;
            } else {
              next[day] = chosenShiftId;
            }
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
    isShiftBookedForDay,
  ]);

  // Success Sheet Ref
  const successSheetRef = React.useRef<BottomSheetModal>(null);
  const calendarSheetRef = React.useRef<BottomSheetModal>(null);

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  // Shown on the success sheet: the code is what the customer quotes to the
  // owner, and the status decides whether that sheet reads "booked" or
  // "request sent".
  const [createdBookingCode, setCreatedBookingCode] = useState<string | null>(null);
  const [createdBookingStatus, setCreatedBookingStatus] = useState<string | null>(null);
  /** A delayed chalet's booking: awaiting the owner, with no money taken yet. */
  const isBookingRequest = createdBookingStatus === "pending_approval";
  // The payment session of the booking we already created. Kept so an abandoned
  // payment can be RESUMED instead of creating a second booking for the same
  // slot — see the resume branch in handleNext.
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  // What that pending booking was created for. If the user changes the date,
  // shift, guests, audience or payment model afterwards, the pending booking no
  // longer represents what they are agreeing to and a new one must be created.
  const [pendingBookingKey, setPendingBookingKey] = useState<string | null>(
    null,
  );

  const [notes, setNotes] = useState("");

  // The guest count is seeded from the search filter, which is global, persisted
  // and unbounded (the search sheet increments `adults` with no ceiling), while
  // the backend hard-rejects `guestsCount > chalet.capacity`. Seeding it raw let
  // the screen open at 30 guests on a capacity-6 chalet: it priced 24 "extra
  // persons" into the total, made the user upload BOTH ID photos, and only then
  // failed with a 400. `chaletDetails` is usually still loading on first render,
  // so this is only a sane floor — the effect below re-clamps to the real
  // capacity the moment it arrives.
  const [adultCount, setAdultCount] = useState<number>(() => {
    const seeded = Number(savedFilter?.adults);
    return Number.isFinite(seeded) && seeded > 0 ? seeded : 2;
  });
  const chaletCapacity = Number(chaletDetails?.capacity) || 0;

  useEffect(() => {
    if (chaletCapacity <= 0) return;
    setAdultCount((prev) => (prev > chaletCapacity ? chaletCapacity : prev));
  }, [chaletCapacity]);
  const [guestType, setGuestType] = useState<"FAMILY" | "YOUTH">("FAMILY");

  // The owner's guest policy. An absent value is deliberately read as 'both':
  // an older or cached payload must never lock a customer out of a chalet that
  // in fact accepts them. This is a UX guard only — the server is the real gate
  // and rejects a mismatched audienceType regardless of what the tabs allowed.
  const chaletGuestPolicy: "family" | "youth" | "both" =
    chaletDetails?.guestPolicy === "family" || chaletDetails?.guestPolicy === "youth"
      ? chaletDetails.guestPolicy
      : "both";
  const guestTypeLocked = chaletGuestPolicy !== "both";

  // The policy arrives with the chalet, after this screen's first render, so the
  // pre-selection has to follow the data rather than seed the initial state.
  useEffect(() => {
    if (chaletGuestPolicy === "family") setGuestType("FAMILY");
    else if (chaletGuestPolicy === "youth") setGuestType("YOUTH");
  }, [chaletGuestPolicy]);
  const [idImage1, setIdImage1] = useState<string | null>(null);
  const [idImage2, setIdImage2] = useState<string | null>(null);

  // Re-opens a payment session for a booking that is still awaiting payment.
  // Needed because an abandoned session leaves this customer's OWN booking
  // holding the slot, and the only way back to it is a fresh session — the
  // paymentUrl from creation is gone once this screen unmounts.
  const [reopenPaymentSession] = usePayDelayedBookingMutation();
  const processingSheetRef = React.useRef<BottomSheetModal>(null);

  const {
    status: pollingStatus,
    transactionId: paymentTransactionId,
    open: openPaymentSession,
    recheck: recheckPayment,
    setTransactionId: setPaymentTransactionId,
  } = usePaymentSession({
    onSuccess: (txnId: string) => {
      trackPurchase(txnId);
      // The confirmation animation in the processing sheet is worth watching
      // before it is swapped for the receipt.
      setTimeout(() => {
        processingSheetRef.current?.dismiss();
        successSheetRef.current?.present();
      }, 1500);
    },
    onFailure: () => {
      setTimeout(() => processingSheetRef.current?.dismiss(), 1500);
    },
    onSessionOpen: () => processingSheetRef.current?.present(),
  });

  const pricingCalculations = useMemo(() => {
    let totalBasePrice = 0;
    let totalExtraGuestsPrice = 0;
    const explanationRows: {
      day: number;
      dateStr: string;
      basePrice: number;
      extraGuestsCount: number;
      extraGuestsPrice: number;
      capacityLimit: number;
    }[] = [];

    const totalGuestsNow = adultCount;

    selectedDates.forEach((day) => {
      const shiftId = selectedShifts[day];
      if (shiftId) {
        const shift = chaletDetails?.shifts?.find((s: any) => s.id === shiftId);
        if (shift) {
          const dayOfWeek = getDayOfWeek(day);
          const pricing = shift.pricing?.find(
            (p: any) => p.dayOfWeek === dayOfWeek,
          );

          let basePrice = pricing
            ? Number(pricing.price)
            : Number(chaletDetails?.basePrice || 0);

          let selectedCapacityLimit = Number(chaletDetails?.priceCapacity || 2);

          if (pricing?.capacityPricings && pricing.capacityPricings.length > 0) {
            const sortedTiers = getSortedCapacityTiers(pricing.capacityPricings);
            const bestTier = sortedTiers.find((t: any) => t.guestCount <= totalGuestsNow);
            if (bestTier) {
              basePrice = Number(bestTier.price);
              selectedCapacityLimit = bestTier.guestCount;
            }
          }

          let extraGuestsCount = 0;
          let extraGuestsPrice = 0;
          if (totalGuestsNow > selectedCapacityLimit) {
            extraGuestsCount = totalGuestsNow - selectedCapacityLimit;
            extraGuestsPrice = extraGuestsCount * Number(chaletDetails?.extraPersonPrice || 0);
          }

          totalBasePrice += basePrice;
          totalExtraGuestsPrice += extraGuestsPrice;

          const date = getDateForDay(day);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

          explanationRows.push({
            day,
            dateStr,
            basePrice,
            extraGuestsCount,
            extraGuestsPrice,
            capacityLimit: selectedCapacityLimit,
          });
        }
      }
    });

    // Amenities are charged once per booking, not per selected day, matching how
    // the API prices them. This is the price BEFORE any platform campaign — the
    // discount is resolved server-side and subtracted below.
    const originalPrice = totalBasePrice + totalExtraGuestsPrice + amenitiesPrice;

    return {
      shiftBasePrice: totalBasePrice,
      extraGuestsPrice: totalExtraGuestsPrice,
      originalPrice,
      explanationRows,
      totalGuestsNow,
    };
    // `currentMonth` is not listed: it only ever reaches this through
    // getDateForDay/getDayOfWeek, which already depend on it.
  }, [selectedShifts, selectedDates, chaletDetails, adultCount, getDayOfWeek, getDateForDay, amenitiesPrice]);

  const {
    shiftBasePrice,
    extraGuestsPrice,
    originalPrice,
    explanationRows,
  } = pricingCalculations;

  // ── Platform-funded discount ────────────────────────────────────────────────
  // Display only: the API resolves and applies the campaign again when the booking
  // is created, so the customer can never be charged something this screen didn't
  // show. The chalet owner is paid the same with or without a campaign — the whole
  // discount comes out of the platform's commission.
  const { data: discountQuote } = useGetChaletDiscountQuery(
    { chaletId, price: originalPrice },
    { skip: !chaletId || !(originalPrice > 0) },
  );

  const discountAmount = Math.max(0, Number(discountQuote?.discountAmount) || 0);
  const discountLabel = discountQuote?.discount?.name;

  // ── Coupon ──────────────────────────────────────────────────────────────────
  // Applied ON TOP of whatever campaign is already running, but funded out of the
  // platform's commission alone — so the server may grant less than the code's
  // headline value, or nothing at all, when a campaign already spent that
  // commission. Whatever it says here is what the booking endpoint re-computes.
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validateCoupon, { isLoading: isCheckingCoupon }] = useValidateCouponMutation();

  const couponAmount = appliedCoupon?.amount ?? 0;
  const totalPrice = Math.max(0, originalPrice - discountAmount - couponAmount);

  // A code priced against one total must never survive into a different one: the
  // customer changing dates, shifts or guests re-prices the booking underneath it.
  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalPrice, chaletId]);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    setCouponError(null);
    try {
      const result: any = await validateCoupon({
        code,
        chaletId,
        price: originalPrice,
      }).unwrap();

      if (!result?.valid) {
        setAppliedCoupon(null);
        setCouponError(result?.message || (isArabic ? "الكود غير صالح" : "Invalid code"));
        return;
      }
      setAppliedCoupon({ code: result.code || code, amount: Number(result.couponAmount) || 0 });
    } catch (error: any) {
      setAppliedCoupon(null);
      const raw = error?.data?.message;
      setCouponError(Array.isArray(raw) ? raw.join("\n") : raw || (isArabic ? "تعذّر التحقق من الكود" : "Could not check the code"));
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  // Deposit is a share of what the customer actually pays, so it follows the
  // discounted total — exactly how the API splits it.
  const depositPercentage =
    Number(chaletDetails?.depositPercentage) || Number(chaletDetails?.minDepositPercentage) || 0;
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);

  // ── Payment method ─────────────────────────────────────────────────────────
  // What the customer owes RIGHT NOW — a deposit booking pays the deposit and
  // settles the rest in cash on arrival. This, not the total, is what the API
  // charges and therefore what a wallet balance has to cover.
  const amountDue = paymentType === "DEPOSIT" ? depositAmount : totalPrice;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(DEFAULT_PAYMENT_METHOD);

  const { data: appConfig } = useGetAppConfigQuery();
  // Only fetched for instant chalets: a delayed booking pays later, from the
  // booking-details screen, so there is nothing to check a balance against here.
  const isDelayedChalet = chaletDetails?.bookingType === "delayed";
  const { data: walletData, isLoading: isWalletLoading } = useGetCustomerWalletQuery(
    undefined,
    { skip: isDelayedChalet },
  );

  const walletBalance = Number(walletData?.balance ?? walletData?.data?.balance ?? 0);
  // The API rejects either method outright when the admin has switched it off
  // (`Wallet payment is currently disabled` / `Wayl is currently disabled`), so
  // a disabled option is hidden rather than offered and then refused. Absent
  // config is treated as enabled — a failed /config must not close checkout.
  const isWalletEnabled = appConfig?.isWalletEnabled !== false;
  const isWaylEnabled = appConfig?.isWaylEnabled !== false;
  const walletCoversAmount = walletBalance >= amountDue && amountDue > 0;
  const canPayByWallet = isWalletEnabled && walletCoversAmount;
  // The balance reads 0 until the first response lands, and again while it
  // refetches after a wallet payment invalidates it — neither is a real
  // "you can't afford this", so the shortfall notice waits for a settled read.
  // Once a booking exists the picker is history: the receipt is on screen.
  const isWalletUnsettled = isWalletLoading || isCreatingBooking || !!createdBookingId;

  // Keep the selection on something that can actually go through. Two cases:
  // the customer picks wallet and then pushes the amount past their balance
  // (adds a guest, drops a coupon, switches to full payment), or the card
  // gateway is switched off while the default is still pointing at it.
  useEffect(() => {
    if (isWalletUnsettled) return;
    if (paymentMethod === "wallet" && !canPayByWallet && isWaylEnabled) {
      setPaymentMethod("wayl");
      return;
    }
    if (paymentMethod === "wayl" && !isWaylEnabled && canPayByWallet) {
      setPaymentMethod("wallet");
    }
  }, [paymentMethod, canPayByWallet, isWaylEnabled, isWalletUnsettled]);

  const selectedShiftPrice = shiftBasePrice;

  const totalGuestsNow = adultCount;
  const extraPersonPrice = Number(chaletDetails?.extraPersonPrice || 0);

  const capacityLimit = explanationRows.length > 0
    ? explanationRows[0].capacityLimit
    : Number(chaletDetails?.priceCapacity || 2);

  const extraGuestsCount = Math.max(0, totalGuestsNow - capacityLimit);

  useEffect(() => {
    if (depositPercentage === 0) {
      setPaymentType("FULL");
    } else {
      setPaymentType("DEPOSIT");
    }
  }, [depositPercentage]);

  // Identity of the booking the button would create right now. Compared against
  // `pendingBookingKey` to tell "the user abandoned the payment for exactly this
  // booking" (resume it) from "they changed something" (create a new one).
  const currentBookingKey = useMemo(() => {
    const day = selectedDates[0];
    if (day === undefined) return null;
    return [
      chaletId,
      getLocalDateKey(getDateForDay(day)),
      selectedShifts[day] || "",
      adultCount,
      guestType,
      paymentType,
      // A gateway session opened for the card is not the session a wallet
      // payment needs, so switching method must not "resume" the old one.
      paymentMethod,
    ].join("|");
  }, [
    chaletId,
    selectedDates,
    selectedShifts,
    getDateForDay,
    adultCount,
    guestType,
    paymentType,
    paymentMethod,
  ]);

  // ── Tab gating ─────────────────────────────────────────────────────────────
  // The tabs are a linear checkout, not free navigation: WHERE prices and books
  // whatever WHEN and WHO collected. Tapping straight to it skipped the ID-photo
  // upload, and the customer found out from a raw Arabic-only 400 thrown by the
  // API. Each tab states what it needs, in one place, so the lock, the message
  // and the submit guard can never disagree.
  const whenBlocker = useMemo(() => {
    if (selectedDates.length === 0) {
      return isArabic ? "اختر يوم الحجز أولاً" : "Pick a booking date first";
    }
    if (!selectedShifts[selectedDates[0]]) {
      return isArabic ? "اختر الفترة (الشفت) لهذا اليوم" : "Pick a shift for that day";
    }
    return null;
  }, [selectedDates, selectedShifts, isArabic]);

  const whoBlocker = useMemo(() => {
    if (chaletCapacity > 0 && adultCount > chaletCapacity) {
      return isArabic
        ? `السعة القصوى لهذا الشاليه ${chaletCapacity} شخص`
        : `This chalet takes at most ${chaletCapacity} guests`;
    }
    if (!idImage1 || !idImage2) {
      return isArabic
        ? "ارفع صورتي الهوية لإتمام الحجز"
        : "Upload both ID photos to continue";
    }
    return null;
  }, [chaletCapacity, adultCount, idImage1, idImage2, isArabic]);

  const lockedTabs = useMemo<TabType[]>(() => {
    const locked: TabType[] = [];
    if (whenBlocker) locked.push("WHO", "WHERE");
    else if (whoBlocker) locked.push("WHERE");
    return locked;
  }, [whenBlocker, whoBlocker]);

  /** Name + hours of the shift chosen for the booked day, for the receipt. */
  const selectedShiftLabel = useMemo(() => {
    const day = selectedDates[0];
    if (day === undefined) return "";
    const shift = (availableShifts as any[])?.find(
      (s: any) => s.id === selectedShifts[day],
    );
    if (!shift) return "";
    const name = pickTranslation(shift.name, isArabic);
    // The LRM marks keep the 24-hour range from reversing inside Arabic text.
    return `${name} (‎${formatShiftTime(shift.startTime)} - ${formatShiftTime(shift.endTime)}‎)`;
  }, [availableShifts, selectedShifts, selectedDates, isArabic, formatShiftTime]);

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

  // ── Analytics helpers ───────────────────────────────────────────────────────
  const analyticsChaletName = isArabic
    ? chaletDetails?.nameAr || chaletDetails?.name?.ar || chaletDetails?.name || ""
    : chaletDetails?.nameEn || chaletDetails?.name?.en || chaletDetails?.name || "";

  const buildBookingItems = () => [
    {
      item_id: String(chaletId),
      item_name: analyticsChaletName,
      price: Number(totalPrice) || 0,
      quantity: selectedDates.length || 1,
    },
  ];

  // Fired only on a CONFIRMED, paid booking (wallet success, instant success, or
  // payment-polling success) — never when the payment URL merely opens.
  const trackPurchase = (transactionId: string) => {
    logEvent(ANALYTICS_EVENTS.PURCHASE, {
      transaction_id: String(transactionId),
      currency: ANALYTICS_CURRENCY,
      value: Number(totalPrice) || 0,
      payment_type: `${paymentMethod}_${paymentType.toLowerCase()}`,
      deposit_amount: Number(depositAmount) || 0,
      items: buildBookingItems(),
    });
  };

  /**
   * The slot is held by a booking this customer already created and never paid
   * for. Offer to finish that payment instead of leaving them locked out of
   * their own slot until the hold expires.
   *
   * `openPaymentSession` (the in-memory path) only works while this screen has
   * never unmounted. This asks the API for a FRESH session on the existing
   * booking, so it also works after the app was killed mid-payment.
   */
  const promptResumePendingBooking = (heldBookingId: string) => {
    Alert.alert(
      isArabic ? "لديك حجز بانتظار الدفع" : "Payment already pending",
      isArabic
        ? "لديك حجز لهذا اليوم والفترة بانتظار الدفع. أكمل دفع الحجز الحالي بدل إنشاء حجز جديد."
        : "You already have a booking awaiting payment for this day and shift. Continue that payment instead of creating a new one.",
      [
        {
          text: isArabic ? "عرض الحجز" : "View booking",
          style: "cancel",
          onPress: () => {
            router.replace({
              pathname: "/(tabs)/(customer)/booking-success",
              params: { id: heldBookingId },
            });
          },
        },
        {
          text: isArabic ? "إكمال الدفع" : "Continue payment",
          onPress: () => {
            void resumePendingBookingPayment(heldBookingId);
          },
        },
      ],
    );
  };

  const resumePendingBookingPayment = async (heldBookingId: string) => {
    try {
      const result = await reopenPaymentSession({
        id: heldBookingId,
        paymentMethod,
        paymentModel: paymentType.toLowerCase(),
      }).unwrap();

      if (result?.payment?.paymentUrl) {
        setCreatedBookingId(heldBookingId);
        setPaymentTransactionId(result.payment.transactionId);
        setPaymentUrl(result.payment.paymentUrl);
        setPendingBookingKey(currentBookingKey);
        await openPaymentSession(
          result.payment.paymentUrl,
          result.payment.transactionId,
        );
        return;
      }

      // A wallet payment settles server-side with no session to open. This
      // branch was unreachable while the screen hardcoded "wayl" (the API
      // always answered with a payment URL), so it never set the receipt's
      // fields — and this is precisely the path taken after the app was killed,
      // where nothing else has filled them in.
      if (result?.booking?.status === "confirmed") {
        setCreatedBookingId(heldBookingId);
        setCreatedBookingCode(result.booking?.bookingCode || null);
        setCreatedBookingStatus(result.booking?.status || null);
        trackPurchase(heldBookingId);
        successSheetRef.current?.present();
        return;
      }

      // No URL and not confirmed — send them to the booking rather than leaving
      // them on a checkout screen that can only fail the same way again.
      router.replace({
        pathname: "/(tabs)/(customer)/booking-success",
        params: { id: heldBookingId },
      });
    } catch (error: any) {
      Alert.alert(
        isArabic ? "خطأ" : "Error",
        error?.data?.message ||
          (isArabic
            ? "تعذّر إكمال الدفع. افتح الحجز من قائمة حجوزاتك وحاول مرة أخرى."
            : "Could not resume the payment. Open the booking from your bookings list and try again."),
      );
    }
  };

  /**
   * The booking API reads the ID photos off the customer's PROFILE, not off this
   * form, so leaving the WHO tab has to persist them first. Every route to the
   * WHERE tab goes through here — the footer button and the tab bar both — since
   * skipping it produced a booking that only failed at submit, with the API's
   * Arabic-only rejection.
   */
  const ensureIdUploadedToProfile = async (): Promise<boolean> => {
    if (!idImage1 || !idImage2) return false;
    try {
      const idFormData = new FormData();
      await appendImagePart(idFormData, "idCardFrontImage", idImage1, "id_front");
      await appendImagePart(idFormData, "idCardBackImage", idImage2, "id_back");
      await uploadIdCardImages(idFormData).unwrap();
      return true;
    } catch (e: any) {
      Alert.alert(
        isArabic ? "تنبيه" : "Alert",
        e instanceof ImagePrepareError
          ? (isArabic
              ? "تعذّرت معالجة صورة الهوية، جرّب صورة أخرى"
              : "Could not process the ID photo, try another photo")
          : e?.data?.message ||
              (isArabic
                ? "تعذّر رفع صور الهوية، يرجى المحاولة مرة أخرى"
                : "Failed to upload ID photos, please try again"),
      );
      return false;
    }
  };

  /**
   * Going BACK is always free — the customer is only reviewing what they already
   * entered. Going forward past an unfinished tab is not, and the tap says which
   * one and why rather than doing nothing.
   */
  const handleTabPress = async (tab: TabType) => {
    const order: TabType[] = ["WHEN", "WHO", "WHERE"];
    if (order.indexOf(tab) <= order.indexOf(activeTab)) {
      setActiveTab(tab);
      return;
    }

    const blocker = whenBlocker || (tab === "WHERE" ? whoBlocker : null);
    if (blocker) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setActiveTab(whenBlocker ? "WHEN" : "WHO");
      Alert.alert(isArabic ? "تنبيه" : "Alert", blocker);
      return;
    }

    // Any forward jump to WHERE leaves the WHO tab, including the one that skips
    // straight over it from WHEN.
    if (tab === "WHERE") {
      if (isUploadingId) return;
      if (!(await ensureIdUploadedToProfile())) return;
    }

    setActiveTab(tab);
  };

  const handleNext = async () => {
    // Guard against double submission ONLY while the create request is in flight
    // (prevents the race where rapid taps fire multiple createBooking() calls).
    // Do NOT also block on isWaitingForPayment — that would dead-lock the button
    // if a payment session was opened and the user returned without completing.
    if (isCreatingBooking || isUploadingId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === "WHEN") {
      // Advancing with no date (or a date with no shift) carried an empty
      // selection all the way to the submit button, where it failed.
      if (whenBlocker) {
        Alert.alert(isArabic ? "تنبيه" : "Alert", whenBlocker);
        return;
      }
      setActiveTab("WHO");
    } else if (activeTab === "WHO") {
      // Capacity is checked BEFORE the ID upload: the backend rejects
      // guestsCount > chalet.capacity, and making the customer upload two ID
      // photos for a booking that can only ever 400 is the worst place to find
      // out. The counter itself can't be pushed over capacity — this catches a
      // count seeded from the search filter before chaletDetails had loaded.
      if (chaletCapacity > 0 && adultCount > chaletCapacity) {
        Alert.alert(
          isArabic ? "تنبيه" : "Alert",
          isArabic
            ? `السعة القصوى لهذا الشاليه هي ${chaletCapacity} شخص. يرجى تقليل عدد الضيوف.`
            : `Maximum capacity for this chalet is ${chaletCapacity} guests. Please reduce the guest count.`,
        );
        return;
      }
      // ID document is required for BOTH family and youth bookings.
      if (!idImage1 || !idImage2) {
        Alert.alert(
          isArabic ? "تنبيه" : "Alert",
          isArabic
            ? "يرجى رفع صورتي الهوية لإتمام الحجز"
            : "Please upload both ID photos to complete the booking",
        );
        return;
      }
      if (!(await ensureIdUploadedToProfile())) return;
      logEvent(ANALYTICS_EVENTS.BEGIN_CHECKOUT, {
        currency: ANALYTICS_CURRENCY,
        value: Number(totalPrice) || 0,
        items: buildBookingItems(),
      });
      setActiveTab("WHERE");
    } else {
      // We are on DETAILS tab — create the booking via API
      try {
        if (selectedDates.length === 0) {
          Alert.alert(
            isArabic ? "تنبيه" : "Alert",
            isArabic ? "يرجى اختيار تاريخ الحجز" : "Please select a booking date",
          );
          setActiveTab("WHEN");
          return;
        }

        const allDaysHaveShifts = selectedDates.every(
          (day) => selectedShifts[day],
        );
        if (!allDaysHaveShifts) {
          Alert.alert(
            isArabic ? "تنبيه" : "Alert",
            isArabic
              ? "يرجى اختيار فترة لكل يوم مختار"
              : "Please select a shift for every selected day",
          );
          setActiveTab("WHEN");
          return;
        }

        // POST /customer/bookings books exactly ONE date (CreateBookingDto has a
        // single `bookingDate`, Booking has no end date, and there is no batch
        // route), so the calendar is single-select. This is the last line of
        // defence: submitting a multi-day selection would show the customer an
        // N-night total and deposit while reserving and charging one night.
        if (selectedDates.length > 1) {
          Alert.alert(
            isArabic ? "تنبيه" : "Alert",
            isArabic
              ? "يمكن حجز يوم واحد في كل عملية. يرجى اختيار يوم واحد."
              : "Only one day can be booked at a time. Please select a single day.",
          );
          setActiveTab("WHEN");
          return;
        }

        // Same capacity rule as the WHO tab — re-checked here because the user
        // can come straight back to this tab via the "edit" shortcut.
        if (chaletCapacity > 0 && adultCount > chaletCapacity) {
          Alert.alert(
            isArabic ? "تنبيه" : "Alert",
            isArabic
              ? `السعة القصوى لهذا الشاليه هي ${chaletCapacity} شخص. يرجى تقليل عدد الضيوف.`
              : `Maximum capacity for this chalet is ${chaletCapacity} guests. Please reduce the guest count.`,
          );
          setActiveTab("WHO");
          return;
        }

        // The API rejects a FAMILY/YOUTH booking without both ID photos on the
        // customer's profile, in Arabic only. Catch it here so an English user
        // gets a message they can read, on the tab that can fix it.
        if (!idImage1 || !idImage2) {
          Alert.alert(
            isArabic ? "تنبيه" : "Alert",
            isArabic
              ? "يرجى رفع صورتي الهوية لإتمام الحجز"
              : "Please upload both ID photos to complete the booking",
          );
          setActiveTab("WHO");
          return;
        }

        if (chaletId) {
          const bookings = selectedDates.map((day) => ({
            bookingDate: getLocalDateKey(getDateForDay(day)),
            shiftId: selectedShifts[day],
          }));

          const isDelayedBooking = chaletDetails?.bookingType === "delayed";

          // A booking we already created and never paid for still holds this
          // slot (the backend keeps it PENDING_PAYMENT for ~15 minutes), so
          // creating a second one for the same date/shift is rejected with
          // "This shift is not available for the selected date" — the customer
          // would be told their OWN slot is taken, with no way to pay for it.
          // `POST /customer/bookings/:id/pay` is delayed-chalets-only, so the
          // resume path is re-opening the payment session we already have.
          if (
            !isDelayedBooking &&
            createdBookingId &&
            paymentUrl &&
            paymentTransactionId &&
            pendingBookingKey &&
            pendingBookingKey === currentBookingKey
          ) {
            await openPaymentSession(paymentUrl, paymentTransactionId);
            return;
          }

          if (!isDelayedBooking) {
            logEvent(ANALYTICS_EVENTS.ADD_PAYMENT_INFO, {
              currency: ANALYTICS_CURRENCY,
              value:
                paymentType === "DEPOSIT"
                  ? Number(depositAmount) || 0
                  : Number(totalPrice) || 0,
              payment_type: `${paymentMethod}_${paymentType.toLowerCase()}`,
            });
          }

          const result = await createBooking({
            chaletId,
            shiftId: bookings[0].shiftId,
            bookingDate: bookings[0].bookingDate,
            adultsCount: adultCount,
            // The screen never asks for children — the guest counter is a single
            // "adults" number, and the API needs both fields to agree.
            childrenCount: 0,
            guestsCount: adultCount,
            ...(isDelayedBooking ? {} : {
              paymentModel: paymentType.toLowerCase() as "deposit" | "full",
              paymentMethod,
            }),
            // Only the optional ones: mandatory amenities are applied server-side,
            // and echoing them back would be the app asserting a charge it does
            // not own.
            ...(selectedAmenityIds.length ? { amenityIds: selectedAmenityIds } : {}),
            // The server re-validates and re-prices the code; sending it is a
            // request, not an assertion of the amount shown above.
            ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
            notes,
            audienceType: guestType,
            // Reports what actually happened rather than asserting consent: the
            // gate is the only thing that sets this, so a booking that somehow
            // reached here without it is recorded as having no acceptance.
            acceptedTerms: termsAccepted,
          }).unwrap();

          // Every branch below shows the same receipt sheet, so the code and
          // amounts it needs are captured once here.
          setCreatedBookingCode(result.booking?.bookingCode || null);
          setCreatedBookingStatus(result.booking?.status || null);

          if (result.booking?.status === "pending_approval" || !result.payment) {
            setCreatedBookingId(result.booking.id);
            // Not a paid purchase yet — track as a request/lead, not a purchase.
            logEvent(ANALYTICS_EVENTS.BOOKING_REQUEST, {
              currency: ANALYTICS_CURRENCY,
              value: Number(totalPrice) || 0,
              transaction_id: String(result.booking.id),
              items: buildBookingItems(),
            });
            successSheetRef.current?.present();
          } else if (result.payment?.paymentUrl) {
            setCreatedBookingId(result.booking.id);
            setPaymentTransactionId(result.payment.transactionId);
            // Remember the session and what it was for, so an abandoned payment
            // can be resumed instead of creating a duplicate booking.
            setPaymentUrl(result.payment.paymentUrl);
            setPendingBookingKey(currentBookingKey);

            await openPaymentSession(
              result.payment.paymentUrl,
              result.payment.transactionId,
            );
          } else {
            // Settled without a payment session — the API confirmed it outright.
            setCreatedBookingId(result.booking.id);
            trackPurchase(result.booking.id);
            successSheetRef.current?.present();
          }
        } else {
          Alert.alert(
            isArabic ? "خطأ" : "Error",
            isArabic
              ? "معلومات الشاليه غير مكتملة"
              : "Chalet information is incomplete",
          );
        }
      } catch (error: any) {
        const message = String(error?.data?.message || "");

        // The server re-prices the booking (a coupon can be worth less than the
        // screen showed, and the deposit is rounded server-side), so its
        // `amountDue` can land a little above the balance this screen checked
        // against. Say so in Arabic and move them to the card rather than
        // leaving the API's English string in an alert.
        if (/insufficient wallet|رصيد المحفظة/i.test(message)) {
          setPaymentMethod("wayl");
          Alert.alert(
            isArabic ? "رصيد المحفظة لا يكفي" : "Insufficient wallet balance",
            isArabic
              ? "رصيد محفظتك لا يغطي مبلغ هذا الحجز. تم اختيار الدفع بالبطاقة، حاول مرة أخرى."
              : "Your wallet doesn't cover this booking. Card payment has been selected — please try again.",
          );
          return;
        }

        // The API identified the slot's holder as this customer's own unpaid
        // booking and handed back its id. This is the path that survives the
        // screen being unmounted (killed app, backed out and came back), where
        // the in-memory paymentUrl below is long gone.
        if (error?.data?.key === "SLOT_HELD_BY_OWN_PENDING_BOOKING") {
          const heldBookingId = error?.data?.variables?.bookingId;
          if (heldBookingId) {
            promptResumePendingBooking(heldBookingId);
            return;
          }
        }

        // "This shift is not available" after we already created a booking for
        // this exact slot means the customer's OWN unpaid booking is what is
        // holding it. Say that, and offer to finish paying for it — the generic
        // error left them staring at "your slot is taken" for 15 minutes.
        if (
          paymentUrl &&
          paymentTransactionId &&
          pendingBookingKey === currentBookingKey &&
          /not available/i.test(message)
        ) {
          const resumeUrl = paymentUrl;
          const resumeTxn = paymentTransactionId;
          Alert.alert(
            isArabic ? "لديك حجز بانتظار الدفع" : "Payment already pending",
            isArabic
              ? "لديك حجز لهذا اليوم والفترة بانتظار الدفع. أكمل دفع الحجز الحالي بدل إنشاء حجز جديد."
              : "You already have a booking awaiting payment for this day and shift. Continue that payment instead of creating a new one.",
            [
              { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
              {
                text: isArabic ? "إكمال الدفع" : "Continue payment",
                onPress: () => {
                  void openPaymentSession(resumeUrl, resumeTxn);
                },
              },
            ],
          );
          return;
        }

        Alert.alert(
          t("common.error") || "Error",
          message || t("booking.bookingError") || "Failed to create booking",
        );
      }
    }
  };

  /**
   * The footer button's real onPress.
   *
   * On the last tab it does not submit — it shows the chalet's terms first and
   * only runs `handleNext` once the customer taps موافق. Every other tab is
   * plain navigation and goes straight through.
   */
  const handlePrimaryPress = () => {
    if (activeTab !== "WHERE" || termsAccepted) {
      void handleNext();
      return;
    }

    // Same double-submit guard handleNext opens with, applied before the sheet
    // so a second tap mid-request cannot stack another sheet on top.
    if (isCreatingBooking || isUploadingId) return;

    // Anything that would bounce the customer back to an earlier tab has to be
    // said BEFORE the terms, not after they agree to them. `handleNext` still
    // re-checks all of this — this only fixes the order the two are surfaced in.
    const blocker = whenBlocker || whoBlocker;
    if (blocker) {
      void handleNext();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    termsSheetRef.current?.present();
  };

  const handleTermsAgree = () => {
    if (termsSubmitRef.current) return;

    setTermsAccepted(true);
    termsSheetRef.current?.dismiss();
    // handleNext can present the receipt sheet or the payment-processing sheet,
    // and gorhom will not open one while another is still animating out.
    termsSubmitRef.current = setTimeout(() => {
      termsSubmitRef.current = null;
      void handleNext();
    }, 300);
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
      
      let activeShiftId = "";
      if (filteredSelectedShift && !isShiftBookedForDay(day, filteredSelectedShift.id)) {
        activeShiftId = filteredSelectedShift.id;
      } else {
        const nonBookedShift = availableShifts.find((s: any) => !isShiftBookedForDay(day, s.id));
        activeShiftId = nonBookedShift ? nonBookedShift.id : (initialShift?.id || "");
      }

      if (activeShiftId) {
        setSelectedShifts((prevShifts) => ({
          ...prevShifts,
          [day]: activeShiftId,
        }));
      }
      return updated;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * A booking is ONE day.
   *
   * The API creates a single Booking row from a single `bookingDate` — there is
   * no end date on the entity and no batch route — so a multi-day range could
   * only ever be *displayed*: the screen priced and charged a deposit on N
   * nights while the server reserved and charged for the first one, leaving the
   * rest free for anyone else to take. The calendar is therefore single-select,
   * and `end` is deliberately ignored here rather than expanded into a range.
   *
   * `selectedDates` / `selectedShifts` stay keyed by day-of-month (the shift
   * rows and pricing are built from them), but now always hold exactly one day.
   */
  const handleCalendarSelect = useCallback(
    (start: Date | null, _end: Date | null) => {
      setSelectedStartDate(start ? new Date(start) : null);
      setSelectedEndDate(null);

      if (!start) {
        setSelectedDates([]);
        setSelectedShifts({});
        return;
      }

      const picked = new Date(start);
      picked.setHours(0, 0, 0, 0);
      const pickedDay = picked.getDate();

      // Resolve availability against the picked date DIRECTLY. Going through
      // isShiftBookedForDay here would read `selectedDateRange`, which still
      // holds the *previous* selection at this point in the render.
      const isBlocked = (shiftId: string) => isShiftBookedOnDate(picked, shiftId);

      // A shift with no pricing (or the <= 1 "closed" sentinel) for that weekday
      // can't be booked either — auto-selecting one produced a 0 total and a
      // rejected submit.
      const dayOfWeek = picked.getDay();
      const isOpen = (shift: any) => {
        const pricing = shift?.pricing?.find(
          (p: any) => p.dayOfWeek === dayOfWeek,
        );
        return !!pricing && Number(pricing.price) > 1;
      };
      const isSelectable = (shift: any) =>
        !!shift && isOpen(shift) && !isBlocked(shift.id);

      const preferredShiftId =
        filteredSelectedShift?.id ||
        Object.values(selectedShifts).find(Boolean) ||
        (availableShifts.length === 1 ? availableShifts[0].id : "");
      const preferredShift = availableShifts.find(
        (s: any) => s.id === preferredShiftId,
      );

      const chosenShift = isSelectable(preferredShift)
        ? preferredShift
        : availableShifts.find(isSelectable);

      setCurrentMonth(new Date(picked));
      setCalendarMonth(new Date(picked));
      setSelectedDates([pickedDay]);
      setSelectedShifts(chosenShift ? { [pickedDay]: chosenShift.id } : {});
    },
    [
      availableShifts,
      filteredSelectedShift,
      selectedShifts,
      isShiftBookedOnDate,
    ],
  );

  // The calendar sheet paged to another month — follow it with the availability
  // query so the days it is about to draw carry that month's real occupancy.
  const handleCalendarMonthChange = useCallback((date: Date) => {
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, []);

  const toggleShiftForDay = (day: number, shiftId: string) => {
    if (isShiftBookedForDay(day, shiftId)) return;
    const shiftObj = availableShifts.find((s: any) => s.id === shiftId);
    if (shiftObj && isShiftClosedForDay(day, shiftObj)) return; // closed → not selectable
    setSelectedShifts((prev) => ({
      ...prev,
      [day]: prev[day] === shiftId ? "" : shiftId,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Stable handler references for GuestCounter so it isn't handed fresh closures
  // on every parent render.
  const handleIncrementAdults = useCallback(() => {
    const totalNow = adultCount;
    const maxCap = chaletCapacity > 0 ? chaletCapacity : 50;
    if (totalNow < maxCap) {
      setAdultCount(adultCount + 1);
    } else {
      Alert.alert(
        isArabic ? "تنبيه" : "Alert",
        isArabic
          ? `السعة القصوى لهذا الشاليه هي ${maxCap} شخص. لديك حالياً ${totalNow} ضيف.`
          : `Maximum capacity for this chalet is ${maxCap} guests. You currently have ${totalNow}.`,
      );
    }
  }, [adultCount, chaletCapacity, isArabic]);

  const handleDecrementAdults = useCallback(() => {
    setAdultCount(Math.max(1, adultCount - 1));
  }, [adultCount]);

  const renderDetailsTab = () => (
    <Animated.View
      style={styles.detailsContainer}
    >
      <HorizontalCard
        chalet={{
          id: chaletDetails?.id || "",
          title: pickTranslation(chaletDetails, isArabic),
          location: pickTranslation(chaletDetails?.region, isArabic),
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

      <Animated.View
        style={styles.detailsMapCard}
      >
        <View style={styles.mapSnippetWrapper}>
          <ExpoImage
            source={{
              uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${chaletDetails?.longitude || 44.3661},${chaletDetails?.latitude || 33.3152},13,0/600x300?access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
            }}
            style={styles.mapSnippet}
          />
          <View style={styles.mapMarker}>
            <SolarMapPointBold size={32} color={Colors.primary} />
          </View>
        </View>
        <ThemedText style={styles.mapAddressLabel}>
          {pickTranslation(chaletDetails?.region, isArabic)}
        </ThemedText>
      </Animated.View>

      <Animated.View
        style={styles.infoSectionCard}
      >
        <ThemedText style={[styles.sectionTitle, { alignSelf: 'flex-start', textAlign }]}>
          {t("booking.customerInfo")}
        </ThemedText>
        <View style={styles.divider} />
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign }]}>
            {t("booking.name")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
            {user?.name || t("booking.nameValue")}
          </ThemedText>
        </View>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign }]}>
            {t("booking.phone")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd, direction: "ltr" }]}>
            {user?.phone || t("booking.phoneValue")}
          </ThemedText>
        </View>
      </Animated.View>

      <Animated.View
        style={styles.infoSectionCard}
      >
        <View style={[styles.sectionHeaderRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.sectionTitle, { textAlign }]}>
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
          <ThemedText style={[styles.infoLabel, { textAlign }]}>
            {t("booking.date")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
            {bookingDateString}
          </ThemedText>
        </View>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign }]}>
            {t("booking.shift")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
            {selectedDates.length > 1
              ? isArabic
                ? "فترات متعددة"
                : "Multiple Shifts"
              : selectedDates.length === 0
                ? t("booking.noShift")
                : (function () {
                    const day = selectedDates[0];
                    const shiftId = selectedShifts[day];
                    const shift = chaletDetails?.shifts?.find(
                      (s: any) => s.id === shiftId,
                    );
                    return shift
                      ? pickTranslation(shift.name, isArabic)
                      : t("booking.noShift");
                  })()}
          </ThemedText>
        </View>
        <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.infoLabel, { textAlign }]}>
            {t("booking.guests")}
          </ThemedText>
          <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
            {adultCount}
          </ThemedText>
        </View>
        {/* Price/total summary — hidden for delayed (request-only) chalets, where
            payment happens later after the owner approves. */}
        {chaletDetails?.bookingType !== "delayed" && (
          <>
            <View style={styles.divider} />
            <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
              <ThemedText style={[styles.infoLabel, { textAlign }]}>
                {t("booking.shiftPrice") || (isArabic ? "سعر الفترة" : "Shift Price")}
              </ThemedText>
              <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
                {selectedShiftPrice.toLocaleString()} {t("common.iqd")}
              </ThemedText>
            </View>
            {extraGuestsPrice > 0 && (
              <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
                <ThemedText style={[styles.infoLabel, { textAlign }]}>
                  {isArabic ? "رسوم الأشخاص الإضافيين" : "Extra Guest Fees"}
                </ThemedText>
                <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
                  {extraGuestsPrice.toLocaleString()} {t("common.iqd")}
                </ThemedText>
              </View>
            )}
            {/* Itemised so the guest can see exactly which amenity they are
                paying for, rather than an unexplained bump in the total. */}
            {mandatoryAmenities.map((a: any) => (
              <View
                key={a.chaletAmenityId}
                style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}
              >
                <ThemedText style={[styles.infoLabel, { textAlign }]}>
                  {amenityName(a.name)}
                </ThemedText>
                <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
                  {Number(a.price).toLocaleString()} {t("common.iqd")}
                </ThemedText>
              </View>
            ))}
            {optionalAmenities
              .filter((a: any) => selectedAmenityIds.includes(a.chaletAmenityId))
              .map((a: any) => (
                <View
                  key={a.chaletAmenityId}
                  style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}
                >
                  <ThemedText style={[styles.infoLabel, { textAlign }]}>
                    {amenityName(a.name)}
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { textAlign: textAlignEnd }]}>
                    {Number(a.price).toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                </View>
              ))}
            {/* Platform campaign — only rendered when one actually applies, so
                nothing changes for bookings with no discount running. */}
            {discountAmount > 0 && (
              <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
                <ThemedText style={[styles.infoLabel, { color: Colors.secondary, textAlign }]}>
                  {amenityName(discountLabel) || (isArabic ? "خصم" : "Discount")}
                </ThemedText>
                <ThemedText
                  style={[styles.infoValue, { color: Colors.secondary, textAlign: textAlignEnd }]}
                >
                  − {discountAmount.toLocaleString()} {t("common.iqd")}
                </ThemedText>
              </View>
            )}
            {/* The coupon gets its own line so the customer can see the code they
                typed actually did something, separately from any campaign. */}
            {couponAmount > 0 && (
              <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
                <ThemedText style={[styles.infoLabel, { color: Colors.secondary, textAlign }]}>
                  {isArabic ? "كود " : "Code "}{appliedCoupon?.code}
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: Colors.secondary, textAlign: textAlignEnd }]}>
                  − {couponAmount.toLocaleString()} {t("common.iqd")}
                </ThemedText>
              </View>
            )}

            <CouponField
              value={couponInput}
              onChangeValue={(text) => {
                setCouponInput(text);
                setCouponError(null);
              }}
              appliedCode={appliedCoupon?.code}
              error={couponError}
              isChecking={isCheckingCoupon}
              onApply={applyCoupon}
              onRemove={removeCoupon}
            />

            <View style={[styles.infoRow, styles.row, { flexDirection: rowDirection }]}>
              <ThemedText style={[styles.infoLabel, { fontFamily: "IBMPlexSansArabic-Bold", textAlign }]}>
                {t("booking.totalAmount")}
              </ThemedText>
              <View style={{ alignItems: isArabic ? "flex-start" : "flex-end" }}>
                {(discountAmount > 0 || couponAmount > 0) && (
                  <ThemedText
                    style={[
                      styles.infoValue,
                      {
                        textDecorationLine: "line-through",
                        opacity: 0.5,
                        fontSize: 12,
                        textAlign: textAlignEnd,
                      },
                    ]}
                  >
                    {originalPrice.toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                )}
                <ThemedText
                  style={[
                    styles.infoValue,
                    { fontFamily: "IBMPlexSansArabic-Medium", color: Colors.primary, textAlign: textAlignEnd },
                  ]}
                >
                  {totalPrice.toLocaleString()} {t("common.iqd")}
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </Animated.View>

      {/* Optional paid amenities — only rendered when the chalet actually has
          some, so nothing changes for the vast majority that are free. */}
      {optionalAmenities.length > 0 && (
        <Animated.View
          style={styles.infoSectionCard}
        >
          <ThemedText style={[styles.sectionTitle, { alignSelf: "flex-start", textAlign }]}>
            {isArabic ? "خدمات إضافية" : "Optional Extras"}
          </ThemedText>
          <View style={styles.divider} />
          {optionalAmenities.map((a: any) => {
            const isSelected = selectedAmenityIds.includes(a.chaletAmenityId);
            return (
              <PressableScale
                key={a.chaletAmenityId}
                onPress={() => toggleAmenity(a.chaletAmenityId)}
                style={[
                  styles.amenityOption,
                  { flexDirection: rowDirection },
                  isSelected && styles.amenityOptionActive,
                ]}
              >
                <View style={[styles.amenityCheck, isSelected && styles.amenityCheckActive]}>
                  {isSelected && <ThemedText style={styles.amenityCheckMark}>✓</ThemedText>}
                </View>
                <ThemedText style={[styles.amenityOptionLabel, { textAlign }]} numberOfLines={1}>
                  {amenityName(a.name)}
                </ThemedText>
                <ThemedText style={[styles.amenityOptionPrice, { textAlign: textAlignEnd }]}>
                  {Number(a.price).toLocaleString()} {t("common.iqd")}
                </ThemedText>
              </PressableScale>
            );
          })}
        </Animated.View>
      )}

      <Animated.View
        style={styles.infoSectionCard}
      >
        <ThemedText style={[styles.sectionTitle, { alignSelf: 'flex-start', textAlign }]}>
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
              textAlign: inputTextAlign,
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
      </Animated.View>

      {chaletDetails?.bookingType === "delayed" ? (
        /* ── Delayed Booking: No payment selection ── */
        <View style={[styles.infoSectionCard, { marginTop: 16 }]}>
          <View style={{ flexDirection: rowDirection, alignItems: "center", gap: 10, marginBottom: 10 }}>
            <SolarInfoCircleBold size={22} color="#F59E0B" />
            <ThemedText style={[styles.sectionTitle, { textAlign, flex: 1 }]}>
              {isArabic ? "ملاحظة حول الحجز" : "Booking Note"}
            </ThemedText>
          </View>
          <ThemedText style={{ color: "#64748B", fontSize: 13, fontFamily: "IBMPlexSansArabic-Medium", lineHeight: 22, textAlign }}>
            {isArabic
              ? "سيتم إرسال طلب الحجز إلى صاحب الشاليه للموافقة عليه. بعد الموافقة ستصلك رسالة عبر واتساب تحتوي على رابط لإتمام عملية الدفع."
              : "Your booking request will be sent to the chalet owner for approval. Once approved, you will receive a WhatsApp message with a link to complete the payment."}
          </ThemedText>
        </View>
      ) : (
        /* ── Instant Booking: Show payment selection ── */
        <>
          <ThemedText style={[styles.paymentMainTitle, { alignSelf: 'flex-start', textAlign }]}>
            {t("booking.paymentTitle")}
          </ThemedText>

          {depositPercentage > 0 && (
            <PressableScale
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
                  { textAlign },
                ]}
              >
                {t("booking.depositPay")} ({depositPercentage}%)
              </ThemedText>
              <ThemedText
                style={[
                  styles.paymentVal,
                  paymentType === "DEPOSIT" && styles.paymentValActive,
                  { textAlign: textAlignEnd },
                ]}
              >
                {depositAmount.toLocaleString()} {t("common.iqd")}
              </ThemedText>
            </PressableScale>
          )}

          <PressableScale
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
                { textAlign },
              ]}
            >
              {t("booking.fullPay")}
            </ThemedText>
            <ThemedText
              style={[
                styles.paymentVal,
                paymentType === "FULL" && styles.paymentValActive,
                { textAlign: textAlignEnd },
              ]}
            >
              {totalPrice.toLocaleString()} {t("common.iqd")}
            </ThemedText>
          </PressableScale>

          <CancellationPolicyCard
            tiers={cancellationTiers}
            isLoading={isLoadingCancellationPolicies}
          />

          <View style={styles.agreementWrapper}>
            <ThemedText style={styles.agreementText}>
              {t("booking.agreement")}{" "}
              <ThemedText
                style={styles.agreementLink}
                onPress={() => openChaletInfo("terms")}
                suppressHighlighting
              >
                {t("booking.terms")}
              </ThemedText>{" "}
              {t("common.and")}{" "}
              <ThemedText
                style={styles.agreementLink}
                onPress={() => openChaletInfo("policies")}
                suppressHighlighting
              >
                {t("booking.policy")}
              </ThemedText>
            </ThemedText>
          </View>

          <ThemedText style={[styles.paymentMainTitle, { alignSelf: 'flex-start', textAlign, marginTop: 16 }]}>
            {t("booking.paymentMethod") || "طريقة الدفع"}
          </ThemedText>

          <View style={[styles.methodRow, { flexDirection: rowDirection }]}>
            {isWaylEnabled && (
            <PressableScale
              style={[
                styles.methodCard,
                paymentMethod === "wayl" && styles.methodCardActive,
              ]}
              onPress={() => setPaymentMethod("wayl")}
            >
              <SolarCardBold
                size={22}
                color={paymentMethod === "wayl" ? "#FFFFFF" : "#64748B"}
              />
              <ThemedText
                style={[
                  styles.methodLabel,
                  paymentMethod === "wayl" && styles.methodLabelActive,
                ]}
              >
                {t("booking.wayl")}
              </ThemedText>
            </PressableScale>
            )}

            {/* Hidden rather than shown-and-refused when the admin has switched
                the wallet off — the API 400s on it either way. */}
            {isWalletEnabled && (
              <PressableScale
                style={[
                  styles.methodCard,
                  paymentMethod === "wallet" && styles.methodCardActive,
                  !walletCoversAmount && !isWalletUnsettled && styles.methodCardDisabled,
                ]}
                disabled={!walletCoversAmount}
                onPress={() => setPaymentMethod("wallet")}
              >
                <SolarWalletBold
                  size={22}
                  color={paymentMethod === "wallet" ? "#FFFFFF" : "#64748B"}
                />
                <ThemedText
                  style={[
                    styles.methodLabel,
                    paymentMethod === "wallet" && styles.methodLabelActive,
                  ]}
                >
                  {isArabic ? "المحفظة" : "Wallet"}
                </ThemedText>
                {/* The balance is the whole reason to pick this or not, so it is
                    on the card rather than behind a failed submit. */}
                <ThemedText
                  style={[
                    styles.methodBalance,
                    paymentMethod === "wallet" && styles.methodLabelActive,
                  ]}
                >
                  {isWalletLoading
                    ? (isArabic ? "..." : "...")
                    : `${walletBalance.toLocaleString()} ${t("common.iqd")}`}
                </ThemedText>
              </PressableScale>
            )}
          </View>

          {isWalletUnsettled ? null : !isWaylEnabled && !canPayByWallet ? (
            // Card off and wallet unusable: there is nothing to tap, so say why
            // rather than showing an empty row and a button that only 400s.
            <ThemedText style={[styles.methodHint, styles.methodHintStrict, { textAlign }]}>
              {isArabic
                ? "لا تتوفر طريقة دفع حالياً. اشحن محفظتك أو حاول لاحقاً."
                : "No payment method is available right now. Top up your wallet or try again later."}
            </ThemedText>
          ) : (
            isWalletEnabled && !walletCoversAmount && (
              <ThemedText style={[styles.methodHint, { textAlign }]}>
                {isArabic
                  ? `رصيد المحفظة لا يكفي لدفع ${amountDue.toLocaleString()} ${t("common.iqd")}.`
                  : `Your wallet balance doesn't cover ${amountDue.toLocaleString()} ${t("common.iqd")}.`}
              </ThemedText>
            )
          )}

          {paymentMethod === "wallet" && (
            <ThemedText style={[styles.methodHint, { textAlign }]}>
              {isArabic
                ? `سيُخصم ${amountDue.toLocaleString()} ${t("common.iqd")} من محفظتك ويُؤكَّد الحجز فوراً.`
                : `${amountDue.toLocaleString()} ${t("common.iqd")} will be deducted from your wallet and the booking confirmed immediately.`}
            </ThemedText>
          )}
        </>
      )}
    </Animated.View>
  );

  const renderCalendarSheet = () => (
    <BottomSheetModal
      ref={calendarSheetRef}
      snapPoints={["65%"]}
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
        style={{ paddingHorizontal: 16, paddingTop: 10, flex: 1 }}
      >
        <RangeCalendar
          onSelect={handleCalendarSelect}
          initialStartDate={selectedStartDate ?? undefined}
          // Single-select: the API books exactly one `bookingDate`, so there is
          // no end date to seed (see handleCalendarSelect).
          selectionMode="single"
          reservedDates={bookedDateStrings}
          onMonthChange={handleCalendarMonthChange}
          loading={isCalendarMonthLoading}
        />
        <View style={{ marginTop: 20, paddingHorizontal: 4 }}>
          <PrimaryButton
            label={isArabic ? "تم" : "Done"}
            onPress={() => calendarSheetRef.current?.dismiss()}
            style={{
              width: "100%",
              shadowOpacity: 0,
              elevation: 0,
              height: 54,
              borderRadius: 12,
            }}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );

  // Nothing on this screen is meaningful without the chalet: the shifts, the
  // capacity, the prices and the deposit all come from it. Both states replace
  // the whole body rather than patching individual rows, so there is never a
  // moment where a real-looking 0 IQD is on screen.
  if (isChaletError) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderSection
          title={t("headers.bookingComplete")}
          showBackButton
          showLogo={false}
          userType={userType}
        />
        <ErrorState
          message={
            isArabic
              ? "تعذّر تحميل بيانات الشاليه، وبدونها لا نقدر نعرض الأسعار والفترات."
              : "Could not load this chalet, and without it we can't show prices or shifts."
          }
          onRetry={refetchChalet}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (isLoadingChalet || !chaletDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderSection
          title={t("headers.bookingComplete")}
          showBackButton
          showLogo={false}
          userType={userType}
        />
        <View style={styles.checkoutSkeleton}>
          <SkeletonBox width="100%" height={80} borderRadius={24} />
          <SkeletonBox width="60%" height={20} borderRadius={8} />
          <SkeletonBox width="100%" height={96} borderRadius={16} />
          <SkeletonBox width="100%" height={96} borderRadius={16} />
          <SkeletonBox width="100%" height={96} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

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
            onChange={handleTabPress}
            tabs={BOOKING_TABS}
            labels={{ WHERE: isArabic ? "التفاصيل" : "Details" }}
            disabledTabs={lockedTabs}
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
                    {isArabic ? "اختر يوماً للبدء" : "Select a day to start"}
                  </ThemedText>
                </View>
                <View style={styles.shiftsContainer}>
                  {availableShifts?.map((shift: any, index: number) => {
                    const shiftName = pickTranslation(shift.name, isArabic);
                    const previewNameEn = shift.name?.en?.toLowerCase() || "";
                    const previewNameAr = shift.name?.ar || "";
                    const isOvernight =
                      shift.type === "OVERNIGHT" ||
                      previewNameEn.includes("overnight") ||
                      previewNameEn.includes("night") ||
                      previewNameAr.includes("مبيت");
                    const isMorning =
                      !isOvernight &&
                      (shift.type === "MORNING" ||
                        previewNameEn.includes("morning") ||
                        previewNameAr.includes("صباح"));

                    return (
                      <Animated.View
                        key={`preview-${shift.id}`}
                        style={[
                          styles.shiftCardFlat,
                          { flexDirection: rowDirection, opacity: 0.6 },
                        ]}
                      >
                        <View style={styles.shiftIconCircleFlat}>
                          {isMorning ? (
                            <SolarSunBold size={22} color="#FBBF24" />
                          ) : isOvernight ? (
                            <ExpoImage
                              source={require("@/assets/shifts/sleep.svg")}
                              style={{ width: 24, height: 24 }}
                              contentFit="contain"
                            />
                          ) : (
                            <SolarMoonBold size={22} color="#6366F1" />
                          )}
                        </View>
                        <View
                          style={[
                            styles.shiftInfoFlat,
                            { alignItems: 'flex-start', marginHorizontal: 12 },
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
                            {Number(
                              shiftMinPrices[shift.id] ??
                                chaletDetails?.basePrice ??
                                0,
                            ).toLocaleString()}{" "}
                            {t("common.iqd")}
                          </ThemedText>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
                <PrimaryButton
                  label={isArabic ? "اختيار يوم" : "Choose a Day"}
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
                    {isArabic ? `يوم ${day}` : `Day ${day}`}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        isArabic ? "تأكيد" : "Confirm",
                        isArabic
                          ? "هل أنت متأكد من حذف هذا اليوم؟"
                          : "Are you sure you want to delete this day?",
                        [
                          { text: isArabic ? "إلغاء" : "Cancel" },
                          {
                            text: isArabic ? "حذف" : "Delete",
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
                        fontFamily: "IBMPlexSansArabic-Medium",
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
                    const isPast = isShiftPastForDay(day, shift.id);
                    const isClosed = isShiftClosedForDay(day, shift);
                    const isDisabled = isBooked || isClosed;
                    const shiftName = pickTranslation(shift.name, isArabic);

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
                      <PressableScale
                        key={`${day}-${shift.id}`}
                        disabled={isDisabled}
                        haptic={false}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        style={[
                          styles.shiftCardFlat,
                          { flexDirection: rowDirection },
                          isSelected && !isDisabled && {
                            borderColor: "#035DF9",
                            borderWidth: 1.5,
                            backgroundColor: "#F0F7FF",
                          },
                          isDisabled && {
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
                            { alignItems: 'flex-start', marginHorizontal: 12 },
                            { flex: 1 },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.shiftNameFlat,
                              isSelected && {
                                color: "#035DF9",
                                fontFamily: "IBMPlexSansArabic-Medium",
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
                          {isClosed ? (
                            <View style={styles.shiftClosedBadge}>
                              <ThemedText style={styles.shiftClosedText}>
                                {isArabic ? "مغلق" : "Closed"}
                              </ThemedText>
                            </View>
                          ) : isPast ? (
                            /* Its start time has passed — nobody booked it, so
                               "محجوز" would be wrong. */
                            <View style={styles.shiftClosedBadge}>
                              <ThemedText style={styles.shiftClosedText}>
                                {isArabic ? "انتهى الوقت" : "Time passed"}
                              </ThemedText>
                            </View>
                          ) : isBooked ? (
                            <View style={styles.shiftClosedBadge}>
                              <ThemedText style={styles.shiftClosedText}>
                                {isArabic ? "محجوز" : "Booked"}
                              </ThemedText>
                            </View>
                          ) : (
                            <ThemedText
                              style={[
                                styles.shiftPriceFlat,
                                isSelected && {
                                  color: "#035DF9",
                                  fontFamily: "IBMPlexSansArabic-Medium",
                                },
                              ]}
                            >
                              {Number(shiftPrice).toLocaleString()}{" "}
                              {t("common.iqd")}
                            </ThemedText>
                          )}
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            ))}

            {selectedDates.length > 0 && (
              <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
                <PrimaryButton
                  label={isArabic ? "تغيير التاريخ" : "Change Date"}
                  onPress={() => calendarSheetRef.current?.present()}
                  style={{ width: "100%", shadowOpacity: 0, elevation: 0 }}
                />
              </View>
            )}
          </>
        ) : activeTab === "WHO" ? (
          <View style={styles.whoContainer}>
            {/* Capacity Info Banner */}
            <View style={styles.capacityBanner}>
              {/* Base Capacity Row */}
              <View style={[styles.capacityRow, { flexDirection: rowDirection }]}>
                <View style={[styles.capacityIconWrapper, { backgroundColor: "#DBEAFE" }]}>
                  <SolarUsersGroupRoundedBold size={18} color="#035DF9" />
                </View>
                <ThemedText style={styles.capacityRowLabel}>
                  {isArabic ? "السعة الأساسية" : "Base Capacity"}
                </ThemedText>
                <View style={{ flex: 1 }} />
                <ThemedText style={[styles.capacityRowValue, { textAlign: textAlignEnd }]}>
                  {capacityLimit} {isArabic ? "أشخاص" : "guests"}
                </ThemedText>
              </View>

              <View style={styles.capacityDivider} />

              {/* Max Capacity Row */}
              {chaletDetails?.capacity && (
                <>
                  <View style={[styles.capacityRow, { flexDirection: rowDirection }]}>
                    <View style={[styles.capacityIconWrapper, { backgroundColor: "#FEE2E2" }]}>
                      <SolarInfoCircleBold size={18} color="#EF4444" />
                    </View>
                    <ThemedText style={styles.capacityRowLabel}>
                      {isArabic ? "الحد الأقصى" : "Maximum Capacity"}
                    </ThemedText>
                    <View style={{ flex: 1 }} />
                    <ThemedText style={[styles.capacityRowValue, { textAlign: textAlignEnd }]}>
                      {chaletDetails.capacity} {isArabic ? "شخص" : "guests"}
                    </ThemedText>
                  </View>
                  <View style={styles.capacityDivider} />
                </>
              )}

              {/* Extra Person Price Row */}
              {extraPersonPrice > 0 && (
                <View style={[styles.capacityRow, { flexDirection: rowDirection }]}>
                  <View style={[styles.capacityIconWrapper, { backgroundColor: "#FEF3C7" }]}>
                    <SolarCardBold size={18} color="#F59E0B" />
                  </View>
                  <ThemedText style={styles.capacityRowLabel}>
                    {isArabic ? "سعر الشخص الإضافي" : "Extra Person Price"}
                  </ThemedText>
                  <View style={{ flex: 1 }} />
                  <ThemedText style={[styles.capacityRowValue, { color: "#F59E0B", textAlign: textAlignEnd }]}>
                    {Number(extraPersonPrice).toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                </View>
              )}

              {/* Extra Guests Warning */}
              {extraGuestsCount > 0 && extraPersonPrice > 0 && (
                <View style={[styles.extraGuestNotice, { flexDirection: rowDirection }]}>
                  <SolarInfoCircleBold size={14} color="#F59E0B" />
                  <ThemedText style={[styles.extraGuestNoticeText, { textAlign }]}>
                    {isArabic
                      ? `لديك ${extraGuestsCount} ${extraGuestsCount === 1 ? "شخص إضافي" : "أشخاص إضافيين"} × ${Number(extraPersonPrice).toLocaleString()} ${t("common.iqd")} × ${selectedDates.length} ${selectedDates.length === 1 ? "يوم" : "أيام"} = ${extraGuestsPrice.toLocaleString()} ${t("common.iqd")}`
                      : `${extraGuestsCount} extra ${extraGuestsCount === 1 ? "guest" : "guests"} × ${Number(extraPersonPrice).toLocaleString()} ${t("common.iqd")} × ${selectedDates.length} ${selectedDates.length === 1 ? "day" : "days"} = ${extraGuestsPrice.toLocaleString()} ${t("common.iqd")}`}
                  </ThemedText>
                </View>
              )}

              {/* Max Capacity Reached Warning */}
              {chaletDetails?.capacity && totalGuestsNow >= chaletDetails.capacity && (
                <View style={[styles.capacityWarning, { flexDirection: rowDirection }]}>
                  <SolarInfoCircleBold size={14} color="#EF4444" />
                  <ThemedText style={[styles.capacityWarningText, { textAlign }]}>
                    {isArabic
                      ? "لقد وصلت للحد الأقصى من الضيوف"
                      : "You've reached the maximum guest limit"}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 12 }}>
              <ThemedText
                style={[
                  styles.guestLabel,
                  { alignSelf: 'flex-start', textAlign, marginBottom: 12, fontSize: 16 },
                ]}
              >
                {isArabic ? "نوع الحجز" : "Booking Type"}
              </ThemedText>
              <View
                style={[styles.guestTypeContainer, { flexDirection: rowDirection }]}
              >
                <PressableScale
                  style={[
                    styles.guestTypeTab,
                    guestType === "FAMILY" && styles.guestTypeTabActive,
                    chaletGuestPolicy === "youth" && styles.guestTypeTabDisabled,
                  ]}
                  onPress={() => setGuestType("FAMILY")}
                  disabled={chaletGuestPolicy === "youth"}
                >
                  <ThemedText
                    style={[
                      styles.guestTypeText,
                      guestType === "FAMILY" && styles.guestTypeTextActive,
                      chaletGuestPolicy === "youth" && styles.guestTypeTextDisabled,
                    ]}
                  >
                    {isArabic ? "عائلات" : "Families"}
                  </ThemedText>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.guestTypeTab,
                    guestType === "YOUTH" && styles.guestTypeTabActive,
                    chaletGuestPolicy === "family" && styles.guestTypeTabDisabled,
                  ]}
                  onPress={() => setGuestType("YOUTH")}
                  disabled={chaletGuestPolicy === "family"}
                >
                  <ThemedText
                    style={[
                      styles.guestTypeText,
                      guestType === "YOUTH" && styles.guestTypeTextActive,
                      chaletGuestPolicy === "family" && styles.guestTypeTextDisabled,
                    ]}
                  >
                    {isArabic ? "شباب" : "Youth"}
                  </ThemedText>
                </PressableScale>
              </View>
              {/* Says WHY the other tab is dead, so a dimmed control never reads
                  as a broken one. */}
              {guestTypeLocked && (
                <ThemedText style={[styles.guestTypeLockedHint, { textAlign }]}>
                  {chaletGuestPolicy === "family"
                    ? (isArabic
                        ? "هذا الشاليه يستقبل العوائل فقط، ولا تُقبل حجوزات الشباب."
                        : "This chalet accepts families only; bookings from young men are not accepted.")
                    : (isArabic
                        ? "هذا الشاليه يستقبل الشباب فقط، ولا تُقبل حجوزات العوائل."
                        : "This chalet accepts young men only; bookings from families are not accepted.")}
                </ThemedText>
              )}
            </View>

            {/* ID upload shown for both family and youth bookings. */}
            {(guestType === "FAMILY" || guestType === "YOUTH") && (
              <View style={styles.idUploadContainer}>
                <ThemedText
                  style={[
                    styles.guestLabel,
                    { alignSelf: 'flex-start', textAlign, marginBottom: 12, fontSize: 16 },
                  ]}
                >
                  {isArabic ? "رفع صور الهوية" : "Upload ID Photos"}
                </ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    justifyContent: "center",
                  }}
                >
                  <TouchableOpacity
                    style={styles.idUploadButton}
                    onPress={() => pickImage(1)}
                  >
                    {idImage1 ? (
                      <ExpoImage
                        source={{ uri: idImage1 }}
                        style={styles.idImagePreview}
                      />
                    ) : (
                      <>
                        <ThemedText style={{ fontSize: 24, color: "#94A3B8" }}>
                          +
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: "#94A3B8",
                            fontFamily: "IBMPlexSansArabic-Medium",
                          }}
                        >
                          {isArabic ? "الوجه الأول للهوية" : "ID Front Side"}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.idUploadButton}
                    onPress={() => pickImage(2)}
                  >
                    {idImage2 ? (
                      <ExpoImage
                        source={{ uri: idImage2 }}
                        style={styles.idImagePreview}
                      />
                    ) : (
                      <>
                        <ThemedText style={{ fontSize: 24, color: "#94A3B8" }}>
                          +
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: "#94A3B8",
                            fontFamily: "IBMPlexSansArabic-Medium",
                          }}
                        >
                          {isArabic ? "الوجه الثاني للهوية" : "ID Back Side"}
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={[styles.whoCard, { flexDirection: rowDirection }]}>
              <View
                style={[
                  styles.guestInfo,
                  { alignItems: 'flex-start' }
                ]}
              >
                <ThemedText
                  style={[
                    styles.guestLabel,
                    { textAlign }
                  ]}
                >
                  {t("booking.adults")}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.guestSubLabel,
                    { textAlign }
                  ]}
                >
                  {t("booking.adultsDesc")}
                </ThemedText>
              </View>
              <GuestCounter
                value={adultCount}
                onIncrement={handleIncrementAdults}
                onDecrement={handleDecrementAdults}
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
              ? (chaletDetails?.bookingType === "delayed"
                  ? (isArabic ? "إرسال طلب الحجز" : "Send Booking Request")
                  : t("booking.completePayment"))
              : t("booking.next")
          }
          onPress={handlePrimaryPress}
          loading={isUploadingId || isCreatingBooking}
          disabled={isUploadingId || isCreatingBooking}
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

      <ChaletTermsSheet
        ref={termsSheetRef}
        chaletId={chaletId}
        cancellationTiers={cancellationTiers}
        isLoadingCancellation={isLoadingCancellationPolicies}
        guestPolicy={chaletDetails?.guestPolicy}
        isRequest={isDelayedChalet}
        onAgree={handleTermsAgree}
        onDecline={() => termsSheetRef.current?.dismiss()}
      />

      <BookingReceiptSheet
        ref={successSheetRef}
        bookingCode={createdBookingCode}
        bookingDate={bookingDateString}
        shiftLabel={selectedShiftLabel}
        amount={
          isBookingRequest || paymentType !== "DEPOSIT" ? totalPrice : depositAmount
        }
        isRequest={isBookingRequest}
        isDeposit={paymentType === "DEPOSIT"}
        onViewBooking={() => {
          successSheetRef.current?.dismiss();
          router.replace({
            pathname: "/(tabs)/(customer)/booking-success",
            params: { id: createdBookingId },
          });
        }}
      />

      <PaymentProcessingSheet
        ref={processingSheetRef}
        status={pollingStatus}
        onRecheck={paymentTransactionId ? recheckPayment : undefined}
        onClose={() => processingSheetRef.current?.dismiss()}
        onGoToBookings={() => {
          processingSheetRef.current?.dismiss();
          router.replace("/(tabs)/(customer)/bookings");
        }}
      />
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
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#94A3B8",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 42,
  },
  dateBadgeTextActive: {
    color: Colors.primary,
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
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
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#334155",
    textAlign: "center",
  },
  activeDayText: { color: "#FFF", fontFamily: "IBMPlexSansArabic-Medium" },
  filteredOutDayText: { color: "#94A3B8" },
  bookedDayText: {
    color: "#CBD5E1",
    fontFamily: "IBMPlexSansArabic-Medium",
    opacity: 0.4,
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
  },
  shiftTime: {
    fontSize: normalize.font(8),
    color: "#64748B",
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  deleteDayText: {
    color: "#EF4444",
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
  },
  shiftsContainer: {
    gap: 12,
    marginBottom: 10,
  },
  shiftClosedBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftClosedText: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#DC2626",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: 15,
    color: "#1E293B",
    flexShrink: 1,
    lineHeight: 24,
  },
  shiftTimeFlat: {
    fontFamily: "IBMPlexSansArabic-Medium",
    fontSize: 12,
    color: "#64748B",
    flexShrink: 1,
    lineHeight: 20,
  },
  shiftPriceFlat: {
    fontFamily: "IBMPlexSansArabic-Bold",
    fontSize: 14,
    color: "#1E293B",
    flexShrink: 0,
    lineHeight: 22,
  },
  guestTypeContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 6,
    height: 64,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  guestTypeTab: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  guestTypeTabActive: {
    backgroundColor: "#F0F7FF",
  },
  guestTypeText: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  guestTypeTextActive: {
    color: "#035DF9",
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  guestTypeTabDisabled: {
    opacity: 0.4,
  },
  guestTypeTextDisabled: {
    color: "#94A3B8",
  },
  guestTypeLockedHint: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#B26A00",
    marginTop: 8,
  },
  idUploadContainer: {
    marginBottom: 12,
  },
  idUploadButton: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  idImagePreview: {
    width: "100%",
    height: "100%",
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
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#111827",
  },
  guestSubLabel: {
    fontSize: normalize.font(8),
    color: "#9CA3AF",
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#15AB64",
    marginBottom: 15,
  },
  paymentForm: { gap: 12 },
  inputGroup: { gap: 6 },
  inputGroupFull: { flex: 1, gap: 6 },
  inputGroupFixed: { width: 90, gap: 6 },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#1E293B",
  },
  rowInputs: { flexDirection: "row" },

  // Success Sheet Styles
  checkoutSkeleton: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  // Details Styles
  detailsContainer: { marginTop: 15 },
  chaletCardInstance: { width: "100%", marginBottom: 12 },
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
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#15AB64",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  amenityOption: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  amenityOptionActive: { borderColor: Colors.primary, backgroundColor: "#F8FAFF" },
  amenityCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  amenityCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amenityCheckMark: { color: "#FFFFFF", fontSize: normalize.font(12), lineHeight: normalize.font(16) },
  amenityOptionLabel: {
    flex: 1,
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#1E293B",
  },
  amenityOptionPrice: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Bold",
    color: Colors.primary,
  },
  infoRow: { justifyContent: "space-between", marginBottom: 10 },
  infoLabel: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#1E293B",
  },
  infoValue: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontSize: normalize.font(8),
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  paymentMainTitle: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
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
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  paymentValActive: { color: "#1E293B", fontFamily: "IBMPlexSansArabic-Medium" },
  paymentLabel: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  paymentLabelActive: { color: "#1E293B", fontFamily: "IBMPlexSansArabic-Medium" },
  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  methodCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: normalize.radius(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  methodCardActive: {
    backgroundColor: "#035DF9",
    borderColor: "#035DF9",
  },
  methodCardDisabled: {
    opacity: 0.45,
  },
  methodLabel: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#64748B",
  },
  methodLabelActive: {
    color: "#FFFFFF",
  },
  methodBalance: {
    fontSize: normalize.font(9),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#94A3B8",
  },
  methodHintStrict: {
    color: "#B45309",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  methodHint: {
    marginTop: 8,
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
    lineHeight: 18,
  },
  agreementWrapper: { paddingVertical: 12, paddingBottom: 35 },
  agreementText: {
    fontSize: normalize.font(8),
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  agreementLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  // RTL Utilities
  row: { flexDirection: "row" },
  capacityBanner: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  capacityRow: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  capacityIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  capacityRowLabel: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#475569",
  },
  capacityRowValue: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
  },
  capacityDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  extraGuestNotice: {
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B20",
  },
  extraGuestNoticeText: {
    flex: 1,
    fontSize: normalize.font(9),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#92400E",
    lineHeight: 18,
  },
  capacityWarning: {
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF444420",
  },
  capacityWarningText: {
    fontSize: normalize.font(9),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#991B1B",
  },
});
