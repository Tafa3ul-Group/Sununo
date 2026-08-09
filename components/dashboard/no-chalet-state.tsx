import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import { useGetProviderProfileQuery } from '@/store/api/apiSlice';
import {
  SolarAddSquareBold,
  SolarAltArrowLeftBold,
  SolarAltArrowRightBold,
  SolarCalendarAddBold,
  SolarDangerTriangleBold,
  SolarGalleryBold,
  SolarHomeSmileBoldDuotone,
  SolarWalletBold,
} from '@/components/icons/solar-icons';

/**
 * Shown in place of the owner dashboard home whenever the account has no chalet
 * yet. The calendar/shifts/bookings UI is meaningless without one, so instead of
 * an empty grid we explain what a chalet unlocks and route straight into the
 * add-chalet flow.
 */
export function NoChaletState() {
  const { isRTL, textAlign } = useDirection();
  const router = useRouter();

  const { data: profile } = useGetProviderProfileQuery(undefined);
  const profileData: any = profile?.data || profile;
  const paymentDone = !!(profileData?.zainCash || profileData?.qi || profileData?.bankAccount);

  const Chevron = isRTL ? SolarAltArrowLeftBold : SolarAltArrowRightBold;

  const steps = [
    {
      icon: <SolarGalleryBold size={20} color={Colors.primary} />,
      title: isRTL ? 'أضف معلومات شاليهك' : 'Add your chalet details',
      subtitle: isRTL
        ? 'الاسم، الموقع، الصور، الأسعار والمرافق'
        : 'Name, location, photos, pricing and amenities',
    },
    {
      icon: <SolarCalendarAddBold size={20} color={Colors.primary} />,
      title: isRTL ? 'حدّد الشفتات والتقويم' : 'Set your shifts and calendar',
      subtitle: isRTL
        ? 'اختر أوقات الحجز المتاحة لكل يوم'
        : 'Choose the booking times available each day',
    },
    {
      icon: <SolarWalletBold size={20} color={Colors.primary} />,
      title: isRTL ? 'ابدأ باستقبال الحجوزات' : 'Start receiving bookings',
      subtitle: isRTL
        ? 'ستظهر الطلبات هنا فور الموافقة على شاليهك'
        : 'Requests appear here once your chalet is approved',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconOuter}>
            <View style={styles.heroIconInner}>
              <SolarHomeSmileBoldDuotone size={52} color={Colors.primary} />
            </View>
            <View style={styles.heroBadge}>
              <SolarAddSquareBold size={20} color={Colors.white} />
            </View>
          </View>

          <ThemedText style={[styles.title, { textAlign: 'center' }]}>
            {isRTL ? 'لا يوجد لديك شاليه بعد' : 'You have no chalet yet'}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: 'center' }]}>
            {isRTL
              ? 'أضف شاليهك الأول لتفعيل التقويم واستقبال طلبات الحجز من الزبائن.'
              : 'Add your first chalet to unlock the calendar and start receiving booking requests.'}
          </ThemedText>
        </View>

        <View style={styles.stepsCard}>
          {steps.map((step, index) => (
            <View
              key={step.title}
              style={[
                styles.stepRow,
                { flexDirection: 'row' },
                index < steps.length - 1 && styles.stepRowDivider,
              ]}
            >
              <View style={styles.stepIcon}>{step.icon}</View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.stepTitle, { textAlign }]}>
                  {step.title}
                </ThemedText>
                <ThemedText style={[styles.stepSubtitle, { textAlign }]}>
                  {step.subtitle}
                </ThemedText>
              </View>
              <View style={styles.stepNumber}>
                <ThemedText style={styles.stepNumberText}>
                  {index + 1}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Payout details are required to activate the account — surface it here
            so the owner isn't blocked later in the chalet flow. */}
        {!paymentDone && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(dashboard)/edit-business?onboarding=1')}
            style={[styles.warningCard, { flexDirection: 'row' }]}
          >
            <SolarDangerTriangleBold size={20} color="#B45309" />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.warningTitle, { textAlign }]}>
                {isRTL ? 'معلومات الدفع مطلوبة' : 'Payout details required'}
              </ThemedText>
              <ThemedText style={[styles.warningText, { textAlign }]}>
                {isRTL
                  ? 'أضف رقم زين كاش أو بطاقة كي لاستلام مستحقاتك'
                  : 'Add Zain Cash or Qi Card to receive your payouts'}
              </ThemedText>
            </View>
            <Chevron size={18} color="#B45309" />
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isRTL ? 'أضف شاليهك الأول' : 'Add your first chalet'}
          onPress={() => router.push('/(dashboard)/add-chalet?onboarding=1')}
          icon={<SolarAddSquareBold size={20} color={Colors.white} />}
          height={54}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(dashboard)/onboarding')}
          style={styles.secondaryLink}
        >
          <ThemedText style={[styles.secondaryLinkText, { textAlign: 'center' }]}>
            {isRTL ? 'عرض خطوات الإعداد' : 'View setup steps'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(12),
    paddingBottom: normalize.height(24),
  },
  hero: { alignItems: 'center', marginBottom: normalize.height(24) },
  heroIconOuter: {
    width: normalize.width(104),
    height: normalize.width(104),
    borderRadius: normalize.radius(32),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize.height(16),
  },
  heroIconInner: {
    width: normalize.width(76),
    height: normalize.width(76),
    borderRadius: normalize.radius(26),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadge: {
    position: 'absolute',
    bottom: -4,
    end: -4,
    width: normalize.width(36),
    height: normalize.width(36),
    borderRadius: normalize.radius(18),
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: normalize.font(18),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: normalize.height(8),
  },
  subtitle: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
    lineHeight: normalize.font(22),
    paddingHorizontal: normalize.width(8),
  },
  stepsCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: normalize.radius(18),
    paddingHorizontal: normalize.width(14),
  },
  stepRow: {
    alignItems: 'center',
    gap: normalize.width(12),
    paddingVertical: normalize.height(14),
  },
  stepRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepIcon: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: normalize.radius(14),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
    lineHeight: normalize.font(17),
  },
  stepNumber: {
    width: normalize.width(22),
    height: normalize.width(22),
    borderRadius: normalize.radius(11),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: normalize.font(10),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.muted,
    lineHeight: normalize.font(14),
  },
  warningCard: {
    alignItems: 'center',
    gap: normalize.width(10),
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: normalize.radius(16),
    padding: normalize.width(14),
    marginTop: normalize.height(14),
  },
  warningTitle: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Bold',
    color: '#B45309',
    marginBottom: 2,
  },
  warningText: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Medium',
    color: '#B45309',
    lineHeight: normalize.font(16),
  },
  footer: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(12),
    // Clears the floating dashboard tab bar.
    paddingBottom: normalize.height(110),
    backgroundColor: Colors.white,
  },
  secondaryLink: {
    marginTop: normalize.height(10),
    paddingVertical: normalize.height(8),
  },
  secondaryLinkText: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
  },
});
