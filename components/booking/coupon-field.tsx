import { SolarCheckCircleBoldDuotone } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export interface CouponFieldProps {
  value: string;
  onChangeValue: (value: string) => void;
  /** Set once the API accepts a code; the field collapses to a confirmation. */
  appliedCode?: string | null;
  error?: string | null;
  isChecking?: boolean;
  onApply: () => void;
  onRemove: () => void;
}

/**
 * Discount-code entry.
 *
 * Applying is a REQUEST, not an assertion: the server re-validates the code and
 * re-prices the booking, so the amount shown here is only ever one the server
 * has already agreed to.
 */
export function CouponField({
  value,
  onChangeValue,
  appliedCode,
  error,
  isChecking = false,
  onApply,
  onRemove,
}: CouponFieldProps) {
  const { isRTL, rowDirection, textAlign, inputTextAlign } = useDirection();
  const canApply = !!value.trim() && !isChecking;

  return (
    <View style={styles.box}>
      {appliedCode ? (
        <View style={[styles.row, { flexDirection: rowDirection }]}>
          <SolarCheckCircleBoldDuotone size={16} color={Colors.secondary} />
          <ThemedText style={[styles.applied, { textAlign }]} numberOfLines={1}>
            {isRTL ? `تم تطبيق ${appliedCode}` : `${appliedCode} applied`}
          </ThemedText>
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <ThemedText style={styles.remove}>
              {isRTL ? "إزالة" : "Remove"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.row, { flexDirection: rowDirection, gap: 8 }]}>
          <TextInput
            style={[styles.input, { textAlign: inputTextAlign }]}
            value={value}
            // Codes are issued uppercase; normalising as the customer types
            // saves a rejection for nothing but letter case.
            onChangeText={(text) => onChangeValue(text.toUpperCase())}
            placeholder={isRTL ? "لديك كود خصم؟" : "Have a discount code?"}
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
            onPress={onApply}
            disabled={!canApply}
          >
            <ThemedText style={styles.applyText}>
              {isChecking ? "..." : isRTL ? "تطبيق" : "Apply"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {!!error && (
        <ThemedText style={[styles.error, { textAlign }]}>{error}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: normalize.height(8),
    marginBottom: normalize.height(4),
    gap: normalize.height(6),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: normalize.radius(10),
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(9),
    fontSize: normalize.font(13),
    color: Colors.text.primary,
    backgroundColor: Colors.white,
    letterSpacing: 1,
  },
  applyBtn: {
    justifyContent: "center",
    paddingHorizontal: normalize.width(16),
    borderRadius: normalize.radius(10),
    backgroundColor: Colors.primary,
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyText: {
    color: "white",
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  applied: {
    flex: 1,
    marginHorizontal: normalize.width(8),
    fontSize: normalize.font(13),
    color: Colors.secondary,
  },
  remove: {
    fontSize: normalize.font(12),
    color: Colors.error,
    textDecorationLine: "underline",
  },
  error: {
    fontSize: normalize.font(11),
    color: Colors.error,
    lineHeight: normalize.font(17),
  },
});
