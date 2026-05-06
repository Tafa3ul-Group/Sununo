import { BookingCancellationSheet, BookingCancellationSheetRef } from '@/components/booking-cancellation-modal';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import {
  SolarDangerCircleBold
} from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { RootState } from '@/store';
import { useDeleteExternalBookingMutation, useGetProviderBookingDetailsQuery, useMarkBookingCompletedMutation, useRejectBookingMutation } from '@/store/api/apiSlice';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getImageSrc } from '@/hooks/useImageSrc';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const IDENTITY_BLUE = '#035DF9';

import { PaymentConfirmationSheet, PaymentConfirmationSheetRef } from '@/components/payment-confirmation-modal';

export default function BookingDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useSelector((state: RootState) => state.auth);
  const isArabic = language === 'ar';
  const isRTL = isArabic;
  const { t } = useTranslation();
  const cancelSheetRef = React.useRef<BookingCancellationSheetRef>(null);
  const confirmPaymentSheetRef = React.useRef<PaymentConfirmationSheetRef>(null);

  const [rejectBooking, { isLoading: isRejectLoading }] = useRejectBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();
  const [markAsPaid, { isLoading: isPaying }] = useMarkBookingCompletedMutation();

  const { data: bookingDetailsData, isLoading, error, refetch } = useGetProviderBookingDetailsQuery(id as string, { skip: !id });

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={IDENTITY_BLUE} /></View>;

  const data = bookingDetailsData?.data || bookingDetailsData;

  if (error || !data || !data.id) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{t('common.error')}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{isRTL ? 'العودة' : 'Go Back'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const bIsExternal = data.status === "external";
  const bChaletName = isRTL
    ? data.chalet?.name?.ar || data.chalet?.name
    : data.chalet?.name?.en || data.chalet?.name;
  const bChaletAddress = isRTL
    ? data.chalet?.address?.ar || data.chalet?.address
    : data.chalet?.address?.en || data.chalet?.address;
  const bCustomerName = bIsExternal
    ? isRTL
      ? "حجز خارجي"
      : "External Booking"
    : data.customer?.name || t("common.user");
  const bShiftName = isRTL
    ? data.shift?.name?.ar || data.shift?.name
    : data.shift?.name?.en || data.shift?.name;
  const bChaletImage = data.chalet?.image || data.chalet?.images?.[0];
  const chaletImageId = typeof bChaletImage === 'string'
    ? bChaletImage
    : bChaletImage?.url || bChaletImage?.id || bChaletImage?.imageUrl;

  const chaletImageSource = getImageSrc(chaletImageId);

  const depositAmount = Number(data.depositAmount || 0);
  const remainingAmount = Number(data.remainingAmount || 0);
  const totalPrice = Number(data.totalPrice || 0);

  const handleConfirmCancellation = async (reason: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (bIsExternal) {
        await deleteExternalBooking(data.id).unwrap();
      } else {
        await rejectBooking({
          id: data.id,
          reason: reason || (isRTL ? 'إلغاء من قبل المشغل' : 'Cancelled by provider')
        }).unwrap();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
      cancelSheetRef.current?.showSuccess(isRTL ? 'تم الإلغاء بنجاح.' : 'Cancelled successfully.');
      setTimeout(() => router.back(), 1500);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      cancelSheetRef.current?.showError(e?.data?.message || (isRTL ? 'فشل الإلغاء' : 'Failed to cancel'));
    }
  };

  const handleConfirmPayment = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await markAsPaid(data.id).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      confirmPaymentSheetRef.current?.showSuccess(isRTL ? 'تم تأكيد استلام المبلغ بنجاح.' : 'Payment confirmed successfully.');
      refetch();
      setTimeout(() => {
        confirmPaymentSheetRef.current?.dismiss();
        router.back();
      }, 1500);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      confirmPaymentSheetRef.current?.showError(e?.data?.message || (isRTL ? 'فشل تأكيد الاستلام' : 'Failed to confirm payment'));
    }
  };

  const renderInfoRow = (label: string, value: string | React.ReactNode, isBlue: boolean = false) => (
    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row' : 'row' }]}>
      {isRTL ? (
        <>
          <Text style={[styles.infoValue, isBlue && styles.blueValue]}>{value}</Text>
          <Text style={styles.infoLabel}>{label}</Text>
        </>
      ) : (
        <>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={[styles.infoValue, isBlue && styles.blueValue]}>{value}</Text>
        </>
      )}
    </View>
  );

  const bIsCancelled = data.status === 'cancelled' || data.bookingStatus === 'CANCELLED';
  const bCancelReason = data.cancelReason || data.cancellationReason || (isRTL ? 'غير محدد' : 'Not specified');

  return (
    <View style={styles.container}>
      {/* Dashboard Header */}
      <DashboardHeader
        title={isRTL ? 'تفاصيل الحجز' : 'Booking Details'}
        showBackButton={true}
        showSearch={false}
        customRightComponent={<View style={{ width: normalize.width(80) }} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Cancelled Status Card */}
        {bIsCancelled && (
          <View style={styles.cancelledCard}>
            <View style={[styles.cancelledHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.warningIconWrapper}>
                <SolarDangerCircleBold size={24} color="#EA2129" />
              </View>
              <Text style={styles.cancelledTitle}>
                {isRTL ? 'تم إلغاء هذا الحجز بواسطتك' : 'This booking was cancelled by you'}
              </Text>
            </View>
            <View style={styles.cancelledDivider} />
            <Text style={[styles.cancelledReason, { textAlign: isRTL ? 'right' : 'left' }]}>
              {bCancelReason}
            </Text>
          </View>
        )}

        {/* Chalet Information Section */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'معلومات الشاليه' : 'Chalet Information'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={[styles.chaletSimpleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.simpleImageWrapper}>
              <ExpoImage
                source={chaletImageSource}
                style={styles.simpleChaletImage}
              />
            </View>
            <View style={[styles.simpleChaletText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.simpleChaletName}>{bChaletName}</Text>
              <Text style={styles.simpleChaletLocation}>{bChaletAddress}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'معلومات الزبون' : 'Customer Information'}</Text>
          </View>
          <View style={styles.divider} />
          {renderInfoRow(isRTL ? 'الاسم' : 'Name', bCustomerName)}
          {renderInfoRow(isRTL ? 'رقم الهاتف' : 'Phone', <Text style={[styles.infoValue, { direction: 'ltr' }]}>{data.customer?.phone || data.customerPhone || '--'}</Text>)}
        </View>

        {/* Booking Information */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'معلومات الحجز' : 'Booking Information'}</Text>
          </View>
          <View style={styles.divider} />
          {renderInfoRow(isRTL ? "التاريخ" : "Date", data.bookingDate)}
          {renderInfoRow(isRTL ? "الفترة" : "Period", bShiftName)}
          {renderInfoRow(
            isRTL ? "الاشخاص" : "Persons",
            isRTL
              ? `${data.adultsCount || 0} بالغين، ${data.childrenCount || 0} اطفال`
              : `${data.adultsCount || 0} Adults, ${data.childrenCount || 0} Children`,
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'معلومات الدفع' : 'Payment Information'}</Text>
          </View>
          <View style={styles.divider} />
          {renderInfoRow(
            isRTL ? "المبلغ الكلي" : "Total Price",
            `${totalPrice.toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
          )}
          {renderInfoRow(
            isRTL ? "المبلغ المدفوع (العربون)" : "Paid (Deposit)",
            `${depositAmount.toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
          )}
          {renderInfoRow(
            isRTL ? "المبلغ المتبقي" : "Remaining Amount",
            `${remainingAmount.toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
            true,
          )}
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Actions Footer */}
      {!bIsCancelled && (
        <View style={styles.bottomActions}>
          {remainingAmount > 0 ? (
            <PrimaryButton
              label={isRTL ? `تسديد المبلغ المتبقي ` : `Pay Remaining Balance`}
              onPress={() => {
                confirmPaymentSheetRef.current?.present();
              }}
              height={60}
              style={styles.payButton}
            />
          ) : (
            <PrimaryButton
              label={isRTL ? 'تم سداد المبلغ بالكامل' : 'Full amount paid'}
              onPress={() => { }}
              activeColor="#22C55E"
              height={60}
              style={styles.payButton}
              disabled={true}
            />
          )}

          {remainingAmount > 0 && (
            <PrimaryButton
              label={isRTL ? 'إلغاء الحجز' : 'Cancel Booking'}
              onPress={() => cancelSheetRef.current?.present()}
              activeColor="#EA2129"
              isActive={true}
              height={50}
              style={styles.cancelButton}
            />
          )}
        </View>
      )}

      <PaymentConfirmationSheet
        ref={confirmPaymentSheetRef}
        onConfirm={handleConfirmPayment}
        isLoading={isPaying}
        isRTL={isRTL}
        amount={Number(remainingAmount).toLocaleString()}
      />

      <BookingCancellationSheet
        ref={cancelSheetRef}
        onConfirm={handleConfirmCancellation}
        isLoading={isRejectLoading || isDeletingExternal}
        isRTL={isRTL}
        isExternal={bIsExternal}
        depositAmount={data.downPayment || '50,000'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 },
  errorText: { color: '#64748B', marginTop: 16 },
  backBtn: { marginTop: 20 },
  backBtnText: { color: IDENTITY_BLUE, fontFamily: "Alexandria-Bold" },
  menuCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
  },
  cancelledCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 16,
  },
  cancelledHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  warningIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelledTitle: {
    flex: 1,
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: '#EA2129',
    lineHeight: normalize.font(24),
  },
  cancelledDivider: {
    height: 1,
    backgroundColor: '#FEE2E2',
    marginVertical: 4,
    marginBottom: 12,
  },
  cancelledReason: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: '#1E293B',
    lineHeight: normalize.font(20),
  },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
  chaletSimpleRow: { alignItems: 'center', gap: 16 },
  simpleImageWrapper: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  simpleChaletImage: { width: '100%', height: '100%' },
  simpleChaletText: { flex: 1 },
  simpleChaletName: { fontSize: normalize.font(16), fontFamily: "Alexandria-Black", color: '#1E293B', lineHeight: normalize.font(22) },
  simpleChaletLocation: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: '#64748B', lineHeight: normalize.font(20), marginTop: 4 },
  infoSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    paddingBottom: 24,
  },
  sectionTitleRow: { width: '100%', marginBottom: 8 },
  sectionTitle: { fontSize: normalize.font(14), fontFamily: "Alexandria-Black", color: IDENTITY_BLUE, lineHeight: normalize.font(20) },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  infoRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-Bold", color: '#1E293B', lineHeight: normalize.font(20) },
  infoValue: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: '#64748B', lineHeight: normalize.font(22) },
  blueValue: { color: IDENTITY_BLUE, fontFamily: "Alexandria-Bold", lineHeight: normalize.font(22) },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: normalize.width(24),
    paddingTop: normalize.height(16),
    paddingBottom: normalize.height(30),
    backgroundColor: Colors.white,
    borderTopLeftRadius: normalize.radius(24),
    borderTopRightRadius: normalize.radius(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  payButton: {
    marginBottom: 12,

  },
  cancelButton: {
    width: '100%',
  },
});
