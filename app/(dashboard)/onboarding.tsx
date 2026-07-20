import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import {
  useGetOwnerChaletsQuery,
  useGetProviderProfileQuery,
} from '@/store/api/apiSlice';
import {
  SolarAltArrowLeftBold,
  SolarAltArrowRightBold,
  SolarCardBold,
  SolarCheckCircleBold,
  SolarClockCircleBold,
  SolarDangerTriangleBold,
  SolarHomeSmileBoldDuotone,
} from '@/components/icons/solar-icons';

type StepStatus = 'todo' | 'done' | 'pending' | 'rejected';

const STATUS_COLORS: Record<StepStatus, { fg: string; bg: string }> = {
  todo: { fg: Colors.text.muted, bg: '#F1F5F9' },
  done: { fg: '#16A34A', bg: '#ECFDF5' },
  pending: { fg: '#D97706', bg: '#FFFBEB' },
  rejected: { fg: '#DC2626', bg: '#FEF2F2' },
};

export default function OwnerOnboardingScreen() {
  const { isRTL, rowDirection, textAlign } = useDirection();
  const router = useRouter();

  const {
    data: profile,
    isLoading: loadingProfile,
    refetch: refetchProfile,
  } = useGetProviderProfileQuery(undefined);
  const {
    data: chaletsResponse,
    isLoading: loadingChalets,
    refetch: refetchChalets,
  } = useGetOwnerChaletsQuery({});

  // Refresh statuses whenever we return to this hub from a sub-step.
  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      refetchChalets();
    }, [refetchProfile, refetchChalets]),
  );

  const profileData: any = profile?.data || profile;
  const chalets: any[] = chaletsResponse?.data || [];
  const latestChalet = chalets[0];

  const paymentDone = !!(profileData?.zainCash || profileData?.qi);
  const paymentStatus: StepStatus = paymentDone ? 'done' : 'todo';

  let chaletStatus: StepStatus = 'todo';
  if (latestChalet) {
    if (latestChalet.isApproved) chaletStatus = 'done';
    else if (latestChalet.isRejected) chaletStatus = 'rejected';
    else chaletStatus = 'pending';
  }

  const completedCount = (paymentDone ? 1 : 0) + (chalets.length > 0 ? 1 : 0);
  const submitted = chalets.length > 0; // chalet exists → already sent for review

  const goToDashboard = () => router.replace('/(tabs)/(dashboard)/home');

  const openPayment = () =>
    router.push('/(dashboard)/edit-business?onboarding=1');

  const openChalet = () => {
    if (latestChalet) {
      router.push({
        pathname: '/(dashboard)/chalet-details',
        params: { id: latestChalet.id },
      });
    } else {
      router.push('/(dashboard)/add-chalet?onboarding=1');
    }
  };

  const isLoading = loadingProfile || loadingChalets;
  const Chevron = isRTL ? SolarAltArrowLeftBold : SolarAltArrowRightBold;

  const statusLabel = (status: StepStatus) => {
    switch (status) {
      case 'done':
        return isRTL ? 'مكتمل' : 'Done';
      case 'pending':
        return isRTL ? 'قيد المراجعة' : 'Under review';
      case 'rejected':
        return isRTL ? 'مرفوض' : 'Rejected';
      default:
        return isRTL ? 'لم يبدأ' : 'Not started';
    }
  };

  const renderStep = (opts: {
    index: number;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    status: StepStatus;
    onPress: () => void;
    required?: boolean;
    note?: string | null;
  }) => {
    const { fg, bg } = STATUS_COLORS[opts.status];
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={opts.onPress}
        style={[styles.card, { flexDirection: rowDirection }]}
      >
        <View style={[styles.stepIcon, { backgroundColor: bg }]}>
          {opts.status === 'done' ? (
            <SolarCheckCircleBold size={26} color={fg} />
          ) : (
            opts.icon
          )}
        </View>

        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.cardTitle, { textAlign }]}>
            {opts.title}
          </ThemedText>
          <ThemedText style={[styles.cardSubtitle, { textAlign }]}>
            {opts.subtitle}
          </ThemedText>

          <View style={[styles.statusRow, { flexDirection: rowDirection, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.statusPill, { backgroundColor: bg }]}>
              <ThemedText style={[styles.statusText, { color: fg }]}>
                {statusLabel(opts.status)}
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.reqTag,
                { color: opts.required ? '#DC2626' : Colors.text.muted },
              ]}
            >
              {opts.required
                ? (isRTL ? 'مطلوب' : 'Required')
                : (isRTL ? 'اختياري' : 'Optional')}
            </ThemedText>
          </View>

          {!!opts.note && (
            <View style={[styles.noteRow, { flexDirection: rowDirection }]}>
              <SolarDangerTriangleBold size={14} color="#DC2626" />
              <ThemedText style={[styles.noteText, { textAlign }]}>
                {opts.note}
              </ThemedText>
            </View>
          )}
        </View>

        <Chevron size={20} color={Colors.text.muted} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Intro */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <SolarHomeSmileBoldDuotone size={56} color={Colors.primary} />
          </View>
          <ThemedText style={[styles.heroTitle, { textAlign: 'center' }]}>
            {isRTL ? 'أكمل إعداد حسابك' : 'Finish setting up'}
          </ThemedText>
          <ThemedText style={[styles.heroSubtitle, { textAlign: 'center' }]}>
            {isRTL
              ? 'معلومات الدفع مطلوبة لتفعيل حسابك. تجهيز الشاليه وإرساله للموافقة يمكن إكماله الآن أو لاحقاً.'
              : 'Payout details are required to activate your account. Setting up and submitting your chalet can be done now or later.'}
          </ThemedText>

          <View style={[styles.progressRow, { flexDirection: rowDirection }]}>
            <ThemedText style={styles.progressText}>
              {isRTL
                ? `${completedCount} من 2 مكتملة`
                : `${completedCount} of 2 complete`}
            </ThemedText>
          </View>
        </View>

        {/* Step 1 — Payment */}
        {renderStep({
          index: 1,
          icon: <SolarCardBold size={26} color={STATUS_COLORS[paymentStatus].fg} />,
          title: isRTL ? 'معلومات الدفع' : 'Payout details',
          subtitle: isRTL
            ? 'رقم زين كاش أو بطاقة كي لاستلام مستحقاتك'
            : 'Zain Cash or Qi Card to receive your payouts',
          status: paymentStatus,
          onPress: openPayment,
          required: true,
        })}

        {/* Step 2 — Chalet */}
        {renderStep({
          index: 2,
          icon: <SolarHomeSmileBoldDuotone size={26} color={STATUS_COLORS[chaletStatus].fg} />,
          title: isRTL ? 'إعداد الشاليه وإرساله للموافقة' : 'Set up chalet & submit',
          subtitle: isRTL
            ? 'المعلومات، الصور، السياسات والمرافق'
            : 'Details, photos, policies and amenities',
          status: chaletStatus,
          onPress: openChalet,
          required: false,
          note:
            chaletStatus === 'rejected'
              ? isRTL
                ? `سبب الرفض: ${latestChalet?.rejectionReason || 'يرجى التواصل مع الدعم'}`
                : `Rejection reason: ${latestChalet?.rejectionReason || 'Please contact support'}`
              : null,
        })}

        {/* Under-review reassurance */}
        {submitted && chaletStatus === 'pending' && (
          <View style={[styles.infoBanner, { flexDirection: rowDirection }]}>
            <SolarClockCircleBold size={20} color="#D97706" />
            <ThemedText style={[styles.infoText, { textAlign }]}>
              {isRTL
                ? 'تم إرسال شاليهك للمراجعة. سنعلمك فور الموافقة عليه.'
                : 'Your chalet was sent for review. We will notify you once it is approved.'}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Footer — payment is required before leaving; the chalet is optional. */}
      <View style={styles.footer}>
        {!paymentDone ? (
          <>
            <ThemedText style={[styles.footerNote, { textAlign: 'center' }]}>
              {isRTL
                ? 'أضف معلومات الدفع أولاً لتفعيل حسابك'
                : 'Add payout details first to activate your account'}
            </ThemedText>
            <PrimaryButton
              label={isRTL ? 'أضف معلومات الدفع' : 'Add payout details'}
              onPress={openPayment}
              height={54}
            />
          </>
        ) : (
          <>
            <PrimaryButton
              label={
                submitted
                  ? isRTL
                    ? 'الذهاب للوحة التحكم'
                    : 'Go to dashboard'
                  : isRTL
                    ? 'ابدأ إعداد الشاليه'
                    : 'Start chalet setup'
              }
              onPress={submitted ? goToDashboard : openChalet}
              height={54}
            />
            {!submitted && (
              <SecondaryButton
                label={isRTL ? 'إكمال الشاليه لاحقاً' : 'Finish chalet later'}
                onPress={goToDashboard}
                style={{ marginTop: 10 }}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  scroll: { padding: 20, paddingBottom: 24 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: normalize.font(18),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  progressRow: { marginTop: 16, alignItems: 'center' },
  progressText: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
  },
  card: {
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  statusRow: {
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Bold',
  },
  reqTag: {
    fontSize: normalize.font(10),
    fontFamily: 'Alexandria-Bold',
  },
  noteRow: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Medium',
    color: '#DC2626',
    lineHeight: 16,
  },
  infoBanner: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Medium',
    color: '#B45309',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  footerNote: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Medium',
    color: '#B45309',
    marginBottom: 10,
  },
});
