import { HeaderSection } from '@/components/header-section';
import {
    ProfileShape,
    SolarCalendarBold,
    SolarGlobalBold,
    SolarHeartBold,
    SolarReviewsHeartBold,
    SolarDangerCircleBold,
    SolarLogoutBold,
    SolarPhoneBold,
    SolarPenNewRoundBoldDuotone,
    SolarRefreshBold,
    SolarShieldBold,
    SolarUserBlockBoldDuotone,
    SolarWalletBold,
    SolarAltArrowLeftLinear,
    SolarAltArrowRightLinear,
} from '@/components/icons/solar-icons';
import { LanguageSheet } from '@/components/user/language-sheet';
import { LogoutSheet } from '@/components/user/logout-sheet';
import { DeleteAccountSheet } from '@/components/user/delete-account-sheet';
import { WalletCard } from '@/components/user/wallet-card';
import { WithdrawSheet, WithdrawSheetRef } from '@/components/user/withdraw-sheet';
import { PRIVACY_POLICY_URL } from '@/constants/links';
import { useModeSwitch } from '@/hooks/use-mode-switch';
import { useSupportContact } from '@/hooks/use-support-contact';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc, getAvatarSrc } from '@/hooks/useImageSrc';

import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api/apiSlice';
import { useSyncAuthUser } from '@/hooks/useSyncAuthUser';
import { useCreateCustomerPayoutMutation, useGetCustomerWalletQuery } from '@/store/api/customerApiSlice';

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Animated from 'react-native-reanimated';
import { useDirection } from '@/i18n';

type MenuItem = {
    id: string;
    title: string;
    shape: 'red' | 'pink' | 'green' | 'blue';
    icon: React.ReactNode;
    route?: string;
    action?: () => void;
    destructive?: boolean;
};

type MenuSection = {
    id: string;
    header?: string;
    items: MenuItem[];
};

/**
 * صف على نمط قائمة iOS المجمّعة (Grouped Inset List):
 * أيقونة ملوّنة ← عنوان ← شيفرون، وفاصل شعري لا يمتد تحت الأيقونة.
 * الأيقونات هي نفسها الموجودة سابقاً (ProfileShape + Solar) بلا حذف.
 */
const MenuRow = React.memo(function MenuRow({
    item,
    isLast,
    onPress,
}: {
    item: MenuItem;
    isLast: boolean;
    onPress: (item: MenuItem) => void;
}) {
    const { textAlign, isRTL } = useDirection();
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
    }, [item, onPress]);

    const Chevron = isRTL ? SolarAltArrowLeftLinear : SolarAltArrowRightLinear;

    return (
        <TouchableOpacity
            style={[styles.menuRow, { flexDirection: 'row' }]}
            onPress={handlePress}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={item.title}
        >
            <ProfileShape size={normalize.width(30)} type={item.shape}>
                {item.icon}
            </ProfileShape>

            {/* الفاصل داخل هذا الغلاف حتى يبدأ بعد الأيقونة مثل iOS */}
            <View style={[styles.rowBody, !isLast && styles.rowDivider]}>
                <Text
                    style={[
                        styles.menuLabelText,
                        { textAlign },
                        item.destructive && styles.destructiveText,
                    ]}
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
                <Chevron size={18} color="#C7C7CC" />
            </View>
        </TouchableOpacity>
    );
});

