import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button"; // Added import
import { Colors, normalize } from "@/constants/theme";
import { useGetChaletDetailsQuery } from "@/store/api/apiSlice";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPER_HEIGHT = 500;

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { data: chalet, isLoading } = useGetChaletDetailsQuery(id as string);

  // Mock data as per USER image for perfect match
  const chaletName = "شالية الاروعى علة الطلاق";
  const chaletLocation = "البصرة - الجزائر";
  const rating = "4.5";
  const images = [
    {
      uri: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000",
    },
    {
      uri: "https://images.unsplash.com/photo-1542314831-068cd1dbfe81?auto=format&fit=crop&q=80&w=1000",
    },
    {
      uri: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Safety check to prevent crashes if API fails
  const guestCount = chalet?.maxGuests || 15;
  const areaValue = chalet?.area || 1200;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Top Section with Swiper */}
        <View style={styles.swiperContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveIndex(Math.round(x / SCREEN_WIDTH));
            }}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            {images.map((imgSource: any, index: number) => (
              <Image
                key={index}
                source={imgSource}
                style={styles.swiperImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Back Button */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Image
                source={require("@/assets/button/back.svg")}
                style={styles.backIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Custom Pagination Dots */}
          <View style={styles.swiperFooter}>
            <View style={styles.pagination}>
              {images.map((_: any, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === activeIndex ? "#035DF9" : "rgba(255,255,255,0.5)",
                      width: 10,
                      height: 10,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Overlapping Content Section */}
        <View style={styles.contentWrapper}>
          <View style={styles.premiumCard}>
            <View
              style={[
                styles.infoRow,
                { flexDirection: isRTL ? "row" : "row-reverse" },
              ]}
            >
              {/* Rating on the Left (in RTL) */}
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={24} color="#035DF9" />
                <Text style={styles.ratingValueText}>4.5</Text>
              </View>

              {/* Title & Location on the Right (in RTL) */}
              <View
                style={{
                  alignItems: "flex-end",
                }}
              >
                <Text style={styles.chaletTitle}>{chaletName}</Text>
                <Text style={styles.locationText}>{chaletLocation}</Text>
              </View>
            </View>

            {/* 1. Basic Specifications Section */}
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: "right", marginTop: 10 },
              ]}
            >
              المواصفات الاساسية
            </Text>
            <View style={[styles.specsRow, { flexDirection: "row-reverse" }]}>
              <View style={styles.specTag}>
                <Text style={styles.specText}>بستان مع بيت</Text>
              </View>
              <View style={styles.specTag}>
                <Text style={styles.specText}>300 م</Text>
              </View>
              <View style={styles.specTag}>
                <Text style={styles.specText}>1 حمام</Text>
              </View>
              <View style={styles.specTag}>
                <Text style={styles.specText}>3 غرف</Text>
              </View>
            </View>

            {/* 2. Amenities Section */}
            <View
              style={[
                styles.sectionHeader,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text style={styles.sectionTitle}>الميزات</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>الكل</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.amenitiesGrid,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              {[
                {
                  label: "مسبح",
                  icon: "water",
                  shape: require("@/assets/shapes/blue.svg"),
                },
                {
                  label: "واي فاي",
                  icon: "wifi",
                  shape: require("@/assets/shapes/pink.svg"),
                },
                {
                  label: "تكييف هواء",
                  icon: "snow",
                  shape: require("@/assets/shapes/red.svg"),
                },
                {
                  label: "مطبخ",
                  icon: "restaurant",
                  shape: require("@/assets/shapes/green.svg"),
                },
                {
                  label: "مساحة",
                  icon: "expand",
                  shape: require("@/assets/shapes/blue.svg"),
                },
                {
                  label: "موقف",
                  icon: "car",
                  shape: require("@/assets/shapes/green.svg"),
                },
                {
                  label: "حديقة",
                  icon: "leaf",
                  shape: require("@/assets/shapes/red.svg"),
                },
                {
                  label: "تلفاز",
                  icon: "tv",
                  shape: require("@/assets/shapes/pink.svg"),
                },
              ].map((item, idx) => (
                <View key={idx} style={styles.amenityItem}>
                  <View style={styles.amenityIconWrapper}>
                    <Image
                      source={item.shape}
                      style={styles.amenityShape}
                      contentFit="contain"
                    />
                    <View style={styles.amenityIconCentered}>
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color="white"
                      />
                    </View>
                  </View>
                  <Text style={styles.amenityLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* 3. Overview Section */}
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: isRTL ? "right" : "left", marginTop: 24 },
              ]}
            >
              نظرة عامة
            </Text>
            <Text
              style={[
                styles.overviewText,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم
              في صناعات المطابع ودور النشر. كان لوريم إيبسوم ولايزال المعيار
              للنص الشكلي منذ القرن الخامس عشر عندما قامت مطبعة مجهولة برص
              مجموعة من الأحرف بشكل عشوائي أخذتها من نص، لتكوّن كتيب بمثابة دليل
              أو مرجع شكلي....
            </Text>

            <PrimaryButton
              label="اقرأ المزيد"
              onPress={() => {}}
              style={{ marginTop: 20, alignSelf: "center", width: "100%" }}
            />

            {/* 4. Location Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الموقع</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>افتح الخارطة</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mapContainer}>
              <Image
                source={require("../../assets/temp_mock/map_preview_1774440194241.png")}
                style={styles.mapImage}
                resizeMode="cover"
              />
              <View style={styles.mapFooter}>
                <Text style={styles.mapLocationText}>البصرة - ابة الخصيب</Text>
              </View>
            </View>

            {/* 5. Host Section */}
            <View style={styles.hostCardContainer}>
              <View style={styles.hostJaggedCard}>
                <Image
                  source={require("../../assets/tabs/contact.svg")}
                  style={styles.hostStickerImage}
                  contentFit="contain"
                />

                {/* Text Overlay on Host Card */}
                <View style={styles.hostOverlayContainer}>
                  <Text style={styles.hostLabelText}>المضيف</Text>
                  <Text style={styles.hostNameText}>انيس انس</Text>
                </View>
              </View>
            </View>

            {/* 6. Review Stats Row */}
            <View
              style={[
                styles.reviewStatsRow,
                { flexDirection: isRTL ? "row" : "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.ratingPill,
                  { flexDirection: isRTL ? "row" : "row-reverse" },
                ]}
              >
                <Text style={styles.ratingPillValue}>4.5</Text>
                <Ionicons name="star" size={18} color="white" />
              </View>

              <SecondaryButton
                iconLabel="45"
                label="مراجعة"
                onPress={() => {}}
                isActive={true}
                style={{ width: 150 }}
              />
            </View>

            {/* 7. Reviews List Section */}
            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
              <Text style={styles.sectionTitle}>المراجعات</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>الكل</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewsList}>
              {[
                {
                  name: "انسة انس",
                  rating: "4.5",
                  comment: "خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير",
                  avatar: require("../../assets/temp_mock/reviewer_1_1774440162768.png"),
                },
                {
                  name: "انسة انس",
                  rating: "4.5",
                  comment: "خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير",
                  avatar: require("../../assets/temp_mock/reviewer_2_1774440178616.png"),
                },
              ].map((review, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.reviewItem,
                    { flexDirection: isRTL ? "row" : "row-reverse" },
                  ]}
                >
                  <Image source={review.avatar} style={styles.reviewerAvatar} />
                  <View
                    style={[
                      styles.reviewTextContent,
                      { alignItems: isRTL ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text style={styles.reviewerName}>{review.name}</Text>
                    <View
                      style={[
                        styles.reviewRatingRow,
                        { flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <Ionicons name="star" size={16} color="#035DF9" />
                      <Text style={styles.reviewRatingValue}>
                        {review.rating}
                      </Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 8. Add Review Button */}
            <PrimaryButton
              label="إضافة مراجعة"
              onPress={() => {}}
              style={{ marginTop: 32, alignSelf: "center", width: "100%" }}
            />

            {/* 9. Information of Interest Section */}
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: isRTL ? "right" : "left", marginTop: 40 },
              ]}
            >
              معلومات تهمك
            </Text>
            <View
              style={[
                styles.infoInterestGrid,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              {[
                { label: "شروط الشاليه", icon: "document-text-outline" },
                { label: "سياسة الالغاء", icon: "alert-circle-outline" },
                { label: "الامان والخصوصية", icon: "shield-checkmark-outline" },
                { label: "وقت الدخول", icon: "enter-outline" },
                { label: "وقت الخروج", icon: "exit-outline" },
                { label: "مبلغ التأمين", icon: "cash-outline" },
                { label: "مرافق قريبة", icon: "location-outline" },
                { label: "الصيانة", icon: "construct-outline" },
              ].map((item, idx) => (
                <View key={idx} style={styles.interestItemExtended}>
                  <View style={styles.interestIconWrapperLarge}>
                    <Image
                      source={require("@/assets/shapes/info.svg")}
                      style={styles.amenityShape}
                      contentFit="contain"
                    />
                    <View style={styles.amenityIconCentered}>
                      <Ionicons
                        name={item.icon as any}
                        size={28}
                        color="white"
                      />
                    </View>
                  </View>
                  <Text style={styles.interestLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View
        style={[
          styles.fixedFooter,
          { flexDirection: isRTL ? "row" : "row-reverse" },
        ]}
      >
        <View style={styles.footerPriceContainer}>
          <Text style={styles.footerPrice}>30,000 IQD</Text>
          <Text style={styles.footerPriceDetails}>
            شفت صباحي . 23 اكتوبر . 5 بالغين
          </Text>
        </View>
        <PrimaryButton
          label="احجز الان"
          onPress={() => {}}
          style={{ paddingHorizontal: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  swiperContainer: {
    height: SWIPER_HEIGHT,
    width: "100%",
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  swiperImage: {
    width: SCREEN_WIDTH,
    height: SWIPER_HEIGHT,
  },
  headerActions: {
    position: "absolute",
    top: normalize.height(20),
    left: normalize.width(16),
    zIndex: 10,
  },
  backButton: {
    width: normalize.width(44),
    height: normalize.width(44),
    borderRadius: normalize.radius(22),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: "70%",
    height: "70%",
  },
  swiperFooter: {
    position: "absolute",
    bottom: normalize.height(30),
    width: "100%",
    paddingHorizontal: normalize.width(20),
  },
  footerRow: {
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  paginationSection: {
    flexDirection: "row",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: normalize.width(8),
    width: "100%",
  },
  dot: {
    width: normalize.width(10),
    height: normalize.width(10),
    borderRadius: normalize.radius(5),
  },
  contentWrapper: {
    marginTop: 0,
  },
  premiumCard: {
    backgroundColor: "white",
    padding: normalize.width(16),
  },
  infoRow: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: normalize.height(6),
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(4),
    marginTop: normalize.height(4),
  },
  ratingValueText: {
    fontSize: normalize.font(18),
    fontWeight: "800",
    color: "#111827",
  },
  chaletTitle: {
    fontSize: normalize.font(22),
    fontWeight: "900",
    color: "#111827",
    textAlign: "right",
  },
  locationText: {
    fontSize: normalize.font(15),
    color: "#6B7280",
    fontWeight: "500",
    marginTop: normalize.height(2),
    textAlign: "right",
  },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: normalize.height(24),
    marginBottom: normalize.height(10),
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontWeight: "800",
    color: "#111827",
    marginBottom: normalize.height(10),
  },
  seeAllText: {
    fontSize: normalize.font(14),
    color: "#6B7280",
    fontWeight: "600",
  },
  specsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: normalize.width(8),
    marginBottom: normalize.height(8),
  },
  specTag: {
    backgroundColor: "#F0F7FF",
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(12),
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  specText: {
    fontSize: normalize.font(15),
    fontWeight: "500",
    color: "#4B5563",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  amenityItem: {
    width: (SCREEN_WIDTH - 64 - 48) / 4, // 4 items per row
    alignItems: "center",
    marginBottom: 16,
  },
  amenityIconWrapper: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  amenityShape: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  amenityIconCentered: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4B5563",
    fontWeight: "500",
  },
  mapContainer: {
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  mapImage: {
    width: "100%",
    height: 180,
  },
  mapFooter: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
  },
  mapLocationText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  hostCardContainer: {
    marginTop: 24,
    paddingHorizontal: 0,
    width: "100%",
  },
  hostJaggedCard: {
    width: "100%",
    aspectRatio: 339 / 80,
    position: "relative",
    justifyContent: "center",
  },
  hostStickerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  hostOverlayContainer: {
    position: "absolute",
    right: normalize.width(110), // Increased from 90 to 110 for better spacing
    top: "15%",
    alignItems: "flex-end",
    justifyContent: "center",
    height: "70%",
  },
  hostLabelText: {
    fontSize: normalize.font(13),
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: normalize.height(2),
  },
  hostNameText: {
    fontSize: normalize.font(18),
    fontWeight: "900",
    color: "#111827",
  },
  hostAvatarOverlay: {
    position: "absolute",
    right: normalize.width(25),
    top: "15%",
    width: normalize.width(55),
    height: normalize.width(55),
    borderRadius: normalize.radius(27.5),
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
  },
  hostAvatarImage: {
    width: "100%",
    height: "100%",
  },
  reviewStatsRow: {
    marginTop: 32,
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingPill: {
    backgroundColor: "#035DF9",
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minWidth: 80,
  },
  ratingPillValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  reviewsButtonContainer: {
    width: 150,
  },
  reviewsList: {
    marginTop: 12,
    gap: 24,
  },
  reviewItem: {
    gap: 16,
  },
  reviewerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
  },
  reviewTextContent: {
    flex: 1,
    gap: 4,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  reviewRatingRow: {
    alignItems: "center",
    gap: 6,
  },
  reviewRatingValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  reviewComment: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 4,
  },
  infoInterestGrid: {
    flexWrap: "wrap",
    gap: 16,
    marginTop: 16,
  },
  interestItemExtended: {
    width: (SCREEN_WIDTH - 48 - 32) / 4, // 4 items per row accounting for grid gap
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  interestIconWrapperLarge: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  interestJaggedCard: {
    backgroundColor: "#9CA3AF",
    width: 60,
    height: 60,
    borderRadius: 20,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  interestIconCircle: {
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  interestLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },
  footerPriceDetails: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    marginTop: 2,
  },
  bookNowText: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
});
