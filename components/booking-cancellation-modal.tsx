import React, { useState, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, normalize } from '@/constants/theme';
import { SolarDangerCircleBold } from '@/components/icons/solar-icons';
import { 
  BottomSheetModal, 
  BottomSheetView, 
  BottomSheetBackdrop,
  BottomSheetTextInput
} from '@gorhom/bottom-sheet';
import { SecondaryButton } from './user/secondary-button';
import { SecondaryButtonInverse } from './user/secondary-button-inverse';
import LottieView from 'lottie-react-native';

// Static imports for Lottie files
import successAnim from './icons/motions/secssuse.json';
import errorAnim from './icons/motions/faild.json';

interface BookingCancellationSheetProps {
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  isRTL?: boolean;
  depositAmount?: string | number;
  isExternal?: boolean;
}

export type BookingCancellationSheetRef = {
  present: () => void;
  dismiss: () => void;
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
};

export const BookingCancellationSheet = forwardRef<BookingCancellationSheetRef, BookingCancellationSheetProps>(
  ({ onConfirm, isLoading = false, isRTL = true, depositAmount = '50,000', isExternal = false }, ref) => {
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
        // Expand to nearly full screen for success feedback to cover other sheets
        bottomSheetModalRef.current?.snapToIndex(1);
        setTimeout(() => lottieRef.current?.play(), 100);
        setTimeout(() => bottomSheetModalRef.current?.dismiss(), 3000);
      },
      showError: (message) => {
        setInternalStatus('error');
        setFeedbackMessage(message || '');
        setTimeout(() => lottieRef.current?.play(), 100);
        // Don't auto-dismiss error so user can see what happened
      },
    }));

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
      <>
        <View style={styles.iconContainer}>
          <View style={styles.starburst}>
            <View style={[styles.starLayer, { transform: [{ rotate: '0deg' }] }]} />
            <View style={[styles.starLayer, { transform: [{ rotate: '15deg' }] }]} />
            <View style={[styles.starLayer, { transform: [{ rotate: '30deg' }] }]} />
            <View style={[styles.starLayer, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.starLayer, { transform: [{ rotate: '60deg' }] }]} />
            <View style={[styles.starLayer, { transform: [{ rotate: '75deg' }] }]} />
            <View style={styles.iconCircle}>
              <SolarDangerCircleBold size={32} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>
          {isExternal 
            ? (isRTL ? 'تأكيد إلغاء الإغلاق الخارجي' : 'Confirm External Cancellation')
            : (isRTL ? 'تأكيد إلغاء الحجز' : 'Confirm Cancellation')}
        </Text>
      </>
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
              style={styles.lottie}
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
                  ? `عند الإلغاء سيتم استرداد مبلغ العربون (${depositAmount} د.ع) تلقائياً لمحفظة الزبون`
                  : `Upon cancellation, the deposit amount (${depositAmount} IQD) will be automatically refunded to the customer's wallet.`
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

          <View style={[styles.buttonRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                label={isRTL ? 'تأكيد الالغاء' : 'Confirm'}
                onPress={handleConfirm}
                isActive={true}
                activeColor="#FF4D17"
                isLoading={isLoading}
              />
            </View>
            
            <View style={{ flex: 1 }}>
              <SecondaryButtonInverse
                label={isRTL ? 'تجاهل' : 'Ignore'}
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                inactiveTextColor="#1C1C1C"
                isActive={false}
              />
            </View>
          </View>
        </>
      );
    };

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={internalStatus !== 'idle' ? ['45%', '90%'] : (isExternal ? ['45%'] : ['65%'])}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={internalStatus === 'idle' || internalStatus === 'error'}
        keyboardBehavior="fillParent"
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 300,
  },
  iconContainer: {
    marginBottom: 20,
    marginTop: 0,
  },
  starburst: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starLayer: {
    position: 'absolute',
    width: 65,
    height: 65,
    backgroundColor: '#FF4D17',
    borderRadius: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4D17',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: normalize.font(18),
    fontFamily: "LamaSans-Black",
    color: '#FF4D17',
    marginBottom: 24,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Bold",
    color: '#1C1C1C',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    height: 120,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Regular",
    color: '#1C1C1C',
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: normalize.font(11),
    fontFamily: "LamaSans-Medium",
    color: '#64748B',
    marginTop: 12,
    lineHeight: 18,
  },
  buttonRow: {
    width: '100%',
    gap: 12,
  },
  // Feedback specific styles
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 40,
    flex: 1,
  },
  lottie: {
    width: 250,
    height: 250,
  },
  feedbackText: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Bold",
    color: '#1C1C1C',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
  },
  retryButtonText: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Bold",
    color: '#FF4D17',
  },
});
