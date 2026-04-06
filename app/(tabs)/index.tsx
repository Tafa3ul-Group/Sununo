import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Redirect, useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
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
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = normalize.width(175);

const FILTER_OPTIONS = [
  { id: "all", label: "الكل", icon: "view-grid", activeColor: Colors.primary },
  {
    id: "pool",
    label: "يحتوي مسبح",
    icon: "pool",
    activeColor: Colors.secondary,
  },
  { id: "bbq", label: "يحتوي شواء", icon: "grill", activeColor: Colors.accent },
  { id: "garden", label: "حديقة", icon: "tree", activeColor: Colors.secondary },
];

const POPULAR_CHALETS = [
  {
    id: "1",
    title: "شالية الاروع",
    location: "البصرة - الجزائر",
    price: "30,000",
    rating: 4.5,
    color: Colors.primary,
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600",
    ],
  },
  {
    id: "2",
    title: "شالية الورد",
    location: "البصرة - الطويسة",
    price: "45,000",
    rating: 4.8,
    color: Colors.secondary,
    images: [
      "https://images.unsplash.com/photo-1449156001437-3a1621dfbe2b?w=600",
    ],
  },
  {
    id: "3",
    title: "شالية الخليج",
    location: "البصرة - العشار",
    price: "25,000",
    rating: 4.2,
    color: Colors.accent,
    images: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
    ],
  },
];

export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [selectedChalet, setSelectedChalet] = React.useState<any>(null);

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const navigateToDetails = (id: string) =>
    router.push(`/chalet-details/${id}`);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeaderSection
          userType={userType}
          showLogo
          showSearch={false}
          showCategories={false}
          showProfile
          extraIcon="search"
          onExtraIconPress={() => bottomSheetRef.current?.present()}
        />

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
          contentContainerStyle={styles.popularContainer}
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

        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>الكل</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>الافضل اليوم</ThemedText>
        </View>

        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollPadding}
        >
          {POPULAR_CHALETS.map((chalet) => (
            <View key={chalet.id} style={styles.horizontalCardWrapper}>
              <HorizontalCard
                chalet={chalet}
                onPress={() => navigateToDetails(chalet.id)}
              />
            </View>
          ))}
        </GHScrollView>

        <View style={styles.sectionHeader}>
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>افتح الكل</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sectionTitle}>مقترح لك</ThemedText>
        </View>

        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsWrapper}
        >
          <View style={styles.tabsInnerContainer}>
            {FILTER_OPTIONS.map((filter) =>
              filter.id === "all" ? (
                <PrimaryButton
                  key={filter.id}
                  label={filter.label}
                  isActive={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  onPress={() => setActiveFilter(filter.id)}
                  style={{ paddingHorizontal: 20 }}
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

        <View style={styles.listPadding}>
          {POPULAR_CHALETS.map((chalet) => (
            <HorizontalCard
              key={chalet.id}
              chalet={chalet}
              onPress={() => navigateToDetails(chalet.id)}
            />
          ))}
        </View>
      </ScrollView>

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
  scrollContent: { paddingBottom: 100 },
  popularContainer: {
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 30,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: Colors.text.primary },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  mapContainer: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginTop: 10,
  },
  map: { flex: 1 },
  horizontalScrollPadding: {
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
  },
  horizontalCardWrapper: { width: SCREEN_WIDTH * 0.8, marginLeft: 12 },
  listPadding: { paddingHorizontal: 16, marginTop: 15 },
  tabsWrapper: { marginVertical: 15 },
  tabsInnerContainer: {
    flexDirection: "row-reverse",
    gap: 10,
    paddingHorizontal: 16,
  },
});
