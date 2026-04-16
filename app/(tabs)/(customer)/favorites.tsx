import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const router = useRouter();

  // Mock favorites that look like the design
  const favorites = [
    {
      id: '1',
      title: { ar: 'شالية الاروع علة الطلاق', en: 'Absolute Best Chalet' },
      location: { ar: 'البصرة - الجزائر', en: 'Basra - Algeria' },
      price: '30,000',
      rating: '4.5',
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400',
      color: '#22C55E' // Green squiggly for the one in image
    },
    {
        id: '2',
        title: { ar: 'شالية منتجع النخيل', en: 'Palm Resort Chalet' },
        location: { ar: 'البصرة - شط العرب', en: 'Basra - Shatt Al-Arab' },
        price: '45,000',
        rating: '4.8',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
        color: '#FF69B4'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching the design */}
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
    fontFamily: "LamaSans-Bold",
    color: '#1E293B',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
   fontFamily: "LamaSans-Regular" },
});
