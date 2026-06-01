import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Colors, normalize } from "@/constants/theme";

// The organic "blob" shape used by the real booking-card image (SHAPES_CONFIG[2]),
// so the skeleton's image placeholder matches the actual card shape 1:1.
const BOOKING_SHAPE = {
  viewBox: "0 0 141 129",
  path: "M77.0459 14.0977C86.8144 5.10784 99.2037 0.386687 110.42 2.50195C121.804 4.64892 131.346 13.705 135.513 30.8994C138.687 44.002 138.736 58.6286 136.25 71.833C133.77 85.0021 128.722 96.9923 121.482 104.651C109.519 117.308 92.5368 124.708 75.1924 126.547C57.8513 128.385 39.9659 124.682 26.1904 114.895C2.53265 98.088 -5.36999 65.526 9.69531 44.0059C15.0767 36.3186 23.5058 33.0498 41.1289 30.5859C50.2739 29.3071 56.0975 28.0172 61.1807 25.6816C66.2509 23.3521 70.7222 19.918 77.0449 14.0977H77.0459Z",
};

// ─── Core Skeleton Box ─────────────────────────────────────────────────────────

interface SkeletonBoxProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height,
  borderRadius = 12,
  style,
}) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#E5E7EB",
        },
        animStyle,
        style,
      ]}
    />
  );
};

// ─── Shape Skeleton (matches the app's SVG blob shapes) ────────────────────────

interface SkeletonShapeProps {
  path: string;
  viewBox: string;
  width: number;
  height: number;
  color?: string;
  style?: ViewStyle;
}

export const SkeletonShape: React.FC<SkeletonShapeProps> = ({
  path,
  viewBox,
  width,
  height,
  color = "#E5E7EB",
  style,
}) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{ width, height }, animStyle, style]}>
      <Svg width={width} height={height} viewBox={viewBox}>
        <Path d={path} fill={color} />
      </Svg>
    </Animated.View>
  );
};

// ─── Banner / Carousel Skeleton ─────────────────────────────────────────────────

export const BannerSkeleton: React.FC = () => (
  <View style={skeletonStyles.bannerContainer}>
    <SkeletonBox width="100%" height={160} borderRadius={20} />
    <View style={skeletonStyles.bannerDots}>
      {[0, 1, 2].map((i) => (
        <SkeletonBox key={i} width={8} height={8} borderRadius={4} style={{ marginHorizontal: 3 }} />
      ))}
    </View>
  </View>
);

// ─── Chalet Card Skeleton (Vertical / Swiper Card) ─────────────────────────────

export const ChaletCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.chaletCard}>
    <SkeletonBox width="100%" height={140} borderRadius={16} />
    <View style={skeletonStyles.chaletCardBody}>
      <SkeletonBox width="70%" height={14} borderRadius={6} />
      <SkeletonBox width="45%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
      <View style={skeletonStyles.chaletCardFooter}>
        <SkeletonBox width="35%" height={14} borderRadius={6} />
        <SkeletonBox width={60} height={24} borderRadius={10} />
      </View>
    </View>
  </View>
);

// ─── Horizontal Swiper Skeleton (Row of cards) ──────────────────────────────────

export const HorizontalSwiperSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={skeletonStyles.horizontalRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={skeletonStyles.horizontalCard}>
        <SkeletonBox width={180} height={120} borderRadius={16} />
        <View style={{ padding: 8, gap: 6 }}>
          <SkeletonBox width={120} height={12} borderRadius={6} />
          <SkeletonBox width={80} height={10} borderRadius={6} />
          <SkeletonBox width={60} height={12} borderRadius={6} />
        </View>
      </View>
    ))}
  </View>
);

// ─── Horizontal Card Skeleton (List item) ───────────────────────────────────────

export const HorizontalCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.horizontalListCard}>
    <SkeletonBox width={100} height={80} borderRadius={14} />
    <View style={skeletonStyles.horizontalListCardBody}>
      <SkeletonBox width="75%" height={14} borderRadius={6} />
      <SkeletonBox width="50%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
      <SkeletonBox width="35%" height={14} borderRadius={6} style={{ marginTop: 8 }} />
    </View>
  </View>
);

// ─── Booking Card Skeleton ──────────────────────────────────────────────────────

