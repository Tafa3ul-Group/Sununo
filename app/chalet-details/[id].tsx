import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button"; // Added import
import { Colors, normalize } from "@/constants/theme";
import { useGetChaletDetailsQuery } from "@/store/api/apiSlice";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
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
import Svg, { Path } from "react-native-svg";

function SolarStarBold({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M9.153 5.408C10.42 3.136 11.053 2 12 2s1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182s.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.776c.292.94-.546 1.921-2.223 3.882l-.434.507c-.476.557-.715.836-.822 1.18c-.107.345-.071.717.001 1.46l.066.677c.253 2.617.38 3.925-.386 4.506s-1.918.051-4.22-1.009l-.597-.274c-.654-.302-.981-.452-1.328-.452s-.674.15-1.328.452l-.596.274c-2.303 1.06-3.455 1.59-4.22 1.01c-.767-.582-.64-1.89-.387-4.507l.066-.676c.072-.744.108-1.116 0-1.46c-.106-.345-.345-.624-.821-1.18l-.434-.508c-1.677-1.96-2.515-2.941-2.223-3.882S3.58 8.328 6.04 7.772l.636-.144c.699-.158 1.048-.237 1.329-.45s.46-.536.82-1.182z"
      />
    </Svg>
  );
}

// Professional ReviewCard Component
const ReviewCard = ({
  name,
  rating,
  comment,
  avatar,
  images = [],
  date,
}: {
  name: string;
  rating: string;
  comment: string;
  avatar: any;
  images?: any[];
  date: string;
}) => {
  return (
    <View style={reviewStyles.card}>
      {/* Top Header: Rating (Left) and User Info (Right) */}
      <View style={reviewStyles.header}>
        <View style={reviewStyles.ratingRow}>
          <SolarStarBold color="#035DF9" size={24} />
          <Text style={reviewStyles.ratingText}>{rating}</Text>
        </View>

        <View style={reviewStyles.profileRow}>
          <Text style={reviewStyles.name}>{name}</Text>
          <Image source={avatar} style={reviewStyles.avatar} />
        </View>
      </View>

      {/* Comment Section */}
      <Text style={reviewStyles.comment}>{comment}</Text>

      {/* Image Gallery */}
      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={reviewStyles.imageGallery}
          style={{ flexDirection: "row-reverse" }}
        >
          {images.map((img, idx) => (
            <Image key={idx} source={img} style={reviewStyles.galleryImage} />
          ))}
        </ScrollView>
      )}

      {/* Date */}
      <Text style={reviewStyles.date}>{date}</Text>
    </View>
  );
};

const reviewStyles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: normalize.radius(24),
    padding: normalize.width(16),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: normalize.height(16),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize.height(12),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(6),
  },
  ratingText: {
    fontSize: normalize.font(18),
    fontWeight: "900",
    color: "#111827",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(12),
  },
  name: {
    fontSize: normalize.font(18),
    fontWeight: "800",
    color: "#111827",
  },
  avatar: {
    width: normalize.width(55),
    height: normalize.width(55),
    borderRadius: normalize.radius(27.5),
    backgroundColor: "#F3F4F6",
  },
  comment: {
    fontSize: normalize.font(15),
    lineHeight: normalize.font(24),
    color: "#4B5563",
    fontWeight: "500",
    textAlign: "right",
    marginBottom: normalize.height(16),
  },
  imageGallery: {
    flexDirection: "row-reverse",
    gap: normalize.width(8),
    paddingBottom: normalize.height(12),
  },
  galleryImage: {
    width: normalize.width(80),
    height: normalize.width(80),
    borderRadius: normalize.radius(10),
  },
  date: {
    fontSize: normalize.font(14),
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "right",
    marginTop: normalize.height(4),
  },
});

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
      uri: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
    },
    {
      uri: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const startAutoPlay = () => {
      timerRef.current = setInterval(() => {
        let nextIndex = activeIndex + 1;
        if (nextIndex >= images.length) {
          nextIndex = 0;
        }
        scrollRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
        setActiveIndex(nextIndex);
      }, 3000);
    };

    startAutoPlay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIndex, images.length]);

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
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const newIndex = Math.round(x / SCREEN_WIDTH);
              if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
              }
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
                <SolarStarBold color="#035DF9" size={24} />
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
                <Text style={styles.specText} numberOfLines={1}>بستان مع بيت</Text>
              </View>
              <View style={styles.specTag}>
                <Text style={styles.specText} numberOfLines={1}>300 م</Text>
              </View>
              <View style={styles.specTag}>
                <Text style={styles.specText} numberOfLines={1}>1 حمام</Text>
              </View>
              <View style={styles.specTag}>
                <Text style={styles.specText} numberOfLines={1}>3 غرف</Text>
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
                <SolarStarBold color="white" size={18} />
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
              <ReviewCard
                name="انسة انس"
                rating="4"
                comment="خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير"
                avatar={require("../../assets/temp_mock/reviewer_1_1774440162768.png")}
                date="2025/09/22"
                images={[
                  require("../../assets/temp_mock/media__1774436293910.png"),
                  require("../../assets/temp_mock/media__1774436996725.png"),
                  require("../../assets/temp_mock/media__1774438026848.png"),
                  require("../../assets/temp_mock/media__1774439027729.png"),
                ]}
              />
              <ReviewCard
                name="انسة انس"
                rating="5"
                comment="خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير"
                avatar={require("../../assets/temp_mock/reviewer_2_1774440178616.png")}
                date="2025/09/22"
              />
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
    top: normalize.height(50), // Standard safe area space
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
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: normalize.width(8),
    marginBottom: normalize.height(8),
  },
  specTag: {
    backgroundColor: "#F0F7FF",
    paddingHorizontal: normalize.width(10),
    paddingVertical: normalize.height(8),
    borderRadius: normalize.radius(10),
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
    right: normalize.width(95), // Reduced from 110 per request
    top: "15%",
    alignItems: "flex-end",
    justifyContent: "center",
    height: "70%",
  },
  hostLabelText: {
    fontSize: normalize.font(13),
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 0, // Reduced from 2 per request
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
    width: (SCREEN_WIDTH - normalize.width(32) - normalize.width(45)) / 4, // 4 items per row accounting for grid gap
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
