import { SolarHeartBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { DiscountBadge, DiscountedFrom } from "@/components/discount-badge";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { getStartingPrice } from "@/utils/format";
import { useDirection } from "@/i18n";
import { Image as ExpoImage } from "expo-image";
import { IMAGE_TRANSITION, imagePlaceholder } from "@/constants/image-loading";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";


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
  const { isRTL, direction, textAlign } = useDirection();
  const isArabic = isRTL;

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

  // With a campaign running the card leads with what the customer will actually
  // pay, and DiscountedFrom shows the pre-discount figure struck through beside
  // it. Without one, `priceAfter` is absent and this is the ordinary price.
  const displayPrice =
    chalet?.discount?.priceAfter != null
      ? Number(chalet.discount.priceAfter).toLocaleString()
      : resolvedPrice;

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

  // Resolved server-side (platform default merged with any per-chalet override);
  // absent for anything that is not in the curated featured strip.
  const featuredLabel = chalet.featuredLabel;
  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleFavorite?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { direction }, style]}
    >
      {/* Image with overlaid badge + heart */}
      <View style={styles.imageWrapper}>
        <ExpoImage
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          placeholder={imagePlaceholder(chalet.blurhash ?? chalet.images?.[0]?.blurhash)}
          transition={IMAGE_TRANSITION}
        />

        <View style={[styles.overlayRow, { flexDirection: "row" }]}>
          {/* Start corner (right in RTL): the dashboard-configured label when
              there is one, otherwise the static Special badge. Text and both
              colours come from the data (a platform default, optionally
              overridden per chalet), never from the theme. */}
          {featuredLabel?.enabled !== false && featuredLabel?.name ? (
            <View
              style={[
                styles.featuredBadge,
                { backgroundColor: featuredLabel.backgroundColor || Colors.primary },
              ]}
            >
              <ThemedText
                style={[styles.featuredBadgeText, { color: featuredLabel.textColor || "#FFFFFF" }]}
                numberOfLines={1}
              >
                {(isArabic ? featuredLabel.name.ar : featuredLabel.name.en) ||
                  featuredLabel.name.ar ||
                  featuredLabel.name.en}
              </ThemedText>
            </View>
          ) : (
            <ExpoImage
              source={require("@/assets/shapes/Special.png")}
              style={styles.specialBadge}
              contentFit="contain"
            />
          )}

          {!hideFavorite && (
            <TouchableOpacity
              style={styles.heartCircle}
              onPress={handleToggleFavorite}
              hitSlop={8}
            >
              <SolarHeartBold
                size={normalize.width(18)}
                color={isFavorite ? "#EA2129" : "#FFFFFF"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Name + price — aligned to the start side (right in RTL) */}
      <View style={[styles.textBlock, { alignItems: "flex-start" }]}>
        <ThemedText
          style={[styles.title, { textAlign }]}
          numberOfLines={1}
        >
          {title}
        </ThemedText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ThemedText
            style={[styles.price, { textAlign }]}
            numberOfLines={1}
          >
            {isArabic ? "" : "IQD "}
            {displayPrice}
            {isArabic ? " د.ع" : ""}
          </ThemedText>
          {/* Null on chalets with no campaign, so nothing changes for them. */}
          <DiscountBadge discount={chalet?.discount} size="sm" />
        </View>
        <DiscountedFrom discount={chalet?.discount} size="sm" />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: FEATURED_CARD_WIDTH,
  },
  specialBadge: {
    width: normalize.width(32),
    height: normalize.width(32),
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
    // Use the SAME scale as the sides so the corner inset is symmetric.
    // (height/verticalScale inflates on tall devices, which created the big
    // top gap.)
    top: normalize.width(6),
    // The Special badge sits on the start corner; tighten that side and keep
    // the favorite (the other side) at its normal inset. Logical edges so the
    // container mirrors them in RTL.
    start: normalize.width(2),
    end: normalize.width(6),
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
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#111827",
  },
  heartCircle: {
    width: normalize.width(26),
    height: normalize.width(26),
    borderRadius: normalize.radius(13),
    alignItems: "center",
    justifyContent: "center",
    // Small soft backdrop so the white heart reads on bright photos.
    backgroundColor: "rgba(17,24,39,0.28)",
  },
  textBlock: {
    width: "100%",
    marginTop: normalize.height(6),
  },
  featuredBadge: {
    // Overlaid on the photo's start corner. `overlayRow.start` is tightened to
    // 2 for the Special PNG (which carries its own transparent margin); a text
    // chip has none, so it takes the missing inset back here.
    marginStart: normalize.width(4),
    // Never let a long label crowd out the favorite heart on the other corner.
    maxWidth: FEATURED_CARD_WIDTH - normalize.width(46),
    paddingHorizontal: normalize.width(7),
    paddingVertical: normalize.height(3),
    borderRadius: 999,
  },
  featuredBadgeText: {
    fontSize: normalize.font(9),
    fontFamily: Fonts.bold,
    lineHeight: normalize.font(13),
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
