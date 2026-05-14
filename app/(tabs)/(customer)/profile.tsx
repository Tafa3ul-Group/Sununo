import {
    ProfileShape,
    SolarCalendarBold,
    SolarGlobalBold,
    SolarHeartBold,
    SolarLogoutBold,
    SolarPenBold,
    SolarPhoneBold,
    SolarShieldBold,
    SolarUserBold } from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { LanguageSheet } from '@/components/user/language-sheet';
import { WalletCard } from '@/components/user/wallet-card';
import { normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import { useGetMeQuery } from '@/store/api/apiSlice';
import {
    useGetCustomerWalletQuery,
    useLogoutUserMutation } from '@/store/api/customerApiSlice';
import { logout } from '@/store/authSlice';
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
    View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { isRTL } from "@/i18n";

export default function CustomerProfileScreen() {
    const dispatch = useDispatch();
    const { i18n, t } = useTranslation();
        const { user: authUser } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const languageSheetRef = useRef<BottomSheetModal>(null);

    const { data: meData } = useGetMeQuery(undefined);
    const { data: walletData } = useGetCustomerWalletQuery(undefined);
    const [logoutApi] = useLogoutUserMutation();

    const userData = (meData as any)?.data || meData || authUser;
    const walletBalance = walletData?.balance
        ? Number(walletData.balance).toLocaleString()
        : '0';

    const handleLogout = () => {
        Alert.alert(
            isRTL ? 'تسجيل الخروج' : 'Logout',
            isRTL ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
            [
                { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                {
                    text: isRTL ? 'خروج' : 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logoutApi(undefined).unwrap();
                        } catch {
                            // ignore server error
                        }
                        dispatch(logout());
                    } },
            ],
        );
    };

    const menuItems = [
        {
            id: 'edit',
            title: isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile',
            shape: 'blue' as const,
            icon: <SolarUserBold size={20} color="white" />,
            route: '/profile-edit' },
        {
            id: 'bookings',
            title: t('headers.bookings'),
            shape: 'blue' as const,
            icon: <SolarCalendarBold size={20} color="white" />,
            route: '/(tabs)/(customer)/bookings' },
        {
            id: 'reviews',
            title: t('headers.reviews'),
            shape: 'blue' as const,
            icon: <SolarHeartBold size={20} color="white" />,
            route: '/reviews' },
        {
            id: 'favorites',
            title: t('headers.favorites'),
            shape: 'blue' as const,
            icon: <SolarHeartBold size={20} color="white" />,
            route: '/favorites' },
        {
            id: 'language',
            title: t('profile.language'),
            shape: 'pink' as const,
            icon: <SolarGlobalBold size={20} color="white" />,
            action: () => languageSheetRef.current?.present() },
        {
            id: 'contact',
            title: t('profile.contactUs'),
            shape: 'green' as const,
            icon: <SolarPhoneBold size={20} color="white" /> },
        {
            id: 'privacy',
            title: t('profile.privacyPolicy'),
            shape: 'blue' as const,
            icon: <SolarShieldBold size={20} color="white" /> },
        {
            id: 'logout',
            title: t('profile.logout'),
            shape: 'red' as const,
            icon: <SolarLogoutBold size={20} color="white" />,
            action: handleLogout },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top, direction: isRTL ? 'rtl' : 'ltr' }]}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText style={styles.headerTitle}>{t('headers.profile')}</ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* User Card — navigates to profile-edit */}
                <TouchableOpacity
                    style={[styles.userCard]}
                    onPress={() => router.push('/profile-edit')}
                    activeOpacity={0.9}
                >
                    <ProfileShape size={normalize.width(44)} type="green">
                        <SolarPenBold size={16} color="white" />
                    </ProfileShape>

                    <View style={[styles.userInfo, { alignItems: 'flex-start' }]}>
                        <Text style={[styles.userName, { textAlign: 'left' }]}>
                            {userData?.name || (isRTL ? 'المستخدم' : 'User')}
                        </Text>
                        {!!userData?.phone && (
                            <Text style={[styles.userPhone, { textAlign: 'left', direction: 'ltr' }]}>
                                {userData.phone}
                            </Text>
                        )}
                    </View>

                    <View style={styles.avatarWrap}>
                        <Image
                            source={getImageSrc(userData?.image || userData?.imageUrl)}
                            style={styles.avatarImg}
                        />
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
                            style={[styles.menuRow]}
                            onPress={() => {
                                if (item.action) {
                                    item.action();
                                } else if (item.route) {
                                    router.push(item.route as any);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.menuLabelText,
                                    { textAlign: 'left' },
                                    item.id === 'logout' && styles.logoutText,
                                ]}
                            >
                                {item.title}
                            </Text>
                            <ProfileShape size={normalize.width(42)} type={item.shape}>
                                {item.icon}
                            </ProfileShape>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: normalize.height(120) }} />
            </ScrollView>

            {/* Language Sheet only */}
            <LanguageSheet ref={languageSheetRef} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF' },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: normalize.width(20),
        paddingVertical: normalize.height(14),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6' },
    headerTitle: {
        fontSize: normalize.font(18),
        fontFamily: 'Alexandria-Black',
        color: '#111827' },
    scrollContent: {
        paddingHorizontal: normalize.width(20),
        paddingTop: normalize.height(16) },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: normalize.radius(24),
        padding: normalize.width(16),
        marginBottom: normalize.height(16),
        borderWidth: 1,
        borderColor: '#F3F4F6' },
    userInfo: {
        flex: 1,
        marginHorizontal: normalize.width(14) },
    userName: {
        fontSize: normalize.font(16),
        fontFamily: 'Alexandria-Black',
        color: '#111827',
        marginBottom: 2 },
    userPhone: {
        fontSize: normalize.font(13),
        fontFamily: 'Alexandria-Regular',
        color: '#6B7280' },
    avatarWrap: {
        width: normalize.width(56),
        height: normalize.width(56),
        borderRadius: normalize.width(28),
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden' },
    avatarImg: {
        width: '100%',
        height: '100%' },
    menuGroup: {
        gap: normalize.height(12),
        marginTop: normalize.height(16) },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: normalize.radius(18),
        paddingVertical: normalize.height(14),
        paddingHorizontal: normalize.width(16),
        borderWidth: 1,
        borderColor: '#F3F4F6' },
    menuLabelText: {
        flex: 1,
        fontSize: normalize.font(15),
        fontFamily: 'Alexandria-Bold',
        color: '#374151',
        marginHorizontal: normalize.width(14) },
    logoutText: {
        color: '#EF4444' } });
