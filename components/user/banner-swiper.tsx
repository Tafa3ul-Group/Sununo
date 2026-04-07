import React, { useRef, useState } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - normalize.width(32);
const BANNER_HEIGHT = normalize.height(150);

const BANNER_ASSETS = [
  require('@/assets/banrs/first.png'),
  require('@/assets/banrs/ssecound.png'),
  require('@/assets/banrs/third.png'),
];

export function BannerSwiper() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (BANNER_WIDTH + normalize.width(10)));
    if (index !== activeIndex && index >= 0 && index < BANNER_ASSETS.length) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.bannerContainer}>
      <Image 
        source={item} 
        style={styles.bannerImage} 
        resizeMode="contain" // Prevents stretching (rubbery effect)
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={BANNER_ASSETS}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={BANNER_WIDTH + normalize.width(10)}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: normalize.width(10) }} />}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {BANNER_ASSETS.map((_, index) => (
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
    paddingHorizontal: normalize.width(16),
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
    marginTop: normalize.height(-4), 
    gap: 6,
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
