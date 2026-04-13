import { SectionIcon } from "@/components/icons/section-icon";
import {
  SolarClockCircleBold,
  SolarForbiddenBold,
  SolarHome2Bold,
  SolarKeyBold,
  SolarMapPointBold,
  SolarShieldCheckBold,
  SolarStarBold,
  SolarWaterBold,
  SolarWifiBold,
  SolarWindBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { ReviewSubmissionSheet } from "@/components/user/review-submission-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES = {
  blue: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

const SectionHeader = ({
  title,
}: {
  title: string;
}) => (
  <View style={styles.sectionHeaderContainer}>
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
  </View>
);

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const reviewSheetRef = React.useRef<BottomSheetModal>(null);

  const openReviewSheet = () => {
    reviewSheetRef.current?.present();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* صور الشاليه */}
        <View style={styles.imageHeader}>
          <ScrollView
            horizontal
            pagingEnabled
            onScroll={(e) =>
              setActiveImage(
                Math.ceil(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
              )
            }
          >
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push({ pathname: '/(customer)/chalet-details/gallery', params: { startIndex: 0 } })}
            >
                <Image
                    source={{
                        uri: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                    }}
                    style={styles.headerImage}
                />
            </TouchableOpacity>
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => router.push({ pathname: '/(customer)/chalet-details/gallery', params: { startIndex: 1 } })}
            >
                <Image
                    source={{
                        uri: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                    }}
                    style={styles.headerImage}
                />
            </TouchableOpacity>
          </ScrollView>
          <CircleBackButton style={styles.backBtnOriginal} />
          <View style={styles.paginationDots}>
            {[1, 2, 3, 4, 5].map((_, i) => (
              <View
                key={i}
                style={[styles.dot, activeImage === i && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        <View style={styles.infoWrapper}>
          {/* العنوان (النجمة يساراً) */}
          <View style={styles.titleSection}>
            <View style={styles.ratingGroupLeft}>
              <SolarStarBold size={14} color="#035DF9" />
              <ThemedText style={styles.ratingVal}>4.5</ThemedText>
            </View>
            <View style={{ alignItems: "flex-end", flex: 1 }}>
              <ThemedText style={styles.mainTitle}>
                شالية الاروع علة الطلاق
              </ThemedText>
              <ThemedText style={styles.locationSub}>
                البصرة - الجزائر
              </ThemedText>
            </View>
          </View>

          {/* المواصفات الأساسية */}
          <SectionHeader title="المواصفات الاساسية" />
          <View style={styles.specsRow}>
            {["بستان مع بيت", "300 م", "1 حمام", "3 غرف"].map((d, i) => (
              <View key={i} style={styles.specTag}>
                <ThemedText style={styles.specText}>{d}</ThemedText>
              </View>
            ))}
          </View>

          {/* المرافق */}
          <View style={styles.facilitiesHeader}>
            <TouchableOpacity
              onPress={() => router.push(`/chalet-details/facilities/${id}`)}
            >
              <ThemedText style={styles.viewAllText}>الكل</ThemedText>
            </TouchableOpacity>
            <SectionHeader title="المرافق" />
          </View>
          <View style={styles.facilitiesGrid}>
            {[
              { label: "مسبح", Icon: SolarWaterBold, color: "#035DF9" },
              { label: "واي فاي", Icon: SolarWifiBold, color: "#EF79D7" },
              { label: "تكييف هواء", Icon: SolarWindBold, color: "#F64200" },
              { label: "مطبخ", Icon: SolarHome2Bold, color: "#15AB64" },
              { label: "تكييف هواء", Icon: SolarWindBold, color: "#F64200" },
              { label: "مطبخ", Icon: SolarHome2Bold, color: "#15AB64" },
              { label: "مسبح", Icon: SolarWaterBold, color: "#035DF9" },
              { label: "واي فاي", Icon: SolarWifiBold, color: "#EF79D7" },
            ].map((f, i) => (
              <View key={i} style={styles.facilityCell}>
                <View style={styles.shapeCont}>
                  <Svg height={55} width={55} viewBox="0 0 60 60">
                    <Path d={SHAPES.blue} fill={f.color} />
                  </Svg>
                  <View style={styles.iconInShape}>
                    <f.Icon size={22} color="white" />
                  </View>
                </View>
                <ThemedText style={styles.facilityLabelText}>
                  {f.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* نظرة عامة */}
          <SectionHeader title="نظرة عامة" />
          <ThemedText style={styles.descriptionText}>
            هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم
            في صناعات المطابع ودور النشر. كان لوريم إيبسوم ولايزال المعيار للنص
            الشكلي منذ القرن الخامس عشر عندما قامت مطبعة مجهولة برص مجموعة من
            الأحرف بشكل عشوائي أخذتها من نص، لتكوّن كتيّب بمثابة دليل أو مرجع
            شكلي....
          </ThemedText>
          <View style={styles.readMoreWrapper}>
            <PrimaryButton
              label="اقرأ المزيد"
              onPress={() => {}}
              style={styles.readMoreComp}
            />
          </View>

          {/* الموقع */}
          <SectionHeader title="الموقع" />
          <View style={styles.mapCardFlat}>
            <View style={styles.mapInner}>
              <Image
                source={{
                  uri: "https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png",
                }}
                style={styles.mapImg}
              />
              <View style={styles.pinCenter}>
                <SolarMapPointBold size={32} color="#035DF9" />
              </View>
            </View>
            <View style={styles.mapLocLabel}>
              <ThemedText style={styles.mapLocText}>
                البصرة - ابة الخصيب
              </ThemedText>
            </View>
          </View>

          {/* المضيف (استخدام صورة الكونتاكت) */}
          <View style={styles.hostStampArea}>
            <Image
              source={require("@/assets/tabs/contact.svg")}
              style={styles.contactBanner}
              resizeMode="contain"
            />
          </View>

          {/* التقييم والمراجعات */}
          <View style={styles.ctaRowReview}>
            {/* حبة التقييم المصممة يدوياً حسب الصورة */}
            <TouchableOpacity
              style={styles.customRatingPill}
              onPress={() => router.push(`/chalet-details/reviews/${id}`)}
            >
              <SolarStarBold size={20} color="white" />
              <ThemedText style={styles.customRatingText}>4.5</ThemedText>
            </TouchableOpacity>

            <SecondaryButton
              label="مراجعة"
              iconLabel="45"
              iconPosition="right"
              isActive={true}
              onPress={() => router.push(`/chalet-details/reviews/${id}`)}
              style={{ width: 140 }}
            />
          </View>

          {/* المراجعات */}
          <SectionHeader title="المراجعات" />
          {[1, 2].map((_, i) => (
            <View key={i} style={styles.revComplexCardFlat}>
              <View style={styles.revHeaderRow}>
                <View style={styles.revRatingCorner}>
                  <SolarStarBold size={16} color="#15CB64" />
                  <ThemedText style={styles.revRateNum}>4</ThemedText>
                </View>
                <View style={styles.reviewerMeta}>
                  <ThemedText style={styles.reviewerName}>انسة انس</ThemedText>
                  <Image
                    source={require("@/assets/profile.svg")}
                    style={styles.revAvatarSmall}
                  />
                </View>
              </View>
              <ThemedText style={styles.revMessage}>
                خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.revImgSwiper}
              >
                {[1, 2, 3, 4].map((im) => (
                  <TouchableOpacity key={im} onPress={() => router.push('/(customer)/chalet-details/gallery')}>
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1502082559145?w=200",
                      }}
                      style={styles.revPhotoThumb}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ThemedText style={styles.revTimeText}>2025/09/22</ThemedText>
            </View>
          ))}

          <View style={styles.addReviewAction}>
            <PrimaryButton
              label="إضافة مراجعة"
              onPress={openReviewSheet}
              style={styles.addBtnFinal}
            />
          </View>

          {/* معلومات تهمك */}
          <SectionHeader title="معلومات تهمك" />
          <View style={styles.infoIconsGrid}>
            {[
              { label: "شروط الشاليه", Icon: SolarKeyBold },
              { label: "سياسة الالغاء", Icon: SolarForbiddenBold },
              { label: "الامان", Icon: SolarShieldCheckBold },
              { label: "وقت الدخول والخروج", Icon: SolarClockCircleBold },
            ].map((item, i) => (
              <View key={i} style={styles.infoIconCell}>
                <View style={styles.infoGearWrap}>
                  <Svg width={55} height={55} viewBox="0 0 60 60">
                    <Path d={SHAPES.blue} fill="#BDBDBD" />
                  </Svg>
                  <View style={styles.infoGearIcon}>
                    <item.Icon size={24} color="white" />
                  </View>
                </View>
                <ThemedText style={styles.infoLabelText}>
                  {item.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* قد يعجبك ايضا */}
          <SectionHeader title="قد يعجبك ايضا" />
          <HorizontalSwiper
            data={[1, 2, 3].map((_, index) => ({
              id: `${index}`,
              title: "شالية الاروع علة الطلاق",
              location: "البصرة - الجزائر",
              price: "30,000",
              rating: 4.5,
              image:
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
              color: ["#035DF9", "#15AB64", "#F64300"][index % 3],
            }))}
            onPressCard={(id) => router.push(`/chalet-details/${id}`)}
          />
        </View>
      </ScrollView>

      {/* الفوتر Flat */}
      <View style={styles.flatUltimateFooter}>
        <View style={styles.footerBtnSide}>
          <PrimaryButton
            label="احجز الان"
            onPress={() => router.push(`/(customer)/booking/complete?id=${id}`)}
            style={styles.footerFlatBtn}
          />
        </View>
        <View style={styles.footerTextSide}>
          <ThemedText style={styles.footerPriceBig}>30,000 IQD</ThemedText>
          <View style={styles.footerMetaRow}>
            <SolarClockCircleBold size={12} color="#9CA3AF" />
            <ThemedText style={styles.footerMetaSmall}>شفت صباحي</ThemedText>
          </View>
        </View>
      </View>

      <ReviewSubmissionSheet 
        ref={reviewSheetRef} 
        onSubmit={(rating, comment) => {
          console.log('Detail Review Submit:', { rating, comment });
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  imageHeader: { width: SCREEN_WIDTH, height: 350, position: "relative" },
  headerImage: { width: SCREEN_WIDTH, height: "100%" },
  backBtnOriginal: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  paginationDots: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  activeDot: { backgroundColor: "#035DF9", width: 20 },
  infoWrapper: { padding: 20 },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 15,
  },
  ratingVal: { fontSize: 18, fontWeight: "800" },
  mainTitle: { fontSize: 22, fontWeight: "900", textAlign: "right" },
  locationSub: { fontSize: 13, color: "#6B7280", textAlign: "right" },
  sectionHeaderContainer: {
    height: 60,
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 15,
  },
  sectionIconBg: { position: "absolute", right: -20, top: 0, opacity: 0.8 },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
    paddingRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginVertical: 15,
    textAlign: "right",
  },
  specsRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  specTag: {
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  specText: { fontSize: 13, fontWeight: "700" },
  viewAllText: { fontSize: 13, color: "#6B7280", fontWeight: "700" },
  facilitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  facilitiesGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  facilityCell: { width: "23%", alignItems: "center", marginBottom: 20 },
  shapeCont: {
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInShape: { position: "absolute" },
  facilityLabelText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "right",
    marginTop: 5,
  },
  readMoreWrapper: { alignItems: "center", marginTop: 15 },
  readMoreComp: { width: "55%", height: 48, borderRadius: 24 },

  mapCardFlat: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  mapInner: { height: 180, borderRadius: 15, overflow: "hidden" },
  mapImg: { width: "100%", height: "100%" },
  pinCenter: { position: "absolute", top: "40%", left: "46%" },
  mapLocLabel: { paddingVertical: 10, alignItems: "center" },
  mapLocText: { fontSize: 15, fontWeight: "800" },

  hostStampArea: { marginVertical: 20, width: "100%", alignItems: "center" },
  contactBanner: { width: SCREEN_WIDTH - 40, height: 100 },

  ctaRowReview: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  customRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#035DF9",
    height: 46,
    paddingHorizontal: 20,
    borderTopLeftRadius: 23,
    borderBottomLeftRadius: 23,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    gap: 8,
  },
  customRatingText: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },

  revComplexCardFlat: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  revHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  reviewerName: { fontSize: 16, fontWeight: "900" },
  revAvatarSmall: { width: 50, height: 50, borderRadius: 25 },
  revRatingCorner: { flexDirection: "row", alignItems: "center", gap: 4 },
  revRateNum: { fontSize: 18, fontWeight: "900" },
  revMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginVertical: 15,
    fontWeight: "600",
    textAlign: "right",
  },
  revImgSwiper: { gap: 10 },
  revPhotoThumb: { width: 130, height: 90, borderRadius: 12, marginRight: 10 },
  revTimeText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 10,
    textAlign: "left",
  },

  addReviewAction: { alignItems: "center", marginVertical: 20 },
  addBtnFinal: { width: "80%", height: 48, borderRadius: 24 },
  infoIconsGrid: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  infoIconCell: { width: "23%", alignItems: "center" },
  infoGearWrap: {
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  infoGearIcon: { position: "absolute" },
  infoLabelText: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },

  relatedRow: { marginTop: 10 },
  relatedCardFlatFinal: {
    width: SCREEN_WIDTH * 0.82,
    height: 140,
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    flexDirection: "row",
    padding: 12,
    marginRight: 20,
  },
  relInfoLeft: { flex: 1, justifyContent: "space-between" },
  relFavBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  relChaletTitle: { fontSize: 16, fontWeight: "900", textAlign: "right" },
  relChaletLoc: { fontSize: 12, color: "#6B7280", textAlign: "right" },
  relBottomMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  relRatingBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  relRatingNum: { fontSize: 14, fontWeight: "800", color: "#15CB64" },
  relChaletPrice: { fontSize: 13, fontWeight: "900" },
  relImgRight: { width: 100, height: 100, marginLeft: 10 },
  relImgBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#15AB64",
    overflow: "hidden",
  },
  relImgMain: { width: "100%", height: "100%" },

  flatUltimateFooter: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 110,
    backgroundColor: "white",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerTextSide: { alignItems: "flex-end", flex: 1 },
  footerPriceBig: { fontSize: 18, fontWeight: "900", marginBottom: 4 },
  footerMetaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  footerMetaSmall: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  vDivider: {
    width: 1,
    height: 10,
    backgroundColor: "#BDBDBD",
    marginHorizontal: 4,
  },
  footerBtnSide: { width: 180 },
  footerFlatBtn: {
    height: 76,
    borderRadius: normalize.radius(38),
    alignSelf: "stretch",
  },
});
