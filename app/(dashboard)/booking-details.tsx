import { BookingCancellationSheet, BookingCancellationSheetRef } from '@/components/booking-cancellation-modal';
import {
  SolarDangerCircleBold
} from '@/components/icons/solar-icons';
import { PrimaryButton } from '@/components/user/primary-button';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import { useDeleteExternalBookingMutation, useGetProviderBookingDetailsQuery, useMarkBookingCompletedMutation, useRejectBookingMutation, useApproveBookingMutation } from '@/store/api/apiSlice';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, I18nManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import Toast from 'react-native-toast-message';

const IDENTITY_BLUE = '#035DF9';
const SCREEN_WIDTH = Dimensions.get('window').width;

import { PaymentConfirmationSheet, PaymentConfirmationSheetRef } from '@/components/payment-confirmation-modal';

import { ErrorState } from '@/components/ui/error-state';
import { CountdownBadge } from '@/components/dashboard/countdown-badge';

export default function BookingDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useSelector((state: RootState) => state.auth);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language ? i18n.language.startsWith('ar') : false;

  // Robust layout bridge (same pattern as chalet-details)
  const flexRow = isRTL ? (I18nManager.isRTL ? 'row' : 'row-reverse') : (I18nManager.isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse';
  const flexStart = isRTL ? (I18nManager.isRTL ? 'flex-start' : 'flex-end') : (I18nManager.isRTL ? 'flex-end' : 'flex-start') as 'flex-start' | 'flex-end';
  const textStart = isRTL ? 'right' : 'left' as 'right' | 'left';
  const textEnd = isRTL ? 'left' : 'right' as 'left' | 'right';
  const cancelSheetRef = React.useRef<BookingCancellationSheetRef>(null);
  const confirmPaymentSheetRef = React.useRef<PaymentConfirmationSheetRef>(null);

  const [rejectBooking, { isLoading: isRejectLoading }] = useRejectBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();
  const [markAsPaid, { isLoading: isPaying }] = useMarkBookingCompletedMutation();
  const [approveBooking, { isLoading: isApproving }] = useApproveBookingMutation();
  const { showConfirm } = useConfirmationDialog();
  const [isSuccessNavigating, setIsSuccessNavigating] = React.useState(false);
  const [expandedImage, setExpandedImage] = React.useState<string | null>(null);

  const { data: bookingDetailsData, isLoading, error, refetch } = useGetProviderBookingDetailsQuery(id as string, { skip: !id });

  const data = bookingDetailsData?.data || bookingDetailsData;

  const handleApproveBooking = () => {
    showConfirm({
      title: isRTL ? 'تأكيد الحجز' : 'Confirm Booking',
      message: isRTL ? 'هل أنت متأكد من الموافقة وتأكيد هذا الطلب؟' : 'Are you sure you want to approve and confirm this booking?',
      type: 'info',
      confirmLabel: isRTL ? 'تأكيد' : 'Confirm',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await approveBooking(data.id).unwrap();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Toast.show({
            type: 'success',
            text1: isRTL ? 'تم تأكيد الطلب' : 'Request Confirmed',
            text2: isRTL ? 'تمت الموافقة وتأكيد الحجز بنجاح' : 'Booking has been successfully approved and confirmed',
            position: 'bottom'
          });
          refetch();
        } catch (e: any) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Toast.show({
            type: 'error',
            text1: isRTL ? 'فشل التأكيد' : 'Confirmation Failed',
            text2: e?.data?.message || (isRTL ? 'حدث خطأ أثناء محاولة تأكيد الطلب' : 'An error occurred while confirming'),
            position: 'bottom'
          });
        }
      }
    });
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={IDENTITY_BLUE} /></View>;

  if ((error || !data || !data.id) && !isSuccessNavigating) {
    const is404 = (error as any)?.status === 404;
    const errorMessage = (error as any)?.data?.message || (error as any)?.message;
    return (
      <ErrorState
        type={is404 ? 'error404' : 'failed'}
        message={errorMessage}
        onBack={() => router.back()}
        onRetry={() => refetch()}
      />
    );
  }

  const getLocalizedValue = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isRTL ? (val.ar || val.en || '') : (val.en || val.ar || '');
    }
    return String(val);
  };

  const bIsExternal = data.status === "external";
  const bChaletName = getLocalizedValue(data.chalet?.name);
  const bChaletAddress = getLocalizedValue(data.chalet?.address);
  const bCustomerName = bIsExternal
    ? data.externalCustomerName || (isRTL ? "حجز خارجي" : "External Booking")
    : data.customer?.name || t("common.user");
  const bShiftName = getLocalizedValue(data.shift?.name);
  const bChaletImage = data.chalet?.image || data.chalet?.images?.[0];
  const chaletImageId = typeof bChaletImage === 'string'
    ? bChaletImage
    : bChaletImage?.url || bChaletImage?.id || bChaletImage?.imageUrl;

  const chaletImageSource = getImageSrc(chaletImageId);

  // Customer ID card images
  const customerIdFront = data.customer?.idCardFrontImage;
  const customerIdBack = data.customer?.idCardBackImage;
  const hasIdCards = !bIsExternal && (customerIdFront || customerIdBack);
  console.log('[BookingDetails] customer ID cards:', { customerIdFront, customerIdBack, hasIdCards, tenantCategory: data.customer?.tenantCategory });

  const depositAmount = Number(data.depositAmount || 0);
  const remainingAmount = Number(data.remainingAmount || 0);
  const totalPrice = Number(data.totalPrice || 0);

  const handleConfirmCancellation = async (reason: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSuccessNavigating(true);
      if (bIsExternal) {
        await deleteExternalBooking(data.id).unwrap();
      } else {
        await rejectBooking({
          id: data.id,
          reason: reason || (isRTL ? 'إلغاء من قبل المشغل' : 'Cancelled by provider')
        }).unwrap();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      cancelSheetRef.current?.showSuccess(isRTL ? 'تم الإلغاء بنجاح.' : 'Cancelled successfully.');
      setTimeout(() => router.back(), 1500);
    } catch (e: any) {
      setIsSuccessNavigating(false);
      console.error('[BookingDetails] Cancellation error:', e);
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

  const renderInfoRow = (label: string, value: string | React.ReactNode, isBlue: boolean = false, subLabel?: string) => (
    <View style={[styles.infoRow, { flexDirection: flexRow, alignItems: 'center' }]}>
      <View style={{ flex: 1, alignItems: flexStart, paddingLeft: isRTL ? 16 : 0, paddingRight: isRTL ? 0 : 16 }}>
        <Text style={[styles.infoLabel, { textAlign: textStart }]}>{label}</Text>
        {subLabel && (
          <Text style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Alexandria-Regular', marginTop: 2, textAlign: textStart, writingDirection: isRTL ? 'rtl' : 'ltr' }}>
            {subLabel}
          </Text>
        )}
      </View>
      <View style={{ flex: 0, alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
        {typeof value === 'string' ? (
          <Text style={[styles.infoValue, isBlue && styles.blueValue, { textAlign: textEnd }]}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );

  const bIsCancelled = data.status === 'cancelled' || data.bookingStatus === 'CANCELLED';
  const bCancelReason = data.cancelReason || data.cancellationReason || (isRTL ? 'غير محدد' : 'Not specified');
  const bCustomerPhone = data.customer?.phone || data.externalCustomerPhone;

  // Accurate, status-driven banner for the owner.
  const getOwnerStatusInfo = () => {
    switch (data.status) {
      case 'pending_approval':
        return { text: isRTL ? 'بانتظار موافقتك' : 'Pending your approval', bg: '#FEF3C7', color: '#D97706' };
      case 'pending_payment':
        return { text: isRTL ? 'بانتظار دفع العميل' : 'Awaiting customer payment', bg: '#FFE4E6', color: '#E11D48' };
      case 'confirmed':
        return { text: isRTL ? 'مؤكد' : 'Confirmed', bg: '#DCFCE7', color: '#16A34A' };
      case 'completed':
        return { text: isRTL ? 'مكتمل' : 'Completed', bg: '#DBEAFE', color: '#2563EB' };
      case 'external':
        return { text: isRTL ? 'حجز خارجي' : 'External booking', bg: '#E2E8F0', color: '#475569' };
      default:
        return { text: isRTL ? 'ملغي' : 'Cancelled', bg: '#FEE2E2', color: '#DC2626' };
    }
  };
  const ownerStatus = getOwnerStatusInfo();

  return (
    <View style={[styles.container]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bIsCancelled
              ? normalize.height(24)
              : bIsExternal
                ? normalize.height(120)
                : remainingAmount > 0
                  ? normalize.height(180)
                  : normalize.height(120)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Cancelled Status Card */}
        {bIsCancelled && (
          <View style={styles.cancelledCard}>
            <View style={[styles.cancelledHeader, { flexDirection: flexRow }]}>
              <View style={styles.warningIconWrapper}>
                <SolarDangerCircleBold size={24} color="#EA2129" />
              </View>
              <Text style={[styles.cancelledTitle, { textAlign: textStart }]}>
                {isRTL ? 'تم إلغاء هذا الحجز بواسطتك' : 'This booking was cancelled by you'}
              </Text>
            </View>
            <View style={styles.cancelledDivider} />
            <Text style={[styles.cancelledReason, { textAlign: textStart }]}>
              {bCancelReason}
            </Text>
          </View>
        )}

        {/* Status banner (accurate current state) */}
        {!bIsCancelled && (
          <View style={[styles.statusBanner, { backgroundColor: ownerStatus.bg }]}>
            <Text style={[styles.statusBannerText, { color: ownerStatus.color, textAlign: 'center' }]}>
              {ownerStatus.text}
            </Text>
          </View>
        )}

        {/* Countdown Timer for Pending Approval */}
        {data.status === 'pending_approval' && (
          <CountdownBadge
            createdAt={data.createdAt}
            durationHours={data.chalet?.dailyHours || 1}
            isRTL={isRTL}
            variant="card"
          />
        )}

        {/* Chalet Information Section */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { alignItems: flexStart }]}>
            <Text style={[styles.sectionTitle, { textAlign: textStart }]}>{isRTL ? 'معلومات الشاليه' : 'Chalet Information'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={[styles.chaletSimpleRow, { flexDirection: flexRow }]}>
            <View style={styles.simpleImageWrapper}>
              <ExpoImage
                source={chaletImageSource}
                style={styles.simpleChaletImage}
              />
            </View>
            <View style={[styles.simpleChaletText, { alignItems: flexStart }]}>
              <Text style={[styles.simpleChaletName, { textAlign: textStart }]}>{bChaletName}</Text>
              <Text style={[styles.simpleChaletLocation, { textAlign: textStart }]}>{bChaletAddress}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { alignItems: flexStart }]}>
            <Text style={[styles.sectionTitle, { textAlign: textStart }]}>{isRTL ? 'معلومات الزبون' : 'Customer Information'}</Text>
          </View>
          <View style={styles.divider} />
          {renderInfoRow(isRTL ? 'الاسم' : 'Name', bCustomerName)}
          {renderInfoRow(isRTL ? 'رقم الهاتف' : 'Phone', <Text style={[styles.infoValue, { direction: 'ltr' }]}>{data.customer?.phone || data.externalCustomerPhone || '--'}</Text>)}
          {!bIsExternal && data.customer?.tenantCategory && renderInfoRow(
            isRTL ? 'الفئة' : 'Category',
            <View style={[
              styles.tenantCategoryBadge,
              { backgroundColor: data.customer.tenantCategory === 'family' ? '#EFF6FF' : '#F0FDF4' }
            ]}>
              <Text style={[
                styles.tenantCategoryText,
                { color: data.customer.tenantCategory === 'family' ? '#2563EB' : '#16A34A' }
              ]}>
                {data.customer.tenantCategory === 'family'
                  ? (isRTL ? 'عوائل' : 'Family')
                  : (isRTL ? 'شباب' : 'Youth')}
              </Text>
            </View>
          )}
          {data.notes && renderInfoRow(isRTL ? 'ملاحظات' : 'Notes', data.notes)}
        </View>

        {/* Customer ID Card Images */}
        {hasIdCards && (
          <View style={styles.infoSectionCard}>
            <View style={[styles.sectionTitleRow, { alignItems: flexStart }]}>
              <Text style={[styles.sectionTitle, { textAlign: textStart }]}>{isRTL ? 'صور الهوية' : 'ID Card Images'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.idCardsRow}>
              {customerIdFront && (
                <TouchableOpacity
                  style={styles.idCardWrapper}
                  activeOpacity={0.85}
                  onPress={() => {
                    const src = getImageSrc(customerIdFront);
                    setExpandedImage(typeof src === 'object' ? src.uri : null);
                  }}
                >
                  <ExpoImage
                    source={getImageSrc(customerIdFront)}
                    style={styles.idCardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <Text style={styles.idCardLabel}>{isRTL ? 'الوجه الأمامي' : 'Front'}</Text>
                </TouchableOpacity>
              )}
              {customerIdBack && (
                <TouchableOpacity
                  style={styles.idCardWrapper}
                  activeOpacity={0.85}
                  onPress={() => {
                    const src = getImageSrc(customerIdBack);
                    setExpandedImage(typeof src === 'object' ? src.uri : null);
                  }}
                >
                  <ExpoImage
                    source={getImageSrc(customerIdBack)}
                    style={styles.idCardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <Text style={styles.idCardLabel}>{isRTL ? 'الوجه الخلفي' : 'Back'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Booking Information */}
        <View style={styles.infoSectionCard}>
          <View style={[styles.sectionTitleRow, { alignItems: flexStart }]}>
            <Text style={[styles.sectionTitle, { textAlign: textStart }]}>{isRTL ? 'معلومات الحجز' : 'Booking Information'}</Text>
          </View>
          <View style={styles.divider} />
          {renderInfoRow(isRTL ? "التاريخ" : "Date", data.bookingDate)}
          {renderInfoRow(isRTL ? "الفترة" : "Period", bShiftName)}
          {renderInfoRow(
            isRTL ? "عدد الأشخاص" : "Guests",
            `${data.guestsCount || 0} ${isRTL ? "شخص" : "persons"}`,
          )}
          {data.guestsCount > (data.chalet?.priceCapacity || data.chalet?.capacity || 0) && (
            renderInfoRow(
              isRTL ? "الأشخاص الإضافيين (فوق السعة)" : "Extra Guests (Above Capacity)",
              `${data.guestsCount - (data.chalet?.priceCapacity || data.chalet?.capacity || 0)} ${isRTL ? "شخص" : "persons"}`,
            )
          )}
        </View>

        {/* Payment Information */}
        {!bIsExternal && (
          <View style={styles.infoSectionCard}>
            <View style={[styles.sectionTitleRow, { alignItems: flexStart }]}>
              <Text style={[styles.sectionTitle, { textAlign: textStart }]}>{isRTL ? 'معلومات الدفع' : 'Payment Information'}</Text>
            </View>
            <View style={styles.divider} />
            {renderInfoRow(
              isRTL ? "المبلغ الأساسي" : "Base Price",
              `${Number(data.basePrice || 0).toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
            )}
            {Number(data.extraGuestsPrice) > 0 && renderInfoRow(
              isRTL ? "مبلغ الزيادة" : "Extra Charge",
              <Text style={[styles.infoValue, { color: '#F59E0B', fontFamily: 'Alexandria-SemiBold' }]}>
                {`+${Number(data.extraGuestsPrice).toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`}
              </Text>,
              false,
              isRTL 
                ? `(سعة إضافية - ${Number(data.chalet?.extraPersonPrice || 0).toLocaleString()} د.ع للفرد)` 
                : `(Capacity - ${Number(data.chalet?.extraPersonPrice || 0).toLocaleString()} IQD/person)`
            )}
            {renderInfoRow(
              isRTL ? "المبلغ النهائي" : "Final Price",
              `${totalPrice.toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
            )}
            {data.status !== 'pending_approval' && renderInfoRow(
              isRTL ? "المبلغ المدفوع (العربون)" : "Paid (Deposit)",
              `${depositAmount.toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
            )}
            {data.status !== 'pending_approval' && renderInfoRow(
              isRTL ? "المبلغ المتبقي" : "Remaining Amount",
              `${remainingAmount.toLocaleString()} ${isRTL ? "د.ع" : "IQD"}`,
              true,
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions Footer — strictly driven by the booking status */}
      {!bIsCancelled && data.status !== 'completed' && (
        <View style={styles.bottomActions}>
          {bIsExternal ? (
            /* Owner-created external block → can only be removed */
            <PrimaryButton
              label={isRTL ? 'إلغاء الحجز' : 'Cancel Booking'}
              onPress={() => cancelSheetRef.current?.present(bCustomerName, bCustomerPhone)}
              activeColor="#EA2129"
              isActive={true}
              height={50}
              style={styles.cancelButton}
            />
          ) : data.status === 'pending_approval' ? (
            /* Request awaiting owner decision → approve or reject */
            <>
              <PrimaryButton
                label={isRTL ? 'تأكيد الطلب' : 'Confirm Request'}
                onPress={handleApproveBooking}
                loading={isApproving}
                height={60}
                style={styles.payButton}
              />
              <PrimaryButton
                label={isRTL ? 'رفض الطلب' : 'Reject Request'}
                onPress={() => cancelSheetRef.current?.present(bCustomerName, bCustomerPhone)}
                activeColor="#EA2129"
                isActive={true}
                height={50}
                style={styles.cancelButton}
              />
            </>
          ) : data.status === 'pending_payment' ? (
            /* Approved, waiting for the customer to pay → owner cannot complete yet.
               If the customer never pays, the booking is auto-cancelled by the cron. */
            <PrimaryButton
              label={isRTL ? 'بانتظار دفع العميل' : 'Awaiting customer payment'}
              onPress={() => { }}
              height={60}
              style={styles.payButton}
              disabled={true}
            />
          ) : remainingAmount > 0 ? (
            /* Confirmed deposit booking → owner collects the remaining cash & completes */
            <PrimaryButton
              label={isRTL ? 'تسديد المبلغ المتبقي وإنهاء الحجز' : 'Collect Remaining & Complete'}
              onPress={() => {
                confirmPaymentSheetRef.current?.present();
              }}
              height={60}
              style={styles.payButton}
            />
          ) : (
            /* Confirmed & fully paid → completion happens automatically after the stay */
            <PrimaryButton
              label={isRTL ? 'تم سداد المبلغ بالكامل' : 'Full amount paid'}
              onPress={() => { }}
              activeColor="#22C55E"
              height={60}
              style={styles.payButton}
              disabled={true}
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
        depositAmount={data.depositAmount || 0}
        totalPrice={data.totalPrice || 0}
        paymentModel={data.paymentModel || 'deposit'}
      />

      {/* Expanded Image Modal */}
      {expandedImage && (
        <TouchableOpacity
          style={styles.expandedOverlay}
          activeOpacity={1}
          onPress={() => setExpandedImage(null)}
        >
          <View style={styles.expandedContainer}>
            <ExpoImage
              source={{ uri: expandedImage }}
              style={styles.expandedImage}
              contentFit="contain"
              transition={200}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setExpandedImage(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 },
  errorText: { color: '#64748B', marginTop: 16 },
  backBtn: { marginTop: 20 },
  backBtnText: { color: IDENTITY_BLUE, fontFamily: "Alexandria-SemiBold" },
  menuCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FB"
  },
  cancelledCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 16
  },
  cancelledHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  warningIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelledTitle: {
    flex: 1,
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-SemiBold",
    color: '#EA2129',
    lineHeight: normalize.font(24)
  },
  cancelledDivider: {
    height: 1,
    backgroundColor: '#FEE2E2',
    marginVertical: 4,
    marginBottom: 12
  },
  cancelledReason: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: '#1E293B',
    lineHeight: normalize.font(20)
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  statusBanner: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerText: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-SemiBold',
    lineHeight: normalize.font(20),
  },
  // Tenant Category Badge
  tenantCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tenantCategoryText: {
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-SemiBold',
    lineHeight: normalize.font(18),
  },
  // ID Card Images
  idCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  idCardWrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idCardImage: {
    width: '100%',
    height: normalize.height(120),
  },
  idCardLabel: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Medium',
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 6,
  },
  // Expanded Image Modal
  expandedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  expandedContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImage: {
    width: SCREEN_WIDTH - 20,
    height: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: normalize.height(60),
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Alexandria-SemiBold',
  },
  chaletSimpleRow: { alignItems: 'center', gap: 16 },
  simpleImageWrapper: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  simpleChaletImage: { width: '100%', height: '100%' },
  simpleChaletText: { flex: 1 },
  simpleChaletName: { fontSize: normalize.font(16), fontFamily: "Alexandria-SemiBold", color: '#1E293B', lineHeight: normalize.font(22) },
  simpleChaletLocation: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: '#64748B', lineHeight: normalize.font(20), marginTop: 4 },
  infoSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    paddingBottom: 24
  },
  sectionTitleRow: { width: '100%', marginBottom: 8 },
  sectionTitle: { fontSize: normalize.font(14), fontFamily: "Alexandria-SemiBold", color: IDENTITY_BLUE, lineHeight: normalize.font(20) },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  infoRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-SemiBold", color: '#1E293B', lineHeight: normalize.font(20) },
  infoValueContainer: { flex: 1 },
  infoValue: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: '#64748B', lineHeight: normalize.font(22) },
  blueValue: { color: IDENTITY_BLUE, fontFamily: "Alexandria-SemiBold", lineHeight: normalize.font(22) },
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
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  payButton: {
    marginBottom: 12
  },
  cancelButton: {
    width: '100%'
  }
});
