import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  ProfileShape,
  SolarBanknoteBold,
  SolarBellBold,
  SolarCardBold,
  SolarDangerCircleBold,
  SolarGlobalBold,
  SolarLogoutBold,
  SolarPhoneBold,
  SolarRefreshBold,
  SolarSettingsBold,
  SolarShieldBold,
  SolarTrashBinBold,
  SolarUserBold,
  SolarWalletBold,
  SolarAltArrowLeftLinear,
  SolarAltArrowRightLinear
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
import { useSyncAuthUser } from "@/hooks/useSyncAuthUser";
import { useGetNotificationsQuery } from '@/store/api/customerApiSlice';
import { useModeSwitch } from '@/hooks/use-mode-switch';
import { activeSection } from '@/utils/notification-section';
import { useSupportContact } from '@/hooks/use-support-contact';
import { logout } from '@/store/authSlice';
import { useDirection } from '@/i18n';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

type MenuItem = {
  id: string;
  title: string;
  shape: 'red' | 'pink' | 'green' | 'blue';
  icon: React.ReactNode;
  route?: string;
  action?: () => void;
  /** Optional end-aligned counter (unread notifications). */
  badge?: string;
  destructive?: boolean;
};

type MenuSection = { id: string; header?: string; items: MenuItem[] };

