import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Redirect, useRouter } from "expo-router";
import React, { useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";

import { HeaderSection } from "@/components/header-section";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { ColoredCard } from "@/components/user/colored-card";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { BannerSwiper } from "@/components/user/banner-swiper";
import { PrimaryButton } from "@/components/user/primary-button";
import { SearchFilterSheet } from "@/components/user/search-filter-sheet";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import { 
  SolarWidgetBold, 
  SolarWaterBold, 
  SolarFireBold, 
  SolarTreeBold 
} from "@/components/icons/solar-icons";
import { useBrowseCustomerChaletsQuery, useGetBannersQuery } from "@/store/api/customerApiSlice";
import { getImageSrc } from "@/hooks/useImageSrc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Fallback colors for chalet cards
const CARD_COLORS = [Colors.primary, Colors.secondary, Colors.accent];

export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [filters, setFilters] = React.useState<any>({});
  const insets = useSafeAreaInsets();

  // Map categories to amenity names/ids for filtering
  const amenityIds = useMemo(() => {
    if (activeFilter === 'pool') return ['poo-id-placeholder']; // Ideally these would come from an amenities API
    if (activeFilter === 'bbq') return ['bbq-id-placeholder'];
    if (activeFilter === 'garden') return ['garden-id-placeholder'];
    return undefined;
  }, [activeFilter]);

  // Fetch data from the backend
  const { data: bannersResponse } = useGetBannersQuery(undefined);
  const { data: chaletsResponse, isLoading: chaletsLoading } = useBrowseCustomerChaletsQuery({ 
    page: 1, 
    limit: 10,
    amenityIds,
    ...filters
  });

  // Transform banners
  const banners = useMemo(() => {
    return (bannersResponse || []).map((b: any) => ({
      id: b.id,
      image: b.imageUrl,
      title: isRTL ? (b.title?.ar || b.title) : (b.title?.en || b.title),
    }));
  }, [bannersResponse, isRTL]);

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const navigateToDetails = (id: string) => router.push(`/chalet-details/${id}`);

  // Transform API data to match card format, with fallback to empty array
  const POPULAR_CHALETS = useMemo(() => {
    const chalets = chaletsResponse?.data || [];
    return chalets.map((chalet: any, index: number) => ({
      id: chalet.id,
      title: isRTL 
        ? (chalet.name?.ar || chalet.nameAr || chalet.name || '') 
        : (chalet.name?.en || chalet.nameEn || chalet.name || ''),
      location: isRTL 
        ? (chalet.region?.name?.ar || chalet.region?.nameAr || chalet.region?.name || '') 
        : (chalet.region?.name?.en || chalet.region?.nameEn || chalet.region?.name || ''),
      price: chalet.shifts?.[0]?.pricing?.[0]?.price 
        ? Number(chalet.shifts[0].pricing[0].price).toLocaleString() 
        : chalet.basePrice ? Number(chalet.basePrice).toLocaleString() : '0',
      rating: chalet.averageRating || 0,
      color: CARD_COLORS[index % CARD_COLORS.length],
      image: getImageSrc(chalet.images?.[0]?.url),
    }));
  }, [chaletsResponse, isRTL]);

  const FILTER_OPTIONS = [
    { id: "all", label: t("home.categories.all"), icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
    { id: "pool", label: t("home.categories.pool"), icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
    { id: "bbq", label: t("home.categories.bbq"), icon: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />, activeColor: Colors.accent },
    { id: "garden", label: t("home.categories.garden"), icon: (isActive: boolean) => <SolarTreeBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
  ];

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <HeaderSection 
          isHome
          onExtraIconPress={() => bottomSheetRef.current?.present()} 
        />

        {/* Banners Swiper */}
        <BannerSwiper data={banners} />

        {/* Nearby / Map */}
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <TouchableOpacity><ThemedText style={styles.seeAll}>{t('home.openMap')}</ThemedText></TouchableOpacity>
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.categories.nearby')}</ThemedText>
        </View>
        <View style={styles.mapContainer}>
          <AppMap style={styles.map} showMarker onPressCard={navigateToDetails} />
        </View>

        {/* Popular / Recent */}
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <TouchableOpacity><ThemedText style={styles.seeAll}>{t('home.seeAll')}</ThemedText></TouchableOpacity>
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.recentBookings')}</ThemedText>
        </View>
        
        {chaletsLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.swiperWrapper}>
            <HorizontalSwiper 
              data={POPULAR_CHALETS} 
              onPressCard={navigateToDetails} 
            />
          </View>
        )}

        {/* Recommended */}
        <View style={[styles.sectionHeader, { justifyContent: isRTL ? "flex-end" : "flex-start" }]}>
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.recommended')}</ThemedText>
        </View>
        <GHScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
           <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }}>
             {FILTER_OPTIONS.map((filter) => (
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
        </GHScrollView>

        <View style={styles.listPadding}>
           {chaletsLoading ? (
             <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
           ) : POPULAR_CHALETS.length > 0 ? (
             POPULAR_CHALETS.map((item, index) => (
               <HorizontalCard key={index} chalet={item} onPress={() => navigateToDetails(item.id)} />
             ))
           ) : (
             <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>{t('common.noData') || 'لا توجد بيانات'}</ThemedText>
             </View>
           )}
        </View>
      </ScrollView>

      <SearchFilterSheet 
        ref={bottomSheetRef} 
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 120 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionTitle: { 
    fontSize: normalize.font(20), 
    fontFamily: "Tajawal-Black", 
    color: Colors.text.primary, 
  },
  seeAll: { 
    fontSize: normalize.font(13), 
    color: Colors.primary, 
    fontFamily: "Tajawal-SemiBold", 
    textDecorationLine: "underline" 
  },
  mapContainer: { height: 210, marginHorizontal: 16, borderRadius: 28, overflow: "hidden", backgroundColor: "#F3F4F6", marginTop: 10 },
  map: { flex: 1 },
  listPadding: { paddingHorizontal: 16 },
  tabsContainer: { paddingHorizontal: 16, marginVertical: 10 },
  swiperWrapper: { marginVertical: 10 },
});
