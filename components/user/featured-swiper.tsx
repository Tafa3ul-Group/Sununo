import { SolarAltArrowLeftBold, SolarAltArrowRightBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useDirection } from "@/i18n";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useMemo } from "react";
import { FlatList, I18nManager, StyleSheet, TouchableOpacity, View } from "react-native";
import { FEATURED_CARD_WIDTH, FeaturedCard } from "./featured-card";

const SEPARATOR_WIDTH = normalize.width(12);
// How many real cards we show before the trailing "See all" card.
const MAX_VISIBLE = 10;

const SEE_ALL_ID = "__see_all__";

interface FeaturedSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
  onPressSeeAll?: () => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

function resolveImage(item: any) {
  const img = item?.image;
  if (typeof img === "string" && !img.startsWith("http")) return getImageSrc(img);
  return img || getImageSrc(item?.images?.[0]?.url || item?.images?.[0]);
}

/**
 * Stacked-thumbnail "عرض الكل" card that mirrors the FeaturedCard footprint and
 * always sits at the end of the strip.
 */
function SeeAllCard({
  previews,
  onPress,
}: {
  previews: any[];
  onPress?: () => void;
}) {
  const { isRTL } = useDirection();
  const Arrow = isRTL ? SolarAltArrowLeftBold : SolarAltArrowRightBold;

  const rotations = [-8, 4, -3];
  const offsets = [-normalize.width(26), 0, normalize.width(26)];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.cardBase, styles.seeAllCard]}
    >
      <View style={styles.stack}>
        {previews.slice(0, 3).map((src, i) => (
          <ExpoImage
            key={i}
            source={src}
            style={[
              styles.stackImage,
              {
                transform: [
                  { translateX: offsets[i] },
                  { rotate: `${rotations[i]}deg` },
                ],
                zIndex: i === 1 ? 3 : 1,
              },
            ]}
            contentFit="cover"
          />
        ))}
      </View>

      <View style={styles.seeAllLabelRow}>
        <ThemedText style={styles.seeAllText}>
          {isRTL ? "عرض الكل" : "See all"}
        </ThemedText>
        <Arrow size={normalize.width(16)} color="#111827" />
      </View>
    </TouchableOpacity>
  );
}

export function FeaturedSwiper({
  data,
  onPressCard,
  onPressSeeAll,
  favoriteIds = [],
  onToggleFavorite,
}: FeaturedSwiperProps) {
  const { isRTL } = useDirection();
  // When the content is RTL but the native layout manager hasn't flipped (web,
  // or before the native RTL reload), a horizontal FlatList still starts from
  // the left. Mirror the whole list so it starts from the right, then un-mirror
  // each item so the cards themselves render normally.
  const mirror = isRTL && !I18nManager.isRTL;

  const visible = useMemo(() => data.slice(0, MAX_VISIBLE), [data]);

  // Build a small set of preview thumbnails for the "See all" card — prefer the
  // chalets that didn't fit in the strip, falling back to the first few.
  const previews = useMemo(() => {
    const rest = data.slice(MAX_VISIBLE);
    const source = rest.length ? rest : data;
    return source.slice(0, 3).map(resolveImage);
  }, [data]);

  const listData = useMemo(
    () => [...visible, { id: SEE_ALL_ID, __seeAll: true }],
    [visible],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const content = item.__seeAll ? (
        <SeeAllCard previews={previews} onPress={onPressSeeAll} />
      ) : (
        <FeaturedCard
          chalet={item}
          onPress={() => onPressCard?.(item.id)}
          isFavorite={favoriteIds.includes(item.id)}
          onToggleFavorite={() => onToggleFavorite?.(item.id)}
        />
      );
      return mirror ? (
        <View style={styles.mirror}>{content}</View>
      ) : (
        content
      );
    },
    [mirror, previews, onPressSeeAll, onPressCard, favoriteIds, onToggleFavorite],
  );

  return (
    <FlatList
      style={mirror ? styles.mirror : undefined}
      data={listData}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item?.id ?? "item"}-${index}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ width: SEPARATOR_WIDTH }} />}
      decelerationRate="fast"
      snapToInterval={FEATURED_CARD_WIDTH + SEPARATOR_WIDTH}
      snapToAlignment="start"
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
  },
  mirror: {
    transform: [{ scaleX: -1 }],
  },
  cardBase: {
    width: FEATURED_CARD_WIDTH,
  },
  seeAllCard: {
    height: normalize.width(130),
    borderRadius: normalize.radius(16),
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EEF0F3",
    alignItems: "center",
    justifyContent: "center",
  },
  stack: {
    width: "100%",
    height: normalize.width(86),
    alignItems: "center",
    justifyContent: "center",
  },
  stackImage: {
    position: "absolute",
    width: normalize.width(60),
    height: normalize.width(72),
    borderRadius: normalize.radius(12),
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#E5E7EB",
  },
  seeAllLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(4),
    marginTop: normalize.height(14),
  },
  seeAllText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
});
