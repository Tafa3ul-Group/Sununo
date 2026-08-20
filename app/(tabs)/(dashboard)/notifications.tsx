import { ThemedText } from '@/components/themed-text';
import { CircleBackButton } from '@/components/ui/circle-back-button';
import { Colors, Shadows } from '@/constants/theme';
import { useDirection } from "@/i18n";
import { RootState } from '@/store';
import { useGetNotificationsQuery, useMarkAllNotificationsAsReadMutation, useMarkNotificationAsReadMutation } from '@/store/api/customerApiSlice';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { selectAccountType, switchMode } from '@/store/authSlice';
import { activeSection, resolveNotificationSection } from '@/utils/notification-section';

interface Notification {
    id: string;
    title: string;
    text: string;
    createdAt: string;
    readAt: string | null;
    type: string;
    redirectType?: string;
    redirectId?: string;
    redirectRole?: string;
}

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const { isRTL, textAlign } = useDirection();
    const dispatch = useDispatch();
    const { userType } = useSelector((state: RootState) => state.auth);
    const accountType = useSelector(selectAccountType);
    const router = useRouter();
    const [page, setPage] = useState(1);
    // Pages are accumulated here rather than in the RTK Query cache: the
    // notifications endpoint has no `merge`, so each page REPLACES the previous
    // one in `response.data`. Keeping the running list locally lets the loaded
    // pages stay on screen while the query still fetches page-by-page.
    const [items, setItems] = useState<Notification[]>([]);
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

    const handleMarkAllRead = useCallback(() => {
        Haptics.selectionAsync();
        // Same reasoning as the per-row patch in handleNotificationPress: the
        // list is accumulated locally across pages, so clear the dots here too
        // — the mutation's cache patch only reaches the RTK Query pages.
        const readAt = new Date().toISOString();
        setItems(prev => prev.map(n => (n.readAt ? n : { ...n, readAt })));
        markAllAsRead();
    }, [markAllAsRead]);

    const handleNotificationPress = useCallback((item: Notification) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Mark as read. The list is accumulated locally across pages, and the
        // tag invalidation only refetches the page currently being queried, so
        // clear the unread dot here too — otherwise a row from an earlier page
        // keeps its dot until the screen is refreshed from page 1.
        if (!item.readAt) {
            const readAt = new Date().toISOString();
            setItems(prev => prev.map(n => (n.id === item.id ? { ...n, readAt } : n)));
            markAsRead(item.id).catch(() => {});
        }

        // The sender says which side this belongs to; switch there first or the
        // destination's own guard bounces the tap straight back.
        const target = resolveNotificationSection(item.redirectRole, userType, accountType);
        if (target !== userType && userType !== 'guest') {
            dispatch(switchMode(target));
        }

        // Navigate based on redirectType and the target section
        if (item.redirectType === 'booking' && item.redirectId) {
            if (target === 'owner') {
                router.push({ pathname: '/(dashboard)/booking-details', params: { id: item.redirectId } });
            } else {
                router.push({ pathname: '/(tabs)/(customer)/booking-success', params: { id: item.redirectId } });
            }
        } else if (item.redirectType === 'chalet' && item.redirectId) {
            // Public chalet page for both roles — matches the push-tap handler
            // in app/_layout.tsx so the tap lands in the same place either way.
            router.push(`/chalet-details/${item.redirectId}`);
        } else if (item.redirectType === 'review' && item.redirectId) {
            // Booking completed → chalet page with the review sheet auto-opened
            // (redirectId is the CHALET id).
            router.push(`/chalet-details/${item.redirectId}?openReview=1`);
        } else if (item.redirectType === 'payout') {
            // Opens the in-app withdrawal confirmation (نعم/لا) screen.
            if (item.redirectId) router.push(`/payout-confirm/${item.redirectId}`);
            else router.push(target === 'owner' ? '/(tabs)/(dashboard)/home' : '/(tabs)/(customer)/profile');
        }
    }, [userType, accountType, dispatch, router, markAsRead]);

    const { data: response, isLoading, isFetching, refetch } = useGetNotificationsQuery({
        page,
        limit: 15,
        role: activeSection(userType),
    });

    useEffect(() => {
        // While a new page is in flight RTK Query reports `data: undefined`
        // (each page is its own cache key) — keep what is already on screen.
        if (!response) return;
        const pageItems: Notification[] = response.data || [];
        setItems(prev => {
            // Page 1 is the source of truth after a pull-to-refresh.
            if (page === 1) return pageItems;
            // A refetch of the current page (e.g. after mark-as-read) must
            // update the rows already on screen, not duplicate them.
            const fresh = new Map(pageItems.map(n => [n.id, n]));
            const merged = prev.map(n => fresh.get(n.id) ?? n);
            const known = new Set(prev.map(n => n.id));
            return [...merged, ...pageItems.filter(n => !known.has(n.id))];
        });
    }, [response, page]);

    const notifications = items;

    const handleLoadMore = () => {
        // The API's shared pagination helper (utils/pagination.ts ReturnPagination)
        // emits { page, limit, total, lastPage, hasNext, hasPrev } — there is no
        // `totalPages` on this endpoint, so the old `page < meta.totalPages`
        // compared against undefined and never advanced past the first page.
        // `totalPages` is kept as a fallback in case the endpoint is ever
        // aligned with the hand-rolled ones (bookings, chalets, payouts…).
        const meta = response?.meta;
        if (!meta || isFetching) return;
        const lastPage = Number(meta.lastPage ?? meta.totalPages ?? 0);
        const hasNext = typeof meta.hasNext === 'boolean' ? meta.hasNext : page < lastPage;
        if (hasNext) setPage(prev => prev + 1);
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const date = new Date(item.createdAt);
        const timeStr = date.toLocaleTimeString(isRTL ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.notificationCard, { flexDirection: 'row' }]}
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(item)}
            >
                {/* Content section */}
                <View style={[styles.cardContent, { alignItems: 'flex-start' }]}>
                    <ThemedText style={[styles.titleText, { textAlign }]}>{item.title}</ThemedText>
                    <ThemedText style={[styles.messageText, { textAlign }]}>{item.text}</ThemedText>
                </View>

                {/* Header section with orange dot and time */}
                <View style={[styles.cardLeft, { flexDirection: 'row' }]}>
                    <ThemedText style={styles.timeText}>{timeStr}</ThemedText>
                    {!item.readAt && <View style={styles.orangeDot} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerInner, { flexDirection: 'row' }]}>
                    <ThemedText style={styles.headerTitle}>{t('headers.notifications')}</ThemedText>
                    <CircleBackButton
                        // The back button belongs on the start side (right in
                        // Arabic) — matching every other header and the
                        // direction its arrow points.
                        style={[styles.backButton, { start: 0 }]}
                        onPress={() => router.back()}
                    />
                </View>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    notifications.some(n => !n.readAt) ? (
                        <TouchableOpacity
                            style={styles.markAllButton}
                            onPress={handleMarkAllRead}
                            activeOpacity={0.6}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <ThemedText style={styles.markAllText}>
                                {t('notifications.markAllRead')}
                            </ThemedText>
                        </TouchableOpacity>
                    ) : null
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl refreshing={isFetching && page === 1} onRefresh={() => { setPage(1); refetch(); }} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <Animated.View entering={FadeIn.duration(300)} style={styles.centerContainer}>
                            <ThemedText style={styles.emptyText}>
                                {isRTL ? 'لا توجد إشعارات حالياً' : 'No notifications found'}
                            </ThemedText>
                        </Animated.View>
                    )
                }
                ListFooterComponent={() => {
                    if (isFetching && page > 1) {
                        return <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />;
                    }
                    return null;
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'white'
    },
    headerInner: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 48
    },
    headerTitle: {
        fontSize: 14,
        fontFamily: "Alexandria-Medium",
        color: '#111827'
    },
    backButton: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.small,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    scrollContent: {
        paddingHorizontal: 20,
        // Clears the floating dashboard tab bar, which overlays the list.
        paddingBottom: 120,
        paddingTop: 10
    },
    markAllButton: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },
    markAllText: {
        fontSize: 11,
        fontFamily: 'Alexandria-Medium',
        color: Colors.primary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100
    },
    emptyText: {
        color: '#9CA3AF',
        fontFamily: "Alexandria-Medium"
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 24, // Very rounded
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center'
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    orangeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4500', // Solid orange as in image
    },
    timeText: {
        fontSize: 8,
        color: '#9CA3AF',
        fontFamily: "Alexandria-Medium"
    },
    cardContent: {
        flex: 1
    },
    titleText: {
        fontSize: 14,
        fontFamily: "Alexandria-Medium",
        color: '#111827',
        marginBottom: 2
    },
    messageText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
        fontFamily: "Alexandria-Medium"
    }
});
