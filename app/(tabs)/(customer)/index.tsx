import { Redirect, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import { HeaderSection } from "@/components/header-section";
import {
    SolarCalendarMinimalisticBold,
    SolarClockCircleBold,
    SolarCloseBold,
    SolarCloseCircleBold,
    SolarFireBold,
    SolarMapPointBold,
    SolarTreeBold,
    SolarUsersGroupBold,
    SolarWaterBold,
    SolarWidgetBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { BannerSwiper } from "@/components/user/banner-swiper";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
import {
    useBrowseCustomerChaletsQuery,
    useGetBannersQuery,
    useGetFavoriteIdsQuery,
    useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import { clearFilters } from "@/store/filterSlice";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Fallback colors for chalet cards
const CARD_COLORS = [Colors.primary, Colors.secondary, Colors.accent];

// ── Active Filter Banner ──────────────────────────────────────────────────────
function ActiveFilterBanner({ filter, isRTL }: { filter: any; isRTL: boolean }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const filterItems = useMemo(() => {
    const items = [];
    if (filter.cityName) {
      items.push({ id: 'city', text: filter.cityName, icon: <SolarMapPointBold size={14} color={Colors.primary} /> });
    }
    if (filter.checkIn) {
      const dateText = new Date(filter.checkIn).toLocaleDateString(isRTL ? "ar" : "en", { month: "short", day: "numeric" });
      items.push({ id: 'date', text: dateText, icon: <SolarCalendarMinimalisticBold size={14} color={Colors.primary} /> });
    }
    if (filter.period) {
      const periodMap: Record<string, string> = {
        morning: isRTL ? "صباحي" : "Morning",
        evening: isRTL ? "مسائي" : "Evening",
        overnight: isRTL ? "مبيت" : "Overnight",
      };
      items.push({ id: 'period', text: periodMap[filter.period] || filter.period, icon: <SolarClockCircleBold size={14} color={Colors.primary} /> });
    }
    if (filter.maxGuests) {
      items.push({ id: 'guests', text: `${filter.maxGuests} ${isRTL ? "ضيف" : "guests"}`, icon: <SolarUsersGroupBold size={14} color={Colors.primary} /> });
    }
    return items;
  }, [filter, isRTL]);

  if (filterItems.length === 0) return null;

  return (
    <View style={filterBannerStyles.container}>
      <View style={[filterBannerStyles.content, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[filterBannerStyles.scrollContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {filterItems.map((item) => (
            <View key={item.id} style={[filterBannerStyles.pill, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {item.icon}
              <ThemedText style={filterBannerStyles.pillText}>{item.text}</ThemedText>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={filterBannerStyles.clearBtn}
          onPress={() => dispatch(clearFilters())}
        >
          <SolarCloseBold size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const filterBannerStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
});

export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const activeFilters = useSelector((state: RootState) => (state as any).filter);
  const dispatch = useDispatch();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [activeFilter, setActiveFilter] = React.useState("all");
  const insets = useSafeAreaInsets();

  // Build query params from Redux filter state
  const queryParams = React.useMemo(() => {
    const params: any = { page: 1, limit: 10 };
    if (activeFilters?.cityId) params.cityId = activeFilters.cityId;
    if (activeFilters?.search) params.search = activeFilters.search;
    if (activeFilters?.maxGuests) params.maxGuests = activeFilters.maxGuests;
    if (activeFilters?.checkIn) params.checkIn = activeFilters.checkIn.split("T")[0];
    if (activeFilters?.checkOut) params.checkOut = activeFilters.checkOut.split("T")[0];
    if (activeFilters?.period) params.period = activeFilters.period;

    if (activeFilter === "pool") params.amenityIds = ["pool"];
    if (activeFilter === "bbq") params.amenityIds = ["bbq"];
    if (activeFilter === "garden") params.amenityIds = ["garden"];
    return params;
  }, [activeFilters, activeFilter]);

  // Fetch data from the backend
  const { data: bannersResponse } = useGetBannersQuery(undefined);
  const { data: chaletsResponse, isLoading: chaletsLoading } =
    useBrowseCustomerChaletsQuery(queryParams);

  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery();
  const [toggleFavorite] = useToggleFavoriteMutation();

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id).unwrap();
      refetchFavorites();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Transform banners
  const banners = (bannersResponse || []).map((b: any) => ({
    id: b.id,
    image: b.imageUrl,
    title: isRTL ? b.title?.ar || b.title : b.title?.en || b.title,
  }));

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const navigateToDetails = (id: string) =>
    router.push(`/chalet-details/${id}`);

  // Transform API data to match card format, with fallback to empty array
  const POPULAR_CHALETS = useMemo(() => {
    const chalets = chaletsResponse?.data || [];
    return chalets.map((chalet: any, index: number) => ({
      id: chalet.id,
      title: isRTL
        ? chalet.name?.ar || chalet.nameAr || chalet.name || ""
        : chalet.name?.en || chalet.nameEn || chalet.name || "",
      location: isRTL
        ? chalet.region?.name?.ar ||
          chalet.region?.nameAr ||
          chalet.region?.name ||
          ""
        : chalet.region?.name?.en ||
          chalet.region?.nameEn ||
          chalet.region?.name ||
          "",
      price: chalet.shifts?.[0]?.pricing?.[0]?.price
        ? Number(chalet.shifts[0].pricing[0].price).toLocaleString()
        : chalet.basePrice
          ? Number(chalet.basePrice).toLocaleString()
          : "0",
      rating: chalet.averageRating || 0,
      color: CARD_COLORS[index % CARD_COLORS.length],
      image: getImageSrc(chalet.images?.[0]?.url),
    }));
  }, [chaletsResponse, isRTL]);

  const FILTER_OPTIONS = [
    {
      id: "all",
      label: t("home.categories.all"),
      icon: (isActive: boolean) => (
        <SolarWidgetBold
          size={18}
          color={isActive ? "white" : Colors.primary}
        />
      ),
      activeColor: Colors.primary,
    },
    {
      id: "pool",
      label: t("home.categories.pool"),
      icon: (isActive: boolean) => (
        <SolarWaterBold
          size={18}
          color={isActive ? "white" : Colors.secondary}
        />
      ),
      activeColor: Colors.secondary,
    },
    {
      id: "bbq",
      label: t("home.categories.bbq"),
      icon: (isActive: boolean) => (
        <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />
      ),
      activeColor: Colors.accent,
    },
    {
      id: "garden",
      label: t("home.categories.garden"),
      icon: (isActive: boolean) => (
        <SolarTreeBold
          size={18}
          color={isActive ? "white" : Colors.secondary}
        />
      ),
      activeColor: Colors.secondary,
    },
  ];

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <HeaderSection isHome />

        {/* Active Filter Indicator */}
        {activeFilters?.isActive && (
          <ActiveFilterBanner filter={activeFilters} isRTL={isRTL} />
        )}

        {/* Banners Swiper */}
        {banners?.length > 0 && <BannerSwiper data={banners} />}

        {/* Nearby / Map */}
        <View
          style={[
            styles.sectionHeader,
            { flexDirection: isRTL ? "row" : "row-reverse" },
          ]}
        >
          <TouchableOpacity onPress={() => router.push("/(tabs)/(customer)/explore")}>
            <ThemedText style={styles.seeAll}>{t("home.openMap")}</ThemedText>
          </TouchableOpacity>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("home.categories.nearby")}
          </ThemedText>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/(tabs)/(customer)/explore?showMyLocation=1")}
          style={styles.mapContainer}
        >
          <AppMap
            style={styles.map}
            showMarker
            onPressCard={navigateToDetails}
          />
          {/* overlay to intercept taps and navigate */}
          <View style={styles.mapOverlay} />
        </TouchableOpacity>

        {/* Popular / Recent */}
        <View
          style={[
            styles.sectionHeader,
            { flexDirection: isRTL ? "row" : "row-reverse" },
          ]}
        >
          <TouchableOpacity>
            <ThemedText style={styles.seeAll}>{t("home.seeAll")}</ThemedText>
          </TouchableOpacity>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("home.recentBookings")}
          </ThemedText>
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
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          </View>
        )}

        {/* Recommended */}
        <View
          style={[
            styles.sectionHeader,
            { justifyContent: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("home.recommended")}
          </ThemedText>
        </View>
        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          <View
            style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}
          >
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
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : POPULAR_CHALETS.length > 0 ? (
            POPULAR_CHALETS.map((item, index) => (
              <HorizontalCard
                key={index}
                chalet={item}
                onPress={() => navigateToDetails(item.id)}
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <SolarWidgetBold size={60} color={Colors.primary} />
              </View>
              <ThemedText style={styles.emptyTitle}>
                {t("home.noChalets")}
              </ThemedText>
              <ThemedText style={styles.emptyDesc}>
                {t("home.noChaletsDesc")}
              </ThemedText>
              {activeFilter !== "all" && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setActiveFilter("all")}
                >
                  <ThemedText style={styles.clearButtonText}>
                    {t("home.clearFilters")}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 120 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: normalize.font(20),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
    lineHeight: normalize.font(28),
    flexShrink: 1,
  },
  seeAll: {
    fontSize: normalize.font(13),
    color: Colors.primary,
    fontFamily: "Alexandria-SemiBold",
    textDecorationLine: "underline",
    lineHeight: normalize.font(18),
  },
  mapContainer: {
    height: 210,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    marginTop: 10,
  },
  map: { flex: 1 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  listPadding: { paddingHorizontal: 16 },
  tabsContainer: { paddingHorizontal: 16, marginVertical: 10 },
  swiperWrapper: { marginVertical: 10 },
  loaderContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Regular",
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  clearButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  clearButtonText: {
    color: Colors.white,
    fontFamily: "Alexandria-SemiBold",
    fontSize: normalize.font(14),
  },
});
