import { HeaderSection } from "@/components/header-section";
import { ErrorState } from "@/components/ui/error-state";
import { AppMap } from "@/components/user/app-map";
import { Colors } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

// Full-screen map for a single chalet, opened from the location card on the
// chalet-details screen. It lives in the (customer) STACK on purpose: the old
// behavior pushed the explore TAB, which detached from this stack and made the
// back gesture land on home instead of the chalet the user came from.
export default function ChaletMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { id } = useLocalSearchParams();
  const chaletId = id as string;

  const {
    data: chaletData,
    isLoading,
    error,
    refetch,
  } = useGetCustomerChaletDetailsQuery(chaletId, { skip: !chaletId });

  const chalet = chaletData?.data || chaletData || ({} as any);

  // Same coordinate rules as the details screen: parse (the API may send
  // strings), validate, and fall back to Basra — never Baghdad — when the
  // chalet has no/zero coordinates.
  const chaletLng = Number(chalet?.longitude);
  const chaletLat = Number(chalet?.latitude);
  const hasChaletCoords =
    Number.isFinite(chaletLng) &&
    Number.isFinite(chaletLat) &&
    (chaletLng !== 0 || chaletLat !== 0);
  const mapLng = hasChaletCoords ? chaletLng : 47.82;
  const mapLat = hasChaletCoords ? chaletLat : 30.51;

  // Single marker in the same shape the explore map feeds AppMap, so the
  // image-in-circle marker renders identically here.
  const markers = useMemo(() => {
    if (!chalet?.id) return [];
    const mainImage =
      chalet.images?.find((img: any) => img.isMain) || chalet.images?.[0];
    return [
      {
        id: String(chalet.id),
        title: chalet.name ?? "",
        image: getImageSrc(mainImage?.url),
        coordinates: [mapLng, mapLat] as [number, number],
      },
    ];
  }, [chalet, mapLng, mapLat]);

  // Stable array identity — AppMap's Camera re-issues a fly-to whenever the
  // centerCoordinate identity changes, so rebuild it only when values change.
  const center = useMemo<[number, number]>(
    () => [mapLng, mapLat],
    [mapLng, mapLat],
  );

  return (
    // Top edge only: the map should bleed under the home indicator.
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderSection
        title={t("chalet.details.location")}
        showBackButton
        onBackPress={() => router.back()}
        showLogo={false}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error && !chalet?.id ? (
        <ErrorState onRetry={refetch} onBack={() => router.back()} />
      ) : (
        <AppMap
          style={styles.map}
          centerCoordinate={center}
          zoomLevel={15}
          markers={markers}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    flex: 1,
  },
});
