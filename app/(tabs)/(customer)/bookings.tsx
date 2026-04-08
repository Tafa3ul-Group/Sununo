import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarCalendarBold, SolarBanknoteBold, SolarCalendarAddBold } from "@/components/icons/solar-icons";
import { useGetProviderBookingsQuery } from '@/store/api/apiSlice';
import { formatPrice } from '@/utils/format';
import { useRouter } from 'expo-router';

export default function BookingsScreen() {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const router = useRouter();

  // For now, using this query to show what's available
  const { data: bookingsResponse, isLoading, refetch, isFetching } = useGetProviderBookingsQuery({ limit: 10 });
  const bookings = bookingsResponse?.data || [];

  const renderBookingItem = (booking: any) => {
    const chaletName = isRTL ? (booking.chalet?.name?.ar || booking.chalet?.name) : (booking.chalet?.name?.en || booking.chalet?.name);
    
    return (
      <TouchableOpacity 
        key={booking.id} 
        style={styles.bookingCard}
        onPress={() => router.push({ pathname: '/chalet-details', params: { id: booking.chaletId } })}
      >
        <Image 
          source={{ uri: booking.chalet?.images?.[0]?.url || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=400' }} 
          style={styles.chaletImage} 
        />
        <View style={styles.bookingInfo}>
          <View style={styles.headerRow}>
            <ThemedText style={styles.chaletName}>{chaletName}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: booking.status === 'confirmed' ? '#ECFDF5' : '#F8FAFC' }]}>
              <ThemedText style={[styles.statusText, { color: booking.status === 'confirmed' ? '#10B981' : '#64748B' }]}>
                {booking.status === 'confirmed' ? (isRTL ? 'مؤكد' : 'Confirmed') : (isRTL ? 'قيد الانتظار' : 'Pending')}
              </ThemedText>
            </View>
          </View>
          
          <View style={[styles.detailsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             <SolarCalendarBold size={14} color="#64748B" />
             <ThemedText style={styles.detailsText}>
               {new Date(booking.startDate).toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US')}
             </ThemedText>
             <View style={styles.divider} />
             <SolarBanknoteBold size={14} color="#64748B" />
             <ThemedText style={styles.detailsText}>{formatPrice(booking.totalPrice)}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{t('tabs.bookings')}</ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {bookings.length > 0 ? (
          bookings.map(renderBookingItem)
        ) : (
          <View style={styles.emptyState}>
            <SolarCalendarAddBold size={80} color="#E2E8F0" />
            <ThemedText style={styles.emptyTitle}>{isRTL ? 'لا توجد حجوزات حتى الآن' : 'No bookings yet'}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {isRTL ? 'ابدأ باستكشاف الشاليهات المتاحة واحجز رحلتك القادمة!' : 'Explore available chalets and book your next trip!'}
            </ThemedText>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')}>
              <ThemedText style={styles.exploreBtnText}>{isRTL ? 'اكتشف الآن' : 'Explore Now'}</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFB',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chaletImage: {
    width: '100%',
    height: 140,
  },
  bookingInfo: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chaletName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  detailsText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
    marginRight: 12,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: '#035DF9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: 'white',
    fontWeight: '700',
  }
});
