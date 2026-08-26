import { SolarInfoCircleBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import React from "react";
import { StyleSheet, View } from "react-native";

export type CancellationTier = {
  id?: string;
  daysBeforeBooking: number;
  penaltyPercentage: number | string;
};

export interface CancellationPolicyCardProps {
  /** Already sorted most-generous-window-first by the caller. */
  tiers: CancellationTier[];
  isLoading?: boolean;
}

/**
 * What the customer forfeits by cancelling, shown at checkout — where they are
 * being asked to agree to it.
 *
 * The empty case is not a blank card: a chalet that publishes no tiers falls
 * back to keeping the FULL amount (see CancellationProcessingService), which is
 * the harshest possible outcome and the one most worth saying out loud.
 */
export function CancellationPolicyCard({
  tiers,
  isLoading = false,
}: CancellationPolicyCardProps) {
  const { isRTL, rowDirection, textAlign } = useDirection();

  return (
    <View style={styles.card}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <SolarInfoCircleBold size={18} color="#B45309" />
        <ThemedText style={[styles.title, { textAlign }]}>
          {isRTL ? "سياسة الإلغاء" : "Cancellation policy"}
        </ThemedText>
      </View>

      {isLoading ? (
        <ThemedText style={[styles.text, { textAlign }]}>
          {isRTL ? "جارٍ التحميل..." : "Loading..."}
        </ThemedText>
      ) : tiers.length > 0 ? (
        <>
          {tiers.map((tier) => (
            <ThemedText
              key={tier.id ?? tier.daysBeforeBooking}
              style={[styles.text, { textAlign }]}
            >
              {isRTL
                ? `• الإلغاء قبل ${tier.daysBeforeBooking} يوم أو أكثر: تُخصم ${Number(tier.penaltyPercentage)}%`
                : `• Cancel ${tier.daysBeforeBooking}+ days ahead: ${Number(tier.penaltyPercentage)}% fee`}
            </ThemedText>
          ))}
          <ThemedText style={[styles.text, { textAlign }]}>
            {isRTL
              ? "• الإلغاء بعد ذلك: لا يُسترد شيء."
              : "• Cancelling later than that refunds nothing."}
          </ThemedText>
        </>
      ) : (
        <ThemedText style={[styles.text, styles.textStrict, { textAlign }]}>
          {isRTL
            ? "هذا الشاليه لم ينشر سياسة إلغاء، لذلك لا يُسترد أي مبلغ عند الإلغاء."
            : "This chalet publishes no cancellation policy, so cancelling refunds nothing."}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#B45309",
  },
  text: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#92400E",
    lineHeight: 19,
  },
  textStrict: {
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
});
