import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarCalendarBold, SolarBanknoteBold, SolarCalendarAddBold, SolarStarBold } from "@/components/icons/solar-icons";
import { formatPrice } from '@/utils/format';
import { useRouter } from 'expo-router';
import { HeaderSection } from '@/components/header-section';
import Svg, { Path, Defs, ClipPath, Image as SvgImage } from 'react-native-svg';

// Global isRTL for styles
const isRTL = I18nManager.isRTL;

const SHAPES_CONFIG = [
  {
    viewBox: "0 0 132 114",
    width: 132,
    height: 114,
    path: "M78.7725 2C93.5962 2.00003 106.408 5.61551 115.473 12.8877C124.473 20.1084 130 31.1096 130 46.416C130 63.2797 118.126 78.4796 102.275 90.1074C86.4772 101.697 67.2293 109.354 53.5078 111.289C39.5004 113.265 27.4662 111.112 18.5918 104.994C9.7592 98.905 3.76485 88.6866 2.18652 73.9004C0.804578 60.9535 7.14433 42.9634 20.3965 28.1426C33.584 13.3941 53.4373 2 78.7725 2Z",
  }
];

export default function BookingsScreen() {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isArabic = language === 'ar';
  const router = useRouter();

  // Mock data to match screenshot more closely for UI development
  const bookings = [
    {
      id: '1',
      chaletId: '1',
      status: 'confirmed',
      startDate: '2025-10-12',
      endDate: '2025-10-14',
      totalPrice: 500000,
      chalet: {
        name: { ar: "شالية الاروع علةاالطلاق", en: "Most Amazing Chalet" },
        location: { ar: "البصرة - الجزائر", en: "Basra - Algeria" },
        rating: 4.5,
        price: 30000,
        images: [{ url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500' }]
      }
    }
  ];

  const renderBookingItem = (booking: any) => {
    const chaletName = isArabic ? (booking.chalet?.name?.ar || booking.chalet?.name) : (booking.chalet?.name?.en || booking.chalet?.name);
    const location = isArabic ? (booking.chalet?.location?.ar || booking.chalet?.location) : (booking.chalet?.location?.en || booking.chalet?.location);
    const shape = SHAPES_CONFIG[0];

    return (
      <View key={booking.id} style={styles.bookingCardContainer}>
        {/* Top Block: Chalet Info */}
        <View style={styles.topBlock}>
            <View style={styles.imageBlock}>
                <Svg width={115} height={100} viewBox={shape.viewBox}>
                    <Defs>
                        <ClipPath id={`clip-${booking.id}`}>
                            <Path d={shape.path} />
                        </ClipPath>
                    </Defs>
                    <Path d={shape.path} stroke="#035DF9" strokeWidth="4" />
                    <SvgImage
                        href={booking.chalet?.images?.[0]?.url}
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#clip-${booking.id})`}
                    />
                </Svg>
            </View>

            <View style={styles.chaletInfoContent}>
                <View style={styles.titleSection}>
                    <ThemedText style={styles.chaletTitle}>{chaletName}</ThemedText>
                    <ThemedText style={styles.locationText}>{location}</ThemedText>
                </View>
                
                <View style={styles.priceRatingRow}>
                   <ThemedText style={styles.priceText}>
                       <ThemedText style={styles.priceLabel}>{isArabic ? "شفت / " : "Shift / "}</ThemedText>
                       {formatPrice(booking.chalet?.price)}
                   </ThemedText>
                   <View style={styles.ratingBox}>
                       <ThemedText style={styles.ratingText}>{booking.chalet?.rating}</ThemedText>
                       <SolarStarBold size={14} color="#EA2129" />
                   </View>
                </View>
            </View>
        </View>

        {/* Bottom Block: Booking Details */}
        <View style={styles.bottomBlock}>
            <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>{t('booking.bookingDate')}</ThemedText>
                <ThemedText style={styles.detailValue}>12 - 14 اكتوبر 2025</ThemedText>
            </View>

            <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>{t('booking.finalAmount')}</ThemedText>
                <ThemedText style={styles.detailValue}>{formatPrice(booking.totalPrice)}</ThemedText>
            </View>

            <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>{t('booking.paymentStatus')}</ThemedText>
                <View style={styles.paidBadge}>
                    <ThemedText style={styles.paidBadgeText}>{t('booking.status.paid')}</ThemedText>
                </View>
            </View>

            <View style={styles.dividerFull} />

            <TouchableOpacity 
                style={styles.viewDetailsBtn}
                onPress={() => router.push({ pathname: '/(tabs)/(customer)/booking-success', params: { id: booking.id } })}
            >
                <ThemedText style={styles.viewDetailsText}>{t('booking.viewBookingDetails') || 'عرض تفاصيل الحجز'}</ThemedText>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <HeaderSection title={t('tabs.bookings') || 'الحجوزات'} showLogo />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {bookings.length > 0 ? (
          bookings.map(renderBookingItem)
        ) : (
          <View style={styles.emptyState}>
            <SolarCalendarAddBold size={80} color="#E2E8F0" />
            <ThemedText style={styles.emptyTitle}>{t('booking.noBookings')}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {t('booking.noBookingsDesc')}
            </ThemedText>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')}>
              <ThemedText style={styles.exploreBtnText}>{t('booking.exploreNow')}</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  bookingCardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.small,
  },
  topBlock: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chaletInfoContent: { flex: 1, marginLeft: 15, height: 100, justifyContent: 'space-between' },
  titleSection: { alignItems: isRTL ? 'flex-end' : 'flex-start' },
  chaletTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', textAlign: isRTL ? 'right' : 'left' },
  locationText: { fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4, textAlign: isRTL ? 'right' : 'left' },
  
  priceRatingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  priceText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  priceLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  
  imageBlock: { width: 115, height: 100 },
  
  bottomBlock: {
     backgroundColor: '#FAFCFF',
     borderTopWidth: 1,
     borderTopColor: '#F1F5F9',
     borderBottomLeftRadius: 24,
     borderBottomRightRadius: 24,
     paddingHorizontal: 20,
     paddingVertical: 16,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailLabel: { fontSize: normalize.font(15), fontWeight: '800', color: '#111827' },
  detailValue: { fontSize: normalize.font(16), fontWeight: '700', color: '#94A3B8' },
  
  paidBadge: { backgroundColor: '#035DF9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  paidBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  
  dividerFull: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15, opacity: 0.6 },
  viewDetailsBtn: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  viewDetailsText: { color: '#035DF9', fontSize: 15, fontWeight: '800', textAlign: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  exploreBtn: { marginTop: 24, backgroundColor: '#035DF9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: 'white', fontWeight: '700' }
});
