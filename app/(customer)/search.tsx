import { EmptyState } from "@/components/ui/empty-state";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { HorizontalCardSkeleton } from "@/components/ui/skeleton-loader";
import { ErrorState } from "@/components/ui/error-state";
import {
    SolarMagnifierBold,
    SolarTrashBinBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Colors, Fonts, normalize } from "@/constants/theme";

import {
    useGetFeaturedChaletsQuery,
    useSearchChaletsQuery,
} from "@/store/api/customerApiSlice";
import { getStartingPrice } from "@/utils/format";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    useSafeAreaInsets
} from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { pickTranslation, useDirection } from "@/i18n";

// Fixed per-row height for FlatList getItemLayout. The card has a fixed height
// (normalize.height(115)) and its wrapper adds a 16px bottom margin, so each row
// occupies a deterministic amount of vertical space.
const CARD_HEIGHT = normalize.height(115) + 16;

export default function SearchScreen() {
  const { t } = useTranslation();
  const { isRTL, textAlign, inputTextAlign } = useDirection();
  const isArabic = isRTL;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const insets = useSafeAreaInsets();

  // Debounce the value used for the network request so rapid typing
  // doesn't trigger a request on every keystroke. The input value
  // (searchQuery) still updates immediately, preserving UX/visuals.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Elasticsearch-backed relevance search (falls back to ILIKE server-side).
  // Skipped while there's nothing to search — the featured list covers the
  // empty state, so no request is wasted on an empty term.
  const trimmedQuery = debouncedQuery.trim();
  const { data: chaletsResponse, isLoading, isError, refetch } = useSearchChaletsQuery(
    { q: trimmedQuery, page: 1, limit: 20 },
    { skip: trimmedQuery.length === 0 },
  );

  // While the debounce window is still open the hook is either skipped or
  // pointed at the previous term — treat that gap as loading so stale results
  // (or a premature empty state) never flash between keystrokes.
  const waitingForDebounce =
    searchQuery.trim().length > 0 && debouncedQuery !== searchQuery;

  // Featured chalets shown before the user types anything.
  const { data: featuredRaw = [], isLoading: featuredLoading } =
    useGetFeaturedChaletsQuery(undefined);

  const featuredChalets = useMemo(
    () =>
      (Array.isArray(featuredRaw) ? featuredRaw : [])
        .filter(Boolean)
        .map((chalet: any) => ({
          id: chalet.id,
          title: isArabic
            ? chalet.name?.ar || chalet.nameAr || chalet.name || ""
            : chalet.name?.en || chalet.nameEn || chalet.name || "",
          location: isArabic
            ? chalet.region?.name?.ar || chalet.region?.nameAr || chalet.region?.name || ""
            : chalet.region?.name?.en || chalet.region?.nameEn || chalet.region?.name || "",
          price: getStartingPrice(chalet),
          // Carried through so the card can show the discount badge; the API
          // leaves it undefined when no campaign is running.
          discount: chalet.discount,
          rating: chalet.rating ?? chalet.averageRating ?? 0,
          image: chalet.images?.[0]?.url ?? chalet.images?.[0],
          blurhash: chalet.images?.[0]?.blurhash,
        })),
    [featuredRaw, isArabic],
  );

  const chalets = useMemo(() => {
    const data = chaletsResponse?.data || [];
    return data.map((chalet: any) => ({
      id: chalet.id,
      title: pickTranslation(chalet, isArabic),
      location: pickTranslation(chalet.region, isArabic),
      price: getStartingPrice(chalet),
      // Carried through so the card can show the discount badge; the API
      // leaves it undefined when no campaign is running.
      discount: chalet.discount,
      rating: chalet.averageRating || chalet.rating || 0,
      // The few amenities the card lists ("يحتوي على: ..."), trimmed server-side.
      features: chalet.features,
      image:
        chalet.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop",
      blurhash: chalet.images?.[0]?.blurhash,
    }));
  }, [chaletsResponse, isArabic]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <Animated.View
        style={styles.cardWrapper}
      >
        <HorizontalCard
          chalet={item}
          onPress={() => router.push(`/chalet-details/${item.id}`)}
          shapeIndex={1}
        />
      </Animated.View>
    ),
    [router]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back button + search field on a single row (no title). */}
      <View style={[styles.topBar, { flexDirection: 'row' }]}>
        <CircleBackButton onPress={() => router.back()} />
        <View
          style={[
            styles.searchBar,
            { flexDirection: 'row', flex: 1 },
          ]}
        >
          <SolarMagnifierBold size={20} color={Colors.primary} />
          <TextInput
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={Colors.text.muted}
            style={[styles.searchInput, { textAlign: inputTextAlign }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? "مسح البحث" : "Clear search"}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.clearBtn}
            >
              <SolarTrashBinBold size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results — keyed off the trimmed term, like the query itself: a
          whitespace-only input searches nothing, so it must keep showing the
          featured list rather than an empty "no results" state. */}
      {searchQuery.trim().length === 0 ? (
        featuredLoading ? (
          <View style={[styles.listContent, { gap: 12 }]}>
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
            <HorizontalCardSkeleton />
          </View>
        ) : featuredChalets.length === 0 ? (
          <EmptyState
            icon={<SolarMagnifierBold size={40} color={Colors.primary} />}
            title={
              isArabic
                ? "ابدأ البحث عن الشاليهات المفضلة لديك"
                : "Start searching for your favorite chalets"
            }
          />
        ) : (
          <FlatList
            data={featuredChalets}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: "flex-start",
                  marginBottom: 12,
                }}
              >
                <ThemedText
                  style={[styles.featuredTitle, { textAlign }]}
                >
                  {t("home.featured")}
                </ThemedText>
              </View>
            }
          />
        )
      ) : isLoading || waitingForDebounce ? (
        <View style={[styles.listContent, { gap: 12 }]}>
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState onRetry={refetch} onBack={() => router.back()} />
      ) : chalets.length === 0 ? (
        <EmptyState
          icon={<SolarMagnifierBold size={40} color={Colors.primary} />}
          title={
            isArabic ? "لا توجد نتائج مطابقة لبحثك" : "No results matching your search"
          }
        />
      ) : (
        <FlatList
          data={chalets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={(_data, index) => ({
            length: CARD_HEIGHT,
            // +16 accounts for the list's 16px top contentContainer padding so
            // row offsets line up with actual positions.
            offset: CARD_HEIGHT * index + 16,
            index,
          })}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    padding: 4,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 10,
  },
  featuredTitle: {
    fontSize: normalize.font(15),
    fontFamily: Fonts.bold,
    color: Colors.text.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: "IBMPlexSansArabic-Regular",
  },
  clearBtn: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: "center",
    fontFamily: "IBMPlexSansArabic-Medium",
    lineHeight: 24,
  },
});
