import { SolarDangerTriangleBold } from '@/components/icons/solar-icons';
import { normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SecondaryButton } from './secondary-button';

import errorAnim from '../icons/motions/fail.json';
import successAnim from '../icons/motions/success.json';

/**
 * What `GET /customer/bookings/:id/cancellation-preview` returns. The customer
 * only ever sees `penaltyAmount` and `customerRefund` — `commissionOnPenalty`
 * and `providerPenaltyShare` are how the penalty is split between the platform
 * and the owner, which is none of the customer's business.
 */
export type CancellationPreview = {
  totalPrice: number;
  daysUntilBooking: number;
  applicableTier: { daysBeforeBooking: number; penaltyPercentage: number } | null;
  penaltyAmount: number;
  customerRefund: number;
};

interface CustomerCancellationSheetProps {
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  /** Null while the preview request is in flight. */
  preview?: CancellationPreview | null;
  isPreviewLoading?: boolean;
  /** Set when the preview request failed, so the sheet can offer a retry. */
  previewError?: string | null;
  onRetryPreview?: () => void;
  /** What the customer actually paid — the ceiling on any refund. */
  amountPaid?: number;
}

export type CustomerCancellationSheetRef = {
  present: () => void;
  dismiss: () => void;
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
};

export const CustomerCancellationSheet = forwardRef<
  CustomerCancellationSheetRef,
  CustomerCancellationSheetProps
