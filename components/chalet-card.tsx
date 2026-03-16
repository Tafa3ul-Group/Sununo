import { Colors, normalize, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getImageSrc } from '@/hooks/useImageSrc';
import React from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './themed-text';

interface ChaletCardProps {
  image: any;
  title: string;
  location: string;
  guests: number;
  price: number;
  rating: number;
  isRecentlyAdded?: boolean;
}

export function ChaletCard({
  image,
  title,
  location,
  guests,
  price,
  rating,
  isRecentlyAdded = false,
}: ChaletCardProps) {
  return (
    <View style={styles.container}>
      {/* Image Container */}
      <View style={styles.imageWrapper}>
        <Image 
          source={typeof image === 'string' ? getImageSrc(image) : image} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* Heart Icon Overlay */}
        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={normalize.width(22)} color={Colors.accent.heart} />
        </TouchableOpacity>

        {/* Badge Overlay */}
        {isRecentlyAdded && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>Recently added</ThemedText>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <ThemedText type="h2" style={styles.title} numberOfLines={1}>{title}</ThemedText>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={normalize.width(14)} color={Colors.accent.star} />
            <ThemedText type="rating" style={styles.ratingText}>{rating.toFixed(1)}</ThemedText>
          </View>
        </View>

        <ThemedText type="subtitle" style={styles.infoText}>
          {location} • {guests} guests
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText type="price">${price}</ThemedText>
          <ThemedText type="subtitle" style={styles.perNight}> / night</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: normalize.radius(16),
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: normalize.height(260),
    borderRadius: normalize.radius(16),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: normalize.width(8),
    borderRadius: normalize.radius(25),
  },
  badge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: normalize.height(4),
    borderRadius: normalize.radius(20),
  },
  badgeText: {
    color: Colors.background,
    fontSize: normalize.font(11),
    fontWeight: '600',
  },
  content: {
    paddingVertical: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize.height(2),
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize.width(4),
  },
  ratingText: {
    marginLeft: normalize.width(2),
  },
  infoText: {
    marginBottom: normalize.height(4),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  perNight: {
    marginLeft: normalize.width(4),
  },
});
