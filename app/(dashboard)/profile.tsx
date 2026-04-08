import { 
  SolarLogoutBold, 
  SolarBanknoteBold, 
  SolarHome2Bold, 
  SolarChartBold, 
  SolarBellBold, 
  SolarAltArrowLeftLinear, 
  SolarAltArrowRightLinear 
} from "@/components/icons/solar-icons";
import { Colors, Spacing, Typography, normalize } from '@/constants/theme';
import { RootState } from '@/store';
import { logout } from '@/store/authSlice';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { HeaderSection } from '@/components/header-section';
import { useTranslation } from 'react-i18next';
import { useGetProviderProfileQuery } from '@/store/api/apiSlice';

export default function ProviderProfileScreen() {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse;
  
  const router = useRouter();

  const handleLogout = () => {
    console.log('Logging out owner...');
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

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection
        userType={userType}
        title={isRTL ? 'الملف الشخصي' : 'Owner Profile'}
        showSearch={false}
        showCategories={false}
        showBackButton={true}
      />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.business_name?.charAt(0) || user?.name?.charAt(0) || 'O'}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{profile?.business_name || user?.name || t('tabs.home')}</Text>
          <Text style={styles.userEmail}>{user?.phone || user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{isRTL ? 'مالك معتمد' : 'Verified Owner'}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuLabel}>{isRTL ? 'الإعدادات' : 'Settings'}</Text>

          {/* معلومات العمل والمصرف */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(dashboard)/edit-business')}
          >
            <SolarBanknoteBold size={20} color={Colors.text.muted} />
            <View style={[styles.menuItemContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
              <Text style={styles.menuItemTitle}>
                {isRTL ? 'معلومات العمل والمصرف' : 'Business & Bank Info'}
              </Text>
              {isRTL ? (
                <SolarAltArrowLeftLinear size={22} color={Colors.primary} />
              ) : (
                <SolarAltArrowRightLinear size={22} color={Colors.primary} />
              )}
            </View>
          </TouchableOpacity>

          {/* شاليهاتي */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/(dashboard)/home')}
          >
            <SolarHome2Bold size={20} color={Colors.text.muted} />
            <View style={[styles.menuItemContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
              <Text style={styles.menuItemTitle}>{isRTL ? 'إدارة شاليهاتي' : 'Manage My Chalets'}</Text>
              {isRTL ? (
                <SolarAltArrowLeftLinear size={22} color={Colors.primary} />
              ) : (
                <SolarAltArrowRightLinear size={22} color={Colors.primary} />
              )}
            </View>
          </TouchableOpacity>

          {/* إحصائيات الدخل */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/(dashboard)/revenue')}
          >
            <SolarChartBold size={20} color={Colors.text.muted} />
            <View style={[styles.menuItemContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
              <Text style={styles.menuItemTitle}>{isRTL ? 'المالية والأرباح' : 'Finances & Revenue'}</Text>
              {isRTL ? (
                <SolarAltArrowLeftLinear size={22} color={Colors.primary} />
              ) : (
                <SolarAltArrowRightLinear size={22} color={Colors.primary} />
              )}
            </View>
          </TouchableOpacity>

          {/* الإشعارات */}
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/(dashboard)/notifications')}
          >
            <SolarBellBold size={20} color={Colors.text.muted} />
            <View style={[styles.menuItemContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
              <Text style={styles.menuItemTitle}>{t('profile.notifications')}</Text>
              {isRTL ? (
                <SolarAltArrowLeftLinear size={22} color={Colors.primary} />
              ) : (
                <SolarAltArrowRightLinear size={22} color={Colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          <SolarLogoutBold size={22} color="#FF3B30" />
        </TouchableOpacity>

        <Text style={styles.versionText}>V 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 150, // Added more padding to clear the absolute tab bar
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(24),
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: normalize.width(100),
    height: normalize.width(100),
    borderRadius: normalize.radius(50),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: normalize.font(40),
    color: Colors.white,
    fontWeight: 'bold',
  },
  userName: {
    ...Typography.h1,
    fontSize: normalize.font(20),
    marginBottom: normalize.height(4),
  },
  userEmail: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(6),
    borderRadius: normalize.radius(12),
    backgroundColor: '#E8F5E9',
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#2E7D32',
  },
  menuContainer: {
    gap: Spacing.xs,
  },
  menuLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    marginBottom: Spacing.sm,
    textAlign: 'right',
    paddingHorizontal: normalize.width(4),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: normalize.radius(16),
    marginBottom: Spacing.xs,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  menuItemTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: normalize.radius(16),
    borderWidth: 1,
    borderColor: '#FF3B3020',
    backgroundColor: '#FF3B3005',
    gap: Spacing.sm,
  },
  logoutText: {
    ...Typography.body,
    color: '#FF3B30',
    fontWeight: '700',
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.text.muted,
    marginTop: Spacing.xl,
  },
});
