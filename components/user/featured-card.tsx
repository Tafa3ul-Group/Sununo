import { DiscountBadge, DiscountedFrom } from "@/components/discount-badge";
import { SolarHeartBold, SolarHeartLinear } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { IMAGE_TRANSITION, imagePlaceholder } from "@/constants/image-loading";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useDirection } from "@/i18n";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { getStartingPrice } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";


export const FEATURED_CARD_WIDTH = normalize.width(152);
/** Portrait photo card — the height follows the width so the grid on
 *  /featured (48% columns) gets the same proportions as the home strip. */
export const FEATURED_CARD_RATIO = 0.74;

interface FeaturedCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
  hideFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * Featured card: one full-bleed photo with a dark gradient scrim, the label
 * badge and favorite heart floating on the top corners, and the name, location
 * and price sitting ON the photo at the bottom.
 * Used in the home "مميّزة" strip (see FeaturedSwiper) and the /featured grid —
 * distinct from the shared HorizontalCard so the rest of the app is untouched.
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

  const pick = (value: any) =>
    typeof value === "object" && value !== null
      ? (isArabic ? value.ar : value.en) || value.ar || value.en
      : value;

  const title = pick(chalet.title ?? chalet.name);
  // The subtitle line under the name — the city/area the list screens already
  // resolve for us. Absent on payloads that don't carry it, and then the name
  // simply sits directly above the price.
  const subtitle = pick(chalet.location ?? chalet.city);

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
      <ExpoImage
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={imagePlaceholder(chalet.blurhash ?? chalet.images?.[0]?.blurhash)}
        transition={IMAGE_TRANSITION}
      />

      {/* Progressive blur behind the caption: ONE blur, faded in by an alpha
          mask so it has no edge at all. Stacking several blur bands instead
          (the obvious approach) draws a visible horizontal seam at every band
          boundary — the gradient here is only the mask, never painted. */}
      <MaskedView
        style={styles.blurArea}
        pointerEvents="none"
        maskElement={
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.45)", "#000"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView
          intensity={55}
          tint="dark"
          // Android < 12 has no native blur; this is the supported fallback.
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>

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
            onPress={handleToggleFavorite}
            hitSlop={10}
          >
            {isFavorite ? (
              <SolarHeartBold size={normalize.width(20)} color="#EA2129" />
            ) : (
              <SolarHeartLinear size={normalize.width(20)} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Name + location + price, laid over the bottom of the photo and aligned
          to the start side (right in RTL). */}
      <View style={styles.textBlock}>
        <ThemedText style={[styles.title, { textAlign }]} numberOfLines={1}>
          {title}
        </ThemedText>

        {!!subtitle && (
          <ThemedText style={[styles.subtitle, { textAlign }]} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        )}

        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { textAlign }]} numberOfLines={1}>
            {isArabic ? "" : "IQD "}
            {displayPrice}
            {isArabic ? " د.ع" : ""}
          </ThemedText>
          {/* Null on chalets with no campaign, so nothing changes for them. */}
          <DiscountBadge discount={chalet?.discount} size="sm" />
        </View>
        {/* `onDark` keeps the struck-through figure legible on the scrim. */}
        <DiscountedFrom discount={chalet?.discount} size="sm" tone="onDark" />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: FEATURED_CARD_WIDTH,
    aspectRatio: FEATURED_CARD_RATIO,
    borderRadius: normalize.radius(18),
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    justifyContent: "space-between",
  },
  blurArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // Tall enough that the mask's soft top edge lands well above the caption.
    height: "58%",
  },
  specialBadge: {
    width: normalize.width(32),
    height: normalize.width(32),
  },
  overlayRow: {
    // Symmetric corner inset — the same scale on both axes, since
    // height/verticalScale inflates on tall devices.
    paddingTop: normalize.width(8),
    // The Special badge carries its own transparent margin, so its side is
    // tightened. Logical edges so the row mirrors in RTL.
    paddingStart: normalize.width(4),
    paddingEnd: normalize.width(10),
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  textBlock: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: normalize.width(10),
    paddingBottom: normalize.width(10),
    gap: normalize.height(1),
  },
  featuredBadge: {
    // Overlaid on the photo's start corner. `overlayRow.paddingStart` is
    // tightened to 4 for the Special PNG; a text chip has no built-in margin,
    // so it takes the missing inset back here.
    marginStart: normalize.width(4),
    // Never let a long label crowd out the favorite heart on the other corner.
    maxWidth: FEATURED_CARD_WIDTH - normalize.width(52),
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
    fontSize: normalize.font(15),
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: normalize.font(11),
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.82)",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(6),
    marginTop: normalize.height(3),
  },
  price: {
    fontSize: normalize.font(14),
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});
