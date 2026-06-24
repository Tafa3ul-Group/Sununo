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
const SNAP = ITEM_WIDTH + SEPARATOR_WIDTH;
const AUTO_PLAY_INTERVAL = 4000;
interface HorizontalSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
  onIndexChange?: (index: number) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  /** Auto-scroll through the cards (like the banner). Off by default. */
  autoPlay?: boolean;
}

export function HorizontalSwiper({ data, onPressCard, onIndexChange, favoriteIds = [], onToggleFavorite, autoPlay = false }: HorizontalSwiperProps) {
    const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!autoPlay || data.length <= 1) return;
    stopTimer();
    timerRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % data.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      activeIndexRef.current = next;
      setActiveIndex(next);
    }, AUTO_PLAY_INTERVAL);
  }, [autoPlay, data.length, stopTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SNAP);
    if (index !== activeIndex && index >= 0 && index < data.length) {
      activeIndexRef.current = index;
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
        snapToInterval={SNAP}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        pagingEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ width: SEPARATOR_WIDTH }} />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={startTimer}
        getItemLayout={(_, index) => ({
          length: SNAP,
          offset: SNAP * index,
          index,
        })}
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
