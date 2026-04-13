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
      isRTL ? 'تسجيل الخروج' : 'Logout',
      isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRTL ? 'خروج' : 'Logout', 
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
    { id: 'bookings', title: isRTL ? 'الحجوزات' : 'Bookings', shape: 'blue' as const, icon: <SolarCalendarBold size={20} color="white" />, route: '/(tabs)/(customer)/bookings' },
    { id: 'reviews', title: isRTL ? 'المراجعات' : 'Reviews', shape: 'blue' as const, icon: <SolarHeartBold size={20} color="white" /> },
    { id: 'language', title: isRTL ? 'اللغة' : 'Language', shape: 'pink' as const, icon: <SolarGlobalBold size={20} color="white" />, action: openLanguageSheet },
    { id: 'contact', title: isRTL ? 'تواصل معنا' : 'Contact Us', shape: 'green' as const, icon: <SolarPhoneBold size={20} color="white" /> },
    { id: 'privacy', title: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy', shape: 'blue' as const, icon: <SolarShieldBold size={20} color="white" /> },
    { id: 'logout', title: isRTL ? 'تسجيل الخروج' : 'Logout', shape: 'red' as const, icon: <SolarLogoutBold size={20} color="white" />, action: handleLogout },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.headerTitle}>{isRTL ? 'الملف الشخصي' : 'Profile'}</Text>
        <View style={styles.logoCircle}>
          <Image 
            source={require('@/assets/arlogo.svg')} 
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.userCard}
          onPress={() => router.push('/profile-edit')}
          activeOpacity={0.9}
        >
          <ProfileShape size={normalize.width(48)} type="green">
            <SolarPenBold size={18} color="white" />
          </ProfileShape>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'انسي انس مؤنس'}</Text>
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
              style={styles.menuRow} 
              onPress={() => {
                if (item.action) {
                  item.action();
                } else if (item.route) {
                  router.push(item.route as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuLabelText}>{item.title}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize.width(20),
    paddingVertical: normalize.height(15),
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: '#1F2937',
  },
  logoCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: normalize.width(21),
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  logoImg: {
    width: '70%',
    height: '70%',
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
    marginRight: normalize.width(15),
  },
  userName: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: '#374151',
    textAlign: 'right',
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
    justifyContent: 'flex-end',
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
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: '#374151',
    marginRight: normalize.width(15),
    textAlign: 'right',
  },
});
