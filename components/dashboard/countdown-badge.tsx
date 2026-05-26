import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCountdown } from '@/hooks/useCountdown';
import { normalize } from '@/constants/theme';
import { SolarClockCircleBold } from '@/components/icons/solar-icons';

interface CountdownBadgeProps {
  createdAt: string;
  durationHours?: number;
  isRTL?: boolean;
  /** 'compact' = small inline badge, 'card' = larger card for details page */
  variant?: 'compact' | 'card';
}

export function CountdownBadge({ createdAt, durationHours = 1, isRTL = false, variant = 'compact' }: CountdownBadgeProps) {
  const { formatted, isExpired, hours, minutes } = useCountdown(createdAt, durationHours);

  if (variant === 'card') {
    return (
      <View style={[styles.card, { backgroundColor: isExpired ? '#FEF2F2' : '#FFF7ED', borderColor: isExpired ? '#FEE2E2' : '#FFEDD5' }]}>
        <View style={styles.cardInner}>
          <View style={[styles.cardIconWrap, { backgroundColor: isExpired ? '#FEE2E2' : '#FFEDD5' }]}>
            <SolarClockCircleBold size={20} color={isExpired ? '#EF4444' : '#F97316'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', color: isExpired ? '#EF4444' : '#9A3412' }]}>
              {isExpired
                ? (isRTL ? 'انتهى وقت القبول' : 'Approval time expired')
                : (isRTL ? 'الوقت المتبقي للقبول' : 'Time remaining to accept')}
            </Text>
            <Text style={[styles.cardTimer, { textAlign: isRTL ? 'right' : 'left', color: isExpired ? '#EF4444' : '#EA580C' }]}>
              {isExpired ? '00:00:00' : formatted}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Compact badge variant
  const isUrgent = !isExpired && hours === 0 && minutes < 15;
  const bgColor = isExpired ? '#FEF2F2' : isUrgent ? '#FFF1F2' : '#FFF7ED';
  const textColor = isExpired ? '#EF4444' : isUrgent ? '#E11D48' : '#EA580C';
  const borderColor = isExpired ? '#FECACA' : isUrgent ? '#FECDD3' : '#FED7AA';

  return (
    <View style={[styles.compact, { backgroundColor: bgColor, borderColor }]}>
      <SolarClockCircleBold size={12} color={textColor} />
      <Text style={[styles.compactText, { color: textColor }]}>
        {isExpired ? (isRTL ? 'منتهي' : 'Expired') : formatted}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact badge
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  compactText: {
    fontSize: normalize.font(10),
    fontFamily: 'Alexandria-SemiBold',
    fontVariant: ['tabular-nums'],
  },

  // Card variant
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Medium',
    marginBottom: 2,
  },
  cardTimer: {
    fontSize: normalize.font(20),
    fontFamily: 'Alexandria-Bold',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
});
