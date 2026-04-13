import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { Redirect, useRouter } from "expo-router";
import { AppMap } from "@/components/user/app-map";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { SecondaryButton } from "@/components/user/secondary-button";
import { HeaderSection } from "@/components/header-section";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { RootState } from "@/store";
import { 
  SolarWidgetBold, 
  SolarWaterBold, 
  SolarFireBold, 
  SolarTreeBold,
  SolarMagnifierBold
} from "@/components/icons/solar-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MOCK_CHALETS = [
  {
    id: "1",
    title: "شالية الاروع علة الطلاق",
    location: "البصرة - الجزائر",
    price: "30,000",
    rating: 4.5,
    color: Colors.primary,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.82, 30.51] as [number, number],
  },
  {
    id: "2",
    title: "جنة الوطن",
    location: "البصرة - شط العرب",
    price: "45,000",
    rating: 4.8,
    color: Colors.secondary,
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.85, 30.52] as [number, number],
  },
  {
    id: "3",
    title: "شالية الملك",
    location: "البصرة - القبلة",
    price: "25,000",
    rating: 4.2,
    color: Colors.accent,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.88, 30.53] as [number, number],
  },
  {
    id: "4",
    title: "شالية محسن",
    location: "البصرة - الزبير",
    price: "35,000",
    rating: 4.9,
    color: Colors.secondary,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.84, 30.49] as [number, number],
  },
];

const FILTER_OPTIONS = [
  { id: "all", label: "الكل", icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
  { id: "pool", label: "يحتوي مسبح", icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
  { id: "bbq", label: "شواء", icon: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />, activeColor: Colors.accent },
  { id: "garden", label: "حديقة", icon: (isActive: boolean) => <SolarTreeBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
];

export default function ExploreScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedChalet, setSelectedChalet] = useState(MOCK_CHALETS[0]);

  // Simple filtering logic
  const filteredChalets = activeFilter === "all" 
    ? MOCK_CHALETS 
    : MOCK_CHALETS.filter(c => {
        if (activeFilter === "pool") return c.id === "1" || c.id === "3";
        if (activeFilter === "bbq") return c.id === "2" || c.id === "4";
        if (activeFilter === "garden") return c.id === "2" || c.id === "3";
        return true;
      });

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const navigateToDetails = (id: string) => router.push(`/chalet-details/${id}`);

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Background Map */}
      <View style={styles.mapBackground}>
        <AppMap 
          style={styles.map} 
          centerCoordinate={selectedChalet.coordinates}
          zoomLevel={13}
          showMarker={true}
          markers={filteredChalets}
          selectedChalet={selectedChalet}
          onSelectMarker={(chalet) => chalet && setSelectedChalet(MOCK_CHALETS.find(c => c.id === chalet.id) || MOCK_CHALETS[0])}
          onPressCard={navigateToDetails}
        />
      </View>

      {/* Top UI Overlays */}
      <View style={[styles.topOverlay, { paddingTop: insets.top }]}>
        {/* Main Header */}
        <HeaderSection 
          isHome={true}
          showLogo={true}
          onExtraIconPress={() => {
            // Usually this would open a search sheet
          }}
        />

        {/* Filter Bar */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterBar}
          >
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              {FILTER_OPTIONS.map((filter) => (
                <SecondaryButton 
                  key={filter.id} 
                  label={filter.label} 
                  isActive={activeFilter === filter.id} 
                  activeColor="#035DF9" 
                  icon={filter.icon(activeFilter === filter.id)} 
                  onPress={() => setActiveFilter(filter.id)} 
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Chalets Swiper */}
        <View style={styles.swiperContainer}>
          <HorizontalSwiper 
            data={filteredChalets} 
            onPressCard={navigateToDetails} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  filterWrapper: {
    marginTop: normalize.height(8), // Exact 8px between header and tabs
    backgroundColor: 'transparent',
  },
  filterBar: {
    paddingHorizontal: normalize.width(16),
  },
  swiperContainer: {
    marginTop: normalize.height(16), // Exact 16px as requested
    backgroundColor: 'transparent',
  },
});
