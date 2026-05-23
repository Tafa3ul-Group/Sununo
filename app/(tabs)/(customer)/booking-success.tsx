import { HeaderSection } from "@/components/header-section";
import { SolarMapPointBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Colors, normalize } from "@/constants/theme";
import { useFormatTime } from "@/hooks/useFormatTime";
import { getImageSrc } from "@/hooks/useImageSrc";
import { isRTL, getFlexDirection } from "@/i18n";
import { useGetCustomerBookingDetailsQuery } from "@/store/api/customerApiSlice";
import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View, I18nManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingSuccessDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookingId = id as string;
  const { formatShiftTime } = useFormatTime();

  const textStart: "left" | "right" = isRTL ? "right" : "left";
  const textEnd: "left" | "right" = isRTL ? "left" : "right";

  // Fetch booking details from the backend
  const { data: booking, isLoading } = useGetCustomerBookingDetailsQuery(
    bookingId,
    {
      skip: !bookingId,
    },
  );

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

  const paymentStatusInfo = useMemo(() => {
    const status = booking?.paymentStatus;
    const deposit = Number(booking?.depositAmount || 0);
    const remaining = Number(booking?.remainingAmount || 0);
    const total = Number(booking?.totalPrice || 0);

    if (status === 'paid' || (remaining === 0 && total > 0)) {
      return {
        text: t('booking.status.paid'),
        style: styles.statusBadgeBlue,
        textStyle: styles.statusBadgeTextBlue,
      };
    }
    
    if (deposit > 0 && remaining > 0) {
      return {
        text: isRTL ? 'عربون مدفوع' : 'Deposit Paid',
        style: styles.statusBadgeOrange,
        textStyle: styles.statusBadgeTextOrange,
      };
    }

    // Default case (e.g., payment pending, not paid at all)
    return {
      text: isRTL ? 'غير مدفوع' : 'Unpaid',
      style: styles.statusBadgeGray,
      textStyle: styles.statusBadgeTextGray,
    };
  }, [booking, t, isRTL]);

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
          {renderInfoRow(t("booking.name"), booking?.customer?.name || t("booking.nameValue"))}
          {renderInfoRow(
            t("booking.phone"),
            <ThemedText style={[styles.infoValue, { direction: "ltr" }]}>
              {booking?.customer?.phone || t("booking.phoneValue")}
            </ThemedText>,
          )}
          
          {/* Add this new section for ID images */}
          {(booking?.idCardFrontImage || booking?.idCardBackImage) && (
            <>
              <View style={styles.divider} />
              <ThemedText style={[styles.infoLabel, { marginTop: 6, marginBottom: 6 }]}>{isRTL ? 'صور الهوية' : 'ID Photos'}</ThemedText>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {booking.idCardFrontImage && (
                  <ExpoImage
                    source={getImageSrc(booking.idCardFrontImage)}
                    style={{ width: 120, height: 80, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                    transition={200}
                  />
                )}
                {booking.idCardBackImage && (
                  <ExpoImage
                    source={getImageSrc(booking.idCardBackImage)}
                    style={{ width: 120, height: 80, borderRadius: 8, backgroundColor: '#F1F5F9' }}
                    transition={200}
                  />
                )}
              </View>
            </>
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
              <View style={styles.statusBadgeBlue}>
                <ThemedText style={styles.statusBadgeTextBlue}>
                  {t("booking.status.accepted")}
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
              <View style={paymentStatusInfo.style}>
                <ThemedText style={paymentStatusInfo.textStyle}>
                  {paymentStatusInfo.text}
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
          {booking?.paymentModel === 'deposit' && (
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
  statusBadgeOrange: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeTextOrange: {
    color: '#F97316',
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
});
