import { HeaderSection } from "@/components/header-section";
import { ThemedText } from "@/components/themed-text";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Colors, normalize } from "@/constants/theme";
import { useFormatTime } from "@/hooks/useFormatTime";
import { formatDuration } from "@/utils/format";
import { getChaletCover, getImageSrc } from "@/hooks/useImageSrc";

import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  SolarCardBold,
  SolarWalletBold,
  SolarInfoCircleBold,
} from "@/components/icons/solar-icons";
import {
  useGetCustomerBookingDetailsQuery,
  usePayDelayedBookingMutation,
  useLazyGetPaymentStatusQuery,
  useLazyGetCancellationPreviewQuery,
  useCancelCustomerBookingMutation,
  useGetCustomerWalletQuery,
} from "@/store/api/customerApiSlice";
import { useGetAppConfigQuery } from "@/store/api/apiSlice";
import {
  CustomerCancellationSheet,
  type CustomerCancellationSheetRef,
  type CancellationPreview,
} from "@/components/user/customer-cancellation-sheet";
import * as WebBrowser from "expo-web-browser";
import { pickTranslation, useDirection } from "@/i18n/direction";

const dismissBrowser = () => {
  if (Platform.OS === "ios") {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      /* ignore */
    }
  }
};

// A plain TouchableOpacity. It used to scale on press and morph its layout
// changes; both animations were removed app-wide, and `layoutMorph` is kept
// only so the existing call sites still type-check.
const PressScaleTouchable: React.FC<
  React.ComponentProps<typeof TouchableOpacity> & {
    children: React.ReactNode;
    layoutMorph?: boolean;
  }
> = ({ children, style, layoutMorph: _layoutMorph, ...rest }) => {
  return (
    <TouchableOpacity {...rest} style={style}>
      {children}
    </TouchableOpacity>
  );
};