const MenuGroup = React.memo(function MenuGroup({
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
});

export default function CustomerProfileScreen() {
    const { t } = useTranslation();
    const { user: authUser } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { isRTL, rowDirection, textAlign } = useDirection();
    const isArabic = isRTL;

    const languageSheetRef = useRef<BottomSheetModal>(null);
    const logoutSheetRef = useRef<BottomSheetModal>(null);
    const deleteSheetRef = useRef<BottomSheetModal>(null);
    const withdrawSheetRef = useRef<WithdrawSheetRef>(null);

    const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined);
    useSyncAuthUser(meData);
    const { data: walletData, refetch: refetchWallet } = useGetCustomerWalletQuery(undefined);
    const [createPayout, { isLoading: isSubmittingPayout }] = useCreateCustomerPayoutMutation();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([refetchMe(), refetchWallet()]);
        setIsRefreshing(false);
    }, [refetchMe, refetchWallet]);

    const userData = (meData as any)?.data || meData || authUser;
    const walletBalance = walletData?.balance
        ? Number(walletData.balance).toLocaleString()
        : '0';

    // Support number comes from the portal (GET /config → adminPhone).
    const { openSupport: openContactUs } = useSupportContact();

    // Only a chalet owner browsing as a tenant sees this — see useModeSwitch.
    const { canSwitch, switchTo } = useModeSwitch();

    const onUserCardPress = useCallback(() => {
        Haptics.selectionAsync();
        router.push('/profile-edit');
    }, [router]);

    // `router` from expo-router is a stable reference across renders, so the
    // [router] dependency keeps this callback identity stable and preserves the
    // MenuRow React.memo optimization.
    const onMenuRowPress = useCallback((item: MenuItem) => {
        if (item.action) {
            item.action();
        } else if (item.route) {
            router.push(item.route as any);
        }
    }, [router]);

    const openPrivacyPolicy = useCallback(() => {
        Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
    }, []);

    // Withdraw: open the in-app sheet to collect amount + payout destination.
    const openWithdraw = useCallback(() => {
        withdrawSheetRef.current?.present(Number(walletData?.balance || 0));
    }, [walletData?.balance]);

    const handleWithdraw = useCallback(
        async (data: { amount: number; method: 'zaincash' | 'qi' | 'other'; account: string }) => {
            try {
                await createPayout(data).unwrap();
                withdrawSheetRef.current?.showSuccess(
                    t('profile.wallet.withdrawSheet.successMessage'),
                );
                refetchWallet();
            } catch (e: any) {
                withdrawSheetRef.current?.showError(
                    e?.data?.message || t('profile.wallet.withdrawSheet.errorMessage'),
                );
            }
        },
        [createPayout, t, refetchWallet],
    );

    // مقسّمة لأقسام على نمط إعدادات iOS. كل العناصر وأيقوناتها كما هي —
    // التغيير في التجميع والعرض فقط. الإجراءات الخطرة في قسم منفصل
    // (destructive-nav-separation).
    const menuSections: MenuSection[] = [
        {
            id: 'activity',
            header: isArabic ? 'نشاطي' : 'My activity',
            items: [
                ...(canSwitch
                    ? [{
                        id: 'switchToOwner',
                        title: isArabic ? 'التبديل إلى وضع المالك' : 'Switch to owner mode',
                        shape: 'blue' as const,
                        icon: <SolarRefreshBold size={16} color="white" />,
                        action: () => switchTo('owner'),
                    }]
                    : []),
                {
                    id: 'bookings',
                    title: t('headers.bookings'),
                    shape: 'red' as const,
                    icon: <SolarCalendarBold size={16} color="white" />,
                    route: '/(tabs)/(customer)/bookings',
                },
                {
                    id: 'favorites',
                    title: t('headers.favorites'),
                    shape: 'pink' as const,
                    icon: <SolarHeartBold size={16} color="white" />,
                    route: '/favorites',
                },
                {
                    id: 'transactions',
                    title: t('profile.wallet.transactions'),
                    shape: 'green' as const,
                    icon: <SolarWalletBold size={16} color="white" />,
                    route: '/(customer)/wallet-transactions',
                },
                {
                    id: 'reviews',
                    title: t('headers.reviews'),
                    shape: 'blue' as const,
                    icon: <SolarReviewsHeartBold size={16} color="white" />,
                    route: '/reviews',
                },
            ],
        },
        {
            id: 'preferences',
            header: isArabic ? 'الإعدادات والدعم' : 'Settings & support',
            items: [
                {
                    id: 'language',
                    title: t('profile.language'),
                    shape: 'pink' as const,
                    icon: <SolarGlobalBold size={16} color="white" />,
                    action: () => languageSheetRef.current?.present(),
                },
                {
                    id: 'contact',
                    title: t('profile.contactUs'),
                    shape: 'green' as const,
                    icon: <SolarPhoneBold size={16} color="white" />,
                    action: openContactUs,
                },
                {
                    id: 'reportProblem',
                    title: t('profile.reportProblem'),
                    shape: 'red' as const,
                    icon: <SolarDangerCircleBold size={16} color="white" />,
                    route: '/(customer)/report-problem',
                },
                {
                    id: 'privacy',
                    title: t('profile.privacyPolicy'),
                    shape: 'blue' as const,
                    icon: <SolarShieldBold size={16} color="white" />,
                    action: openPrivacyPolicy,
                },
            ],
        },
        {
            id: 'danger',
            items: [
                {
                    id: 'deleteAccount',
                    title: isArabic ? 'حذف الحساب' : 'Delete Account',
                    shape: 'red' as const,
                    icon: <SolarUserBlockBoldDuotone size={16} color="white" />,
                    action: () => deleteSheetRef.current?.present(),
                    destructive: true,
                },
                {
                    id: 'logout',
                    title: t('profile.logout'),
                    shape: 'red' as const,
                    icon: <SolarLogoutBold size={16} color="white" />,
                    action: () => logoutSheetRef.current?.present(),
                    destructive: true,
                },
            ],
        },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <HeaderSection
                title={isArabic ? 'الملف الشخصي' : 'Profile'}
                showBackButton
                onBackPress={() => router.back()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* User Card */}
                <Animated.View>
                <TouchableOpacity
                    style={[styles.userCard, { flexDirection: rowDirection }]}
                    onPress={onUserCardPress}
                    activeOpacity={0.9}
                >
                    {/* Inner avatar and name/phone block */}
                    <View style={[styles.avatarAndInfo, { flexDirection: rowDirection }]}>
                        <View style={styles.avatarWrap}>
                            <Image
                                source={getAvatarSrc(userData?.image || userData?.imageUrl)}
                                style={styles.avatarImg}
                            />
                        </View>
                        <View style={[styles.userInfo, { alignItems: 'flex-start' }]}>
                            <Text style={[styles.userName, { textAlign }]}>
                                {userData?.name || (isArabic ? 'المستخدم' : 'User')}
                            </Text>
                            {!!userData?.phone && (
                                <Text style={[styles.userPhone, { textAlign }]}>
                                    {userData.phone}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Edit Icon on the opposite end */}
                    <View style={styles.editIconWrap}>
                        <SolarPenNewRoundBoldDuotone size={32} color={Colors.primary} />
                    </View>
                </TouchableOpacity>
                </Animated.View>

                {/* Wallet Card */}
                <Animated.View>
                    <WalletCard
                        balance={walletBalance}
                        onWithdraw={openWithdraw}
                    />
                </Animated.View>

                {/* Menu — أقسام مجمّعة على نمط إعدادات iOS */}
                {menuSections.map((section) => (
                    <MenuGroup
                        key={section.id}
                        section={section}
                        onPress={onMenuRowPress}
                    />
                ))}

                <View style={{ height: normalize.height(120) }} />
            </ScrollView>

            <LanguageSheet ref={languageSheetRef} />
            <LogoutSheet ref={logoutSheetRef} />
            <DeleteAccountSheet ref={deleteSheetRef} />
            <WithdrawSheet
                ref={withdrawSheetRef}
                onConfirm={handleWithdraw}
                isLoading={isSubmittingPayout}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: normalize.width(20),
        paddingTop: normalize.height(16),
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: normalize.radius(12),
        paddingHorizontal: normalize.width(16),
        paddingVertical: normalize.height(14),
        marginBottom: normalize.height(20),
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    avatarAndInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize.width(12),
        flex: 1,
    },
    editIconWrap: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: normalize.font(14),
        fontFamily: "IBMPlexSansArabic-SemiBold",
        color: '#111827',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: normalize.font(13),
        fontFamily: "IBMPlexSansArabic-Medium",
        color: '#6B7280',
    },
    avatarWrap: {
        width: normalize.width(52),
        height: normalize.width(52),
        borderRadius: normalize.width(26),
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        // Slight zoom so the figure fills the circle with no light ring around it.
        transform: [{ scale: 1.18 }],
    },
    groupWrap: {
        marginTop: normalize.height(20),
    },
    groupHeader: {
        fontSize: normalize.font(13),
        fontFamily: "IBMPlexSansArabic-Regular",
        color: '#6D6D72',
        marginBottom: normalize.height(7),
        paddingHorizontal: normalize.width(4),
    },
    // البطاقة تقص زوايا أول وآخر صف، فما نحتاج نصف قطر لكل صف.
    // على خلفية بيضاء ما يفرّق لون البطاقة عن الصفحة، فالحد هو اللي
    // يرسم حدود المجموعة ويحافظ على شكل القائمة المجمّعة.
    groupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: normalize.radius(12),
        borderWidth: 1,
        borderColor: '#E5E5EA',
        overflow: 'hidden',
    },
    menuRow: {
        alignItems: 'center',
        paddingStart: normalize.width(14),
        // 44pt حد أدنى لمساحة اللمس (touch-target-size).
        minHeight: normalize.height(46),
        gap: normalize.width(11),
    },
    // يحمل النص والشيفرون والفاصل — يبدأ بعد الأيقونة فينحاذي الفاصل مثل iOS.
    rowBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'stretch',
        paddingEnd: normalize.width(14),
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C6C6C8',
    },
    menuLabelText: {
        flex: 1,
        fontSize: normalize.font(15),
        fontFamily: "IBMPlexSansArabic-Regular",
        color: '#000000',
        lineHeight: normalize.font(23),
    },
    destructiveText: {
        color: '#FF3B30',
    },
});
