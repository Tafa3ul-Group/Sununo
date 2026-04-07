import React from 'react';
import { 
  FlatList, 
  StyleSheet, 
  View, 
  Dimensions 
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH + SEPARATOR_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={[
          styles.listContent, 
          { flexDirection: isRTL ? 'row-reverse' : 'row' }
        ]}
        ItemSeparatorComponent={() => <View style={{ width: SEPARATOR_WIDTH }} />}
        pagingEnabled={false}
        inverted={isRTL} 
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
  },
  cardOverride: {
    width: '100%',
    marginBottom: 0, 
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  }
});
