import { Colors, normalize, Spacing, Typography } from '@/constants/theme';
import { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import {
  SolarWalletBold,
  SolarCalendarBold,
  SolarHeartBold,
  SolarGlobalBold,
  SolarPhoneBold,
  SolarShieldBold,
  SolarLogoutBold,
  SolarPenBold,
  ProfileShape
} from '@/components/icons/solar-icons';
import { CircleBackButton } from '@/components/ui/circle-back-button';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LanguageSheet } from '@/components/user/language-sheet';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { WalletCard } from '@/components/user/wallet-card';
import { HeaderSection } from '@/components/header-section';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const languageSheetRef = React.useRef<BottomSheetModal>(null);

  const openLanguageSheet = () => {
    languageSheetRef.current?.present();
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { 
          text: t('profile.exit'), 
          style: 'destructive', 
          onPress: () => {
            dispatch(logout());
            router.replace('/(auth)/choose-type');
          }
        }
      ]
    );
  };

  const menuItems = [
    { id: 'bookings', title: t('headers.bookings'), shape: 'blue' as const, icon: <SolarCalendarBold size={20} color="white" />, route: '/(tabs)/(customer)/bookings' },
    { id: 'reviews', title: t('headers.reviews'), shape: 'blue' as const, icon: <SolarHeartBold size={20} color="white" /> },
    { id: 'language', title: t('profile.language'), shape: 'pink' as const, icon: <SolarGlobalBold size={20} color="white" />, action: openLanguageSheet },
    { id: 'contact', title: t('profile.contactUs'), shape: 'green' as const, icon: <SolarPhoneBold size={20} color="white" /> },
    { id: 'privacy', title: t('profile.privacyPolicy'), shape: 'blue' as const, icon: <SolarShieldBold size={20} color="white" /> },
    { id: 'logout', title: t('profile.logout'), shape: 'red' as const, icon: <SolarLogoutBold size={20} color="white" />, action: handleLogout },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection 
        title={t('headers.profile')}
        showBackButton 
        showLogo 
        userType={userType}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.userCard, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
          onPress={() => router.push('/profile-edit')}
          activeOpacity={0.9}
        >
          <ProfileShape size={normalize.width(48)} type="green">
            <SolarPenBold size={18} color="white" />
          </ProfileShape>
          
          <View style={[styles.userInfo, { textAlign: isRTL ? 'right' : 'left' }]}>
            <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>
              {user?.name || (isRTL ? 'انسي انس مؤنس' : 'Ansi Ans Mounis')}
            </Text>
          </View>

          <View style={styles.avatarWrap}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
              style={styles.avatarImg} 
            />
          </View>
        </TouchableOpacity>

        {/* Wallet Card */}
        <WalletCard 
          balance="100,000" 
          onWithdraw={() => {
            router.push('/(tabs)/(dashboard)/transactions');
          }}
        />

        {/* Action Menu Items */}
        <View style={styles.menuGroup}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]} 
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  router.push(item.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuLabelText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text>
              <ProfileShape size={normalize.width(42)} type={item.shape}>
                {item.icon}
              </ProfileShape>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: normalize.height(100) }} />
      </ScrollView>

      <LanguageSheet ref={languageSheetRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(10),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(24),
    padding: normalize.width(18),
    marginBottom: normalize.height(20),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  userInfo: {
    flex: 1,
    marginHorizontal: normalize.width(15),
  },
  userName: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Black",
    color: '#374151',
  },
  avatarWrap: {
    width: normalize.width(60),
    height: normalize.width(60),
    borderRadius: normalize.width(30),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  menuGroup: {
    gap: normalize.height(16),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(18),
    paddingVertical: normalize.height(14),
    paddingHorizontal: normalize.width(18),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  menuLabelText: {
    flex: 1,
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Bold",
    color: '#374151',
    marginHorizontal: normalize.width(15),
  },
});
