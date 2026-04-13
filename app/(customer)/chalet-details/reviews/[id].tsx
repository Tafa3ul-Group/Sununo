import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { RatingBackground } from "@/components/icons/rating-background";
import {
  SolarAltArrowDownLinear,
  SolarStarBold,
  SolarStarLinear,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { HeaderSection } from '@/components/header-section';
import { ReviewSubmissionSheet } from "@/components/user/review-submission-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=400",
  "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=400",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
];

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams();
  const [userRating, setUserRating] = useState(0);
  const reviewSheetRef = React.useRef<BottomSheetModal>(null);

  const openReviewSheet = () => {
    reviewSheetRef.current?.present();
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    console.log('Submitted:', { rating, comment });
    setUserRating(rating);
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Standard Header */}
      <HeaderSection title="المراجعات" showBackButton showLogo />

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        <View style={styles.summaryArea}>
          <ThemedText style={styles.bigRatingText}>4.6</ThemedText>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SolarStarBold
                key={i}
                size={32}
                color={i <= 4 ? "#15AB64" : "#E5E7EB"}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.secondarySplitBtn}>
            <View style={styles.splitTextPart}>
              <ThemedText style={styles.splitLabel}>اخر التقييمات</ThemedText>
            </View>
            <View style={styles.splitIconPart}>
              <SolarAltArrowDownLinear size={18} color="#035DF9" />
            </View>
          </View>
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
        <TouchableOpacity style={styles.footerOverlayContent} onPress={openReviewSheet} activeOpacity={0.9}>
          <View style={styles.whiteInputPill}>
            <ThemedText style={styles.questionTitle}>
              شكد تقيم تجربتك؟
            </ThemedText>
            <View style={styles.inputStarsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i}>
                  {i <= userRating ? (
                    <SolarStarBold size={32} color="#15AB64" />
                  ) : (
                    <SolarStarLinear size={32} color="#15AB64" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ReviewSubmissionSheet ref={reviewSheetRef} onSubmit={handleReviewSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  summaryArea: { alignItems: "center", marginVertical: 35 },
  bigRatingText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 5,
  },
  starsRow: { flexDirection: "row", gap: 6 },
  filterContainer: {
    paddingHorizontal: 20,
    alignItems: "flex-end",
    marginBottom: 25,
  },
  secondarySplitBtn: {
    flexDirection: "row-reverse",
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  splitTextPart: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  splitLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  splitIconPart: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  revCardFlat: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
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
    gap: 4,
    marginTop: 4,
  },
  rateNumText: { fontSize: 16, fontWeight: "900", color: "#111827" },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    justifyContent: "flex-end",
  },
  nameAndBody: { alignItems: "flex-end", marginRight: 15, flex: 1 },
  reviewerNameText: { fontSize: 16, fontWeight: "900", color: "#111827" },
  revBodyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "right",
    lineHeight: 22,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  userAvatarImg: { width: "100%", height: "100%" },
  galleryWrapper: { marginTop: 20 },
  imgGallery: { flexDirection: "row" },
  thumb: { width: 110, height: 85, borderRadius: 14, marginRight: 12 },
  dateWrapper: { marginTop: 20, alignItems: "flex-start" },
  dateTextLabel: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },

  footerSticky: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  footerBgImage: {
    position: "absolute",
    bottom: -25, // Push deeper to hide bottom whitespace
    width: "100%",
    height: "100%",
  },
  footerOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 35, // Adjust centering for the lower height
  },
  whiteInputPill: {
    backgroundColor: "#F0F6F5",
    borderRadius: 50,
    height: 90,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  inputStarsRow: { flexDirection: "row", gap: 12 },
});
