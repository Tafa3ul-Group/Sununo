import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';


import { useRouter } from 'expo-router';
import { useGetOwnerChaletsQuery } from '@/store/api/apiSlice';
import { ActivityIndicator, RefreshControl, Alert, ScrollView, Text as RNText } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// Mock data for dashboard highlights
const RECENT_BOOKINGS = [
  {
    id: '1',
    customer: 'أحمد علي',
    chalet: 'شاليه اللؤلؤة',
    date: 'اليوم، 04:30 م',
    price: '150,000 د.ع',
    status: 'new'
  },
  {
    id: '2',
    customer: 'سارة خالد',
    chalet: 'إستراحة اليرموك',
    date: 'أمس، 09:15 ص',
    price: '100,000 د.ع',
    status: 'confirmed'
  }
];

export default function MyChaletsScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const { data: chalets, isLoading, refetch, isFetching } = useGetOwnerChaletsQuery({});

  const renderChaletItem = ({ item }: { item: any }) => {
    const mainImage = item.images?.[0]?.url 
      ? `https://k4wwso0cwg480c480oo0owg4.rakiza.dev/api/v1/chalets/images/${item.images[0].url}` 
      : 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400';

    const chaletName = isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name);
    const chaletLocation = isRTL ? (item.address?.ar || item.region?.name) : (item.address?.en || item.region?.enName);

    const renderRightActions = (id: string, name: string) => {
      return (
        <View style={[styles.swipeActions, { flexDirection: isRTL ? 'row' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.swipeAction, { backgroundColor: '#F5F5F7' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              console.log('Edit', id);
            }}
          >
            <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
            <Text style={[styles.swipeActionText, { color: Colors.text.primary }]}>{isRTL ? 'تعديل' : 'Edit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.swipeAction, { backgroundColor: '#FFF5F5' }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert(
                isRTL ? 'حذف الشاليه' : 'Delete Chalet',
                isRTL ? `هل أنت متأكد من حذف "${name}"؟` : `Are you sure you want to delete "${name}"?`,
                [
                  { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
                  { text: isRTL ? 'حذف' : 'Delete', style: 'destructive', onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    console.log('Delete', id);
                  }}
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.swipeActionText, { color: '#FF3B30' }]}>{isRTL ? 'حذف' : 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Swipeable
        renderRightActions={!isRTL ? () => renderRightActions(item.id, chaletName) : undefined}
        renderLeftActions={isRTL ? () => renderRightActions(item.id, chaletName) : undefined}
        onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        friction={2}
        containerStyle={styles.swipeableContainer}
      >
        <TouchableOpacity 
          style={[styles.chaletCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          activeOpacity={0.6}
          onPress={() => console.log('View Chalet Details', item.id)}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: mainImage }} style={styles.chaletImage} />
            {item.isActive ? (
              <View style={styles.activeDot} />
            ) : (
              <View style={[styles.activeDot, { backgroundColor: '#D1D1D6' }]} />
            )}
          </View>

          <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.chaletTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {chaletName}
              </Text>
              {item.isApproved === false && (
                <View style={styles.pendingDot} />
              )}
            </View>
            
            <Text style={[styles.locationText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {chaletLocation}
            </Text>

            <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.infoValue}>{item.price?.toLocaleString()} <Text style={styles.currencyText}>د.ع</Text></Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.infoValue}>{item.reviewCount || 0} {isRTL ? 'حجز' : 'Bookings'}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.btnRevenueCompact}
            onPress={() => router.push('/(tabs)/(dashboard)/revenue')}
          >
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <HeaderSection 
          userType={userType} 
          userName={user?.name} 
          title={t('tabs.myChalets')}
          showSearch={false}
          showCategories={false}
        />
        <View style={styles.container}>

          {isLoading && !isFetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlashList
              data={chalets?.data}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderChaletItem}
              estimatedItemSize={110}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.primary} />
              }
              ListHeaderComponent={() => (
                <View style={styles.dashboardHeader}>
                  {/* Quick Stats Grid */}
                  <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity 
                      style={styles.statCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(tabs)/(dashboard)/revenue');
                      }}
                    >
                      <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="wallet-outline" size={20} color="#2E7D32" />
                      </View>
                      <Text style={styles.statLabel}>{t('dashboard.revenue.balance')}</Text>
                      <Text style={styles.statValue}>2.1M <Text style={styles.currency}>د.ع</Text></Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.statCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(tabs)/(dashboard)/bookings');
                      }}
                    >
                      <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="calendar-outline" size={20} color="#1565C0" />
                      </View>
                      <Text style={styles.statLabel}>{isRTL ? 'حجوزات نشطة' : 'Active Bookings'}</Text>
                      <Text style={styles.statValue}>12</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Latest Bookings Section */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{isRTL ? 'أحدث الحجوزات' : 'Latest Bookings'}</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/(dashboard)/bookings')}>
                      <Text style={styles.viewAll}>{t('dashboard.viewAll')}</Text>
                    </TouchableOpacity>
                  </View>

                  {RECENT_BOOKINGS.map((booking) => (
                    <TouchableOpacity 
                      key={booking.id} 
                      style={[styles.bookingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => router.push('/(tabs)/(dashboard)/bookings')}
                    >
                      <View style={[styles.bookingAvatar, { backgroundColor: booking.status === 'new' ? Colors.primary + '10' : '#F2F2F7' }]}>
                        <Text style={[styles.avatarText, { color: booking.status === 'new' ? Colors.primary : Colors.text.primary }]}>
                          {booking.customer[0]}
                        </Text>
                      </View>
                      <View style={[styles.bookingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.bookingCustomer}>{booking.customer}</Text>
                        <Text style={styles.bookingChalet} numberOfLines={1}>{booking.chalet}</Text>
                        <Text style={styles.bookingDate}>{booking.date}</Text>
                      </View>
                      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                        <Text style={styles.bookingPrice}>{booking.price}</Text>
                        {booking.status === 'new' && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>{isRTL ? 'جديد' : 'New'}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Chalets Section Title */}
                  <View style={[styles.listHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: normalize.font(16) }}>
                      {isRTL ? 'شاليهاتي' : 'My Chalets'} ({chalets?.data?.length || 0})
                    </ThemedText>
                    <TouchableOpacity 
                      style={[styles.addButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/(tabs)/(dashboard)/add-chalet');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle" size={18} color={Colors.white} />
                      <Text style={styles.addButtonText}>{isRTL ? 'أضف' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="home-alert-outline" size={80} color={Colors.text.muted} />
                  <ThemedText type="h2" style={styles.emptyText}>{t('dashboard.noChalets')}</ThemedText>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  dashboardHeader: {
    paddingBottom: Spacing.md,
  },
  statsGrid: {
    gap: 12,
    marginVertical: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border + '80',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: normalize.font(18),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  currency: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  viewAll: {
    fontSize: normalize.font(12),
    color: Colors.primary,
    fontWeight: '600',
  },
  bookingItem: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border + '50',
  },
  bookingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: normalize.font(16),
    fontWeight: '700',
  },
  bookingInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  bookingCustomer: {
    fontSize: normalize.font(14),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bookingChalet: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    marginTop: 1,
  },
  bookingDate: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    marginTop: 2,
  },
  bookingPrice: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.primary,
  },
  newBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: normalize.font(9),
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  ownerContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  chaletCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: normalize.radius(16),
    borderWidth: 1,
    borderColor: Colors.border + '80',
  },
  swipeableContainer: {
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    width: normalize.width(64),
    height: normalize.width(64),
    borderRadius: normalize.radius(12),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F7',
  },
  chaletImage: {
    width: '100%',
    height: '100%',
  },
  activeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: '#34C759',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  titleRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  chaletTitle: {
    fontSize: normalize.font(16),
    fontWeight: '600',
    color: Colors.text.primary,
    flexShrink: 1,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9500',
  },
  locationText: {
    color: Colors.text.muted,
    fontSize: normalize.font(12),
    fontWeight: '400',
    marginBottom: 6,
  },
  infoRow: {
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: normalize.font(13),
    fontWeight: '500',
    color: Colors.text.primary,
  },
  currencyText: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontWeight: '400',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
  },
  btnRevenueCompact: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  swipeActions: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: normalize.radius(16),
    overflow: 'hidden',
  },
  swipeAction: {
    width: 74,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  swipeActionText: {
    fontSize: normalize.font(10),
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: normalize.font(12),
  },
  emptyContainer: {
    flex: 1,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

