import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { logout } from '@/store/authSlice';
import { useLogoutUserMutation } from '@/store/api/customerApiSlice';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { SolarLogoutBold, SolarCloseBold } from '@/components/icons/solar-icons';
import { PrimaryButton } from './primary-button';

export const LogoutSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const dispatch = useDispatch();
  const router = useRouter();
  const [logoutApi, { isLoading }] = useLogoutUserMutation();

  const snapPoints = useMemo(() => ['30%'], []);

  const handleLogout = async () => {
    try {
      await logoutApi(undefined).unwrap();
    } catch (e) {
      // Even if server logout fails, clear local state
    }
    dispatch(logout());
    (ref as any).current?.dismiss();
    router.replace('/(auth)/login');
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: '#E5E7EB', width: 40 }}
      style={styles.sheet}
    >
      <View style={styles.container}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('profile.logout')}
          </Text>
          <TouchableOpacity 
            onPress={() => (ref as any).current?.dismiss()}
            style={styles.closeBtn}
          >
            <SolarCloseBold size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.message, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('profile.logoutConfirm')}
        </Text>

        <View style={styles.footer}>
          <PrimaryButton
            label={t('profile.exit')}
            onPress={handleLogout}
            isLoading={isLoading}
            style={styles.logoutBtn}
          />
          <TouchableOpacity 
            onPress={() => (ref as any).current?.dismiss()}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>{t('profile.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheet: {
    borderRadius: 24,
  },
  container: {
    flex: 1,
    padding: normalize.width(20),
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize.height(15),
  },
  title: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Black",
    color: '#1E293B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Regular",
    color: '#64748B',
    lineHeight: 22,
    marginBottom: normalize.height(25),
  },
  footer: {
    gap: 12,
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: '#64748B',
  },
});
