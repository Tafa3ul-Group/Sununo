import { normalize } from "@/constants/theme";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
const AUTO_PLAY_INTERVAL = 5000;

interface HorizontalSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
}

export function HorizontalSwiper({ data, onPressCard }: HorizontalSwiperProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    stopTimer();
    if (data.length <= 1) return;
    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % data.length;
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
  }, [activeIndex, data.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (ITEM_WIDTH + SEPARATOR_WIDTH));
    if (index !== activeIndex && index >= 0 && index < data.length) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width: ITEM_WIDTH }}>
      <HorizontalCard
        chalet={item}
        shapeIndex={index}
        onPress={() => onPressCard && onPressCard(item.id)}
        style={styles.cardOverride}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + SEPARATOR_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={[styles.listContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        pagingEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ width: SEPARATOR_WIDTH }} />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={startTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  listContent: {
    paddingHorizontal: 16,
  },
  cardOverride: {
    width: "100%",
    marginBottom: 0,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
});
