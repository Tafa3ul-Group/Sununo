import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  ProfileShape,
  SolarBanknoteBold,
  SolarGlobalBold,
  SolarLogoutBold,
  SolarPhoneBold,
  SolarShieldBold,
  SolarTrashBinBold,
  SolarUserBold,
  SolarWalletBold
} from "@/components/icons/solar-icons";
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { LanguageSheet } from '@/components/user/language-sheet';
import { LogoutSheet } from '@/components/user/logout-sheet';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import {
  useGetMeQuery,
  useGetProviderProfileQuery,
  useLogoutUserMutation,
  useDeleteProfileMutation
} from '@/store/api/apiSlice';
import { logout } from '@/store/authSlice';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  I18nManager,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

export default function ProviderProfileScreen() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language ? i18n.language.startsWith('ar') : true;

  const textStart: 'left' | 'right' = isArabic === I18nManager.isRTL ? 'left' : 'right';
  const textEnd: 'left' | 'right' = isArabic === I18nManager.isRTL ? 'right' : 'left';
  const alignStart: 'flex-start' | 'flex-end' = isArabic === I18nManager.isRTL ? 'flex-start' : 'flex-end';
  const alignEnd: 'flex-start' | 'flex-end' = isArabic === I18nManager.isRTL ? 'flex-end' : 'flex-start';
  const flexDir: 'row' | 'row-reverse' = isArabic === I18nManager.isRTL ? 'row' : 'row-reverse';

  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { showConfirm } = useConfirmationDialog();

  const { data: userData } = useGetMeQuery(undefined);
  const user = userData?.data || userData || authUser;

  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse;

  const [logoutApi] = useLogoutUserMutation();
  const [deleteProfile] = useDeleteProfileMutation();

  const router = useRouter();
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const logoutSheetRef = useRef<BottomSheetModal>(null);

  const openLanguageSheet = () => {
    languageSheetRef.current?.present();
  };

  const handleLogout = () => {
    showConfirm({
      title: isArabic ? 'تسجيل الخروج' : 'Logout',
      message: isArabic ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
      type: 'danger',
      confirmLabel: isArabic ? 'خروج' : 'Logout',
      cancelLabel: isArabic ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        try {
          await logoutApi(undefined).unwrap();
        } catch {
          // ignore server error
        }
        dispatch(logout());
      }
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: isArabic ? 'حذف الحساب' : 'Delete Account',
      message: isArabic
        ? 'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المتعلقة بحسابك.'
        : 'Are you sure you want to delete your account permanently? This action cannot be undone and all data associated with your account will be removed.',
      type: 'danger',
      confirmLabel: isArabic ? 'حذف الحساب' : 'Delete Account',
      cancelLabel: isArabic ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        try {
          await deleteProfile(undefined).unwrap();
          dispatch(logout());
        } catch (error) {
          console.error('Failed to delete account:', error);
        }
      }
    });
  };

  const menuItems = [
    { id: 'profile', title: isArabic ? 'المعلومات الشخصية' : 'Personal Information', shape: 'blue' as const, icon: <SolarUserBold size={20} color="white" />, route: '/(dashboard)/edit-profile' },
    { id: 'business', title: isArabic ? 'معلومات المصرف' : 'Bank Information', shape: 'blue' as const, icon: <SolarWalletBold size={20} color="white" />, route: '/(dashboard)/edit-business' },
    { id: 'revenue', title: isArabic ? 'الأرباح' : 'Earnings', shape: 'green' as const, icon: <SolarBanknoteBold size={20} color="white" />, route: '/(tabs)/(dashboard)/revenue' },
    { id: 'language', title: isArabic ? 'اللغة' : 'Language', shape: 'blue' as const, icon: <SolarGlobalBold size={20} color="white" />, action: openLanguageSheet },
    { id: 'contact', title: isArabic ? 'تواصل معنا' : 'Contact Us', shape: 'green' as const, icon: <SolarPhoneBold size={20} color="white" /> },
    { id: 'privacy', title: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy', shape: 'blue' as const, icon: <SolarShieldBold size={20} color="white" /> },
    { id: 'logout', title: isArabic ? 'تسجيل الخروج' : 'Logout', shape: 'red' as const, icon: <SolarLogoutBold size={20} color="white" />, action: handleLogout },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <DashboardHeader
          title={isArabic ? 'الملف الشخصي' : 'Profile'}
          showSearch={false}
          showBackButton={true}
        />

        {/* Profile Header & User Card */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={[styles.userCard, { flexDirection: flexDir }]}
            onPress={() => router.push('/(dashboard)/edit-profile')}
            activeOpacity={0.9}
          >
            <View style={styles.avatarWrap}>
              {user?.image ? (
                <Image source={getImageSrc(user.image)} style={styles.avatarImg} />
              ) : profile?.business_name ? (
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

            <View style={[styles.userInfo, { alignItems: alignStart }]}>
              <Text style={[styles.userName, { textAlign: textStart }]}>
                {user?.name || profile?.business_name || t('tabs.home')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.menuGroup}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuRow, { flexDirection: flexDir }]}
                onPress={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <ProfileShape size={normalize.width(42)} type={item.shape}>
                  {item.icon}
                </ProfileShape>
                <Text style={[styles.menuLabelText, { textAlign: textStart }]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <Text style={[styles.dangerZoneTitle, { textAlign: textStart }]}>
              {isArabic ? 'منطقة الخطر' : 'Danger Zone'}
            </Text>
            <TouchableOpacity
              style={[styles.menuRow, styles.dangerRowOverride, { flexDirection: flexDir }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <ProfileShape size={normalize.width(42)} type="red">
                <SolarTrashBinBold size={20} color="white" />
              </ProfileShape>
              <Text style={[styles.menuLabelText, { textAlign: textStart, color: '#DC2626' }]}>
                {isArabic ? 'حذف الحساب نهائياً' : 'Permanently Delete Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <LanguageSheet ref={languageSheetRef} />
        <LogoutSheet ref={logoutSheetRef} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  topSection: {
    paddingHorizontal: normalize.width(20),
    paddingTop: 15
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(10),
    paddingBottom: 100
  },
  userCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(24),
    padding: normalize.width(18),
    marginBottom: normalize.height(10),
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  userInfo: {
    marginHorizontal: normalize.width(15)
  },
  userName: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#374151'
  },
  avatarWrap: {
    width: normalize.width(66),
    height: normalize.width(66),
    borderRadius: normalize.width(33),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(33)
  },
  avatarInitial: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.width(33),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInitialText: {
    color: 'white',
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium"
  },
  menuGroup: {
    gap: normalize.height(16)
  },
  menuRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(18),
    paddingVertical: normalize.height(14),
    paddingHorizontal: normalize.width(18),
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  menuLabelText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: '#374151',
    marginHorizontal: normalize.width(15)
  },
  dangerZone: {
    marginTop: normalize.height(24),
  },
  dangerZoneTitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: '#DC2626', // Red color
    marginBottom: normalize.height(10),
    marginHorizontal: normalize.width(4),
  },
  dangerRowOverride: {
    backgroundColor: '#FFF5F5', // Light red background
    borderColor: '#FEE2E2',     // Light red border
  }
});
