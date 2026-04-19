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
interface HorizontalSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
  onIndexChange?: (index: number) => void;
}

export function HorizontalSwiper({ data, onPressCard, onIndexChange }: HorizontalSwiperProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
