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

// --- تحديث الصور لتبدو كشاليهات حقيقية وفخمة ---
const POPULAR_CHALETS = [
  {
    id: "1",
    title: "شالية الؤلؤة البصرية",
    location: "البصرة - شط العرب",
    price: "45,000",
    rating: 4.9,
    color: Colors.primary,
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "2",
    title: "شالية الورد والياسمين",
    location: "البصرة - الجزائر",
    price: "35,000",
    rating: 4.8,
    color: Colors.secondary,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "3",
    title: "شالية إطلالة الخليج",
    location: "البصرة - القبلة",
    price: "25,000",
    rating: 4.2,
    color: Colors.accent,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600",
  },
];

const FILTER_OPTIONS = [
  { id: "all", label: "الكل", icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
  { id: "pool", label: "يحتوي مسبح", icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
  { id: "bbq", label: "شواء", icon: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />, activeColor: Colors.accent },
  { id: "garden", label: "حديقة", icon: (isActive: boolean) => <SolarTreeBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
];

export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = React.useState("all");
  const insets = useSafeAreaInsets();

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const navigateToDetails = (id: string) => router.push(`/chalet-details/${id}`);

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

        {/* الأقرب إليك */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity><ThemedText style={styles.seeAll}>افتح الخارطة</ThemedText></TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>الاقرب اليك</ThemedText>
        </View>
        <View style={styles.mapContainer}>
          <AppMap style={styles.map} showMarker onPressCard={navigateToDetails} />
        </View>

        {/* الأفضل اليوم (Horizontal) */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity><ThemedText style={styles.seeAll}>عرض الكل</ThemedText></TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>آخر الحجوزات</ThemedText>
        </View>
        <View style={styles.swiperWrapper}>
          <HorizontalSwiper 
            data={POPULAR_CHALETS} 
            onPressCard={navigateToDetails} 
          />
        </View>

        {/* مقترح لك */}
        <View style={[styles.sectionHeader, { justifyContent: "flex-end" }]}>
          <ThemedText style={styles.sectionTitle}>مقترح لك</ThemedText>
        </View>
        <GHScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
           <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
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
    fontSize: normalize.font(22), 
    fontFamily: "LamaSans-Black", 
    color: Colors.text.primary, 
    textAlign: 'right' 
  },
  seeAll: { 
    fontSize: normalize.font(15), 
    color: Colors.primary, 
    fontFamily: "LamaSans-SemiBold", 
    textDecorationLine: "underline" 
  },
  popularRow: { paddingHorizontal: 16, flexDirection: "row-reverse", gap: 12 },
  mapContainer: { height: 210, marginHorizontal: 16, borderRadius: 28, overflow: "hidden", backgroundColor: "#F3F4F6", marginTop: 10 },
  map: { flex: 1 },
  listPadding: { paddingHorizontal: 16 },
  tabsContainer: { paddingHorizontal: 16, marginVertical: 10 },
  swiperWrapper: { marginVertical: 10 },
});
