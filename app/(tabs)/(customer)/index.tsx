import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Redirect, useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeFilter, setActiveFilter] = React.useState("all");
  const insets = useSafeAreaInsets();

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const navigateToDetails = (id: string) => router.push(`/chalet-details/${id}`);

  // Moved inside to use translations
  const POPULAR_CHALETS = [
    {
      id: "1",
      title: isRTL ? "شالية اللؤلؤة البصرية" : "Basra Pearl Chalet",
      location: isRTL ? "البصرة - شط العرب" : "Basra - Shatt al-Arab",
      price: "45,000",
      rating: 4.9,
      color: Colors.primary,
      image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "2",
      title: isRTL ? "شالية الورد والياسمين" : "Jasmine Flower Chalet",
      location: isRTL ? "البصرة - الجزائر" : "Basra - Al-Jaza'ir",
      price: "35,000",
      rating: 4.8,
      color: Colors.secondary,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "3",
      title: isRTL ? "شالية إطلالة الخليج" : "Gulf View Chalet",
      location: isRTL ? "البصرة - القبلة" : "Basra - Al-Qibla",
      price: "25,000",
      rating: 4.2,
      color: Colors.accent,
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600",
    },
  ];

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
        <BannerSwiper />

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
        <View style={styles.swiperWrapper}>
          <HorizontalSwiper 
            data={POPULAR_CHALETS} 
            onPressCard={navigateToDetails} 
          />
        </View>

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
           {[...POPULAR_CHALETS, ...POPULAR_CHALETS].map((item, index) => (
             <HorizontalCard key={index} chalet={item} onPress={() => navigateToDetails(item.id)} />
           ))}
        </View>
      </ScrollView>

      <SearchFilterSheet ref={bottomSheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 120 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionTitle: { 
    fontSize: normalize.font(20), 
    fontFamily: "LamaSans-Black", 
    color: Colors.text.primary, 
  },
  seeAll: { 
    fontSize: normalize.font(13), 
    color: Colors.primary, 
    fontFamily: "LamaSans-SemiBold", 
    textDecorationLine: "underline" 
  },
  mapContainer: { height: 210, marginHorizontal: 16, borderRadius: 28, overflow: "hidden", backgroundColor: "#F3F4F6", marginTop: 10 },
  map: { flex: 1 },
  listPadding: { paddingHorizontal: 16 },
  tabsContainer: { paddingHorizontal: 16, marginVertical: 10 },
  swiperWrapper: { marginVertical: 10 },
});
