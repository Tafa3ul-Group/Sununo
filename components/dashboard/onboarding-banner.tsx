import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import {
  useGetOwnerChaletsQuery,
  useGetProviderProfileQuery,
} from '@/store/api/apiSlice';
import {
  SolarAltArrowLeftBold,
  SolarAltArrowRightBold,
  SolarClockCircleBold,
  SolarDangerTriangleBold,
  SolarHomeSmileBoldDuotone,
} from '@/components/icons/solar-icons';

type Variant = 'setup' | 'pending' | 'rejected';

const THEME: Record<Variant, { fg: string; bg: string; border: string }> = {
  setup: { fg: Colors.primary, bg: '#EFF6FF', border: '#BFDBFE' },
  pending: { fg: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  rejected: { fg: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

/**
 * Compact banner shown on the owner dashboard until first-run setup is complete
 * and the owner's chalet has cleared review. Tapping it resumes the onboarding
 * hub. Renders nothing once payout details exist and the latest chalet is
 * approved.
 */
export function OnboardingBanner() {
  const { isRTL, rowDirection, textAlign } = useDirection();
  const router = useRouter();

  const { data: profile } = useGetProviderProfileQuery(undefined);
  const { data: chaletsResponse } = useGetOwnerChaletsQuery({});

  const profileData: any = profile?.data || profile;
  const chalets: any[] = chaletsResponse?.data || [];
  const latest = chalets[0];

  const paymentDone = !!(profileData?.zainCash || profileData?.qi);
  const setupIncomplete = !paymentDone || chalets.length === 0;

  let variant: Variant | null = null;
  if (setupIncomplete) variant = 'setup';
  else if (latest?.isRejected) variant = 'rejected';
  else if (!latest?.isApproved) variant = 'pending';

  if (!variant) return null;

  const theme = THEME[variant];
  const Chevron = isRTL ? SolarAltArrowLeftBold : SolarAltArrowRightBold;

  const icon =
    variant === 'setup' ? (
      <SolarHomeSmileBoldDuotone size={24} color={theme.fg} />
    ) : variant === 'pending' ? (
      <SolarClockCircleBold size={24} color={theme.fg} />
    ) : (
      <SolarDangerTriangleBold size={24} color={theme.fg} />
    );

  const title =
    variant === 'setup'
      ? !paymentDone
        ? isRTL
          ? 'معلومات الدفع مطلوبة'
          : 'Payout details required'
        : isRTL
          ? 'أكمل إعداد شاليهك'
          : 'Finish setting up your chalet'
      : variant === 'pending'
        ? isRTL
          ? 'شاليهك قيد المراجعة'
          : 'Your chalet is under review'
        : isRTL
          ? 'تم رفض شاليهك'
          : 'Your chalet was rejected';

  const subtitle =
    variant === 'setup'
      ? !paymentDone
        ? isRTL
          ? 'أضف رقم زين كاش أو بطاقة كي لتفعيل حسابك'
          : 'Add Zain Cash or Qi Card to activate your account'
        : isRTL
          ? 'جهّز شاليهك وأرسله للموافقة'
          : 'Set up your chalet and submit it for approval'
      : variant === 'pending'
        ? isRTL
          ? 'سنعلمك فور الموافقة عليه'
          : 'We will notify you once it is approved'
        : isRTL
          ? latest?.rejectionReason || 'اضغط لمراجعة التفاصيل'
          : latest?.rejectionReason || 'Tap to review the details';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push('/(dashboard)/onboarding')}
      style={[
        styles.banner,
        { backgroundColor: theme.bg, borderColor: theme.border, flexDirection: rowDirection },
      ]}
    >
      <View style={styles.icon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.title, { color: theme.fg, textAlign }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { textAlign }]} numberOfLines={2}>
          {subtitle}
        </ThemedText>
      </View>
      <Chevron size={18} color={theme.fg} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  icon: { justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});
