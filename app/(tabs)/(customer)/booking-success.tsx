import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { normalize, Colors, isRTL } from '@/constants/theme';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { SolarMapPointBold } from '@/components/icons/solar-icons';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HeaderSection } from '@/components/header-section';

const MOCK_CHALET = {
    id: '1',
    title: "شالية الاروع علةاالطلاق",
    location: "البصرة - الجزائر",
    rating: 4.5,
    price: "30,000",
    detailedLocation: "البصرة - ابي الخصيب",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop"
};

export default function BookingSuccessDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Normalized Header */}
      <HeaderSection title={t('booking.bookingDetails') || 'تفاصيل الحجز'} showBackButton showLogo />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chalet Card */}
        <HorizontalCard 
            chalet={MOCK_CHALET} 
            style={styles.chaletCardInstance}
            hideFavorite={true}
            onPress={() => {}}
        />

        {/* Map Card */}
        <View style={styles.detailsMapCard}>
            <View style={styles.mapSnippetWrapper}>
                <ExpoImage source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/47.98,30.50,13,0/600x300?access_token=pk.dummy' }} style={styles.mapSnippet} />
                <View style={styles.mapMarker}>
                    <SolarMapPointBold size={32} color={Colors.primary} />
                </View>
            </View>
            <ThemedText style={styles.mapAddressLabel}>{MOCK_CHALET.detailedLocation}</ThemedText>
        </View>

        {/* Customer Information */}
        <View style={styles.infoSectionCard}>
            <ThemedText style={styles.sectionTitle}>{t('booking.customerInfo')}</ThemedText>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>{t('booking.name')}</ThemedText>
                <ThemedText style={styles.infoValue}>انسي انس</ThemedText>
            </View>
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>{t('booking.phone')}</ThemedText>
                <ThemedText style={[styles.infoValue, { direction: 'ltr' }]}>+496  7703409763</ThemedText>
            </View>
        </View>

        {/* Booking Information */}
        <View style={styles.infoSectionCard}>
            <ThemedText style={styles.sectionTitle}>{t('booking.bookingInfo')}</ThemedText>
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
                <View style={styles.statusBadgeBlue}>
                    <ThemedText style={styles.statusBadgeTextBlue}>{t('booking.status.accepted')}</ThemedText>
                </View>
                <ThemedText style={styles.infoLabel}>{t('booking.bookingStatus')}</ThemedText>
            </View>

            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>{t('booking.dateValue')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.date')}</ThemedText>
            </View>
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>{t('booking.morningShift')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.shift')}</ThemedText>
            </View>
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>{t('booking.guestsValue')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.guests')}</ThemedText>
            </View>
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>500,000 {t('common.iqd')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.totalAmount')}</ThemedText>
            </View>
        </View>

        {/* Payment Information */}
        <View style={styles.infoSectionCard}>
            <ThemedText style={styles.sectionTitle}>{t('booking.paymentDetails')}</ThemedText>
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
                <View style={styles.statusBadgeGray}>
                    <ThemedText style={styles.statusBadgeTextGray}>{t('booking.status.deferred')}</ThemedText>
                </View>
                <ThemedText style={styles.infoLabel}>{t('booking.paymentStatus')}</ThemedText>
            </View>

            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>500,000 {t('common.iqd')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.totalAmount')}</ThemedText>
            </View>
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>50,000 {t('common.iqd')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.depositAmount')}</ThemedText>
            </View>
            <View style={styles.infoRow}>
                <ThemedText style={styles.infoValue}>450,000 {t('common.iqd')}</ThemedText>
                <ThemedText style={styles.infoLabel}>{t('booking.remainingAmount')}</ThemedText>
            </View>
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
  mapAddressLabel: { textAlign: 'center', paddingVertical: 8, fontSize: normalize.font(12), fontFamily: "LamaSans-Black", color: '#1E293B' },
  infoSectionCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    marginBottom: 12
  },
  sectionTitle: { fontSize: normalize.font(14), fontFamily: "LamaSans-Black", color: Colors.primary, textAlign: isRTL ? 'right' : 'left' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: normalize.font(13), fontFamily: "LamaSans-Black", color: '#1E293B' },
  infoValue: { fontSize: normalize.font(13), fontFamily: "LamaSans-Bold", color: '#64748B' },
  statusBadgeBlue: { backgroundColor: '#035DF9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeTextBlue: { color: '#FFF', fontSize: normalize.font(12), fontFamily: "LamaSans-Black" },
  statusBadgeGray: { backgroundColor: '#94A3B8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeTextGray: { color: '#FFF', fontSize: normalize.font(12), fontFamily: "LamaSans-Black" },
});
