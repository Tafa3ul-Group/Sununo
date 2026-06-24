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
    useBrowseCustomerChaletsQuery,
    useGetFeaturedChaletsQuery,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useDirection } from "@/i18n";

// Fixed per-row height for FlatList getItemLayout. The card has a fixed height
// (normalize.height(115)) and its wrapper adds a 16px bottom margin, so each row
// occupies a deterministic amount of vertical space.
const CARD_HEIGHT = normalize.height(115) + 16;

export default function SearchScreen() {
  const { t } = useTranslation();
  const { isRTL, rowDirection, textAlign } = useDirection();
  const isArabic = isRTL;
  const textStart: "left" | "right" = textAlign;
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

  const { data: chaletsResponse, isLoading, isError, refetch } = useBrowseCustomerChaletsQuery({
    page: 1,
    limit: 20,
    search: debouncedQuery || undefined,
  });

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
          rating: chalet.rating ?? chalet.averageRating ?? 0,
          image: chalet.images?.[0]?.url ?? chalet.images?.[0],
        })),
    [featuredRaw, isArabic],
  );

  const chalets = useMemo(() => {
    const data = chaletsResponse?.data || [];
    return data.map((chalet: any) => ({
      id: chalet.id,
      title: isArabic
        ? chalet.name?.ar || chalet.nameAr || chalet.name || ""
        : chalet.name?.en || chalet.nameEn || chalet.name || "",
      location: isArabic
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
      image:
        chalet.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop",
    }));
  }, [chaletsResponse, isArabic]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <Animated.View
        style={styles.cardWrapper}
        entering={FadeInDown.delay((index % 8) * 60).duration(380)}
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
      <View style={[styles.topBar, { flexDirection: rowDirection }]}>
        <CircleBackButton onPress={() => router.back()} />
        <View
          style={[
            styles.searchBar,
            { flexDirection: rowDirection, flex: 1 },
          ]}
        >
          <SolarMagnifierBold size={20} color={Colors.primary} />
          <TextInput
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={Colors.text.muted}
            style={[styles.searchInput, { textAlign: textStart }]}
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

      {/* Results */}
      {searchQuery.length === 0 ? (
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
                  flexDirection: rowDirection,
                  justifyContent: "flex-start",
                  marginBottom: 12,
                }}
              >
                <ThemedText
                  style={[styles.featuredTitle, { textAlign: textStart }]}
                >
                  {t("home.featured")}
                </ThemedText>
              </View>
            }
          />
        )
      ) : isLoading ? (
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
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
    lineHeight: 24,
  },
});
