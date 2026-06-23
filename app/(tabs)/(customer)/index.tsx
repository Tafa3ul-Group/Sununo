import { Redirect, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useDirection } from "@/i18n";
import { BannerSkeleton, HorizontalSwiperSkeleton, HorizontalCardSkeleton, CustomerHomeSkeleton } from "@/components/ui/skeleton-loader";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import { HeaderSection } from "@/components/header-section";
import { PressableScale } from "@/components/ui/pressable-scale";
import {
  SolarFireBold,
  SolarTreeBold,
  SolarWaterBold,
  SolarWidgetBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { BannerSwiper } from "@/components/user/banner-swiper";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { getStartingPrice } from "@/utils/format";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS } from "@/constants/analytics-events";

import { RootState } from "@/store";
import { Image as ExpoImage } from "expo-image";
import { useGetAmenitiesQuery, useGetHomeFilterAmenitiesQuery } from "@/store/api/apiSlice";
import {
  useBrowseCustomerChaletsQuery,
  useGetBannersQuery,
  useGetFavoriteIdsQuery,
  useGetFeaturedChaletsQuery,
  useGetLatestBookingsQuery,
  useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
// Fallback colors for chalet cards
const CARD_COLORS = [Colors.primary, Colors.secondary, Colors.accent];

export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const { isRTL, rowDirection, textAlign } = useDirection();
  const router = useRouter();
  const { t } = useTranslation();
  // Multi-select filter chips. Empty array === "All".
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Toggle a chip; tapping "all" clears the selection.
  const toggleFilter = React.useCallback((id: string) => {
    if (id === "all") {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }, []);

  const textStart: "left" | "right" = textAlign;
  const flexDir: "row" | "row-reverse" = rowDirection;

  // Fetch all amenities to resolve real IDs for pool/bbq/garden filters
  const { data: allAmenities = [] } = useGetAmenitiesQuery();

  // Admin-selected amenities to show as home filter chips (empty → use defaults)
  const { data: homeFilterAmenities = [] } = useGetHomeFilterAmenitiesQuery();

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

  // Stable key so the paging reset / query only re-run on real changes.
  const filtersKey = selectedFilters.join(",");

  // Reset paging whenever the selected filters change.
  React.useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const queryParams = React.useMemo(() => {
    const params: any = { page, limit: 10 };

    // Chip keys are prefixed by kind: "cat:<id>" → categoryIds, "feat:<id>" →
    // amenityIds. Unprefixed keys are built-in default slugs (pool/bbq/garden)
    // resolved to real amenity IDs via amenityIdMap.
    const amenityIds: string[] = [];
    const categoryIds: string[] = [];
    selectedFilters.forEach((key) => {
      if (key.startsWith("cat:")) categoryIds.push(key.slice(4));
      else if (key.startsWith("feat:")) amenityIds.push(key.slice(5));
      else amenityIds.push(amenityIdMap[key] || key);
    });
    if (amenityIds.length > 0) params.amenityIds = amenityIds;
    if (categoryIds.length > 0) params.categoryIds = categoryIds;
    return params;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, amenityIdMap, page]);

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
      const seen = new Map(prev.map((c: any) => [c.id, c]));
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

  // Featured strip ("مميّزة") shown directly below the banner — admin-curated
  // and ordered in the portal.
  const {
    data: featuredRaw = [],
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useGetFeaturedChaletsQuery(undefined);

  const featuredChalets = useMemo(
    () =>
      (Array.isArray(featuredRaw) ? featuredRaw : [])
        .filter(Boolean)
        .map((c: any) => ({
          id: c.id,
          // HorizontalCard accepts the {ar,en} object for title/location.
          title: c.name,
          location: c.region?.name ?? c.city?.name ?? "",
          image: c.images?.[0]?.url ?? c.images?.[0],
          price: getStartingPrice(c),
          rating: c.rating ?? c.averageRating ?? 0,
        })),
    [featuredRaw],
  );

  // Bumping this key remounts the preview map so it re-centers on the nearby
  // chalets / user location (e.g. after returning from a chalet, or on refresh).
  const [mapKey, setMapKey] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Reset paging so the chalet list reloads fresh from the top (not just the
    // current page), then refetch everything + the preview map.
    setPage(1);
    await Promise.all([
      refetchBanners(),
      refetchChalets(),
      refetchFeatured(),
      userType !== "guest" ? refetchFavorites() : Promise.resolve(),
      userType !== "guest" ? refetchLatestBookings() : Promise.resolve(),
    ]);
    setMapKey((k) => k + 1);
    setIsRefreshing(false);
  }, [refetchBanners, refetchChalets, refetchFeatured, refetchFavorites, refetchLatestBookings, userType]);

  // Keep the home screen fresh, but only when it's been stale for a while.
  // Refetching + remounting the (heavy) preview map on every focus made quick
  // back-and-forth navigation flicker and fire redundant requests; throttle it.
  const lastFocusRefetch = React.useRef(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFocusRefetch.current < 30000) return;
      lastFocusRefetch.current = now;
      refetchBanners();
      refetchChalets();
      refetchFeatured();
      if (userType !== "guest") {
        refetchFavorites();
        refetchLatestBookings();
      }
      setMapKey((k) => k + 1);
    }, [refetchBanners, refetchChalets, refetchFeatured, refetchFavorites, refetchLatestBookings, userType]),
  );

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id).unwrap();
      refetchFavorites();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // ── Analytics: view_item_list (fires once per filter set when the list loads)
  // Precompute the first 15 chalets' analytics payload so the effect body doesn't
  // slice/map on every run; only recompute when the source data or locale changes.
  const firstFifteenChaletsForAnalytics = useMemo(
    () =>
      rawChalets.slice(0, 15).map((c: any, i: number) => ({
        item_id: String(c.id),
        item_name: isRTL
          ? c.name?.ar || c.nameAr || c.name || ""
          : c.name?.en || c.nameEn || c.name || "",
        index: i,
      })),
    [rawChalets, isRTL],
  );
  const lastListKeyRef = React.useRef<string>("");
  React.useEffect(() => {
    if (!rawChalets.length) return;
    if (lastListKeyRef.current === filtersKey) return;
    lastListKeyRef.current = filtersKey;
    logEvent(ANALYTICS_EVENTS.VIEW_ITEM_LIST, {
      item_list_id: filtersKey ? "home_filtered" : "home_recommended",
      item_list_name: "Home Recommended",
      items: firstFifteenChaletsForAnalytics,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawChalets, filtersKey]);

  // Transform banners
  const banners = useMemo(
    () =>
      (bannersResponse || []).map((b: any) => ({
        id: b.id,
        image: b.imageUrl,
        title: isRTL ? b.title?.ar || b.title : b.title?.en || b.title,
      })),
    [bannersResponse, isRTL],
  );

  // First cold load (no cached data yet) → show the full-page skeleton so the
  // whole screen presents one cohesive loading state instead of building piecemeal.
  const isInitialLoading = chaletsLoading && rawChalets.length === 0;

  const navigateToDetails = (id: string, name?: string) => {
    logEvent(ANALYTICS_EVENTS.SELECT_ITEM, {
      item_list_id: "home",
      items: [{ item_id: String(id), item_name: name || "" }],
    });
    router.push(`/chalet-details/${id}`);
  };

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

  // Chalet pins for the home preview map (only those with valid coordinates).
  const mapMarkers = useMemo(
    () =>
      (rawChalets || [])
        .filter(
          (c: any) =>
            c?.latitude != null &&
            c?.longitude != null &&
            !isNaN(Number(c.latitude)) &&
            !isNaN(Number(c.longitude)),
        )
        .map((c: any) => ({
          id: c.id,
          title: c.name,
          image: getImageSrc(c.images?.[0]?.url),
          coordinates: [Number(c.longitude), Number(c.latitude)] as [
            number,
            number,
          ],
        })),
    [rawChalets],
  );

  const allTab = {
    id: "all",
    label: t("home.categories.all"),
    icon: (isActive: boolean) => (
      <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />
    ),
    activeColor: Colors.primary,
  };

  // Built-in default chips, used only when the admin hasn't chosen any.
  const DEFAULT_FILTER_OPTIONS = [
    allTab,
    {
      id: "pool",
      label: t("home.categories.pool"),
      icon: (isActive: boolean) => (
        <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />
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
        <SolarTreeBold size={18} color={isActive ? "white" : Colors.secondary} />
      ),
      activeColor: Colors.secondary,
    },
  ];

  // Prefer the admin-configured chips; fall back to the built-in defaults.
  const FILTER_OPTIONS = useMemo(() => {
    if (Array.isArray(homeFilterAmenities) && homeFilterAmenities.length > 0) {
      const dynamic = homeFilterAmenities.map((a: any) => ({
        // Prefix the chip key by kind so the query routes it to categoryIds
        // (category) or amenityIds (feature). Defaults to feature.
        id: `${a.kind === "category" ? "cat" : "feat"}:${a.id}`,
        label: isRTL
          ? a.name?.ar || a.name?.en || ""
          : a.name?.en || a.name?.ar || "",
        icon: (isActive: boolean) =>
          a.icon ? (
            <ExpoImage
              source={getImageSrc(a.icon)}
              style={{ width: 18, height: 18 }}
              contentFit="contain"
            />
          ) : (
            <SolarWidgetBold
              size={18}
              color={isActive ? "white" : Colors.secondary}
            />
          ),
        activeColor: Colors.secondary,
      }));
      return [allTab, ...dynamic];
    }
    return DEFAULT_FILTER_OPTIONS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeFilterAmenities, isRTL, t]);

  // Owners don't have a customer home — redirect to their dashboard. Placed
  // after all hooks so hook order stays stable across renders.
  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  // Everything above the recommended list, rendered as the FlashList header so
  // the chalet list itself stays virtualized (only on-screen cards mount).
  const listHeader = (
    <>
      {/* Header */}
      <HeaderSection isHome />

      {isInitialLoading ? (
        <CustomerHomeSkeleton />
      ) : (
        <>
          {/* Banners Swiper */}
          {bannersFetching && !bannersResponse ? (
            <BannerSkeleton />
          ) : banners?.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              <BannerSwiper data={banners} />
            </Animated.View>
          ) : null}

          {/* Featured ("مميّزة") — admin-curated strip directly below the banner.
              Hidden entirely when there's nothing featured. */}
          {(featuredLoading || featuredChalets.length > 0) && (
            <>
              <View
                style={[
                  styles.sectionHeader,
                  { flexDirection: flexDir, justifyContent: "flex-start" },
                ]}
              >
                <ThemedText
                  style={[styles.sectionTitle, { textAlign: textStart }]}
                >
                  {t("home.featured")}
                </ThemedText>
              </View>
              {featuredLoading ? (
                <HorizontalSwiperSkeleton count={2} />
              ) : (
                <View style={styles.swiperWrapper}>
                  <HorizontalSwiper
                    data={featuredChalets}
                    onPressCard={(chaletId: string) =>
                      navigateToDetails(chaletId)
                    }
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </View>
              )}
            </>
          )}

          {/* Nearby / Map */}
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <ThemedText style={[styles.sectionTitle, { textAlign: textStart }]}>
              {t("home.categories.nearby")}
            </ThemedText>
            <PressableScale
              onPress={() => router.push("/(tabs)/(customer)/explore")}
            >
              <ThemedText style={styles.seeAll}>{t("home.openMap")}</ThemedText>
            </PressableScale>
          </View>
          <PressableScale
            scaleTo={0.98}
            onPress={() =>
              router.push("/(tabs)/(customer)/explore?showMyLocation=1")
            }
            style={styles.mapContainer}
          >
            <AppMap
              key={mapKey}
              style={styles.map}
              showMarker
              markers={mapMarkers}
              onPressCard={navigateToDetails}
            />
            {/* overlay to intercept taps and navigate */}
            <View style={styles.mapOverlay} />
          </PressableScale>

          {/* Recent bookings — hidden entirely when there's no data */}
          {(latestBookingsLoading || recentBookingChalets.length > 0) && (
            <>
              <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
                <ThemedText
                  style={[styles.sectionTitle, { textAlign: textStart }]}
                >
                  {t("home.recentBookings")}
                </ThemedText>
                <PressableScale
                  onPress={() => router.push("/(tabs)/(customer)/bookings")}
                >
                  <ThemedText style={styles.seeAll}>
                    {t("home.seeAll")}
                  </ThemedText>
                </PressableScale>
              </View>

              {latestBookingsLoading ? (
                <HorizontalSwiperSkeleton count={2} />
              ) : (
                <View style={styles.swiperWrapper}>
                  <HorizontalSwiper
                    data={recentBookingChalets}
                    onPressCard={(chaletId: string) => {
                      const b = (
                        Array.isArray(latestBookings) ? latestBookings : []
                      ).find((x: any) => x?.chalet?.id === chaletId);
                      if (b?.id) {
                        router.push({
                          pathname: "/(tabs)/(customer)/booking-success",
                          params: { id: b.id },
                        });
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
              style={[styles.sectionTitle, { textAlign: textStart }]}
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
              {FILTER_OPTIONS.map((filter) => {
                const isActive =
                  filter.id === "all"
                    ? selectedFilters.length === 0
                    : selectedFilters.includes(filter.id);
                return (
                  <SecondaryButton
                    key={filter.id}
                    label={filter.label}
                    isActive={isActive}
                    activeColor={filter.activeColor}
                    icon={filter.icon(isActive)}
                    onPress={() => toggleFilter(filter.id)}
                  />
                );
              })}
            </View>
          </GHScrollView>
        </>
      )}
    </>
  );

  // Show card skeletons on first load AND while a filter change refetches page 1
  // (clear feedback that a filter is applying), but not during pull-to-refresh
  // which has its own spinner.
  const listLoading =
    chaletsLoading || (chaletsFetching && page === 1 && !isRefreshing);

  const listEmpty = isInitialLoading ? null : listLoading ? (
    <View style={[styles.listPadding, { gap: 12 }]}>
      <HorizontalCardSkeleton />
      <HorizontalCardSkeleton />
      <HorizontalCardSkeleton />
    </View>
  ) : (
    <View style={styles.listPadding}>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <SolarWidgetBold size={60} color={Colors.primary} />
        </View>
        <ThemedText style={styles.emptyTitle}>{t("home.noChalets")}</ThemedText>
        <ThemedText style={styles.emptyDesc}>
          {t("home.noChaletsDesc")}
        </ThemedText>
        {selectedFilters.length > 0 && (
          <PressableScale
            style={styles.clearButton}
            onPress={() => setSelectedFilters([])}
          >
            <ThemedText style={styles.clearButtonText}>
              {t("home.clearFilters")}
            </ThemedText>
          </PressableScale>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <FlashList
        data={isInitialLoading ? [] : POPULAR_CHALETS}
        keyExtractor={(item: any, index: number) => String(item?.id ?? index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={listHeader}
        renderItem={({ item }: { item: any; index: number }) => (
          // No reanimated `entering` here: FlashList recycles cells, which leaves
          // entering animations stuck (items render invisible). Plain View only.
          <View style={styles.listPadding}>
            <HorizontalCard
              chalet={item}
              onPress={() => navigateToDetails(item.id, item.title)}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          chaletsFetching && page > 1 ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
        onEndReached={loadMoreChalets}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
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
    lineHeight: normalize.font(24),
    paddingVertical: 2,
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
