import { normalize } from "@/constants/theme";
import React from "react";
import { useTranslation } from "react-i18next";
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

interface HorizontalSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
}

export function HorizontalSwiper({ data, onPressCard }: HorizontalSwiperProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
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
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + SEPARATOR_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={[styles.listContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        pagingEnabled={false}
        ItemSeparatorComponent={() => (
          <View style={{ width: SEPARATOR_WIDTH }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No default margins, managed by parent
  },
  listContent: {
    paddingHorizontal: 16,
  },
  cardOverride: {
    width: "100%",
    marginBottom: 0, // Reset margin since separator handles it
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
  },
});
