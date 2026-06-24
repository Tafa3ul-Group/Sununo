'use no memo';
import { normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { useDirection } from '@/i18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    View
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_PADDING = normalize.width(16);
const ITEM_GAP = normalize.width(10);
const BANNER_WIDTH = SCREEN_WIDTH - SIDE_PADDING * 2;
// 16:5 aspect ratio (width:height).
const BANNER_HEIGHT = (BANNER_WIDTH * 5) / 16;
const SNAP_INTERVAL = BANNER_WIDTH + ITEM_GAP;
const AUTO_PLAY_INTERVAL = 4000;

export function BannerSwiper({ data }: { data?: any[] }) {
  const displayData = data ?? [];
  const { rowDirection } = useDirection();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Use a ref to always have the latest index inside the interval callback
  const activeIndexRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (displayData.length === 0) return;
    stopTimer();
    timerRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % displayData.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      activeIndexRef.current = next;
      setActiveIndex(next);
    }, AUTO_PLAY_INTERVAL);
  }, [displayData.length, stopTimer]);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  // Track the actually-visible banner instead of doing scroll-offset math.
  // Offset math broke with the list's leading padding and inverted in RTL
  // (contentOffset.x flips), so the active dot didn't match the shown banner.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: Array<{ index: number | null }> }) => {
      const first = info.viewableItems[0];
      if (first && typeof first.index === 'number') {
        activeIndexRef.current = first.index;
        setActiveIndex(first.index);
      }
    },
  ).current;

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.bannerContainer}>
      <Image 
        source={item.image ? getImageSrc(item.image) : item} 
        style={styles.bannerImage} 
        resizeMode="cover"
      />
    </View>
  ), []);

  const ItemSeparator = useCallback(() => (
    <View style={{ width: ITEM_GAP }} />
  ), []);

  if (displayData.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={displayData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={startTimer}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index })}
      />

      {/* Pagination Dots */}
      <View style={[styles.pagination, { flexDirection: rowDirection }]}>
        {displayData.map((_, index) => (
          <Animated.View
            key={index}
            layout={LinearTransition.duration(240)}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
    alignItems: 'center' },
  listContent: {
    paddingHorizontal: SIDE_PADDING },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: normalize.radius(14),
    overflow: 'hidden' },
  bannerImage: {
    width: '100%',
    height: '100%' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize.height(12),
    gap: 8 },
  dot: {
    height: 8,
    borderRadius: 4 },
  activeDot: {
    width: 20,
    backgroundColor: '#035DF9' },
  inactiveDot: {
    width: 8,
    backgroundColor: '#C7D9FF' } });
