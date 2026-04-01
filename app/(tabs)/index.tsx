import React, { useRef } from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = normalize.width(175);
const CARD_HEIGHT = normalize.height(240);

import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";

import { HeaderSection } from "@/components/header-section";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { ColoredCard } from "@/components/user/colored-card";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { PrimaryButton } from "@/components/user/primary-button";
import { SearchFilterSheet } from "@/components/user/search-filter-sheet";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, Spacing, normalize } from "@/constants/theme";
import { RootState } from "@/store";

// Filter Options
const FILTER_OPTIONS = [
  { id: "all", label: "الكل", icon: "view-grid", activeColor: "#035DF9" },
  { id: "pool", label: "يحتوي مسبح", icon: "pool", activeColor: "#15AB64" },
  { id: "bbq", label: "يحتوي شواء", icon: "grill", activeColor: "#EA2129" },
  { id: "garden", label: "حديقة", icon: "tree", activeColor: "#EF79D7" },
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
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "شالية الورد والياسمين",
    location: "البصرة - الطويسة",
    price: "IQD 45,000",
    rating: 4.8,
    color: "#035DF9",
    image:
      "https://images.unsplash.com/photo-1449156001437-3a1621dfbe2b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "شالية اطلالة الخليج",
    location: "البصرة - العشار",
    price: "IQD 25,000",
    rating: 4.2,
    color: "#EF79D7",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "شالية النخيل الهادئ",
    location: "البصرة - ابي الخصيب",
    price: "IQD 35,000",
    rating: 4.7,
    color: "#15AB64",
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "شالية جوهرة البصرة",
    location: "البصرة - القبلة",
    price: "IQD 50,000",
    rating: 4.9,
    color: "#EA2129",
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function HomeScreen() {
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [selectedChalet, setSelectedChalet] = React.useState<any>(null);

  if (userType === 'owner') {
    return <Redirect href="/(tabs)/(dashboard)/home" />;
  }

  const handleOpenSearch = () => {
    bottomSheetRef.current?.present();
  };

  const navigateToDetails = (id: string) => {
    router.push(`/chalet-details/${id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <HeaderSection 
          userType={userType} 
          showLogo={true}
          showSearch={false}
          showCategories={false}
          showProfile={true}
          extraIcon="search"
          onExtraIconPress={handleOpenSearch}
        />

        {/* Section: Most Popular (num1-num5 cards) - AT TOP */}
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
          contentContainerStyle={{
            paddingHorizontal: 16,
            flexDirection: "row-reverse",
            gap: 10, // Solid 10px gap between cards
          }}
          snapToInterval={CARD_WIDTH + 10}
          decelerationRate="fast"
          nestedScrollEnabled={true}
          disallowInterruption={true}
        >
          {POPULAR_CHALETS.map((chalet, index) => (
            <ColoredCard 
              key={chalet.id} 
              {...chalet} 
              shapeIndex={index} 
              onPress={() => navigateToDetails(chalet.id)}
            />
          ))}
        </GHScrollView>

        {/* Section: Nearest to you - Map Section */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>افتح الخارطة</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>الاقرب اليك</ThemedText>
        </View>

        <View style={styles.mapContainer}>
          <AppMap 
            style={styles.map} 
            showMarker 
            selectedChalet={selectedChalet}
            onSelectMarker={setSelectedChalet}
            onPressCard={navigateToDetails}
          />
        </View>


        {/* Section: Best Today - Horizontal (MOVED UNDER MAP) */}
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
            { flexDirection: "row-reverse" },
          ]}
          snapToInterval={normalize.width(323) + Spacing.md}
          decelerationRate="fast"
          nestedScrollEnabled={true}
        >
          {POPULAR_CHALETS.slice(0, 3).map((chalet, index) => (
            <View
              key={chalet.id}
              style={{ width: normalize.width(323), marginLeft: Spacing.md }}
            >
              <HorizontalCard 
                {...chalet} 
                shapeIndex={index + 5} 
                onPress={() => navigateToDetails(chalet.id)}
              />
            </View>
          ))}
        </GHScrollView>

        {/* Section: Recommended for you (Tabs + Vertical List) */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>افتح الكل</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>مقترح لك</ThemedText>
        </View>

        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabsContainer,
            { paddingHorizontal: 16 }
          ]}
          style={styles.tabsWrapper}
        >
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            {FILTER_OPTIONS.map((filter) =>
              filter.id === "all" ? (
                <PrimaryButton
                  key={filter.id}
                  label={filter.label}
                  isActive={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  onPress={() => setActiveFilter(filter.id)}
                />
              ) : (
                <SecondaryButton
                  key={filter.id}
                  label={filter.label}
                  isActive={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  icon={filter.icon as any}
                  onPress={() => setActiveFilter(filter.id)}
                />
              ),
            )}
          </View>
        </GHScrollView>

        {/* Vertical Chalet List */}
        <View style={styles.listPadding}>
          {POPULAR_CHALETS.map((chalet, index) => (
            <HorizontalCard
              key={chalet.id}
              {...chalet}
              shapeIndex={index + 10}
              onPress={() => navigateToDetails(chalet.id)}
            />
          ))}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  map: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: Spacing.xl, // More breathing room
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900", // Stronger bold
    color: Colors.text.primary,
  },
  seeAll: {
    fontSize: 15,
    color: "#035DF9", // Sununo Blue
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  horizontalScrollPadding: {
    paddingHorizontal: Spacing.md,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginTop: Spacing.md,
  },
  listPadding: {
    paddingHorizontal: 16,
    marginTop: Spacing.md,
  },
  tabsWrapper: {
    marginVertical: Spacing.md, // Spacing above and below tabs
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 4, // 4px gap as requested
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  allTabButton: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 16,
  },
  filterTab: {
    marginRight: 4,
  },
});
