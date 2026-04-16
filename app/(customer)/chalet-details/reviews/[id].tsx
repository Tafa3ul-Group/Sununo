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
import React, { useRef, useState } from "react";
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
} from "react-native";

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
  const isArabic = i18n.language === 'ar';
  const isRTL = isArabic;
  const [userRating, setUserRating] = useState(0);
  const [filterValue, setFilterValue] = useState("latest");
  const reviewSheetRef = useRef<BottomSheetModal>(null);

  const filterOptions = [
    { label: isArabic ? "اخر التقييمات" : "Latest Reviews", value: "latest" },
    { label: isArabic ? "الاعلى التقييمات" : "Highest Rated", value: "highest" },
    { label: isArabic ? "الادنى التقييمات" : "Lowest Rated", value: "lowest" },
  ];

  const handleRatingPress = (rating: number) => {
    setUserRating(rating);
    reviewSheetRef.current?.present();
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    console.log("Review Submitted:", { rating, comment });
    // Add API logic here
  };

  const reviews = [
    {
      name: { ar: "انسة انس", en: "Ansi Ans" },
      rating: 4,
      body: { 
         ar: "خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير", 
         en: "Great place and clean, worth it. The air is fresh because of the trees." 
      },
      date: "2025/09/22",
      avatar:
        "https://www.svgrepo.com/show/341481/web-internet-seo-browser-network-website-url.svg",
      images: SAMPLE_IMAGES,
    },
    {
      name: { ar: "انسة انس", en: "Ansi Ans" },
      rating: 5,
      body: { 
         ar: "المكان خرافي والخدمة ممتازة، انصح بيه وبشدة", 
         en: "The place is legendary and the service is excellent, highly recommend it." 
      },
      date: "2025/09/22",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      images: [],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Standard Header */}
      <HeaderSection title={t('headers.reviews')} showBackButton={true} showLogo={false} onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryArea}>
          <ThemedText style={styles.bigRatingText}>4.6</ThemedText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SolarStarBold
                key={i}
                size={normalize(32)}
                color={i <= 4 ? "#15AB64" : "#E5E7EB"}
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
          {reviews.map((rev, idx) => {
            const reviewerName = isArabic ? rev.name.ar : rev.name.en;
            const reviewBody = isArabic ? rev.body.ar : rev.body.en;

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
    fontFamily: "LamaSans-Black",
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
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  userInfoRow: {
    alignItems: "flex-start",
    flex: 1,
  },
  nameAndBody: { flex: 1 },
  reviewerNameText: {
    fontSize: normalize(16),
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  revBodyText: {
    fontSize: normalize(14),
    color: "#6B7280",
    marginTop: normalize(8),
    lineHeight: normalize(22),
    fontFamily: "LamaSans-Regular",
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
    fontFamily: "LamaSans-Medium",
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
    fontFamily: "LamaSans-Black",
    color: "#111827",
    marginBottom: normalize(8),
  },
  inputStarsRow: { flexDirection: "row", gap: 12 },
});
