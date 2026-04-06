import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle, Dimensions } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Image as SvgImage } from "react-native-svg";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize, Spacing } from "@/constants/theme";
import { SolarIcon } from "../ui/solar-icon";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BLOB_PATH = "M77.0459 14.0977C86.8144 5.10784 99.2037 0.386687 110.42 2.50195C121.804 4.64892 131.346 13.705 135.513 30.8994C138.687 44.002 138.736 58.6286 136.25 71.833C133.77 85.0021 128.722 96.9923 121.482 104.651C109.519 117.308 92.5368 124.708 75.1924 126.547C57.8513 128.385 39.9659 124.682 26.1904 114.895C2.53265 98.088 -5.36999 65.526 9.69531 44.0059C15.0767 36.3186 23.5058 33.0498 41.1289 30.5859C50.2739 29.3071 56.0975 28.0172 61.1807 25.6816C66.2509 23.3521 70.7222 19.918 77.0459 14.0977H77.0459Z";

interface HorizontalCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
}

export function HorizontalCard({ chalet, onPress, style }: HorizontalCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  if (!chalet) return null;

  const imageUrl = chalet.images?.[0] || chalet.image || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400";
  const borderColor = chalet.color || Colors.secondary;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* 1. الطرف الأيسر: القلب والتقييم */}
      <View style={styles.leftColumn}>
        <TouchableOpacity 
          style={styles.heartCircle} 
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <SolarIcon 
            name={isFavorite ? "heart-bold" : "heart-linear"} 
            size={normalize.width(18)} 
            color={isFavorite ? "#EA2129" : "#9CA3AF"} 
          />
        </TouchableOpacity>

        <View style={styles.ratingBox}>
           <SolarIcon name="star-bold" size={normalize.width(16)} color={Colors.secondary} />
           <ThemedText style={styles.ratingText}>{chalet.rating || '4.5'}</ThemedText>
        </View>
      </View>

      {/* 2. المنتصف: العنوان والموقع والسعر */}
      <View style={styles.content}>
        <View style={styles.upperText}>
          <ThemedText style={styles.title} numberOfLines={1}>{chalet.title}</ThemedText>
          <ThemedText style={styles.location} numberOfLines={1}>{chalet.location}</ThemedText>
        </View>
        
        <View style={styles.footerRow}>
           <View style={styles.priceRow}>
              <ThemedText style={styles.price}>IQD {chalet.price}</ThemedText>
              <ThemedText style={styles.priceLabel}> / شفت</ThemedText>
           </View>
        </View>
      </View>

      {/* 3. الطرف الأيمن: الصورة Blob */}
      <View style={styles.imageWrapper}>
        <Svg height={normalize.height(88)} width={normalize.width(98)} viewBox="0 0 140 135">
          <Defs>
            <ClipPath id="clip-blob-final">
              <Path d={BLOB_PATH} />
            </ClipPath>
          </Defs>
          <G clipPath="url(#clip-blob-final)">
            <SvgImage
              href={{ uri: imageUrl }}
              width="140"
              height="135"
              preserveAspectRatio="xMidYMid slice"
            />
          </G>
          <Path d={BLOB_PATH} stroke={borderColor} strokeWidth="6" fill="none" />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: normalize.radius(12),
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(10),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
    marginBottom: normalize.height(12),
    width: '100%',
    height: normalize.height(115),
  },
  leftColumn: {
    width: normalize.width(42),
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  heartCircle: {
    width: normalize.width(36),
    height: normalize.width(36),
    borderRadius: normalize.radius(18),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: normalize.font(14),
    fontWeight: "800",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize.width(8),
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  upperText: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: normalize.font(16),
    fontWeight: "900",
    color: "#111827",
  },
  location: {
    fontSize: normalize.font(12),
    color: "#6B7280",
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  priceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: normalize.font(16),
    fontWeight: "900",
    color: "#111827",
  },
  priceLabel: {
    fontSize: normalize.font(11),
    color: "#6B7280",
  },
  imageWrapper: {
    width: normalize.width(98),
    height: normalize.height(88),
    justifyContent: "center",
    alignItems: "center",
  },
});
