import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { normalize, Colors, isRTL } from '@/constants/theme';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { SolarMapPointBold } from '@/components/icons/solar-icons';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HeaderSection } from '@/components/header-section';
import { useGetCustomerBookingDetailsQuery } from '@/store/api/customerApiSlice';
import { getImageSrc } from '@/hooks/useImageSrc';
import { useFormatTime } from '@/hooks/useFormatTime';

export default function BookingSuccessDetailsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookingId = id as string;
  const { formatShiftTime } = useFormatTime();

  // Fetch booking details from the backend
  const { data: booking, isLoading } = useGetCustomerBookingDetailsQuery(bookingId, {
    skip: !bookingId,
  });

  // Extract data from API response with fallbacks
  const chalet = booking?.chalet || {} as any;
  const chaletTitle = isRTL 
    ? (chalet.name?.ar || chalet.nameAr || chalet.name || '') 
    : (chalet.name?.en || chalet.nameEn || chalet.name || '');
  const chaletLocation = isRTL 
    ? (chalet.region?.name?.ar || chalet.region?.nameAr || chalet.region?.name || '') 
    : (chalet.region?.name?.en || chalet.region?.nameEn || chalet.region?.name || '');
  const detailedLocation = chaletLocation;
  const chaletImage = getImageSrc(chalet.images?.[0]?.url);
  const totalPrice = booking?.totalPrice ? Number(booking.totalPrice).toLocaleString() : '0';
  const depositAmount = booking?.depositAmount ? Number(booking.depositAmount).toLocaleString() : '0';
  const remainingAmount = booking?.remainingAmount ? Number(booking.remainingAmount).toLocaleString() : '0';

  const shiftInfo = useMemo(() => {
    if (!booking?.shift) return t('booking.morningShift');
    const name = isRTL ? (booking.shift.name?.ar || booking.shift.name) : (booking.shift.name?.en || booking.shift.name);
    const time = `${formatShiftTime(booking.shift.startTime)} - ${formatShiftTime(booking.shift.endTime)}`;
    return `${name} (${time})`;
  }, [booking, isRTL, t]);

  const renderInfoRow = (label: string, value: string | React.ReactNode) => (
    <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        {typeof value === 'string' ? (
          <ThemedText style={styles.infoValue}>{value}</ThemedText>
        ) : (
          value
        )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Normalized Header */}
      <HeaderSection title={t('booking.bookingDetails') || 'تفاصيل الحجز'} showBackButton showLogo />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chalet Card */}
        <HorizontalCard 
            chalet={{
              id: chalet.id || '',
              title: chaletTitle,
              location: chaletLocation,
              rating: chalet.averageRating || 0,
              price: chalet.basePrice ? Number(chalet.basePrice).toLocaleString() : '0',
              image: chaletImage,
            }} 
            style={styles.chaletCardInstance}
            hideFavorite={true}
            onPress={() => {}}
        />

        {/* Map Card */}
        <View style={styles.detailsMapCard}>
            <View style={styles.mapSnippetWrapper}>
                <ExpoImage source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/47.98,30.50,13,0/600x300?access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}` }} style={styles.mapSnippet} />
                <View style={styles.mapMarker}>
                    <SolarMapPointBold size={32} color={Colors.primary} />
                </View>
            </View>
            <ThemedText style={styles.mapAddressLabel}>{detailedLocation}</ThemedText>
        </View>

        {/* Customer Information */}
        <View style={styles.infoSectionCard}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('booking.customerInfo')}</ThemedText>
            <View style={styles.divider} />
            {renderInfoRow(t('booking.name'), t('booking.nameValue'))}
            {renderInfoRow(t('booking.phone'), <ThemedText style={[styles.infoValue, { direction: 'ltr' }]}>{t('booking.phoneValue')}</ThemedText>)}
        </View>

        {/* Booking Information */}
        <View style={styles.infoSectionCard}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('booking.bookingInfo')}</ThemedText>
            <View style={styles.divider} />
            
            <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <ThemedText style={styles.infoLabel}>{t('booking.bookingStatus')}</ThemedText>
                <View style={styles.statusBadgeBlue}>
                    <ThemedText style={styles.statusBadgeTextBlue}>{t('booking.status.accepted')}</ThemedText>
                </View>
            </View>

            {renderInfoRow(t('booking.date'), booking?.bookingDate || t('booking.dateValue'))}
            {renderInfoRow(t('booking.shift'), shiftInfo)}
            {renderInfoRow(t('booking.guests'), booking?.guestCount?.toString() || t('booking.guestsValue'))}
            {renderInfoRow(t('booking.totalAmount'), `${totalPrice} ${t('common.iqd')}`)}
        </View>

        {/* Payment Information */}
        <View style={styles.infoSectionCard}>
            <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('booking.paymentDetails')}</ThemedText>
            <View style={styles.divider} />
            
            <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <ThemedText style={styles.infoLabel}>{t('booking.paymentStatus')}</ThemedText>
                <View style={styles.statusBadgeGray}>
                    <ThemedText style={styles.statusBadgeTextGray}>
                      {booking?.paymentStatus === 'paid' ? t('booking.status.paid') : t('booking.status.deferred')}
                    </ThemedText>
                </View>
            </View>

            {renderInfoRow(t('booking.totalAmount'), `${totalPrice} ${t('common.iqd')}`)}
            {renderInfoRow(t('booking.depositAmount'), `${depositAmount} ${t('common.iqd')}`)}
            {renderInfoRow(t('booking.remainingAmount'), `${remainingAmount} ${t('common.iqd')}`)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
  chaletCardInstance: { width: '100%', marginRight: 0, marginBottom: 16 },
  detailsMapCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    marginBottom: 16
  },
  mapSnippetWrapper: { width: '100%', height: 120, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  mapSnippet: { width: '100%', height: '100%' },
  mapMarker: { position: 'absolute', zIndex: 3 },
  mapAddressLabel: { textAlign: 'center', paddingVertical: 8, fontSize: normalize.font(12), fontFamily: "Tajawal-Black", color: '#1E293B' },
  infoSectionCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    marginBottom: 12,
    paddingBottom: 24, // Add more padding at bottom
  },
  sectionTitle: { fontSize: normalize.font(14), fontFamily: "Tajawal-Black", color: Colors.primary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  infoRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: normalize.font(13), fontFamily: "Tajawal-Black", color: '#1E293B' },
  infoValue: { fontSize: normalize.font(13), fontFamily: "Tajawal-Bold", color: '#64748B' },
  statusBadgeBlue: { backgroundColor: '#035DF9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeTextBlue: { color: '#FFF', fontSize: normalize.font(12), fontFamily: "Tajawal-Black" },
  statusBadgeGray: { backgroundColor: '#94A3B8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeTextGray: { color: '#FFF', fontSize: normalize.font(12), fontFamily: "Tajawal-Black" },
});

