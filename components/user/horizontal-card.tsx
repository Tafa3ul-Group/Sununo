import { AmenityBlob } from "@/components/amenity-blob";
import { DiscountBadge } from "@/components/discount-badge";
import {
  SolarHeartBold,
  SolarHeartLinear,
  SparkleStarBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { pickTranslation, useDirection } from "@/i18n";
import { Image as ExpoImage } from "expo-image";
import { IMAGE_TRANSITION, imagePlaceholder } from "@/constants/image-loading";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";


// The card only has room for a couple of amenities before the line wraps.
const MAX_AMENITIES = 2;

// Everything on the card is proportioned against this: the image is a square of
// the same size, and the favourite sits ~30% of the way down.
const CARD_HEIGHT = normalize.height(86);

interface HorizontalCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
  shapeIndex?: number;
  hideFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const HorizontalCard = React.memo(function HorizontalCard({
  chalet,
  onPress,
  style,
  shapeIndex = 2,
  hideFavorite = false,
  isFavorite = false,
  onToggleFavorite }: HorizontalCardProps) {
  const { isRTL, textAlign } = useDirection();
  const isArabic = isRTL;

  // transforms — no layout/design change, just makes taps feel alive.

  // `features` is the trimmed list the card endpoints attach; the other two are
  // the full shapes returned by the detail route, so a chalet coming from either
  // source renders the same row.
  const amenities: any[] = React.useMemo(() => {
    const raw =
      chalet?.features ?? chalet?.chaletFeatures ?? chalet?.amenities ?? [];
    if (!Array.isArray(raw)) return [];
    return raw
      .slice(0, MAX_AMENITIES)
      .map((item: any) => {
        const feature = item?.feature ?? item;
        return {
          label: pickTranslation(feature, isArabic),
          icon: feature?.icon ?? null,
        };
      })
      .filter((a: any) => !!a.label);
  }, [chalet?.features, chalet?.chaletFeatures, chalet?.amenities, isArabic]);

  if (!chalet) return null;

  const imageSource =
    typeof chalet.image === "string" && !chalet.image.startsWith("http")
      ? getImageSrc(chalet.image)
      : chalet.image ||
        getImageSrc(chalet.images?.[0]?.url || chalet.images?.[0]);

  // Present only on chalets from the admin-curated featured strip; every other
  // caller passes nothing and the badge simply does not render.
  const featuredLabel = chalet.featuredLabel;

  // With a campaign running the card leads with what the customer will actually
  // pay; without one, `priceAfter` is absent and this is the ordinary "starts
  // from" price the caller already resolved.
  const basePrice = chalet.price ?? chalet.startingPrice;
  const displayPrice =
    chalet.discount?.priceAfter != null
      ? Number(chalet.discount.priceAfter).toLocaleString()
      : basePrice;
  // Prices arrive already grouped ("75,000"), so strip the separators before
  // judging them. A chalet whose shifts carry no price yet resolves to 0, and
  // "starts from 0" is worse than saying nothing — the row is dropped instead.
  const hasPrice =
    Number(String(displayPrice ?? "").replace(/,/g, "")) > 0;

  // The list endpoints return `rating`; some payloads call it `averageRating`.
  const rating = Number(chalet.rating ?? chalet.averageRating ?? 0);

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleFavorite?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Image leads the row (logical start = right in Arabic, left in English)
          and is flush with the card on all four sides: the edge facing the text
          is square, and the outer corners simply take the card's own radius
          from the container's clipping. */}
      <ExpoImage
        source={imageSource}
        style={styles.image}
        contentFit="cover"
        placeholder={imagePlaceholder(chalet.blurhash ?? chalet.images?.[0]?.blurhash)}
        transition={IMAGE_TRANSITION}
      />

      {/* Text block */}
      <View style={styles.content}>
        {/* Featured badge. Text and both colours are configured per platform
            (and optionally overridden per chalet) in the dashboard, so they are
            applied from the data, not themed. */}
        {featuredLabel?.enabled !== false && featuredLabel?.name && (
          <View
            style={[
              styles.featuredBadge,
              { backgroundColor: featuredLabel.backgroundColor || Colors.primary },
            ]}
          >
            <ThemedText
              style={[
                styles.featuredBadgeText,
                { color: featuredLabel.textColor || "#FFFFFF" },
              ]}
              numberOfLines={1}
            >
              {(isArabic ? featuredLabel.name.ar : featuredLabel.name.en) ||
                featuredLabel.name.ar ||
                featuredLabel.name.en}
            </ThemedText>
          </View>
        )}

        {/* Title + rating on one line, the rating trailing the name. */}
        <View style={styles.titleRow}>
          <ThemedText
            style={[styles.title, { textAlign }]}
            numberOfLines={1}
          >
            {typeof chalet.title === "object"
              ? isArabic
                ? chalet.title.ar
                : chalet.title.en
              : chalet.title}
          </ThemedText>
          <ThemedText style={styles.ratingText}>
            {rating.toFixed(1)}
          </ThemedText>
          <SparkleStarBold size={normalize.font(15)} color="#EF79D7" />

          {/* Pushed to the far (trailing) edge, but kept in this row so it stays
              level with the title whether or not the amenity line renders. */}
          <View style={styles.spacer} />
          {!hideFavorite && (
            <TouchableOpacity
              style={styles.heartCircle}
              onPress={handleToggleFavorite}
              // The circle is deliberately small, so the tap area is widened to
              // the 44pt minimum instead of the drawn size.
              hitSlop={12}
            >
              {isFavorite ? (
                <SolarHeartBold size={normalize.font(14)} color="#EA2129" />
              ) : (
                <SolarHeartLinear size={normalize.font(14)} color="#F4623A" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Price leads the line, under the title on the reading edge; the
            location trails it, so the card keeps three rows at this height. */}
        <View style={styles.locationRow}>
          {hasPrice && (
            <>
              <ThemedText style={styles.priceLabel}>
                {isArabic ? "يبدأ من" : "From"}
              </ThemedText>
              <ThemedText style={styles.price} numberOfLines={1}>
                {isArabic ? `${displayPrice} د.ع` : `IQD ${displayPrice}`}
              </ThemedText>
              {/* Null on chalets with no campaign, so nothing changes for them. */}
              <DiscountBadge discount={chalet?.discount} size="sm" />
              <View style={styles.spacer} />
            </>
          )}

          <ThemedText
            style={[styles.location, { textAlign }]}
            numberOfLines={1}
          >
            {typeof chalet.location === "object"
              ? isArabic
                ? chalet.location.ar
                : chalet.location.en
              : chalet.location}
          </ThemedText>
        </View>

        {/* "Comes with: wifi, garage" — dropped entirely when the payload
            carries no amenities, so the card never shows a dangling label. */}
        {amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            <ThemedText style={styles.amenitiesLabel}>
              {isArabic ? "يحتوي على:" : "Comes with:"}
            </ThemedText>
            {amenities.map((amenity, i) => (
              <View key={`${amenity.label}-${i}`} style={styles.amenityItem}>
                <AmenityBlob
                  icon={amenity.icon}
                  index={shapeIndex + i}
                  size={normalize.font(18)}
                />
                <ThemedText style={styles.amenityLabel} numberOfLines={1}>
                  {amenity.label}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "white",
    borderRadius: normalize.radius(14),
    overflow: "hidden",
    marginBottom: normalize.height(12),
    height: CARD_HEIGHT,
    // Hairline outline so the white card still reads as a card on a white
    // background, with a soft lift on top of it.
    borderWidth: 1,
    borderColor: "#ECEDF0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2 },
  image: {
    width: CARD_HEIGHT,
    height: "100%" },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: normalize.width(14),
    gap: normalize.height(5) },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(6) },
  title: {
    flexShrink: 1,
    fontSize: normalize.font(14),
    fontFamily: Fonts.bold,
    color: "#111827" },
  ratingText: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.semiBold,
    color: "#111827" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(4) },
  location: {
    flexShrink: 1,
    fontSize: normalize.font(11),
    color: "#6B7280",
    fontFamily: Fonts.regular },
  priceLabel: {
    fontSize: normalize.font(9),
    color: "#6B7280",
    fontFamily: Fonts.regular },
  price: {
    fontSize: normalize.font(12),
    color: "#111827",
    fontFamily: Fonts.bold },
  amenitiesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(6) },
  amenitiesLabel: {
    fontSize: normalize.font(10),
    color: "#6B7280",
    fontFamily: Fonts.regular },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(3),
    flexShrink: 1 },
  amenityLabel: {
    fontSize: normalize.font(11),
    color: "#111827",
    fontFamily: Fonts.medium,
    flexShrink: 1 },
  featuredBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999 },
  featuredBadgeText: {
    fontSize: normalize.font(8),
    fontFamily: Fonts.bold,
    lineHeight: normalize.font(11) },
  // Eats the leftover width of the title row so the favourite lands on the
  // card's trailing edge.
  spacer: {
    flex: 1 },
  heartCircle: {
    width: normalize.width(26),
    height: normalize.width(26),
    borderRadius: normalize.radius(13),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#E5E7EB" } });
