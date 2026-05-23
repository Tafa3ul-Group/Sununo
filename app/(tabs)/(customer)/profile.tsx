import { HeaderSection } from '@/components/header-section';
import {
    ProfileShape,
    SolarCalendarBold,
    SolarGlobalBold,
    SolarReviewsHeartBold,
    SolarLogoutBold,
    SolarPhoneBold,
    SolarProfileEdit,
    SolarShieldBold,
    SolarUserBlockBoldDuotone,
} from '@/components/icons/solar-icons';
import { LanguageSheet } from '@/components/user/language-sheet';
import { LogoutSheet } from '@/components/user/logout-sheet';
import { DeleteAccountSheet } from '@/components/user/delete-account-sheet';
import { WalletCard } from '@/components/user/wallet-card';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { getFlexDirection } from "@/i18n";
import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api/apiSlice';
import { useGetCustomerWalletQuery } from '@/store/api/customerApiSlice';

import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function CustomerProfileScreen() {
    const { t, i18n } = useTranslation();
    const { user: authUser } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const isArabic = i18n.language === 'ar';
    const rowDirection = getFlexDirection(isArabic);

    const textStart: "left" | "right" = isArabic ? "right" : "left";
    const needsCounter = isArabic !== I18nManager.isRTL;
    const alignStart: "flex-start" | "flex-end" = needsCounter ? "flex-end" : "flex-start";

    const languageSheetRef = useRef<BottomSheetModal>(null);
    const logoutSheetRef = useRef<BottomSheetModal>(null);
    const deleteSheetRef = useRef<BottomSheetModal>(null);

    const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined);
    const { data: walletData, refetch: refetchWallet } = useGetCustomerWalletQuery(undefined);

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

    const menuItems = [
        {
            id: 'bookings',
            title: t('headers.bookings'),
            shape: 'red' as const,
            icon: <SolarCalendarBold size={20} color="white" />,
            route: '/(tabs)/(customer)/bookings',
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
        },
        {
            id: 'privacy',
            title: t('profile.privacyPolicy'),
            shape: 'blue' as const,
            icon: <SolarShieldBold size={20} color="white" />,
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
                <TouchableOpacity
                    style={[styles.userCard, { flexDirection: rowDirection }]}
                    onPress={() => router.push('/profile-edit')}
                    activeOpacity={0.9}
                >
                    {/* Inner avatar and name/phone block */}
                    <View style={[styles.avatarAndInfo, { flexDirection: rowDirection }]}>
                        <View style={styles.avatarWrap}>
                            <Image
                                source={getImageSrc(userData?.image || userData?.imageUrl)}
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
                        <SolarProfileEdit size={32} color={Colors.primary} />
                    </View>
                </TouchableOpacity>

                {/* Wallet Card */}
                <WalletCard
                    balance={walletBalance}
                    onWithdraw={() => router.push('/(tabs)/(customer)/bookings')}
                />

                {/* Menu Items */}
                <View style={styles.menuGroup}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuRow, { flexDirection: rowDirection }]}
                            onPress={() => {
                                if (item.action) {
                                    item.action();
                                } else if (item.route) {
                                    router.push(item.route as any);
                                }
                            }}
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
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: normalize.height(120) }} />
            </ScrollView>

            <LanguageSheet ref={languageSheetRef} />
            <LogoutSheet ref={logoutSheetRef} />
            <DeleteAccountSheet ref={deleteSheetRef} />
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
