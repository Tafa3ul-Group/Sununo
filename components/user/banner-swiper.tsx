'use no memo';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Image, 
  FlatList, 
  NativeScrollEvent, 
  NativeSyntheticEvent 
} from 'react-native';
import { normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - normalize.width(20);
const BANNER_HEIGHT = normalize.height(160);
const AUTO_PLAY_INTERVAL = 4000; // 4 seconds

export function BannerSwiper({ data }: { data?: any[] }) {
  if (!data || data.length === 0) return null;
  const displayData = data;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play logic
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displayData.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, AUTO_PLAY_INTERVAL);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [activeIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (BANNER_WIDTH + normalize.width(10)));
    if (index !== activeIndex && index >= 0 && index < displayData.length) {
      setActiveIndex(index);
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.bannerContainer}>
      <Image 
        source={item.image ? getImageSrc(item.image) : item} 
        style={styles.bannerImage} 
        resizeMode="stretch" 
      />
    </View>
  ), []);

  const ItemSeparator = useCallback(() => (
    <View style={{ width: normalize.width(10) }} />
  ), []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={displayData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + normalize.width(10)}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        onTouchStart={stopTimer}
        onTouchEnd={startTimer}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={startTimer}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {displayData.map((_, index) => (
          <View 
            key={index} 
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
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: normalize.width(10),
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: normalize.radius(24),
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: normalize.height(12),
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#035DF9',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#C7D9FF',
  },
});
