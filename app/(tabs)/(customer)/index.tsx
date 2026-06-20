import { Redirect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDirection } from "@/i18n";
import { BannerSkeleton, HorizontalSwiperSkeleton, HorizontalCardSkeleton } from "@/components/ui/skeleton-loader";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import { HeaderSection } from "@/components/header-section";
import {
  SolarCalendarMinimalisticBold,
  SolarClockCircleBold,
  SolarCloseBold,
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
import { getStartingPrice } from "@/utils/format";

import { RootState } from "@/store";
import { useGetAmenitiesQuery } from "@/store/api/apiSlice";
import {
  useBrowseCustomerChaletsQuery,
  useGetBannersQuery,
  useGetFavoriteIdsQuery,
  useGetLatestBookingsQuery,
  useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import { clearFilters } from "@/store/filterSlice";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Fallback colors for chalet cards
const CARD_COLORS = [Colors.primary, Colors.secondary, Colors.accent];

// ── Active Filter Banner ──────────────────────────────────────────────────────
function ActiveFilterBanner({
  filter,
  isRTL,
}: {
  filter: any;
  isRTL: boolean;
}) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const filterItems = useMemo(() => {
    const items = [];
    if (filter.cityName) {
      items.push({
        id: "city",
        text: filter.cityName,
        icon: <SolarMapPointBold size={14} color={Colors.primary} />,
      });
    }
    if (filter.checkIn) {
      const dateText = new Date(filter.checkIn).toLocaleDateString(
        isRTL ? "ar" : "en",
        { month: "short", day: "numeric" },
      );
      items.push({
        id: "date",
        text: dateText,
        icon: (
          <SolarCalendarMinimalisticBold size={14} color={Colors.primary} />
        ),
      });
    }
    if (filter.period) {
      const periodMap: Record<string, string> = {
        morning: isRTL ? "صباحي" : "Morning",
        evening: isRTL ? "مسائي" : "Evening",
        overnight: isRTL ? "مبيت" : "Overnight",
      };
      items.push({
        id: "period",
        text: periodMap[filter.period] || filter.period,
        icon: <SolarClockCircleBold size={14} color={Colors.primary} />,
      });
    }
    if (filter.maxGuests) {
      items.push({
        id: "guests",
        text: `${filter.maxGuests} ${isRTL ? "ضيف" : "guests"}`,
        icon: <SolarUsersGroupBold size={14} color={Colors.primary} />,
      });
    }
    return items;
  }, [filter, isRTL]);

  if (filterItems.length === 0) return null;

  return (
    <View style={filterBannerStyles.container}>
      <View style={[filterBannerStyles.content, { flexDirection: "row" }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            filterBannerStyles.scrollContent,
            { flexDirection: "row" },
          ]}
        >
          {filterItems.map((item) => (
            <View
              key={item.id}
              style={[filterBannerStyles.pill, { flexDirection: "row" }]}
            >
              {item.icon}
              <ThemedText style={filterBannerStyles.pillText}>
                {item.text}
              </ThemedText>
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
    fontSize: 8,
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
  const { isRTL, rowDirection, textAlign } = useDirection();
  const activeFilters = useSelector(
    (state: RootState) => (state as any).filter,
  );
  const dispatch = useDispatch();
  const router = useRouter();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = React.useState("all");
  const insets = useSafeAreaInsets();

  const textStart: "left" | "right" = textAlign;
  const flexDir: "row" | "row-reverse" = rowDirection;

  // Fetch all amenities to resolve real IDs for pool/bbq/garden filters
  const { data: allAmenities = [] } = useGetAmenitiesQuery();

  // Build a lookup: slug/keyword → real amenity ID
  const amenityIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    allAmenities.forEach((amenity: any) => {
      const nameEn = (
        amenity.name?.en ||
        amenity.nameEn ||
        amenity.name ||
        ""
      ).toLowerCase();
      const nameAr = (amenity.name?.ar || amenity.nameAr || "").toLowerCase();
      const slug = (amenity.slug || amenity.key || "").toLowerCase();

      // Match pool
      if (
        nameEn.includes("pool") ||
        nameAr.includes("مسبح") ||
        slug.includes("pool")
      ) {
        map["pool"] = amenity.id;
      }
      // Match bbq
      if (
        nameEn.includes("bbq") ||
        nameEn.includes("barbecue") ||
        nameEn.includes("grill") ||
        nameAr.includes("شواء") ||
        nameAr.includes("باربيكيو") ||
        slug.includes("bbq")
      ) {
        map["bbq"] = amenity.id;
      }
      // Match garden
      if (
        nameEn.includes("garden") ||
        nameEn.includes("yard") ||
        nameAr.includes("حديقة") ||
        slug.includes("garden")
      ) {
        map["garden"] = amenity.id;
      }
    });
    return map;
  }, [allAmenities]);

  // Build query params for Home Screen (ignores global search filters to keep index unfiltered)
  // Infinite scroll paging for the chalets list
  const [page, setPage] = React.useState(1);
  const [rawChalets, setRawChalets] = React.useState<any[]>([]);

  // Reset paging whenever the active filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  const queryParams = React.useMemo(() => {
    const params: any = { page, limit: 10 };

    // Use real amenity ID from API if available, otherwise send the slug as fallback
    if (activeFilter !== "all") {
      const realId = amenityIdMap[activeFilter];
      params.amenityIds = [realId || activeFilter];
    }
    return params;
  }, [activeFilter, amenityIdMap, page]);

  // Fetch data from the backend
  const { data: bannersResponse, isFetching: bannersFetching, refetch: refetchBanners } = useGetBannersQuery(undefined);
  const { data: chaletsResponse, isLoading: chaletsLoading, isFetching: chaletsFetching, refetch: refetchChalets } =
    useBrowseCustomerChaletsQuery(queryParams);

  const totalPages = chaletsResponse?.meta?.totalPages || 1;
  const hasMoreChalets = page < totalPages;

  // Accumulate chalets across pages for infinite scroll (dedup by id).
  React.useEffect(() => {
    const incoming = chaletsResponse?.data || [];
    if (!incoming.length && page > 1) return;
    setRawChalets((prev) => {
      if (page === 1) return incoming;
      const seen = new Set(prev.map((c: any) => c.id));
      return [...prev, ...incoming.filter((c: any) => !seen.has(c.id))];
    });
  }, [chaletsResponse, page]);

  const loadMoreChalets = React.useCallback(() => {
    if (!chaletsFetching && hasMoreChalets) {
      setPage((p) => p + 1);
    }
  }, [chaletsFetching, hasMoreChalets]);

  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery(undefined, { skip: userType === "guest" });
  const [toggleFavorite] = useToggleFavoriteMutation();

  // Recent bookings (home "آخر الحجوزات" section) — real data from the backend.
  const {
    data: latestBookings = [],
    isLoading: latestBookingsLoading,
    refetch: refetchLatestBookings,
  } = useGetLatestBookingsQuery(5, { skip: userType === "guest" });

  // Map each recent booking to its chalet (carrying the bookingId) so the section
  // uses the SAME chalet card shape, while tapping opens the booking.
  const recentBookingChalets = useMemo(
    () =>
      (Array.isArray(latestBookings) ? latestBookings : [])
        .filter((b: any) => b?.chalet)
        .map((b: any) => {
          const c = b.chalet;
          return {
            id: c.id,
            bookingId: b.id,
            // HorizontalCard expects `title`/`location` (it accepts the {ar,en} object)
            title: c.name,
            location: c.region?.name ?? c.city?.name ?? "",
            image: c.images?.[0]?.url ?? c.images?.[0],
            price: getStartingPrice(c),
            rating: c.averageRating ?? c.rating ?? 0,
          };
        }),
    [latestBookings],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchBanners(),
      refetchChalets(),
      userType !== "guest" ? refetchFavorites() : Promise.resolve(),
      userType !== "guest" ? refetchLatestBookings() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  }, [refetchBanners, refetchChalets, refetchFavorites, refetchLatestBookings, userType]);

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

  // Transform accumulated (paged) API data to card format
  const POPULAR_CHALETS = useMemo(() => {
    const chalets = rawChalets;
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
      price: getStartingPrice(chalet),
      rating: chalet.averageRating || 0,
      color: CARD_COLORS[index % CARD_COLORS.length],
      image: getImageSrc(chalet.images?.[0]?.url),
    }));
  }, [rawChalets, isRTL]);

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
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanceFromBottom =
            contentSize.height - (contentOffset.y + layoutMeasurement.height);
          if (distanceFromBottom < 500) {
            loadMoreChalets();
          }
        }}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <HeaderSection isHome />



        {/* Banners Swiper */}
        {bannersFetching && !bannersResponse ? (
          <BannerSkeleton />
        ) : banners?.length > 0 ? (
          <BannerSwiper data={banners} />
        ) : null}

        {/* Nearby / Map */}
        <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: textStart },
            ]}
          >
            {t("home.categories.nearby")}
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/(customer)/explore")}
          >
            <ThemedText style={styles.seeAll}>{t("home.openMap")}</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push("/(tabs)/(customer)/explore?showMyLocation=1")
          }
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

        {/* Recent bookings — hidden entirely when there's no data */}
        {(latestBookingsLoading || recentBookingChalets.length > 0) && (
          <>
            <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  { textAlign: textStart },
                ]}
              >
                {t("home.recentBookings")}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push("/(tabs)/(customer)/bookings")}>
                <ThemedText style={styles.seeAll}>{t("home.seeAll")}</ThemedText>
              </TouchableOpacity>
            </View>

            {latestBookingsLoading ? (
              <HorizontalSwiperSkeleton count={2} />
            ) : (
              <View style={styles.swiperWrapper}>
                <HorizontalSwiper
                  data={recentBookingChalets}
                  onPressCard={(chaletId: string) => {
                    const b = (Array.isArray(latestBookings) ? latestBookings : []).find(
                      (x: any) => x?.chalet?.id === chaletId,
                    );
                    if (b?.id) {
                      router.push({ pathname: "/(tabs)/(customer)/booking-success", params: { id: b.id } });
                    } else {
                      navigateToDetails(chaletId);
                    }
                  }}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              </View>
            )}
          </>
        )}

        {/* Recommended */}
        <View
          style={[
            styles.sectionHeader,
            { flexDirection: flexDir, justifyContent: "flex-start" },
          ]}
        >
          <ThemedText
            style={[
              styles.sectionTitle,
              { textAlign: textStart },
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
          <View style={{ flexDirection: flexDir, gap: 10 }}>
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
            <View style={{ gap: 12 }}>
              <HorizontalCardSkeleton />
              <HorizontalCardSkeleton />
              <HorizontalCardSkeleton />
            </View>
          ) : POPULAR_CHALETS.length > 0 ? (
            POPULAR_CHALETS.map((item: any, index: number) => (
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
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    lineHeight: normalize.font(14),
    flexShrink: 1,
  },
  seeAll: {
    fontSize: normalize.font(14),
    color: Colors.primary,
    fontFamily: "Alexandria-Medium",
    textDecorationLine: "underline",
    lineHeight: normalize.font(14),
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
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    fontSize: normalize.font(14),
  },
});
