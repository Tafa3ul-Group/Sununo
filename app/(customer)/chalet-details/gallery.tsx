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


const GALLERY_DATA = [
  {
    category: 'المطبخ',
    color: '#15AB64',
    images: [
      'https://images.unsplash.com/photo-1556911220-e1502138a597?w=800', // Large
      'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
      'https://images.unsplash.com/photo-1556911261-6bd741557538?w=400',
    ]
  },
  {
    category: 'الحمام',
    color: '#035DF9',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', // Large
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
      'https://images.unsplash.com/photo-1620626011761-9963d7b6dd3a?w=400',
      'https://images.unsplash.com/photo-1604084792761-904f81491740?w=400',
    ]
  }
];

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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { userType } = useSelector((state: RootState) => state.auth);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState('');

  const CATEGORIES = [
    { id: 'all', label: t('gallery.categories.all'), icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
    { id: 'pool', label: t('gallery.categories.pool'), icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
    { id: 'bbq', label: t('gallery.categories.bbq'), icon: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />, activeColor: Colors.accent },
    { id: 'kitchen', label: t('gallery.categories.kitchen'), icon: (isActive: boolean) => <SolarHome2Bold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
    { id: 'bath', label: t('gallery.categories.bath'), icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
  ];

  const GALLERY_DATA = [
    {
      id: 'kitchen',
      category: t('gallery.categories.kitchen'),
      color: '#15AB64',
      images: [
        'https://images.unsplash.com/photo-1556911220-e1502138a597?w=800', // Large
        'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400',
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
        'https://images.unsplash.com/photo-1556911261-6bd741557538?w=400',
      ]
    },
    {
      id: 'bath',
      category: t('gallery.categories.bath'),
      color: '#035DF9',
      images: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', // Large
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
        'https://images.unsplash.com/photo-1620626011761-9963d7b6dd3a?w=400',
        'https://images.unsplash.com/photo-1604084792761-904f81491740?w=400',
      ]
    }
  ];

  const openViewer = (url: string) => {
    setViewerImage(url);
    setViewerVisible(true);
  };

  const filteredData = activeFilter === 'all' 
    ? GALLERY_DATA 
    : GALLERY_DATA.filter(section => section.id === activeFilter);

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
