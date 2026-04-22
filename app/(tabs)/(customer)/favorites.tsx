import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarAltArrowRightBold, SolarHeartBold } from "@/components/icons/solar-icons";
import { useRouter } from 'expo-router';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { HeaderSection } from '@/components/header-section';
import { useGetCustomerFavoritesQuery } from '@/store/api/customerApiSlice';
import { getImageSrc } from '@/hooks/useImageSrc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const router = useRouter();

  // Fetch favorites from the backend
  const { data: favoritesResponse, isLoading, refetch } = useGetCustomerFavoritesQuery({ page: 1, limit: 50 });

  // Transform API data to match card format
  const favorites = useMemo(() => {
    const items = favoritesResponse?.data || [];
    return items.map((fav: any) => {
      const chalet = fav.chalet || fav;
      return {
        id: chalet.id,
        title: isRTL 
          ? (chalet.name?.ar || chalet.nameAr || chalet.name || '') 
          : (chalet.name?.en || chalet.nameEn || chalet.name || ''),
        location: isRTL
          ? (chalet.region?.name?.ar || chalet.region?.nameAr || chalet.region?.name || '')
          : (chalet.region?.name?.en || chalet.region?.nameEn || chalet.region?.name || ''),
        price: chalet.basePrice ? Number(chalet.basePrice).toLocaleString() : '0',
        rating: chalet.averageRating?.toFixed(1) || '0',
        image: getImageSrc(chalet.images?.[0]?.url),
        color: '#22C55E',
      };
    });
  }, [favoritesResponse, isRTL]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching the design */}
      <HeaderSection 
        title={t('headers.favorites')} 
        showBackButton 
        showLogo={false} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {favorites.length > 0 ? (
          favorites.map((chalet, index) => (
            <View key={chalet.id} style={styles.cardWrapper}>
                 <HorizontalCard 
                    chalet={chalet} 
                    shapeIndex={index + 1} 
                    onPress={() => router.push({ pathname: '/chalet-details', params: { id: chalet.id } })}
                    style={styles.customCard}
                 />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <SolarHeartBold size={80} color="#E2E8F0" />
            <ThemedText style={styles.emptyTitle}>{t('profile.review.noFavorites')}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {t('profile.review.noFavoritesDesc')}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: normalize.height(15),
  },
  customCard: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Tajawal-Bold",
    color: '#1E293B',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
   fontFamily: "Tajawal-Regular" },
});
