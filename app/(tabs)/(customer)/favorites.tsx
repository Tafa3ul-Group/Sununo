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
      title: 'شالية الاروع علة الطلاق',
      location: 'البصرة - الجزائر',
      price: '30,000',
      rating: '4.5',
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400',
      color: '#22C55E' // Green squiggly for the one in image
    },
    {
        id: '2',
        title: 'شالية منتجع النخيل',
        location: 'البصرة - شط العرب',
        price: '45,000',
        rating: '4.8',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
        color: '#FF69B4'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header matching the design */}
      <View style={styles.header}>
         <View style={styles.headerInner}>
            <ThemedText style={styles.headerTitle}>{isRTL ? 'المفضلات' : 'Favorites'}</ThemedText>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <SolarAltArrowRightBold size={normalize.width(22)} color="#035DF9" />
            </TouchableOpacity>
         </View>
      </View>

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
            <ThemedText style={styles.emptyTitle}>{isRTL ? 'لا توجد مفضلات حتى الآن' : 'No favorites yet'}</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {isRTL ? 'أي شاليه تعجبك، يمكنك إضافتها هنا للوصول إليها لاحقاً بسهولة.' : 'Any chalet you like can be added here for easy access later.'}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  backButton: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
});
