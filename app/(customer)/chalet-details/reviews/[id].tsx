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
import { Stack, useLocalSearchParams } from "expo-router";
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
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const [userRating, setUserRating] = useState(0);
  const [filterValue, setFilterValue] = useState("latest");
  const reviewSheetRef = useRef<BottomSheetModal>(null);

  const filterOptions = [
    { label: "اخر التقييمات", value: "latest" },
    { label: "الاعلى التقييمات", value: "highest" },
    { label: "الادنى التقييمات", value: "lowest" },
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
      name: "انسة انس",
      rating: 4,
      body: "خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير",
      date: "2025/09/22",
      avatar:
        "https://www.svgrepo.com/show/341481/web-internet-seo-browser-network-website-url.svg",
      images: SAMPLE_IMAGES,
    },
    {
      name: "انسة انس",
      rating: 5,
      body: "المكان خرافي والخدمة ممتازة، انصح بيه وبشدة",
      date: "2025/09/22",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      images: [],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Standard Header */}
      <HeaderSection title={t('headers.reviews')} showBackButton showLogo={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
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

        <View style={styles.filterContainer}>
          <SecondarySelect
            options={filterOptions}
            value={filterValue}
            onSelect={setFilterValue}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {reviews.map((rev, idx) => (
            <View key={idx} style={styles.revCardFlat}>
              <View style={styles.revHeader}>
                <View style={styles.ratingBadge}>
                  <SolarStarBold size={14} color="#035DF9" />
                  <ThemedText style={styles.rateNumText}>
                    {rev.rating}
                  </ThemedText>
                </View>
                <View style={styles.userInfoRow}>
                  <View style={styles.nameAndBody}>
                    <ThemedText style={styles.reviewerNameText}>
                      {rev.name}
                    </ThemedText>
                    <ThemedText style={styles.revBodyText}>
                      {rev.body}
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
                    style={styles.imgGallery}
                  >
                    {rev.images.map((imgUri, imIdx) => (
                      <Image
                        key={imIdx}
                        source={{ uri: imgUri }}
                        style={styles.thumb}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={styles.dateWrapper}>
                <ThemedText style={styles.dateTextLabel}>{rev.date}</ThemedText>
              </View>
            </View>
          ))}
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
              شكد تقيم تجربتك؟
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
    alignItems: "flex-end",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ratingBadge: {
    flexDirection: "row",
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
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    justifyContent: "flex-end",
  },
  nameAndBody: { alignItems: "flex-end", marginRight: normalize(15), flex: 1 },
  reviewerNameText: {
    fontSize: normalize(16),
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  revBodyText: {
    fontSize: normalize(14),
    color: "#6B7280",
    marginTop: normalize(8),
    textAlign: "right",
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
  imgGallery: { flexDirection: "row" },
  thumb: {
    width: normalize(110),
    height: normalize(85),
    borderRadius: normalize(14),
    marginRight: normalize(12),
  },
  dateWrapper: { marginTop: normalize(20), alignItems: "flex-start" },
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