>(
  (
    {
      onConfirm,
      isLoading = false,
      preview,
      isPreviewLoading = false,
      previewError = null,
      onRetryPreview,
      amountPaid = 0,
    },
    ref,
  ) => {
    const { isRTL, textAlign, inputTextAlign, rowDirection } = useDirection();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const lottieRef = useRef<LottieView>(null);
    const [reason, setReason] = useState('');
    const [internalStatus, setInternalStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState('');

    useImperativeHandle(ref, () => ({
      present: () => {
        setInternalStatus('idle');
        setReason('');
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
      showSuccess: (message) => {
        setInternalStatus('success');
        setFeedbackMessage(message || '');
        setTimeout(() => lottieRef.current?.play(), 100);
        setTimeout(() => bottomSheetModalRef.current?.dismiss(), 3000);
      },
      showError: (message) => {
        setInternalStatus('error');
        setFeedbackMessage(message || '');
        setTimeout(() => lottieRef.current?.play(), 100);
      },
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    const money = (value: number) =>
      `${Number(value || 0).toLocaleString()} ${isRTL ? 'د.ع' : 'IQD'}`;

    const renderHeader = () => (
      <View style={{ alignItems: 'center' }}>
        <View style={styles.iconContainer}>
          <View style={styles.starburst}>
            <Svg width="100" height="100" viewBox="0 0 60 60" fill="none" style={{ position: 'absolute' }}>
              <Path
                d="M26.0603 60C29.9658 59.4325 29.8391 57.154 32.7123 55.3719C34.9225 54.1301 37.5529 56.9614 39.3811 57.3718C44.9058 58.6116 45.0155 53.8851 45.7481 50.2915C46.6896 46.8466 51.9145 48.769 54.0192 47.2906C58.6446 44.0383 54.2219 40.5348 54.091 37.1548C54.015 35.1591 59.4109 33.2953 59.8817 30.686C60.7641 25.7794 56.4955 25.9343 54.2493 22.9543C53.2593 21.2225 55.2331 18.2886 55.4822 16.8143C56.5335 10.6114 50.9476 11.4512 47.0992 11.0554C44.5891 10.7957 44.7707 5.60846 43.789 4.02109C42.7863 2.40231 41.7835 2.19288 40.0292 1.73217C37.2468 2.50491 35.7226 3.96454 33.0732 4.97811C29.9193 4.0148 28.8406 -0.579781 24.7388 0.0610315C21.5701 0.0359016 20.8671 5.11424 19.5751 6.16131C15.2897 9.63133 12.864 2.85464 8.01704 8.83346C7.91359 10.2303 8.34847 15.4992 7.88615 16.2991C6.25008 19.1388 -0.948651 18.253 0.10477 23.4151C0.647314 26.0705 2.92303 27.662 4.08201 30.02L4.18968 30.2441C3.20803 32.4388 0.824638 34.7235 0.389759 36.803C-0.691106 41.9798 5.48587 41.5358 7.9347 43.7054C9.67633 45.2467 7.4935 50.3062 9.13168 52.2118C11.3251 55.9604 16.8983 52.3584 18.8236 53.1061C22.3723 54.4819 20.7087 58.6535 26.0603 60Z"
                fill="#F64200"
              />
            </Svg>
            <SolarDangerTriangleBold size={38} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>{isRTL ? 'إلغاء الحجز' : 'Cancel Booking'}</Text>
      </View>
    );

    /**
     * The refund breakdown. This is the whole reason the customer sees a sheet
     * instead of a yes/no alert: the penalty is tiered by how close the booking
     * is, and defaults to the FULL amount when the chalet published no policy —
     * so "cancel" can mean getting everything back or nothing back, and the
     * customer has to be told which before they confirm.
     */
    const renderBreakdown = () => {
      if (isPreviewLoading) {
        return (
          <View style={styles.breakdownLoading}>
            <ActivityIndicator color="#FF4D17" />
            <Text style={styles.breakdownLoadingText}>
              {isRTL ? 'جارٍ حساب المبلغ المسترد...' : 'Calculating your refund...'}
            </Text>
          </View>
        );
      }

      if (previewError) {
        return (
          <View style={styles.breakdownError}>
            <Text style={[styles.breakdownErrorText, { textAlign }]}>
              {isRTL
                ? 'تعذّر حساب المبلغ المسترد. لا تؤكد الإلغاء قبل معرفة المبلغ.'
                : 'Could not calculate your refund. Do not confirm before you know the amount.'}
            </Text>
            {onRetryPreview && (
              <TouchableOpacity style={styles.retryButton} onPress={onRetryPreview}>
                <Text style={styles.retryButtonText}>
                  {isRTL ? 'إعادة المحاولة' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      if (!preview) return null;

      const refund = Number(preview.customerRefund || 0);
      const penalty = Number(preview.penaltyAmount || 0);
      const paid = Number(amountPaid || 0) || refund + penalty;
      const penaltyPercentage = preview.applicableTier?.penaltyPercentage ?? 100;

      return (
        <View style={styles.breakdownCard}>
          <View style={[styles.breakdownRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.breakdownLabel, { textAlign }]}>
              {isRTL ? 'المبلغ المدفوع' : 'Amount paid'}
            </Text>
            <Text style={styles.breakdownValue}>{money(paid)}</Text>
          </View>

          {penalty > 0 && (
            <View style={[styles.breakdownRow, { flexDirection: rowDirection }]}>
              <Text style={[styles.breakdownLabel, { textAlign }]}>
                {isRTL
                  ? `رسوم الإلغاء (${penaltyPercentage}%)`
                  : `Cancellation fee (${penaltyPercentage}%)`}
              </Text>
              <Text style={[styles.breakdownValue, styles.breakdownValuePenalty]}>
                −{money(penalty)}
              </Text>
            </View>
          )}

          <View style={styles.breakdownDivider} />

          <View style={[styles.breakdownRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.breakdownLabel, styles.breakdownLabelTotal, { textAlign }]}>
              {isRTL ? 'يُسترد إلى محفظتك' : 'Refunded to your wallet'}
            </Text>
            <Text
              style={[
                styles.breakdownValue,
                refund > 0 ? styles.breakdownValueRefund : styles.breakdownValuePenalty,
              ]}
            >
              {money(refund)}
            </Text>
          </View>

          {refund <= 0 && (
            <Text style={[styles.breakdownNote, { textAlign }]}>
              {isRTL
                ? 'لن يُسترد أي مبلغ عند الإلغاء في هذا الوقت.'
                : 'Cancelling at this point refunds nothing.'}
            </Text>
          )}
        </View>
      );
    };

    const renderContent = () => {
      if (internalStatus !== 'idle') {
        return (
          <View style={styles.feedbackContainer}>
            <LottieView
              ref={lottieRef}
              source={internalStatus === 'success' ? successAnim : errorAnim}
              autoPlay={false}
              loop={false}
              style={styles.lottie}
              resizeMode="contain"
            />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            {internalStatus === 'error' && (
              <TouchableOpacity style={styles.retryButton} onPress={() => setInternalStatus('idle')}>
                <Text style={styles.retryButtonText}>{isRTL ? 'محاولة مرة أخرى' : 'Try Again'}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      return (
        <>
          {renderBreakdown()}

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { textAlign }]}>
              {isRTL ? 'سبب الإلغاء (اختياري)' : 'Reason for cancelling (optional)'}
            </Text>
            <BottomSheetTextInput
              style={[styles.textInput, { textAlign: inputTextAlign }]}
              multiline
              placeholder={isRTL ? 'اكتب السبب هنا...' : 'Write the reason here...'}
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                label={isRTL ? 'تراجع' : 'Keep booking'}
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                inactiveTextColor="#1C1C1C"
                isActive={false}
                variant="outline"
                style={{ height: 56, borderColor: '#E2E8F0' }}
              />
            </View>

            <View style={{ flex: 1.2 }}>
              <SecondaryButton
                label={isRTL ? 'تأكيد الإلغاء' : 'Confirm cancellation'}
                onPress={() => onConfirm(reason)}
                isActive
                // Muted until the refund is known — confirming before then would
                // be the customer agreeing to an amount neither side has.
                activeColor={preview ? '#FF4D17' : '#FCA5A5'}
                isLoading={isLoading || isPreviewLoading}
                style={{ height: 56 }}
              />
            </View>
          </View>
        </>
      );
    };

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        enablePanDownToClose={internalStatus === 'idle' || internalStatus === 'error'}
        keyboardBehavior="fillParent"
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
      >
        <BottomSheetView style={styles.modalContent}>
          {internalStatus === 'idle' && renderHeader()}
          {renderContent()}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

CustomerCancellationSheet.displayName = 'CustomerCancellationSheet';

const styles = StyleSheet.create({
  modalContent: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starburst: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: normalize.font(14),
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    color: '#FF4D17',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  breakdownCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  breakdownRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: normalize.font(12),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#64748B',
  },
  breakdownLabelTotal: {
    color: '#1C1C1C',
    fontFamily: 'IBMPlexSansArabic-SemiBold',
  },
  breakdownValue: {
    fontSize: normalize.font(12),
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    color: '#1C1C1C',
  },
  breakdownValuePenalty: {
    color: '#DC2626',
  },
  breakdownValueRefund: {
    color: '#16A34A',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  breakdownNote: {
    fontSize: normalize.font(11),
    fontFamily: 'IBMPlexSansArabic-Regular',
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  breakdownLoading: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
    marginBottom: 8,
  },
  breakdownLoadingText: {
    fontSize: normalize.font(12),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#64748B',
  },
  breakdownError: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  breakdownErrorText: {
    width: '100%',
    fontSize: normalize.font(12),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#B91C1C',
    lineHeight: 20,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: normalize.font(13),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#1C1C1C',
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    fontSize: normalize.font(13),
    fontFamily: 'IBMPlexSansArabic-Regular',
    color: '#1C1C1C',
    textAlignVertical: 'top',
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 40,
  },
  lottie: {
    width: '100%',
    height: 300,
  },
  feedbackText: {
    fontSize: normalize.font(14),
    fontFamily: 'IBMPlexSansArabic-Medium',
    color: '#1C1C1C',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retryButtonText: {
    fontSize: normalize.font(13),
    fontFamily: 'IBMPlexSansArabic-SemiBold',
    color: '#FF4D17',
  },
});
