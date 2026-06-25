import { HeaderSection } from '@/components/header-section';
import {
    ProfileShape,
    SolarCalendarBold,
    SolarGlobalBold,
    SolarHeartBold,
    SolarReviewsHeartBold,
    SolarLogoutBold,
    SolarPhoneBold,
    SolarPenNewRoundBoldDuotone,
    SolarShieldBold,
    SolarUserBlockBoldDuotone,
    SolarWalletBold,
} from '@/components/icons/solar-icons';
import { LanguageSheet } from '@/components/user/language-sheet';
import { LogoutSheet } from '@/components/user/logout-sheet';
import { DeleteAccountSheet } from '@/components/user/delete-account-sheet';
import { WalletCard } from '@/components/user/wallet-card';
import { WithdrawSheet, WithdrawSheetRef } from '@/components/user/withdraw-sheet';
import { PRIVACY_POLICY_URL, SUPPORT_WHATSAPP, toWhatsAppNumber } from '@/constants/links';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc, getAvatarSrc } from '@/hooks/useImageSrc';

import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api/apiSlice';
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
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useDirection } from '@/i18n';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type MenuItem = {
    id: string;
    title: string;
    shape: 'red' | 'pink' | 'green' | 'blue';
    icon: React.ReactNode;
    route?: string;
    action?: () => void;
};

const MenuRow = React.memo(function MenuRow({
    item,
    rowDirection,
    onPress,
}: {
    item: MenuItem;
    rowDirection: 'row' | 'row-reverse';
    onPress: (item: MenuItem) => void;
}) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withTiming(0.95, { duration: 110 });
    }, [scale]);
    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
    }, [scale]);
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(item);
    }, [item, onPress]);

    return (
        <AnimatedTouchable
            style={[styles.menuRow, { flexDirection: rowDirection }, animatedStyle]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.7}
        >
            {/* Icon first, then label right next to it */}
            <View style={[styles.menuItemStart, { flexDirection: rowDirection }]}>
                <ProfileShape size={normalize.width(42)} type={item.shape}>
                    {item.icon}
                </ProfileShape>
                <Text
                    style={[
                        styles.menuLabelText,
                        (item.id === 'logout' || item.id === 'deleteAccount') && styles.logoutText,
                    ]}
                >
                    {item.title}
                </Text>
            </View>
        </AnimatedTouchable>
    );
});

