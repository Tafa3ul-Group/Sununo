import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Colors, normalize } from "@/constants/theme";

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
    <View style={skeletonStyles.bookingCardRow}>
      <SkeletonBox width={56} height={56} borderRadius={16} />
      <View style={skeletonStyles.bookingCardBody}>
        <SkeletonBox width="65%" height={14} borderRadius={6} />
        <SkeletonBox width="45%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        <SkeletonBox width="30%" height={10} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={60} height={16} borderRadius={6} />
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
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
  },
  bookingCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bookingCardBody: {
    flex: 1,
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