export default function BookingSuccessDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookingId = id as string;
  const { formatShiftTime } = useFormatTime();

  const { isRTL, rowDirection, textAlign, textAlignEnd } = useDirection();

  // Fetch booking details from the backend
  const { data: booking, isLoading, refetch } = useGetCustomerBookingDetailsQuery(
    bookingId,
    {
      skip: !bookingId,
    },
  );

  // Fall back to minDepositPercentage, then derive from the stored deposit
  // amount when the booking response omits the chalet's deposit fields.
  const depositPercentage =
    Number(booking?.chalet?.depositPercentage) ||
    Number(booking?.chalet?.minDepositPercentage) ||
    (Number(booking?.depositAmount) > 0 && Number(booking?.totalPrice) > 0
      ? Math.round((Number(booking.depositAmount) / Number(booking.totalPrice)) * 100)
      : 0);

  const [selectedMethod, setSelectedMethod] = useState<"wayl" | "wallet">("wayl");
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "FULL">("FULL");

  const [payDelayedBooking, { isLoading: isPaying }] = usePayDelayedBookingMutation();
  const [checkPaymentStatus] = useLazyGetPaymentStatusQuery();
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<"pending" | "success" | "failed" | "timeout">("pending");
  // Holds the payment-polling interval so it can be cleared on unmount.
  const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear the polling interval if the screen unmounts mid-poll — otherwise it
  // keeps firing for up to a minute, setting state on an unmounted component
  // and popping an Alert over whatever screen the user navigated to.
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // A payment can complete while this screen is in the background — the customer
  // finishes at the gateway, or in the bank's own app, and the webhook confirms
  // the booking server-side. Without this the screen they return to still reads
  // "Awaiting Payment" for money that has already been taken.
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && bookingId) refetch();
    });
    return () => subscription.remove();
  }, [bookingId, refetch]);

  React.useEffect(() => {
    if (booking) {
      if (depositPercentage === 0) {
        setPaymentType("FULL");
      } else {
        setPaymentType("DEPOSIT");
      }
    }
  }, [booking, depositPercentage]);

  const startPaymentPolling = async (transactionId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 * 3s = 60s (1 minute)

    // Clear any previous interval before starting a new one, so a second
    // "pay now" never stacks a second poller on top of the first.
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await checkPaymentStatus(transactionId).unwrap();
        if (result?.status === "success") {
          clearInterval(interval);
          pollingIntervalRef.current = null;
          setPollingStatus("success");
          dismissBrowser();
          Alert.alert(
            isRTL ? "تم الدفع بنجاح" : "Payment Successful",
            isRTL ? "تم دفع قيمة الحجز بنجاح وتأكيد حجزك!" : "Your payment was successful and booking is confirmed!",
            [{ text: isRTL ? "موافق" : "OK", onPress: () => refetch() }]
          );
          setIsWaitingForPayment(false);
        } else if (result?.status === "failed") {
          clearInterval(interval);
          pollingIntervalRef.current = null;
          setPollingStatus("failed");
          dismissBrowser();
          Alert.alert(
            isRTL ? "فشل الدفع" : "Payment Failed",
            isRTL ? "نأسف، فشلت عملية الدفع. يرجى المحاولة مرة أخرى." : "Sorry, payment has failed. Please try again.",
            [{ text: isRTL ? "موافق" : "OK" }]
          );
          setIsWaitingForPayment(false);
        }
      } catch (e) {
        console.error("Polling error", e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        pollingIntervalRef.current = null;
        setPollingStatus("timeout");
        dismissBrowser();
        setIsWaitingForPayment(false);
      }
    }, 3000);

    // Track the interval so the unmount cleanup above can clear it (prevents
    // the leak / state updates + Alerts on an unmounted component).
    pollingIntervalRef.current = interval;
  };

  const handlePayNow = async () => {
    try {
      const result = await payDelayedBooking({
        id: bookingId,
        paymentMethod: selectedMethod,
        paymentModel: paymentType.toLowerCase(),
      }).unwrap();

      if (result.payment?.paymentUrl) {
        setIsWaitingForPayment(true);
        setPollingStatus("pending");

        try {
          const authResult = await WebBrowser.openAuthSessionAsync(
            result.payment.paymentUrl,
            "sununo://payment-callback",
          );

          startPaymentPolling(result.payment.transactionId);
        } catch (e) {
          console.error("Browser error", e);
          setIsWaitingForPayment(false);
        }
      } else if (selectedMethod === "wallet" || result.booking?.status === "confirmed") {
        Alert.alert(
          isRTL ? "تم تأكيد الحجز" : "Booking Confirmed",
          isRTL ? "تم خصم قيمة الحجز من محفظتك وتأكيد حجزك بنجاح!" : "The booking amount has been deducted from your wallet and your booking is successfully confirmed!",
          [{ text: isRTL ? "موافق" : "OK", onPress: () => refetch() }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        error?.data?.message || "فشلت عملية الدفع. يرجى المحاولة مرة أخرى."
      );
    }
  };

  // ── Cancellation ──────────────────────────────────────────────────────────
  // The refund is tiered by how close the booking is and defaults to a FULL
  // penalty when the chalet published no policy, so the preview is fetched and
  // shown BEFORE the customer confirms — "cancel" can mean everything back or
  // nothing back, and they have to see which.
  const cancellationSheetRef = useRef<CustomerCancellationSheetRef>(null);
  const [fetchCancellationPreview] = useLazyGetCancellationPreviewQuery();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelCustomerBookingMutation();
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadCancellationPreview = React.useCallback(async () => {
    if (!bookingId) return;
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await fetchCancellationPreview(bookingId).unwrap();
      setPreview(result as CancellationPreview);
    } catch (error: any) {
      setPreview(null);
      setPreviewError(
        error?.data?.message ||
          (isRTL ? "تعذّر حساب المبلغ المسترد" : "Could not calculate the refund"),
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }, [bookingId, fetchCancellationPreview, isRTL]);

  const handleOpenCancellation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cancellationSheetRef.current?.present();
    void loadCancellationPreview();
  };

  const handleConfirmCancellation = async (reason: string) => {
    // Confirming against a refund we never managed to compute would have the
    // customer agreeing to an amount neither of us knows.
    if (!preview) {
      void loadCancellationPreview();
      return;
    }
    try {
      const result = await cancelBooking({ id: bookingId, reason: reason.trim() || undefined }).unwrap();
      const refunded = Number(result?.customerRefund || 0);
      cancellationSheetRef.current?.showSuccess(
        refunded > 0
          ? isRTL
            ? `تم إلغاء الحجز، وأُضيف ${refunded.toLocaleString()} د.ع إلى محفظتك.`
            : `Booking cancelled. ${refunded.toLocaleString()} IQD was added to your wallet.`
          : isRTL
            ? "تم إلغاء الحجز."
            : "Booking cancelled.",
      );
      refetch();
    } catch (error: any) {
      cancellationSheetRef.current?.showError(
        error?.data?.message ||
          (isRTL ? "تعذّر إلغاء الحجز. حاول مرة أخرى." : "Could not cancel the booking. Please try again."),
      );
    }
  };

  const getStatusDetails = (status?: string) => {
    switch (status) {
      case "pending_approval":
        return {
          text: isRTL ? "بانتظار موافقة المالك" : "Pending Approval",
          bg: "#FEF3C7",
          color: "#D97706",
        };
      case "pending_payment":
        return {
          text: booking?.chalet?.bookingType === "delayed"
            ? (isRTL ? "تمت الموافقة، بانتظار الدفع" : "Approved · Awaiting Payment")
            : (isRTL ? "بانتظار الدفع" : "Awaiting Payment"),
          bg: "#FFE4E6",
          color: "#E11D48",
        };
      case "confirmed":
        return {
          text: isRTL ? "مؤكد" : "Confirmed",
          bg: "#DCFCE7",
          color: "#16A34A",
        };
      case "completed":
        return {
          text: isRTL ? "مكتمل" : "Completed",
          bg: "#DBEAFE",
          color: "#2563EB",
        };
      case "cancelled":
        return {
          text: isRTL ? "ملغي" : "Cancelled",
          bg: "#FEE2E2",
          color: "#DC2626",
        };
      default:
        return {
          text: isRTL ? "مقبول" : "Accepted",
          bg: "#E2E8F0",
          color: "#475569",
        };
    }
  };

  const statusDetails = getStatusDetails(booking?.status);

  // Extract data from API response with fallbacks
  const chalet = booking?.chalet || ({} as any);
  const chaletTitle = pickTranslation(chalet, isRTL);
  const chaletLocation = pickTranslation(chalet.region, isRTL);
  const detailedLocation = chaletLocation;
  const chaletImage = getImageSrc(getChaletCover(chalet.images)?.url);

  // Map coordinates: parse as numbers (the API may send strings) and validate.
  // Fall back to Basra (the app's region) — NEVER Baghdad — when the chalet has
  // no/zero coordinates, so the booking map shows the chalet's real location.
  const chaletLng = Number(chalet?.longitude);
  const chaletLat = Number(chalet?.latitude);
  const hasChaletCoords =
    Number.isFinite(chaletLng) &&
    Number.isFinite(chaletLat) &&
    (chaletLng !== 0 || chaletLat !== 0);
  const mapLng = hasChaletCoords ? chaletLng : 47.82;
  const mapLat = hasChaletCoords ? chaletLat : 30.51;
  const totalPrice = booking?.totalPrice
    ? Number(booking.totalPrice).toLocaleString()
    : "0";
  const depositAmount = booking?.depositAmount
    ? Number(booking.depositAmount).toLocaleString()
    : "0";
  const remainingAmount = booking?.remainingAmount
    ? Number(booking.remainingAmount).toLocaleString()
    : "0";
  const basePriceVal = Number(booking?.basePrice || 0);
  const extraGuestsPriceVal = Number(booking?.extraGuestsPrice || 0);
  const addonsPriceVal = Number(booking?.addonsPrice || 0);
  // Prefer the backend-computed deposit (it already falls back to
  // minDepositPercentage); only recompute if it wasn't stored, so the amount
  // never shows 0 when the booking response omits the chalet's deposit fields.
  const depositAmountVal = Number(booking?.depositAmount) > 0
    ? Number(booking.depositAmount)
    : Math.round((Number(booking?.totalPrice || 0) * depositPercentage) / 100);

  // ── Derived state flags (single source of truth = booking.status) ──────────
  const status = booking?.status;
  const paymentModelVal = booking?.paymentModel; // 'deposit' | 'full' | undefined
  const isPendingApproval = status === "pending_approval";
  const isPendingPayment = status === "pending_payment";
  const isConfirmed = status === "confirmed";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isPaid = isConfirmed || isCompleted; // money has been received
  // Mirrors CUSTOMER_CANCELLABLE_STATUSES on the API. PENDING_PAYMENT is absent
  // on purpose: the customer may be at the gateway right now, and the payment
  // webhook ignores a booking that is no longer PENDING_PAYMENT — cancelling
  // mid-session would take their money and leave them without a booking.
  const canCancel = isPendingApproval || isConfirmed;

  // What this screen would charge right now — the same figure the pay button
  // prints, and what a wallet balance has to cover.
  const amountDueNow =
    paymentType === "DEPOSIT" ? depositAmountVal : Number(booking?.totalPrice || 0);

  // The wallet button used to be offered blind — no balance, no check on the
  // admin's on/off switch — so the customer found out from the API's English
  // "Insufficient wallet balance" / "Wallet payment is currently disabled".
  const { data: appConfig } = useGetAppConfigQuery();
  const { data: walletData, isLoading: isWalletLoading } = useGetCustomerWalletQuery(undefined);
  const walletBalance = Number(walletData?.balance ?? walletData?.data?.balance ?? 0);
  // Absent config is treated as enabled — a failed /config must not close the
  // only way to pay for an approved booking.
  const isWalletEnabled = appConfig?.isWalletEnabled !== false;
  const isWaylEnabled = appConfig?.isWaylEnabled !== false;
  const walletCoversAmount = walletBalance >= amountDueNow && amountDueNow > 0;
  const canPayByWallet = isWalletEnabled && walletCoversAmount;
  // The balance reads 0 until the first response lands — not a real shortfall.
  const isWalletUnsettled = isWalletLoading || isPaying;

  // Keep the selection on something that can actually go through: switching to
  // the full amount (or the booking re-pricing underneath) can push the total
  // past a balance that covered the deposit, and the card gateway can be
  // switched off while the default still points at it.
  useEffect(() => {
    if (isWalletUnsettled) return;
    if (selectedMethod === "wallet" && !canPayByWallet && isWaylEnabled) {
      setSelectedMethod("wayl");
      return;
    }
    if (selectedMethod === "wayl" && !isWaylEnabled && canPayByWallet) {
      setSelectedMethod("wallet");
    }
  }, [selectedMethod, canPayByWallet, isWaylEnabled, isWalletUnsettled]);
  const isDepositPayment = paymentModelVal === "deposit";
  const amountPaidVal = Number(booking?.amountPaid || 0);
  const remainingAmountVal = Number(booking?.remainingAmount || 0);
  const cancellationReason = booking?.cancellationReason || booking?.cancelReason;
  // The payment form on this details page is for delayed (approval-required)
  // chalets, paid AFTER the owner approves. Instant chalets are paid once at
  // creation and must never be re-charged here. We treat anything that is NOT
  // explicitly "instant" as eligible (robust against a missing bookingType),
  // and the backend /pay endpoint guards instant chalets as a backstop.
  const isInstantChalet = booking?.chalet?.bookingType === "instant";
  const isDelayedChalet = !isInstantChalet;

  // ── Payment deadline (delayed chalets, stamped by the API on approval) ─────
  // Null when the owner opted out of a deadline — then nothing is shown.
  const paymentDueAt = useMemo(() => {
    if (!booking?.paymentDueAt) return null;
    const due = new Date(booking.paymentDueAt);
    return isNaN(due.getTime()) ? null : due;
  }, [booking?.paymentDueAt]);

  // Re-render once a minute so the countdown stays honest while the screen is open.
  const [nowTick, setNowTick] = useState(() => Date.now());
  React.useEffect(() => {
    if (!paymentDueAt || !isPendingPayment) return;
    const interval = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [paymentDueAt, isPendingPayment]);

  const deadlineText = useMemo(() => {
    if (!paymentDueAt) return null;
    const msLeft = paymentDueAt.getTime() - nowTick;
    if (msLeft <= 0) {
      return isRTL
        ? "انتهت مهلة الدفع — قد يُلغى الحجز في أي لحظة"
        : "The payment window has passed — this booking may be cancelled at any moment";
    }
    // Round up so a 40-second remainder reads "1 دقيقة", never "0 دقيقة".
    const left = formatDuration(Math.ceil(msLeft / 60000), isRTL);
    return isRTL
      ? `يتبقى ${left} لإتمام الدفع، وبعدها يُلغى الحجز تلقائياً.`
      : `${left} left to complete payment, after which the booking is cancelled automatically.`;
  }, [paymentDueAt, nowTick, isRTL]);

  const shiftInfo = useMemo(() => {
    if (!booking?.shift) return t("booking.morningShift");
    const name = pickTranslation(booking.shift.name, isRTL);
    const time = `\u200E${formatShiftTime(booking.shift.startTime)} - ${formatShiftTime(booking.shift.endTime)}\u200E`;
    return `${name} (${time})`;
  }, [booking, isRTL, t]);

  const writingDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";
  const renderInfoRow = (
    label: string,
    value: string | React.ReactNode,
    index: number = 0,
  ) => (
    <Animated.View
      style={[styles.infoRow, { flexDirection: rowDirection }]}
    >
      <ThemedText
        style={[styles.infoLabel, { textAlign, writingDirection: writingDir }]}
      >
        {label}
      </ThemedText>
      {/* flex-end pushes the value to the far end (opposite the label).
          flex-end is LOGICAL under the container `direction` style, so this
          constant lands on the correct side in both Arabic and English. */}
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {typeof value === "string" ? (
          <ThemedText
            style={[styles.infoValue, { textAlign: textAlignEnd, writingDirection: writingDir }]}
          >
            {value}
          </ThemedText>
        ) : (
          value
        )}
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Normalized Header */}
      <HeaderSection
        title={t("booking.bookingDetails") || "تفاصيل الحجز"}
        showBackButton
        showLogo
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chalet Card */}
        <HorizontalCard
          chalet={{
            id: chalet.id || "",
            title: chaletTitle,
            location: chaletLocation,
            rating: chalet.averageRating || 0,
            price: chalet.basePrice
              ? Number(chalet.basePrice).toLocaleString()
              : "0",
            image: chaletImage,
          }}
          style={styles.chaletCardInstance}
          hideFavorite={true}
          onPress={() => {}}
        />

        {/* Map Card */}
        <View style={styles.detailsMapCard}>
          <View style={styles.mapSnippetWrapper}>
            <ExpoImage
              source={{
                uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+2563EB(${mapLng},${mapLat})/${mapLng},${mapLat},14,0/600x300@2x?access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
              }}
              style={styles.mapSnippet}
            />
          </View>
          <ThemedText style={styles.mapAddressLabel}>
            {detailedLocation}
          </ThemedText>
        </View>

        {/* Customer Information */}
        <View style={styles.infoSectionCard}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign },
            ]}
          >
            {t("booking.customerInfo")}
          </ThemedText>
          <View style={styles.divider} />
          {renderInfoRow(
            t("booking.name"),
            booking?.customer?.name || t("booking.nameValue"),
            0,
          )}
          {renderInfoRow(
            t("booking.phone"),
            <ThemedText style={[styles.infoValue, { direction: "ltr" }]}>
              {booking?.customer?.phone || t("booking.phoneValue")}
            </ThemedText>,
            1,
          )}
        </View>

        {/* Booking Information */}
        <View style={styles.infoSectionCard}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign },
            ]}
          >
            {t("booking.bookingInfo")}
          </ThemedText>
          <View style={styles.divider} />

          <View style={[styles.infoRow, { flexDirection: rowDirection }]}>
            <ThemedText style={[styles.infoLabel, { textAlign, writingDirection: writingDir }]}>
              {t("booking.bookingStatus")}
            </ThemedText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Animated.View
                style={[styles.statusBadgeCustom, { backgroundColor: statusDetails.bg }]}
              >
                <ThemedText style={[styles.statusBadgeTextCustom, { color: statusDetails.color }]}>
                  {statusDetails.text}
                </ThemedText>
              </Animated.View>
            </View>
          </View>

          {renderInfoRow(
            t("booking.date"),
            booking?.bookingDate || t("booking.dateValue"),
            1,
          )}
          {renderInfoRow(t("booking.shift"), shiftInfo, 2)}
          {renderInfoRow(
            t("booking.guests"),
            (booking?.guestsCount ?? booking?.guestCount ?? 0).toString(),
            3,
          )}
          {renderInfoRow(
            t("booking.totalAmount"),
            `${totalPrice} ${t("common.iqd")}`,
            4,
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.infoSectionCard}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign },
            ]}
          >
            {t("booking.paymentDetails")}
          </ThemedText>
          <View style={styles.divider} />

          <View style={[styles.infoRow, { flexDirection: rowDirection }]}>
            <ThemedText style={[styles.infoLabel, { textAlign, writingDirection: writingDir }]}>
              {t("booking.paymentStatus")}
            </ThemedText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View
                style={isPaid ? styles.statusBadgeBlue : styles.statusBadgeGray}
              >
                <ThemedText
                  style={
                    isPaid
                      ? styles.statusBadgeTextBlue
                      : styles.statusBadgeTextGray
                  }
                >
                  {isPaid
                    ? (isDepositPayment && remainingAmountVal > 0
                        ? (isRTL ? "مدفوع جزئياً (عربون)" : "Partially Paid (Deposit)")
                        : t("booking.status.paid"))
                    : (isRTL ? "غير مدفوع" : "Unpaid")}
                </ThemedText>
              </View>
            </View>
          </View>

          {basePriceVal > 0 && renderInfoRow(
            isRTL ? "السعر الأساسي للفترة" : "Shift Base Price",
            `${basePriceVal.toLocaleString()} ${t("common.iqd")}`,
            1,
          )}
          {extraGuestsPriceVal > 0 && renderInfoRow(
            isRTL ? "رسوم الضيوف الإضافية" : "Extra Guests Fee",
            `${extraGuestsPriceVal.toLocaleString()} ${t("common.iqd")}`,
            2,
          )}
          {addonsPriceVal > 0 && renderInfoRow(
            isRTL ? "سعر الخدمات الإضافية" : "Addons Price",
            `${addonsPriceVal.toLocaleString()} ${t("common.iqd")}`,
            3,
          )}
          {(extraGuestsPriceVal > 0 || addonsPriceVal > 0) && <View style={styles.divider} />}

          {renderInfoRow(
            t("booking.totalAmount"),
            `${totalPrice} ${t("common.iqd")}`,
            4,
          )}
          {isPaid && renderInfoRow(
            isDepositPayment
              ? (isRTL ? "المبلغ المدفوع (العربون)" : "Paid (Deposit)")
              : (isRTL ? "المبلغ المدفوع" : "Amount Paid"),
            <ThemedText style={[styles.infoValue, { color: "#16A34A", fontFamily: "IBMPlexSansArabic-SemiBold" }]}>
              {`${amountPaidVal.toLocaleString()} ${t("common.iqd")}`}
            </ThemedText>,
            5,
          )}
          {isPaid && isDepositPayment && remainingAmountVal > 0 && renderInfoRow(
            isRTL ? "المبلغ المتبقي (يُدفع عند الوصول)" : "Remaining (Due on arrival)",
            `${remainingAmount} ${t("common.iqd")}`,
            6,
          )}
        </View>

        {/* Pending Approval Alert */}
        {isPendingApproval && (
          <View style={[styles.alertCard, { flexDirection: rowDirection }]}>
            <SolarInfoCircleBold size={24} color="#D97706" />
            <ThemedText style={[styles.alertText, { textAlign, writingDirection: writingDir }]}>
              {isRTL
                ? "سيقوم صاحب الشاليه بمراجعة طلب حجزك وتأكيده قريباً. سيصلك إشعار بالدفع فور الموافقة."
                : "The owner will review and confirm your booking request soon. You will receive a notification to pay once approved."}
            </ThemedText>
          </View>
        )}

        {/* Confirmed: awaiting the owner to complete the stay */}
        {isConfirmed && (
          <View style={[styles.alertCard, styles.alertCardSuccess, { flexDirection: rowDirection }]}>
            <SolarInfoCircleBold size={24} color="#16A34A" />
            <ThemedText style={[styles.alertText, { color: "#15803D", textAlign, writingDirection: writingDir }]}>
              {isRTL
                ? (isDepositPayment && remainingAmountVal > 0
                    ? "تم تأكيد حجزك بنجاح. يُدفع المبلغ المتبقي عند الوصول، وستظهر حالة الحجز \"مكتمل\" بعد انتهاء فترة الإقامة."
                    : "تم تأكيد حجزك ودفع المبلغ بالكامل. ستظهر حالة الحجز \"مكتمل\" بعد انتهاء فترة الإقامة.")
                : (isDepositPayment && remainingAmountVal > 0
                    ? "Your booking is confirmed. The remaining balance is due on arrival, and the status will become \"Completed\" after the stay ends."
                    : "Your booking is confirmed and fully paid. The status will become \"Completed\" after the stay ends.")}
            </ThemedText>
          </View>
        )}

        {/* Cancelled: show reason */}
        {isCancelled && (
          <View style={[styles.alertCard, styles.alertCardDanger, { flexDirection: rowDirection }]}>
            <SolarInfoCircleBold size={24} color="#DC2626" />
            <ThemedText style={[styles.alertText, { color: "#B91C1C", textAlign, writingDirection: writingDir }]}>
              {isRTL ? "تم إلغاء هذا الحجز." : "This booking has been cancelled."}
              {cancellationReason ? `\n${cancellationReason}` : ""}
            </ThemedText>
          </View>
        )}

        {/* Instant chalet awaiting its initial payment — NO re-payment form here.
            Payment for instant chalets happens once, at booking creation. */}
        {isPendingPayment && !isDelayedChalet && (
          <View style={[styles.alertCard, { flexDirection: rowDirection }]}>
            <SolarInfoCircleBold size={24} color="#D97706" />
            <ThemedText style={[styles.alertText, { textAlign, writingDirection: writingDir }]}>
              {isRTL
                ? "لم يتم تأكيد دفع هذا الحجز بعد. إذا أكملت الدفع فستتحدث الحالة تلقائياً، وإلا سيُلغى الحجز تلقائياً بعد انتهاء المهلة."
                : "Payment for this booking has not been confirmed yet. The status will update automatically once payment completes; otherwise the booking will be cancelled after the timeout."}
            </ThemedText>
          </View>
        )}

        {/* Delayed chalet: complete payment after owner approval */}
        {isPendingPayment && isDelayedChalet && (
          <View style={styles.paymentSectionCard}>
            <ThemedText style={[styles.sectionTitle, { textAlign }]}>
              {isRTL ? "إتمام عملية الدفع وتأكيد الحجز" : "Complete Payment"}
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={[styles.paymentHelpText, { textAlign }]}>
              {isRTL
                ? "وافق صاحب الشاليه على طلب حجزك! يرجى اختيار طريقة الدفع المناسبة لتأكيد حجزك:"
                : "The chalet owner approved your request! Please select your payment method to confirm your booking:"}
            </ThemedText>

            {/* Owner-configured payment deadline — hidden when there is none */}
            {deadlineText && (
              <View style={[styles.deadlineBanner, { flexDirection: rowDirection }]}>
                <SolarInfoCircleBold size={18} color="#B45309" />
                <ThemedText
                  style={[styles.deadlineBannerText, { textAlign, writingDirection: writingDir }]}
                >
                  {deadlineText}
                </ThemedText>
              </View>
            )}

            {/* Payment Options Selection (Deposit vs Full) */}
            {depositPercentage > 0 && (
              <View style={{ marginBottom: 16 }}>
                <ThemedText style={[styles.paymentModelTitle, { textAlign }]}>
                  {isRTL ? "اختر طريقة الدفع (لم يتم الدفع بعد)" : "Choose how to pay (not paid yet)"}
                </ThemedText>

                <PressScaleTouchable
                  layoutMorph
                  style={[
                    styles.paymentOptionCard,
                    paymentType === "DEPOSIT" && styles.paymentOptionActive,
                    { flexDirection: rowDirection }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaymentType("DEPOSIT");
                  }}
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
                    {depositAmountVal.toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                </PressScaleTouchable>

                <PressScaleTouchable
                  layoutMorph
                  style={[
                    styles.paymentOptionCard,
                    paymentType === "FULL" && styles.paymentOptionActive,
                    { flexDirection: rowDirection }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaymentType("FULL");
                  }}
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
                    {Number(booking?.totalPrice || 0).toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                </PressScaleTouchable>
              </View>
            )}

            <View style={[styles.paymentMethodsGrid, { flexDirection: rowDirection }]}>
              {isWaylEnabled && (
              <PressScaleTouchable
                layoutMorph
                style={[
                  styles.paymentMethodBtn,
                  selectedMethod === "wayl" && styles.paymentMethodActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedMethod("wayl");
                }}
              >
                <SolarCardBold size={22} color={selectedMethod === "wayl" ? "#FFF" : "#64748B"} />
                <ThemedText
                  style={[
                    styles.paymentMethodText,
                    selectedMethod === "wayl" && styles.paymentMethodTextActive,
                  ]}
                >
                  {isRTL ? "دفع بالبطاقة" : "Card Payment"}
                </ThemedText>
              </PressScaleTouchable>
              )}

              {/* Hidden rather than shown-and-refused when the admin has
                  switched the wallet off — the API 400s on it either way. */}
              {isWalletEnabled && (
                <PressScaleTouchable
                  layoutMorph
                  disabled={!walletCoversAmount}
                  style={[
                    styles.paymentMethodBtn,
                    selectedMethod === "wallet" && styles.paymentMethodActive,
                    !walletCoversAmount && !isWalletUnsettled && { opacity: 0.45 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMethod("wallet");
                  }}
                >
                  <SolarWalletBold size={22} color={selectedMethod === "wallet" ? "#FFF" : "#64748B"} />
                  <ThemedText
                    style={[
                      styles.paymentMethodText,
                      selectedMethod === "wallet" && styles.paymentMethodTextActive,
                    ]}
                  >
                    {isRTL ? "المحفظة" : "Wallet"}
                  </ThemedText>
                  {/* The balance is the whole reason to pick this or not. */}
                  <ThemedText
                    style={[
                      styles.paymentMethodBalance,
                      selectedMethod === "wallet" && styles.paymentMethodTextActive,
                    ]}
                  >
                    {isWalletLoading
                      ? "..."
                      : `${walletBalance.toLocaleString()} ${t("common.iqd")}`}
                  </ThemedText>
                </PressScaleTouchable>
              )}
            </View>

            {isWalletUnsettled ? null : !isWaylEnabled && !canPayByWallet ? (
              <ThemedText style={[styles.paymentMethodHint, styles.paymentMethodHintStrict]}>
                {isRTL
                  ? "لا تتوفر طريقة دفع حالياً. اشحن محفظتك أو حاول لاحقاً."
                  : "No payment method is available right now. Top up your wallet or try again later."}
              </ThemedText>
            ) : (
              isWalletEnabled && !walletCoversAmount && (
                <ThemedText style={styles.paymentMethodHint}>
                  {isRTL
                    ? `رصيد المحفظة لا يكفي لدفع ${amountDueNow.toLocaleString()} ${t("common.iqd")}.`
                    : `Your wallet balance doesn't cover ${amountDueNow.toLocaleString()} ${t("common.iqd")}.`}
                </ThemedText>
              )
            )}

            <TouchableOpacity
              style={styles.payBtn}
              onPress={handlePayNow}
              disabled={isPaying || isWaitingForPayment}
            >
              {isPaying || isWaitingForPayment ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.payBtnText}>
                  {isRTL
                    ? `ادفع الآن (${(paymentType === "DEPOSIT" ? depositAmountVal : Number(booking?.totalPrice || 0)).toLocaleString()} د.ع)`
                    : `Pay Now (${(paymentType === "DEPOSIT" ? depositAmountVal : Number(booking?.totalPrice || 0)).toLocaleString()} IQD)`}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Cancellation. Offered for a request still awaiting approval (nothing
            paid, nothing to lose) and for a confirmed booking (settled under the
            chalet's policy). A booking that is already paid-for-and-past, or
            mid-payment, is not the customer's to cancel here. */}
        {canCancel && (
          <View style={styles.cancelSection}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleOpenCancellation}
              disabled={isCancelling}
            >
              <ThemedText style={styles.cancelBtnText}>
                {isPendingApproval
                  ? isRTL
                    ? "سحب طلب الحجز"
                    : "Withdraw request"
                  : isRTL
                    ? "إلغاء الحجز"
                    : "Cancel booking"}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.cancelHint, { textAlign }]}>
              {isPendingApproval
                ? isRTL
                  ? "لم يُدفع أي مبلغ بعد، لذا السحب مجاني."
                  : "Nothing has been paid yet, so withdrawing costs nothing."
                : isRTL
                  ? "سنعرض لك المبلغ المسترد قبل التأكيد."
                  : "We'll show you the refund amount before you confirm."}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <CustomerCancellationSheet
        ref={cancellationSheetRef}
        onConfirm={handleConfirmCancellation}
        isLoading={isCancelling}
        preview={preview}
        isPreviewLoading={isPreviewLoading}
        previewError={previewError}
        onRetryPreview={loadCancellationPreview}
        amountPaid={amountPaidVal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
  chaletCardInstance: { width: "100%", marginBottom: 16 },
  detailsMapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
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
  mapAddressLabel: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: normalize.font(8),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#1E293B",
  },
  infoSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
    paddingBottom: 24, // Add more padding at bottom
  },
  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: Colors.primary,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  infoRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
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
  statusBadgeBlue: {
    backgroundColor: "#035DF9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeTextBlue: {
    color: "#FFF",
    fontSize: normalize.font(8),
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  statusBadgeGray: {
    backgroundColor: "#94A3B8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeTextGray: {
    color: "#FFF",
    fontSize: normalize.font(8),
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  statusBadgeCustom: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeTextCustom: {
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  alertCard: {
    flexDirection: "row" as const,
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  alertCardSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  alertCardDanger: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  alertText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#B45309",
    lineHeight: 18,
  },
  paymentSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
    paddingBottom: 20,
  },
  paymentHelpText: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
    marginBottom: 16,
  },
  deadlineBanner: {
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  deadlineBannerText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#B45309",
    lineHeight: 18,
  },
  paymentMethodsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  paymentMethodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  paymentMethodActive: {
    backgroundColor: "#035DF9",
    borderColor: "#035DF9",
  },
  paymentMethodText: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#475569",
  },
  paymentMethodBalance: {
    fontSize: normalize.font(9),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#94A3B8",
  },
  paymentMethodHintStrict: {
    color: "#B45309",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  paymentMethodHint: {
    marginTop: 8,
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
    lineHeight: 18,
  },
  paymentMethodTextActive: {
    color: "#FFF",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  payBtn: {
    backgroundColor: "#15AB64",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnText: {
    color: "#FFF",
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  cancelSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#DC2626",
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  cancelHint: {
    marginTop: 8,
    paddingHorizontal: 4,
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#94A3B8",
    lineHeight: 16,
  },
  paymentModelTitle: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
    marginBottom: 8,
    marginTop: 4,
  },
  paymentOptionCard: {
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentOptionActive: {
    borderColor: "#15AB64",
    backgroundColor: "#F0FDF4",
  },
  paymentLabel: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  paymentLabelActive: {
    color: "#1E293B",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  paymentVal: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  paymentValActive: {
    color: "#15AB64",
    fontFamily: "IBMPlexSansArabic-Bold",
  },
});
