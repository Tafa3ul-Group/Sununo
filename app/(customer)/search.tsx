import React, { useState, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { 
  SolarMagnifierBold, 
  SolarAltArrowLeftBold,
  SolarAltArrowRightBold,
  SolarTrashBinBold
} from '@/components/icons/solar-icons';
import { useBrowseCustomerChaletsQuery } from '@/store/api/customerApiSlice';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { getImageSrc } from '@/hooks/useImageSrc';
import { HeaderSection } from '@/components/header-section';

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: chaletsResponse, isLoading } = useBrowseCustomerChaletsQuery({ 
    page: 1, 
    limit: 20,
    search: searchQuery || undefined
  });

  const chalets = useMemo(() => {
    const data = chaletsResponse?.data || [];
    return data.map((chalet: any) => ({
      id: chalet.id,
      title: isRTL 
        ? (chalet.name?.ar || chalet.nameAr || chalet.name || '') 
        : (chalet.name?.en || chalet.nameEn || chalet.name || ''),
      location: isRTL 
        ? (chalet.region?.name?.ar || chalet.region?.nameAr || chalet.region?.name || '') 
        : (chalet.region?.name?.en || chalet.region?.nameEn || chalet.region?.name || ''),
      price: chalet.basePrice ? Number(chalet.basePrice).toLocaleString() : '0',
      rating: chalet.averageRating || 0,
      image: chalet.images?.[0]?.url || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop",
    }));
  }, [chaletsResponse, isRTL]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cardWrapper}>
      <HorizontalCard 
        chalet={item} 
        onPress={() => router.push(`/chalet-details/${item.id}`)}
        shapeIndex={1}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderSection 
        title={t('home.search')}
        isHome={false}
        showBackButton={true}
        onBackPress={() => router.back()}
        showLogo={false}
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <SolarMagnifierBold size={20} color={Colors.primary} />
          <TextInput
            placeholder={t('home.searchPlaceholder')}
            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <SolarTrashBinBold size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : searchQuery.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <SolarMagnifierBold size={40} color={Colors.primary} />
          </View>
          <ThemedText style={styles.emptyText}>
            {isRTL ? 'ابدأ البحث عن الشاليهات المفضلة لديك' : 'Start searching for your favorite chalets'}
          </ThemedText>
        </View>
      ) : chalets.length === 0 ? (
        <View style={styles.centerContainer}>
          <ThemedText style={styles.emptyText}>
            {isRTL ? 'لا توجد نتائج مطابقة لبحثك' : 'No results matching your search'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={chalets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: 'Tajawal-Medium',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    fontFamily: 'Tajawal-Medium',
    lineHeight: 24,
  },
});
