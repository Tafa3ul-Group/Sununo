import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, normalize } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarHeartBold } from "@/components/icons/solar-icons";
import { useRouter } from 'expo-router';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { HorizontalCardSkeleton } from '@/components/ui/skeleton-loader';
import Animated from 'react-native-reanimated';
import { HeaderSection } from '@/components/header-section';
import { useGetCustomerFavoritesQuery, useToggleFavoriteMutation } from '@/store/api/customerApiSlice';
import { getImageSrc } from '@/hooks/useImageSrc';
import { getStartingPrice } from '@/utils/format';
import { pickTranslation, useDirection } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
    const router = useRouter();

  // Fetch favorites from the backend
  const { data: favoritesResponse, isLoading, isError, refetch } = useGetCustomerFavoritesQuery({ page: 1, limit: 50 });
  const [toggleFavorite] = useToggleFavoriteMutation();

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      await toggleFavorite(id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [toggleFavorite, refetch]);

  const handleToggleFavoriteMemoized = useCallback(
    (id: string) => handleToggleFavorite(id),
    [handleToggleFavorite]
  );

  // Transform API data to match card format
  const favorites = useMemo(() => {
    const items = favoritesResponse?.data || [];
    return items.map((fav: any) => {
      const chalet = fav.chalet || fav;
      return {
        id: chalet.id,
        title: pickTranslation(chalet, isRTL),
        location: pickTranslation(chalet.region, isRTL),
        price: getStartingPrice(chalet),
        // Carried through so the card can show the discount badge; the API
        // leaves it undefined when no campaign is running.
        discount: chalet.discount,
        rating: chalet.averageRating?.toFixed(1) || '0',
        // The few amenities the card lists ("يحتوي على: ...").
        features: chalet.features ?? chalet.chaletFeatures,
        image: getImageSrc(chalet.images?.[0]?.url),
        color: '#22C55E' };
    });
  }, [favoritesResponse, isRTL]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching the design */}
      <HeaderSection
        title={t('headers.favorites')}
        showBackButton
        onBackPress={() => router.back()}
        showLogo={false}
      />

      {isError && favorites.length === 0 ? (
        <ErrorState onRetry={refetch} onBack={() => router.back()} />
      ) : (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {isLoading && favorites.length === 0 ? (
          <View style={{ gap: 12, paddingTop: 4 }}>
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
          </View>
        ) : favorites.length > 0 ? (
          favorites.map((chalet: typeof favorites[number], index: number) => (
            <Animated.View
              key={chalet.id}
              style={styles.cardWrapper}
            >
                 <HorizontalCard
                    chalet={chalet}
                    shapeIndex={index + 1}
                    onPress={() => router.push(`/chalet-details/${chalet.id}`)}
                    style={styles.customCard}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavoriteMemoized(chalet.id)}
                 />
            </Animated.View>
          ))
        ) : (
          <EmptyState
            icon={<SolarHeartBold size={64} color="#EA2129" />}
            title={t('profile.review.noFavorites')}
            description={t('profile.review.noFavoritesDesc')}
          />
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white' },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100 },
  cardWrapper: {
    position: 'relative',
    marginBottom: normalize.height(15) },
  customCard: {
    borderWidth: 1,
    borderColor: '#F3F4F6' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40 },
  emptyTitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: '#1E293B',
    marginTop: 20 },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    fontFamily: "IBMPlexSansArabic-Regular" 
  } });
