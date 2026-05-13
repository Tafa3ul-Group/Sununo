import { useTranslation } from 'react-i18next';
import { StyleSheet, View, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { CircleBackButton } from '@/components/ui/circle-back-button';
import { useRouter } from 'expo-router';
import { useGetNotificationsQuery } from '@/store/api/apiSlice';
import { useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Notification {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  type: string;
  redirectType?: string;
  redirectId?: string;
}

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const { language } = useSelector((state: RootState) => state.auth);
    const isRTL = language === 'ar';
    const router = useRouter();
    const [page, setPage] = useState(1);

    const { data: response, isLoading, isFetching, refetch } = useGetNotificationsQuery({
        page,
        limit: 15,
    });

    const notifications = response?.data || [];

    const handleLoadMore = () => {
        if (response?.meta && page < response.meta.totalPages && !isFetching) {
            setPage(prev => prev + 1);
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const date = new Date(item.createdAt);
        const timeStr = date.toLocaleTimeString(isRTL ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        return (
            <View key={item.id} style={[styles.notificationCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {/* Content section */}
                <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <ThemedText style={[styles.titleText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</ThemedText>
                    <ThemedText style={[styles.messageText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.text}</ThemedText>
                </View>

                {/* Header section with orange dot and time */}
                <View style={[styles.cardLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <ThemedText style={styles.timeText}>{timeStr}</ThemedText>
                    {!item.readAt && <View style={styles.orangeDot} />}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <ThemedText style={styles.headerTitle}>{t('headers.notifications')}</ThemedText>
                    <CircleBackButton
                        style={[styles.backButton, isRTL ? { right: 0 } : { left: 0 }]}
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
        backgroundColor: 'white',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'white',
    },
    headerInner: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 48,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Alexandria-Black",
        color: '#111827',
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
        borderColor: '#F3F4F6',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    centerContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 100
    },
    emptyText: {
        color: '#9CA3AF', 
        fontFamily: 'Alexandria-Medium'
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 24, // Very rounded
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orangeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF4500', // Solid orange as in image
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: "Alexandria-SemiBold",
    },
    cardContent: {
        flex: 1,
    },
    titleText: {
        fontSize: 16,
        fontFamily: "Alexandria-Black",
        color: '#111827',
        marginBottom: 2,
    },
    messageText: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
        fontFamily: "Alexandria-Regular"
    }
});
