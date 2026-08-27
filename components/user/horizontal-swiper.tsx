import { normalize } from "@/constants/theme";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View
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
  // The active card lives in a ref only: nothing in this component renders it
  // (there are no dots here), so keeping it in state re-rendered the whole list
  // on every swipe for nothing.
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
    }, AUTO_PLAY_INTERVAL);
  }, [autoPlay, data.length, stopTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  // Read the active card from what is actually on screen. Offset math counted
  // from the physical left, which under native RTL is the LAST card, so the
  // reported index was mirrored (and the leading padding skewed it further).
  // Both viewability props must be stable refs or VirtualizedList throws on a
  // changed `onViewableItemsChanged`; the latest `onIndexChange` reaches the
  // frozen handler through a ref.
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: Array<{ index: number | null }> }) => {
      const first = info.viewableItems[0];
      if (!first || typeof first.index !== "number") return;
      activeIndexRef.current = first.index;
      onIndexChangeRef.current?.(first.index);
    },
  ).current;

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
      // No `direction` here any more: the list is no longer pinned LTR, so the
      // card inherits the app direction and re-applying it would double-flip.
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
        // Direction is left to native RTL, and there is deliberately NO
        // getItemLayout: hand-written offsets are logical and would override the
        // measured (mirrored) frames, sending the autoplay to the wrong card.
        contentContainerStyle={styles.listContent}
        pagingEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ width: SEPARATOR_WIDTH }} />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={startTimer}
        onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
          // Target card not measured yet: hop to the furthest measured one to
          // render the next window, then finish the jump on the next frame.
          flatListRef.current?.scrollToIndex({
            index: Math.max(0, highestMeasuredFrameIndex),
            animated: false,
          });
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true });
          });
        }}
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
