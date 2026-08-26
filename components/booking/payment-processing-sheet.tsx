import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, normalize } from "@/constants/theme";
import type { PaymentStatus } from "@/hooks/usePaymentSession";
import { useDirection } from "@/i18n";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import LottieView from "lottie-react-native";
import React, { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import successAnim from "@/components/icons/motions/success.json";

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
);

export interface PaymentProcessingSheetProps {
  status: PaymentStatus;
  /** Re-asks the gateway after a timeout. Omit when there is no transaction. */
  onRecheck?: () => void;
  onClose: () => void;
  onGoToBookings: () => void;
}

/**
 * What the customer watches while the gateway settles.
 *
 * "timeout" is deliberately NOT phrased as a failure: the webhook may simply be
 * slow, and the booking often confirms a moment later. Saying "failed" there
 * would send people to pay a second time for a booking they already have.
 */
export const PaymentProcessingSheet = forwardRef<
  BottomSheetModal,
  PaymentProcessingSheetProps
>(function PaymentProcessingSheet(
  { status, onRecheck, onClose, onGoToBookings },
  ref,
) {
  const { isRTL } = useDirection();

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={["55%"]}
      // While the gateway is still settling, swiping this away would leave the
      // customer with no sign that anything is in flight.
      enablePanDownToClose={status !== "pending"}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
    >
      <BottomSheetView style={styles.content}>
        {status === "pending" && (
          <>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.spinner}
            />
            <ThemedText style={styles.title}>
              {isRTL ? "جاري التحقق من الدفع..." : "Verifying Payment..."}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isRTL
                ? "يرجى الانتظار بينما نتأكد من حالة العملية، قد يستغرق ذلك لحظات."
                : "Please wait while we confirm your transaction, this may take a few moments."}
            </ThemedText>
          </>
        )}

        {status === "success" && (
          <>
            <LottieView
              source={successAnim}
              autoPlay
              loop={false}
              style={styles.lottie}
              resizeMode="contain"
            />
            <ThemedText style={styles.title}>
              {isRTL ? "تم الدفع بنجاح!" : "Payment Successful!"}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isRTL
                ? "تم تأكيد الدفع بنجاح، جاري تحويلك..."
                : "Payment confirmed successfully, redirecting..."}
            </ThemedText>
          </>
        )}

        {status === "failed" && (
          <>
            <View style={[styles.badge, styles.badgeFailed]}>
              <ThemedText style={styles.badgeGlyph}>❌</ThemedText>
            </View>
            <ThemedText style={[styles.title, styles.titleFailed]}>
              {isRTL ? "فشلت عملية الدفع" : "Payment Failed"}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isRTL
                ? "نعتذر، لم نتمكن من تأكيد عملية الدفع. يرجى المحاولة مرة أخرى."
                : "Sorry, we couldn't confirm the payment. Please try again."}
            </ThemedText>
            <PrimaryButton
              label={isRTL ? "إغلاق" : "Close"}
              onPress={onClose}
              style={styles.button}
            />
          </>
        )}

        {status === "timeout" && (
          <>
            <View style={[styles.badge, styles.badgeTimeout]}>
              <ThemedText style={styles.badgeGlyph}>⏳</ThemedText>
            </View>
            <ThemedText style={[styles.title, styles.titleTimeout]}>
              {isRTL ? "انتهت مهلة التحقق" : "Verification Timeout"}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isRTL
                ? "لم نتلقَّ تأكيداً بعد. يرجى مراجعة قائمة حجوزاتك لاحقاً للتأكد من الحالة."
                : "We haven't received confirmation yet. Please check your bookings later for status."}
            </ThemedText>
            {onRecheck && (
              <PrimaryButton
                label={isRTL ? "إعادة التحقق" : "Check Status Again"}
                onPress={onRecheck}
                style={styles.button}
              />
            )}
            <PrimaryButton
              label={isRTL ? "الذهاب للحجوزات" : "Go to Bookings"}
              onPress={onGoToBookings}
              style={styles.button}
            />
          </>
        )}
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
  spinner: { marginTop: 40, marginBottom: 20 },
  lottie: {
    width: 140,
    height: normalize.height(120),
    alignSelf: "center",
    marginBottom: 15,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  badgeFailed: { backgroundColor: "#FEE2E2" },
  badgeTimeout: { backgroundColor: "#FEF3C7" },
  badgeGlyph: { fontSize: 14 },
  title: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  titleFailed: { color: "#EF4444" },
  titleTimeout: { color: "#F59E0B" },
  subtitle: {
    fontSize: normalize.font(14),
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  button: { width: "100%", height: 56, marginTop: 10 },
});
