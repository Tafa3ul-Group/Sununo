import { SolarIcon } from "@/components/ui/solar-icon";
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

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, userType } = useSelector((state: RootState) => state.auth);

  const router = useRouter();

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

  const isOwner = userType === 'owner';

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection
        userType={userType}
        userName={user?.name}
        title={t('profile.title')}
        showSearch={false}
        showCategories={false}
        showBackButton={true}
      />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <TouchableOpacity style={styles.editAvatar}>
              <SolarIcon name="4k-bold" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || (userType === 'guest' ? t('auth.browseAsGuest') : t('profile.title'))}</Text>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}

          <View style={[styles.roleBadge, { backgroundColor: isOwner ? '#E3F2FD' : '#FFF3E0' }]}>
            <Text style={[styles.roleText, { color: isOwner ? '#1976D2' : '#F57C00' }]}>
              {isOwner ? t('auth.owner') : (userType === 'guest' ? t('auth.browseAsGuest') : t('auth.customer'))}
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuLabel}>{t('profile.title')}</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => isOwner ? router.push('/(tabs)/(dashboard)/provider-profile') : null}
          >
            <SolarIcon name="4k-bold" size={20} color={Colors.text.muted} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>
                {isOwner ? (isRTL ? 'معلومات العمل والمصرف' : 'Business & Bank Info') : t('profile.editProfile')}
              </Text>
              <SolarIcon name="4k-bold" size={22} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(tabs)/(dashboard)/home')}
            >
              <SolarIcon name="4k-bold" size={20} color={Colors.text.muted} />
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{t('tabs.myChalets')}</Text>
                <SolarIcon name="4k-bold" size={22} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem}>
            <SolarIcon name="4k-bold" size={20} color={Colors.text.muted} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{t('profile.notifications')}</Text>
              <SolarIcon name="4k-bold" size={22} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <SolarIcon name="4k-bold" size={20} color={Colors.text.muted} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{t('profile.language')}</Text>
              <SolarIcon name="4k-bold" size={22} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>{userType === 'guest' ? t('auth.login') : t('profile.logout')}</Text>
          <SolarIcon name="4k-bold" size={22} color="#FF3B30" />
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
    paddingBottom: 150,
  },
  header: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    fontSize: normalize.font(24),
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
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: normalize.width(6),
    borderRadius: normalize.radius(15),
    borderWidth: normalize.width(3),
    borderColor: Colors.surface,
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
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '700',
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
