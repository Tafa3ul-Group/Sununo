import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, normalize, Shadows } from '../../constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarAltArrowRightBold, SolarBellBold } from "@/components/icons/solar-icons";
import { useRouter } from 'expo-router';
import { HeaderSection } from '@/components/header-section';
import { EmptyState } from '@/components/ui/empty-state';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '@/store/api/customerApiSlice';
import { useDirection } from '@/i18n';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);


const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  redirectType?: string;
  redirectId?: string;
}

interface NotificationItemProps {
  item: Notification;
  index: number;
  isArabic: boolean;
  textStart: "left" | "right";
  dirStyle: 'rtl' | 'ltr';
  onPress: (item: Notification) => void;
}

const NotificationItem = React.memo(({ item, index, isArabic, textStart, dirStyle, onPress }: NotificationItemProps) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View entering={FadeInDown.delay((index % 8) * 60).duration(380)} style={animatedStyle}>
            <AnimatedTouchable
                style={[styles.notificationCard, { flexDirection: 'row', direction: isArabic ? 'rtl' : 'ltr' }]}
                onPressIn={() => { scale.value = withTiming(0.96, { duration: 110 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 220 }); }}
                onPress={() => { Haptics.selectionAsync(); onPress(item); }}
                activeOpacity={0.7}
            >
                {/* Unread indicator dot */}
                <View style={styles.dotContainer}>
                    {!item.isRead && <View style={styles.orangeDot} />}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Title row: title + time */}
                    <View style={[styles.titleRow, { flexDirection: 'row', direction: isArabic ? 'rtl' : 'ltr' }]}>
                        <ThemedText style={[styles.titleText, { textAlign: textStart, writingDirection: dirStyle }]} numberOfLines={1}>
                            {item.title}
                        </ThemedText>
                        <ThemedText style={styles.timeText}>{item.time}</ThemedText>
                    </View>

                    {/* Message */}
                    <ThemedText style={[styles.messageText, { textAlign: textStart, writingDirection: dirStyle }]} numberOfLines={2}>
                        {item.message}
                    </ThemedText>
                </View>
            </AnimatedTouchable>
        </Animated.View>
    );
});
NotificationItem.displayName = 'NotificationItem';

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const router = useRouter();

    const { isRTL, textAlign } = useDirection();
    const isArabic = isRTL;
    const textStart: "left" | "right" = textAlign;

    // Fetch notifications from the backend
    const { data: notificationsResponse, isLoading, refetch } = useGetNotificationsQuery({ page: 1, limit: 50 });
    const [markAsRead] = useMarkNotificationAsReadMutation();

    // Pre-process: transform API data + format times once per item
    const formattedNotifs = useMemo<(Notification & { notifDate: string })[]>(() => {
      const items: any[] = notificationsResponse?.data || [];
      return items.map((item: any): Notification & { notifDate: string } => ({
        id: item.id,
        title: item.title || t('notifications.newNotification'),
        message: item.text || item.body || item.message || '',
        time: new Date(item.createdAt).toLocaleTimeString(isArabic ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' }),
        isRead: !!item.readAt || !!item.isRead,
        redirectType: item.redirectType,
        redirectId: item.redirectId,
        notifDate: new Date(item.createdAt).toDateString(),
      }));
    }, [notificationsResponse, isArabic, t]);

    // Group pre-formatted notifications by date
    const groupedNotifications = useMemo(() => {
      const today: Notification[] = [];
      const yesterday: Notification[] = [];
      const older: Notification[] = [];
      const now = new Date();
      const todayStr = now.toDateString();
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toDateString();

      formattedNotifs.forEach(({ notifDate, ...notif }) => {
        if (notifDate === todayStr) {
          today.push(notif);
        } else if (notifDate === yesterdayStr) {
          yesterday.push(notif);
        } else {
          older.push(notif);
        }
      });

      return { today, yesterday, older };
    }, [formattedNotifs]);
    const handleNotificationPress = (item: Notification) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }

        // Navigate based on notification redirect type
        if (item.redirectType === 'booking' && item.redirectId) {
            router.push({ pathname: '/(tabs)/(customer)/booking-success', params: { id: item.redirectId } });
        } else if (item.redirectType === 'payout' && item.redirectId) {
            // Opens the in-app withdrawal confirmation (نعم/لا) screen.
            router.push(`/payout-confirm/${item.redirectId}`);
        } else if (item.redirectType === 'wallet') {
            router.push('/(tabs)/(customer)/profile');
        }
    };

    const dirStyle = useMemo<'rtl' | 'ltr'>(() => (isArabic ? 'rtl' : 'ltr'), [isArabic]);

    const renderItem = useCallback((item: Notification, index: number) => (
        <NotificationItem
            key={item.id}
            item={item}
            index={index}
            isArabic={isArabic}
            textStart={textStart}
            dirStyle={dirStyle}
            onPress={handleNotificationPress}
        />
    ), [isArabic, textStart, dirStyle]);

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
                        <View style={styles.sectionHeader}>
                            <ThemedText style={[styles.sectionTitle, { textAlign: textStart, writingDirection: dirStyle }]}>
                                {t('notifications.today')}
                            </ThemedText>
                        </View>
                        {groupedNotifications.today.map(renderItem)}
                    </>
                )}

                {/* Yesterday Section */}
                {groupedNotifications.yesterday.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <ThemedText style={[styles.sectionTitle, { textAlign: textStart, writingDirection: dirStyle }]}>
                                {t('notifications.yesterday')}
                            </ThemedText>
                        </View>
                        {groupedNotifications.yesterday.map(renderItem)}
                    </>
                )}

                {/* Older Section */}
                {groupedNotifications.older.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <ThemedText style={[styles.sectionTitle, { textAlign: textStart, writingDirection: dirStyle }]}>
                                {t('notifications.older') || (isArabic ? 'أقدم' : 'Older')}
                            </ThemedText>
                        </View>
                        {groupedNotifications.older.map(renderItem)}
                    </>
                )}

                {/* Empty state */}
                {!isLoading && groupedNotifications.today.length === 0 && groupedNotifications.yesterday.length === 0 && groupedNotifications.older.length === 0 && (
                    <EmptyState
                        icon={<SolarBellBold size={normalize.width(80)} color={Colors.text.muted} />}
                        title={t('notifications.empty')}
                        description={t('notifications.emptyDesc')}
                        style={{ paddingTop: normalize.height(80) }}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: "Alexandria-Medium",
        color: '#9CA3AF',
    },
    notificationCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'flex-start',
    },
    dotContainer: {
        width: 10,
        paddingTop: 4,
        alignItems: 'center',
    },
    orangeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4500',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    cardContent: {
        flex: 1,
        marginHorizontal: 8,
    },
    titleText: {
        fontSize: 12,
        fontFamily: "Alexandria-Medium",
        color: '#111827',
        flex: 1,
    },
    timeText: {
        fontSize: 10,
        color: '#9CA3AF',
        fontFamily: "Alexandria-Medium",
        marginHorizontal: 6,
    },
    messageText: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: "Alexandria-Medium",
        lineHeight: 16,
    },
});
