import { HeaderSection } from "@/components/header-section";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeaturedCard } from "@/components/user/featured-card";
import { useDirection } from "@/i18n";
import { SolarFireBold } from "@/components/icons/solar-icons";
import { Colors, normalize } from "@/constants/theme";
import { formatChaletLocation, getStartingPrice } from "@/utils/format";
import {
  useGetFavoriteIdsQuery,
  useGetFeaturedChaletsQuery,
  useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { useSelector } from "react-redux";

export default function FeaturedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRTL } = useDirection();
  const { userType } = useSelector((state: RootState) => state.auth);

  const {
    data: featuredRaw = [],
    isLoading,
    isError,
    refetch,
  } = useGetFeaturedChaletsQuery(undefined);

  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery(undefined, { skip: userType === "guest" });
  const [toggleFavorite] = useToggleFavoriteMutation();

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      try {
        await toggleFavorite(id).unwrap();
        refetchFavorites();
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
      }
    },
    [toggleFavorite, refetchFavorites],
  );

  const featured = useMemo(
    () =>
      (Array.isArray(featuredRaw) ? featuredRaw : [])
        .filter(Boolean)
        .map((c: any) => ({
          id: c.id,
          title: c.name,
          location: formatChaletLocation(c, isRTL),
          image: c.images?.[0]?.url ?? c.images?.[0],
          price: getStartingPrice(c),
          // Carried through so the card can show the discount badge; the API
          // leaves it undefined when no campaign is running.
          discount: c.discount,
          rating: c.rating ?? c.averageRating ?? 0,
          featuredLabel: c.featuredLabel,
        })),
    [featuredRaw, isRTL],
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection
        title={t("home.featured")}
        showBackButton
        onBackPress={() => router.back()}
        showLogo={false}
      />

      {isError && featured.length === 0 ? (
        <ErrorState onRetry={refetch} onBack={() => router.back()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {featured.length > 0 ? (
            <View style={styles.grid}>
              {featured.map((chalet, index) => (
                <Animated.View
                  key={chalet.id}
                  style={styles.gridItem}
                >
                  <FeaturedCard
                    chalet={chalet}
                    style={styles.card}
                    onPress={() => router.push(`/chalet-details/${chalet.id}`)}
                    isFavorite={favoriteIds.includes(chalet.id)}
                    onToggleFavorite={() => handleToggleFavorite(chalet.id)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            !isLoading && (
              <EmptyState
                icon={<SolarFireBold size={64} color={Colors.accent} />}
                title={t("home.featured")}
                description={t("home.noChalets")}
              />
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: normalize.height(18),
  },
  gridItem: {
    width: "48%",
  },
  card: {
    width: "100%",
  },
});
