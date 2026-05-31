import { HeaderSection } from "@/components/header-section";
import { ThemedText } from "@/components/themed-text";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Colors, normalize } from "@/constants/theme";
import { useFormatTime } from "@/hooks/useFormatTime";
import { getImageSrc } from "@/hooks/useImageSrc";

import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  I18nManager,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SolarMapPointBold,
  SolarCardBold,
  SolarWalletBold,
  SolarInfoCircleBold,
} from "@/components/icons/solar-icons";
import {
  useGetCustomerBookingDetailsQuery,
  usePayDelayedBookingMutation,
  useLazyGetPaymentStatusQuery,
} from "@/store/api/customerApiSlice";
import * as WebBrowser from "expo-web-browser";

const dismissBrowser = () => {
  if (Platform.OS === "ios") {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      /* ignore */
    }
  }
};

export default function BookingSuccessDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookingId = id as string;
  const { formatShiftTime } = useFormatTime();

  const isRTL = i18n.language ? i18n.language.startsWith('ar') : false;
  const needsFlip = isRTL !== I18nManager.isRTL;
  const getFlexDirection = (rtl: boolean): "row" | "row-reverse" => (rtl !== I18nManager.isRTL) ? "row-reverse" : "row";
  const textStart: "left" | "right" = isRTL ? "right" : "left";
  const textEnd: "left" | "right" = isRTL ? "left" : "right";

  // Fetch booking details from the backend
  const { data: booking, isLoading, refetch } = useGetCustomerBookingDetailsQuery(
    bookingId,
    {
      skip: !bookingId,
    },
  );

  const depositPercentage = Number(booking?.chalet?.depositPercentage || 0);

  const [selectedMethod, setSelectedMethod] = useState<"wayl" | "wallet">("wayl");
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "FULL">("FULL");
  const [payDelayedBooking, { isLoading: isPaying }] = usePayDelayedBookingMutation();
  const [checkPaymentStatus] = useLazyGetPaymentStatusQuery();
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<"pending" | "success" | "failed" | "timeout">("pending");

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

    const interval = setInterval(async () => {
      attempts++;
      try {
        const result = await checkPaymentStatus(transactionId).unwrap();
        if (result?.status === "success") {
          clearInterval(interval);
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
        setPollingStatus("timeout");
        dismissBrowser();
        setIsWaitingForPayment(false);
      }
    }, 3000);
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
          text: isRTL ? "تمت الموافقة، بانتظار الدفع" : "Awaiting Payment",
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
  const chaletTitle = isRTL
    ? chalet.name?.ar || chalet.nameAr || chalet.name || ""
    : chalet.name?.en || chalet.nameEn || chalet.name || "";
  const chaletLocation = isRTL
    ? chalet.region?.name?.ar ||
      chalet.region?.nameAr ||
      chalet.region?.name ||
      ""
    : chalet.region?.name?.en ||
      chalet.region?.nameEn ||
      chalet.region?.name ||
      "";
  const detailedLocation = chaletLocation;
  const chaletImage = getImageSrc(chalet.images?.[0]?.url);
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
  const depositAmountVal = Math.round((Number(booking?.totalPrice || 0) * depositPercentage) / 100);

  const shiftInfo = useMemo(() => {
    if (!booking?.shift) return t("booking.morningShift");
    const name = isRTL
      ? booking.shift.name?.ar || booking.shift.name
      : booking.shift.name?.en || booking.shift.name;
    const time = `\u200E${formatShiftTime(booking.shift.startTime)} - ${formatShiftTime(booking.shift.endTime)}\u200E`;
    return `${name} (${time})`;
  }, [booking, isRTL, t]);

  const renderInfoRow = (label: string, value: string | React.ReactNode) => (
    <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
      <ThemedText
        style={[styles.infoLabel, { textAlign: textStart }]}
      >
        {label}
      </ThemedText>
      <View style={{ flex: 1, alignItems: isRTL ? "flex-start" : "flex-end" }}>
        {typeof value === "string" ? (
          <ThemedText
            style={[styles.infoValue, { textAlign: textEnd }]}
          >
            {value}
          </ThemedText>
        ) : (
          value
        )}
      </View>
    </View>
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
                uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/47.98,30.50,13,0/600x300?access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
              }}
              style={styles.mapSnippet}
            />
            <View style={styles.mapMarker}>
              <SolarMapPointBold size={32} color={Colors.primary} />
            </View>
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
              { textAlign: textStart },
            ]}
          >
            {t("booking.customerInfo")}
          </ThemedText>
          <View style={styles.divider} />
          {renderInfoRow(t("booking.name"), t("booking.nameValue"))}
          {renderInfoRow(
            t("booking.phone"),
            <ThemedText style={[styles.infoValue, { direction: "ltr" }]}>
              {t("booking.phoneValue")}
            </ThemedText>,
          )}
        </View>

        {/* Booking Information */}
        <View style={styles.infoSectionCard}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: textStart },
            ]}
          >
            {t("booking.bookingInfo")}
          </ThemedText>
          <View style={styles.divider} />

          <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
            <ThemedText style={styles.infoLabel}>
              {t("booking.bookingStatus")}
            </ThemedText>
            <View
              style={[isRTL ? { marginRight: "auto" } : { marginLeft: "auto" }]}
            >
              <View style={[styles.statusBadgeCustom, { backgroundColor: statusDetails.bg }]}>
                <ThemedText style={[styles.statusBadgeTextCustom, { color: statusDetails.color }]}>
                  {statusDetails.text}
                </ThemedText>
              </View>
            </View>
          </View>

          {renderInfoRow(
            t("booking.date"),
            booking?.bookingDate || t("booking.dateValue"),
          )}
          {renderInfoRow(t("booking.shift"), shiftInfo)}
          {renderInfoRow(
            t("booking.guests"),
            (booking?.guestsCount ?? booking?.guestCount ?? 0).toString(),
          )}
          {renderInfoRow(
            t("booking.totalAmount"),
            `${totalPrice} ${t("common.iqd")}`,
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.infoSectionCard}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: textStart },
            ]}
          >
            {t("booking.paymentDetails")}
          </ThemedText>
          <View style={styles.divider} />

          <View style={[styles.infoRow, { flexDirection: getFlexDirection(isRTL) }]}>
            <ThemedText style={styles.infoLabel}>
              {t("booking.paymentStatus")}
            </ThemedText>
            <View
              style={[isRTL ? { marginRight: "auto" } : { marginLeft: "auto" }]}
            >
              <View
                style={
                  booking?.paymentStatus === "paid"
                    ? styles.statusBadgeBlue
                    : styles.statusBadgeGray
                }
              >
                <ThemedText
                  style={
                    booking?.paymentStatus === "paid"
                      ? styles.statusBadgeTextBlue
                      : styles.statusBadgeTextGray
                  }
                >
                  {booking?.paymentStatus === "paid"
                    ? t("booking.status.paid")
                    : t("booking.status.deferred")}
                </ThemedText>
              </View>
            </View>
          </View>

          {basePriceVal > 0 && renderInfoRow(
            isRTL ? "السعر الأساسي للفترة" : "Shift Base Price",
            `${basePriceVal.toLocaleString()} ${t("common.iqd")}`,
          )}
          {extraGuestsPriceVal > 0 && renderInfoRow(
            isRTL ? "رسوم الضيوف الإضافية" : "Extra Guests Fee",
            `${extraGuestsPriceVal.toLocaleString()} ${t("common.iqd")}`,
          )}
          {addonsPriceVal > 0 && renderInfoRow(
            isRTL ? "سعر الخدمات الإضافية" : "Addons Price",
            `${addonsPriceVal.toLocaleString()} ${t("common.iqd")}`,
          )}
          {(extraGuestsPriceVal > 0 || addonsPriceVal > 0) && <View style={styles.divider} />}

          {renderInfoRow(
            t("booking.totalAmount"),
            `${totalPrice} ${t("common.iqd")}`,
          )}
          {booking?.paymentModel === 'deposit' && (booking?.status === 'confirmed' || booking?.status === 'completed') && (
            <>
              {renderInfoRow(
                t("booking.depositAmount"),
                `${depositAmount} ${t("common.iqd")}`,
              )}
              {renderInfoRow(
                t("booking.remainingAmount"),
                `${remainingAmount} ${t("common.iqd")}`,
              )}
            </>
          )}
        </View>

        {/* Pending Approval Alert */}
        {booking?.status === "pending_approval" && (
          <View style={[styles.alertCard, { flexDirection: getFlexDirection(isRTL) }]}>
            <SolarInfoCircleBold size={24} color="#D97706" />
            <ThemedText style={styles.alertText}>
              {isRTL
                ? "سيقوم صاحب الشاليه بمراجعة طلب حجزك وتأكيده قريباً. سيصلك إشعار بالدفع فور الموافقة."
                : "The owner will review and confirm your booking request soon. You will receive a notification to pay once approved."}
            </ThemedText>
          </View>
        )}

        {/* Pending Payment Form */}
        {booking?.status === "pending_payment" && (
          <View style={styles.paymentSectionCard}>
            <ThemedText style={[styles.sectionTitle, { textAlign: textStart }]}>
              {isRTL ? "إتمام عملية الدفع وتأكيد الحجز" : "Complete Payment"}
            </ThemedText>
            <View style={styles.divider} />
            <ThemedText style={[styles.paymentHelpText, { textAlign: textStart }]}>
              {isRTL
                ? "وافق صاحب الشاليه على طلب حجزك! يرجى اختيار طريقة الدفع المناسبة لتأكيد حجزك:"
                : "The chalet owner approved your request! Please select your payment method to confirm your booking:"}
            </ThemedText>

            {/* Payment Options Selection (Deposit vs Full) */}
            {depositPercentage > 0 && (
              <View style={{ marginBottom: 16 }}>
                <ThemedText style={[styles.paymentModelTitle, { textAlign: textStart }]}>
                  {isRTL ? "خيارات الدفع" : "Payment Options"}
                </ThemedText>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionCard,
                    paymentType === "DEPOSIT" && styles.paymentOptionActive,
                    { flexDirection: getFlexDirection(isRTL) }
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
                    {t("booking.depositPay")} ({depositPercentage}%)
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.paymentVal,
                      paymentType === "DEPOSIT" && styles.paymentValActive,
                      { textAlign: textEnd },
                    ]}
                  >
                    {depositAmountVal.toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOptionCard,
                    paymentType === "FULL" && styles.paymentOptionActive,
                    { flexDirection: getFlexDirection(isRTL) }
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
                    {Number(booking?.totalPrice || 0).toLocaleString()} {t("common.iqd")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.paymentMethodsGrid, { flexDirection: getFlexDirection(isRTL) }]}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodBtn,
                  selectedMethod === "wayl" && styles.paymentMethodActive,
                ]}
                onPress={() => setSelectedMethod("wayl")}
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
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodBtn,
                  selectedMethod === "wallet" && styles.paymentMethodActive,
                ]}
                onPress={() => setSelectedMethod("wallet")}
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
              </TouchableOpacity>
            </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
  chaletCardInstance: { width: "100%", marginRight: 0, marginBottom: 16 },
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
  mapMarker: { position: "absolute", zIndex: 3 },
  mapAddressLabel: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  infoValue: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
  },
  statusBadgeCustom: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeTextCustom: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
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
  alertText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    marginBottom: 16,
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
    fontFamily: "Alexandria-Medium",
    color: "#475569",
  },
  paymentMethodTextActive: {
    color: "#FFF",
    fontFamily: "Alexandria-SemiBold",
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
    fontFamily: "Alexandria-Bold",
  },
  paymentModelTitle: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  paymentLabelActive: {
    color: "#1E293B",
    fontFamily: "Alexandria-SemiBold",
  },
  paymentVal: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  paymentValActive: {
    color: "#15AB64",
    fontFamily: "Alexandria-Bold",
  },
});
