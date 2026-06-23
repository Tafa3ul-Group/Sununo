import { HeaderSection } from "@/components/header-section";
import { MotionIcon } from "@/components/icons/motion-icons";
import {
    SolarCalendarMinimalisticBold,
    SolarClockCircleBold,
    SolarCloseBold,
    SolarMapPointBold,
    SolarUsersGroupBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Colors, Shadows } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { getStartingPrice } from "@/utils/format";

import { RootState } from "@/store";
import { unwrapListResponse } from "@/store/api/apiSlice";
import {
    useBrowseCustomerChaletsQuery,
    useGetFavoriteIdsQuery,
    useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import { clearFilters, setFilters } from "@/store/filterSlice";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS, ANALYTICS_CURRENCY } from "@/constants/analytics-events";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FilterResultsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { isRTL, rowDirection } = useDirection();
  const isArabic = isRTL;
  const insets = useSafeAreaInsets();

  const { userType } = useSelector((state: RootState) => state.auth);

  // Read active filters from Redux store
  const activeFilters = useSelector(
    (state: RootState) => (state as any).filter,
  );

  // Fetch favorite chalet IDs
  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery(undefined, { skip: userType === "guest" });
  const [toggleFavorite] = useToggleFavoriteMutation();

  // Construct search API query params from the Redux filters
  const queryParams = useMemo(() => {
    const params: any = { page: 1, limit: 30 };
    if (activeFilters?.cityId) params.cityId = activeFilters.cityId;
    if (activeFilters?.search) params.search = activeFilters.search;
    if (activeFilters?.maxGuests) {
      params.maxGuests = activeFilters.maxGuests;
      // Send maxAdults for backend capacity checking
      params.maxAdults = activeFilters.maxGuests;
    }
    if (activeFilters?.checkIn) {
      params.checkIn = activeFilters.checkIn.split("T")[0];
    }
    if (activeFilters?.checkOut) {
      params.checkOut = activeFilters.checkOut.split("T")[0];
    }
    if (activeFilters?.period) {
      params.period = activeFilters.period;
    }
    return params;
  }, [activeFilters]);

  // Request filtered chalets
  const {
    data: chaletsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useBrowseCustomerChaletsQuery(queryParams);

  // Language-specific extraction helpers (stable identities)
  const getChaletName = useCallback(
    (chalet: any, arabic: boolean) =>
      arabic
        ? chalet.name?.ar || chalet.nameAr || chalet.name || ""
        : chalet.name?.en || chalet.nameEn || chalet.name || "",
    [],
  );

  const getChaletLocation = useCallback(
    (chalet: any, arabic: boolean) =>
      arabic
        ? chalet.region?.name?.ar ||
          chalet.region?.nameAr ||
          chalet.region?.name ||
          ""
        : chalet.region?.name?.en ||
          chalet.region?.nameEn ||
          chalet.region?.name ||
          "",
    [],
  );

  // Transform chalets payload using robust unwrapping and fallbacks
  const filteredChalets = useMemo(() => {
    const chalets = unwrapListResponse(chaletsResponse);
    return chalets.map((chalet: any) => {
      return {
        id: chalet.id,
        title: getChaletName(chalet, isArabic),
        location: getChaletLocation(chalet, isArabic),
        price: getStartingPrice(chalet),
        image: getImageSrc(chalet.images?.[0]?.url || chalet.image || ""),
        images: chalet.images || [],
        rating: chalet.averageRating || chalet.rating || 0,
        reviewsCount: chalet.reviewsCount || chalet.reviewCount || 0,
        isFavorite: favoriteIds.includes(chalet.id),
      };
    });
  }, [chaletsResponse, favoriteIds, isArabic, getChaletName, getChaletLocation]);

  // ── Analytics: search + view_search_results (fires when results arrive) ────
  useEffect(() => {
    if (isFetching || !chaletsResponse) return;
    const term = activeFilters?.search || "";
    logEvent(ANALYTICS_EVENTS.VIEW_SEARCH_RESULTS, {
      search_term: term,
      results_count: filteredChalets.length,
      city: activeFilters?.cityName || undefined,
      period: activeFilters?.period || undefined,
    });
    if (term) {
      logEvent(ANALYTICS_EVENTS.SEARCH, { search_term: term });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaletsResponse, isFetching]);

  const handleToggleFavorite = async (chalet: any) => {
    const wasFavorite = favoriteIds.includes(chalet.id);
    try {
      await toggleFavorite(chalet.id).unwrap();
      refetchFavorites();
      if (!wasFavorite) {
        const numericPrice = Number(String(chalet.price).replace(/[^\d.]/g, "")) || 0;
        logEvent(ANALYTICS_EVENTS.ADD_TO_WISHLIST, {
          currency: ANALYTICS_CURRENCY,
          value: numericPrice,
          items: [
            {
              item_id: String(chalet.id),
              item_name: chalet.title,
              price: numericPrice,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Build filter pills display
  const activePills = useMemo(() => {
    const pills = [];
    if (activeFilters?.cityName) {
      pills.push({
        id: "city",
        text: activeFilters.cityName,
        icon: <SolarMapPointBold size={14} color={Colors.primary} />,
        onRemove: () =>
          dispatch(
            setFilters({ ...activeFilters, cityId: null, cityName: null }),
          ),
      });
    }
    if (activeFilters?.checkIn) {
      const dateText = new Date(activeFilters.checkIn).toLocaleDateString(
        isArabic ? "ar" : "en",
        { month: "short", day: "numeric" },
      );
      pills.push({
        id: "date",
        text: dateText,
        icon: (
          <SolarCalendarMinimalisticBold size={14} color={Colors.primary} />
        ),
        onRemove: () =>
          dispatch(
            setFilters({ ...activeFilters, checkIn: null, checkOut: null }),
          ),
      });
    }
    if (activeFilters?.period) {
      const periodMap: Record<string, string> = {
        morning: isArabic ? "صباحي" : "Morning",
        evening: isArabic ? "مسائي" : "Evening",
        overnight: isArabic ? "مبيت" : "Overnight",
      };
      pills.push({
        id: "period",
        text: periodMap[activeFilters.period] || activeFilters.period,
        icon: <SolarClockCircleBold size={14} color={Colors.primary} />,
        onRemove: () =>
          dispatch(setFilters({ ...activeFilters, period: null })),
      });
    }
    if (activeFilters?.maxGuests) {
      pills.push({
        id: "guests",
        text: `${activeFilters.maxGuests} ${isArabic ? "ضيوف" : "guests"}`,
        icon: <SolarUsersGroupBold size={14} color={Colors.primary} />,
        onRemove: () =>
          dispatch(
            setFilters({
              ...activeFilters,
              maxGuests: null,
              adults: 2,
              children: 0,
            }),
          ),
      });
    }
    return pills;
  }, [activeFilters]);

  // Reset filters and go back
  const handleClearAll = () => {
    dispatch(clearFilters());
    router.back();
  };

  // Render chalet item card
  const renderChaletCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay((index % 8) * 60).duration(380)}>
      <HorizontalCard
        chalet={item}
        onPress={() => {
          logEvent(ANALYTICS_EVENTS.SELECT_ITEM, {
            item_list_id: "search_results",
            items: [{ item_id: String(item.id), item_name: item.title }],
          });
          router.push(`/chalet-details/${item.id}`);
        }}
        shapeIndex={2}
        isFavorite={item.isFavorite}
        onToggleFavorite={() => handleToggleFavorite(item)}
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderSection
        title={isArabic ? "نتائج البحث" : "Filter Results"}
        showBackButton={true}
        showLogo={false}
        onBackPress={() => router.back()}
      />

      {/* Horizontal Active Filter Badges */}
      {activePills.length > 0 && (
        <View style={styles.pillsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={activePills}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.pillsList, { flexDirection: rowDirection }]}
            renderItem={({ item }) => (
              <View style={[styles.pill, { flexDirection: rowDirection }]}>
                {item.icon}
                <ThemedText style={styles.pillText}>{item.text}</ThemedText>
                <TouchableOpacity
                  onPress={item.onRemove}
                  style={styles.pillClose}
                >
                  <SolarCloseBold size={12} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {isLoading || isFetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredChalets.length > 0 ? (
        <FlatList
          data={filteredChalets}
          renderItem={renderChaletCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Premium Empty State with MotionIcon Animation */
        <View style={styles.centerContainer}>
          <MotionIcon
            name="error404"
            size={200}
            autoPlay
            loop
            style={styles.emptyAnimation}
          />
          <ThemedText style={styles.emptyTitle}>
            {isArabic
              ? "عذراً، لا توجد نتائج مطابقة"
              : "No Matching Chalets Found"}
          </ThemedText>
          <ThemedText style={styles.emptyDesc}>
            {isArabic
              ? "لم نجد شاليهات تطابق خيارات الفلترة الحالية. جرب تغيير المحافظة أو التواريخ."
              : "We couldn't find any chalets matching your filters. Try resetting or tweaking them."}
          </ThemedText>
          <TouchableOpacity style={styles.resetButton} onPress={handleClearAll}>
            <ThemedText style={styles.resetButtonText}>
              {isArabic ? "إعادة ضبط الفلاتر" : "Reset All Filters"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  pillsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pillsList: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBF1FF",
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  pillClose: {
    padding: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Shadows.small,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    end: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  priceTag: {
    position: "absolute",
    bottom: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontFamily: "Alexandria-Bold",
    color: "white",
  },
  cardDetails: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Alexandria-Bold",
    color: "#111827",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: "#374151",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    flex: 1,
  },
  emptyAnimation: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    ...Shadows.small,
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
    color: "white",
  },
});
