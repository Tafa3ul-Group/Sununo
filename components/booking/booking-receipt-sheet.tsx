import {
  SolarCheckCircleBoldDuotone,
  SolarClockCircleBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
);

export interface BookingReceiptSheetProps {
  /** Absent until the API answers; the row is dropped rather than left blank. */
  bookingCode?: string | null;
  bookingDate: string;
  /** Name + hours of the booked shift. Empty when the chalet has none. */
  shiftLabel?: string;
  /** What the customer just paid, or the total when nothing is paid yet. */
  amount: number;
  /**
   * A delayed (approval-required) chalet: the request is in, but nothing is
   * confirmed and no money has moved. Changes the whole tone of the sheet.
   */
  isRequest?: boolean;
  /** Deposit bookings paid only part of the total — say which. */
  isDeposit?: boolean;
  onViewBooking: () => void;
}

/**
 * The receipt a customer sees the moment a booking lands.
 *
 * It carries the booking code, date, shift and amount because those are exactly
 * what someone screenshots or reads back to the owner over the phone — a bare
 * "booked!" left all of it one navigation away.
 */
export const BookingReceiptSheet = forwardRef<
  BottomSheetModal,
  BookingReceiptSheetProps
>(function BookingReceiptSheet(
  {
    bookingCode,
    bookingDate,
    shiftLabel,
    amount,
    isRequest = false,
    isDeposit = false,
    onViewBooking,
  },
  ref,
) {
  const { t } = useTranslation();
  const { isRTL, rowDirection, textAlign, textAlignEnd } = useDirection();

  const amountLabel = isRequest
    ? isRTL ? "الإجمالي" : "Total"
    : isDeposit
      ? isRTL ? "المدفوع (عربون)" : "Paid (deposit)"
      : isRTL ? "المدفوع" : "Paid";

  const row = (label: string, value: string, valueStyle?: any, rowStyle?: any) => (
    <View style={[styles.receiptRow, rowStyle, { flexDirection: rowDirection }]}>
      <ThemedText style={[styles.receiptLabel, rowStyle && styles.receiptLabelTotal, { textAlign }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.receiptValue, valueStyle, { textAlign: textAlignEnd }]}>
        {value}
      </ThemedText>
    </View>
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetView style={styles.content}>
        <View style={[styles.iconCircle, isRequest && styles.iconCircleRequest]}>
          {isRequest ? (
            <SolarClockCircleBold size={normalize.width(64)} color="#D97706" />
          ) : (
            <SolarCheckCircleBoldDuotone size={normalize.width(72)} color="#15AB64" />
          )}
        </View>

        <ThemedText style={styles.title}>
          {isRequest
            ? isRTL ? "تم إرسال طلب الحجز" : "Booking Request Sent"
            : t("booking.successTitle") || "تم الحجز بنجاح!"}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {isRequest
            ? isRTL
              ? "سيراجع صاحب الشاليه طلبك، وسيصلك إشعار بالدفع فور الموافقة عليه."
              : "The owner will review your request. You'll get a notification to pay once it's approved."
            : t("booking.successMsg") ||
              "لقد تم تأكيد حجزك، يمكنك البدء الآن في متابعة التفاصيل."}
        </ThemedText>

        <View style={styles.receiptCard}>
          {!!bookingCode && (
            <View style={[styles.receiptRow, { flexDirection: rowDirection }]}>
              <ThemedText style={[styles.receiptLabel, { textAlign }]}>
                {isRTL ? "رقم الحجز" : "Booking code"}
              </ThemedText>
              {/* Pinned LTR: the code is alphanumeric and reverses under RTL. */}
              <ThemedText style={[styles.receiptValue, styles.receiptCode, { direction: "ltr" }]}>
                {bookingCode}
              </ThemedText>
            </View>
          )}
          {row(t("booking.date"), bookingDate)}
          {!!shiftLabel && row(t("booking.shift"), shiftLabel)}
          {row(
            amountLabel,
            `${Number(amount || 0).toLocaleString()} ${t("common.iqd")}`,
            styles.receiptValueTotal,
            styles.receiptRowTotal,
          )}
        </View>

        <PrimaryButton
          label={t("booking.goToDetails") || "استعراض تفاصيل الحجز"}
          onPress={onViewBooking}
          activeColor={isRequest ? Colors.primary : "#15AB64"}
          style={styles.button}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: 25,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  iconCircle: {
    width: normalize.width(110),
    height: normalize.width(110),
    borderRadius: normalize.width(55),
    backgroundColor: "#E7F8EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconCircleRequest: {
    backgroundColor: "#FEF3C7",
  },
  title: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: normalize.font(14),
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  button: { width: "100%", height: 56 },
  receiptCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 20,
  },
  receiptRow: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  receiptRowTotal: {
    marginBottom: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  receiptLabel: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  receiptLabelTotal: {
    color: "#1E293B",
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  receiptValue: {
    flex: 1,
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
  },
  receiptCode: {
    letterSpacing: 0.5,
  },
  receiptValueTotal: {
    color: "#15AB64",
    fontFamily: "IBMPlexSansArabic-Bold",
  },
});
