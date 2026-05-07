import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image, FlatList, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { 
  SolarAltArrowLeftBold, 
  SolarWaterBold, 
  SolarHome2Bold, 
  SolarWindBold, 
  SolarMapPointBold,
  SolarStarBold,
  SolarCloseCircleBold,
  SolarWidgetBold,
  SolarFireBold,
  SolarTreeBold
} from '@/components/icons/solar-icons';
import { SectionIcon } from '@/components/icons/section-icon';
import { Colors, normalize } from '@/constants/theme';
import { SecondaryButton } from '@/components/user/secondary-button';
import { HeaderSection } from '@/components/header-section';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


import { useGetCustomerChaletDetailsQuery } from '@/store/api/customerApiSlice';
import { getImageSrc } from '@/hooks/useImageSrc';

// Categories mapping helper
const CATEGORY_ICONS: Record<string, any> = {
  pool: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />,
  bbq: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />,
  kitchen: (isActive: boolean) => <SolarHome2Bold size={18} color={isActive ? "white" : Colors.secondary} />,
  bath: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.primary} />,
  default: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  pool: Colors.secondary,
  bbq: Colors.accent,
  kitchen: '#15AB64',
  bath: '#035DF9',
  default: Colors.primary,
};

const WavyHeader = ({ title, color }: { title: string, color: string }) => (
  <View style={styles.wavyHeaderContainer}>
    <SectionIcon 
      color={color} 
      title={title} 
      width={SCREEN_WIDTH - 32} 
      height={50} 
    />
  </View>
);

export default function GalleryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { userType } = useSelector((state: RootState) => state.auth);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState('');

  const { data: chaletData, isLoading } = useGetCustomerChaletDetailsQuery(chaletId);
  const chalet = chaletData?.data || chaletData || {};

  const gallerySections = useMemo(() => {
    if (!chalet.images) return [];

    const grouped: Record<string, any> = {};
    
    // Group images by category
    chalet.images.forEach((img: any) => {
      const categoryId = img.amenityCategory?.id || 'general';
      const categoryName = isRTL 
        ? img.amenityCategory?.name?.ar || img.amenityCategory?.name || t('gallery.categories.general')
        : img.amenityCategory?.name?.en || img.amenityCategory?.name || t('gallery.categories.general');
      
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          category: categoryName,
          color: CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default,
          images: [],
          iconKey: categoryId
        };
      }
      grouped[categoryId].images.push(getImageSrc(img.url));
    });

    return Object.values(grouped);
  }, [chalet.images, isRTL, t]);

  const CATEGORIES = useMemo(() => {
    const cats = [
      { id: 'all', label: t('gallery.categories.all'), icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary }
    ];

    gallerySections.forEach(section => {
      cats.push({
        id: section.id,
        label: section.category,
        icon: (isActive: boolean) => {
          const IconGen = CATEGORY_ICONS[section.iconKey] || CATEGORY_ICONS.default;
          return IconGen(isActive);
        },
        activeColor: section.color
      });
    });

    return cats;
  }, [gallerySections, t]);

  const openViewer = (url: any) => {
    setViewerImage(typeof url === 'string' ? url : Image.resolveAssetSource(url).uri);
    setViewerVisible(true);
  };

  const filteredData = activeFilter === 'all' 
    ? gallerySections 
    : gallerySections.filter(section => section.id === activeFilter);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Photo Viewer Modal */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
         <View style={styles.modalBg}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setViewerVisible(false)}>
               <SolarCloseCircleBold size={32} color="white" />
            </TouchableOpacity>
            <Image source={{ uri: viewerImage }} style={styles.modalImg} resizeMode="contain" />
         </View>
      </Modal>

      {/* Header */}
      <HeaderSection 
        title={t('headers.gallery')} 
        showBackButton 
        showLogo={true} 
        showSearch={false} 
        showCategories={false}
        userType={userType}
        onBackPress={() => router.back()}
      />

      {/* Categories Filter (Home Page Style) */}
      <View style={styles.catArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }}>
            {CATEGORIES.map((filter) => (
              <SecondaryButton 
                key={filter.id} 
                label={filter.label} 
                isActive={activeFilter === filter.id} 
                activeColor={filter.activeColor} 
                icon={filter.icon(activeFilter === filter.id)} 
                onPress={() => setActiveFilter(filter.id)} 
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredData.map((section, idx) => (
          <View key={idx} style={styles.sectionWrap}>
            <WavyHeader title={section.category} color={section.color} />
            
            {/* Big Image */}
            <TouchableOpacity activeOpacity={0.9} onPress={() => openViewer(section.images[0])} style={styles.imageCard}>
               <Image source={{ uri: section.images[0] }} style={styles.bigImage} />
            </TouchableOpacity>
            
            {/* Small Grid */}
            <View style={[styles.smallGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {section.images.slice(1, 4).map((img, i) => (
                <TouchableOpacity key={i} style={styles.smallImageCard} activeOpacity={0.9} onPress={() => openViewer(img)}>
                   <Image source={{ uri: img }} style={styles.smallImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {filteredData.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ThemedText style={{ color: '#9CA3AF' }}>{t('gallery.empty')}</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  catArea: {
    paddingVertical: 10,
  },
  catList: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 35,
  },
  wavyHeaderContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  imageCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    marginBottom: 15,
  },
  bigImage: {
    width: '100%',
    height: 240,
  },
  smallGrid: {
    justifyContent: 'space-between',
    gap: 12,
  },
  smallImageCard: {
    flex: 1,
    height: 110,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalImg: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
