import {
  SolarCloseBold,
  SolarHeartBold,
  SolarHeartLinear,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { IMAGE_TRANSITION, imagePlaceholder } from "@/constants/image-loading";
import { useDirection } from "@/i18n";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
// Gesture-handler's FlatList, not React Native's: this card lives inside a
// gorhom bottom sheet, whose pan gesture swallows a plain nested scroller — the
// photos simply would not swipe. The gesture-handler one negotiates with it.
import { FlatList } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Side inset for the card. Exported so the list that holds it stays in step. */
export const MAP_RESULT_CARD_INSET = 24;
const CARD_WIDTH = SCREEN_WIDTH - MAP_RESULT_CARD_INSET * 2;

/**
 * The listing card used in the map's results sheet: a large photo the guest can
 * swipe through, then name, place, what the chalet holds, and the price.
 *
 * Deliberately taller and photo-led — unlike the compact row card used in lists,
 * here the photo is what makes someone stop scrolling.
 */
export function MapResultCard({
  chalet,
  onPress,
  isFavorite = false,
  onToggleFavorite,
  onClose,
  compact = false,
}: {
  chalet: any;
  onPress?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** Shows an X beside the heart — used by the map's floating preview. */
  onClose?: () => void;
  /** Shorter photo, for the preview that floats over the map. */
  compact?: boolean;
}) {
  const { isRTL, textAlign } = useDirection();
  // The compact card's container clips to its own radius, so the photo fills
  // the full width and the corners come from the parent.
  const imageWidth = CARD_WIDTH;
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: Array<{ index: number | null }> }) => {
      const first = info.viewableItems[0];
      if (first && typeof first.index === "number") setActiveIndex(first.index);
    },
  ).current;

  // `allImages` is what the map screen already resolved; fall back to the
  // single cover so a chalet with one photo still renders.
  const images: any[] =
    Array.isArray(chalet?.allImages) && chalet.allImages.length > 0
      ? chalet.allImages
      : chalet?.image
        ? [chalet.image]
        : [];

  const pick = (value: any) => {
    if (value && typeof value === "object") {
      return (isRTL ? value.ar : value.en) ?? value.ar ?? value.en ?? "";
    }
    return value ?? "";
  };

  const title = pick(chalet?.title) || pick(chalet?.name);

  // Most listings have no street address, so fall back to the city the way the
  // reference does ("Apartment in Basra" → "شاليه في البصرة") instead of
  // leaving the line blank.
  const city = pick(chalet?.city?.name) || pick(chalet?.city);
  const place =
    pick(chalet?.location) ||
    (city ? (isRTL ? `شاليه في ${city}` : `Chalet in ${city}`) : "");

  // "٢ غرف نوم · ٦ ضيوف · حمّامان" — only the parts the chalet actually has, so
  // an incomplete listing never shows a dangling separator.
  const details = [
    chalet?.bedrooms
      ? isRTL
        ? `${chalet.bedrooms} غرفة نوم`
        : `${chalet.bedrooms} bedroom${chalet.bedrooms > 1 ? "s" : ""}`
      : null,
    chalet?.capacity
      ? isRTL
        ? `${chalet.capacity} ضيف`
        : `${chalet.capacity} guests`
      : null,
    chalet?.bathrooms
      ? isRTL
        ? `${chalet.bathrooms} حمّام`
        : `${chalet.bathrooms} bath${chalet.bathrooms > 1 ? "s" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const price = chalet?.price;

  return (
    <View>
      <View
        style={[
          styles.imageWrap,
          compact && styles.imageWrapCompact,
          { width: imageWidth },
        ]}
      >
        {/* Direction is left to native RTL — in Arabic the next photo comes
            from the left, like the rest of the app. The active dot is read
            from what is actually on screen rather than from contentOffset.x,
            whose sign RTL flips (and flips differently per platform). */}
        <FlatList
          data={images}
          keyExtractor={(_: any, i: number) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }: { item: any; index: number }) => (
            <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
              <ExpoImage
                source={item}
                style={[styles.image, { width: imageWidth }]}
                contentFit="cover"
                placeholder={imagePlaceholder(chalet?.images?.[index]?.blurhash)}
                transition={IMAGE_TRANSITION}
              />
            </TouchableOpacity>
          )}
        />

        <View style={[styles.topActions, { flexDirection: "row" }]}>
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.roundAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {},
              );
              onToggleFavorite();
            }}
          >
            {isFavorite ? (
              <SolarHeartBold size={20} color="#EA2129" />
            ) : (
              <SolarHeartLinear size={20} color="#111827" />
            )}
          </TouchableOpacity>
        )}
        {onClose && (
          <TouchableOpacity
            style={styles.roundAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onClose}
          >
            <SolarCloseBold size={18} color="#111827" />
          </TouchableOpacity>
        )}
        </View>

        {images.length > 1 && (
          <View style={[styles.dots, { flexDirection: "row" }]}>
            {images.map((_: any, i: number) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.body, compact && styles.bodyCompact]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <ThemedText style={[styles.title, { textAlign }]} numberOfLines={1}>
          {title}
        </ThemedText>

        {!!place && (
          <ThemedText style={[styles.place, { textAlign }]} numberOfLines={1}>
            {place}
          </ThemedText>
        )}

        {!!details && (
          <ThemedText style={[styles.details, { textAlign }]} numberOfLines={1}>
            {details}
          </ThemedText>
        )}

        {!!price && (
          <View style={[styles.priceRow, { flexDirection: "row" }]}>
            {/* "starts from", not a nightly rate: this is the cheapest shift
                the chalet sells, and shifts are hours, not nights. */}
            <ThemedText style={styles.priceUnit}>
              {isRTL ? "يبدأ من " : "From "}
            </ThemedText>
            <ThemedText style={styles.price}>
              {price} {isRTL ? "د.ع" : "IQD"}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    width: CARD_WIDTH,
    height: normalize.height(200),
    borderRadius: normalize.radius(24),
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: CARD_WIDTH,
    height: "100%",
  },
  imageWrapCompact: {
    height: normalize.height(150),
    // Square: the container it sits in provides the rounding.
    borderRadius: 0,
  },
  imageCompact: {
    height: "100%",
  },
  topActions: {
    position: "absolute",
    top: 12,
    end: 12,
    gap: 8,
  },
  roundAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
  body: {
    paddingTop: 10,
    gap: 2,
  },
  // The compact card has no outer padding, so the text supplies its own.
  bodyCompact: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  title: {
    fontSize: normalize.font(15),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#111827",
  },
  place: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#6B7280",
  },
  details: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#6B7280",
  },
  priceRow: {
    alignItems: "baseline",
    marginTop: 4,
  },
  price: {
    fontSize: normalize.font(15),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#111827",
    textDecorationLine: "underline",
  },
  priceUnit: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: Colors.text?.muted ?? "#6B7280",
  },
});
