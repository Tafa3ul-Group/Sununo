import { SolarHeartBold, SolarStarBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { useTranslation } from "react-i18next";
import { Colors, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Image as SvgImage,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES_CONFIG = [
  {
    viewBox: "0 0 132 114",
    width: 132,
    height: 114,
    path: "M78.7725 2C93.5962 2.00003 106.408 5.61551 115.473 12.8877C124.473 20.1084 130 31.1096 130 46.416C130 63.2797 118.126 78.4796 102.275 90.1074C86.4772 101.697 67.2293 109.354 53.5078 111.289C39.5004 113.265 27.4662 111.112 18.5918 104.994C9.7592 98.905 3.76485 88.6866 2.18652 73.9004C0.804578 60.9535 7.14433 42.9634 20.3965 28.1426C33.584 13.3941 53.4373 2 78.7725 2Z",
  },
  {
    viewBox: "0 0 114 123",
    width: 114,
    height: 123,
    path: "M9.85254 5.08691C14.303 2.08842 19.387 1.22337 25.6074 2.71387C31.9189 4.22619 39.3773 8.16551 48.3428 14.8115H48.3438C54.6721 19.5016 59.3722 22.5133 64.3926 24.5186C69.4237 26.5281 74.6565 27.4793 81.9785 28.2354C89.7218 29.0339 96.005 30.5378 100.782 32.6768C105.556 34.8141 108.71 37.5308 110.416 40.7041C113.775 46.9529 112.057 56.2142 102.497 69.0352C99.6073 72.9109 97.0067 77.4337 94.4863 82.1016C91.9384 86.8204 89.5052 91.6208 86.8477 96.2988C81.6969 105.366 76.0449 113.313 68.3633 117.591L67.6133 117.993C54.4846 124.782 38.8124 119.692 32.084 106.556L31.7705 105.924C27.2088 96.4439 25.495 86.9985 23.3047 77.1934C21.1955 67.7511 18.6595 58.0937 12.5859 48.4355L11.9873 47.501L11.2256 46.3125C7.41426 40.2506 3.62112 32.4694 2.40234 24.999C1.11592 17.1139 2.71008 9.9001 9.85254 5.08691Z",
  },
  {
    viewBox: "0 0 141 129",
    width: 141,
    height: 129,
    path: "M77.0459 14.0977C86.8144 5.10784 99.2037 0.386687 110.42 2.50195C121.804 4.64892 131.346 13.705 135.513 30.8994C138.687 44.002 138.736 58.6286 136.25 71.833C133.77 85.0021 128.722 96.9923 121.482 104.651C109.519 117.308 92.5368 124.708 75.1924 126.547C57.8513 128.385 39.9659 124.682 26.1904 114.895C2.53265 98.088 -5.36999 65.526 9.69531 44.0059C15.0767 36.3186 23.5058 33.0498 41.1289 30.5859C50.2739 29.3071 56.0975 28.0172 61.1807 25.6816C66.2509 23.3521 70.7222 19.918 77.0449 14.0977H77.0459Z",
  },
  {
    viewBox: "0 0 132 126",
    width: 132,
    height: 126,
    path: "M45.1748 5C48.9809 2.41469 54.6673 0.982912 62.8779 2.84766C70.4802 4.57348 75.4484 9.06905 81.3945 13.4883C87.2987 17.8763 93.9042 21.9016 104.228 21.4062L104.28 21.4043L104.333 21.3984C120.021 19.8142 133.035 33.7153 129.367 47.7393C128.655 50.463 127.55 53.3543 126.367 56.3721C125.202 59.3471 123.956 62.4548 123.058 65.4512C121.307 71.2878 120.589 77.6274 125.296 82.2793C127.44 84.8711 127.477 88.8856 125.707 92.084C123.986 95.1932 120.816 97.0877 116.83 95.8877C111.601 94.3134 107.617 94.271 104.883 96.8135C103.591 98.015 102.787 99.6241 102.217 101.367C101.646 103.112 101.258 105.162 100.908 107.387L100.9 107.436L100.896 107.484C99.755 118.107 88.0985 126.131 76.5039 123.498H76.5049C74.3748 123.014 72.1029 122.076 70.127 120.898C68.1253 119.706 66.5866 118.364 65.7725 117.163C61.1156 110.292 54.8357 108.673 49.4014 108.942C44.1787 109.201 39.4229 111.27 38.0879 111.665C35.0844 112.554 32.9939 112.421 31.54 111.9C30.0969 111.384 29.0576 110.405 28.293 109.181C26.6928 106.617 26.4785 103.251 26.543 102.284C26.8935 97.0298 25.7253 92.917 23.0537 89.542C20.4512 86.2542 16.5664 83.8564 11.8789 81.6816C4.56946 78.219 0.68994 70.5626 2.4043 63.3154L2.49023 62.9707C3.54135 58.9508 6.45448 55.6746 9.89355 53.1914L10.5879 52.7051C12.8209 51.1901 14.7537 49.1186 15.9199 46.3135C17.0847 43.5117 17.4215 40.1308 16.7168 36.0977C16.1566 32.892 16.9632 31.0495 18.1934 29.8545C19.5488 28.5377 21.7224 27.7099 24.3896 27.2539L24.4336 27.2461L24.4775 27.2363C28.5411 26.3545 31.653 25.1675 33.9434 23.1895C36.2879 21.1647 37.5472 18.5108 38.3164 15.1855C39.1493 11.5847 41.3211 7.61766 45.1748 5Z",
  },
];

interface HorizontalCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
  shapeIndex?: number;
  hideFavorite?: boolean;
}

export function HorizontalCard({
  chalet,
  onPress,
  style,
  shapeIndex = 2,
  hideFavorite = false,
}: HorizontalCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isFavorite, setIsFavorite] = useState(false);

  if (!chalet) return null;

  const imageSource = chalet.image || getImageSrc(chalet.images?.[0]?.url || chalet.images?.[0]);
  const borderColor = chalet.color || Colors.secondary;

  const config = SHAPES_CONFIG[shapeIndex % SHAPES_CONFIG.length];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { flexDirection: isRTL ? 'row' : 'row-reverse' }, style]}
    >
      {/* info side */}
      <View style={styles.contentAndLeft}>
        {/* Top Row: Heart + Title/Location */}
        <View style={[styles.topRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <View style={styles.leftColumn}>
            {!hideFavorite && (
              <TouchableOpacity
                style={styles.heartCircle}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <SolarHeartBold
                  size={normalize.width(20)}
                  color={isFavorite ? "#EA2129" : "#9CA3AF"}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mainContent}>
            <View style={[styles.upperText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <ThemedText style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {typeof chalet.title === 'object' ? (isRTL ? chalet.title.ar : chalet.title.en) : chalet.title}
              </ThemedText>
              <ThemedText style={[styles.location, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {typeof chalet.location === 'object' ? (isRTL ? chalet.location.ar : chalet.location.en) : chalet.location}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Bottom Row: Rating + Price */}
        <View style={[styles.bottomRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
          <View style={[styles.ratingBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SolarStarBold size={normalize.width(16)} color={Colors.secondary} />
            <ThemedText style={styles.ratingText}>
              {chalet.rating || "4.5"}
            </ThemedText>
          </View>

          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <ThemedText style={styles.price}>{isRTL ? '' : 'IQD '}{chalet.price}{isRTL ? ' د.ع' : ''}</ThemedText>
            <ThemedText style={styles.priceLabel}> / {isRTL ? "شفت" : "Shift"}</ThemedText>
          </View>
        </View>
      </View>

      {/* Image side */}
      <View style={styles.imageWrapper}>
        <Svg
          height={normalize.height(88)}
          width={normalize.width(98)}
          viewBox={config.viewBox}
        >
          <Defs>
            <ClipPath id={`clip-blob-${shapeIndex}`}>
              <Path d={config.path} />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#clip-blob-${shapeIndex})`}>
            <SvgImage
              href={imageSource}
              width={config.width}
              height={config.height}
              preserveAspectRatio="xMidYMid slice"
            />
          </G>
          <Path
            d={config.path}
            stroke={borderColor}
            strokeWidth="6"
            fill="none"
          />
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
    height: normalize.height(115),
  },
  contentAndLeft: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftColumn: {
    width: normalize.width(42),
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 4,
  },
  heartCircle: {
    width: normalize.width(36),
    height: normalize.width(36),
    borderRadius: normalize.radius(18),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: normalize.width(6), // لضبط موضع النجمة تحت القلب
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  upperText: {
    marginTop: 4,
  },
  title: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  location: {
    fontSize: normalize.font(12),
    color: "#6B7280",
    marginTop: 2,
   fontFamily: "LamaSans-Regular" },
  priceRow: {
    alignItems: "center",
    gap: 4,
  },
  price: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  priceLabel: {
    fontSize: normalize.font(11),
    color: "#6B7280",
   fontFamily: "LamaSans-Regular" },
  imageWrapper: {
    width: normalize.width(98),
    height: normalize.height(88),
    justifyContent: "center",
    alignItems: "center",
  },
});
