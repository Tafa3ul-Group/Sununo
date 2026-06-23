import { normalize } from "@/constants/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent
} from "react-native";
import { HorizontalCard } from "./horizontal-card";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH - 32;
const SEPARATOR_WIDTH = 12;
interface HorizontalSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
  onIndexChange?: (index: number) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export function HorizontalSwiper({ data, onPressCard, onIndexChange, favoriteIds = [], onToggleFavorite }: HorizontalSwiperProps) {
    const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (ITEM_WIDTH + SEPARATOR_WIDTH));
    if (index !== activeIndex && index >= 0 && index < data.length) {
      setActiveIndex(index);
      if (onIndexChange) onIndexChange(index);
    }
  };

  const handleCardPress = useCallback(
    (id: string) => {
      onPressCard?.(id);
    },
    [onPressCard]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      onToggleFavorite?.(id);
    },
    [onToggleFavorite]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <View style={{ width: ITEM_WIDTH }}>
        <HorizontalCard
          chalet={item}
          shapeIndex={2}
          onPress={() => handleCardPress(item.id)}
          style={styles.cardOverride}
          isFavorite={favoriteIds.includes(item.id)}
          onToggleFavorite={() => handleToggleFavorite(item.id)}
        />
      </View>
    ),
    [handleCardPress, handleToggleFavorite, favoriteIds]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          // Prefer a per-item unique id (e.g. bookingId) and always append the
          // index so duplicate chalet ids (same chalet booked twice) can't collide.
          `${item?.bookingId ?? item?.id ?? "item"}-${index}`
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + SEPARATOR_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        pagingEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ width: SEPARATOR_WIDTH }} />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  listContent: {
    paddingHorizontal: 16 },
  cardOverride: {
    width: "100%",
    marginBottom: 0,
    borderWidth: 1.5,
    borderColor: "#F3F4F6" } });
