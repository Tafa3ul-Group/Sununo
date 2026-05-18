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
import { isRTL } from "@/i18n";
import { RootState } from "@/store";
import { unwrapListResponse } from "@/store/api/apiSlice";
import {
    useBrowseCustomerChaletsQuery,
    useGetFavoriteIdsQuery,
    useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import { clearFilters, setFilters } from "@/store/filterSlice";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FilterResultsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Read active filters from Redux store
  const activeFilters = useSelector(
    (state: RootState) => (state as any).filter,
  );

  // Fetch favorite chalet IDs
  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery();
  const [toggleFavorite] = useToggleFavoriteMutation();

  // Construct search API query params from the Redux filters
  const queryParams = useMemo(() => {
    const params: any = { page: 1, limit: 30 };
    if (activeFilters?.cityId) params.cityId = activeFilters.cityId;
    if (activeFilters?.search) params.search = activeFilters.search;
    if (activeFilters?.maxGuests) {
      params.maxGuests = activeFilters.maxGuests;
      // Send maxAdults too for backend field compatibility
      params.maxAdults = activeFilters.maxGuests;
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

  // Transform chalets payload using robust unwrapping and fallbacks
  const filteredChalets = useMemo(() => {
    const chalets = unwrapListResponse(chaletsResponse);
    return chalets.map((chalet: any) => {
      // Find the price: either shift pricing or base price
      const priceVal = chalet.shifts?.[0]?.pricing?.[0]?.price
        ? Number(chalet.shifts[0].pricing[0].price)
        : chalet.basePrice
          ? Number(chalet.basePrice)
          : 0;

      return {
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
        price: priceVal.toLocaleString(),
        image: chalet.images?.[0]?.url || chalet.image || "",
        images: chalet.images || [],
        rating: chalet.averageRating || chalet.rating || 0,
        reviewsCount: chalet.reviewsCount || chalet.reviewCount || 0,
        isFavorite: favoriteIds.includes(chalet.id),
      };
    });
  }, [chaletsResponse, favoriteIds, isRTL]);

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id).unwrap();
      refetchFavorites();
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
        isRTL ? "ar" : "en",
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
        morning: isRTL ? "صباحي" : "Morning",
        evening: isRTL ? "مسائي" : "Evening",
        overnight: isRTL ? "مبيت" : "Overnight",
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
        text: `${activeFilters.maxGuests} ${isRTL ? "ضيوف" : "guests"}`,
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
    <HorizontalCard
      chalet={item}
      onPress={() => router.push(`/chalet-details/${item.id}`)}
      shapeIndex={index}
      isFavorite={item.isFavorite}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderSection
        title={isRTL ? "نتائج البحث" : "Filter Results"}
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
            contentContainerStyle={styles.pillsList}
            renderItem={({ item }) => (
              <View style={styles.pill}>
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
            {isRTL
              ? "عذراً، لا توجد نتائج مطابقة"
              : "No Matching Chalets Found"}
          </ThemedText>
          <ThemedText style={styles.emptyDesc}>
            {isRTL
              ? "لم نجد شاليهات تطابق خيارات التصفية الحالية. جرب تغيير المحافظة أو التواريخ."
              : "We couldn't find any chalets matching your filters. Try resetting or tweaking them."}
          </ThemedText>
          <TouchableOpacity style={styles.resetButton} onPress={handleClearAll}>
            <ThemedText style={styles.resetButtonText}>
              {isRTL ? "إعادة ضبط التصفية" : "Reset All Filters"}
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
    right: isRTL ? undefined : 12,
    left: isRTL ? 12 : undefined,
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
