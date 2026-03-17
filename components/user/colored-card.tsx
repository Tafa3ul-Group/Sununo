import { ThemedText } from "@/components/themed-text";
import { normalize } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Image as SvgImage,
} from "react-native-svg";

// Fixed dimensions requested by user
const CARD_WIDTH = normalize.width(175);
const CARD_HEIGHT = normalize.height(240);

/**
 * Shapes configuration extracted EXACTLY from assets/card/shaps/
 * Using numeric props for Svg components to avoid "Invalid Number" errors.
 */
const SHAPES_CONFIG = [
  {
    viewBox: "0 0 126 127",
    width: 126,
    height: 127,
    path: "M34.8452 3.37793C47.4536 -0.969519 59.8485 5.6061 70.7515 14.5371C76.2636 19.0523 81.5555 24.3026 86.4888 29.3711C91.4551 34.4736 96.0141 39.3447 100.182 43.252L101.406 44.4072C114.105 56.4873 128.316 73.0314 122.769 95.8252C119.561 109.016 110.458 118.618 99.9595 122.754C89.6046 126.833 77.7851 125.606 69.1294 117.116L68.7202 116.706C62.9134 110.784 59.3948 108.286 55.8491 107.932C52.2709 107.574 48.103 109.336 40.7905 113.954C32.679 119.077 25.9757 121.729 20.1802 121.129C14.1715 120.506 9.75334 116.484 6.04639 109.938V109.938C0.000853215 99.267 1.38281 86.6348 5.91455 76.1641C10.9141 64.6115 13.3538 58.9257 14.7456 53.7314C16.1253 48.5824 16.4818 43.8901 17.1616 34.2451C17.8071 25.0952 19.1489 18.3975 21.9175 13.4639C24.7578 8.40264 28.9784 5.40067 34.8452 3.37793Z",
    stroke: "#035DF9",
  },
  {
    viewBox: "0 0 132 114",
    width: 132,
    height: 114,
    path: "M78.7725 2C93.5962 2.00003 106.408 5.61551 115.473 12.8877C124.473 20.1084 130 31.1096 130 46.416C130 63.2797 118.126 78.4796 102.275 90.1074C86.4772 101.697 67.2293 109.354 53.5078 111.289C39.5004 113.265 27.4662 111.112 18.5918 104.994C9.7592 98.905 3.76485 88.6866 2.18652 73.9004C0.804578 60.9535 7.14433 42.9634 20.3965 28.1426C33.584 13.3941 53.4373 2 78.7725 2Z",
    stroke: "#FF7E4F",
  },
  {
    viewBox: "0 0 114 123",
    width: 114,
    height: 123,
    path: "M9.85254 5.08691C14.303 2.08842 19.387 1.22337 25.6074 2.71387C31.9189 4.22619 39.3773 8.16551 48.3428 14.8115H48.3438C54.6721 19.5016 59.3722 22.5133 64.3926 24.5186C69.4237 26.5281 74.6565 27.4793 81.9785 28.2354C89.7218 29.0339 96.005 30.5378 100.782 32.6768C105.556 34.8141 108.71 37.5308 110.416 40.7041C113.775 46.9529 112.057 56.2142 102.497 69.0352C99.6073 72.9109 97.0067 77.4337 94.4863 82.1016C91.9384 86.8204 89.5052 91.6208 86.8477 96.2988C81.6969 105.366 76.0449 113.313 68.3633 117.591L67.6133 117.993C54.4846 124.782 38.8124 119.692 32.084 106.556L31.7705 105.924C27.2088 96.4439 25.495 86.9985 23.3047 77.1934C21.1955 67.7511 18.6595 58.0937 12.5859 48.4355L11.9873 47.501L11.2256 46.3125C7.41426 40.2506 3.62112 32.4694 2.40234 24.999C1.11592 17.1139 2.71008 9.9001 9.85254 5.08691Z",
    stroke: "#EA2129",
  },
  {
    viewBox: "0 0 141 129",
    width: 141,
    height: 129,
    path: "M77.0459 14.0977C86.8144 5.10784 99.2037 0.386687 110.42 2.50195C121.804 4.64892 131.346 13.705 135.513 30.8994C138.687 44.002 138.736 58.6286 136.25 71.833C133.77 85.0021 128.722 96.9923 121.482 104.651C109.519 117.308 92.5368 124.708 75.1924 126.547C57.8513 128.385 39.9659 124.682 26.1904 114.895C2.53265 98.088 -5.36999 65.526 9.69531 44.0059C15.0767 36.3186 23.5058 33.0498 41.1289 30.5859C50.2739 29.3071 56.0975 28.0172 61.1807 25.6816C66.2509 23.3521 70.7222 19.918 77.0449 14.0977H77.0459Z",
    stroke: "#EF79D7",
  },
  {
    viewBox: "0 0 132 126",
    width: 132,
    height: 126,
    path: "M45.1748 5C48.9809 2.41469 54.6673 0.982912 62.8779 2.84766C70.4802 4.57348 75.4484 9.06905 81.3945 13.4883C87.2987 17.8763 93.9042 21.9016 104.228 21.4062L104.28 21.4043L104.333 21.3984C120.021 19.8142 133.035 33.7153 129.367 47.7393C128.655 50.463 127.55 53.3543 126.367 56.3721C125.202 59.3471 123.956 62.4548 123.058 65.4512C121.307 71.2878 120.589 77.6274 125.296 82.2793C127.44 84.8711 127.477 88.8856 125.707 92.084C123.986 95.1932 120.816 97.0877 116.83 95.8877C111.601 94.3134 107.617 94.271 104.883 96.8135C103.591 98.015 102.787 99.6241 102.217 101.367C101.646 103.112 101.258 105.162 100.908 107.387L100.9 107.436L100.896 107.484C99.755 118.107 88.0985 126.131 76.5039 123.498H76.5049C74.3748 123.014 72.1029 122.076 70.127 120.898C68.1253 119.706 66.5866 118.364 65.7725 117.163C61.1156 110.292 54.8357 108.673 49.4014 108.942C44.1787 109.201 39.4229 111.27 38.0879 111.665C35.0844 112.554 32.9939 112.421 31.54 111.9C30.0969 111.384 29.0576 110.405 28.293 109.181C26.6928 106.617 26.4785 103.251 26.543 102.284C26.8935 97.0298 25.7253 92.917 23.0537 89.542C20.4512 86.2542 16.5664 83.8564 11.8789 81.6816C4.56946 78.219 0.68994 70.5626 2.4043 63.3154L2.49023 62.9707C3.54135 58.9508 6.45448 55.6746 9.89355 53.1914L10.5879 52.7051C12.8209 51.1901 14.7537 49.1186 15.9199 46.3135C17.0847 43.5117 17.4215 40.1308 16.7168 36.0977C16.1566 32.892 16.9632 31.0495 18.1934 29.8545C19.5488 28.5377 21.7224 27.7099 24.3896 27.2539L24.4336 27.2461L24.4775 27.2363C28.5411 26.3545 31.653 25.1675 33.9434 23.1895C36.2879 21.1647 37.5472 18.5108 38.3164 15.1855C39.1493 11.5847 41.3211 7.61766 45.1748 5Z",
    stroke: "#15AB64",
  },
];

