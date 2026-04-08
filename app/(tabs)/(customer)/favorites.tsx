import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarHeartBold, SolarStarBold, SolarMapPointBold } from "@/components/icons/solar-icons";
import { formatPrice } from '@/utils/format';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const router = useRouter();

  // Mock favorites for now
  const favorites: any[] = [];

  const renderFavoriteItem = (chalet: any) => {
    const chaletName = isRTL ? (chalet.name?.ar || chalet.name) : (chalet.name?.en || chalet.name);
    
    return (
      <TouchableOpacity 
        key={chalet.id} 
        style={styles.chaletCard}
        onPress={() => router.push({ pathname: '/chalet-details', params: { id: chalet.id } })}
      >
        <Image 
          source={{ uri: chalet.images?.[0]?.url || 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=400' }} 
          style={styles.chaletImage} 
        />
        <TouchableOpacity style={styles.favoriteBadge}>
          <SolarHeartBold size={20} color="#EA2129" />
        </TouchableOpacity>
        
        <View style={styles.chaletInfo}>
          <View style={styles.headerRow}>
            <ThemedText style={styles.chaletName}>{chaletName}</ThemedText>
            <View style={styles.ratingRow}>
              <SolarStarBold size={14} color="#F59E0B" />
              <ThemedText style={styles.ratingText}>4.8</ThemedText>
            </View>
          </View>
          
          <View style={[styles.detailsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             <SolarMapPointBold size={14} color="#64748B" />
             <ThemedText style={styles.detailsText}>{isRTL ? 'البصرة - الجزائر' : 'Basra - Al Jazayer'}</ThemedText>
          </View>
          
          <View style={styles.cardFooter}>
            <ThemedText style={styles.priceValue}>{formatPrice(450000)}</ThemedText>
            <ThemedText style={styles.priceLabel}>/ {isRTL ? 'الليلة' : 'night'}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{t('tabs.favorites')}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {favorites.length > 0 ? (
          favorites.map(renderFavoriteItem)
        ) : (
          <View style={styles.emptyState}>
            <SolarHeartBold size={80} color="#E2E8F0" />
            <ThemedText style={styles.emptyTitle}>{isRTL ? 'لا توجد مفضلات حتى الآن' : 'No favorites yet'}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {isRTL ? 'أي شاليه تعجبك، يمكنك إضافتها هنا للوصول إليها لاحقاً بسهولة.' : 'Any chalet you like can be added here for easy access later.'}
            </ThemedText>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')}>
              <ThemedText style={styles.exploreBtnText}>{isRTL ? 'اكتشف الشاليهات' : 'Explore Chalets'}</ThemedText>
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
  chaletCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chaletImage: {
    width: '100%',
    height: 180,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  chaletInfo: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chaletName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailsText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#035DF9',
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
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
