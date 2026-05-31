import { SolarDangerTriangleBold } from '@/components/icons/solar-icons';
import { normalize } from '@/constants/theme';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SecondaryButton } from './user/secondary-button';

// Static imports for Lottie files
import errorAnim from './icons/motions/fail.json';
import successAnim from './icons/motions/success.json';

interface BookingCancellationSheetProps {
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  isRTL?: boolean;
  depositAmount?: string | number;
  totalPrice?: string | number;
  paymentModel?: 'full' | 'deposit';
  isExternal?: boolean;
}

export type BookingCancellationSheetRef = {
  present: (customerName?: string, customerPhone?: string) => void;
  dismiss: () => void;
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
};

export const BookingCancellationSheet = forwardRef<BookingCancellationSheetRef, BookingCancellationSheetProps>(
  ({ 
    onConfirm, 
    isLoading = false, 
    isRTL = true, 
    depositAmount = 0, 
    totalPrice = 0,
    paymentModel = 'deposit',
    isExternal = false 
  }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const lottieRef = useRef<LottieView>(null);
    const [reason, setReason] = useState('');
    const [internalStatus, setInternalStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [customerName, setCustomerName] = useState<string | undefined>();
    const [customerPhone, setCustomerPhone] = useState<string | undefined>();

    useImperativeHandle(ref, () => ({
      present: (name, phone) => {
        setInternalStatus('idle');
        setReason('');
        setCustomerName(name);
        setCustomerPhone(phone);
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
        // Don't auto-dismiss error so user can see what happened
      } }));

    const handleConfirm = () => {
      onConfirm(reason);
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    );

    const renderHeader = () => (
      <View style={{ alignItems: 'center' }}>
        <View style={styles.iconContainer}>
          <View style={styles.starburst}>
            <Svg 
              width="100" 
              height="100" 
              viewBox="0 0 60 60" 
              fill="none" 
              style={{ position: 'absolute' }}
            >
              <Path 
                d="M26.0603 60C29.9658 59.4325 29.8391 57.154 32.7123 55.3719C34.9225 54.1301 37.5529 56.9614 39.3811 57.3718C44.9058 58.6116 45.0155 53.8851 45.7481 50.2915C46.6896 46.8466 51.9145 48.769 54.0192 47.2906C58.6446 44.0383 54.2219 40.5348 54.091 37.1548C54.015 35.1591 59.4109 33.2953 59.8817 30.686C60.7641 25.7794 56.4955 25.9343 54.2493 22.9543C53.2593 21.2225 55.2331 18.2886 55.4822 16.8143C56.5335 10.6114 50.9476 11.4512 47.0992 11.0554C44.5891 10.7957 44.7707 5.60846 43.789 4.02109C42.7863 2.40231 41.7835 2.19288 40.0292 1.73217C37.2468 2.50491 35.7226 3.96454 33.0732 4.97811C29.9193 4.0148 28.8406 -0.579781 24.7388 0.0610315C21.5701 0.0359016 20.8671 5.11424 19.5751 6.16131C15.2897 9.63133 12.864 2.85464 8.01704 8.83346C7.91359 10.2303 8.34847 15.4992 7.88615 16.2991C6.25008 19.1388 -0.948651 18.253 0.10477 23.4151C0.647314 26.0705 2.92303 27.662 4.08201 30.02L4.18968 30.2441C3.20803 32.4388 0.824638 34.7235 0.389759 36.803C-0.691106 41.9798 5.48587 41.5358 7.9347 43.7054C9.67633 45.2467 7.4935 50.3062 9.13168 52.2118C11.3251 55.9604 16.8983 52.3584 18.8236 53.1061C22.3723 54.4819 20.7087 58.6535 26.0603 60Z" 
                fill="#F64200"
              />
            </Svg>
            <SolarDangerTriangleBold size={38} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>
          {isExternal
            ? (isRTL ? 'تأكيد إلغاء الحجز الخارجي' : 'Confirm External Booking Cancellation')
            : (isRTL 
                ? `تأكيد إلغاء حجز ${customerName || 'الزبون'}` 
                : `Confirm Cancellation for ${customerName || 'Customer'}`)}
        </Text>

        {customerPhone && (
          <Text style={styles.customerPhone}>
            {customerPhone}
          </Text>
        )}
      </View>
    );

    const renderContent = () => {
      if (internalStatus !== 'idle') {
        return (
          <View style={styles.feedbackContainer}>
            <LottieView
              ref={lottieRef}
              source={internalStatus === 'success' ? successAnim : errorAnim}
              autoPlay={false}
              loop={false}
              style={[styles.lottie, { height: 300 }]}
              resizeMode="contain"
            />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            {internalStatus === 'error' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setInternalStatus('idle')}
              >
                <Text style={styles.retryButtonText}>{isRTL ? 'محاولة مرة أخرى' : 'Try Again'}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      const isFullPayment = paymentModel === 'full';
      const refundAmount = isFullPayment ? totalPrice : depositAmount;
      const formattedAmount = Number(refundAmount || 0).toLocaleString();

      return (
        <>
          <View style={styles.inputWrapper}>
            {!isExternal && (
              <>
                <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'اذكر سبب الالغاء' : 'Mention Cancellation Reason'}
                </Text>
                <BottomSheetTextInput
                  style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  multiline
                  placeholder={isRTL ? 'اكتب السبب هنا...' : 'Write the reason here...'}
                  value={reason}
                  onChangeText={setReason}
                />
              </>
            )}
            {!isExternal && (
              <Text style={[styles.noteText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL
                  ? `عند الإلغاء سيتم استرداد ${isFullPayment ? 'كامل المبلغ' : 'مبلغ العربون'} (${formattedAmount} د.ع) تلقائياً لمحفظة الزبون`
                  : `Upon cancellation, the ${isFullPayment ? 'full amount' : 'deposit amount'} (${formattedAmount} IQD) will be automatically refunded to the customer's wallet.`
                }
              </Text>
            )}
            {isExternal && (
              <Text style={[styles.noteText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL
                  ? 'عند الإلغاء سيتم فتح هذا الموعد مرة أخرى في التطبيق للحجوزات العامة.'
                  : 'Upon cancellation, this slot will be opened again in the app for public bookings.'
                }
              </Text>
            )}
          </View>

          <View style={[styles.buttonRow, { flexDirection: 'row' }]}>
            <View style={{ flex: 1.2 }}>
              <SecondaryButton
                label={isRTL ? 'تأكيد الالغاء' : 'Confirm Cancellation'}
                onPress={handleConfirm}
                isActive={true}
                activeColor="#FF4D17"
                isLoading={isLoading}
                style={{ height: 56 }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <SecondaryButton
                label={isRTL ? 'تجاهل' : 'Ignore'}
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                inactiveTextColor="#1C1C1C"
                isActive={false}
                variant="outline"
                style={{ height: 56, borderColor: '#E2E8F0' }}
              />
            </View>
          </View>
        </>
      );
    };

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing={true}
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
  }
);

const styles = StyleSheet.create({
  modalContent: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    paddingBottom: 40 },
  iconContainer: {
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center' },
  starburst: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center' },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 0,
    position: 'absolute' },
  title: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#FF4D17',
    marginTop: 16,
    textAlign: 'center' },
  customerPhone: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center' },
  inputWrapper: {
    width: '100%',
    marginBottom: 32 },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#1C1C1C',
    marginBottom: 12 },
  textInput: {
    width: '100%',
    height: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#1C1C1C',
    textAlignVertical: 'top' },
  noteText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#64748B',
    marginTop: 16,
    lineHeight: 20 },
  buttonRow: {
    width: '100%',
    gap: 12 },
  // Feedback specific styles
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 40 },
  lottie: {
    width: '100%',
    height: 300 },
  feedbackText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#1C1C1C',
    textAlign: 'center',
    marginTop: 10 },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0' },
  retryButtonText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#FF4D17' } });
