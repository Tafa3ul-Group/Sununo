import { HeaderSection } from '@/components/header-section';
import { SolarIcon } from '@/components/ui/solar-icon';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import { useGetOwnerChaletsQuery, useGetProviderBookingsQuery, useGetProviderProfileQuery } from '@/store/api/apiSlice';
import { formatPrice } from '@/utils/format';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { BookingDetailsModalContent } from '@/components/booking-details-modal-content';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const isOwner = userType === 'owner';
  const [activeFilter, setActiveFilter] = useState('all');
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const detailsSheetRef = React.useRef<BottomSheetModal>(null);


  // API hooks
  const { data: chalets, isLoading, refetch, isFetching } = useGetOwnerChaletsQuery({});
  const { data: profileResponse } = useGetProviderProfileQuery(undefined);

  const statusMap: Record<string, string> = {
    pending: 'pending_payment',
    confirmed: 'confirmed',
    finished: 'completed',
  };

  const { data: bookingsResponse, isFetching: isBookingsFetching } = useGetProviderBookingsQuery({
    limit: 5,
    status: activeFilter !== 'all' ? statusMap[activeFilter] : undefined
  });

  const profile = profileResponse?.data || profileResponse;
  const recentBookings = bookingsResponse?.data || bookingsResponse || [];
  const walletBalance = profile?.walletBalance ?? user?.walletBalance ?? 0;

  const handleToggleBalance = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isBalanceVisible) {
      // Just hide it
      setIsBalanceVisible(false);
      return;
    }

    // Authenticate to show
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) {
      // Fallback: show directly if no biometrics available
      setIsBalanceVisible(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: isRTL ? 'تحقق من هويتك لعرض الرصيد' : 'Verify identity to show balance',
      cancelLabel: isRTL ? 'إلغاء' : 'Cancel',
      fallbackLabel: isRTL ? 'استخدم رمز المرور' : 'Use Passcode',
    });

    if (result.success) {
      setIsBalanceVisible(true);
    }
  };


  const renderChaletCard = (item: any) => {
    const mainImageSrc = getImageSrc(item.images?.[0]?.url);
    const chaletName = isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name);
    const chaletLocation = isRTL ? (item.address?.ar || item.region?.name) : (item.address?.en || item.region?.enName);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.chaletCard}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/(tabs)/(dashboard)/chalet-details',
            params: { id: item.id }
          });
        }}
      >
        <View style={[styles.chaletCardInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Image */}
          <View style={styles.chaletImageWrap}>
            <Image source={mainImageSrc} style={styles.chaletImage} />
            {/* Status indicator */}
            <View style={[styles.statusIndicator, { backgroundColor: item.isApproved ? '#10B981' : '#F59E0B' }]} />
          </View>

          {/* Info */}
          <View style={[styles.chaletInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.chaletName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {chaletName}
            </Text>
            <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="location-outline" size={12} color={Colors.primary} />
              <Text style={styles.locationLabel} numberOfLines={1}>{chaletLocation}</Text>
            </View>

            {/* Stat chips row */}
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.statChip, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="cash-multiple" size={12} color="#10B981" />
                <Text style={[styles.statChipText, { color: '#10B981' }]}>{formatPrice(item.price)}</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="calendar-check" size={12} color={Colors.primary} />
                <Text style={[styles.statChipText, { color: Colors.primary }]}>{item.reviewCount || 0}</Text>
              </View>
              {item.maxGuests && (
                <View style={[styles.statChip, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="people-outline" size={12} color="#F97316" />
                  <Text style={[styles.statChipText, { color: '#F97316' }]}>{item.maxGuests}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: item.id } });
            }}
          >
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBookingCard = (item: any) => {
    const customerName = item.customer?.name || t('common.user');
    const shiftName = isRTL ? (item.shift?.name?.ar || item.shift?.name) : (item.shift?.name?.en || item.shift?.name);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.modernBookingCard}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedBookingId(item.id);
          detailsSheetRef.current?.present();
        }}
      >
        <View style={[styles.modernBookingInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* 1. Avatar (Right part in RTL) */}
          <View style={styles.modernBookingAvatar}>
            {item.customer?.image ? (
              <Image source={{ uri: item.customer.image }} style={styles.modernBookingImg} />
            ) : (
              <View style={styles.modernBookingPlaceholder}>
                <SolarIcon name="user-linear" size={24} color="#CBD5E1" />
              </View>
            )}
          </View>

          {/* 2. Info (Name and Shift) */}
          <View style={[styles.modernBookingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.modernBookingName, { textAlign: isRTL ? 'right' : 'left' }]}>{customerName}</Text>
            <Text style={[styles.modernBookingShift, { textAlign: isRTL ? 'right' : 'left' }]}>{t('common.shift')} {shiftName}</Text>
          </View>

          {/* 3. Price (Left part in RTL) */}
          <View style={styles.modernBookingPriceWrap}>
            <Text style={styles.modernBookingPrice}>
              {Number(item.totalPrice).toLocaleString()} {t('common.iqd')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBackdrop = React.useCallback((props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
  ), []);

  const renderFilterButton = (filter: { id: string; label: string; icon?: string }) => {
    const isActive = activeFilter === filter.id;
    const isAll = filter.id === 'all';

    return (
      <View key={filter.id} style={{ transform: [{ scale: 0.92 }] }}>
        {isAll ? (
          <PrimaryButton
            label={filter.label}
            isActive={isActive}
            onPress={() => setActiveFilter(filter.id)}
          />
        ) : (
          <SecondaryButton
            label={filter.label}
            isActive={isActive}
            icon={filter.icon as any}
            onPress={() => setActiveFilter(filter.id)}
          />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <HeaderSection
          userType={userType}
          userName={user?.name}
          showSearch={false}
          showCategories={false}
          showProfile={true}
          showLogo={true}
          extraIcon="search"
          onExtraIconPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          marginBottom={4}
        />
        <View style={{ flex: 1 }}>
          {isLoading && !isFetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Fixed Section: Header + Filter */}
              <View style={styles.fixedHeaderArea}>
                <View style={[styles.bookingsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.bookingsTitle}>{t('dashboard.recentBookings')}</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/(dashboard)/bookings')}>
                    <Text style={styles.bookingsViewAll}>
                      {t('dashboard.viewAll')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Filter Bar */}
                <View style={styles.filterWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={[styles.filterContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  >
                    {[
                      { id: 'all', label: t('home.categories.all') },
                      { id: 'pending', label: t('dashboard.bookings.new'), icon: 'clock-outline' },
                      { id: 'confirmed', label: t('dashboard.bookings.confirmed'), icon: 'check-decagram-outline' },
                      { id: 'finished', label: t('dashboard.bookings.finished'), icon: 'calendar-check-outline' },
                    ].map(renderFilterButton)}
                  </ScrollView>
                </View>
              </View>

              {/* Scrollable Section: Only Cards */}
              <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.primary} />
                }
              >
                <View style={styles.bookingList}>
                  {isBookingsFetching && !recentBookings.length ? (
                    <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                  ) : recentBookings.length > 0 ? (
                    recentBookings.map(renderBookingCard)
                  ) : (
                    <View style={styles.noBookings}>
                      <Text style={styles.noBookingsText}>{t('dashboard.noBookings') || (isRTL ? 'لا توجد حجوزات حالياً' : 'No bookings found')}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Booking Details Drawer */}
        <BottomSheetModal
          ref={detailsSheetRef}
          snapPoints={['85%']}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
          onDismiss={() => setSelectedBookingId(null)}
        >
          <BottomSheetView style={{ flex: 1 }}>
            {selectedBookingId && (
              <BookingDetailsModalContent
                id={selectedBookingId}
                isRTL={isRTL}
                t={t}
                onRefresh={refetch}
                onClose={() => detailsSheetRef.current?.dismiss()}
              />
            )}
          </BottomSheetView>
        </BottomSheetModal>
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
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Wallet Card
  walletCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  walletCardInner: {
    backgroundColor: Colors.primary,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle1: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  decorCircle2: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -20,
  },
  walletTop: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: normalize.font(12),
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  walletAmountRow: {
    alignItems: 'baseline',
  },
  walletValue: {
    color: Colors.white,
    fontSize: normalize.font(32),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  walletCurrency: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize.font(14),
    fontWeight: '600',
  },
  eyeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletActions: {
    gap: 10,
  },
  walletActionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  walletActionText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: normalize.font(13),
  },

  // Section Header
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: normalize.font(13),
    fontWeight: '600',
  },
  // Booking Cards
  bookingCard: {
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bookingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: normalize.font(18),
    fontWeight: '700',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 1,
  },
  bookingChalet: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontWeight: '500',
  },
  bookingDate: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  bookingAmount: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  bookingCurrency: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  bookingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookingStatusText: {
    fontSize: normalize.font(9),
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // New Modern Bookings Section
  bookingsSection: {
    marginTop: 0,
    marginBottom: 0,
  },
  bookingsHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    marginTop: 0,
  },
  bookingsTitle: {
    fontSize: normalize.font(17),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  bookingsViewAll: {
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  filterScroll: {
    marginBottom: 0,
  },
  filterContainer: {
    gap: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterWrapper: {
    height: 55,
    justifyContent: 'center',
  },
  bookingList: {
    gap: 12,
  },
  modernBookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1.1,
    borderColor: '#F1F3F5',
    overflow: 'hidden',
    padding: 10,
  },
  modernBookingInner: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modernBookingAvatar: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modernBookingImg: {
    width: '100%',
    height: '100%',
  },
  modernBookingPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernBookingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modernBookingName: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 1,
  },
  modernBookingShift: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  modernBookingPriceWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  modernBookingPrice: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  fixedHeaderArea: {
    backgroundColor: Colors.white,
    zIndex: 10,
    paddingBottom: 5,
  },
  noBookings: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  noBookingsText: {
    color: Colors.text.muted,
    fontSize: normalize.font(14),
    fontWeight: '600',
  },

  // Chalet Section
  chaletSectionWrap: {
    marginTop: 24,
  },
  chaletSectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: Colors.white,
    fontSize: normalize.font(11),
    fontWeight: '800',
  },
  addChaletBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chalet Cards
  chaletsList: {
    gap: 10,
  },
  chaletCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  chaletCardInner: {
    padding: 12,
    alignItems: 'center',
    gap: 14,
  },
  chaletImageWrap: {
    position: 'relative',
  },
  chaletImage: {
    width: normalize.width(90),
    height: normalize.width(90),
    borderRadius: 14,
    backgroundColor: '#F5F5F7',
  },
  statusIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  chaletInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  chaletName: {
    fontSize: normalize.font(15),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  locationRow: {
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontWeight: '500',
  },
  chipRow: {
    gap: 6,
    marginTop: 2,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statChipText: {
    fontSize: normalize.font(11),
    fontWeight: '700',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
