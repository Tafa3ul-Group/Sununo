import { BookingCancellationSheet, BookingCancellationSheetRef } from '@/components/booking-cancellation-modal';
import { BookingDetailsModalContent } from '@/components/booking-details-modal-content';
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import {
  SolarCalendarBold,
  SolarCheckCircleBold,
  SolarClockCircleBold,
  SolarUserBold
} from "@/components/icons/solar-icons";
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize } from '@/constants/theme';
import { RootState } from '@/store';
import { useDeleteExternalBookingMutation, useGetProviderBookingsQuery, useGetProviderProfileQuery, useRejectBookingMutation } from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userType, language, selectedChalet } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const isOwner = userType === 'owner';
  const [activeFilter, setActiveFilter] = useState('all');
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const detailsSheetRef = React.useRef<BottomSheetModal>(null);
  const cancelSheetRef = React.useRef<BookingCancellationSheetRef>(null);
  const calendarSheetRef = React.useRef<BottomSheetModal>(null);

  const [rejectBooking, { isLoading: isRejectLoading }] = useRejectBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();
  const [cancellingBookingData, setCancellingBookingData] = useState<any>(null);

  const handleOpenCancelSheet = (data: any) => {
    setCancellingBookingData(data);
    setTimeout(() => {
      cancelSheetRef.current?.present();
    }, 100);
  };

  const handleConfirmCancellation = async (reason: string) => {
    if (!cancellingBookingData) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isExternal = cancellingBookingData.type === 'external' || cancellingBookingData.bIsExternal;

      if (isExternal) {
        await deleteExternalBooking(cancellingBookingData.id).unwrap();
      } else {
        await rejectBooking({
          id: cancellingBookingData.id,
          reason: reason || (isRTL ? 'إلغاء من قبل المشغل' : 'Cancelled by provider')
        }).unwrap();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetchBookings();

      // Close details sheet immediately
      detailsSheetRef.current?.dismiss();

      // Show success in cancellation sheet
      cancelSheetRef.current?.showSuccess(
        isRTL ? 'تم الإلغاء بنجاح.' : 'Cancelled successfully.'
      );

    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      cancelSheetRef.current?.showError(
        e?.data?.message || (isRTL ? 'فشل الإلغاء' : 'Failed to cancel')
      );
    }
  };

  const [selectedRange, setSelectedRange] = useState<{ start: Date, end: Date } | null>(null);
  const [page, setPage] = useState(1);
  const filterScrollRef = React.useRef<ScrollView>(null);
  const [itemLayouts, setItemLayouts] = useState<Record<string, number>>({});

  const handleFilterPress = (filterId: string) => {
    setActiveFilter(filterId);
    if (itemLayouts[filterId] !== undefined) {
      filterScrollRef.current?.scrollTo({ x: itemLayouts[filterId] - 20, animated: true });
    }
  };

  const formatSelectedDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getButtonLabel = () => {
    if (selectedRange?.start && selectedRange?.end) {
      if (selectedRange.start.getTime() === selectedRange.end.getTime()) {
        return formatSelectedDate(selectedRange.start);
      }
      if (isRTL) {
        return `${formatSelectedDate(selectedRange.end)} - ${formatSelectedDate(selectedRange.start)}`;
      }
      return `${formatSelectedDate(selectedRange.start)} - ${formatSelectedDate(selectedRange.end)}`;
    }
    return t('dashboard.bookings.records') || (isRTL ? 'السجل' : 'Records');
  };


  // API hooks
  const { data: profileResponse } = useGetProviderProfileQuery(undefined);

  const statusMap: Record<string, string> = {
    pending: 'pending_payment',
    confirmed: 'confirmed',
    finished: 'completed',
  };

  const { data: bookingsResponse, isFetching: isBookingsFetching, isLoading: isBookingsLoading, refetch: refetchBookings } = useGetProviderBookingsQuery({
    limit: 10,
    page: page,
    status: activeFilter !== 'all' ? statusMap[activeFilter] : undefined,
    from: selectedRange?.start ? selectedRange.start.toISOString().split('T')[0] : undefined,
    to: selectedRange?.end ? selectedRange.end.toISOString().split('T')[0] : undefined,
    chaletId: selectedChalet?.id || undefined,
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, selectedRange, selectedChalet?.id]);

  const handleLoadMore = () => {
    if (!isBookingsFetching && bookingsResponse?.meta?.nextPage) {
      setPage(prev => prev + 1);
    }
  };

  const profile = profileResponse?.data || profileResponse;
  const recentBookings = bookingsResponse?.data || bookingsResponse || [];

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




  const renderBookingCard = ({ item, index }: { item: any; index: number }) => {
    const bIsExternal = item.bookingStatus === 'EXTERNAL' || item.status === 'external';
    const customerName = bIsExternal ? (isRTL ? 'حجز خارجي' : 'External Booking') : (item.customer?.name || t('common.user'));
    const shiftName = isRTL ? (item.shift?.name?.ar || item.shift?.name) : (item.shift?.name?.en || item.shift?.name);
    const chaletName = isRTL ? (item.chalet?.name?.ar || item.chalet?.name) : (item.chalet?.name?.en || item.chalet?.name);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).duration(300).springify().damping(15)}
        key={item.id}
      >
        <TouchableOpacity
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
              {bIsExternal ? (
                <View style={[styles.modernBookingPlaceholder, { backgroundColor: Colors.primary }]}>
                  <SolarUserBold size={24} color="#FFF" />
                </View>
              ) : item.customer?.image ? (
                <Image source={{ uri: item.customer.image }} style={styles.modernBookingImg} />
              ) : (
                <View style={styles.modernBookingPlaceholder}>
                  <SolarUserBold size={24} color="#CBD5E1" />
                </View>
              )}
            </View>

            {/* 2. Info (Name, Chalet and Shift) */}
            <View style={[styles.modernBookingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.modernBookingName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{customerName}</Text>
              {chaletName && <Text style={[styles.modernBookingChalet, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{chaletName}</Text>}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.modernBookingShift, { textAlign: isRTL ? 'right' : 'left' }]}>{t('common.shift')} {shiftName}</Text>
                <Text style={styles.modernBookingDot}>•</Text>
                <Text style={styles.modernBookingDate}>{item.date || item.createdAt?.split('T')[0]}</Text>
              </View>
            </View>

            {/* 3. Price (Left part in RTL) */}
            <View style={styles.modernBookingPriceWrap}>
              <Text style={styles.modernBookingPrice}>
                {(Number(item.totalPrice) || 0).toLocaleString()} {t('common.iqd')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderBackdrop = React.useCallback((props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
  ), []);

  const renderFilterButton = (filter: { id: string; label: string; icon?: React.ReactNode }) => {
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
            icon={filter.icon}
            onPress={() => setActiveFilter(filter.id)}
          />
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.safeArea}>
        <DashboardHeader
          showSearch={false}
          onSearchPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {/* Fixed Section: Header + Filter */}
            <View style={styles.fixedHeaderArea}>
              <Animated.View
                entering={FadeInUp.duration(400).springify().damping(18)}
                style={[styles.bookingsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <Text style={styles.bookingsTitle}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
                <View style={{ transform: [{ scale: 0.92 }] }}>
                  <SecondaryButton
                    label={getButtonLabel()}
                    icon={<SolarCalendarBold size={18} color={Colors.black} />}
                    inactiveTextColor={Colors.black}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      calendarSheetRef.current?.present();
                    }}
                  />
                </View>
              </Animated.View>

              {/* Filter Bar */}
              <Animated.View
                entering={FadeInRight.delay(100).duration(400)}
                style={styles.filterWrapper}
              >
                <ScrollView
                  ref={filterScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScroll}
                  contentContainerStyle={[styles.filterContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  {[
                    { id: 'all', label: t('home.categories.all') },
                    {
                      id: 'pending',
                      label: t('dashboard.bookings.new'),
                      icon: <SolarClockCircleBold size={18} color={activeFilter === 'pending' ? 'white' : Colors.primary} />
                    },
                    {
                      id: 'confirmed',
                      label: t('dashboard.bookings.confirmed'),
                      icon: <SolarCheckCircleBold size={18} color={activeFilter === 'confirmed' ? 'white' : Colors.primary} />
                    },
                    {
                      id: 'finished',
                      label: t('dashboard.bookings.finished'),
                      icon: <SolarCalendarBold size={18} color={activeFilter === 'finished' ? 'white' : Colors.primary} />
                    },
                  ].map((filter, index) => {
                    const isActive = activeFilter === filter.id;
                    const isAll = filter.id === 'all';

                    return (
                      <View
                        key={filter.id}
                        style={{ transform: [{ scale: 0.92 }] }}
                        onLayout={(event) => {
                          const layout = event.nativeEvent.layout;
                          setItemLayouts(prev => ({ ...prev, [filter.id]: layout.x }));
                        }}
                      >
                        {isAll ? (
                          <PrimaryButton
                            label={filter.label}
                            isActive={isActive}
                            onPress={() => handleFilterPress(filter.id)}
                          />
                        ) : (
                          <SecondaryButton
                            label={filter.label}
                            isActive={isActive}
                            icon={filter.icon}
                            onPress={() => handleFilterPress(filter.id)}
                          />
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            </View>

            {/* Scrollable Section: Only Cards */}
            <FlatList
              data={recentBookings}
              renderItem={renderBookingCard}
              keyExtractor={(item) => item.id.toString()}
              style={styles.container}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={<View style={{ height: 5 }} />}
              ListEmptyComponent={
                isBookingsFetching && recentBookings.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                ) : !isBookingsFetching && recentBookings.length === 0 ? (
                  <Animated.View entering={FadeIn.duration(300)} style={styles.noBookings}>
                    <Text style={styles.noBookingsText}>
                      {t('dashboard.noBookings') || (isRTL ? 'لا توجد حجوزات حالياً' : 'No bookings found')}
                    </Text>
                  </Animated.View>
                ) : null
              }
              ListFooterComponent={
                isBookingsFetching && recentBookings.length > 0 ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : <View style={{ height: 40 }} />
              }
              refreshControl={
                <RefreshControl refreshing={isBookingsFetching && page === 1} onRefresh={() => { setPage(1); refetchBookings(); }} tintColor={Colors.primary} />
              }
            />
          </View>
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
                onRefresh={refetchBookings}
                onClose={() => detailsSheetRef.current?.dismiss()}
                onOpenCancelSheet={handleOpenCancelSheet}
                isCancelLoading={isRejectLoading || isDeletingExternal}
              />
            )}
          </BottomSheetView>
        </BottomSheetModal>

        <BookingCancellationSheet
          ref={cancelSheetRef}
          onConfirm={handleConfirmCancellation}
          isLoading={isRejectLoading || isDeletingExternal}
          isRTL={isRTL}
          isExternal={cancellingBookingData?.type === 'external' || cancellingBookingData?.bIsExternal}
          depositAmount={cancellingBookingData?.downPayment || '50,000'}
        />
        {/* Calendar Drawer */}
        <BottomSheetModal
          ref={calendarSheetRef}
          snapPoints={['60%']}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
        >
          <BottomSheetView style={styles.calendarSheetContent}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>{isRTL ? 'التقويم' : 'Calendar'}</Text>
            </View>
            <View style={{ paddingVertical: 10 }}>
              <DashboardCalendar
                initialStartDate={selectedRange?.start}
                initialEndDate={selectedRange?.end}
                onSelect={(s, e) => {
                  if (s && e) {
                    setSelectedRange({ start: s, end: e });
                    setTimeout(() => {
                      calendarSheetRef.current?.dismiss();
                    }, 300);
                  }
                }} />
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </View>
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
    paddingHorizontal: normalize.width(14),
    paddingTop: normalize.height(5),
    paddingBottom: normalize.height(10),
  },
  loadingContainer: {
    flex: 1,
    height: normalize.height(400),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Wallet Card
  walletCard: {
    marginBottom: normalize.height(20),
    borderRadius: normalize.radius(24),
    overflow: 'hidden',
  },
  walletCardInner: {
    backgroundColor: Colors.primary,
    padding: normalize.width(24),
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: normalize.radius(999),
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle1: {
    width: normalize.width(180),
    height: normalize.width(180),
    top: normalize.height(-60),
    right: normalize.width(-40),
  },
  decorCircle2: {
    width: normalize.width(120),
    height: normalize.width(120),
    bottom: normalize.height(-30),
    left: normalize.width(-20),
  },
  walletTop: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: normalize.height(20),
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: normalize.font(12),
    fontFamily: "LamaSans-SemiBold",
    marginBottom: normalize.height(6),
    letterSpacing: normalize.width(0.3),
    textTransform: 'uppercase',
    lineHeight: normalize.font(16),
  },
  walletAmountRow: {
    alignItems: 'baseline',
  },
  walletValue: {
    color: Colors.white,
    fontSize: normalize.font(32),
    fontFamily: "LamaSans-Black",
    letterSpacing: normalize.width(-0.5),
    lineHeight: normalize.font(38),
  },
  walletCurrency: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-SemiBold",
    lineHeight: normalize.font(20),
  },
  eyeButton: {
    width: normalize.width(44),
    height: normalize.width(44),
    borderRadius: normalize.radius(22),
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletActions: {
    gap: normalize.width(10),
  },
  walletActionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize.width(6),
  },
  walletActionText: {
    color: Colors.primary,
    fontFamily: "LamaSans-Bold",
    fontSize: normalize.font(13),
    lineHeight: normalize.font(18),
  },



  // Booking Cards
  bookingCard: {
    backgroundColor: Colors.white,
    padding: normalize.width(14),
    borderRadius: normalize.radius(16),
    marginBottom: normalize.height(10),
    alignItems: 'center',
    gap: normalize.width(12),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bookingAvatar: {
    width: normalize.width(44),
    height: normalize.width(44),
    borderRadius: normalize.radius(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: normalize.font(18),
    fontFamily: "LamaSans-Bold",
    lineHeight: normalize.font(24),
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Bold",
    color: Colors.text.primary,
    marginBottom: normalize.height(1),
    lineHeight: normalize.font(20),
  },
  bookingChalet: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
    lineHeight: normalize.font(16),
  },
  bookingDate: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
    marginTop: normalize.height(2),
    lineHeight: normalize.font(14),
  },
  bookingAmount: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
    marginBottom: normalize.height(4),
    lineHeight: normalize.font(20),
  },
  bookingCurrency: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontFamily: "LamaSans-SemiBold",
    lineHeight: normalize.font(14),
  },
  bookingStatusBadge: {
    paddingHorizontal: normalize.width(8),
    paddingVertical: normalize.height(2),
    borderRadius: normalize.radius(6),
  },
  bookingStatusText: {
    fontSize: normalize.font(9),
    fontFamily: "LamaSans-Bold",
    textTransform: 'uppercase',
    lineHeight: normalize.font(13),
  },

  // New Modern Bookings Section
  bookingsSection: {
    marginTop: 0,
    marginBottom: 0,
  },
  bookingsHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize.height(10),
    paddingHorizontal: normalize.width(16),
    marginTop: 0,
  },
  bookingsTitle: {
    fontSize: normalize.font(17),
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
    lineHeight: normalize.font(23),
  },
  bookingsViewAll: {
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    fontFamily: "LamaSans-SemiBold",
    textDecorationLine: 'underline',
    lineHeight: normalize.font(20),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarSheetContent: {
    flex: 1,
    paddingHorizontal: normalize.width(20),
  },
  calendarHeader: {
    paddingVertical: normalize.height(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: normalize.font(18),
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
    lineHeight: normalize.font(24),
  },
  filterScroll: {
    marginBottom: 0,
  },
  filterContainer: {
    gap: normalize.width(8),
    paddingHorizontal: normalize.width(16),
    alignItems: 'center',
  },
  filterWrapper: {
    height: normalize.height(55),
    justifyContent: 'center',
  },
  bookingList: {
    // Removed gap for compatibility
  },
  modernBookingCard: {
    backgroundColor: Colors.white,
    borderRadius: normalize.radius(20),
    borderWidth: 1.1,
    borderColor: '#F1F3F5',
    overflow: 'hidden',
    padding: normalize.width(10),
    marginBottom: normalize.height(12), // Increased from 4
  },
  modernBookingInner: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: normalize.width(10),
  },
  modernBookingAvatar: {
    width: normalize.width(52),
    height: normalize.width(52),
    borderRadius: normalize.radius(15),
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
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
    marginBottom: normalize.height(1),
    lineHeight: normalize.font(22),
  },
  modernBookingShift: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
    lineHeight: normalize.font(16),
  },
  modernBookingChalet: {
    fontSize: normalize.font(13),
    color: Colors.primary,
    fontFamily: "LamaSans-Bold",
    marginBottom: normalize.height(1),
    lineHeight: normalize.font(18),
  },
  modernBookingDate: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
    lineHeight: normalize.font(16),
  },
  modernBookingDot: {
    color: Colors.text.muted,
    fontSize: normalize.font(11),
  },
  modernBookingPriceWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  modernBookingPrice: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
    lineHeight: normalize.font(20),
  },
  fixedHeaderArea: {
    backgroundColor: Colors.white,
    zIndex: 10,
    paddingBottom: normalize.height(5),
  },
  noBookings: {
    padding: normalize.width(30),
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: normalize.radius(16),
  },
  noBookingsText: {
    color: Colors.text.muted,
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-SemiBold",
    lineHeight: normalize.font(20),
  },


  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize.height(60),
    gap: normalize.width(8),
  },
  emptyIconWrap: {
    width: normalize.width(80),
    height: normalize.width(80),
    borderRadius: normalize.radius(24),
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize.height(8),
  },
  emptyTitle: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Bold",
    color: Colors.text.primary,
    lineHeight: normalize.font(22),
  },
  emptySubtitle: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
    textAlign: 'center',
    paddingHorizontal: normalize.width(40),
    lineHeight: normalize.font(18),
  },
});