export default function CustomerProfileScreen() {
    const { t } = useTranslation();
    const { user: authUser } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { isRTL, rowDirection, textAlign } = useDirection();
    const isArabic = isRTL;

    const textStart: "left" | "right" = textAlign;
    const needsCounter = rowDirection === 'row-reverse';
    const alignStart: "flex-start" | "flex-end" = needsCounter ? "flex-end" : "flex-start";

    const languageSheetRef = useRef<BottomSheetModal>(null);
    const logoutSheetRef = useRef<BottomSheetModal>(null);
    const deleteSheetRef = useRef<BottomSheetModal>(null);
    const withdrawSheetRef = useRef<WithdrawSheetRef>(null);

    const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined);
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

    const supportPhone = toWhatsAppNumber(SUPPORT_WHATSAPP);

    // Press-scale feedback for the user (edit profile) card.
    const userCardScale = useSharedValue(1);
    const userCardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: userCardScale.value }],
    }));
    const onUserCardPressIn = useCallback(() => {
        userCardScale.value = withTiming(0.96, { duration: 110 });
    }, [userCardScale]);
    const onUserCardPressOut = useCallback(() => {
        userCardScale.value = withSpring(1, { damping: 12, stiffness: 220 });
    }, [userCardScale]);
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

    const openContactUs = useCallback(() => {
        Linking.openURL(`https://wa.me/${supportPhone}`).catch(() => {
            Linking.openURL(`tel:+${supportPhone}`).catch(() => {});
        });
    }, [supportPhone]);

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

    const menuItems = [
        {
            id: 'bookings',
            title: t('headers.bookings'),
            shape: 'red' as const,
            icon: <SolarCalendarBold size={20} color="white" />,
            route: '/(tabs)/(customer)/bookings',
        },
        {
            id: 'favorites',
            title: t('headers.favorites'),
            shape: 'pink' as const,
            icon: <SolarHeartBold size={20} color="white" />,
            route: '/favorites',
        },
        {
            id: 'transactions',
            title: t('profile.wallet.transactions'),
            shape: 'green' as const,
            icon: <SolarWalletBold size={20} color="white" />,
            route: '/(customer)/wallet-transactions',
        },
        {
            id: 'reviews',
            title: t('headers.reviews'),
            shape: 'blue' as const,
            icon: <SolarReviewsHeartBold size={20} color="white" />,
            route: '/reviews',
        },
        {
            id: 'language',
            title: t('profile.language'),
            shape: 'pink' as const,
            icon: <SolarGlobalBold size={20} color="white" />,
            action: () => languageSheetRef.current?.present(),
        },
        {
            id: 'contact',
            title: t('profile.contactUs'),
            shape: 'green' as const,
            icon: <SolarPhoneBold size={20} color="white" />,
            action: openContactUs,
        },
        {
            id: 'privacy',
            title: t('profile.privacyPolicy'),
            shape: 'blue' as const,
            icon: <SolarShieldBold size={20} color="white" />,
            action: openPrivacyPolicy,
        },
        {
            id: 'deleteAccount',
            title: isArabic ? 'حذف الحساب' : 'Delete Account',
            shape: 'red' as const,
            icon: <SolarUserBlockBoldDuotone size={20} color="white" />,
            action: () => deleteSheetRef.current?.present(),
        },
        {
            id: 'logout',
            title: t('profile.logout'),
            shape: 'red' as const,
            icon: <SolarLogoutBold size={20} color="white" />,
            action: () => logoutSheetRef.current?.present(),
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
                <Animated.View entering={FadeInDown.duration(400)}>
                <AnimatedTouchable
                    style={[styles.userCard, { flexDirection: rowDirection }, userCardAnimatedStyle]}
                    onPress={onUserCardPress}
                    onPressIn={onUserCardPressIn}
                    onPressOut={onUserCardPressOut}
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
                        <View style={[styles.userInfo, { alignItems: alignStart }]}>
                            <Text style={[styles.userName, { textAlign: textStart }]}>
                                {userData?.name || (isArabic ? 'المستخدم' : 'User')}
                            </Text>
                            {!!userData?.phone && (
                                <Text style={[styles.userPhone, { textAlign: textStart }]}>
                                    {userData.phone}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Edit Icon on the opposite end */}
                    <View style={styles.editIconWrap}>
                        <SolarPenNewRoundBoldDuotone size={32} color={Colors.primary} />
                    </View>
                </AnimatedTouchable>
                </Animated.View>

                {/* Wallet Card */}
                <Animated.View entering={FadeInDown.delay(90).duration(400)}>
                    <WalletCard
                        balance={walletBalance}
                        onWithdraw={openWithdraw}
                    />
                </Animated.View>

                {/* Menu Items */}
                <View style={styles.menuGroup}>
                    {menuItems.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInDown.delay(160 + index * 60).duration(380)}
                        >
                        <MenuRow
                            item={item}
                            rowDirection={rowDirection}
                            onPress={onMenuRowPress}
                        />
                        </Animated.View>
                    ))}
                </View>

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
        borderRadius: normalize.radius(20),
        paddingHorizontal: normalize.width(16),
        paddingVertical: normalize.height(16),
        marginBottom: normalize.height(16),
        borderWidth: 1,
        borderColor: '#F3F4F6',
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
        fontFamily: "Alexandria-Medium",
        color: '#111827',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: normalize.font(13),
        fontFamily: "Alexandria-Medium",
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
    menuGroup: {
        gap: normalize.height(10),
        marginTop: normalize.height(16),
    },
    menuRow: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: normalize.radius(18),
        paddingVertical: normalize.height(14),
        paddingHorizontal: normalize.width(16),
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: normalize.width(12),
    },
    menuItemStart: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize.width(12),
    },
    menuLabelText: {
        fontSize: normalize.font(14),
        fontFamily: "Alexandria-Medium",
        color: '#374151',
        lineHeight: normalize.font(20),
        paddingBottom: 2,
    },
    logoutText: {
        color: '#EF4444',
    },
});