/** صف قائمة iOS مجمّعة: أيقونة ← عنوان ← (شارة) ← شيفرون، وفاصل مُزاح. */
function MenuRow({
  item,
  isLast,
  onPress,
}: {
  item: MenuItem;
  isLast: boolean;
  onPress: (item: MenuItem) => void;
}) {
  const { textAlign, isRTL } = useDirection();
  const Chevron = isRTL ? SolarAltArrowLeftLinear : SolarAltArrowRightLinear;
  return (
    <TouchableOpacity
      style={[styles.menuRow, { flexDirection: 'row' }]}
      onPress={() => onPress(item)}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <ProfileShape size={normalize.width(30)} type={item.shape}>
        {item.icon}
      </ProfileShape>
      <View style={[styles.rowBody, !isLast && styles.rowDivider]}>
        <Text
          style={[styles.menuLabelText, { textAlign }, item.destructive && styles.destructiveText]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {!!item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <Chevron size={18} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

function MenuGroup({
  section,
  onPress,
}: {
  section: MenuSection;
  onPress: (item: MenuItem) => void;
}) {
  const { textAlign } = useDirection();
  return (
    <View style={styles.groupWrap}>
      {!!section.header && (
        <Text style={[styles.groupHeader, { textAlign }]}>{section.header}</Text>
      )}
      <View style={styles.groupCard}>
        {section.items.map((item, i) => (
          <MenuRow
            key={item.id}
            item={item}
            isLast={i === section.items.length - 1}
            onPress={onPress}
          />
        ))}
      </View>
    </View>
  );
}

export default function ProviderProfileScreen() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isRTL, textAlign } = useDirection();

  const { user: authUser, userType } = useSelector((state: RootState) => state.auth);
  const { showConfirm } = useConfirmationDialog();

  const { data: userData } = useGetMeQuery(undefined);
  useSyncAuthUser(userData);
  const user = userData?.data || userData || authUser;

  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const profile = profileResponse?.data || profileResponse;

  const [logoutApi] = useLogoutUserMutation();
  const [deleteProfile] = useDeleteProfileMutation();

  // Unread count for the notifications row. Shares the cache key with the
  // notifications screen, so opening a notification updates the badge here too.
  const { data: notificationsResponse } = useGetNotificationsQuery(
    { page: 1, limit: 50, role: activeSection(userType) },
    { pollingInterval: 60000 }
  );
  const unreadCount = React.useMemo(() => {
    const items: any[] = notificationsResponse?.data ?? [];
    return items.reduce(
      (count, item) => (item?.readAt || item?.isRead ? count : count + 1),
      0
    );
  }, [notificationsResponse]);

  // Support number comes from the portal (GET /config → adminPhone).
  const { openSupport: openContactUs } = useSupportContact();

  // The owner can leave the dashboard and use the app as a tenant.
  const { switchTo } = useModeSwitch();
  const router = useRouter();
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const logoutSheetRef = useRef<BottomSheetModal>(null);

  const openLanguageSheet = () => {
    languageSheetRef.current?.present();
  };

  const handleLogout = () => {
    showConfirm({
      title: isRTL ? 'تسجيل الخروج' : 'Logout',
      message: isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
      type: 'danger',
      confirmLabel: isRTL ? 'خروج' : 'Logout',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
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
      title: isRTL ? 'حذف الحساب' : 'Delete Account',
      message: isRTL
        ? 'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المتعلقة بحسابك.'
        : 'Are you sure you want to delete your account permanently? This action cannot be undone and all data associated with your account will be removed.',
      type: 'danger',
      confirmLabel: isRTL ? 'حذف الحساب' : 'Delete Account',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
      onConfirm: async () => {
        try {
          await deleteProfile(undefined).unwrap();
          dispatch(logout());
        } catch (error: any) {
          console.error('Failed to delete account:', error);
          // A silent failure reads as "the button did nothing" while the account
          // is still fully intact — surface the server's reason (the customer
          // sheet does the same) and re-throw so the confirmation dialog stays
          // open for a retry instead of dismissing as if the delete succeeded.
          const serverMessage = error?.data?.message;
          Alert.alert(
            isRTL ? 'خطأ' : 'Error',
            (typeof serverMessage === 'string' ? serverMessage : Array.isArray(serverMessage) ? serverMessage[0] : undefined)
            || (isRTL
              ? 'فشل في حذف الحساب. يرجى المحاولة لاحقاً.'
              : 'Failed to delete account. Please try again later.')
          );
          throw error;
        }
      }
    });
  };

  // نفس العناصر والأيقونات، مقسّمة لأقسام على نمط إعدادات iOS.
  // حذف الحساب وتسجيل الخروج بقسم منفصل بلا عنوان.
  const menuSections: MenuSection[] = [
    {
      id: 'account',
      header: isRTL ? 'حسابي' : 'My account',
      items: [
        { id: 'switchToCustomer', title: isRTL ? 'التبديل إلى وضع المستأجر' : 'Switch to tenant mode', shape: 'blue' as const, icon: <SolarRefreshBold size={16} color="white" />, action: () => switchTo('customer') },
        { id: 'profile', title: isRTL ? 'المعلومات الشخصية' : 'Personal Information', shape: 'blue' as const, icon: <SolarUserBold size={16} color="white" />, route: '/(dashboard)/edit-profile' },
        { id: 'business', title: isRTL ? 'معلومات المصرف' : 'Bank Information', shape: 'blue' as const, icon: <SolarWalletBold size={16} color="white" />, route: '/(dashboard)/edit-business' },
      ],
    },
    {
      id: 'business',
      header: isRTL ? 'أعمالي' : 'My business',
      items: [
        { id: 'revenue', title: isRTL ? 'الأرباح' : 'Earnings', shape: 'green' as const, icon: <SolarBanknoteBold size={16} color="white" />, route: '/(tabs)/(dashboard)/revenue' },
        { id: 'discounts', title: isRTL ? 'الخصومات' : 'Discounts', shape: 'green' as const, icon: <SolarCardBold size={16} color="white" />, route: '/(dashboard)/discounts' },
        { id: 'notifications', title: isRTL ? 'الإشعارات' : 'Notifications', shape: 'pink' as const, icon: <SolarBellBold size={16} color="white" />, route: '/(tabs)/(dashboard)/notifications', badge: unreadCount > 9 ? '9+' : unreadCount > 0 ? String(unreadCount) : undefined },
        { id: 'notification-settings', title: isRTL ? 'إعدادات الإشعارات' : 'Notification Settings', shape: 'green' as const, icon: <SolarSettingsBold size={16} color="white" />, route: '/(dashboard)/notification-settings' },
      ],
    },
    {
      id: 'preferences',
      header: isRTL ? 'الإعدادات والدعم' : 'Settings & support',
      items: [
        { id: 'language', title: isRTL ? 'اللغة' : 'Language', shape: 'blue' as const, icon: <SolarGlobalBold size={16} color="white" />, action: openLanguageSheet },
        { id: 'contact', title: isRTL ? 'تواصل معنا' : 'Contact Us', shape: 'green' as const, icon: <SolarPhoneBold size={16} color="white" />, action: openContactUs },
        { id: 'reportProblem', title: isRTL ? 'تبليغ عن مشكلة' : 'Report a Problem', shape: 'red' as const, icon: <SolarDangerCircleBold size={16} color="white" />, route: '/(customer)/report-problem' },
        { id: 'privacy', title: isRTL ? 'سياسات التطبيق' : 'App Policies', shape: 'blue' as const, icon: <SolarShieldBold size={16} color="white" />, route: '/policies' },
      ],
    },
    {
      id: 'danger',
      items: [
        { id: 'logout', title: isRTL ? 'تسجيل الخروج' : 'Logout', shape: 'red' as const, icon: <SolarLogoutBold size={16} color="white" />, action: handleLogout, destructive: true },
        { id: 'deleteAccount', title: isRTL ? 'حذف الحساب نهائياً' : 'Permanently Delete Account', shape: 'red' as const, icon: <SolarTrashBinBold size={16} color="white" />, action: handleDeleteAccount, destructive: true },
      ],
    },
  ];

  const onMenuRowPress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <DashboardHeader
          title={isRTL ? 'الملف الشخصي' : 'Profile'}
          showSearch={false}
          showBackButton={true}
        />

        {/* Profile Header & User Card */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={[styles.userCard, { flexDirection: 'row' }]}
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

            <View style={[styles.userInfo, { alignItems: 'flex-start' }]}>
              <Text style={[styles.userName, { textAlign }]}>
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
          {menuSections.map((section) => (
            <MenuGroup key={section.id} section={section} onPress={onMenuRowPress} />
          ))}
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
    borderRadius: normalize.radius(12),
    padding: normalize.width(14),
    marginBottom: normalize.height(4),
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  userInfo: {
    marginHorizontal: normalize.width(15)
  },
  userName: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
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
    fontFamily: "IBMPlexSansArabic-Medium"
  },
  groupWrap: {
    marginTop: normalize.height(20)
  },
  groupHeader: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: '#6D6D72',
    marginBottom: normalize.height(7),
    paddingHorizontal: normalize.width(4)
  },
  // خلفية الصفحة بيضاء، فالحد هو اللي يرسم حدود المجموعة.
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(12),
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden'
  },
  menuRow: {
    alignItems: 'center',
    paddingStart: normalize.width(14),
    minHeight: normalize.height(46),
    gap: normalize.width(11)
  },
  // يبدأ بعد الأيقونة فينحاذي الفاصل مثل iOS.
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: normalize.width(8),
    paddingEnd: normalize.width(14)
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8'
  },
  menuLabelText: {
    flex: 1,
    fontSize: normalize.font(15),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: '#000000',
    lineHeight: normalize.font(23)
  },
  destructiveText: {
    color: '#FF3B30'
  },
  badge: {
    minWidth: normalize.width(22),
    height: normalize.width(22),
    borderRadius: normalize.width(11),
    paddingHorizontal: normalize.width(6),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: '#FFFFFF'
  },
});
