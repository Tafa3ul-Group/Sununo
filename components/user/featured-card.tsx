import { SolarHeartBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Fonts, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { getStartingPrice } from "@/utils/format";
import { useDirection } from "@/i18n";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  I18nManager,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const FEATURED_CARD_WIDTH = normalize.width(140);

interface FeaturedCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
  hideFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * Airbnb-style featured card: a large image on top with a "مميّز" badge and a
 * favorite heart overlaid, then the title and a price · rating line below.
 * Used only in the home "مميّزة" strip (see FeaturedSwiper) — distinct from the
 * shared HorizontalCard so the rest of the app is untouched.
 */
export const FeaturedCard = React.memo(function FeaturedCard({
  chalet,
  onPress,
  style,
  hideFavorite = false,
  isFavorite = false,
  onToggleFavorite,
}: FeaturedCardProps) {
  const { isRTL, rowDirection, textAlign } = useDirection();
  const isArabic = isRTL;
  const textStart = textAlign;
  const rowDir = rowDirection;
  // Cross-axis alignment must be expressed in the NATIVE layout coordinate
  // system: when the manager's RTL already matches the content, flex-start is
  // the start (right in RTL); only counteract when they differ. Mirrors the
  // proven HorizontalCard logic.
  const needsCounter = isRTL !== I18nManager.isRTL;
  const alignStart: "flex-start" | "flex-end" = needsCounter
    ? "flex-end"
    : "flex-start";

  // The featured endpoint, like the list endpoints, doesn't include shift
  // pricing, so when a real price isn't already provided we fetch the chalet's
  // shifts via the details route and show the lowest active shift price.
  const hasPrice =
    (chalet?.startingPrice != null && Number(chalet.startingPrice) > 0) ||
    (chalet?.price != null &&
      Number(String(chalet.price).replace(/,/g, "")) > 0);
  const { fetchedPrice } = useGetCustomerChaletDetailsQuery(chalet?.id, {
    skip: !chalet?.id || hasPrice,
    selectFromResult: ({ data }) => {
      const detail = (data as any)?.data ?? data;
      return { fetchedPrice: detail ? getStartingPrice(detail) : undefined };
    },
  });
  const resolvedPrice = hasPrice
    ? chalet?.price
    : fetchedPrice ?? chalet?.price ?? "0";

  const cardScale = useSharedValue(1);
  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  const heartScale = useSharedValue(1);
  const heartAnim = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!chalet) return null;

  const imageSource =
    typeof chalet.image === "string" && !chalet.image.startsWith("http")
      ? getImageSrc(chalet.image)
      : chalet.image ||
        getImageSrc(chalet.images?.[0]?.url || chalet.images?.[0]);

  const title =
    typeof chalet.title === "object"
      ? isArabic
        ? chalet.title.ar
        : chalet.title.en
      : chalet.title;
  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    heartScale.value = withSequence(
      withTiming(1.35, { duration: 130 }),
      withSpring(1, { damping: 7, stiffness: 200 }),
    );
    onToggleFavorite?.();
  };

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={() => {
        cardScale.value = withTiming(0.97, { duration: 90 });
      }}
      onPressOut={() => {
        cardScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      }}
      style={[styles.container, style, cardAnim]}
    >
      {/* Image with overlaid badge + heart */}
      <View style={styles.imageWrapper}>
        <ExpoImage
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        <View style={[styles.overlayRow, { flexDirection: rowDir }]}>
          {/* "Special" badge on the start corner (right in RTL), top-aligned */}
          <ExpoImage
            source={require("@/assets/shapes/Special.png")}
            style={styles.specialBadge}
            contentFit="contain"
          />

          {!hideFavorite && (
            <TouchableOpacity
              style={styles.heartCircle}
              onPress={handleToggleFavorite}
              hitSlop={8}
            >
              <Animated.View style={heartAnim}>
                <SolarHeartBold
                  size={normalize.width(18)}
                  color={isFavorite ? "#EA2129" : "#FFFFFF"}
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Name + price — aligned to the start side (right in RTL) */}
      <View style={[styles.textBlock, { alignItems: alignStart }]}>
        <ThemedText
          style={[styles.title, { textAlign: textStart }]}
          numberOfLines={1}
        >
          {title}
        </ThemedText>

        <ThemedText
          style={[styles.price, { textAlign: textStart }]}
          numberOfLines={1}
        >
          {isArabic ? "" : "IQD "}
          {resolvedPrice}
          {isArabic ? " د.ع" : ""}
        </ThemedText>
      </View>
    </AnimatedTouchable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: FEATURED_CARD_WIDTH,
  },
  specialBadge: {
    width: normalize.width(44),
    height: normalize.width(44),
  },
  imageWrapper: {
    width: "100%",
    height: normalize.width(130),
    borderRadius: normalize.radius(16),
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayRow: {
    position: "absolute",
    top: normalize.height(8),
    left: normalize.width(10),
    right: normalize.width(10),
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: normalize.width(10),
    paddingVertical: normalize.height(5),
    borderRadius: normalize.radius(20),
  },
  badgeText: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  heartCircle: {
    width: normalize.width(30),
    height: normalize.width(30),
    borderRadius: normalize.radius(15),
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    width: "100%",
    marginTop: normalize.height(6),
  },
  title: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.semiBold,
    color: "#111827",
  },
  price: {
    fontSize: normalize.font(10),
    fontFamily: Fonts.regular,
    color: "#6B7280",
    marginTop: normalize.height(2),
  },
});
