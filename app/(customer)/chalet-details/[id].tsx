import {
  SolarChaletRulesBold,
  SolarClockCircleBold,
  SolarForbiddenBold,
  SolarForbiddenCircleLineDuotone,
  SolarHeartBold,
  SolarMapPointBold,
  SolarMoonBold,
  SolarStarBold,
  SolarSunBold,
  SolarWidgetBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { ErrorState } from "@/components/ui/error-state";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { HostContactCard } from "@/components/user/host-contact-card";
import { LoginPromptModal } from "@/components/user/login-prompt-modal";
import { PrimaryButton } from "@/components/user/primary-button";
import { ReviewSubmissionSheet } from "@/components/user/review-submission-sheet";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS, ANALYTICS_CURRENCY } from "@/constants/analytics-events";
import { getImageSrc, getAvatarSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
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
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  I18nManager,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSelector } from "react-redux";
import { useFormatTime } from "../../../hooks/useFormatTime";
import { useDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES = {
  blue: "M31.177 60L31.7712 59.9376C32.8672 59.232 36.7817 53.2436 37.8737 51.728C40.3267 52.6508 43.5285 53.5787 46.0539 54.4214C46.6842 54.6319 47.1961 54.5513 47.7421 54.1911C48.543 53.009 48.4848 46.1697 48.5932 44.2386C51.3936 43.3932 54.3204 42.7398 57.1026 41.877C57.8393 41.6485 58.032 41.2674 58.291 40.674C58.2268 39.2385 54.5572 33.6731 53.5736 31.9774C55.4164 29.9328 57.2973 27.9347 59.1442 25.8993C59.8909 25.0775 60.0555 24.7649 59.9852 23.7883C59.2746 22.6217 53.0717 19.9015 51.2751 18.9984C51.6967 16.1161 52.2507 13.4061 52.7466 10.5491C52.8831 9.75984 52.8288 9.24161 52.3531 8.62877C51.0242 7.87675 44.2954 9.10223 42.288 9.36357C41.2482 6.79897 40.2926 4.18695 39.2387 1.63228C38.8232 0.627833 38.5883 0.336505 37.697 1.49012e-06C36.2838 0.167544 31.3898 4.6203 29.8581 5.88326C28.2101 5.91851 22.5873 0.0391017 20.6823 0.560774C19.6525 1.92219 17.8438 8.34534 17.2316 10.3089C15.196 10.2469 8.20426 9.36458 7.01989 10.4574C6.33938 11.9432 8.50738 18.5541 9.06143 20.5286C6.98778 21.7352 1.51158 24.7799 0 26.128C1.22652 27.8168 5.83953 32.0045 7.64017 33.6889C1.56375 45.7068 1.28272 42.6296 13.4938 45.5763C13.8109 47.6571 13.9193 54.5019 15.3245 55.5511C16.7377 55.8748 22.9165 52.9707 24.7292 52.2229C26.837 54.8499 28.9869 57.4427 31.177 60Z",
  green:
    "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
  pink: "M24.91 0C27.0701 0.496535 28.2561 2.03453 30.0498 3.51362C35.1705 -1.23292 35.9096 -1.06671 38.9761 5.08738C41.9346 4.27946 45.7444 1.47486 46.5131 6.62746C46.6677 7.66051 46.799 8.70829 46.9346 9.74344C48.7537 9.89914 52.4237 9.16486 53.3598 11.1426C53.9993 12.4912 53.04 15.3484 52.6631 16.7854C59.6389 19.5437 59.605 18.6621 55.8672 25.4811C61.2844 29.75 61.4707 30.2655 55.8651 34.5681C56.5555 35.8641 57.4534 37.0634 58.04 38.372C59.5097 41.6521 55.0243 42.4011 52.6673 43.2175C53.0972 44.7807 53.9633 47.5769 53.3365 49.159C52.4153 51.4797 48.9528 49.422 47.4915 50.2594C45.9053 51.3156 46.6508 54.0634 46.1806 55.3868C45.3272 57.7895 40.4479 55.4457 39.0375 54.8923C37.805 57.0342 37.6165 58.3597 35.6533 59.9987C33.1777 60.0576 32.0214 58.1703 29.9545 56.5334C24.3764 61.0275 24.6644 61.6187 20.9223 54.8587C13.1904 57.5559 14.6326 57.5833 12.985 50.1185C5.51574 50.5645 5.97528 49.9606 7.20145 43.127C0.683039 40.8252 0.0943126 40.8926 4.1625 34.6059C1.87533 32.5483 -2.41311 30.68 1.74191 27.341C2.54877 26.693 3.37257 26.0513 4.17731 25.399C0.168422 19.2702 0.651283 19.1881 7.18452 16.8422C6.26754 10.2295 5.00113 9.57512 13.0909 9.76237C14.2154 2.29752 14.046 2.80668 21.007 5.08316C22.3052 3.02339 22.3666 0.969926 24.91 0Z",
  red: "M26.0603 60C29.9658 59.4325 29.8391 57.154 32.7123 55.3719C34.9225 54.1301 37.5529 56.9614 39.3811 57.3718C44.9058 58.6116 45.0155 53.8851 45.7481 50.2915C46.6896 46.8466 51.9145 48.769 54.0192 47.2906C58.6446 44.0383 54.2219 40.5348 54.091 37.1548C54.015 35.1591 59.4109 33.2953 59.8817 30.686C60.7641 25.7794 56.4955 25.9343 54.2493 22.9543C53.2593 21.2225 55.2331 18.2886 55.4822 16.8143C56.5335 10.6114 50.9476 11.4512 47.0992 11.0554C44.5891 10.7957 44.7707 5.60846 43.789 4.02109C42.7863 2.40231 41.7835 2.19288 40.0292 1.73217C37.2468 2.50491 35.7226 3.96454 33.0732 4.97811C29.9193 4.0148 28.8406 -0.579781 24.7388 0.0610315C21.5701 0.0359016 20.8671 5.11424 19.5751 6.16131C15.2897 9.63133 12.864 2.85464 8.01704 8.83346C7.91359 10.2303 8.34847 15.4992 7.88615 16.2991C6.25008 19.1388 -0.948651 18.253 0.10477 23.4151C0.647314 26.0705 2.92303 27.662 4.08201 30.02L4.18968 30.2441C3.20803 32.4388 0.824638 34.7235 0.389759 36.803C-0.691106 41.9798 5.48587 41.5358 7.9347 43.7054C9.67633 45.2467 7.4935 50.3062 9.13168 52.2118C11.3251 55.9604 16.8983 52.3584 18.8236 53.1061C22.3723 54.4819 20.7087 58.6535 26.0603 60Z",
};

// Maps shape index → path key for random-but-stable assignment
const SHAPE_KEYS = ["blue", "green", "pink", "red"] as const;
type ShapeKey = (typeof SHAPE_KEYS)[number];

// Maps shape key → fill color matching the original SVG assets
const SHAPE_COLORS: Record<ShapeKey, string> = {
  blue: "#035DF9",
  green: "#15AB64",
  pink: "#EF79D7",
  red: "#F64200",
};

function SectionHeader({ title }: { title: string }) {
  const { isRTL, textAlign } = useDirection();
  return (
    <View style={[styles.sectionHeaderContainer, { alignItems: "flex-start", direction: isRTL ? "rtl" : "ltr" }]}>
      <ThemedText style={[styles.sectionTitle, { textAlign }]}>
        {title}
      </ThemedText>
    </View>
  );
}

const CARD_COLORS = [
  "#035DF9",
  "#15AB64",
  "#EF79D7",
  "#F64200",
  "#A855F7",
  "#06B6D4",
  "#FBBF24",
];

export default function ChaletDetailScreen() {
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);
  const { isRTL, rowDirection, textAlign } = useDirection();

  // textStart: dynamic alignment accounting for React Native native mirroring
  const textStart: "left" | "right" = textAlign;
  const textEnd: "left" | "right" = isRTL ? "left" : "right";
  // flexDir: dynamic flexDirection accounting for native mirroring
  const flexDir: "row" | "row-reverse" = rowDirection;
  const alignStart: "flex-start" | "flex-end" =
    rowDirection === "row" ? "flex-start" : "flex-end";
  const alignEnd: "flex-start" | "flex-end" =
    rowDirection === "row" ? "flex-end" : "flex-start";

  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const reviewSheetRef = React.useRef<BottomSheetModal>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch chalet details from the backend
  const {
    data: chaletData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCustomerChaletDetailsQuery(chaletId, {
    refetchOnMountOrArgChange: true,
  });
  const { data: reviewsResponse, refetch: refetchReviews } =
    useGetChaletReviewsQuery(
      {
        chaletId,
        page: 1,
        limit: 5,
      },
      { refetchOnMountOrArgChange: true },
    );
  const [createReview] = useCreateReviewMutation();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // New queries for similar chalets and addons
  const { data: similarResponse, refetch: refetchSimilar } =
    useGetSimilarChaletsQuery(chaletId, { refetchOnMountOrArgChange: true });
  const { data: addons = [], refetch: refetchAddons } = useGetChaletAddonsQuery(
    chaletId,
    { refetchOnMountOrArgChange: true },
  );
  const { data: canReviewData, refetch: refetchCanReview } =
    useCheckCanReviewQuery(chaletId, {
      skip: userType === "guest",
      refetchOnMountOrArgChange: true,
    });
  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery(undefined, {
      skip: userType === "guest",
    });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Auto-refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      if (refetchReviews) refetchReviews();
      if (refetchSimilar) refetchSimilar();
      if (refetchAddons) refetchAddons();
      if (refetchCanReview && userType !== "guest") refetchCanReview();
    }, [
      refetch,
      refetchReviews,
      refetchSimilar,
      refetchAddons,
      refetchCanReview,
      userType,
    ]),
  );

  const isFavorite = useMemo(
    () => favoriteIds.includes(chaletId),
    [favoriteIds, chaletId],
  );

  const handleToggleFavorite = async () => {
    if (userType === "guest") {
      setShowLoginPrompt(true);
      return;
    }
    const wasFavorite = isFavorite;
    try {
      await toggleFavorite(chaletId).unwrap();
      if (!wasFavorite) {
        logEvent(ANALYTICS_EVENTS.ADD_TO_WISHLIST, {
          currency: ANALYTICS_CURRENCY,
          value: Number(chalet.basePrice) || 0,
          items: [
            {
              item_id: String(chaletId),
              item_name: chaletName,
              price: Number(chalet.basePrice) || 0,
            },
          ],
        });
      }
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
  const chalet = chaletData?.data || chaletData || ({} as any);
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

  // ── Analytics: view_item (fires once per chalet when its data loads) ───────
  useEffect(() => {
    if (!chalet?.id) return;
    logEvent(ANALYTICS_EVENTS.VIEW_ITEM, {
      currency: ANALYTICS_CURRENCY,
      value: Number(chalet.basePrice) || 0,
      items: [
        {
          item_id: String(chalet.id),
          item_name: chaletName,
          item_category: chaletCategory || chaletLocation || undefined,
          price: Number(chalet.basePrice) || 0,
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chalet?.id]);

  const availableShifts = useMemo(() => {
    if (!chalet?.shifts || chalet.shifts.length === 0) return [];
    return chalet.shifts;
  }, [chalet?.shifts]);

  useEffect(() => {
    if (availableShifts.length > 0) {
      const exists = availableShifts.some((s: any) => s.id === selectedShiftId);
      if (!exists) {
        setSelectedShiftId(availableShifts[0].id);
      }
    }
  }, [availableShifts, selectedShiftId]);

  const selectedShift = useMemo(() => {
    if (!availableShifts || availableShifts.length === 0) return null;
    return (
      availableShifts.find((s: any) => s.id === selectedShiftId) ||
      availableShifts[0]
    );
  }, [availableShifts, selectedShiftId]);

  const displayPrice = useMemo(() => {
    if (
      selectedShift &&
      selectedShift.pricing &&
      selectedShift.pricing.length > 0
    ) {
      // Exclude closed days (price <= 1 sentinel) from the displayed minimum price.
      const validPrices = selectedShift.pricing
        .map((p: any) => Number(p.price))
        .filter((p: number) => p > 1);
      if (validPrices.length > 0) {
        return Math.min(...validPrices).toLocaleString();
      }
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
  const hostName = chalet.owner?.name || (isRTL ? "المضيف" : "Host");
  const hostAvatar = useMemo(
    () => getAvatarSrc(chalet.owner?.image),
    [chalet.owner?.image],
  );

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
      return apiFeatures.map((item: any, idx: number) => {
        const feature = item.feature || item;
        const iconId = feature.icon || null;

        // icon from API is always a UUID → treat as image from server
        const iconUrl = iconId ? getImageSrc(iconId) : null;

        // Pick shape deterministically by index, cycling through the 4 shapes
        const shapeKey = SHAPE_KEYS[idx % SHAPE_KEYS.length];

        return {
          label: isRTL
            ? feature.name?.ar || feature.nameAr || feature.name || ""
            : feature.name?.en || feature.nameEn || feature.name || "",
          iconUrl,
          shapeKey,
          shapeColor: SHAPE_COLORS[shapeKey],
          shapePath: SHAPES[shapeKey],
        };
      });
    }

    return [];
  }, [chalet.chaletFeatures, chalet.amenities, isRTL]);

  if (isLoading || isFetching) {
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

  if (error || !chaletData) {
    const is404 = (error as any)?.status === 404;
    const errorMessage =
      (error as any)?.data?.message || (error as any)?.message;
    return (
      <ErrorState
        type={is404 ? "error404" : "failed"}
        message={errorMessage}
        onBack={() => router.back()}
        onRetry={() => refetch()}
      />
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
                <Image
                  source={typeof img === "string" ? { uri: img } : img}
                  style={styles.headerImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <CircleBackButton
            style={[
              styles.backBtnOriginal,
              isRTL
                ? I18nManager.isRTL
                  ? { left: 20, right: "auto" }
                  : { right: 20, left: "auto" }
                : I18nManager.isRTL
                  ? { right: 20, left: "auto" }
                  : { left: 20, right: "auto" },
            ]}
          />

          <TouchableOpacity
            style={[
              styles.favoriteBtn,
              isRTL
                ? I18nManager.isRTL
                  ? { right: 20, left: "auto" }
                  : { left: 20, right: "auto" }
                : I18nManager.isRTL
                  ? { left: 20, right: "auto" }
                  : { right: 20, left: "auto" },
            ]}
            onPress={handleToggleFavorite}
          >
            <SolarHeartBold
              size={24}
              color={isFavorite ? "#EA2129" : "#FFFFFF"}
            />
          </TouchableOpacity>
          <View
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              flexDirection: "row",
              direction: isRTL ? "rtl" : "ltr",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 10,
            }}
          >
            <PrimaryButton
              variant="white"
              label={isRTL ? "تصفح بحسب المرافق" : "Browse by facilities"}
              onPress={() =>
                router.push({
                  pathname: "/(customer)/chalet-details/gallery",
                  params: { id: chaletId },
                })
              }
              height={38}
              activeTextColor="#374151"
              textStyle={{
                fontSize: 12,
                fontFamily: "Alexandria-Medium",
                lineHeight: 20,
              }}
            />

            <View
              style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
            >
              {images.map((_: string, i: number) => (
                <View
                  key={i}
                  style={[styles.dot, activeImage === i && styles.activeDot]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.infoWrapper}>
          {/* العنوان والتقييم */}
          <View
            style={{
              flexDirection: "row",
              direction: isRTL ? "rtl" : "ltr",
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              marginBottom: 20
            }}
          >
            <View style={{ flex: 1 }}>
              <ThemedText
                style={[styles.mainTitle, { textAlign: isRTL ? "left" : "right" }]}
                numberOfLines={2}
              >
                {chaletName}
              </ThemedText>
              <ThemedText
                style={[styles.locationSub, { textAlign: isRTL ? "left" : "right", marginTop: 4 }]}
              >
                {chaletCategory ? `${chaletCategory} • ` : ""}
                {chaletLocation}
              </ThemedText>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4, marginStart: 12 }}
            >
              <SolarStarBold size={14} color="#035DF9" />
              <ThemedText style={styles.ratingVal}>
                {chaletRating.toFixed(1)}
              </ThemedText>
            </View>
          </View>

          {/* المواصفات الأساسية */}
          <SectionHeader title={t("chalet.details.specs")} />
          <View style={[styles.specsRow, { flexDirection: 'row', direction: isRTL ? 'rtl' : 'ltr' }]}>
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

          {/* الفترات المتوفرة */}
          <SectionHeader
            title={isRTL ? "الفترات المتوفرة" : "Available Periods"}
          />
          <View style={styles.shiftsGrid}>
            {availableShifts && availableShifts.length > 0 ? (
              availableShifts.map((shift: any, index: number) => {
                const validShiftPrices =
                  shift.pricing?.map((p: any) => Number(p.price)).filter((p: number) => p > 1) || [];
                const minShiftPrice =
                  validShiftPrices.length > 0
                    ? Math.min(...validShiftPrices).toLocaleString()
                    : null;

                return (
                  <View
                    key={shift.id || index}
                    style={[styles.shiftCard, { flexDirection: 'row', direction: isRTL ? 'rtl' : 'ltr' }]}
                  >
                    {(() => {
                      const nameEn = shift.name?.en?.toLowerCase() || "";
                      const nameAr = shift.name?.ar || "";
                      const isOvernight =
                        shift.type === "OVERNIGHT" ||
                        nameEn.includes("overnight") ||
                        nameEn.includes("night") ||
                        nameAr.includes("مبيت");
                      const isMorning =
                        !isOvernight &&
                        (shift.type === "MORNING" ||
                          nameEn.includes("morning") ||
                          nameAr.includes("صباح"));
                      return (
                        <View style={styles.shiftIconCircle}>
                          {isMorning ? (
                            <SolarSunBold size={22} color="#FBBF24" />
                          ) : isOvernight ? (
                            <ExpoImage
                              source={require("@/assets/shifts/sleep.svg")}
                              style={{ width: 24, height: 24 }}
                              contentFit="contain"
                            />
                          ) : (
                            <SolarMoonBold size={22} color="#6366F1" />
                          )}
                        </View>
                      );
                    })()}
                    <View
                      style={[
                        styles.shiftInfo,
                        { alignItems: 'flex-start', marginHorizontal: 12 },
                      ]}
                    >
                      <ThemedText style={[styles.shiftName, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {isRTL
                          ? shift.name?.ar || shift.name
                          : shift.name?.en || shift.name}
                      </ThemedText>
                      <ThemedText style={[styles.shiftTime, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {formatShiftTime(shift.startTime)} -{" "}
                        {formatShiftTime(shift.endTime)}
                      </ThemedText>
                    </View>
                    {minShiftPrice && (
                      <View style={{ alignItems: 'flex-start' }}>
                        <ThemedText style={[styles.shiftPrice, { textAlign: isRTL ? 'right' : 'left' }]}>
                          {minShiftPrice} {t("common.iqd")}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={[styles.closedChaletBox, { direction: isRTL ? 'rtl' : 'ltr' }]}>
                <SolarForbiddenCircleLineDuotone size={24} color="#EF4444" />
                <ThemedText style={styles.closedChaletText}>
                  {isRTL
                    ? "عذراً، لا تتوفر أي فترات حجز حالياً في هذا الشاليه."
                    : "Sorry, no booking periods are currently available for this chalet."}
                </ThemedText>
              </View>
            )}
          </View>

          {facilities.length > 0 && (
            <>
              <View
                style={[styles.facilitiesHeader, { flexDirection: flexDir }]}
              >
                <SectionHeader
                  title={t("chalet.details.facilities")}
                />
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/chalet-details/facilities/${chaletId}`)
                  }
                >
                  <ThemedText style={styles.viewAllText}>
                    {t("home.seeAll")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <View style={[styles.facilitiesGrid, { flexDirection: flexDir }]}>
                {facilities.slice(0, 8).map((f: any, i: number) => (
                  <View key={i} style={styles.facilityCell}>
                    <View style={styles.shapeCont}>
                      <Svg height={55} width={55} viewBox="0 0 60 60">
                        <Path d={f.shapePath} fill={f.shapeColor} />
                      </Svg>
                      <View style={styles.iconInShape}>
                        {f.iconUrl ? (
                          <ExpoImage
                            source={f.iconUrl}
                            style={styles.facilityIcon}
                            contentFit="contain"
                          />
                        ) : (
                          <SolarWidgetBold size={22} color="white" />
                        )}
                      </View>
                    </View>
                    <ThemedText style={styles.facilityLabelText}>
                      {f.label}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* نظرة عامة */}
          {chaletDescription ? (
            <>
              <SectionHeader title={t("chalet.details.overview")} />
              <View
                style={[
                  styles.descriptionContainer,
                  { direction: isRTL ? "rtl" : "ltr" },
                ]}
              >
                <ThemedText
                  style={[
                    styles.descriptionText,
                    {
                      width: "100%",
                      textAlign: textStart,
                      writingDirection: isRTL ? "rtl" : "ltr",
                    },
                  ]}
                >
                  {chaletDescription}
                </ThemedText>
              </View>
            </>
          ) : null}

          {/* الموقع */}
          <SectionHeader title={t("chalet.details.location")} />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/(customer)/explore")}
            style={styles.mapCardFlat}
          >
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
                    <View style={styles.mapImageMarker}>
                      <ExpoImage
                        source={images[0]}
                        style={styles.mapImageMarkerImg}
                        contentFit="cover"
                      />
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
                  <View style={styles.mapImageMarker}>
                    <ExpoImage
                      source={images[0]}
                      style={styles.mapImageMarkerImg}
                      contentFit="cover"
                    />
                  </View>
                </View>
              )}
              {/* Transparent overlay so tapping the map opens the explore map */}
              <View style={StyleSheet.absoluteFill} />
            </View>
            <View style={styles.mapLocLabel}>
              <ThemedText style={styles.mapLocText}>
                {chaletLocation}
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* المضيف */}
          <HostContactCard
            name={hostName}
            phone={chalet.owner?.phone}
            avatar={hostAvatar}
            isRTL={isRTL}
          />

          {/* التقييم والمراجعات */}
          <View style={[styles.ctaRowReviewMerged, { flexDirection: flexDir }]}>
            <SecondaryButton
              label={t("chalet.details.reviews")}
              iconLabel={String(reviewCount)}
              iconPosition="right"
              isActive={true}
              onPress={() => router.push(`/chalet-details/reviews/${chaletId}`)}
              style={{ width: isRTL ? 160 : 140, marginHorizontal: 8 }}
              height={46}
              variant={isRTL ? undefined : "inverse"}
            />

            <TouchableOpacity
              style={styles.pillTouch}
              onPress={() => router.push(`/chalet-details/reviews/${chaletId}`)}
            >
              <Svg
                width={86}
                height={46}
                viewBox={isRTL ? "0 0 54 29" : "0 0 63 29"}
                style={StyleSheet.absoluteFill}
              >
                <Path
                  d={
                    isRTL
                      ? "M0 14.5C0 6.49187 6.49187 0 14.5 0H46C49.3137 0 52 2.68629 52 6V23C52 26.3137 49.3137 29 46 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
                      : "M0 14.5C0 6.49187 6.49187 0 14.5 0H57C60.3137 0 63 2.68629 63 6V23C63 26.3137 60.3137 29 57 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
                  }
                  fill="#035DF9"
                />
              </Svg>
              <View style={[styles.pillContent, { flexDirection: flexDir }]}>
                <SolarStarBold size={18} color="white" />
                <ThemedText style={styles.customRatingText}>
                  {chaletRating.toFixed(1)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          {/* المراجعات */}
          <SectionHeader title={t("chalet.details.reviews")} />
          {reviews.length === 0 && (
            <View style={styles.emptyReviewsContainer}>
              <ThemedText style={styles.emptyReviewsText}>
                {isRTL
                  ? "لا توجد مراجعات لهذا الشاليه بعد."
                  : "No reviews for this chalet yet."}
              </ThemedText>
            </View>
          )}
          {reviews.slice(0, 2).map((reviewItem: any, i: number) => {
            const customer = reviewItem?.customer;
            const reviewerName =
              customer?.name || (isRTL ? "مستخدم سُنونو" : "Sununo User");
            const reviewComment = reviewItem?.comment || "";
            const reviewRating = reviewItem?.rating || 0;
            const reviewDate = reviewItem?.createdAt
              ? new Date(reviewItem.createdAt).toLocaleDateString()
              : "";
            return (
              <View key={reviewItem?.id || i} style={styles.revComplexCardFlat}>
                <View
                  style={[styles.revHeaderMerged, { flexDirection: flexDir }]}
                >
                  <View style={styles.avatarCircleMerged}>
                    <ExpoImage
                      source={getAvatarSrc(customer?.image)}
                      style={styles.userAvatarImgMerged}
                      contentFit="cover"
                    />
                  </View>

                  <View
                    style={[
                      styles.nameAndBodyMerged,
                      {
                        alignItems: isRTL ? "flex-end" : "flex-start",
                        marginHorizontal: 12,
                      },
                    ]}
                  >
                    <ThemedText style={[styles.reviewerNameMerged, { textAlign: isRTL ? "right" : "left" }]}>
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

                  <View
                    style={[
                      styles.revRatingCornerMerged,
                      { flexDirection: flexDir },
                    ]}
                  >
                    <SolarStarBold size={14} color="#035DF9" />
                    <ThemedText style={styles.revRateNumMerged}>
                      {reviewRating}
                    </ThemedText>
                  </View>
                </View>

                <View
                  style={[styles.dateWrapperMerged, { alignItems: "flex-end" }]}
                >
                  <ThemedText style={styles.revTimeTextMerged}>
                    {reviewDate}
                  </ThemedText>
                </View>
              </View>
            );
          })}

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

          {canReviewData &&
            !canReviewData.canReview &&
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
          <SectionHeader title={t("common.details")} />
          <View
            style={[
              styles.infoIconsGrid,
              { flexDirection: flexDir, justifyContent: "flex-start" },
            ]}
          >
            {[
              {
                label: isRTL ? "شروط الشاليه" : "Chalet Rules",
                Icon: SolarChaletRulesBold,
                color: "#035DF9",
                shapePath: SHAPES.green,
                onPress: () =>
                  router.push({
                    pathname:
                      `/(customer)/chalet-details/info/${chaletId}` as any,
                    params: { type: "terms" },
                  }),
              },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.infoIconCell, { flexDirection: flexDir }]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.infoGearWrap}>
                  <Svg width={55} height={55} viewBox="0 0 60 60">
                    <Path d={item.shapePath} fill={item.color} />
                  </Svg>
                  <View style={styles.infoGearIcon}>
                    <item.Icon size={24} color="white" />
                  </View>
                </View>
                <ThemedText
                  style={[styles.infoLabelText, { marginHorizontal: 16 }]}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* قد يعجبك ايضا */}
          <SectionHeader title={t("chalet.details.related")} />
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
      {availableShifts && availableShifts.length > 0 && (
        <View style={[styles.flatUltimateFooter, { flexDirection: "row", direction: isRTL ? "rtl" : "ltr" }]}>
          <View style={[styles.footerTextSide, { alignItems: "flex-start" }]}>
            <ThemedText style={[styles.footerPriceBig, { textAlign: isRTL ? "right" : "left" }]}>
              {displayPrice} {t("common.iqd")}
            </ThemedText>
            <View style={[styles.footerMetaRow, { flexDirection: "row", direction: isRTL ? "rtl" : "ltr" }]}>
              <SolarClockCircleBold size={12} color="#9CA3AF" />
              <ThemedText
                style={[styles.footerMetaSmall, { textAlign: isRTL ? "right" : "left" }]}
              >
                {selectedShift
                  ? isRTL
                    ? selectedShift.name?.ar || selectedShift.name
                    : selectedShift.name?.en || selectedShift.name
                  : t("chalet.details.morningShift")}
              </ThemedText>
            </View>
          </View>

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
        </View>
      )}

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
    flexWrap: "nowrap",
  },
  shiftCardActive: {
    borderColor: "#035DF9",
    backgroundColor: "#F0F7FF",
  },
  shiftIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftIconCircleActive: {
    backgroundColor: "#035DF9",
  },
  shiftInfo: {
    flex: 1,
    marginHorizontal: 12,
    minWidth: 0,
  },
  shiftName: {
    fontFamily: "Alexandria-Medium",
    fontSize: 15,
    color: "#1E293B",
    flexShrink: 1,
    lineHeight: 24,
  },
  shiftNameActive: {
    fontFamily: "Alexandria-Medium",
    color: "#035DF9",
  },
  shiftTime: {
    fontFamily: "Alexandria-Medium",
    fontSize: 12,
    color: "#64748B",
    flexShrink: 1,
    lineHeight: 20,
  },
  shiftTimeActive: {
    color: "#035DF9",
  },
  shiftPrice: {
    fontFamily: "Alexandria-Medium",
    fontSize: 14,
    color: "#1E293B",
    flexShrink: 0,
    textAlign: "right",
    lineHeight: 22,
  },
  shiftPriceActive: {
    fontFamily: "Alexandria-Medium",
    color: "#035DF9",
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
  ratingVal: { fontSize: 18, fontFamily: "LamaSans-Black", lineHeight: 26 },
  mainTitle: { fontSize: 22, fontFamily: "LamaSans-Black", lineHeight: 32 },
  locationSub: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "LamaSans-Regular",
    lineHeight: 20,
  },
  sectionHeaderContainer: {
    justifyContent: "center",
    marginBottom: 4,
    marginTop: 14,
    paddingVertical: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Medium",
    marginVertical: 4,
    lineHeight: 28,
  },
  specsRow: { flexWrap: "wrap", gap: 8 },
  specTag: {
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexShrink: 1,
  },
  specText: { fontSize: 13, fontFamily: "LamaSans-Bold", flexShrink: 1 },
  viewAllText: { fontSize: 13, color: "#6B7280", fontFamily: "LamaSans-Bold" },
  facilitiesHeader: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginVertical: 10,
    gap: 10,
  },
  facilityCell: {
    width: (SCREEN_WIDTH - 64) / 4,
    alignItems: "center",
    marginBottom: 15,
    minWidth: 0,
  },
  closedChaletBox: {
    backgroundColor: "#FFF5F5",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#FFE3E3",
  },
  closedChaletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#EF4444",
    lineHeight: 22,
  },
  depositRow: {
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  depositLabel: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
  },
  depositValue: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    color: "#035DF9",
  },
  shapeCont: {
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInShape: { position: "absolute" },
  facilityIcon: {
    width: 26,
    height: 26,
  },
  infoIconsGrid: {
    justifyContent: "space-between",
    flexDirection: "row",
  },
  infoIconCell: { width: "23%", alignItems: "center", minWidth: 0 },
  infoGearWrap: {
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  infoGearIcon: { position: "absolute" },
  infoLabelText: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    marginTop: 8,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
    lineHeight: 17,
  },
  facilityLabelText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    marginTop: 6,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
    lineHeight: 18,
  },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 5,
    fontFamily: "LamaSans-Regular",
  },
  descriptionContainer: {
    width: "100%",
  },
  readMoreWrapper: { alignItems: "center", marginTop: 15 },

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
  mapImageMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.medium,
  },
  mapImageMarkerImg: { width: "100%", height: "100%" },
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
  mapLocText: { fontSize: 16, fontFamily: "LamaSans-Black", lineHeight: 24 },
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
    gap: 8,
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
    fontFamily: "Alexandria-Medium",
    lineHeight: 24,
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
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    lineHeight: 24,
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
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    lineHeight: 26,
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
  footerTextSide: { flex: 1, minWidth: 0 },
  footerPriceBig: {
    fontSize: 18,
    fontFamily: "Alexandria-Medium",
    marginBottom: 4,
    flexShrink: 1,
    lineHeight: 26,
  },
  footerMetaRow: { alignItems: "center", gap: 6, flexShrink: 1 },
  footerMetaSmall: {
    fontSize: 10,
    color: "#9CA3AF",
    fontFamily: "LamaSans-SemiBold",
    flexShrink: 1,
    lineHeight: 16,
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
    fontFamily: "Alexandria-Medium",
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
    fontFamily: "Alexandria-Medium",
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
  emptyReviewsContainer: {
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  emptyReviewsText: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "Alexandria-Medium",
  },
  rulesChevronCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rulesRowLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rulesIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  rulesTextContainerCell: {
    flex: 1,
    paddingHorizontal: 16,
  },
  rulesCardTitleText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    marginBottom: 4,
  },
  rulesCardSubtitleText: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    lineHeight: 16,
  },
  rulesChevronBadge: {
    justifyContent: "center",
    alignItems: "center",
  },
});
