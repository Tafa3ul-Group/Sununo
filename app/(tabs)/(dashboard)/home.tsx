import { HeaderSection } from '@/components/header-section';
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import { RootState } from '@/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetOwnerChaletsQuery } from '@/store/api/apiSlice';
import { getImageSrc, useImageSrc } from '@/hooks/useImageSrc';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { formatPrice } from '@/utils/format';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

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

export default function HomeScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const isOwner = userType === 'owner';
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  const toggleBalanceVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsBalanceHidden(!isBalanceHidden);
  };

  const { data: chalets, isLoading, refetch, isFetching } = useGetOwnerChaletsQuery({});

  const renderChaletCard = ({ item }: { item: any }) => {
    const mainImageSrc = getImageSrc(item.images?.[0]?.url);
    const chaletName = isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name);
    const chaletLocation = isRTL ? (item.address?.ar || item.region?.name) : (item.address?.en || item.region?.enName);

    return (
      <TouchableOpacity 
        style={styles.chaletCardHorizontal}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/(tabs)/(dashboard)/chalet-details',
            params: { id: item.id }
          });
        }}
      >
        <Image source={mainImageSrc} style={styles.chaletImageLarge} />
        <View style={styles.cardContentHorizontal}>
          <Text style={[styles.chaletTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {chaletName}
          </Text>
          <Text style={[styles.locationText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {chaletLocation}
          </Text>
          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.infoValue}>{formatPrice(item.price)} <Text style={styles.currencyText}>د.ع</Text></Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.infoValue}>{item.reviewCount || 0} {isRTL ? 'حجز' : 'Bookings'}</Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionIconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: '/(tabs)/(dashboard)/edit-chalet',
                params: { id: item.id }
              });
            }}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <HeaderSection 
          userType={userType} 
          userName={user?.name} 
          title={userType === 'owner' ? t('tabs.home') : t('tabs.myChalets')}
          showSearch={false}
          showCategories={false}
        />
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
        >
          {isLoading && !isFetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.listContent}>
              <View style={styles.dashboardHeader}>
                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.walletCard}>
                    <Text style={[styles.walletLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {isRTL ? 'رصيدك المتاح' : 'Your balance'}
                    </Text>
                    <View style={[styles.balanceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={styles.walletValue}>
                        {isBalanceHidden ? '••••••' : '2,150,000'} 
                        {!isBalanceHidden && <Text style={styles.walletCurrency}> د.ع</Text>}
                      </Text>
                      <TouchableOpacity onPress={toggleBalanceVisibility}>
                        <Ionicons 
                          name={isBalanceHidden ? "eye-off-outline" : "eye-outline"} 
                          size={24} 
                          color={Colors.text.primary} 
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <SecondaryButton
                      label={isRTL ? 'سحب الأرباح' : 'Withdraw earnings'}
                      icon="wallet-outline"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/(tabs)/(dashboard)/revenue');
                      }}
                      isActive={false}
                      style={{ height: 34 }}
                    />
                  </View>
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
                  <SecondaryButton
                    label={isRTL ? 'أضف شاليه' : 'Add Chalet'}
                    icon="plus"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push('/(tabs)/(dashboard)/add-chalet');
                    }}
                    isActive={false}
                    style={{ height: 34 }}
                  />
                </View>

                {/* Chalets Slider */}
                {chalets?.data?.length > 0 ? (
                  <FlatList
                    data={chalets.data}
                    renderItem={renderChaletCard}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chaletSliderContent}
                    snapToInterval={normalize.width(280) + 16}
                    decelerationRate="fast"
                    inverted={isRTL}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="home-alert-outline" size={80} color={Colors.text.muted} />
                    <ThemedText type="h2" style={styles.emptyText}>{t('dashboard.noChalets')}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
          </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 100,
  },
  dashboardHeader: {
    paddingBottom: 0,
  },
  statsGrid: {
    gap: 12,
    marginVertical: Spacing.md,
  },
  walletCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  walletLabel: {
    fontSize: normalize.font(14),
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  balanceRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  walletValue: {
    fontSize: normalize.font(32),
    fontWeight: '800',
    color: '#000000',
  },
  walletCurrency: {
    fontSize: normalize.font(16),
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
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    shadowOpacity: 0.03,
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
    marginTop: 24,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  chaletCardHorizontal: {
    backgroundColor: Colors.white,
    width: normalize.width(280),
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 8,
  },
  chaletSliderContent: {
    paddingRight: 12,
  },
  chaletImageLarge: {
    width: '100%',
    height: normalize.height(140),
    borderRadius: normalize.radius(16),
    backgroundColor: '#F5F5F7',
  },
  cardContentHorizontal: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  chaletTitle: {
    fontSize: normalize.font(16),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  locationText: {
    color: Colors.text.muted,
    fontSize: normalize.font(12),
    fontWeight: '400',
    marginBottom: 8,
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
  cardActions: {
    position: 'absolute',
    top: 18,
    right: 18,
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    height: 300,
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
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


