import { HeaderSection } from "@/components/header-section";
import { SectionIcon } from "@/components/icons/section-icon";
import {
  SolarCloseCircleBold,
  SolarFireBold,
  SolarGalleryWideLinear,
  SolarHome2Bold,
  SolarWaterBold,
  SolarWidgetBold,
} from "@/components/icons/solar-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Image as ExpoImage } from "expo-image";
import { IMAGE_TRANSITION, imagePlaceholder } from "@/constants/image-loading";
import { ltrScrollContent, ltrScroller, pickTranslation, useDirection, useRtlListOrder } from "@/i18n";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const { width: SCREEN_WIDTH } = Dimensions.get("window");

import { getImageSrc } from "@/hooks/useImageSrc";

import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";

// Categories mapping helper
const CATEGORY_ICONS: Record<string, any> = {
  pool: (isActive: boolean) => (
    <SolarWaterBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  bbq: (isActive: boolean) => (
    <SolarFireBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  kitchen: (isActive: boolean) => (
    <SolarHome2Bold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  bath: (isActive: boolean) => (
    <SolarWaterBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  default: (isActive: boolean) => (
    <SolarWidgetBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
};

const CATEGORY_COLORS: Record<string, string> = {
  pool: "#035DF9",
  bbq: "#F64200",
  kitchen: "#15AB64",
  bath: "#035DF9",
  default: Colors.primary,
};

type PressableImageProps = {
  source: any;
  onPress: () => void;
  cardStyle: any;
  imageStyle: any;
};

const PressableImage = React.memo(
  ({ source, onPress, cardStyle, imageStyle }: PressableImageProps) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedTouchable
        activeOpacity={0.9}
        style={[cardStyle, animatedStyle]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <ExpoImage
          source={source.src ?? source}
          style={imageStyle}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={imagePlaceholder(source.blurhash)}
          transition={IMAGE_TRANSITION}
        />
      </AnimatedTouchable>
    );
  }
);

PressableImage.displayName = "PressableImage";

const WavyHeader = ({ title, color }: { title: string; color: string }) => (
  <View style={styles.wavyHeaderContainer}>
    <SectionIcon
      color={color}
      title={title}
      // Matches the photo cards below it: the section wrapper insets 16 on each
      // side, so the title card lines up with the images instead of sitting in
      // its own narrower column.
      width={SCREEN_WIDTH - 32}
      height={50}
    />
  </View>
);

/**
 * Photos arrive either as remote URLs or as bundled `require()` assets — the
 * viewer's FlatList needs a plain uri string for both.
 */
function toUri(src: any): string {
  if (typeof src === "string") return src;
  if (src && src.uri) return src.uri;
  return Image.resolveAssetSource(src)?.uri ?? "";
}

const MAX_ZOOM = 4;

/**
 * One page of the photo viewer: pinch to zoom, drag to pan while zoomed,
 * double-tap to toggle back and forth.
 *
 * Panning is only enabled once zoomed (`isZoomed`) — otherwise the pan gesture
 * would swallow the horizontal swipe the pager needs to change photos.
 */
function ZoomableImage({
  uri,
  isZoomed,
  onZoomChange,
}: {
  uri: string;
  isZoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const settle = (next: number) => {
    "worklet";
    // Below ~1 the photo snaps back to fit and re-centres, so a half-hearted
    // pinch never leaves it slightly off-screen.
    if (next <= 1.01) {
      scale.value = withTiming(1);
      tx.value = withTiming(0);
      ty.value = withTiming(0);
      savedScale.value = 1;
      savedTx.value = 0;
      savedTy.value = 0;
      runOnJS(onZoomChange)(false);
    } else {
      savedScale.value = next;
      runOnJS(onZoomChange)(true);
    }
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.8), MAX_ZOOM);
    })
    .onEnd(() => settle(scale.value));

  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .averageTouches(true)
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.01) {
        settle(1);
      } else {
        scale.value = withTiming(2);
        settle(2);
      }
    });

  const gesture = Gesture.Exclusive(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.viewerPage}>
        <Animated.Image
          source={{ uri }}
          style={[styles.modalImg, animatedStyle]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);
  const { isRTL, direction } = useDirection();
  const isArabic = isRTL;

  const [activeFilter, setActiveFilter] = useState("all");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  // Paging and panning compete for the same drag, so the pager is frozen while
  // a photo is zoomed in — pinch (or double-tap) back out to swipe again.
  const [viewerZoomed, setViewerZoomed] = useState(false);

  const { data: chaletData, isLoading } =
    useGetCustomerChaletDetailsQuery(chaletId);
  const chalet = chaletData?.data || chaletData || {};

  const gallerySections = useMemo(() => {
    if (!chalet.images) return [];

    const grouped: Record<string, any> = {};

    // Group images by category
    chalet.images.forEach((img: any) => {
      const categoryId = img.amenityCategory?.id || "general";
      const categoryName =
        pickTranslation(img.amenityCategory?.name, isArabic) ||
        t("gallery.categories.general");

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          category: categoryName,
          color: CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default,
          images: [],
          iconKey: categoryId,
        };
      }
      grouped[categoryId].images.push({
        src: getImageSrc(img.url),
        blurhash: img.blurhash as string | undefined,
      });
    });

    return Object.values(grouped);
  }, [chalet.images, isArabic, t]);

  const CATEGORIES = useMemo(() => {
    const cats = [
      {
        id: "all",
        label: t("gallery.categories.all"),
        icon: (isActive: boolean) => (
          <SolarWidgetBold
            size={18}
            color={isActive ? "white" : Colors.primary}
          />
        ),
        activeColor: Colors.primary,
      },
    ];

    gallerySections.forEach((section) => {
      cats.push({
        id: section.id,
        label: section.category,
        icon: (isActive: boolean) => {
          const IconGen =
            CATEGORY_ICONS[section.iconKey] || CATEGORY_ICONS.default;
          return IconGen(isActive);
        },
        activeColor: section.color,
      });
    });

    return cats;
  }, [gallerySections, t]);

  const filteredData =
    activeFilter === "all"
      ? gallerySections
      : gallerySections.filter((section) => section.id === activeFilter);

  // Every photo under the current filter, in the order the sections render.
  // The viewer pages through all of them — the grid only previews four per
  // section, but once a photo is open, swiping should reach the rest.
  const viewerImages: string[] = useMemo(
    () =>
      filteredData.flatMap((section: any) =>
        section.images.map((img: any) => toUri(img.src)),
      ),
    [filteredData],
  );

  // Where each section starts inside `viewerImages`, so a tapped photo opens
  // on itself rather than back at the first one.
  const sectionOffsets: number[] = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    filteredData.forEach((section: any) => {
      offsets.push(acc);
      acc += section.images.length;
    });
    return offsets;
  }, [filteredData]);

  const openViewer = React.useCallback((index: number) => {
    setViewerIndex(Math.max(0, index));
    setViewerZoomed(false);
    setViewerVisible(true);
  }, []);

  // Chip strip is LTR-forced; reverse so it reads right-to-left in Arabic
  // with the "all" chip visible at the right edge.
  const orderedCategories = useRtlListOrder(CATEGORIES);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Photo Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        {/* RN Modal is a new native root — the app's direction does not
            inherit; re-apply it here. */}
        <GestureHandlerRootView style={[styles.modalBg, { direction }]}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setViewerVisible(false)}
          >
            <SolarCloseCircleBold size={32} color="white" />
          </TouchableOpacity>

          <FlatList
            data={viewerImages}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={!viewerZoomed}
            initialScrollIndex={viewerIndex}
            // Fixed page width, so jumping straight to the tapped photo works
            // without waiting for the list to measure itself.
            getItemLayout={(_, i) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * i,
              index: i,
            })}
            onMomentumScrollEnd={(e) => {
              setViewerIndex(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
              );
              setViewerZoomed(false);
            }}
            renderItem={({ item }) => (
              <ZoomableImage
                uri={item}
                isZoomed={viewerZoomed}
                onZoomChange={setViewerZoomed}
              />
            )}
          />

          {viewerImages.length > 1 && (
            <View style={styles.viewerCounter}>
              <ThemedText style={styles.viewerCounterText}>
                {`${viewerIndex + 1} / ${viewerImages.length}`}
              </ThemedText>
            </View>
          )}
        </GestureHandlerRootView>
      </Modal>

      <HeaderSection
        title={t("headers.gallery")}
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Categories Filter (Matching Image) */}
      <View style={styles.catArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={ltrScroller}
          contentContainerStyle={[styles.catList, ltrScrollContent]}
        >
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {orderedCategories.map((filter) => (
              <SecondaryButton
                key={filter.id}
                label={filter.label}
                isActive={activeFilter === filter.id}
                activeColor={filter.activeColor}
                icon={filter.icon(activeFilter === filter.id)}
                onPress={() => setActiveFilter(filter.id)}
                style={{ direction }}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredData.map((section, idx) => (
          <Animated.View
            key={idx}
            style={styles.sectionWrap}
          >
            <WavyHeader title={section.category} color={section.color} />

            {/* Big Image */}
            <PressableImage
              source={section.images[0]}
              cardStyle={styles.imageCard}
              imageStyle={styles.bigImage}
              onPress={() => openViewer(sectionOffsets[idx])}
            />

            {/* Small Grid */}
            <View style={[styles.smallGrid, { flexDirection: 'row' }]}>
              {section.images.slice(1, 4).map((img: any, i: number) => (
                <PressableImage
                  key={i}
                  source={img}
                  cardStyle={styles.smallImageCard}
                  imageStyle={styles.smallImage}
                  // +1: the grid starts after this section's big image.
                  onPress={() => openViewer(sectionOffsets[idx] + i + 1)}
                />
              ))}
            </View>
          </Animated.View>
        ))}
        {!isLoading && filteredData.length === 0 && (
          <EmptyState
            icon={<SolarGalleryWideLinear size={normalize.width(56)} color={Colors.primary} />}
            title={isArabic ? "لا توجد صور" : "No photos yet"}
            description={t("gallery.empty")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 60,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
  },
  headerSide: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catArea: {
    paddingVertical: 15,
  },
  catList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#035DF9",
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 35,
  },
  wavyHeaderContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  imageCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    marginBottom: 15,
  },
  bigImage: {
    width: "100%",
    height: 240,
  },
  smallGrid: {
    justifyContent: "space-between",
    gap: 12,
  },
  smallImageCard: {
    flex: 1,
    height: 110,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  smallImage: {
    width: "100%",
    height: "100%",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    end: 20,
    zIndex: 10,
  },
  modalImg: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  viewerPage: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCounter: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewerCounterText: {
    color: "white",
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
});
