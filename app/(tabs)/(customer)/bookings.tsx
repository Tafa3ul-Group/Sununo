import { HeaderSection } from '@/components/header-section';
import { SolarCalendarBold } from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { HorizontalCardSkeleton } from '@/components/ui/skeleton-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, normalize } from '@/constants/theme';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { getChaletCover } from '@/hooks/useImageSrc';

import { useGetCustomerBookingsQuery } from '@/store/api/customerApiSlice';
import { formatChaletLocation, formatPrice, getStartingPrice } from '@/utils/format';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDirection } from '@/i18n';


const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Translation function type (matches react-i18next's `t` shape we use here).
type TFunc = (key: string) => string;

// Format a booking date string for display in the active language.
// Pure module-level helper so it is not recreated on every render.
//
// `bookingDate` is a DATE-ONLY column on the API (Booking.bookingDate is
// `@Column({ type: 'date' })`), so it arrives as "YYYY-MM-DD" — a calendar day,
// not an instant. `new Date("2026-03-15")` is parsed as UTC midnight per the ES
// spec, and `toLocaleDateString` then renders it in the DEVICE timezone, so any
// device on a negative UTC offset would show the previous day for a booking the
// server keeps in Asia/Baghdad. Build a LOCAL date from the parts instead so the
// calendar day is preserved verbatim wherever the phone happens to be.
const formatBookingDate = (dateStr: string, isArabic: boolean): string => {
  if (!dateStr) return '';
  try {
    // Date-only values ("2026-03-15") → local midnight; full timestamps
    // ("...T18:00:00Z") are real instants and stay on the normal Date path.
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(isArabic ? 'ar' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Compute the payment-status badge (text/colors) for a booking.
// Pure module-level helper so it is not recreated on every render.
const getPaymentStatusBadge = (item: any, t: TFunc, isArabic: boolean) => {
  const status = item.paymentStatus;
  const bookingStatus = item.status;
  const deposit = Number(item.depositAmount || 0);
  const remaining = Number(item.remainingAmount || 0);
  const total = Number(item.totalPrice || 0);

  // Only show "Paid" if payment was actually completed
  if (status === 'paid' || (remaining === 0 && total > 0 && (bookingStatus === 'confirmed' || bookingStatus === 'completed'))) {
    return {
      text: t('booking.status.paid') || (isArabic ? 'مدفوع' : 'Paid'),
      color: '#FFFFFF',
      bg: '#0284C7'
    };
  }

  // Only show "Deposit Paid" if booking is confirmed/completed (payment actually went through)
  if (deposit > 0 && remaining > 0 && (bookingStatus === 'confirmed' || bookingStatus === 'completed')) {
    return {
      text: isArabic ? 'عربون مدفوع' : 'Deposit Paid',
      color: '#FFFFFF',
      bg: '#F97316'
    };
  }

  // Pending approval — no payment yet
  if (bookingStatus === 'pending_approval') {
    return {
      text: isArabic ? 'بانتظار الموافقة' : 'Pending Approval',
      color: '#FFFFFF',
      bg: '#D97706'
    };
  }

  // Pending payment — approved but not yet paid
  if (bookingStatus === 'pending_payment') {
    return {
      text: isArabic ? 'بانتظار الدفع' : 'Awaiting Payment',
      color: '#FFFFFF',
      bg: '#E11D48'
    };
  }

  return {
    text: isArabic ? 'غير مدفوع' : 'Unpaid',
    color: '#FFFFFF',
    bg: '#94A3B8'
  };
};

interface BookingCardProps {
  booking: any;
  index: number;
  isArabic: boolean;
  t: TFunc;
  onViewDetails: (id: any) => void;
}

// Memoized booking card. Only re-renders when its own props change, so a stable
// `bookings` array no longer forces every card to re-render on parent updates.
const BookingCard = React.memo(function BookingCard({
  booking,
  index,
  isArabic,
  t,
  onViewDetails
}: BookingCardProps) {
  const { textAlign, textAlignEnd } = useDirection();
  const statusBadge = getPaymentStatusBadge(booking, t, isArabic);

  return (
    <Animated.View
      style={styles.bookingCardContainer}
    >
      {/* Top block: the SAME chalet card the home screen uses, flattened into
          this container (its own border/shadow/margin removed) so the booking
          details below read as part of one card. */}
      <HorizontalCard
        chalet={booking.card}
        style={styles.chaletCard}
        hideFavorite
        onPress={() => onViewDetails(booking.id)}
      />

      {/* Bottom Block: Booking Details */}
      <View style={styles.bottomBlock}>
        <View style={[styles.detailRow, { flexDirection: 'row' }]}>
          <ThemedText style={[styles.detailLabel, { textAlign }]}>{t('booking.bookingDate')}</ThemedText>
          <ThemedText style={[styles.detailValue, { textAlign: textAlignEnd }]}>{formatBookingDate(booking.startDate, isArabic)}</ThemedText>
        </View>

        <View style={[styles.detailRow, { flexDirection: 'row' }]}>
          <ThemedText style={[styles.detailLabel, { textAlign }]}>{t('booking.guests') || 'الأشخاص'}</ThemedText>
          <ThemedText style={[styles.detailValue, { textAlign: textAlignEnd }]}>{booking.guestCount} {isArabic ? 'أشخاص' : 'guests'}</ThemedText>
        </View>

        {booking.paymentModel === 'deposit' && Number(booking.depositAmount) > 0 && (booking.status === 'confirmed' || booking.status === 'completed') ? (
          <>
            <View style={[styles.detailRow, { flexDirection: 'row' }]}>
              <ThemedText style={[styles.detailLabel, { textAlign }]}>{t('booking.depositAmount') || 'مبلغ العربون'}</ThemedText>
              <ThemedText style={[styles.detailValue, { textAlign: textAlignEnd }]}>{formatPrice(booking.depositAmount)}</ThemedText>
            </View>
            <View style={[styles.detailRow, { flexDirection: 'row' }]}>
              <ThemedText style={[styles.detailLabel, { textAlign }]}>{t('booking.remainingAmount') || 'المبلغ المتبقي'}</ThemedText>
              <ThemedText style={[styles.detailValue, { textAlign: textAlignEnd }]}>{formatPrice(booking.remainingAmount)}</ThemedText>
            </View>
          </>
        ) : null}

        <View style={[styles.detailRow, { flexDirection: 'row' }]}>
          <ThemedText style={[styles.detailLabel, { textAlign }]}>{t('booking.finalAmount')}</ThemedText>
          <ThemedText style={[styles.detailValue, { textAlign: textAlignEnd }]}>{formatPrice(booking.totalPrice)}</ThemedText>
        </View>

        <View style={[styles.detailRow, { flexDirection: 'row' }]}>
          <ThemedText style={[styles.detailLabel, { textAlign }]}>{t('booking.paymentStatus')}</ThemedText>
          <View style={[styles.paidBadge, { backgroundColor: statusBadge.bg }]}>
            <ThemedText style={[styles.paidBadgeText, { color: statusBadge.color }]}>{statusBadge.text}</ThemedText>
          </View>
        </View>

        <View style={styles.dividerFull} />

        <ViewDetailsButton
          label={t('booking.viewBookingDetails') || 'عرض تفاصيل الحجز'}
          onPress={() => onViewDetails(booking.id)}
        />
      </View>
    </Animated.View>
  );
});

const ViewDetailsButton = React.memo(function ViewDetailsButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedTouchable
      style={styles.viewDetailsBtn}
      activeOpacity={0.85}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
    >
      <ThemedText style={styles.viewDetailsText}>{label}</ThemedText>
    </AnimatedTouchable>
  );
});

export default function BookingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRTL } = useDirection();
  const isArabic = isRTL;

  // Fetch bookings from the backend
  const { data: bookingsResponse, isLoading: bookingsLoading, isFetching: bookingsFetching, refetch: refetchBookings } = useGetCustomerBookingsQuery({ page: 1, limit: 20 });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchBookings();
    setIsRefreshing(false);
  }, [refetchBookings]);

  // Transform API data into a stable, language-independent structure.
  // Depends only on the raw response, so a language switch (isArabic) does not
  // re-run this transformation — localized labels are resolved per-card below.
  const bookings = useMemo(() => {
    const items = bookingsResponse?.data || [];
    return items.map((booking: any) => ({
      id: booking.id,
      chaletId: booking.chalet?.id || '',
      // Shape consumed by HorizontalCard (same mapping the home screen does).
      // `title`/`location` stay {ar,en} objects so the card resolves the
      // language itself and this memo does not depend on it.
      card: {
        id: booking.chalet?.id || '',
        title: booking.chalet?.name,
        location: {
          ar: formatChaletLocation(booking.chalet, true),
          en: formatChaletLocation(booking.chalet, false)
        },
        image: getChaletCover(booking.chalet?.images)?.url ?? booking.chalet?.images?.[0],
        blurhash: getChaletCover(booking.chalet?.images)?.blurhash,
        price: getStartingPrice(booking.chalet) !== '0'
          ? getStartingPrice(booking.chalet)
          : formatPrice(booking.chalet?.basePrice || booking.totalPrice || 0),
        discount: booking.chalet?.discount,
        rating: booking.chalet?.averageRating ?? booking.chalet?.rating ?? 0,
        features: booking.chalet?.features ?? booking.chalet?.chaletFeatures
      },
      status: booking.status,
      startDate: booking.bookingDate,
      endDate: booking.bookingDate,
      totalPrice: booking.totalPrice || booking.amount || 0,
      guestCount: booking.guestsCount || booking.guestCount || 0,
      paymentModel: booking.paymentModel,
      depositAmount: booking.depositAmount || 0,
      remainingAmount: booking.remainingAmount || 0,
      paymentStatus: booking.paymentStatus
    }));
  }, [bookingsResponse?.data]);

  const handleViewDetails = useCallback((id: any) => {
    router.push({ pathname: '/(tabs)/(customer)/booking-success', params: { id } });
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <HeaderSection
        title={t('tabs.bookings') || 'الحجوزات'}
        showLogo
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {bookingsLoading ? (
          <View>
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
          </View>
        ) : bookings.length > 0 ? (
          bookings.map((booking: any, index: number) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              index={index}
              isArabic={isArabic}
              t={t}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          <EmptyState
            icon={<SolarCalendarBold size={normalize.width(56)} color={Colors.primary} />}
            title={t('booking.noBookings')}
            description={t('booking.noBookingsDesc')}
            actionLabel={t('booking.exploreNow')}
            onAction={() => router.push('/(tabs)/(customer)/explore')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },

  // Mirrors HorizontalCard's own container so the list reads like the home
  // screen: same radius, hairline outline, iOS-only shadow.
  bookingCardContainer: {
    backgroundColor: '#FFF',
    borderRadius: normalize.radius(14),
    overflow: 'hidden',
    marginBottom: normalize.height(12),
    borderWidth: 1,
    borderColor: '#ECEDF0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 }
      },
      default: {}
    })
  },
  // The embedded chalet card gives up its own chrome — the outer container
  // draws it once for the whole booking card.
  chaletCard: {
    marginBottom: 0,
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0
  },

  bottomBlock: {
    backgroundColor: '#FAFCFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEDF0',
    paddingHorizontal: normalize.width(14),
    paddingVertical: 12
  },
  detailRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: normalize.font(14), fontFamily: "IBMPlexSansArabic-Medium", color: '#111827' },
  detailValue: { fontSize: normalize.font(14), fontFamily: "IBMPlexSansArabic-Medium", color: '#94A3B8' },

  paidBadge: { backgroundColor: '#035DF9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  paidBadgeText: { color: '#FFF', fontSize: 12, fontFamily: "IBMPlexSansArabic-Medium" },

  dividerFull: { height: 1, backgroundColor: '#ECEDF0', marginTop: 2, marginBottom: 10 },
  viewDetailsBtn: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  viewDetailsText: { color: '#035DF9', fontSize: 14, fontFamily: "IBMPlexSansArabic-Medium", textAlign: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 14, fontFamily: "IBMPlexSansArabic-SemiBold", color: '#1E293B', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 20, fontFamily: "IBMPlexSansArabic-Regular" },
  exploreBtn: { marginTop: 24, backgroundColor: '#035DF9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: 'white', fontFamily: "IBMPlexSansArabic-SemiBold" }
});
