import {
  SolarClockCircleBold,
  SolarFireBold,
  SolarForbiddenBold,
  SolarHeartBold,
  SolarHome2Bold,
  SolarKeyBold,
  SolarMapPointBold,
  SolarSettingsBold,
  SolarShieldCheckBold,
  SolarStarBold,
  SolarWaterBold,
  SolarWidgetBold,
  SolarWifiBold,
  SolarWindBold,
  SolarSunBold,
  SolarMoonBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { HostContactCard } from "@/components/user/host-contact-card";
import { PrimaryButton } from "@/components/user/primary-button";
import { ReviewSubmissionSheet } from "@/components/user/review-submission-sheet";
import { SecondaryButton } from "@/components/user/secondary-button";
import { LoginPromptModal } from "@/components/user/login-prompt-modal";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import {
  useAddFavoriteMutation,
  useCheckCanReviewQuery,
  useCreateReviewMutation,
  useGetChaletAddonsQuery,
  useGetChaletReviewsQuery,
  useGetCustomerChaletDetailsQuery,
  useGetFavoriteIdsQuery,
  useGetSimilarChaletsQuery,
  useRemoveFavoriteMutation,
  useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Constants from "expo-constants";
import { Image as ExpoImage } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useFormatTime } from "../../../hooks/useFormatTime";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES = {
  blue: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

function SectionHeader({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <View
      style={[
        styles.sectionHeaderContainer,
        { alignItems: isRTL ? "flex-end" : "flex-start" },
      ]}
    >
      <ThemedText
        style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}
      >
        {title}
      </ThemedText>
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { userType } = useSelector((state: RootState) => state.auth);

  const FEATURE_ICON_MAP: Record<string, any> = useMemo(
    () => ({
      bbq: SolarFireBold,
      heater: SolarWindBold,
      "toilet-western": SolarWaterBold,
      wifi: SolarWifiBold,
      fridge: SolarHome2Bold,
      tv: SolarWidgetBold,
      kitchen: SolarHome2Bold,
      bathroom: SolarWaterBold,
      entertainment: SolarWidgetBold,
      services: SolarSettingsBold,
      default: SolarWidgetBold,
    }),
    [],
  );

  // Fetch chalet details from the backend
  const { data: chaletData, isLoading } =
    useGetCustomerChaletDetailsQuery(chaletId);
  const { data: reviewsResponse } = useGetChaletReviewsQuery({
    chaletId,
    page: 1,
    limit: 5,
  });
  const [createReview] = useCreateReviewMutation();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // New queries for similar chalets and addons
  const { data: similarResponse } = useGetSimilarChaletsQuery(chaletId);
  const { data: addons = [] } = useGetChaletAddonsQuery(chaletId);
  const { data: canReviewData } = useCheckCanReviewQuery(chaletId, {
    skip: userType === "guest",
  });
  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery(undefined, {
      skip: userType === "guest",
    });
  const [toggleFavorite] = useToggleFavoriteMutation();

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const isFavorite = useMemo(
    () => favoriteIds.includes(chaletId),
    [favoriteIds, chaletId],
  );

  const handleToggleFavorite = async () => {
    if (userType === "guest") {
      setShowLoginPrompt(true);
      return;
    }
    try {
      await toggleFavorite(chaletId).unwrap();
      refetchFavorites();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const isExpoGo = Constants.appOwnership === "expo";
  const showMap = !isExpoGo;

  // Dynamically require Mapbox only if we are not in Expo Go to prevent crashes
  const [MapboxComponent, setMapboxComponent] = useState<any>(null);
  useEffect(() => {
    if (showMap) {
      try {
        const mb = require("@rnmapbox/maps");
        // Handle both default and direct exports
        const Mapbox = mb.default || mb;
        if (Mapbox && Mapbox.MapView) {
          setMapboxComponent(Mapbox);
        }
      } catch (e) {
        console.error("Mapbox could not be initialized:", e);
      }
    }
  }, [showMap]);

  // Extract chalet info from API response
  const chalet = chaletData || ({} as any);
  const chaletName = isRTL
    ? chalet.name?.ar || chalet.nameAr || chalet.name || ""
    : chalet.name?.en || chalet.nameEn || chalet.name || "";
  const chaletLocation = isRTL
    ? chalet.region?.name?.ar ||
      chalet.region?.nameAr ||
      chalet.region?.name ||
      chalet.city?.name ||
      ""
    : chalet.region?.name?.en ||
      chalet.region?.nameEn ||
      chalet.region?.name ||
      chalet.city?.enName ||
      chalet.city?.name ||
      "";
  const chaletCategory = isRTL
    ? chalet.category?.ar || ""
    : chalet.category?.en || "";
  const chaletRating = chalet.averageRating || chalet.rating || 0;
  const chaletPrice = chalet.basePrice
    ? Number(chalet.basePrice).toLocaleString()
    : "0";
  const chaletDescription = isRTL
    ? chalet.description?.ar || chalet.descriptionAr || chalet.description || ""
    : chalet.description?.en ||
      chalet.descriptionEn ||
      chalet.description ||
      "";

  useEffect(() => {
    if (chalet?.shifts?.length > 0 && !selectedShiftId) {
      setSelectedShiftId(chalet.shifts[0].id);
    }
  }, [chalet?.shifts]);

  const selectedShift = useMemo(() => {
    if (!chalet?.shifts || chalet.shifts.length === 0) return null;
    return (
      chalet.shifts.find((s: any) => s.id === selectedShiftId) ||
      chalet.shifts[0]
    );
  }, [chalet?.shifts, selectedShiftId]);

  const displayPrice = useMemo(() => {
    if (
      selectedShift &&
      selectedShift.pricing &&
      selectedShift.pricing.length > 0
    ) {
      return Math.min(
        ...selectedShift.pricing.map((p: any) => p.price),
      ).toLocaleString();
    }
    return chalet.basePrice ? Number(chalet.basePrice).toLocaleString() : "0";
  }, [selectedShift, chalet.basePrice]);

  const { formatShiftTime } = useFormatTime();

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
  const reviewCount =
    chalet.reviewsCount || reviewsResponse?.meta?.total || reviews.length || 0;
  const hostName = chalet.owner?.name || (isRTL ? "مضيف عراقي" : "Iraqi Host");
  const hostAvatar = useMemo(() => {
    if (chalet.owner?.image) {
      return getImageSrc(chalet.owner.image);
    }
    return require("@/assets/profile.svg");
  }, [chalet.owner?.image]);

  // Auto Play Banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => {
        const next = (prev + 1) % totalImages;
        bannerScrollRef.current?.scrollTo({
          x: next * SCREEN_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [totalImages]);

  const openReviewSheet = () => {
    reviewSheetRef.current?.present();
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    try {
      await createReview({ chaletId, rating, comment }).unwrap();
      Alert.alert(
        isRTL ? "تم بنجاح" : "Success",
        isRTL ? "تم إضافة تقييمك بنجاح" : "Review submitted successfully",
      );
    } catch (error) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "فشل إضافة التقييم" : "Failed to add review",
      );
    }
  };

  // Amenities/Facilities from API
  const facilities = useMemo(() => {
    const apiFeatures = chalet.chaletFeatures || chalet.amenities || [];

    if (apiFeatures.length > 0) {
      return apiFeatures.slice(0, 4).map((item: any, idx: number) => {
        const feature = item.feature || item; // Fallback for old structure
        const iconName = feature.icon || "default";
        const IconComponent =
          FEATURE_ICON_MAP[iconName] || FEATURE_ICON_MAP.default;

        return {
          label: isRTL
            ? feature.name?.ar || feature.nameAr || feature.name || ""
            : feature.name?.en || feature.nameEn || feature.name || "",
          Icon: IconComponent,
          color: CARD_COLORS[idx % CARD_COLORS.length],
        };
      });
    }

    return [
      {
        label: t("facilities.privatePool"),
        Icon: SolarWaterBold,
        color: "#035DF9",
      },
      { label: t("facilities.wifi"), Icon: SolarWifiBold, color: "#EF79D7" },
      {
        label: t("facilities.generator"),
        Icon: SolarWindBold,
        color: "#F64200",
      },
      {
        label: t("facilities.kitchen"),
        Icon: SolarHome2Bold,
        color: "#15AB64",
      },
    ];
  }, [chalet.chaletFeatures, chalet.amenities, isRTL, t]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
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
            contentContainerStyle={{ flexDirection: "row" }}
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
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/chalet-details/gallery",
                    params: { startIndex: i },
                  })
                }
                style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
              >
                <Image source={img} style={styles.headerImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <CircleBackButton
            style={[
              styles.backBtnOriginal,
              isRTL ? { right: 20 } : { left: 20 },
            ]}
          />

          <TouchableOpacity
            style={[styles.favoriteBtn, isRTL ? { left: 20 } : { right: 20 }]}
            onPress={handleToggleFavorite}
          >
            <SolarHeartBold
              size={24}
              color={isFavorite ? "#EA2129" : "#FFFFFF"}
            />
          </TouchableOpacity>
          <View
            style={[
              styles.paginationDots,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
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
          <View
            style={[
              styles.titleSection,
              { flexDirection: isRTL ? "row" : "row-reverse" },
            ]}
          >
            <View
              style={[
                styles.ratingGroupLeft,
                isRTL ? { marginRight: 15 } : { marginLeft: 15 },
              ]}
            >
              <ThemedText style={styles.ratingVal}>
                {chaletRating.toFixed(1)}
              </ThemedText>
              <SolarStarBold size={14} color="#035DF9" />
            </View>
            <View
              style={{ alignItems: isRTL ? "flex-end" : "flex-start", flex: 1 }}
            >
              <ThemedText
                style={[
                  styles.mainTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {chaletName}
              </ThemedText>
              <ThemedText
                style={[
                  styles.locationSub,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {chaletCategory ? `${chaletCategory} • ` : ""}
                {chaletLocation}
              </ThemedText>
            </View>
          </View>

          {/* المواصفات الأساسية */}
          <SectionHeader title={t("chalet.details.specs")} isRTL={isRTL} />
          <View
            style={[
              styles.specsRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            {[
              { label: `${chalet.area || 0} م`, id: "area" },
              {
                label: t("facilities.bathroom") + ` ${chalet.bathrooms || 0}`,
                id: "bath",
              },
              { label: `${chalet.bedrooms || 0} غرف`, id: "rooms" },
            ].map((d, i) => (
              <View key={i} style={styles.specTag}>
                <ThemedText style={styles.specText}>{d.label}</ThemedText>
              </View>
            ))}
          </View>

          {/* الشفتات المتوفرة */}
          <SectionHeader
            title={isRTL ? "الشفتات المتوفرة" : "Available Shifts"}
            isRTL={isRTL}
          />
          <View style={styles.shiftsGrid}>
            {(chalet.shifts || []).map((shift: any, index: number) => {
              const isSelected = selectedShift?.id === shift.id;
              const minShiftPrice =
                shift.pricing && shift.pricing.length > 0
                  ? Math.min(
                      ...shift.pricing.map((p: any) => p.price),
                    ).toLocaleString()
                  : null;

              return (
                <View
                  key={shift.id || index}
                  style={[
                    styles.shiftCard,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  {(() => {
                    const isMorning = shift.type === 'MORNING' || (shift.name?.en?.toLowerCase().includes('morning')) || (shift.name?.ar?.includes('صباح'));
                    return (
                      <View
                        style={styles.shiftIconCircle}
                      >
                        {isMorning ? (
                          <SolarSunBold
                            size={22}
                            color="#FBBF24"
                          />
                        ) : (
                          <SolarMoonBold
                            size={22}
                            color="#6366F1"
                          />
                        )}
                      </View>
                    );
                  })()}
                  <View
                    style={[
                      styles.shiftInfo,
                      { alignItems: isRTL ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <ThemedText
                      style={styles.shiftName}
                    >
                      {isRTL
                        ? shift.name?.ar || shift.name
                        : shift.name?.en || shift.name}
                    </ThemedText>
                    <ThemedText style={styles.shiftTime}>
                      {formatShiftTime(shift.startTime)} -{" "}
                      {formatShiftTime(shift.endTime)}
                    </ThemedText>
                  </View>
                  {minShiftPrice && (
                    <View
                      style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}
                    >
                      <ThemedText
                        style={styles.shiftPrice}
                      >
                        {minShiftPrice} {t("common.iqd")}
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* المرافق */}
          <View
            style={[
              styles.facilitiesHeader,
              { flexDirection: isRTL ? "row" : "row-reverse" },
            ]}
          >
            <TouchableOpacity
              onPress={() =>
                router.push(`/chalet-details/facilities/${chaletId}`)
              }
            >
              <ThemedText style={styles.viewAllText}>
                {t("home.seeAll")}
              </ThemedText>
            </TouchableOpacity>
            <SectionHeader
              title={t("chalet.details.facilities")}
              isRTL={isRTL}
            />
          </View>
          <View
            style={[
              styles.facilitiesGrid,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            {facilities.map((f: any, i: number) => (
              <View key={i} style={styles.facilityCell}>
                <View style={styles.shapeCont}>
                  <Svg height={55} width={55} viewBox="0 0 60 60">
                    <Path d={SHAPES.blue} fill={f.color} />
                  </Svg>
                  <View style={styles.iconInShape}>
                    {f.Icon && <f.Icon size={22} color="white" />}
                  </View>
                </View>
                <ThemedText style={styles.facilityLabelText}>
                  {f.label}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* نظرة عامة */}
          <SectionHeader title={t("chalet.details.overview")} isRTL={isRTL} />
          <View
            style={[
              styles.descriptionContainer,
              { alignItems: isRTL ? "flex-end" : "flex-start" },
            ]}
          >
            <ThemedText
              style={[
                styles.descriptionText,
                { textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {chaletDescription ||
                (isRTL
                  ? "هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم في صناعات المطابع ودور النشر..."
                  : "Lorem ipsum is simply dummy text of the printing and typesetting industry...")}
            </ThemedText>
          </View>
          <View style={styles.readMoreWrapper}>
            <PrimaryButton
              label={t("chalet.details.readMore")}
              onPress={() => router.push(`/(customer)/chalet-details/description/${chaletId}`)}
              style={styles.readMoreComp}
              height={54}
            />
          </View>

          {/* الموقع */}
          <SectionHeader title={t("chalet.details.location")} isRTL={isRTL} />
          <View style={styles.mapCardFlat}>
            <View style={styles.mapInner}>
              {showMap &&
              MapboxComponent?.MapView &&
              MapboxComponent?.Camera &&
              MapboxComponent?.PointAnnotation ? (
                <MapboxComponent.MapView
                  style={styles.mapView}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  logoEnabled={false}
                  attributionEnabled={false}
                >
                  <MapboxComponent.Camera
                    zoomLevel={15}
                    centerCoordinate={[
                      chalet.longitude || 44.3661,
                      chalet.latitude || 33.3152,
                    ]}
                  />
                  <MapboxComponent.PointAnnotation
                    id="chaletLocation"
                    coordinate={[
                      chalet.longitude || 44.3661,
                      chalet.latitude || 33.3152,
                    ]}
                  >
                    <View style={styles.customPin}>
                      <SolarMapPointBold size={32} color="#035DF9" />
                    </View>
                  </MapboxComponent.PointAnnotation>
                </MapboxComponent.MapView>
              ) : (
                <View
                  style={[
                    styles.mapInner,
                    {
                      backgroundColor: "#F3F4F6",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri: `https://tiles.stadiamaps.com/static/alidade_smooth/${chalet.longitude || 44.3661},${chalet.latitude || 33.3152},15/600x300@2x.png?api_key=YOUR_KEY`,
                    }}
                    style={styles.mapImg}
                  />
                  <View style={styles.pinCenterFallback}>
                    <SolarMapPointBold size={32} color="#035DF9" />
                  </View>
                  <View style={styles.expoGoBanner}>
                    <ThemedText style={styles.expoGoText}>
                      {isRTL
                        ? "الخريطة التفاعلية تتطلب Build خاص"
                        : "Interactive map requires Dev Build"}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.mapLocLabel}>
              <ThemedText style={styles.mapLocText}>
                {chaletLocation}
              </ThemedText>
            </View>
          </View>

          {/* المضيف */}
          <HostContactCard name={hostName} avatar={hostAvatar} isRTL={isRTL} />

          {/* التقييم والمراجعات */}
          <View
            style={[
              styles.ctaRowReviewMerged,
              { flexDirection: isRTL ? "row" : "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={styles.pillTouch}
              onPress={() => router.push(`/chalet-details/reviews/${chaletId}`)}
            >
              <Svg
                width={86}
                height={46}
                viewBox="0 0 54 29"
                style={StyleSheet.absoluteFill}
              >
                <Path
                  d={
                    isRTL
                      ? "M0 14.5C0 6.49187 6.49187 0 14.5 0H46C49.3137 0 52 2.68629 52 6V23C52 26.3137 49.3137 29 46 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
                      : "M52 14.5C52 6.49187 45.5081 0 37.5 0H6C2.68629 0 0 2.68629 0 6V23C0 26.3137 2.68629 29 6 29H37.5C45.5081 29 52 22.5081 52 14.5V14.5Z"
                  }
                  fill="#035DF9"
                />
              </Svg>
              <View
                style={[
                  styles.pillContent,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <ThemedText style={styles.customRatingText}>
                  {chaletRating.toFixed(1)}
                </ThemedText>
                <SolarStarBold size={18} color="white" />
              </View>
            </TouchableOpacity>

            <SecondaryButton
              label={t("chalet.details.reviews")}
              iconLabel={String(reviewCount)}
              iconPosition="right"
              isActive={true}
              onPress={() => router.push(`/chalet-details/reviews/${chaletId}`)}
              style={{ width: 175 }}
              height={46}
              variant={isRTL ? "inverse" : undefined}
            />
          </View>

          {/* المراجعات */}
          <SectionHeader title={t("chalet.details.reviews")} isRTL={isRTL} />
          {(reviews.length > 0 ? reviews.slice(0, 2) : [1, 2]).map(
            (reviewItem: any, i: number) => {
              const reviewerName =
                reviewItem?.customer?.name || (isRTL ? "انسة انس" : "Ansi Ans");
              const reviewComment =
                reviewItem?.comment ||
                (isRTL
                  ? "خوش مكان ونضيف يستاهل"
                  : "Great place and clean, worth it.");
              const reviewRating = reviewItem?.rating || 4;
              const reviewDate = reviewItem?.createdAt
                ? new Date(reviewItem.createdAt).toLocaleDateString()
                : "2025/09/22";
              return (
                <View
                  key={reviewItem?.id || i}
                  style={styles.revComplexCardFlat}
                >
                  <View
                    style={[
                      styles.revHeaderMerged,
                      { flexDirection: isRTL ? "row" : "row-reverse" },
                    ]}
                  >
                    <View
                      style={[
                        styles.revRatingCornerMerged,
                        { flexDirection: isRTL ? "row" : "row-reverse" },
                      ]}
                    >
                      <ThemedText style={styles.revRateNumMerged}>
                        {reviewRating}
                      </ThemedText>
                      <SolarStarBold size={14} color="#035DF9" />
                    </View>
                    <View
                      style={[
                        styles.userInfoRowMerged,
                        { flexDirection: isRTL ? "row" : "row-reverse" },
                      ]}
                    >
                      <View
                        style={[
                          styles.nameAndBodyMerged,
                          { alignItems: isRTL ? "flex-end" : "flex-start" },
                          isRTL ? { marginRight: 15 } : { marginLeft: 15 },
                        ]}
                      >
                        <ThemedText style={styles.reviewerNameMerged}>
                          {reviewerName}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.revMessageMerged,
                            { textAlign: isRTL ? "right" : "left" },
                          ]}
                        >
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

                  <View
                    style={[
                      styles.dateWrapperMerged,
                      { alignItems: isRTL ? "flex-start" : "flex-end" },
                    ]}
                  >
                    <ThemedText style={styles.revTimeTextMerged}>
                      {reviewDate}
                    </ThemedText>
                  </View>
                </View>
              );
            },
          )}

          {(canReviewData?.canReview || !canReviewData) && (
            <View style={styles.addReviewAction}>
              <PrimaryButton
                label={t("chalet.details.addReview")}
                onPress={openReviewSheet}
                style={styles.addBtnFinal}
                height={54}
              />
            </View>
          )}

          {canReviewData && !canReviewData.canReview &&
            canReviewData.reason === "NO_COMPLETED_BOOKING" && (
              <View style={styles.unverifiedReviewMsg}>
                <ThemedText style={styles.unverifiedText}>
                  {isRTL
                    ? "فقط المستخدمين الذين حجزوا هذا الشاليه يمكنهم التقييم"
                    : "Only users who have booked this chalet can review"}
                </ThemedText>
              </View>
            )}

          {/* معلومات تهمك */}
          <SectionHeader title={t("common.details")} isRTL={isRTL} />
          <View
            style={[
              styles.infoIconsGrid,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            {[
              {
                label: t("booking.terms"),
                Icon: SolarKeyBold,
                onPress: () =>
                  router.push({
                    pathname: `/(customer)/chalet-details/info/${chaletId}`,
                    params: { type: "terms" },
                  }),
              },
              {
                label: t("booking.policy"),
                Icon: SolarForbiddenBold,
                onPress: () =>
                  router.push({
                    pathname: `/(customer)/chalet-details/info/${chaletId}`,
                    params: { type: "policies" },
                  }),
              },
              { label: t("auth.verify"), Icon: SolarShieldCheckBold },
              { label: t("booking.shift"), Icon: SolarClockCircleBold },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.infoIconCell}
                onPress={item.onPress}
              >
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

          {/* قد يعجبك ايضا */}
          <SectionHeader title={t("chalet.details.related")} isRTL={isRTL} />
          <HorizontalSwiper
            data={(similarResponse || []).map((item: any, index: number) => ({
              id: item.id,
              title: isRTL
                ? item.name?.ar || item.nameAr || item.name || ""
                : item.name?.en || item.nameEn || item.name || "",
              location: isRTL
                ? item.city?.name || ""
                : item.city?.enName || item.city?.name || "",
              price: item.basePrice
                ? Number(item.basePrice).toLocaleString()
                : "0",
              rating: item.rating || 0,
              image: getImageSrc(item.images?.[0]?.url),
              color: CARD_COLORS[index % CARD_COLORS.length],
            }))}
            onPressCard={(id) => router.push(`/chalet-details/${id}`)}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
          />
        </View>
      </ScrollView>

      {/* الفوتر */}
      <View
        style={[
          styles.flatUltimateFooter,
          { flexDirection: isRTL ? "row" : "row-reverse" },
        ]}
      >
        <View style={styles.footerBtnSide}>
          <PrimaryButton
            label={t("chalet.details.bookNow")}
            onPress={() => {
              if (userType === "guest") {
                setShowLoginPrompt(true);
              } else {
                router.push(`/(customer)/booking/complete?id=${chaletId}`);
              }
            }}
            style={styles.footerFlatBtn}
          />
        </View>
        <View
          style={[
            styles.footerTextSide,
            { alignItems: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <ThemedText style={styles.footerPriceBig}>
            {displayPrice} {t("common.iqd")}
          </ThemedText>
          <View
            style={[
              styles.footerMetaRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <SolarClockCircleBold size={12} color="#9CA3AF" />
            <ThemedText style={styles.footerMetaSmall}>
              {selectedShift
                ? isRTL
                  ? selectedShift.name?.ar || selectedShift.name
                  : selectedShift.name?.en || selectedShift.name
                : t("chalet.details.morningShift")}
            </ThemedText>
          </View>
        </View>
      </View>

      <ReviewSubmissionSheet
        ref={reviewSheetRef}
        onSubmit={handleReviewSubmit}
      />
      <LoginPromptModal
        isVisible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          router.push("/(auth)/login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  imageHeader: { width: SCREEN_WIDTH, height: 350, position: "relative" },
  headerImage: { width: SCREEN_WIDTH, height: "100%" },
  backBtnOriginal: { position: "absolute", top: 50, zIndex: 10 },
  favoriteBtn: {
    position: "absolute",
    top: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
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
  infoWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  shiftsGrid: {
    gap: 12,
    marginBottom: 10,
  },
  shiftCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  shiftIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  shiftName: {
    fontFamily: "Alexandria-Black",
    fontSize: 15,
    color: "#1E293B",
  },
  shiftTime: {
    fontFamily: "Alexandria-Bold",
    fontSize: 12,
    color: "#64748B",
  },
  shiftPrice: {
    fontFamily: "Alexandria-Black",
    fontSize: 14,
    color: "#1E293B",
  },
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
  locationSub: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "LamaSans-Regular",
  },
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
    fontFamily: "LamaSans-Regular",
  },
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
  mapInner: { height: 220, borderRadius: 24, overflow: "hidden" },
  mapView: { flex: 1 },
  mapImg: { width: "100%", height: "100%" },
  customPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinCenterFallback: { position: "absolute", top: "40%", left: "46%" },
  expoGoBanner: {
    position: "absolute",
    bottom: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expoGoText: { color: "white", fontSize: 10, fontFamily: "LamaSans-Medium" },
  mapLocLabel: { paddingVertical: 12, alignItems: "center" },
  mapLocText: { fontSize: 16, fontFamily: "LamaSans-Black" },
  unverifiedReviewMsg: {
    padding: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    marginVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  unverifiedText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "LamaSans-Medium",
    textAlign: "center",
  },

  hostStampArea: {
    marginVertical: 20,
    width: "100%",
    height: 100,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  contactBanner: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },

  ctaRowReviewMerged: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillTouch: {
    width: 86,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  customRatingText: {
    color: "white",
    fontSize: 16,
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
  footerPriceBig: {
    fontSize: 18,
    fontFamily: "LamaSans-Black",
    marginBottom: 4,
  },
  footerMetaRow: { alignItems: "center", gap: 6 },
  footerMetaSmall: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: "LamaSans-SemiBold",
  },
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
  capacityPolicyCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "space-around",
  },
  capacityCardItem: {
    alignItems: "center",
    flex: 1,
  },
  capacityValue: {
    fontSize: 16,
    fontFamily: "Alexandria-Bold",
    color: Colors.primary,
  },
  capacityLabel: {
    fontSize: 10,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    marginTop: 2,
  },
  capacityDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 10,
  },
});
