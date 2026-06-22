import { HeaderSection } from "@/components/header-section";
import { EmptyState } from "@/components/ui/empty-state";
import { HorizontalCardSkeleton } from "@/components/ui/skeleton-loader";
import {
    SolarMagnifierBold,
    SolarTrashBinBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Colors } from "@/constants/theme";

import { useBrowseCustomerChaletsQuery } from "@/store/api/customerApiSlice";
import { getStartingPrice } from "@/utils/format";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
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

export default function SearchScreen() {
  const { t } = useTranslation();
  const { isRTL, rowDirection, textAlign } = useDirection();
  const isArabic = isRTL;
  const textStart: "left" | "right" = textAlign;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  const { data: chaletsResponse, isLoading } = useBrowseCustomerChaletsQuery({
    page: 1,
    limit: 20,
    search: searchQuery || undefined,
  });

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

  const renderItem = ({ item, index }: { item: any; index: number }) => (
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
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderSection
        title={t("home.search")}
        isHome={false}
        showBackButton={true}
        onBackPress={() => router.back()}
        showLogo={false}
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { flexDirection: rowDirection }]}>
          <SolarMagnifierBold size={20} color={Colors.primary} />
          <TextInput
            placeholder={t("home.searchPlaceholder")}
            style={[
              styles.searchInput,
              { textAlign: textStart },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <SolarTrashBinBold size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {searchQuery.length === 0 ? (
        <EmptyState
          icon={<SolarMagnifierBold size={40} color={Colors.primary} />}
          title={
            isArabic
              ? "ابدأ البحث عن الشاليهات المفضلة لديك"
              : "Start searching for your favorite chalets"
          }
        />
      ) : isLoading ? (
        <View style={[styles.listContent, { gap: 12 }]}>
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
          <HorizontalCardSkeleton />
        </View>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    height: 52,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: "Alexandria-Medium",
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
