import { HeaderSection } from "@/components/header-section";
import { ReviewCard } from "@/components/user/review-card";
import { SecondaryButton } from "@/components/user/secondary-button";
import { EmptyState } from "@/components/ui/empty-state";
import { SolarReviewsHeartBold } from "@/components/icons/solar-icons";
import { Colors } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useGetCustomerBookingsQuery } from "@/store/api/customerApiSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MemoizedReviewCard = React.memo(ReviewCard);

export default function ReviewsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, rowDirection } = useDirection();
  const isArabic = isRTL;
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  const insets = useSafeAreaInsets();

  // The reviewer on this "my reviews" screen is always the logged-in customer,
  // so fall back to the auth user for name/avatar when the booking payload
  // doesn't embed the customer object.
  const authUser = useSelector((s: RootState) => s.auth.user);
  const meName = authUser?.name || authUser?.fullName || "";
  const meAvatar = authUser?.image || authUser?.imageUrl || authUser?.avatar || "";

  // Fetch completed bookings (pending review) and all bookings
  const { data: completedBookings, isLoading: loadingCompleted, refetch: refetchCompleted } = useGetCustomerBookingsQuery({ status: 'completed', page: 1, limit: 50 });
  const { data: allBookings, isLoading: loadingAll, refetch: refetchAll } = useGetCustomerBookingsQuery({ page: 1, limit: 50 });

  // Transform API data to review format
  // Pending: completed bookings without reviews
  const pendingReviews = useMemo(() => {
    const completed = completedBookings?.data || [];
    return completed
      .filter((b: any) => !b.review)
      .map((booking: any) => ({
        id: booking.id,
        chaletId: booking.chalet?.id || '',
        chaletTitle: isArabic
          ? (booking.chalet?.name?.ar || booking.chalet?.nameAr || booking.chalet?.name || '')
          : (booking.chalet?.name?.en || booking.chalet?.nameEn || booking.chalet?.name || ''),
        chaletLocation: isArabic
          ? (booking.chalet?.region?.name?.ar || booking.chalet?.region?.nameAr || booking.chalet?.region?.name || '')
          : (booking.chalet?.region?.name?.en || booking.chalet?.region?.nameEn || booking.chalet?.region?.name || ''),
        price: booking.chalet?.basePrice ? Number(booking.chalet.basePrice).toLocaleString() : '0',
        chaletImage: getImageSrc(booking.chalet?.images?.[0]?.url)?.uri || '',
        userName: booking.customer?.name || meName,
        userAvatar: booking.customer?.imageUrl || meAvatar,
        rating: 0,
        comment: '',
        gallery: [],
        date: booking.bookingDate || '',
        status: 'pending' as const }));
  }, [completedBookings, isArabic, meName, meAvatar]);

  // Reviewed: bookings that have reviews
  const reviewedReviews = useMemo(() => {
    const all = allBookings?.data || [];
    return all
      .filter((b: any) => b.review)
      .map((booking: any) => ({
        id: booking.review?.id || booking.id,
        chaletId: booking.chalet?.id || '',
        chaletTitle: isArabic
          ? (booking.chalet?.nameAr || booking.chalet?.name || '')
          : (booking.chalet?.nameEn || booking.chalet?.name || ''),
        chaletLocation: isArabic
          ? (booking.chalet?.region?.nameAr || booking.chalet?.region?.name || '')
          : (booking.chalet?.region?.nameEn || booking.chalet?.region?.name || ''),
        price: booking.chalet?.basePrice ? Number(booking.chalet.basePrice).toLocaleString() : '0',
        chaletImage: getImageSrc(booking.chalet?.images?.[0]?.url)?.uri || '',
        userName: booking.review?.customer?.name || booking.customer?.name || meName,
        userAvatar: booking.review?.customer?.imageUrl || booking.customer?.imageUrl || meAvatar,
        rating: booking.review?.rating || 0,
        comment: booking.review?.comment || '',
        // Review photos: API returns review.images as [{ url }]; resolve each to a URI.
        gallery: (booking.review?.images || [])
          .map((img: any) => getImageSrc(img?.url || img)?.uri)
          .filter(Boolean),
        date: booking.review?.createdAt ? new Date(booking.review.createdAt).toLocaleDateString() : '',
        status: 'reviewed' as const }));
  }, [allBookings, isArabic, meName, meAvatar]);

  const filteredReviews = activeTab === 'pending' ? pendingReviews : reviewedReviews;
  const loading = loadingCompleted || loadingAll;

  const renderReviewItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay((index % 8) * 60).duration(380)}>
        <MemoizedReviewCard
          review={{
            ...item,
            chaletTitle: item.chaletTitle,
            chaletLocation: item.chaletLocation,
            comment: item.comment }}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderSection 
        title={t('headers.reviews')} 
        showBackButton 
        showLogo={false} 
        onBackPress={() => router.back()} 
      />

      {/* Tabs with fixed components to prevent shape shifting */}
      <View style={[styles.tabsWrapper, { flexDirection: rowDirection }]}>
        <View style={styles.tabItem}>
          <SecondaryButton
            label={t('reviews.reviewed')}
            onPress={() => setActiveTab('reviewed')}
            isActive={activeTab === 'reviewed'}
            style={{ width: '100%' }}
            iconPosition={isArabic ? "left" : "right"}
            variant="default"
          />
        </View>
        <View style={styles.tabItem}>
          <SecondaryButton
            label={t('reviews.pending')}
            onPress={() => setActiveTab('pending')}
            isActive={activeTab === 'pending'}
            style={{ width: '100%' }}
            iconPosition={isArabic ? "right" : "left"}
            variant="inverse"
          />
        </View>
      </View>

      <FlatList
        data={filteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          filteredReviews.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refetchCompleted();
              refetchAll();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? null : activeTab === "pending" ? (
            <EmptyState
              icon={<SolarReviewsHeartBold size={56} color={Colors.primary} />}
              title={t("reviews.noPending")}
              description={t("reviews.noPendingDesc")}
            />
          ) : (
            <EmptyState
              icon={<SolarReviewsHeartBold size={56} color={Colors.primary} />}
              title={t("reviews.noReviewed")}
              description={t("reviews.noReviewedDesc")}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white" },
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12 },
  tabItem: {
    flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40 },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center" } });
