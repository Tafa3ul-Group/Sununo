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
import { Colors, normalize, Shadows } from "@/constants/theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image as ExpoImage } from 'expo-image';
import Svg, { Path } from "react-native-svg";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useGetCustomerChaletDetailsQuery, useGetChaletReviewsQuery, useCreateReviewMutation, useAddFavoriteMutation, useRemoveFavoriteMutation, useGetSimilarChaletsQuery, useGetChaletAddonsQuery } from "@/store/api/customerApiSlice";
import { getImageSrc } from "@/hooks/useImageSrc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES = {
  blue: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

function SectionHeader({
  title,
  isRTL
}: {
  title: string;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.sectionHeaderContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
      <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{title}</ThemedText>
    </View>
  );
}

const CARD_COLORS = ["#035DF9", "#15AB64", "#F64300"];

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [activeImage, setActiveImage] = useState(0);
  const reviewSheetRef = React.useRef<BottomSheetModal>(null);
  const bannerScrollRef = useRef<ScrollView>(null);

  // Fetch chalet details from the backend
  const { data: chaletData, isLoading } = useGetCustomerChaletDetailsQuery(chaletId);
  const { data: reviewsResponse } = useGetChaletReviewsQuery({ chaletId, page: 1, limit: 5 });
  const [createReview] = useCreateReviewMutation();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // New queries for similar chalets and addons
  const { data: similarResponse } = useGetSimilarChaletsQuery(chaletId);
  const { data: addons = [] } = useGetChaletAddonsQuery(chaletId);

  // Extract chalet info from API response
  const chalet = chaletData || {} as any;
  const chaletName = isRTL 
    ? (chalet.name?.ar || chalet.nameAr || chalet.name || '') 
    : (chalet.name?.en || chalet.nameEn || chalet.name || '');
  const chaletLocation = isRTL 
    ? (chalet.region?.name?.ar || chalet.region?.nameAr || chalet.region?.name || '') 
    : (chalet.region?.name?.en || chalet.region?.nameEn || chalet.region?.name || '');
  const chaletRating = chalet.averageRating || 0;
  const chaletPrice = chalet.basePrice ? Number(chalet.basePrice).toLocaleString() : '0';
  const chaletDescription = isRTL 
    ? (chalet.description?.ar || chalet.descriptionAr || chalet.description || '') 
    : (chalet.description?.en || chalet.descriptionEn || chalet.description || '');

  // Use chalet images from API or fallback
  const images = useMemo(() => {
    if (chalet.images && chalet.images.length > 0) {
      return chalet.images.map((img: any) => getImageSrc(img.url));
    }
    return [
      getImageSrc(null), // Placeholder
    ];
  }, [chalet.images]);

  const totalImages = images.length;
  const reviews = reviewsResponse?.data || [];
  const reviewCount = reviewsResponse?.meta?.total || reviews.length || 0;
  const hostName = chalet.owner?.name || (isRTL ? "مضيف عراقي" : "Iraqi Host");

  // Auto Play Banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => {
        const next = (prev + 1) % totalImages;
        bannerScrollRef.current?.scrollTo({ 
          x: next * SCREEN_WIDTH, 
          animated: true 
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [totalImages]);

  const openReviewSheet = () => {
    router.push(`/chalet-details/add-review/${chaletId}`);
  };

  // Amenities/Facilities from API
  const facilities = useMemo(() => {
    if (chalet.amenities && chalet.amenities.length > 0) {
      return chalet.amenities.slice(0, 4).map((amenity: any) => ({
        label: isRTL 
          ? (amenity.name?.ar || amenity.nameAr || amenity.name || '') 
          : (amenity.name?.en || amenity.nameEn || amenity.name || ''),
        Icon: SolarWaterBold,
        color: '#035DF9',
      }));
    }
    return [
      { label: t('facilities.privatePool'), Icon: SolarWaterBold, color: "#035DF9" },
      { label: t('facilities.wifi'), Icon: SolarWifiBold, color: "#EF79D7" },
      { label: t('facilities.generator'), Icon: SolarWindBold, color: "#F64200" },
      { label: t('facilities.kitchen'), Icon: SolarHome2Bold, color: "#15AB64" },
    ];
  }, [chalet.amenities, isRTL, t]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            contentContainerStyle={{ flexDirection: 'row' }}
            onScroll={(e) =>
              setActiveImage(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
              )
            }
            scrollEventThrottle={16}
          >
            {images.map((img: string, i: number) => (
                <TouchableOpacity 
                    key={i}
                    activeOpacity={0.9} 
                    onPress={() => router.push({ pathname: '/(customer)/chalet-details/gallery', params: { startIndex: i } })}
                    style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                >
                    <Image
                        source={img}
                        style={styles.headerImage}
                    />
                </TouchableOpacity>
            ))}
          </ScrollView>
          <CircleBackButton style={[styles.backBtnOriginal, isRTL ? { right: 20 } : { left: 20 }]} />
          <View style={[styles.paginationDots, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {images.map((_: string, i: number) => (
              <View
                key={i}
                style={[styles.dot, activeImage === i && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        <View style={styles.infoWrapper}>
          {/* العنوان */}
          <View style={[styles.titleSection, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <View style={[styles.ratingGroupLeft, isRTL ? { marginRight: 15 } : { marginLeft: 15 }]}>
              <SolarStarBold size={14} color="#035DF9" />
              <ThemedText style={styles.ratingVal}>{chaletRating.toFixed(1)}</ThemedText>
            </View>
            <View style={{ alignItems: isRTL ? "flex-end" : "flex-start", flex: 1 }}>
              <ThemedText style={[styles.mainTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {chaletName}
              </ThemedText>
              <ThemedText style={[styles.locationSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {chaletLocation}
              </ThemedText>
            </View>
          </View>

          {/* المواصفات الأساسية */}
          <SectionHeader title={t('chalet.details.specs')} isRTL={isRTL} />
          <View style={[styles.specsRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {[
              { label: `${chalet.area || 0} م`, id: 'area' },
              { label: t('facilities.bathroom') + ` ${chalet.bathrooms || 0}`, id: 'bath' },
              { label: `${chalet.bedrooms || 0} غرف`, id: 'rooms' },
            ].map((d, i) => (
              <View key={i} style={styles.specTag}>
                <ThemedText style={styles.specText}>{d.label}</ThemedText>
              </View>
            ))}
          </View>

          {/* المرافق */}
          <View style={[styles.facilitiesHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <TouchableOpacity
              onPress={() => router.push(`/chalet-details/facilities/${chaletId}`)}
            >
              <ThemedText style={styles.viewAllText}>{t('home.seeAll')}</ThemedText>
            </TouchableOpacity>
            <SectionHeader title={t('chalet.details.facilities')} isRTL={isRTL} />
          </View>
          <View style={[styles.facilitiesGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {facilities.map((f: any, i: number) => (
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
          <SectionHeader title={t('chalet.details.overview')} isRTL={isRTL} />
          <ThemedText style={[styles.descriptionText, { textAlign: isRTL ? "right" : "left" }]}>
            {chaletDescription || (isRTL 
              ? "هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم في صناعات المطابع ودور النشر..." 
              : "Lorem ipsum is simply dummy text of the printing and typesetting industry...")}
          </ThemedText>
          <View style={styles.readMoreWrapper}>
            <PrimaryButton
              label={t('chalet.details.readMore')}
              onPress={() => {}}
              style={styles.readMoreComp}
              height={54}
            />
          </View>

          {/* الموقع */}
          <SectionHeader title={t('chalet.details.location')} isRTL={isRTL} />
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
                {isRTL ? "البصرة - ابي الخصيب" : "Basra - Abu Al-Khaseeb"}
              </ThemedText>
            </View>
          </View>

          {/* المضيف */}
          <View style={styles.hostStampArea}>
            <View style={[styles.hostHeaderFixed, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
               <View style={[styles.hostInfoSide, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <ThemedText style={styles.hostLabelFixed}>{isRTL ? 'المضيف' : 'Host'}</ThemedText>
                  <ThemedText style={styles.hostNameFixed}>{hostName}</ThemedText>
               </View>
               <View style={styles.hostAvatarWrap}>
                  <ExpoImage 
                    source={require("@/assets/profile.svg")} 
                    style={styles.hostAvatarImgFixed} 
                  />
               </View>
            </View>
            <ExpoImage
              source={require("@/assets/tabs/contact.svg")}
              style={styles.contactBanner}
              contentFit="contain"
            />
          </View>

          {/* التقييم والمراجعات */}
          <View style={[styles.ctaRowReview, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <TouchableOpacity
              style={styles.customRatingPill}
              onPress={() => router.push(`/chalet-details/reviews/${chaletId}`)}
            >
              <SolarStarBold size={20} color="white" />
              <ThemedText style={styles.customRatingText}>{chaletRating.toFixed(1)}</ThemedText>
            </TouchableOpacity>

            <SecondaryButton
              label={t('chalet.details.reviews')}
              iconLabel={String(reviewCount)}
              iconPosition={isRTL ? "right" : "left"}
              isActive={true}
              onPress={() => router.push(`/chalet-details/reviews/${chaletId}`)}
              style={{ width: 160 }}
              height={50}
            />
          </View>

          {/* المراجعات */}
          <SectionHeader title={t('chalet.details.reviews')} isRTL={isRTL} />
          {(reviews.length > 0 ? reviews.slice(0, 2) : [1, 2]).map((reviewItem: any, i: number) => {
            const reviewerName = reviewItem?.customer?.name || (isRTL ? "انسة انس" : "Ansi Ans");
            const reviewComment = reviewItem?.comment || (isRTL ? "خوش مكان ونضيف يستاهل" : "Great place and clean, worth it.");
            const reviewRating = reviewItem?.rating || 4;
            const reviewDate = reviewItem?.createdAt ? new Date(reviewItem.createdAt).toLocaleDateString() : "2025/09/22";
            return (
            <View key={reviewItem?.id || i} style={styles.revComplexCardFlat}>
              <View style={[styles.revHeaderMerged, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                <View style={[styles.revRatingCornerMerged, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                  <SolarStarBold size={14} color="#035DF9" />
                  <ThemedText style={styles.revRateNumMerged}>{reviewRating}</ThemedText>
                </View>
                <View style={[styles.userInfoRowMerged, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                  <View style={[styles.nameAndBodyMerged, { alignItems: isRTL ? "flex-end" : "flex-start" }, isRTL ? { marginRight: 15 } : { marginLeft: 15 }]}>
                    <ThemedText style={styles.reviewerNameMerged}>{reviewerName}</ThemedText>
                    <ThemedText style={[styles.revMessageMerged, { textAlign: isRTL ? "right" : "left" }]}>
                      {reviewComment}
                    </ThemedText>
                  </View>
                  <View style={styles.avatarCircleMerged}>
                    <ExpoImage
                      source={require("@/assets/profile.svg")}
                      style={styles.userAvatarImgMerged}
                      contentFit="cover"
                    />
                  </View>
                </View>
              </View>
              
              <View style={[styles.dateWrapperMerged, { alignItems: isRTL ? "flex-start" : "flex-end" }]}>
                <ThemedText style={styles.revTimeTextMerged}>{reviewDate}</ThemedText>
              </View>
            </View>
            );
          })}

          <View style={styles.addReviewAction}>
            <PrimaryButton
              label={t('chalet.details.addReview')}
              onPress={openReviewSheet}
              style={styles.addBtnFinal}
              height={54}
            />
          </View>

          {/* معلومات تهمك */}
          <SectionHeader title={t('common.details')} isRTL={isRTL} />
           <View style={[styles.infoIconsGrid, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            {[
              { 
                label: t('booking.terms'), 
                Icon: SolarKeyBold, 
                onPress: () => router.push({ pathname: `/chalet-details/info/${chaletId}`, params: { type: 'terms' } })
              },
              { 
                label: t('booking.policy'), 
                Icon: SolarForbiddenBold,
                onPress: () => router.push({ pathname: `/chalet-details/info/${chaletId}`, params: { type: 'policies' } })
              },
              { label: t('auth.verify'), Icon: SolarShieldCheckBold },
              { label: t('booking.shift'), Icon: SolarClockCircleBold },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={styles.infoIconCell} onPress={item.onPress}>
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
              </TouchableOpacity>
            ))}
          </View>

          {/* الاضافات الخاصة (Addons) */}
          {addons && addons.length > 0 ? (
            <>
              <SectionHeader title={t('chalet.details.addons') || "الاضافات الخاصة"} isRTL={isRTL} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addonsList}>
                {addons.map((addon: any, i: number) => (
                  <View key={addon.id || i} style={styles.addonCard}>
                    <ExpoImage 
                      source={getImageSrc(addon.image)} 
                      style={styles.addonImg} 
                      contentFit="cover"
                    />
                    <View style={styles.addonInfo}>
                      <ThemedText style={styles.addonName}>
                        {isRTL ? (addon.name?.ar || addon.name) : (addon.name?.en || addon.name)}
                      </ThemedText>
                      <ThemedText style={styles.addonPrice}>
                        {Number(addon.price).toLocaleString()} {t('common.iqd')}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* قد يعجبك ايضا */}
          <SectionHeader title={t('chalet.details.related')} isRTL={isRTL} />
          <HorizontalSwiper
            data={(similarResponse || []).map((item: any, index: number) => ({
              id: item.id,
              title: isRTL 
                ? (item.name?.ar || item.nameAr || item.name || '') 
                : (item.name?.en || item.nameEn || item.name || ''),
              location: isRTL 
                ? (item.city?.name || '') 
                : (item.city?.enName || item.city?.name || ''),
              price: item.basePrice ? Number(item.basePrice).toLocaleString() : '0',
              rating: item.rating || 0,
              image: getImageSrc(item.images?.[0]?.url),
              color: CARD_COLORS[index % CARD_COLORS.length],
            }))}
            onPressCard={(id) => router.push(`/chalet-details/${id}`)}
          />
        </View>
      </ScrollView>

      {/* الفوتر */}
      <View style={[styles.flatUltimateFooter, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
        <View style={styles.footerBtnSide}>
          <PrimaryButton
            label={t('chalet.details.bookNow')}
            onPress={() => router.push(`/(customer)/booking/complete?id=${chaletId}`)}
            style={styles.footerFlatBtn}
          />
        </View>
        <View style={[styles.footerTextSide, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <ThemedText style={styles.footerPriceBig}>{chaletPrice} {t('common.iqd')}</ThemedText>
          <View style={[styles.footerMetaRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <SolarClockCircleBold size={12} color="#9CA3AF" />
            <ThemedText style={styles.footerMetaSmall}>{t('chalet.details.morningShift')}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  imageHeader: { width: SCREEN_WIDTH, height: 350, position: "relative" },
  headerImage: { width: SCREEN_WIDTH, height: "100%" },
  backBtnOriginal: { position: "absolute", top: 50, zIndex: 10 },
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
    alignItems: "center",
    marginBottom: 20,
  },
  ratingGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingVal: { fontSize: 18, fontFamily: "LamaSans-Black" },
  mainTitle: { fontSize: 22, fontFamily: "LamaSans-Black" },
  locationSub: { fontSize: 13, color: "#6B7280", fontFamily: "LamaSans-Regular" },
  sectionHeaderContainer: {
    height: 60,
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "LamaSans-Black",
    marginVertical: 15,
  },
  specsRow: { flexWrap: "wrap", gap: 8 },
  specTag: {
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  specText: { fontSize: 13, fontFamily: "LamaSans-Bold" },
  viewAllText: { fontSize: 13, color: "#6B7280", fontFamily: "LamaSans-Bold" },
  facilitiesHeader: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  facilitiesGrid: {
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
    fontFamily: "LamaSans-Bold",
    marginTop: 6,
    textAlign: "center",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 5,
    fontFamily: "LamaSans-Regular" },
  readMoreWrapper: { alignItems: "center", marginTop: 15 },
  readMoreComp: { width: "65%", borderRadius: 27 },

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
  mapLocText: { fontSize: 15, fontFamily: "LamaSans-Black" },

  hostStampArea: { marginVertical: 20, width: "100%", alignItems: "center" },
  contactBanner: { width: SCREEN_WIDTH - 40, height: 100 },

  ctaRowReview: {
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
    borderRadius: 23,
    gap: 8,
  },
  customRatingText: {
    color: "white",
    fontSize: 22,
    fontFamily: "LamaSans-Black",
  },

  revComplexCardFlat: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  revHeaderMerged: {
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  revRatingCornerMerged: {
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  revRateNumMerged: {
    fontSize: 16,
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  userInfoRowMerged: {
    alignItems: "flex-start",
    flex: 1,
  },
  nameAndBodyMerged: {
    flex: 1,
  },
  reviewerNameMerged: {
    fontSize: 16,
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  revMessageMerged: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 22,
    fontFamily: "LamaSans-Regular",
  },
  avatarCircleMerged: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  userAvatarImgMerged: {
    width: "100%",
    height: "100%",
  },

  dateWrapperMerged: {
    marginTop: 20,
  },
  revTimeTextMerged: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "LamaSans-Medium",
  },

  addReviewAction: { alignItems: "center", marginVertical: 20 },
  addBtnFinal: { width: "85%", borderRadius: 27 },
  infoIconsGrid: {
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
    fontFamily: "LamaSans-Bold",
    marginTop: 8,
    textAlign: "center",
  },

  flatUltimateFooter: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 110,
    backgroundColor: "white",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerTextSide: { flex: 1 },
  footerPriceBig: { fontSize: 18, fontFamily: "LamaSans-Black", marginBottom: 4 },
  footerMetaRow: { alignItems: "center", gap: 6 },
  footerMetaSmall: { fontSize: 10, color: "#9CA3AF", fontFamily: "LamaSans-SemiBold" },
  footerBtnSide: { width: 180 },
  footerFlatBtn: {
    height: 76,
    borderRadius: normalize.radius(38),
    alignSelf: "stretch",
  },
  addonsList: {
    paddingRight: 20,
    gap: 12,
  },
  addonCard: {
    width: 140,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
    ...Shadows.small,
  },
  addonImg: {
    width: "100%",
    height: 100,
  },
  addonInfo: {
    padding: 8,
  },
  addonName: {
    fontSize: 13,
    fontFamily: "LamaSans-SemiBold",
    marginBottom: 4,
  },
  addonPrice: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "LamaSans-Black",
  },
  hostHeaderFixed: {
    width: '100%',
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  hostAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  hostAvatarImgFixed: {
    width: '100%',
    height: '100%',
  },
  hostInfoSide: {
    flex: 1,
    marginHorizontal: 12,
  },
  hostLabelFixed: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'LamaSans-Medium',
  },
  hostNameFixed: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'LamaSans-Black',
  },
});
