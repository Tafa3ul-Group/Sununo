import React, { useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 156;
const CARD_HEIGHT = 220;

import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

import { RootState } from "@/store";
import { Colors, Spacing, normalize } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { ColoredCard } from "@/components/user/colored-card";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { SearchFilterSheet } from "@/components/user/search-filter-sheet";
import { AppMap } from "@/components/user/app-map";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";

// Filter Options
const FILTER_OPTIONS = [
  { id: 'all', label: 'الكل', icon: 'view-grid', activeColor: '#035DF9' },
  { id: 'pool', label: 'يحتوي مسبح', icon: 'pool', activeColor: '#15AB64' },
  { id: 'bbq', label: 'يحتوي شواء', icon: 'grill', activeColor: '#EA2129' },
  { id: 'garden', label: 'حديقة', icon: 'tree', activeColor: '#EF79D7' },
];

// Mock Data
const POPULAR_CHALETS = [
  {
    id: "1",
    title: "شالية الاروع علة الطلاق",
    location: "البصرة - الجزائر",
    price: "IQD 30,000",
    rating: 4.5,
    color: "#EA2129", 
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "شالية الورد والياسمين",
    location: "البصرة - الطويسة",
    price: "IQD 45,000",
    rating: 4.8,
    color: "#035DF9",
    image: "https://images.unsplash.com/photo-1449156001437-3a1621dfbe2b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "شالية اطلالة الخليج",
    location: "البصرة - العشار",
    price: "IQD 25,000",
    rating: 4.2,
    color: "#EF79D7",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "شالية النخيل الهادئ",
    location: "البصرة - ابي الخصيب",
    price: "IQD 35,000",
    rating: 4.7,
    color: "#15AB64",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "شالية جوهرة البصرة",
    location: "البصرة - القبلة",
    price: "IQD 50,000",
    rating: 4.9,
    color: "#EA2129",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function HomeScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = React.useState('all');

  const handleOpenSearch = () => {
    bottomSheetRef.current?.present();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Image
              source={require("@/assets/profile.svg")}
              style={styles.avatar}
              contentFit="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleOpenSearch}
          >
            <Ionicons name="search" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/logo.svg")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Section: Most Popular (num1-num5 cards) - NOW AT TOP */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>
              {t("home.seeAll") || "الكل"}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>الاكثر شيوعاً</ThemedText>
        </View>

        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.horizontalScrollPadding,
            { flexDirection: 'row-reverse' }
          ]}
          snapToInterval={CARD_WIDTH + Spacing.sm}
          decelerationRate="fast"
          nestedScrollEnabled={true}
          disallowInterruption={true}
        >
          {POPULAR_CHALETS.map((chalet, index) => (
            <ColoredCard key={chalet.id} {...chalet} shapeIndex={index} />
          ))}
        </GHScrollView>

        {/* Section: Recommended for you (Tabs + Vertical List) */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>افتح الكل</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>مقترح لك</ThemedText>
        </View>

        {/* Filter Tabs */}
        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsWrapper}
        >
          {FILTER_OPTIONS.map((filter) => (
             filter.id === 'all' ? (
                <PrimaryButton
                  key={filter.id}
                  label={filter.label}
                  isActive={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  onPress={() => setActiveFilter(filter.id)}
                  style={styles.allTabButton}
                />
             ) : (
                <SecondaryButton
                  key={filter.id}
                  label={filter.label}
                  isActive={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  icon={filter.icon as any}
                  onPress={() => setActiveFilter(filter.id)}
                  style={styles.filterTab}
                />
             )
          ))}
        </GHScrollView>

        {/* Vertical Chalet List */}
        <View style={styles.listPadding}>
          {POPULAR_CHALETS.map((chalet, index) => (
            <HorizontalCard key={chalet.id} {...chalet} shapeIndex={index + 10} />
          ))}
        </View>

        {/* Section: Best Today - Horizontal */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>الكل</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>الافضل اليوم</ThemedText>
        </View>

        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.horizontalScrollPadding,
            { flexDirection: 'row-reverse' }
          ]}
          snapToInterval={normalize.width(280) + Spacing.md}
          decelerationRate="fast"
          nestedScrollEnabled={true}
          disallowInterruption={true}
        >
          {POPULAR_CHALETS.slice(0, 3).map((chalet, index) => (
             <View key={chalet.id} style={{ width: normalize.width(280), marginRight: Spacing.md }}>
                <HorizontalCard {...chalet} shapeIndex={index + 5} />
             </View>
          ))}
        </GHScrollView>

        {/* Nearest to you - Map Section */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>افتح الخارطة</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>الاقرب اليك</ThemedText>
        </View>

        <View style={styles.mapContainer}>
          <AppMap style={styles.map} />
        </View>
      </ScrollView>

      {/* Filter/Search Bottom Sheet */}
      <SearchFilterSheet ref={bottomSheetRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: "space-between",
    marginTop: Platform.OS === 'ios' ? 0 : Spacing.xs,
  },
  avatar: {
    width: normalize.width(44),
    height: normalize.width(44),
    borderRadius: normalize.radius(22),
    backgroundColor: "#FFE5D4",
  },
  searchButton: {
    width: normalize.width(44),
    height: normalize.width(44),
    borderRadius: normalize.radius(22),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  logo: {
    width: normalize.width(100),
    height: normalize.width(40),
  },
  map: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: normalize.font(20),
    fontWeight: "700",
    color: Colors.text.primary,
  },
  seeAll: {
    fontSize: normalize.font(14),
    color: Colors.text.secondary,
    textDecorationLine: "underline",
  },
  horizontalScrollPadding: {
    paddingHorizontal: Spacing.md,
  },
  mapContainer: {
    height: normalize.height(180),
    marginHorizontal: Spacing.md,
    borderRadius: normalize.radius(24),
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  listPadding: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  tabsWrapper: {
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    gap: 4, // Reduced gap between buttons
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  allTabButton: {
    marginRight: Spacing.sm,
  },
  tabText: {
    fontSize: normalize.font(16),
  },
  filterTab: {
    marginRight: Spacing.sm,
  }
});
