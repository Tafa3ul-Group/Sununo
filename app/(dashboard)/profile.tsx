import { HeaderSection } from '@/components/header-section';
import {
    ProfileShape,
    SolarBanknoteBold,
    SolarBellBold,
    SolarCalendarBold,
    SolarChartBold,
    SolarGlobalBold,
    SolarHome2Bold,
    SolarLogoutBold,
    SolarPenBold,
    SolarPhoneBold,
    SolarShieldBold
} from "@/components/icons/solar-icons";
import { LanguageSheet } from '@/components/user/language-sheet';
import { Colors, normalize } from '@/constants/theme';
import { RootState } from '@/store';
import { useGetProviderProfileQuery } from '@/store/api/apiSlice';
import { logout } from '@/store/authSlice';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function ProviderProfileScreen() {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse;
  
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
    { id: 'business', title: isRTL ? 'معلومات العمل والمصرف' : 'Business Info', shape: 'blue' as const, icon: <SolarBanknoteBold size={20} color="white" />, route: '/(dashboard)/edit-business' },
    { id: 'bookings', title: isRTL ? 'الحجوزات' : 'Bookings', shape: 'red' as const, icon: <SolarCalendarBold size={20} color="white" />, route: '/(tabs)/(dashboard)/bookings' },
    { id: 'chalets', title: isRTL ? 'إدارة شاليهاتي' : 'Manage My Chalets', shape: 'green' as const, icon: <SolarHome2Bold size={20} color="white" />, route: '/(tabs)/(dashboard)/home' },
    { id: 'revenue', title: isRTL ? 'المالية والأرباح' : 'Revenue', shape: 'red' as const, icon: <SolarChartBold size={20} color="white" />, route: '/(tabs)/(dashboard)/revenue' },
    { id: 'notifications', title: isRTL ? 'الإشعارات' : 'Notifications', shape: 'pink' as const, icon: <SolarBellBold size={20} color="white" />, route: '/(tabs)/(dashboard)/notifications' },
    { id: 'language', title: isRTL ? 'اللغة' : 'Language', shape: 'blue' as const, icon: <SolarGlobalBold size={20} color="white" />, action: openLanguageSheet },
    { id: 'contact', title: isRTL ? 'تواصل معنا' : 'Contact Us', shape: 'green' as const, icon: <SolarPhoneBold size={20} color="white" /> },
    { id: 'privacy', title: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy', shape: 'blue' as const, icon: <SolarShieldBold size={20} color="white" /> },
    { id: 'logout', title: isRTL ? 'تسجيل الخروج' : 'Logout', shape: 'red' as const, icon: <SolarLogoutBold size={20} color="white" />, action: handleLogout },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}

      {/* Profile Header & User Card - Fixed at top */}
      <View style={styles.topSection}>
        <TouchableOpacity 
          style={[styles.userCard, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
          onPress={() => router.push('/(dashboard)/edit-business')}
          activeOpacity={0.9}
        >
          <ProfileShape size={normalize.width(48)} type="green">
            <SolarPenBold size={18} color="white" />
          </ProfileShape>
          
          <View style={[styles.userInfo, { textAlign: isRTL ? 'right' : 'left' }]}>
            <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>{profile?.business_name || user?.name || t('tabs.home')}</Text>
          </View>

          <View style={styles.avatarWrap}>
            {profile?.business_name ? (
               <View style={styles.avatarInitial}>
                  <Text style={styles.avatarInitialText}>{profile?.business_name?.charAt(0)}</Text>
               </View>
            ) : (
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} 
                style={styles.avatarImg} 
              />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content - Only menu items */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
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
  topSection: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(10),
  },
  scrollView: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    color: 'white',
    fontSize: normalize.font(24),
    fontFamily: "LamaSans-Black",
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
