import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows } from '../../constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarAltArrowRightBold } from "@/components/icons/solar-icons";
import { useRouter } from 'expo-router';
import { HeaderSection } from '@/components/header-section';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '@/store/api/customerApiSlice';
import { isRTL, getFlexDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const { language } = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    const isArabic = language === "ar";
    const textStart: "left" | "right" = isArabic ? "right" : "left";

    // Fetch notifications from the backend
    const { data: notificationsResponse, isLoading, refetch } = useGetNotificationsQuery({ page: 1, limit: 50 });
    const [markAsRead] = useMarkNotificationAsReadMutation();

    // Transform API data and group by date
    const groupedNotifications = useMemo(() => {
      const items = notificationsResponse?.data || [];
      const today: Notification[] = [];
      const yesterday: Notification[] = [];
      const older: Notification[] = [];
      const now = new Date();
      const todayStr = now.toDateString();
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toDateString();

      items.forEach((item: any) => {
        const notif: Notification = {
          id: item.id,
          title: item.title || t('notifications.newNotification'),
          message: item.body || item.message || '',
          time: new Date(item.createdAt).toLocaleTimeString(isRTL ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }),
          isRead: item.isRead || false };

        const notifDate = new Date(item.createdAt).toDateString();
        if (notifDate === todayStr) {
          today.push(notif);
        } else if (notifDate === yesterdayStr) {
          yesterday.push(notif);
        } else {
          older.push(notif);
        }
      });

      return { today, yesterday, older };
    }, [notificationsResponse, isArabic, t]);
    const handleNotificationPress = (item: Notification) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }
    };

    const renderItem = (item: Notification) => (
        <TouchableOpacity 
            key={item.id} 
            style={[styles.notificationCard, { flexDirection: getFlexDirection(isArabic) }]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            {/* Content section */}
            <View style={[styles.cardContent, { alignItems: 'flex-start' }]}>
                <ThemedText style={[styles.titleText, { textAlign: textStart }]}>{item.title}</ThemedText>
                <ThemedText style={[styles.messageText, { textAlign: textStart }]}>{item.message}</ThemedText>
            </View>

            {/* Header section with orange dot and time */}
            <View style={[styles.cardLeft, { flexDirection: getFlexDirection(isArabic) }]}>
                <ThemedText style={styles.timeText}>{item.time}</ThemedText>
                {!item.isRead && <View style={styles.orangeDot} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <HeaderSection 
                title={t('headers.notifications')} 
                showBackButton 
                showLogo={false} 
            />

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
            >
                {/* Today Section */}
                {groupedNotifications.today.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
                            <ThemedText style={styles.sectionTitle}>{t('notifications.today')}</ThemedText>
                        </View>
                        {groupedNotifications.today.map(renderItem)}
                    </>
                )}

                {/* Yesterday Section */}
                {groupedNotifications.yesterday.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
                            <ThemedText style={styles.sectionTitle}>{t('notifications.yesterday')}</ThemedText>
                        </View>
                        {groupedNotifications.yesterday.map(renderItem)}
                    </>
                )}

                {/* Older Section */}
                {groupedNotifications.older.length > 0 && (
                    <>
                        <View style={[styles.sectionHeader, { alignItems: 'flex-start' }]}>
                            <ThemedText style={styles.sectionTitle}>{t('notifications.older') || (isRTL ? 'أقدم' : 'Older')}</ThemedText>
                        </View>
                        {groupedNotifications.older.map(renderItem)}
                    </>
                )}

                {/* Empty state */}
                {!isLoading && groupedNotifications.today.length === 0 && groupedNotifications.yesterday.length === 0 && groupedNotifications.older.length === 0 && (
                    <View style={{ alignItems: 'center', paddingTop: 80 }}>
                        <ThemedText style={{ fontSize: 14, color: '#9CA3AF', fontFamily: "Alexandria-Medium" }}>
                            {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
                        </ThemedText>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white' },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40 },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 10 },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "Alexandria-Medium",
        color: '#9CA3AF' },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center' },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8 },
    orangeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4500' },
    timeText: {
        fontSize: 8,
        color: '#9CA3AF',
        fontFamily: "Alexandria-Medium" },
    cardContent: {
        flex: 1 },
    titleText: {
        fontSize: 14,
        fontFamily: "Alexandria-Medium",
        color: '#111827' },
    messageText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
     fontFamily: "Alexandria-Medium" }
});
