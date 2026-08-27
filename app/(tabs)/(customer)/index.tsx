import { Redirect, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { pickTranslation, useDirection } from "@/i18n";
import { BannerSkeleton, FeaturedSwiperSkeleton, HorizontalSwiperSkeleton, HorizontalCardSkeleton, CustomerHomeSkeleton } from "@/components/ui/skeleton-loader";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import { HeaderSection } from "@/components/header-section";
import { PressableScale } from "@/components/ui/pressable-scale";
import {
  SolarAltArrowDownBold,
  SolarFireBold,
  SolarFiltersBoldDuotone,
  SolarSortByTimeBold,
  SolarTreeBold,
  SolarWaterBold,
  SolarWidgetBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { BannerSwiper } from "@/components/user/banner-swiper";
import { RateStayPrompt } from "@/components/user/rate-stay-prompt";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { OwnerModeBanner } from "@/components/user/owner-mode-banner";
import { FeaturedSwiper } from "@/components/user/featured-swiper";
import { useTabBarVisibility } from "@/components/user/tab-bar-visibility";
import { useRegisterHomeScrollToTop } from "@/components/user/home-tab-fx";
import {
  HomeFiltersSheet,
  EMPTY_HOME_FILTERS,
  countHomeFilters,
  type HomeFilters,
} from "@/components/user/home-filters-sheet";
import {
  HomeSortSheet,
  homeSortLabel,
  type HomeSortKey,
} from "@/components/user/home-sort-sheet";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { formatChaletLocation, getStartingPrice } from "@/utils/format";
import { openBannerLink } from "@/utils/banner-link";
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
// One height for the sort chips and the filter button, so the row is level.
const CONTROL_HEIGHT = 40;

const CARD_COLORS = [Colors.primary, Colors.secondary, Colors.accent];

// Temporarily hide the home "Nearby / Map" section. Set to `true` to restore it.
const SHOW_HOME_MAP = false;


export default function HomeScreen() {
  const { userType } = useSelector((state: RootState) => state.auth);
  const { isRTL, rowDirection, textAlign } = useDirection();
  const router = useRouter();
  const { t } = useTranslation();
  const tabBarVis = useTabBarVisibility();
  // Keep the tab bar visible whenever the home gains focus, and restore it on
  // the way out so other tabs never inherit a hidden bar.
  useFocusEffect(
    useCallback(() => {
      tabBarVis?.show();
      return () => tabBarVis?.show();
    }, [tabBarVis]),
  );
  // Tapping the home tab button while home is already open scrolls back up.
  const listRef = React.useRef<any>(null);
  useRegisterHomeScrollToTop(
    useCallback(() => {
      listRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      tabBarVis?.show();
    }, [tabBarVis]),
  );

  // Multi-select filter chips. Empty array === "All".
  const [filters, setFilters] = React.useState<HomeFilters>(EMPTY_HOME_FILTERS);
  const insets = useSafeAreaInsets();

  const handleListScroll = useCallback(
    (e: any) => {
      tabBarVis?.onScroll(e);
    },
    [tabBarVis],
  );

  // How the recommended list is ordered.
  const [sortBy, setSortBy] = React.useState<HomeSortKey>("newest");
  // Only set once the customer asks for "nearest" and grants permission — the
  // home screen must never prompt for location on its own.
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(
    null,
  );
  const filtersSheetRef = React.useRef<BottomSheetModal>(null);
  const sortSheetRef = React.useRef<BottomSheetModal>(null);

  // Picking "nearest" is the only thing that may ask for location, and only the
  // first time — every other sort applies straight away.
  const handleSortSelect = React.useCallback(async (key: HomeSortKey) => {
    if (key !== "nearest") {
      setSortBy(key);
      return;
    }
    if (coords) {
      setSortBy("nearest");
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        isRTL ? "الموقع مغلق" : "Location off",
        isRTL
          ? "نحتاج إذن الموقع حتى نرتب الشاليهات حسب الأقرب لك"
          : "Location permission is needed to sort chalets by distance",
      );
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({});
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setSortBy("nearest");
    } catch {
      Alert.alert(
        isRTL ? "تعذّر تحديد موقعك" : "Could not get your location",
        isRTL ? "جرّب مرة ثانية" : "Please try again",
      );
    }
  }, [coords, isRTL]);

  // Fetch all amenities to resolve real IDs for pool/bbq/garden filters
  const { data: allAmenities = [] } = useGetAmenitiesQuery();

  // Admin-selected amenities to show as home filter chips (empty → use defaults)
  const { data: homeFilterAmenities = [] } = useGetHomeFilterAmenitiesQuery();

  // Build a lookup: slug/keyword → real amenity ID
  const amenityIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    allAmenities.forEach((amenity: any) => {
      // pickTranslation, not `|| amenity.name`: that fallback handed back the
      // whole {ar,en} object and `.toLowerCase()` threw on it.
      const nameEn = pickTranslation(amenity, false).toLowerCase();
      const nameAr = pickTranslation(amenity, true).toLowerCase();
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
  const filtersKey = JSON.stringify(filters);

  // Reset paging whenever the selected filters change.
  React.useEffect(() => {
    setPage(1);
  }, [filtersKey, sortBy]);

  const queryParams = React.useMemo(() => {
    const params: any = { page, limit: 10 };

    // Chip keys are prefixed by kind: "cat:<id>" → categoryIds, "feat:<id>" →
    // amenityIds. Unprefixed keys are built-in default slugs (pool/bbq/garden)
    // resolved to real amenity IDs via amenityIdMap.
    const amenityIds: string[] = [];
    const categoryIds: string[] = [];
    filters.amenities.forEach((key) => {
      if (key.startsWith("cat:")) categoryIds.push(key.slice(4));
      else if (key.startsWith("feat:")) amenityIds.push(key.slice(5));
      else amenityIds.push(amenityIdMap[key] || key);
    });
    if (amenityIds.length > 0) params.amenityIds = amenityIds;
    if (categoryIds.length > 0) params.categoryIds = categoryIds;

    // Everything below is null until the customer sets it, and a null is simply
    // not sent — the API treats a missing param as "no bound".
    if (filters.minPrice != null) params.minPrice = filters.minPrice;
    if (filters.maxPrice != null) params.maxPrice = filters.maxPrice;
    if (filters.cityId) params.cityId = filters.cityId;
    if (filters.guests) params.maxAdults = filters.guests;
    if (filters.minRating) params.minRating = filters.minRating;
    if (filters.minBedrooms) params.minBedrooms = filters.minBedrooms;

    // `nearest` is meaningless without coordinates, and the API ignores it, so
    // it is only sent once the customer has actually granted location.
    if (sortBy === "rating") params.sortBy = "rating";
    if (sortBy === "nearest" && coords) {
      params.sortBy = "nearest";
      params.lat = coords.lat;
      params.lng = coords.lng;
    }
    return params;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, amenityIdMap, page, sortBy, coords]);

  // Fetch data from the backend
  const { data: bannersResponse, isFetching: bannersFetching, refetch: refetchBanners } = useGetBannersQuery(undefined);
  const { data: chaletsResponse, isLoading: chaletsLoading, isFetching: chaletsFetching, refetch: refetchChalets } =
    useBrowseCustomerChaletsQuery(queryParams);

  const totalPages = chaletsResponse?.meta?.totalPages || 1;
  const hasMoreChalets = page < totalPages;

  // Accumulate chalets across pages for infinite scroll (dedup by id).
  React.useEffect(() => {
    const incoming = chaletsResponse?.data;
    // Changing a filter or the sort starts a new cache entry, so `data` is
    // briefly undefined. Clearing the list on that would empty the screen and
    // then refill it — the cards stay put until the new page actually lands.
    if (!incoming) return;
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
            location: formatChaletLocation(c, isRTL),
            image: c.images?.[0]?.url ?? c.images?.[0],
            blurhash: c.images?.[0]?.blurhash,
            price: getStartingPrice(c),
            // Carried through so the card can show the discount badge; the API
            // leaves it undefined when no campaign is running.
            discount: c.discount,
            rating: c.averageRating ?? c.rating ?? 0,
            features: c.features ?? c.chaletFeatures,
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
          location: formatChaletLocation(c, isRTL),
          image: c.images?.[0]?.url ?? c.images?.[0],
          blurhash: c.images?.[0]?.blurhash,
          price: getStartingPrice(c),
          // Carried through so the card can show the discount badge; the API
          // leaves it undefined when no campaign is running.
          discount: c.discount,
          rating: c.rating ?? c.averageRating ?? 0,
          features: c.features,
          // Resolved server-side (platform default merged with any per-chalet
          // override), so the card renders it as-is.
          featuredLabel: c.featuredLabel,
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
        // Always a string. An admin can save a banner with an empty title, and
        // `"" || b.title` would fall through to the whole {ar,en} OBJECT — which
        // then reached `accessibilityLabel` and killed Fabric's mount dispatch
        // on Android with a ClassCastException (blank screen, no JS error).
        title:
          typeof b.title === "string"
            ? b.title
            : (isRTL ? b.title?.ar : b.title?.en) ?? "",
        // Admin-set destination: a chalet id, an internal path, or a URL.
        link: b.link,
      })),
    [bannersResponse, isRTL],
  );

  const handleBannerPress = useCallback((banner: any) => {
    if (!openBannerLink(banner?.link)) return;
    logEvent(ANALYTICS_EVENTS.SELECT_PROMOTION, {
      promotion_id: String(banner?.id ?? ""),
      promotion_name: banner?.title || "",
      creative_slot: "home_banner",
    });
  }, []);

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
      title: pickTranslation(chalet, isRTL),
      location: formatChaletLocation(chalet, isRTL),
      price: getStartingPrice(chalet),
      // Carried through so the card can show the discount badge; the API
      // leaves it undefined when no campaign is running.
      discount: chalet.discount,
      // The list endpoint returns `rating`; only some payloads carry
      // `averageRating`, so both are read or the card shows every chalet as new.
      rating: chalet.rating ?? chalet.averageRating ?? 0,
      color: CARD_COLORS[index % CARD_COLORS.length],
      image: getImageSrc(chalet.images?.[0]?.url),
      // The few amenities the card lists ("يحتوي على: ..."); the list endpoint
      // trims them to what fits, so they are passed straight through.
      features: chalet.features,
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

  // Sort dropdown on the reading edge, filter on the far edge — both a fixed
  // size, so changing either never nudges the row.
  const renderListControls = () => (
    <View style={[styles.listControls, { flexDirection: "row" }]}>
      <TouchableOpacity
        onPress={() => sortSheetRef.current?.present()}
        style={[styles.sortButton, { flexDirection: rowDirection }]}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isRTL ? "ترتيب النتائج" : "Sort results"}
        accessibilityValue={{ text: homeSortLabel(sortBy, isRTL) }}
      >
        <SolarSortByTimeBold size={16} color={Colors.primary} />
        <ThemedText style={styles.sortLabel} numberOfLines={1}>
          {homeSortLabel(sortBy, isRTL)}
        </ThemedText>
        <SolarAltArrowDownBold size={14} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => filtersSheetRef.current?.present()}
        style={styles.filterButton}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={isRTL ? "فلترة" : "Filter"}
        // Drawn at 40pt; the extra slop brings the tap area to the 44pt minimum.
        hitSlop={6}
      >
        <SolarFiltersBoldDuotone size={18} color={Colors.primary} />
        {/* A dot rather than a count: the number is in the sheet, and this only
            has to answer "is anything filtering this list right now?". */}
        {countHomeFilters(filters) > 0 && <View style={styles.filterDot} />}
      </TouchableOpacity>
    </View>
  );

  // Everything above the recommended list, rendered as the FlashList header so
  // the chalet list itself stays virtualized (only on-screen cards mount).
  const listHeader = (
    <>
      {/* Above the skeleton on purpose: an owner who landed here by mistake
          shouldn't have to wait for the chalet list to load to find the way
          back. Renders nothing for anyone who isn't a provider in tenant mode. */}
      <OwnerModeBanner />

      {isInitialLoading ? (
        <CustomerHomeSkeleton />
      ) : (
        <>
          {/* Banners Swiper */}
          {bannersFetching && !bannersResponse ? (
            <BannerSkeleton />
          ) : banners?.length > 0 ? (
            <Animated.View>
              <BannerSwiper data={banners} onBannerPress={handleBannerPress} />
            </Animated.View>
          ) : null}

          {/* Featured ("مميّزة") — admin-curated strip directly below the banner.
              Hidden entirely when there's nothing featured. */}
          {(featuredLoading || featuredChalets.length > 0) && (
            <>
              <View
                style={[styles.sectionHeader, { flexDirection: 'row' }]}
              >
                <ThemedText
                  style={[styles.sectionTitle, { textAlign }]}
                >
                  {t("home.featured")}
                </ThemedText>
                <PressableScale onPress={() => router.push("/featured")}>
                  <ThemedText style={styles.seeAll}>
                    {t("home.seeAll")}
                  </ThemedText>
                </PressableScale>
              </View>
              {featuredLoading ? (
                <FeaturedSwiperSkeleton count={3} />
              ) : (
                <View style={styles.swiperWrapper}>
                  <FeaturedSwiper
                    data={featuredChalets}
                    onPressCard={(chaletId: string) =>
                      navigateToDetails(chaletId)
                    }
                    onPressSeeAll={() => router.push("/featured")}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </View>
              )}
            </>
          )}

          {/* Nearby / Map — temporarily hidden (toggle SHOW_HOME_MAP to restore) */}
          {SHOW_HOME_MAP && (
            <>
              <View style={[styles.sectionHeader, { flexDirection: 'row' }]}>
                <ThemedText
                  style={[styles.sectionTitle, { textAlign }]}
                >
                  {t("home.categories.nearby")}
                </ThemedText>
                <PressableScale
                  onPress={() => router.push("/(tabs)/(customer)/explore")}
                >
                  <ThemedText style={styles.seeAll}>
                    {t("home.openMap")}
                  </ThemedText>
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
            </>
          )}

          {/* Recent bookings — hidden entirely when there's no data */}
          {(latestBookingsLoading || recentBookingChalets.length > 0) && (
            <>
              <View style={[styles.sectionHeader, { flexDirection: 'row' }]}>
                <ThemedText
                  style={[styles.sectionTitle, { textAlign }]}
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

          {/* Recommended — the sort dropdown and the filter button sit on the
              same line as the title. */}
          <View style={[styles.sectionHeader, { flexDirection: 'row' }]}>
            <ThemedText
              style={[styles.sectionTitle, { textAlign }]}
              numberOfLines={1}
            >
              {t("home.recommended")}
            </ThemedText>
            {renderListControls()}
          </View>
        </>
      )}
    </>
  );

  // Skeletons are for the true first load only. Swapping the list for them on
  // every filter/sort change made the whole screen jump; the cards now stay on
  // screen and are replaced in place once the new page arrives.
  const listLoading = chaletsLoading;

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
        {countHomeFilters(filters) > 0 && (
          <PressableScale
            style={styles.clearButton}
            onPress={() => setFilters(EMPTY_HOME_FILTERS)}
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
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      {/* Sticky header — stays pinned while the list scrolls underneath. */}
      <HeaderSection isHome />
      <View style={{ flex: 1 }}>
      <FlashList
        ref={listRef}
        data={isInitialLoading ? [] : POPULAR_CHALETS}
        keyExtractor={(item: any, index: number) => String(item?.id ?? index)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
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
      {/* One-shot rating invite for a completed, still-unreviewed booking.
          Fully self-contained — queries, once-per-booking storage and the
          gorhom sheet all live inside the component. */}
      <RateStayPrompt />

      {/* "all" is dropped: clearing every pick is the sheet's own action. */}
      <HomeFiltersSheet
        ref={filtersSheetRef}
        options={FILTER_OPTIONS.filter((o: any) => o.id !== "all")}
        value={filters}
        onApply={setFilters}
      />

      <HomeSortSheet
        ref={sortSheetRef}
        value={sortBy}
        onSelect={handleSortSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  listControls: {
    alignItems: "center",
    gap: 8 },
  sortButton: {
    height: CONTROL_HEIGHT,
    // Fixed width: the label swaps between "Newest" and "Top rated" and the row
    // must not resize under it.
    width: normalize.width(128),
    alignItems: "center",
    gap: 6,
    paddingHorizontal: normalize.width(12),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white" },
  sortLabel: {
    flex: 1,
    fontSize: normalize.font(12),
    fontFamily: Fonts.medium,
    color: "#111827" },
  filterButton: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB" },
  filterDot: {
    position: "absolute",
    top: normalize.width(8),
    end: normalize.width(8),
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: "white" },
  scrollContent: { paddingBottom: 120 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: normalize.font(15),
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
    lineHeight: normalize.font(22),
    paddingVertical: 2,
    flexShrink: 1,
  },
  seeAll: {
    fontSize: normalize.font(13),
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    lineHeight: normalize.font(20),
  },
  seeAllArrow: {
    padding: 4,
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: normalize.font(14),
  },
});
