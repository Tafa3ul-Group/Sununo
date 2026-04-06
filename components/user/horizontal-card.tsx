import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Image as SvgImage } from "react-native-svg";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize, Spacing } from "@/constants/theme";
import { SolarIcon } from "../ui/solar-icon";

interface HorizontalCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
}

// السلسلة العضوية (البلوب) من الصورة
const BLOB_PATH = "M77.0459 14.0977C86.8144 5.10784 99.2037 0.386687 110.42 2.50195C121.804 4.64892 131.346 13.705 135.513 30.8994C138.687 44.002 138.736 58.6286 136.25 71.833C133.77 85.0021 128.722 96.9923 121.482 104.651C109.519 117.308 92.5368 124.708 75.1924 126.547C57.8513 128.385 39.9659 124.682 26.1904 114.895C2.53265 98.088 -5.36999 65.526 9.69531 44.0059C15.0767 36.3186 23.5058 33.0498 41.1289 30.5859C50.2739 29.3071 56.0975 28.0172 61.1807 25.6816C66.2509 23.3521 70.7222 19.918 77.0459 14.0977H77.0459Z";

export function HorizontalCard({ chalet, onPress, style }: HorizontalCardProps) {
  if (!chalet) return null;

  const imageUrl = chalet.images?.[0] || chalet.image || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400";
  // مصفوفة الألوان لتغيير إطار الـ Blob
  const borderColors = [Colors.secondary, Colors.primary, Colors.accent];
  const borderColor = chalet.color || borderColors[0];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* 1. Left Side: Heart & Rating */}
      <View style={styles.leftColumn}>
        <View style={styles.heartCircle}>
          {/* القلب برتقالي لعدم استخدام الأحمر */}
          <SolarIcon name="heart-bold" size={18} color={Colors.accent} />
        </View>

        <View style={styles.ratingBox}>
           {/* النجمة الخضراء السداسية كما في الصورة */}
           <SolarIcon name="star-angle-bold" size={20} color={Colors.secondary} />
           <ThemedText style={styles.ratingText}>{chalet.rating || '4.5'}</ThemedText>
        </View>
      </View>

      {/* 2. Middle: Texts */}
      <View style={styles.content}>
        <ThemedText style={styles.title} numberOfLines={1}>{chalet.title || 'شالية'}</ThemedText>
        <ThemedText style={styles.location}>{chalet.location || 'البصرة'}</ThemedText>
        
        <View style={styles.priceRow}>
           <ThemedText style={styles.price}>IQD {chalet.price}</ThemedText>
           <ThemedText style={styles.priceLabel}> / شفت</ThemedText>
        </View>
      </View>

      {/* 3. Right: The Blob Image Area */}
      <View style={styles.imageWrapper}>
        <Svg height={105} width={115} viewBox="0 0 140 135">
          <Defs>
            <ClipPath id="clip-blob">
              <Path d={BLOB_PATH} />
            </ClipPath>
          </Defs>
          <G clipPath="url(#clip-blob)">
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
    flexDirection: "row", // RTL layout by order in row
    backgroundColor: "white",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
    marginBottom: Spacing.md,
    width: '100%',
    height: 115,
  },
  leftColumn: {
    width: 50,
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  heartCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingRight: 10,
    alignItems: 'flex-end', // Align AR texts to right
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  priceLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginRight: 4,
  },
  imageWrapper: {
    width: 115,
    height: 105,
    justifyContent: "center",
    alignItems: "center",
  },
});
