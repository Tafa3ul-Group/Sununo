import { HeaderSection } from '@/components/header-section';
import { SolarCalendarBold, SolarStarBold } from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { BookingCardSkeleton } from '@/components/ui/skeleton-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';

import { useGetCustomerBookingsQuery } from '@/store/api/customerApiSlice';
import { formatPrice } from '@/utils/format';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDirection } from '@/i18n';
import Svg, { ClipPath, Defs, G, Path, Image as SvgImage } from 'react-native-svg';

const SHAPES_CONFIG = [
  {
    viewBox: "0 0 132 114",
    width: 132,
    height: 114,
    path: "M78.7725 2C93.5962 2.00003 106.408 5.61551 115.473 12.8877C124.473 20.1084 130 31.1096 130 46.416C130 63.2797 118.126 78.4796 102.275 90.1074C86.4772 101.697 67.2293 109.354 53.5078 111.289C39.5004 113.265 27.4662 111.112 18.5918 104.994C9.7592 98.905 3.76485 88.6866 2.18652 73.9004C0.804578 60.9535 7.14433 42.9634 20.3965 28.1426C33.584 13.3941 53.4373 2 78.7725 2Z"
  },
  {
    viewBox: "0 0 114 123",
    width: 114,
    height: 123,
    path: "M9.85254 5.08691C14.303 2.08842 19.387 1.22337 25.6074 2.71387C31.9189 4.22619 39.3773 8.16551 48.3428 14.8115H48.3438C54.6721 19.5016 59.3722 22.5133 64.3926 24.5186C69.4237 26.5281 74.6565 27.4793 81.9785 28.2354C89.7218 29.0339 96.005 30.5378 100.782 32.6768C105.556 34.8141 108.71 37.5308 110.416 40.7041C113.775 46.9529 112.057 56.2142 102.497 69.0352C99.6073 72.9109 97.0067 77.4337 94.4863 82.1016C91.9384 86.8204 89.5052 91.6208 86.8477 96.2988C81.6969 105.366 76.0449 113.313 68.3633 117.591L67.6133 117.993C54.4846 124.782 38.8124 119.692 32.084 106.556L31.7705 105.924C27.2088 96.4439 25.495 86.9985 23.3047 77.1934C21.1955 67.7511 18.6595 58.0937 12.5859 48.4355L11.9873 47.501L11.2256 46.3125C7.41426 40.2506 3.62112 32.4694 2.40234 24.999C1.11592 17.1139 2.71008 9.9001 9.85254 5.08691Z"
  },
  {
    viewBox: "0 0 141 129",
    width: 141,
    height: 129,
    path: "M77.0459 14.0977C86.8144 5.10784 99.2037 0.386687 110.42 2.50195C121.804 4.64892 131.346 13.705 135.513 30.8994C138.687 44.002 138.736 58.6286 136.25 71.833C133.77 85.0021 128.722 96.9923 121.482 104.651C109.519 117.308 92.5368 124.708 75.1924 126.547C57.8513 128.385 39.9659 124.682 26.1904 114.895C2.53265 98.088 -5.36999 65.526 9.69531 44.0059C15.0767 36.3186 23.5058 33.0498 41.1289 30.5859C50.2739 29.3071 56.0975 28.0172 61.1807 25.6816C66.2509 23.3521 70.7222 19.918 77.0449 14.0977H77.0459Z"
  },
  {
    viewBox: "0 0 132 126",
    width: 132,
    height: 126,
    path: "M45.1748 5C48.9809 2.41469 54.6673 0.982912 62.8779 2.84766C70.4802 4.57348 75.4484 9.06905 81.3945 13.4883C87.2987 17.8763 93.9042 21.9016 104.228 21.4062L104.28 21.4043L104.333 21.3984C120.021 19.8142 133.035 33.7153 129.367 47.7393C128.655 50.463 127.55 53.3543 126.367 56.3721C125.202 59.3471 123.956 62.4548 123.058 65.4512C121.307 71.2878 120.589 77.6274 125.296 82.2793C127.44 84.8711 127.477 88.8856 125.707 92.084C123.986 95.1932 120.816 97.0877 116.83 95.8877C111.601 94.3134 107.617 94.271 104.883 96.8135C103.591 98.015 102.787 99.6241 102.217 101.367C101.646 103.112 101.258 105.162 100.908 107.387L100.9 107.436L100.896 107.484C99.755 118.107 88.0985 126.131 76.5039 123.498H76.5049C74.3748 123.014 72.1029 122.076 70.127 120.898C68.1253 119.706 66.5866 118.364 65.7725 117.163C61.1156 110.292 54.8357 108.673 49.4014 108.942C44.1787 109.201 39.4229 111.27 38.0879 111.665C35.0844 112.554 32.9939 112.421 31.54 111.9C30.0969 111.384 29.0576 110.405 28.293 109.181C26.6928 106.617 26.4785 103.251 26.543 102.284C26.8935 97.0298 25.7253 92.917 23.0537 89.542C20.4512 86.2542 16.5664 83.8564 11.8789 81.6816C4.56946 78.219 0.68994 70.5626 2.4043 63.3154L2.49023 62.9707C3.54135 58.9508 6.45448 55.6746 9.89355 53.1914L10.5879 52.7051C12.8209 51.1901 14.7537 49.1186 15.9199 46.3135C17.0847 43.5117 17.4215 40.1308 16.7168 36.0977C16.1566 32.892 16.9632 31.0495 18.1934 29.8545C19.5488 28.5377 21.7224 27.7099 24.3896 27.2539L24.4336 27.2461L24.4775 27.2363C28.5411 26.3545 31.653 25.1675 33.9434 23.1895C36.2879 21.1647 37.5472 18.5108 38.3164 15.1855C39.1493 11.5847 41.3211 7.61766 45.1748 5Z"
  }
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Translation function type (matches react-i18next's `t` shape we use here).
type TFunc = (key: string) => string;

// Format a booking date string for display in the active language.
// Pure module-level helper so it is not recreated on every render.
const formatBookingDate = (dateStr: string, isArabic: boolean): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
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
  rowDirection: "row" | "row-reverse";
  textStart: "left" | "right";
  textEnd: "left" | "right";
  t: TFunc;
  onViewDetails: (id: any) => void;
}

// Memoized booking card. Only re-renders when its own props change, so a stable
// `bookings` array no longer forces every card to re-render on parent updates.
const BookingCard = React.memo(function BookingCard({
  booking,
  index,
  isArabic,
  rowDirection,
  textStart,
  textEnd,
  t,
  onViewDetails
}: BookingCardProps) {
  const chaletName = (isArabic ? booking.chalet?.nameAr : booking.chalet?.nameEn) || '';
  const location = (isArabic ? booking.chalet?.locationAr : booking.chalet?.locationEn) || '';
  const shape = SHAPES_CONFIG[2];
  const imageSource = getImageSrc(booking.chalet?.images?.[0]?.url || booking.chalet?.images?.[0]);
  const statusBadge = getPaymentStatusBadge(booking, t, isArabic);

  return (
    <Animated.View
      entering={FadeInDown.delay((index % 8) * 60).duration(380)}
      style={styles.bookingCardContainer}
    >
      {/* Top Block: Image + Chalet Info */}
      <View style={[styles.topBlock, { flexDirection: rowDirection }]}>
        <View style={styles.imageBlock}>
          <Svg width={115} height={100} viewBox={shape.viewBox}>
            <Defs>
              <ClipPath id={`clip-${booking.id}`}>
                <Path d={shape.path} />
              </ClipPath>
            </Defs>
            <G clipPath={`url(#clip-${booking.id})`}>
              <SvgImage
                href={imageSource}
                width={shape.width}
                height={shape.height}
                preserveAspectRatio="xMidYMid slice"
              />
            </G>
            <Path d={shape.path} stroke="#15AB64" strokeWidth="6" fill="none" />
          </Svg>
        </View>

        <View style={styles.chaletInfoContent}>
          <View style={{ alignItems: isArabic ? 'flex-end' : 'flex-start' }}>
            <ThemedText style={[styles.chaletTitle, { textAlign: textStart }]}>{chaletName}</ThemedText>
            <ThemedText style={[styles.locationText, { textAlign: textStart }]}>{location}</ThemedText>
          </View>

          <View style={[styles.priceRatingRow, { flexDirection: rowDirection }]}>
            <ThemedText style={[styles.priceText, { textAlign: textStart }]}>
              <ThemedText style={styles.priceLabel}>{isArabic ? "شفت / " : "Shift / "}</ThemedText>
              {formatPrice(booking.chalet?.price)}
            </ThemedText>
            <View style={[styles.ratingBox, { flexDirection: rowDirection }]}>
              <ThemedText style={styles.ratingText}>{booking.chalet?.rating}</ThemedText>
              <SolarStarBold size={14} color="#EA2129" />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Block: Booking Details */}
      <View style={styles.bottomBlock}>
        <View style={[styles.detailRow, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.detailLabel, { textAlign: textStart }]}>{t('booking.bookingDate')}</ThemedText>
          <ThemedText style={[styles.detailValue, { textAlign: textEnd }]}>{formatBookingDate(booking.startDate, isArabic)}</ThemedText>
        </View>

        <View style={[styles.detailRow, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.detailLabel, { textAlign: textStart }]}>{t('booking.guests') || 'الأشخاص'}</ThemedText>
          <ThemedText style={[styles.detailValue, { textAlign: textEnd }]}>{booking.guestCount} {isArabic ? 'أشخاص' : 'guests'}</ThemedText>
        </View>

        {booking.paymentModel === 'deposit' && Number(booking.depositAmount) > 0 && (booking.status === 'confirmed' || booking.status === 'completed') ? (
          <>
            <View style={[styles.detailRow, { flexDirection: rowDirection }]}>
              <ThemedText style={[styles.detailLabel, { textAlign: textStart }]}>{t('booking.depositAmount') || 'مبلغ العربون'}</ThemedText>
              <ThemedText style={[styles.detailValue, { textAlign: textEnd }]}>{formatPrice(booking.depositAmount)}</ThemedText>
            </View>
            <View style={[styles.detailRow, { flexDirection: rowDirection }]}>
              <ThemedText style={[styles.detailLabel, { textAlign: textStart }]}>{t('booking.remainingAmount') || 'المبلغ المتبقي'}</ThemedText>
              <ThemedText style={[styles.detailValue, { textAlign: textEnd }]}>{formatPrice(booking.remainingAmount)}</ThemedText>
            </View>
          </>
        ) : null}

        <View style={[styles.detailRow, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.detailLabel, { textAlign: textStart }]}>{t('booking.finalAmount')}</ThemedText>
          <ThemedText style={[styles.detailValue, { textAlign: textEnd }]}>{formatPrice(booking.totalPrice)}</ThemedText>
        </View>

        <View style={[styles.detailRow, { flexDirection: rowDirection }]}>
          <ThemedText style={[styles.detailLabel, { textAlign: textStart }]}>{t('booking.paymentStatus')}</ThemedText>
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

// Press-scale feedback for the "View details" action (motion only — no design change).
const ViewDetailsButton = React.memo(function ViewDetailsButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedTouchable
      style={[styles.viewDetailsBtn, pressStyle]}
      activeOpacity={0.85}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 110 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
      }}
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
  const { isRTL, rowDirection, textAlign } = useDirection();
  const isArabic = isRTL;
  const textStart: "left" | "right" = textAlign;
  const textEnd: "left" | "right" = isArabic ? "left" : "right";

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
      status: booking.status,
      startDate: booking.bookingDate,
      endDate: booking.bookingDate,
      totalPrice: booking.totalPrice || booking.amount || 0,
      guestCount: booking.guestsCount || booking.guestCount || 0,
      paymentModel: booking.paymentModel,
      depositAmount: booking.depositAmount || 0,
      remainingAmount: booking.remainingAmount || 0,
      paymentStatus: booking.paymentStatus,
      chalet: {
        nameEn: booking.chalet?.name?.en || booking.chalet?.nameEn || booking.chalet?.name || '',
        nameAr: booking.chalet?.name?.ar || booking.chalet?.nameAr || booking.chalet?.name || '',
        locationEn: booking.chalet?.region?.name?.en || booking.chalet?.region?.nameEn || booking.chalet?.region?.name || '',
        locationAr: booking.chalet?.region?.name?.ar || booking.chalet?.region?.nameAr || booking.chalet?.region?.name || '',
        rating: booking.chalet?.averageRating || 0,
        price: booking.chalet?.basePrice || booking.totalPrice || 0,
        images: booking.chalet?.images || []
      }
    }));
  }, [bookingsResponse?.data]);

  const handleViewDetails = useCallback((id: any) => {
    router.push({ pathname: '/(tabs)/(customer)/booking-success', params: { id } });
  }, [router]);

  return (
    <SafeAreaView style={[styles.container]}>
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
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </View>
        ) : bookings.length > 0 ? (
          bookings.map((booking: any, index: number) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              index={index}
              isArabic={isArabic}
              rowDirection={rowDirection}
              textStart={textStart}
              textEnd={textEnd}
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

  bookingCardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.small
  },
  topBlock: {
    padding: 16,
    alignItems: 'center',
    gap: 15
  },
  chaletInfoContent: { flex: 1, height: 100, justifyContent: 'space-between' },
  chaletTitle: { fontSize: 14, fontFamily: "Alexandria-Medium", color: '#1E293B' },
  locationText: { fontSize: 14, color: '#64748B', fontFamily: "Alexandria-Medium", marginTop: 4 },

  priceRatingRow: { justifyContent: 'space-between', alignItems: 'center' },
  ratingBox: { alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontFamily: "Alexandria-Medium", color: '#1E293B' },
  priceText: { fontSize: 14, fontFamily: "Alexandria-Medium", color: '#111827' },
  priceLabel: { fontSize: 8, fontFamily: "Alexandria-Medium", color: '#64748B' },

  imageBlock: { width: 115, height: 100 },

  bottomBlock: {
    backgroundColor: '#FAFCFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  detailRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: '#111827' },
  detailValue: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: '#94A3B8' },

  paidBadge: { backgroundColor: '#035DF9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  paidBadgeText: { color: '#FFF', fontSize: 14, fontFamily: "Alexandria-Medium" },

  dividerFull: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15, opacity: 0.6 },
  viewDetailsBtn: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  viewDetailsText: { color: '#035DF9', fontSize: 14, fontFamily: "Alexandria-Medium", textAlign: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 14, fontFamily: "Alexandria-Medium", color: '#1E293B', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 20, fontFamily: "Alexandria-Medium" },
  exploreBtn: { marginTop: 24, backgroundColor: '#035DF9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  exploreBtnText: { color: 'white', fontFamily: "Alexandria-Medium" }
});