export const BookingCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.bookingCard}>
    {/* Top block: blob-shaped image + title/location/price (matches the real card) */}
    <View style={skeletonStyles.bookingTopBlock}>
      <SkeletonShape
        path={BOOKING_SHAPE.path}
        viewBox={BOOKING_SHAPE.viewBox}
        width={115}
        height={100}
      />
      <View style={skeletonStyles.bookingInfo}>
        <SkeletonBox width="85%" height={15} borderRadius={6} />
        <SkeletonBox width="55%" height={12} borderRadius={6} style={{ marginTop: 10 }} />
        <View style={skeletonStyles.bookingPriceRow}>
          <SkeletonBox width={90} height={13} borderRadius={6} />
          <SkeletonBox width={44} height={22} borderRadius={8} />
        </View>
      </View>
    </View>

    {/* Bottom block: detail rows + action button */}
    <View style={skeletonStyles.bookingBottomBlock}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.bookingDetailRow}>
          <SkeletonBox width={92} height={12} borderRadius={6} />
          <SkeletonBox width={70} height={12} borderRadius={6} />
        </View>
      ))}
      <View style={skeletonStyles.bookingDivider} />
      <SkeletonBox width="55%" height={14} borderRadius={6} style={{ alignSelf: "center" }} />
    </View>
  </View>
);

// ─── Dashboard Stat Skeleton ────────────────────────────────────────────────────

export const DashboardStatSkeleton: React.FC = () => (
  <View style={skeletonStyles.statRow}>
    {[0, 1, 2].map((i) => (
      <View key={i} style={skeletonStyles.statCard}>
        <SkeletonBox width={36} height={36} borderRadius={12} />
        <SkeletonBox width="60%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
        <SkeletonBox width="40%" height={10} borderRadius={6} style={{ marginTop: 4 }} />
      </View>
    ))}
  </View>
);

// ─── Map Skeleton ───────────────────────────────────────────────────────────────

export const MapSkeleton: React.FC = () => (
  <View style={skeletonStyles.mapContainer}>
    <SkeletonBox width="100%" height={210} borderRadius={28} />
  </View>
);

// ─── Full Page Skeleton (Customer Home) ─────────────────────────────────────────

export const CustomerHomeSkeleton: React.FC = () => (
  <View style={skeletonStyles.fullPage}>
    {/* Banner */}
    <BannerSkeleton />
    {/* Section Header */}
    <View style={skeletonStyles.sectionHeader}>
      <SkeletonBox width={120} height={14} borderRadius={6} />
      <SkeletonBox width={60} height={14} borderRadius={6} />
    </View>
    {/* Map */}
    <MapSkeleton />
    {/* Section Header */}
    <View style={skeletonStyles.sectionHeader}>
      <SkeletonBox width={100} height={14} borderRadius={6} />
      <SkeletonBox width={50} height={14} borderRadius={6} />
    </View>
    {/* Horizontal Cards */}
    <HorizontalSwiperSkeleton count={2} />
    {/* Section Header */}
    <View style={[skeletonStyles.sectionHeader, { marginTop: 20 }]}>
      <SkeletonBox width={80} height={14} borderRadius={6} />
    </View>
    {/* Filter tabs */}
    <View style={skeletonStyles.filterTabs}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBox key={i} width={80} height={36} borderRadius={18} />
      ))}
    </View>
    {/* Vertical Cards */}
    {[0, 1].map((i) => (
      <View key={i} style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <HorizontalCardSkeleton />
      </View>
    ))}
  </View>
);

// ─── Bookings Page Skeleton ─────────────────────────────────────────────────────

export const BookingsPageSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={skeletonStyles.fullPage}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={{ marginBottom: 12, paddingHorizontal: 16 }}>
        <BookingCardSkeleton />
      </View>
    ))}
  </View>
);

// ─── Dashboard Home Skeleton ────────────────────────────────────────────────────

export const DashboardHomeSkeleton: React.FC = () => (
  <View style={skeletonStyles.fullPage}>
    <DashboardStatSkeleton />
    <View style={[skeletonStyles.sectionHeader, { marginTop: 20 }]}>
      <SkeletonBox width={100} height={14} borderRadius={6} />
    </View>
    {[0, 1, 2].map((i) => (
      <View key={i} style={{ marginBottom: 12, paddingHorizontal: 16 }}>
        <BookingCardSkeleton />
      </View>
    ))}
  </View>
);

// ─── Styles ─────────────────────────────────────────────────────────────────────

const skeletonStyles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    alignItems: "center",
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  chaletCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
  },
  chaletCardBody: {
    padding: 10,
    gap: 4,
  },
  chaletCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  horizontalRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCard: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  horizontalListCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    gap: 12,
    alignItems: "center",
  },
  horizontalListCardBody: {
    flex: 1,
    justifyContent: "center",
  },
  bookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    overflow: "hidden",
  },
  bookingTopBlock: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    gap: 15,
  },
  bookingInfo: {
    flex: 1,
    height: 100,
    justifyContent: "center",
    gap: 0,
  },
  bookingPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  bookingBottomBlock: {
    backgroundColor: "#FAFCFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  bookingDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bookingDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    opacity: 0.6,
    marginVertical: 12,
  },
  statRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
  },
  mapContainer: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginVertical: 10,
  },
  fullPage: {
    paddingTop: 10,
  },
});
