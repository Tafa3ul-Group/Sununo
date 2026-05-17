import { SolarCloseBold } from '@/components/icons/solar-icons';
import { normalize } from '@/constants/theme';
import { useLogoutUserMutation } from '@/store/api/customerApiSlice';
import { logout } from '@/store/authSlice';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { PrimaryButton } from './primary-button';
import { isRTL } from "@/i18n";

export const LogoutSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
  const router = useRouter();
  const [logoutApi, { isLoading }] = useLogoutUserMutation();

  const snapPoints = useMemo(() => ['30%'], []);

  const handleLogout = async () => {
    // Dismiss the sheet first to avoid navigation conflicts
    (ref as any).current?.dismiss();

    try {
      await logoutApi(undefined).unwrap();
    } catch (e) {
      // Even if server logout fails, clear local state
    }

    // Clear Redux state — the Auth Guard in _layout.tsx will redirect to "/" automatically
    dispatch(logout());
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
        <View style={[styles.header, { flexDirection: 'row' }]}>
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
            loading={isLoading}
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
    borderRadius: 24 },
  container: {
    flex: 1,
    padding: normalize.width(20) },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize.height(15) },
  title: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Medium",
    color: '#1E293B' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center' },
  message: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#64748B',
    lineHeight: 22,
    marginBottom: normalize.height(25) },
  footer: {
    gap: 12 },
  logoutBtn: {
    backgroundColor: '#EF4444' },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center' },
  cancelText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#64748B' } });
