import { HeaderSection } from "@/components/header-section";
import { ReviewCard } from "@/components/user/review-card";
import { SecondaryButton } from "@/components/user/secondary-button";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useGetCustomerBookingsQuery } from "@/store/api/customerApiSlice";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    FlatList,
    StyleSheet,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ReviewsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  const insets = useSafeAreaInsets();

  // Fetch completed bookings (pending review) and all bookings
  const { data: completedBookings, isLoading: loadingCompleted } = useGetCustomerBookingsQuery({ status: 'completed', page: 1, limit: 50 });
  const { data: allBookings, isLoading: loadingAll } = useGetCustomerBookingsQuery({ page: 1, limit: 50 });

  // Transform API data to review format
  const reviews = useMemo(() => {
    const completed = completedBookings?.data || [];
    const all = allBookings?.data || [];

    // Pending: completed bookings without reviews
    const pending = completed
      .filter((b: any) => !b.review)
      .map((booking: any) => ({
        id: booking.id,
        chaletId: booking.chalet?.id || '',
        chaletTitle: isRTL 
          ? (booking.chalet?.name?.ar || booking.chalet?.nameAr || booking.chalet?.name || '') 
          : (booking.chalet?.name?.en || booking.chalet?.nameEn || booking.chalet?.name || ''),
        chaletLocation: isRTL
          ? (booking.chalet?.region?.name?.ar || booking.chalet?.region?.nameAr || booking.chalet?.region?.name || '')
          : (booking.chalet?.region?.name?.en || booking.chalet?.region?.nameEn || booking.chalet?.region?.name || ''),
        price: booking.chalet?.basePrice ? Number(booking.chalet.basePrice).toLocaleString() : '0',
        chaletImage: getImageSrc(booking.chalet?.images?.[0]?.url)?.uri || '',
        userName: booking.customer?.name || '',
        userAvatar: booking.customer?.imageUrl || '',
        rating: 0,
        comment: '',
        gallery: [],
        date: booking.bookingDate || '',
        status: 'pending' as const,
      }));

    // Reviewed: bookings that have reviews
    const reviewed = all
      .filter((b: any) => b.review)
      .map((booking: any) => ({
        id: booking.review?.id || booking.id,
        chaletId: booking.chalet?.id || '',
        chaletTitle: isRTL
          ? (booking.chalet?.nameAr || booking.chalet?.name || '')
          : (booking.chalet?.nameEn || booking.chalet?.name || ''),
        chaletLocation: isRTL
          ? (booking.chalet?.region?.nameAr || booking.chalet?.region?.name || '')
          : (booking.chalet?.region?.nameEn || booking.chalet?.region?.name || ''),
        price: booking.chalet?.basePrice ? Number(booking.chalet.basePrice).toLocaleString() : '0',
        chaletImage: getImageSrc(booking.chalet?.images?.[0]?.url)?.uri || '',
        userName: booking.customer?.name || '',
        userAvatar: booking.customer?.imageUrl || '',
        rating: booking.review?.rating || 0,
        comment: booking.review?.comment || '',
        gallery: [],
        date: booking.review?.createdAt ? new Date(booking.review.createdAt).toLocaleDateString() : '',
        status: 'reviewed' as const,
      }));

    return { pending, reviewed };
  }, [completedBookings, allBookings, isRTL]);

  const filteredReviews = activeTab === 'pending' ? reviews.pending : reviews.reviewed;

  const renderReviewItem = ({ item }: { item: any }) => {
    return (
      <ReviewCard 
        review={{
          ...item,
          chaletTitle: item.chaletTitle,
          chaletLocation: item.chaletLocation,
          comment: item.comment,
        }} 
      />
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
      <View style={[styles.tabsWrapper, { flexDirection: isRTL ? 'row' : 'row' }]}>
        <View style={styles.tabItem}>
          <SecondaryButton
            label={t('reviews.reviewed')}
            onPress={() => setActiveTab('reviewed')}
            isActive={activeTab === 'reviewed'}
            style={{ width: '100%' }}
            iconPosition={isRTL ? "left" : "right"}
            variant="default"
          />
        </View>
        <View style={styles.tabItem}>
          <SecondaryButton
            label={t('reviews.pending')}
            onPress={() => setActiveTab('pending')}
            isActive={activeTab === 'pending'}
            style={{ width: '100%' }}
            iconPosition={isRTL ? "right" : "left"}
            variant="inverse"
          />
        </View>
      </View>

      <FlatList
        data={filteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabItem: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
});
