import { Colors, normalize } from '@/constants/theme';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SecondaryButton } from './user/secondary-button';
import { SecondaryButtonInverse } from './user/secondary-button-inverse';

// Static imports for Lottie files
import errorAnim from './icons/motions/fail.json';
import successAnim from './icons/motions/success.json';

interface PaymentConfirmationSheetProps {
  onConfirm: () => void;
  isLoading?: boolean;
  isRTL?: boolean;
  amount?: string | number;
}

export type PaymentConfirmationSheetRef = {
  present: () => void;
  dismiss: () => void;
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
};

const IDENTITY_BLUE = '#035DF9';

export const PaymentConfirmationSheet = forwardRef<PaymentConfirmationSheetRef, PaymentConfirmationSheetProps>(
  ({ onConfirm, isLoading = false, isRTL = true, amount }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const lottieRef = useRef<LottieView>(null);
    const [internalStatus, setInternalStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState('');

    useImperativeHandle(ref, () => ({
      present: () => {
        setInternalStatus('idle');
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
      showSuccess: (message) => {
        setInternalStatus('success');
        setFeedbackMessage(message || '');
        bottomSheetModalRef.current?.snapToIndex(1);
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
      []
    );

    const renderHeader = () => (
      <View style={styles.headerWrapper}>
        <Text style={styles.title}>
          {isRTL ? 'هل استلمت المبلغ المتبقي نقداً؟' : 'Did you receive the remaining amount in cash?'}
        </Text>
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
              style={[styles.lottie, { height: 200 }]}
              resizeMode="contain"
            />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        );
      }

      return (
        <View style={styles.contentWrapper}>
          <View style={[styles.buttonRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1.8 }}>
              <SecondaryButton
                label={isRTL ? 'تأكيد' : 'Confirm'}
                onPress={onConfirm}
                activeColor={IDENTITY_BLUE}
                isActive={true}
                isLoading={isLoading}
                style={{ flex: 1 }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <SecondaryButtonInverse
                label={isRTL ? 'إلغاء' : 'Cancel'}
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                isActive={false}
                inactiveTextColor="#1E293B"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      );
    };

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={internalStatus !== 'idle' ? ['45%', '90%'] : ['32%']}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={internalStatus === 'idle' || internalStatus === 'error'}
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    minHeight: 180,
  },
  headerWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: normalize.font(20),
    fontFamily: "LamaSans-Black",
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: normalize.font(28),
  },
  contentWrapper: {
    width: '100%',
  },
  buttonRow: {
    width: '100%',
    gap: 16,
    alignItems: 'stretch',
  },
  feedbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  lottie: {
    width: '100%',
  },
  feedbackText: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Bold",
    color: '#1C1C1C',
    textAlign: 'center',
    marginTop: 10,
  },
});
