import { HeaderSection } from '@/components/header-section';
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import { RootState } from '@/store';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGetOwnerChaletsQuery, useGetProviderProfileQuery, useGetProviderBookingsQuery } from '@/store/api/apiSlice';
import { getImageSrc } from '@/hooks/useImageSrc';
import { SecondaryButton } from '@/components/user/secondary-button';
import { formatPrice } from '@/utils/format';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
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

export default function HomeScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const isOwner = userType === 'owner';
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  // API hooks
  const { data: chalets, isLoading, refetch, isFetching } = useGetOwnerChaletsQuery({});
  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const { data: bookingsResponse } = useGetProviderBookingsQuery({ limit: 3 });

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isRTL ? 'صباح الخير' : 'Good Morning';
    if (hour < 18) return isRTL ? 'مساء الخير' : 'Good Afternoon';
    return isRTL ? 'مساء الخير' : 'Good Evening';
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <HeaderSection 
          userType={userType} 
          userName={user?.name} 
          title={userType === 'owner' ? t('tabs.home') : t('tabs.myChalets')}
          showSearch={false}
          showCategories={false}
          showProfile={true}
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
            <>
              {/* Greeting */}
              <View style={[styles.greetingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
                  <Text style={styles.greetingName}>{user?.name || (isRTL ? 'مالك الشاليه' : 'Chalet Owner')}</Text>
                </View>
              </View>

              {/* Wallet Card */}
              <View style={styles.walletCard}>
                <View style={styles.walletCardInner}>
                  <View style={[styles.decorCircle, styles.decorCircle1]} />
                  <View style={[styles.decorCircle, styles.decorCircle2]} />

                  <View style={[styles.walletTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={styles.walletLabel}>{isRTL ? 'رصيدك المتاح' : 'Available Balance'}</Text>
                      <View style={[styles.walletAmountRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.walletValue}>
                          {isBalanceVisible ? walletBalance.toLocaleString() : '••••••'}
                        </Text>
                        {isBalanceVisible && <Text style={styles.walletCurrency}> {isRTL ? 'د.ع' : 'IQD'}</Text>}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.eyeButton} onPress={handleToggleBalance}>
                      <Ionicons 
                        name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'} 
                        size={22} 
                        color="rgba(255,255,255,0.8)" 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.walletActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity 
                      style={styles.walletActionBtn}
                      onPress={() => router.push('/(tabs)/(dashboard)/revenue')}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="bank-transfer-out" size={18} color={Colors.primary} />
                      <Text style={styles.walletActionText}>{isRTL ? 'سحب' : 'Withdraw'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.walletActionBtn}
                      onPress={() => router.push('/(tabs)/(dashboard)/transactions')}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="history" size={18} color={Colors.primary} />
                      <Text style={styles.walletActionText}>{isRTL ? 'المعاملات' : 'History'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={[styles.quickActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/(dashboard)/bookings')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialCommunityIcons name="calendar-check" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/(dashboard)/revenue')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: '#ECFDF5' }]}>
                    <MaterialCommunityIcons name="chart-line" size={22} color="#10B981" />
                  </View>
                  <Text style={styles.quickActionLabel}>{isRTL ? 'الأرباح' : 'Revenue'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/(dashboard)/customers')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FFF7ED' }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={22} color="#F97316" />
                  </View>
                  <Text style={styles.quickActionLabel}>{isRTL ? 'العملاء' : 'Customers'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/(dashboard)/notifications')}>
                  <View style={[styles.quickActionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <MaterialCommunityIcons name="bell-outline" size={22} color="#EF4444" />
                  </View>
                  <Text style={styles.quickActionLabel}>{isRTL ? 'الإشعارات' : 'Alerts'}</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Bookings */}
              {Array.isArray(recentBookings) && recentBookings.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.sectionTitle}>{isRTL ? 'أحدث الحجوزات' : 'Recent Bookings'}</Text>
                    <TouchableOpacity 
                      style={styles.viewAllBtn}
                      onPress={() => router.push('/(tabs)/(dashboard)/bookings')}
                    >
                      <Text style={styles.viewAllText}>{isRTL ? 'عرض الكل' : 'View All'}</Text>
                      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {recentBookings.slice(0, 3).map((booking: any) => (
                    <TouchableOpacity 
                      key={booking.id} 
                      style={[styles.bookingCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => router.push('/(tabs)/(dashboard)/bookings')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.bookingAvatar, { 
                        backgroundColor: booking.status === 'confirmed' ? '#EFF6FF' : booking.status === 'pending' ? '#FFF7ED' : '#F8F9FB' 
                      }]}>
                        <Text style={[styles.avatarLetter, { 
                          color: booking.status === 'confirmed' ? Colors.primary : booking.status === 'pending' ? '#F59E0B' : Colors.text.primary 
                        }]}>
                          {(booking.customer?.name || booking.user?.name || '?')[0]}
                        </Text>
                      </View>
                      <View style={[styles.bookingInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.bookingName}>{booking.customer?.name || booking.user?.name || '-'}</Text>
                        <Text style={styles.bookingChalet} numberOfLines={1}>
                          {isRTL ? (booking.chalet?.name?.ar || '-') : (booking.chalet?.name?.en || '-')}
                        </Text>
                        <Text style={styles.bookingDate}>
                          {new Date(booking.startDate || booking.createdAt).toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                        <Text style={styles.bookingAmount}>
                          {(booking.totalPrice || 0).toLocaleString()} <Text style={styles.bookingCurrency}>{isRTL ? 'د.ع' : 'IQD'}</Text>
                        </Text>
                        <View style={[styles.bookingStatusBadge, {
                          backgroundColor: booking.status === 'confirmed' ? '#ECFDF5' : booking.status === 'pending' ? '#FFF7ED' : '#FEF2F2'
                        }]}>
                          <Text style={[styles.bookingStatusText, {
                            color: booking.status === 'confirmed' ? '#10B981' : booking.status === 'pending' ? '#F59E0B' : '#EF4444'
                          }]}>
                            {booking.status === 'confirmed' ? (isRTL ? 'مؤكد' : 'Confirmed') : 
                             booking.status === 'pending' ? (isRTL ? 'معلق' : 'Pending') : (isRTL ? 'ملغي' : 'Cancelled')}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* My Chalets */}
              <View style={styles.chaletSectionWrap}>
                <View style={[styles.chaletSectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.sectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <MaterialCommunityIcons name="home-city-outline" size={22} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>{isRTL ? 'شاليهاتي' : 'My Chalets'}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{chalets?.data?.length || 0}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addChaletBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push('/(tabs)/(dashboard)/add-chalet');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                {chalets?.data?.length > 0 ? (
                  <View style={styles.chaletsList}>
                    {chalets.data.map((item: any) => renderChaletCard(item))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                      <MaterialCommunityIcons name="home-plus-outline" size={48} color="#D1D5DB" />
                    </View>
                    <Text style={styles.emptyTitle}>{isRTL ? 'لا توجد شاليهات بعد' : 'No Chalets Yet'}</Text>
                    <Text style={styles.emptySubtitle}>
                      {isRTL ? 'أضف أول شاليه لك وابدأ بإستقبال الحجوزات' : 'Add your first chalet to start receiving bookings'}
                    </Text>
                  </View>
                )}
              </View>
            </>
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
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Greeting
  greetingRow: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  greetingText: {
    fontSize: normalize.font(14),
    color: Colors.text.muted,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: normalize.font(22),
    fontWeight: '800',
    color: Colors.text.primary,
    marginTop: 2,
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
  // Quick Actions
  quickActionsRow: {
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: normalize.font(11),
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
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