interface ColoredCardProps {
  title: string;
  location: string;
  price: string;
  rating: number;
  image: string;
  color: string;
  shapeIndex?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ColoredCard({
  title,
  location,
  price,
  rating,
  image,
  color,
  shapeIndex = 0,
  onPress,
  style,
}: ColoredCardProps) {
  const currentIndex = shapeIndex % SHAPES_CONFIG.length;
  const config = SHAPES_CONFIG[currentIndex];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { backgroundColor: color }, style]}
    >
      {/* Favorite Button */}
      <View style={styles.favoriteButton}>
        <View style={styles.favoriteCircle}>
          <Ionicons name="heart" size={12} color="#EA2129" />
        </View>
      </View>

      {/* Organic Shape Section */}
      <View style={styles.imageContainer}>
        <Svg
          height={normalize.height(130)}
          width={normalize.width(140)}
          viewBox={config.viewBox}
        >
          <Defs>
            <ClipPath id={`clip-card-${currentIndex}`}>
              <Path d={config.path} />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#clip-card-${currentIndex})`}>
            <SvgImage
              href={{ uri: image }}
              width={config.width}
              height={config.height}
              preserveAspectRatio="xMidYMid slice"
            />
          </G>
          <Path
            d={config.path}
            stroke={config.stroke}
            strokeWidth={5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Content Section - Figma Typography Implementation */}
      <View style={styles.content}>
        <View style={styles.titleWrapper}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>

        <View style={styles.locationWrapper}>
          <ThemedText style={styles.location} numberOfLines={1}>
            {location}
          </ThemedText>
        </View>

        <View style={styles.footer}>
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={10} color="#FFFFFF" />
            <ThemedText style={styles.ratingText}>{rating}</ThemedText>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <ThemedText style={styles.price} numberOfLines={1}>
              {price} <ThemedText style={styles.priceUnit}>/ شفت</ThemedText>
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    padding: 12,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  favoriteCircle: {
    width: normalize.width(24),
    height: normalize.width(24),
    borderRadius: normalize.radius(12),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: normalize.height(130),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize.height(8),
  },
  content: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: normalize.height(2),
  },
  titleWrapper: {
    width: normalize.width(115),
    height: normalize.height(24),
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  title: {
    fontSize: normalize.font(14),
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "right",
    lineHeight: normalize.height(24),
  },
  locationWrapper: {
    width: normalize.width(132),
    height: normalize.height(24),
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  location: {
    fontSize: normalize.font(12),
    fontWeight: "400", // Not bold
    color: "#FFFFFF",
    textAlign: "right",
    lineHeight: normalize.height(24),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Align everything to the right edge
    alignItems: "center",
    gap: normalize.width(26), // Specific gap requested
    width: "100%",
    height: normalize.height(24),
    marginTop: normalize.height(4),
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(4),
  },
  ratingText: {
    color: "white",
    fontWeight: "900", // Bold
    fontSize: normalize.font(12),
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    color: "white",
    fontWeight: "900",
    fontSize: normalize.font(12),
    textAlign: "right",
  },
  priceUnit: {
    fontSize: normalize.font(8),
    color: "white",
    fontWeight: "900", // Bold
    opacity: 0.9,
  },
});
