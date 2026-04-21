import { HeaderSection } from "@/components/header-section";
import { RatingBackground } from "@/components/icons/rating-background";
import {
  SolarAltArrowDownLinear,
  SolarStarBold,
  SolarStarLinear,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { ReviewSubmissionSheet } from "@/components/user/review-submission-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { SecondarySelect } from "@/components/user/secondary-select";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { useGetChaletReviewsQuery, useCreateReviewMutation } from "@/store/api/customerApiSlice";
import { Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Base design width for normalization
const DESIGN_BASE_WIDTH = 414; // Using iPhone Plus as base for more standard scaling
const scale = SCREEN_WIDTH / DESIGN_BASE_WIDTH;
const normalize = (size: number) => size * scale;

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400",
  "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=400",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
];

export default function ReviewsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const isArabic = i18n.language === 'ar';
  const isRTL = isArabic;
  const [userRating, setUserRating] = useState(0);
  const [filterValue, setFilterValue] = useState("latest");
  const reviewSheetRef = useRef<BottomSheetModal>(null);

  // Fetch reviews from backend
  const { data: reviewsResponse, isLoading } = useGetChaletReviewsQuery({ chaletId, page: 1, limit: 20 });
  const [createReview] = useCreateReviewMutation();

  const filterOptions = [
    { label: isArabic ? "اخر التقييمات" : "Latest Reviews", value: "latest" },
    { label: isArabic ? "الاعلى التقييمات" : "Highest Rated", value: "highest" },
    { label: isArabic ? "الادنى التقييمات" : "Lowest Rated", value: "lowest" },
  ];

  const handleRatingPress = (rating: number) => {
    setUserRating(rating);
    reviewSheetRef.current?.present();
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      // Note: createReview requires a bookingId which should come from completed booking
      console.log("Review Submitted:", { rating, comment, chaletId });
    } catch (error) {
      console.error('Review submission error:', error);
    }
  };

  // Transform API data
  const reviews = useMemo(() => {
    const items = reviewsResponse?.data || [];
    return items.map((rev: any) => ({
      name: rev.customer?.name || (isArabic ? 'مستخدم' : 'User'),
      rating: rev.rating || 0,
      body: rev.comment || '',
      date: rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : '',
      avatar: rev.customer?.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      images: rev.images?.map((img: any) => img.url) || [],
    }));
  }, [reviewsResponse, isArabic]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Standard Header */}
      <HeaderSection title={t('headers.reviews')} showBackButton={true} showLogo={false} onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryArea}>
          <ThemedText style={styles.bigRatingText}>{averageRating}</ThemedText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SolarStarBold
                key={i}
                size={normalize(32)}
                color={i <= Math.round(Number(averageRating)) ? "#15AB64" : "#E5E7EB"}
              />
            ))}
          </View>
        </View>

        <View style={[styles.filterContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <SecondarySelect
            options={filterOptions}
            value={filterValue}
            onSelect={setFilterValue}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {reviews.map((rev: any, idx: number) => {
            const reviewerName = rev.name;
            const reviewBody = rev.body;

            return (
                <View key={idx} style={styles.revCardFlat}>
                  <View style={[styles.revHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.ratingBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                      <SolarStarBold size={14} color="#035DF9" />
                      <ThemedText style={styles.rateNumText}>
                        {rev.rating}
                      </ThemedText>
                    </View>
                    <View style={[styles.userInfoRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                      <View style={[styles.nameAndBody, { alignItems: isRTL ? "flex-end" : "flex-start", [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>
                        <ThemedText style={styles.reviewerNameText}>
                          {reviewerName}
                        </ThemedText>
                        <ThemedText style={[styles.revBodyText, { textAlign: isRTL ? 'right' : 'left' }]}>
                          {reviewBody}
                        </ThemedText>
                      </View>
                      <View style={styles.avatarCircle}>
                        <Image
                          source={{ uri: rev.avatar }}
                          style={styles.userAvatarImg}
                        />
                      </View>
                    </View>
                  </View>
                  {rev.images.length > 0 && (
                    <View style={styles.galleryWrapper}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={[styles.imgGallery, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      >
                        {rev.images.map((imgUri, imIdx) => (
                          <Image
                            key={imIdx}
                            source={{ uri: imgUri }}
                            style={[styles.thumb, { [isRTL ? 'marginLeft' : 'marginRight']: 12 }]}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <View style={[styles.dateWrapper, { alignItems: 'flex-end' }]}>
                    <ThemedText style={[styles.dateTextLabel, { alignSelf: 'flex-end' }]}>{rev.date}</ThemedText>
                  </View>
                </View>
            );
          })}
        </View>
      </ScrollView>

      {/* الفوتر الملتصق بالأسفل تماماً باستخدام rating.svg */}
      <View style={styles.footerSticky}>
        <RatingBackground
          style={styles.footerBgImage}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMax slice"
        />
        <View style={styles.footerOverlayContent}>
          <View style={styles.whiteInputPill}>
            <ThemedText style={styles.questionTitle}>
              {t('profile.review.question')}
            </ThemedText>
            <View style={styles.inputStarsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Pressable key={i} onPress={() => handleRatingPress(i)}>
                  {i <= userRating ? (
                    <SolarStarBold size={normalize(32)} color="#15AB64" />
                  ) : (
                    <SolarStarLinear size={normalize(32)} color="#15AB64" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <ReviewSubmissionSheet
        ref={reviewSheetRef}
        onSubmit={handleReviewSubmit}
        initialRating={userRating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  summaryArea: { alignItems: "center", marginVertical: normalize(35) },
  bigRatingText: {
    fontSize: normalize(56),
    fontFamily: "Tajawal-Black",
    color: "#111827",
    marginBottom: normalize(5),
  },
  starsRow: { flexDirection: "row", gap: normalize(6) },
  filterContainer: {
    paddingHorizontal: normalize(20),
    marginBottom: normalize(25),
  },
  revCardFlat: {
    backgroundColor: "#FFFFFF",
    borderRadius: normalize(24),
    padding: normalize(20),
    marginBottom: normalize(16),
    borderWidth: normalize(1),
    borderColor: "#F3F4F6",
  },
  revHeader: {
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ratingBadge: {
    alignItems: "center",
    gap: normalize(4),
    marginTop: normalize(4),
  },
  rateNumText: {
    fontSize: normalize(16),
    fontFamily: "Tajawal-Black",
    color: "#111827",
  },
  userInfoRow: {
    alignItems: "flex-start",
    flex: 1,
  },
  nameAndBody: { flex: 1 },
  reviewerNameText: {
    fontSize: normalize(16),
    fontFamily: "Tajawal-Black",
    color: "#111827",
  },
  revBodyText: {
    fontSize: normalize(14),
    color: "#6B7280",
    marginTop: normalize(8),
    lineHeight: normalize(22),
    fontFamily: "Tajawal-Regular",
  },
  avatarCircle: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  userAvatarImg: { width: "100%", height: "100%" },
  galleryWrapper: { marginTop: normalize(20) },
  imgGallery: { },
  thumb: {
    width: normalize(110),
    height: normalize(85),
    borderRadius: normalize(14),
  },
  dateWrapper: { marginTop: normalize(20) },
  dateTextLabel: {
    fontSize: normalize(13),
    color: "#9CA3AF",
    fontFamily: "Tajawal-Medium",
  },
  footerSticky: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: normalize(150),
  },
  footerBgImage: {
    position: "absolute",
    bottom: normalize(-25),
    left: -normalize(0),
    right: -normalize(40),
    height: "100%",
  },
  footerOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: normalize(35),
  },
  whiteInputPill: {
    backgroundColor: "#F0F6F5",
    borderRadius: normalize(50),
    height: normalize(90),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  questionTitle: {
    fontSize: normalize(16),
    fontFamily: "Tajawal-Black",
    color: "#111827",
    marginBottom: normalize(8),
  },
  inputStarsRow: { flexDirection: "row", gap: 12 },
});
