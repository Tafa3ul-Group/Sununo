import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * The "‑10%" chip and the struck-through original price.
 *
 * The API attaches `discount` to every customer-facing chalet payload (browse,
 * search, featured, detail) and leaves it null when no campaign is running, so
 * both components below render nothing at all in the common case.
 *
 * The customer is deliberately never told WHO funded the discount — that split
 * is between the platform and the owner, and showing it would only invite
 * questions about a number that does not change what they pay.
 */
export interface ChaletDiscount {
  percentage: number;
  name?: { ar?: string; en?: string } | null;
  priceBefore?: number | null;
  priceAfter?: number | null;
}

export function DiscountBadge({ discount, size = 'md' }: { discount?: ChaletDiscount | null; size?: 'sm' | 'md' }) {
  if (!discount || !(Number(discount.percentage) > 0)) return null;

  const small = size === 'sm';
  return (
    <View style={[styles.badge, small && styles.badgeSmall]}>
      <Text style={[styles.badgeText, small && styles.badgeTextSmall]}>
        −{Math.round(Number(discount.percentage))}%
      </Text>
    </View>
  );
}

/** The pre-discount price, struck through. Renders nothing without a real saving. */
export function DiscountedFrom({ discount, size = 'md' }: { discount?: ChaletDiscount | null; size?: 'sm' | 'md' }) {
  const { isRTL } = useDirection();

  if (!discount || !discount.priceBefore || !discount.priceAfter) return null;
  if (Number(discount.priceBefore) <= Number(discount.priceAfter)) return null;

  return (
    <Text style={[styles.struck, size === 'sm' && styles.struckSmall]}>
      {Number(discount.priceBefore).toLocaleString()} {isRTL ? 'د.ع' : 'IQD'}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.secondary,
    borderRadius: normalize.radius(8),
    paddingHorizontal: normalize.width(7),
    paddingVertical: normalize.height(3),
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: normalize.width(5),
    paddingVertical: normalize.height(2),
    borderRadius: normalize.radius(6),
  },
  badgeText: {
    color: 'white',
    fontSize: normalize.font(11),
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  badgeTextSmall: { fontSize: normalize.font(9) },
  struck: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    textDecorationLine: 'line-through',
  },
  struckSmall: { fontSize: normalize.font(9) },
});
