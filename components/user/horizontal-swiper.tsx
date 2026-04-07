import React from 'react';
import { 
  FlatList, 
  StyleSheet, 
  View, 
  Dimensions, 
  NativeScrollEvent, 
  NativeSyntheticEvent 
} from 'react-native';
import { HorizontalCard } from './horizontal-card';
import { normalize } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH - normalize.width(40);
const SEPARATOR_WIDTH = normalize.width(12);

interface HorizontalSwiperProps {
  data: any[];
  onPressCard?: (id: string) => void;
}

export function HorizontalSwiper({ data, onPressCard }: HorizontalSwiperProps) {
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
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + SEPARATOR_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: SEPARATOR_WIDTH }} />}
        pagingEnabled={false}
        inverted={true} // For RTL feel if needed, but FlatList horizontal with row-reverse can be tricky
        // Actually, in Sununo we mostly use row-reverse View inside SCrollView for RTL.
        // For FlatList horizontal, it's better to just use standard horizontal and handle LTR/RTL via style.
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: normalize.height(10),
  },
  listContent: {
    paddingHorizontal: normalize.width(20),
    flexDirection: 'row-reverse', // Align items for Arabic
  },
  cardOverride: {
    width: '100%',
    marginBottom: 0, // Reset margin since separator handles it
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  }
});
