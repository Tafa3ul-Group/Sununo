import {
  SolarCalendarMinimalisticBold,
  SolarClockCircleBold,
  SolarCloseBold,
  SolarCloseCircleBold,
  SolarFireBold,
  SolarHeartBold,
  SolarHome2Bold,
  SolarMagnifierBold,
  SolarMapBoldDuotone,
  SolarMapPointBold,
  SolarSettingsBold,
  SolarStarBold,
  SolarTreeBold,
  SolarUsersGroupBold,
  SolarWaterBold,
  SolarWidgetBold,
  SolarWifiBold,
  SolarWindBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import { LoginPromptModal } from "@/components/user/login-prompt-modal";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { RootState } from "@/store";
import {
  useGetChaletReviewsQuery,
  useGetCustomerChaletDetailsQuery,
  useGetFavoriteIdsQuery,
  useGetSimilarChaletsQuery,
  useToggleFavoriteMutation,
} from "@/store/api/customerApiSlice";
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp } from "react-native-reanimated";

import { HostContactCard } from "@/components/user/host-contact-card";
import { useFormatTime } from "@/hooks/useFormatTime";
import Svg, { Path } from "react-native-svg";

import { getImageSrc } from "@/hooks/useImageSrc";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDirection } from "@/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;


import { useGetChaletsMapQuery } from "@/store/api/apiSlice";
import { setFilters, clearFilters } from "@/store/filterSlice";

const SHAPES = {
  blue: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

const FEATURE_ICON_MAP: Record<string, any> = {
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
};

const CARD_COLORS = ["#035DF9", "#15AB64", "#F64300"];

function SectionHeader({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <View
      style={{
        height: 60,
        justifyContent: "center",
        marginBottom: 10,
        marginTop: 15,
        alignItems: "flex-start",
      }}
    >
      <ThemedText
        style={{
          fontSize: 14,
          fontFamily: "Alexandria-Medium",
          color: "#111827",
        }}
      >
        {title}
      </ThemedText>
    </View>
  );
}

// ── Active Filter Banner ──────────────────────────────────────────────────────
function ActiveFilterBanner({
  filter,
  isRTL,
  onClear,
}: {
  filter: any;
  isRTL: boolean;
  onClear: () => void;
}) {
  const filterItems = useMemo(() => {
    const items = [];
    if (filter.cityName) {
      items.push({
        id: "city",
        text: filter.cityName,
        icon: <SolarMapPointBold size={14} color={Colors.primary} />,
      });
    }
    if (filter.checkIn) {
      const dateText = new Date(filter.checkIn).toLocaleDateString(
        isRTL ? "ar" : "en",
        { month: "short", day: "numeric" },
      );
      items.push({
        id: "date",
        text: dateText,
        icon: (
          <SolarCalendarMinimalisticBold size={14} color={Colors.primary} />
        ),
      });
    }
    if (filter.period) {
      const periodMap: Record<string, string> = {
        morning: isRTL ? "صباحي" : "Morning",
        evening: isRTL ? "مسائي" : "Evening",
        overnight: isRTL ? "مبيت" : "Overnight",
      };
      items.push({
        id: "period",
        text: periodMap[filter.period] || filter.period,
        icon: <SolarClockCircleBold size={14} color={Colors.primary} />,
      });
    }
    if (filter.maxGuests) {
      items.push({
        id: "guests",
        text: `${filter.maxGuests} ${isRTL ? "ضيف" : "guests"}`,
        icon: <SolarUsersGroupBold size={14} color={Colors.primary} />,
      });
    }
    return items;
  }, [filter, isRTL]);

  if (filterItems.length === 0) return null;

  const flexDir: "row" | "row-reverse" = isRTL ? "row-reverse" : "row";

  return (
    <View style={filterBannerStyles.container}>
      <View style={[filterBannerStyles.content, { flexDirection: flexDir }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            filterBannerStyles.scrollContent,
            { flexDirection: flexDir },
          ]}
        >
          {filterItems.map((item) => (
            <View
              key={item.id}
              style={[filterBannerStyles.pill, { flexDirection: flexDir }]}
            >
              {item.icon}
              <ThemedText style={filterBannerStyles.pillText}>
                {item.text}
              </ThemedText>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={filterBannerStyles.clearBtn} onPress={onClear}>
          <SolarCloseBold size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const { isAuthenticated, user, userType } = useSelector(
    (state: RootState) => state.auth,
  );
  const { isRTL, rowDirection, textAlign } = useDirection();
  const textStart: "left" | "right" = textAlign;
  const flexDir: "row" | "row-reverse" = rowDirection;
  const router = useRouter();
  const { id, showMyLocation } = useLocalSearchParams();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Map State
  const [zoom, setZoom] = useState(6);
  const [cameraPosition, setCameraPosition] = useState<[number, number]>([
    44.36, 33.31,
  ]);

  // Filtering State
  const [search, setSearch] = useState("");
  const [maxAdults, setMaxAdults] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Bottom Sheet Ref for Filters
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const dispatch = useDispatch();

  // Global Filters from Redux
  const activeFilters = useSelector(
    (state: RootState) => (state as any).filter,
  );

  // API Data
  const { data: chaletsResponse, isLoading: isChaletsLoading } =
    useGetChaletsMapQuery({
      limit: zoom >= 14 ? 300 : zoom >= 10 ? 150 : zoom >= 6 ? 80 : 40,
      search: search || activeFilters?.search || undefined,
      capacity: maxAdults
        ? parseInt(maxAdults)
        : activeFilters?.maxGuests || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      cityId: activeFilters?.cityId || undefined,
      zoom: Math.round(zoom),
    });

  const chaletsRaw = chaletsResponse?.data || [];

  const [selectedChalet, setSelectedChalet] = useState<any>(null);
  const browsingRegionRef = useRef<{ center: [number, number]; zoom: number }>({
    center: [44.36, 33.31],
    zoom: 6,
  });
  const [currentMapRegion, setCurrentMapRegion] = useState({
    center: [44.36, 33.31] as [number, number],
    zoom: 6,
  });
  // Moved FILTER_OPTIONS inside component to use translations
  const FILTER_OPTIONS = useMemo(
    () => [
      {
        id: "all",
        label: t("home.categories.all"),
        icon: (isActive: boolean) => (
          <SolarWidgetBold
            size={18}
            color={isActive ? "white" : Colors.primary}
          />
        ),
        activeColor: Colors.primary,
      },
      {
        id: "pool",
        label: t("home.categories.pool"),
        icon: (isActive: boolean) => (
          <SolarWaterBold
            size={18}
            color={isActive ? "white" : Colors.secondary}
          />
        ),
        activeColor: Colors.secondary,
      },
      {
        id: "bbq",
        label: t("home.categories.bbq"),
        icon: (isActive: boolean) => (
          <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />
        ),
        activeColor: Colors.accent,
      },
      {
        id: "garden",
        label: t("home.categories.garden"),
        icon: (isActive: boolean) => (
          <SolarTreeBold
            size={18}
            color={isActive ? "white" : Colors.secondary}
          />
        ),
        activeColor: Colors.secondary,
      },
    ],
    [t],
  );

  const [preSelectionRegion, setPreSelectionRegion] = useState<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const showMapToolsRef = useRef(false);

  const MOCK_CHALETS = useMemo(() => {
    return chaletsRaw
      .filter((item: any) => {
        const lng = Number(item.longitude);
        const lat = Number(item.latitude);
        return lng && lat && lng !== 0 && lat !== 0;
      })
      .map((item: any) => {
        const mainImage =
          item.images?.find((img: any) => img.isMain) || item.images?.[0];

        return {
          id: item.id,
          title: item.name,
          location: item.address,
          price: (item.basePrice || "0").toLocaleString(),
          rating: item.rating || 0,
          color: Colors.primary,
          image: getImageSrc(mainImage?.url),
          allImages: (item.images || []).map((img: any) =>
            getImageSrc(img.url),
          ),
          coordinates: [Number(item.longitude), Number(item.latitude)] as [
            number,
            number,
          ],
          description: isRTL ? item.description?.ar : item.description?.en,
          area: item.area,
          maxAdults: item.maxAdults,
          maxChildren: item.maxChildren,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
        };
      });
  }, [chaletsRaw, isRTL]);

  const handleCameraChanged = useCallback(
    (center: [number, number], zoomLevel: number) => {
      setCurrentMapRegion({ center, zoom: zoomLevel });
      setZoom(zoomLevel);
      setCameraPosition(center);
      if (!selectedChalet) {
        browsingRegionRef.current = { center, zoom: zoomLevel };
      }
    },
    [selectedChalet],
  );

  // Navigation & Routing State
  const [route, setRoute] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMapTools, setShowMapTools] = useState(false);

  const toggleMapTools = (val: boolean) => {
    setShowMapTools(val);
    showMapToolsRef.current = val;
  };

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["35%", "94%"], []);

  // Handle auto-selection if ID is passed in params
  useEffect(() => {
    if (id && MOCK_CHALETS.length > 0) {
      const chalet = MOCK_CHALETS.find((c) => c.id === id);
      if (chalet) {
        // Use a small delay to ensure everything is ready
        const timer = setTimeout(() => {
          handleSelectChalet(chalet);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [id, MOCK_CHALETS.length]);

  // Center map on user location when showMyLocation param is passed
  useEffect(() => {
    if (!showMyLocation) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setCameraPosition([loc.coords.longitude, loc.coords.latitude]);
      setZoom(14);
    })();
  }, [showMyLocation]);

  useEffect(() => {
    let subscription: any = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      // Center map on user location initially
      setCameraPosition([loc.coords.longitude, loc.coords.latitude]);
      setZoom(14);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
        },
        (newLoc) => {
          setLocation(newLoc);
        },
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const { formatShiftTime } = useFormatTime();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch full details when a chalet is selected
  const { data: chaletFullDetails, isLoading: isDetailsLoading } =
    useGetCustomerChaletDetailsQuery(selectedChalet?.id, {
      skip: !selectedChalet?.id,
    });

  const { data: reviewsResponse } = useGetChaletReviewsQuery(
    { chaletId: selectedChalet?.id, page: 1, limit: 5 },
    {
      skip: !selectedChalet?.id,
    },
  );

  const { data: similarResponse } = useGetSimilarChaletsQuery(
    selectedChalet?.id,
    {
      skip: !selectedChalet?.id,
    },
  );

  const { data: favoriteIds = [], refetch: refetchFavorites } =
    useGetFavoriteIdsQuery(undefined, {
      skip: !isAuthenticated,
    });

  const [toggleFavorite] = useToggleFavoriteMutation();

  const handleToggleFavorite = async (chaletId: string) => {
    try {
      await toggleFavorite(chaletId).unwrap();
      refetchFavorites();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const chaletDetails = chaletFullDetails || ({} as any);
  const reviews = reviewsResponse?.data || [];
  const chaletRating =
    chaletDetails.averageRating || selectedChalet?.rating || 0;

  // Memoized similar-chalets data for HorizontalSwiper to avoid expensive
  // re-transformation on every render.
  const swiperData = useMemo(
    () =>
      (similarResponse || []).map((item: any, index: number) => ({
        id: item.id,
        title: isRTL
          ? item.name?.ar || item.name
          : item.name?.en || item.name,
        location: isRTL
          ? item.city?.name || ""
          : item.city?.enName || item.city?.name || "",
        price: item.basePrice
          ? Number(item.basePrice).toLocaleString()
          : "0",
        rating: item.rating || 0,
        image: getImageSrc(item.images?.[0]?.url),
        color: CARD_COLORS[index % CARD_COLORS.length],
      })),
    [similarResponse, isRTL],
  );

  const handleSwiperCardPress = useCallback(
    (cardId: string) => {
      router.push(`/chalet-details/${cardId}`);
    },
    [router],
  );

  // Memoized review data with pre-computed image sources, transformed once
  // instead of on every render.
  const reviewData = useMemo(
    () =>
      (reviews || []).map((reviewItem: any, i: number) => {
        const customer = reviewItem?.customer;
        return {
          key: reviewItem.id || i,
          reviewerName:
            customer?.name || (isRTL ? "مستخدم سُنونو" : "Sununo User"),
          reviewComment: reviewItem?.comment || "",
          reviewRating: reviewItem?.rating || 0,
          reviewDate: reviewItem?.createdAt
            ? new Date(reviewItem.createdAt).toLocaleDateString()
            : "",
          avatarSource: customer?.image
            ? getImageSrc(customer.image)
            : require("@/assets/profile.svg"),
        };
      }),
    [reviews, isRTL],
  );

  // Memoized static map image URL for the selected chalet location.
  const mapImageUri = useMemo(
    () =>
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+${Colors.primary.replace("#", "")}(${chaletDetails.longitude || 44.3661},${chaletDetails.latitude || 33.3152})/${chaletDetails.longitude || 44.3661},${chaletDetails.latitude || 33.3152},14/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`,
    [chaletDetails.longitude, chaletDetails.latitude],
  );

  const renderFooter = useCallback(
    (props: any) => {
      if (!selectedChalet) return null;
      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            style={[
              styles.stickyFooterMain,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View
              style={[styles.footerContent, { flexDirection: flexDir }]}
            >
              <View style={[styles.priceContainer, { justifyContent: "center" }]}>
                <ThemedText style={[styles.footerPrice, { textAlign: textStart }]}>
                  {isRTL ? "" : "IQD "}
                  {selectedChalet.price}
                  {isRTL ? " د.ع" : ""}
                </ThemedText>
              </View>

              <PrimaryButton
                label={isRTL ? "احجز الان" : "Book Now"}
                onPress={() => {
                  if (userType === "guest") {
                    setShowLoginPrompt(true);
                    return;
                  }
                  bottomSheetRef.current?.dismiss();
                  router.push(
                    `/(customer)/booking/complete?id=${selectedChalet.id}`,
                  );
                }}
                style={{ width: normalize.width(140) }}
              />
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [selectedChalet, isRTL, insets.bottom, flexDir, textStart, userType, router],
  );

  const handleSelectChalet = (chalet: any) => {
    Keyboard.dismiss();
    setActiveImageIndex(0); // Reset index
    // Save previous camera state if not already in selection mode
    if (!selectedChalet) {
      setPreSelectionRegion({
        center: currentMapRegion.center,
        zoom: currentMapRegion.zoom,
      });
    }

    setSelectedChalet(chalet);

    // Zoom in on chalet
    setZoom(15);
    setCameraPosition(chalet.coordinates);

    bottomSheetRef.current?.present();
  };

  const handleDismissSheet = () => {
    // If not navigating, restore pre-selection zoom
    if (!showMapToolsRef.current && preSelectionRegion) {
      setZoom(preSelectionRegion.zoom);
      setCameraPosition(preSelectionRegion.center);
      setPreSelectionRegion(null);
    }
    // We don't nullify selectedChalet here to keep route active if navigating
  };

  const getRoute = async () => {
    if (!location || !selectedChalet) return;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${location.coords.longitude},${location.coords.latitude};${selectedChalet.coordinates[0]},${selectedChalet.coordinates[1]}?alternatives=false&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        setRoute(data.routes[0].geometry);
        setRouteInfo({
          distance: (data.routes[0].distance / 1000).toFixed(1),
          duration: Math.round(data.routes[0].duration / 60),
        });
      }
    } catch (e) {
      console.error("Routing error:", e);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    [],
  );

  const handleFilterPress = () => {
    filterSheetRef.current?.present();
  };

  const handleApplyFilters = () => {
    dispatch(setFilters({
      search: search || null,
      maxGuests: maxAdults ? parseInt(maxAdults) : null,
    }));
    filterSheetRef.current?.dismiss();
  };

  const handleResetFilters = () => {
    setSearch("");
    setMaxAdults("");
    setMinPrice("");
    setMaxPrice("");
    dispatch(clearFilters());
    filterSheetRef.current?.dismiss();
  };

  const hasActiveFilters = search || maxAdults || minPrice || maxPrice;

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="dark" />

      {isChaletsLoading && !chaletsRaw.length && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      <AppMap
        markers={MOCK_CHALETS}
        onSelectMarker={handleSelectChalet}
        onPress={() => Keyboard.dismiss()}
        selectedChalet={selectedChalet}
        route={route}
        location={location}
        isNavigating={isNavigating}
        zoomLevel={zoom}
        centerCoordinate={cameraPosition}
        onCameraChanged={handleCameraChanged}
      />

      {/* Conditional Interface Elements */}
      <View
        style={[
          styles.topOverlay,
          { paddingTop: insets.top + normalize.height(10) },
        ]}
      >
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <SolarMagnifierBold size={20} color={Colors.text.muted} />
            <TextInput
              style={[
                styles.searchInput,
                { textAlign: textStart },
              ]}
              placeholder={
                isRTL
                  ? "ابحث عن شاليه باسمه أو مكانه..."
                  : "Search by name or location..."
              }
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <SolarCloseCircleBold size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active Filter Indicator */}
        {activeFilters?.isActive && (
          <ActiveFilterBanner
            filter={activeFilters}
            isRTL={isRTL}
            onClear={() => {
              dispatch(clearFilters());
            }}
          />
        )}

        {/* Removed CategoryTabs from here as requested to be moved to filter sheet */}
      </View>

      {/* Vertical Navigation Actions - Fixed on the right */}
      {showMapTools && (
        <View style={styles.rightNavActions}>
          <TouchableOpacity
            style={[styles.navCircleFab, { backgroundColor: Colors.primary }]}
            onPress={() => setIsNavigating(!isNavigating)}
          >
            <SolarMapBoldDuotone size={26} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navCircleFab,
              {
                backgroundColor: "#FEE2E2",
                borderColor: "#EF4444",
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              setRoute(null);
              setRouteInfo(null);
              setIsNavigating(false);
              toggleMapTools(false);
              setSelectedChalet(null);

              if (preSelectionRegion) {
                setZoom(preSelectionRegion.zoom);
                setCameraPosition(preSelectionRegion.center);
                setPreSelectionRegion(null);
              } else {
                setZoom(13);
              }
            }}
          >
            <SolarCloseBold size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        onDismiss={handleDismissSheet}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
        style={styles.bottomSheet}
        onChange={(index) => {
          setIsExpanded(index >= 1);
        }}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {selectedChalet && (
            <View style={styles.cardContainer}>
              {/* Image Carousel Swiper */}
              <View style={styles.imageCarouselContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40),
                    );
                    setActiveImageIndex(index);
                  }}
                  scrollEventThrottle={16}
                  style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                >
                  {(selectedChalet.allImages || [selectedChalet.image]).map(
                    (img: any, index: number) => (
                      <Image
                        key={index}
                        source={img}
                        style={[
                          styles.carouselImage,
                          { transform: [{ scaleX: isRTL ? -1 : 1 }] },
                        ]}
                      />
                    ),
                  )}
                </ScrollView>

                {/* Heart / Favorite Button */}
                <TouchableOpacity style={styles.favoriteBtn}>
                  <SolarHeartBold size={24} color="#FF4B4B" />
                </TouchableOpacity>

                {/* Pagination Dots */}
                <View style={styles.paginationDots}>
                  {(selectedChalet.allImages || [selectedChalet.image]).map(
                    (_: any, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              activeImageIndex === index
                                ? Colors.primary
                                : "rgba(255,255,255,0.5)",
                            width: activeImageIndex === index ? 10 : 8,
                            height: activeImageIndex === index ? 10 : 8,
                          },
                        ]}
                      />
                    ),
                  )}
                </View>
              </View>

              {/* Title + Rating Row */}
              <View
                style={[styles.mainInfoRow, { flexDirection: flexDir }]}
              >
                {/* Title and Location - first child = END side in RTL */}
                <View
                  style={styles.titleSection}
                >
                  <ThemedText style={[styles.chaletTitleMain, { textAlign: textStart }]}>
                    {typeof selectedChalet?.title === "string"
                      ? selectedChalet.title
                      : (isRTL
                          ? selectedChalet?.title?.ar
                          : selectedChalet?.title?.en) || ""}
                  </ThemedText>
                  <ThemedText style={[styles.chaletLocationSub, { textAlign: textStart }]}>
                    {typeof selectedChalet?.location === "string"
                      ? selectedChalet.location
                      : (isRTL
                          ? selectedChalet?.location?.ar
                          : selectedChalet?.location?.en) || ""}
                  </ThemedText>
                </View>

                {/* Rating - second child = START side in RTL */}
                <View style={[styles.ratingSection, { flexDirection: flexDir }]}>
                  <ThemedText style={styles.ratingValue}>
                    {selectedChalet.rating ? Number(selectedChalet.rating).toFixed(1) : (isRTL ? "جديد" : "New")}
                  </ThemedText>
                  <SolarStarBold size={20} color={Colors.primary} />
                </View>
              </View>

              {/* Specifications Section */}
              <View style={styles.specsSection}>
                <ThemedText style={[styles.sectionLabel, { textAlign: textStart }]}>
                  {isRTL ? "المواصفات الاساسية" : "Basic Specifications"}
                </ThemedText>
                <View style={[styles.specsContainer, { flexDirection: flexDir, flexWrap: "wrap" }]}>
                  {selectedChalet.category && (
                    <View style={styles.specChip}>
                      <ThemedText style={styles.specText}>
                        {typeof selectedChalet.category === "string"
                          ? selectedChalet.category
                          : (isRTL ? selectedChalet.category?.ar : selectedChalet.category?.en) || (isRTL ? "بستان مع بيت" : "Garden with house")}
                      </ThemedText>
                    </View>
                  )}
                  {!selectedChalet.category && (
                    <View style={styles.specChip}>
                      <ThemedText style={styles.specText}>
                        {isRTL ? "بستان مع بيت" : "Garden with house"}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.specChip}>
                    <ThemedText style={styles.specText}>
                      {selectedChalet.area || 0} {isRTL ? "م" : "m"}
                    </ThemedText>
                  </View>
                  <View style={styles.specChip}>
                    <ThemedText style={styles.specText}>
                      {selectedChalet.bathrooms || 0} {isRTL ? "حمام" : "Bath"}
                    </ThemedText>
                  </View>
                  <View style={styles.specChip}>
                    <ThemedText style={styles.specText}>
                      {selectedChalet.bedrooms || 0} {isRTL ? "غرف" : "Rooms"}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Go to Route Button */}
              <View style={styles.routeButtonContainer}>
                <SecondaryButton
                  label={isRTL ? "اذهب للمسار" : "Get Directions"}
                  isActive={true}
                  activeColor="#22C55E"
                  activeTextColor="#FFFFFF"
                  icon={
                    <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
                      <Path d="M13.3023 8.21378C13.3526 8.18866 13.4075 8.174 13.4637 8.17068C13.5198 8.16735 13.5761 8.17543 13.629 8.19443C13.682 8.21343 13.7305 8.24296 13.7718 8.28123C13.813 8.3195 13.846 8.36572 13.8689 8.41712L17.3631 16.2521C17.9189 17.4979 16.6839 18.7913 15.5281 18.1738L10.6081 15.5471C10.2248 15.3429 9.77476 15.3429 9.39226 15.5471L4.47226 18.1738C3.31642 18.7913 2.08142 17.4988 2.63726 16.2521L3.94726 13.3146C4.10441 12.9623 4.37891 12.6755 4.72392 12.5029L13.3023 8.21378Z" fill="white"/>
                      <Path opacity={0.5} d="M12.8251 7.0554C12.9213 7.00754 12.9953 6.9244 13.0316 6.82331C13.0679 6.72223 13.0638 6.61103 13.0201 6.5129L11.2276 2.49373C10.736 1.39123 9.26513 1.39123 8.77346 2.49373L5.4668 9.90873C5.43182 9.98715 5.42193 10.0745 5.43847 10.1587C5.45501 10.243 5.49717 10.32 5.55919 10.3794C5.62121 10.4388 5.70006 10.4776 5.78496 10.4904C5.86985 10.5033 5.95664 10.4896 6.03346 10.4512L12.8251 7.0554Z" fill="white"/>
                    </Svg>
                  }
                  iconPosition={isRTL ? "left" : "right"}
                  onPress={() => {
                    if (selectedChalet?.coordinates) {
                      const lat = selectedChalet.coordinates[1];
                      const lng = selectedChalet.coordinates[0];
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                      Linking.openURL(url);
                    }
                  }}
                  style={{ flex: 1 }}
                  height={52}
                />
              </View>

              {/* Seamless Full Details Content (Visible when expanded) */}
              {isExpanded && (
                <View style={{ marginTop: 20 }}>
                  {isDetailsLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ marginTop: 20 }}
                    />
                  ) : (
                    <>
                      {/* Shifts Section */}
                      <Animated.View
                        entering={FadeInUp.delay(50).duration(300)}
                      >
                        <SectionHeader
                          title={
                            isRTL ? "الشفتات المتوفرة" : "Available Shifts"
                          }
                          isRTL={isRTL}
                        />
                        <View style={{ gap: 10, marginBottom: 10 }}>
                          {(chaletDetails.shifts || []).map(
                            (shift: any, index: number) => (
                              <View
                                key={shift.id || index}
                                style={{
                                  backgroundColor: "#F3F7FF",
                                  borderRadius: 12,
                                  padding: 12,
                                  alignItems: "center",
                                  gap: 12,
                                  flexDirection: flexDir,
                                }}
                              >
                                <View
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: "white",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <SolarClockCircleBold
                                    size={20}
                                    color={Colors.primary}
                                  />
                                </View>
                                <View
                                  style={{
                                    flex: 1,
                                    alignItems: isRTL ? "flex-end" : "flex-start",
                                  }}
                                >
                                  <ThemedText
                                    style={{
                                      fontSize: 14,
                                      fontFamily: "Alexandria-Medium",
                                      color: "#1F2937",
                                    }}
                                  >
                                    {isRTL
                                      ? shift.name?.ar || shift.name
                                      : shift.name?.en || shift.name}
                                  </ThemedText>
                                  <ThemedText
                                    style={{
                                      fontSize: 8,
                                      fontFamily: "Alexandria-Medium",
                                      color: "#6B7280",
                                      marginTop: 2,
                                    }}
                                  >
                                    {formatShiftTime(shift.startTime)} -{" "}
                                    {formatShiftTime(shift.endTime)}
                                  </ThemedText>
                                </View>
                              </View>
                            ),
                          )}
                        </View>
                      </Animated.View>

                      {/* Facilities Section */}
                      <Animated.View
                        entering={FadeInUp.delay(100).duration(300)}
                      >
                        <SectionHeader
                          title={isRTL ? "المرافق" : "Facilities"}
                          isRTL={isRTL}
                        />
                        <View
                          style={{
                            flexDirection: flexDir,
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            marginVertical: 15,
                          }}
                        >
                          {(chaletDetails.chaletFeatures || []).map(
                            (item: any, idx: number) => {
                              const feature = item.feature || item;
                              const Icon =
                                FEATURE_ICON_MAP[feature.icon] ||
                                SolarWidgetBold;
                              return (
                                <View
                                  key={idx}
                                  style={{
                                    width: "23%",
                                    alignItems: "center",
                                    marginBottom: 20,
                                  }}
                                >
                                  <View
                                    style={{
                                      width: 55,
                                      height: 55,
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Svg
                                      height={55}
                                      width={55}
                                      viewBox="0 0 60 60"
                                    >
                                      <Path
                                        d={SHAPES.blue}
                                        fill={
                                          CARD_COLORS[idx % CARD_COLORS.length]
                                        }
                                      />
                                    </Svg>
                                    <View style={{ position: "absolute" }}>
                                      <Icon size={22} color="white" />
                                    </View>
                                  </View>
                                  <ThemedText
                                    style={{
                                      fontSize: 8,
                                      fontFamily: "Alexandria-Medium",
                                      marginTop: 6,
                                      textAlign: "center",
                                    }}
                                  >
                                    {isRTL
                                      ? feature.name?.ar
                                      : feature.name?.en}
                                  </ThemedText>
                                </View>
                              );
                            },
                          )}
                        </View>
                      </Animated.View>

                      {/* Overview Section */}
                      <Animated.View
                        entering={FadeInUp.delay(150).duration(300)}
                      >
                        <SectionHeader
                          title={isRTL ? "نظرة عامة" : "Overview"}
                          isRTL={isRTL}
                        />
                        <View
                          style={{
                            alignItems: "flex-start",
                            marginBottom: 10,
                          }}
                        >
                          <ThemedText
                            style={{
                              fontSize: 14,
                              color: "#64748B",
                              lineHeight: 22,
                              textAlign: textStart,
                            }}
                          >
                            {isRTL
                              ? chaletDetails.description?.ar
                              : chaletDetails.description?.en}
                          </ThemedText>
                        </View>
                      </Animated.View>

                      {/* Host Section */}
                      <Animated.View
                        entering={FadeInUp.delay(200).duration(300)}
                      >
                        <HostContactCard
                          name={
                            chaletDetails.owner?.name ||
                            (isRTL ? "المضيف" : "Host")
                          }
                          avatar={
                            chaletDetails.owner?.image
                              ? getImageSrc(chaletDetails.owner.image)
                              : null
                          }
                          isRTL={isRTL}
                        />
                      </Animated.View>

                      {/* Location Section */}
                      <Animated.View
                        entering={FadeInUp.delay(250).duration(300)}
                      >
                        <SectionHeader
                          title={isRTL ? "الموقع" : "Location"}
                          isRTL={isRTL}
                        />
                        <View style={styles.mapCardFlat}>
                          <View style={styles.mapInner}>
                            <Image
                              source={{ uri: mapImageUri }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          </View>
                          <View
                            style={{
                              paddingVertical: 14,
                              alignItems: "center",
                              backgroundColor: "white",
                              borderBottomLeftRadius: 20,
                              borderBottomRightRadius: 20,
                            }}
                          >
                            <ThemedText
                              style={{
                                fontSize: 14,
                                fontFamily: "Alexandria-Medium",
                                color: Colors.primary,
                              }}
                            >
                              {isRTL
                                ? chaletDetails.region?.name?.ar
                                : chaletDetails.region?.name?.en ||
                                  chaletDetails.address?.ar ||
                                  chaletDetails.address?.en ||
                                  ""}
                            </ThemedText>
                            <ThemedText
                              style={{
                                fontSize: 8,
                                color: "#64748B",
                                fontFamily: "Alexandria-Medium",
                                marginTop: 2,
                              }}
                            >
                              {isRTL
                                ? "انقر لرؤية الموقع بدقة"
                                : "Click to see precise location"}
                            </ThemedText>
                          </View>
                        </View>
                      </Animated.View>

                      {/* Reviews Section */}
                      <Animated.View
                        entering={FadeInUp.delay(300).duration(300)}
                      >
                        <SectionHeader
                          title={isRTL ? "التقييمات" : "Reviews"}
                          isRTL={isRTL}
                        />
                        {reviewData.length > 0 ? (
                          reviewData
                            .slice(0, 2)
                            .map((review: any) => {
                              const reviewerName = review.reviewerName;
                              const reviewComment = review.reviewComment;
                              const reviewRating = review.reviewRating;
                              const reviewDate = review.reviewDate;
                              return (
                                <View
                                  key={review.key}
                                  style={styles.revComplexCardFlat}
                                >
                                  <View
                                    style={[
                                      styles.revHeaderMerged,
                                      { flexDirection: flexDir },
                                    ]}
                                  >
                                    {/* Avatar */}
                                    <View style={styles.avatarCircleMerged}>
                                      <Image
                                        source={review.avatarSource}
                                        style={styles.userAvatarImgMerged}
                                      />
                                    </View>

                                    {/* Name + Comment */}
                                    <View
                                      style={[
                                        styles.nameAndBodyMerged,
                                        {
                                          alignItems: isRTL ? "flex-end" : "flex-start",
                                          marginHorizontal: 12,
                                        },
                                      ]}
                                    >
                                      <ThemedText
                                        style={[styles.reviewerNameMerged, { textAlign: textStart }]}
                                      >
                                        {reviewerName}
                                      </ThemedText>
                                      <ThemedText
                                        style={[
                                          styles.revMessageMerged,
                                          { textAlign: textStart },
                                        ]}
                                      >
                                        {reviewComment}
                                      </ThemedText>
                                    </View>

                                    {/* Rating */}
                                    <View
                                      style={[
                                        styles.revRatingCornerMerged,
                                        { flexDirection: flexDir },
                                      ]}
                                    >
                                      <SolarStarBold size={14} color={Colors.primary} />
                                      <ThemedText style={styles.revRateNumMerged}>
                                        {reviewRating}
                                      </ThemedText>
                                    </View>
                                  </View>

                                  {/* Date */}
                                  {reviewDate ? (
                                    <View
                                      style={[styles.dateWrapperMerged, { alignItems: "flex-end" }]}
                                    >
                                      <ThemedText style={styles.revTimeTextMerged}>
                                        {reviewDate}
                                      </ThemedText>
                                    </View>
                                  ) : null}
                                </View>
                              );
                            })
                        ) : (
                          <ThemedText
                            style={{
                              textAlign: "center",
                              color: "#94A3B8",
                              marginTop: 10,
                            }}
                          >
                            {isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}
                          </ThemedText>
                        )}
                      </Animated.View>

                      {/* Similar Chalets Section */}
                      <Animated.View
                        entering={FadeInUp.delay(350).duration(300)}
                      >
                        <SectionHeader
                          title={
                            isRTL ? "قد يعجبك أيضاً" : "You might also like"
                          }
                          isRTL={isRTL}
                        />
                        <HorizontalSwiper
                          data={swiperData}
                          onPressCard={handleSwiperCardPress}
                          favoriteIds={favoriteIds}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </Animated.View>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Advanced Filter Sheet */}
      <BottomSheetModal
        ref={filterSheetRef}
        index={0}
        snapPoints={["65%"]}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.filterModalContent}
        >
          <Text style={styles.filterModalTitle}>
            {isRTL ? "تصفية النتائج" : "Filter Results"}
          </Text>

          {/* Categories Tab Section (Moved from Home page style) */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>
              {isRTL ? "الأقسام" : "Categories"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: 10,
                gap: 10,
                flexDirection: flexDir,
              }}
            >
              {FILTER_OPTIONS.map((filter) => (
                <SecondaryButton
                  key={filter.id}
                  label={filter.label}
                  isActive={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  icon={filter.icon(activeFilter === filter.id)}
                  onPress={() => setActiveFilter(filter.id)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>
              {isRTL ? "عدد البالغين" : "Max Adults"}
            </Text>
            <BottomSheetTextInput
              style={[
                styles.modalInput,
                { textAlign: textStart },
              ]}
              placeholder={isRTL ? "مثلاً: 5" : "e.g. 5"}
              keyboardType="numeric"
              value={maxAdults}
              onChangeText={setMaxAdults}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>
              {isRTL ? "نطاق السعر (د.ع)" : "Price Range (IQD)"}
            </Text>
            <View style={[styles.priceRow, { flexDirection: flexDir }]}>
              <BottomSheetTextInput
                style={[
                  styles.modalInput,
                  { flex: 1, textAlign: textStart },
                ]}
                placeholder={isRTL ? "من" : "Min"}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <View style={styles.priceSpacer} />
              <BottomSheetTextInput
                style={[
                  styles.modalInput,
                  { flex: 1, textAlign: textStart },
                ]}
                placeholder={isRTL ? "إلى" : "Max"}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <SecondaryButton
              label={isRTL ? "إعادة ضبط" : "Reset"}
              onPress={handleResetFilters}
              style={{ flex: 1 }}
              height={50}
            />
            <PrimaryButton
              label={isRTL ? "تطبيق الفلترة" : "Apply Filters"}
              onPress={handleApplyFilters}
              style={{ flex: 1 }}
              height={50}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
      <LoginPromptModal
        isVisible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => {
          setShowLoginPrompt(false);
          bottomSheetRef.current?.dismiss();
          router.push("/(auth)/login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    width: "100%",
    zIndex: 10,
  },
  filterChips: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    ...Shadows.small,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1F2937",
  },
  bottomSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...Shadows.large,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  cardContainer: {
    width: "100%",
  },
  cardHeader: {
    gap: 16,
  },
  chaletThumb: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
  },
  imageCarouselContainer: {
    width: "100%",
    height: 250,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  carouselImage: {
    width: SCREEN_WIDTH - 40,
    height: 250,
    resizeMode: "cover",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: "white",
    fontSize: 8,
    fontFamily: "Alexandria-Medium",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  chaletTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  locationRow: {
    alignItems: "center",
    gap: 4,
  },
  chaletLocation: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Alexandria-Medium",
  },
  ratingRow: {
    alignItems: "center",
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  ratingText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1F2937",
    marginLeft: 4,
  },
  rightNavActions: {
    position: "absolute",
    right: 20,
    top: SCREEN_HEIGHT * 0.35,
    gap: 12,
    zIndex: 30,
  },
  navInfoCard: {
    flex: 1,
    backgroundColor: "white",
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.medium,
    paddingHorizontal: 20,
  },
  navInfoItem: {
    alignItems: "center",
    flex: 1,
  },
  navInfoVal: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  navInfoLbl: {
    fontSize: 8,
    color: "#9CA3AF",
    fontFamily: "Alexandria-Medium",
    textTransform: "uppercase",
  },
  navCircleFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  navSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
  },
  navActionBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  navActionText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
  enhancedInfoGrid: {
    marginTop: 24,
    paddingHorizontal: 0,
    gap: 8,
  },
  enhancedInfoItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Shadows.small,
  },
  enhancedInfoValue: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginTop: 6,
  },
  enhancedInfoLabel: {
    fontSize: 8,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    marginTop: 2,
    textTransform: "uppercase",
  },
  cardActionsWrapper: {
    marginTop: 24,
    paddingBottom: 20,
  },
  mainActionsRow: {
    gap: 12,
  },
  navOutlineBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navOutlineText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },

  // New Design Styles
  mainInfoRow: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20,
    paddingHorizontal: 0,
    width: "100%",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingValue: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  titleSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chaletTitleMain: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  chaletLocationSub: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Alexandria-Medium",
    marginTop: 2,
  },
  specsSection: {
    marginTop: 24,
    width: "100%",
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  specsContainer: {
    gap: 8,
    paddingHorizontal: 0,
  },
  specChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  specText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#334155",
  },
  routeButtonContainer: {
    marginTop: 20,
    width: "100%",
    alignSelf: "stretch",
  },
  favoriteBtn: {
    position: "absolute",
    top: 16,
    end: 16,
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.medium,
  },
  paginationDots: {
    position: "absolute",
    bottom: 16,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerSpacer: {
    height: 0,
  },
  footerContentInFlow: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 20,
  },
  stickyFooterMain: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 20,
    paddingTop: 16,
    ...Shadows.large,
  },
  footerContent: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  mapCardFlat: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    ...Shadows.medium,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  mapInner: {
    width: "100%",
    height: 180,
    backgroundColor: "#F3F4F6",
  },
  priceContainer: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#000000",
  },
  bookButtonCustom: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
  },
  buttonMainShape: {
    backgroundColor: Colors.primary,
    height: 54,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    zIndex: 2,
    minWidth: 100,
  },
  buttonSideShape: {
    backgroundColor: Colors.primary,
    width: 34,
    height: 44,
    borderRadius: 17,
    marginHorizontal: -12,
    zIndex: 1,
  },
  bookButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  // Advanced Filtering Styles
  searchBarContainer: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  searchInputWrapper: {
    flex: 1,
    height: 56,
    backgroundColor: "white",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    ...Shadows.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1F2937",
  },
  filterButtonCircle: {
    width: 52,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.medium,
  },
  filterActiveDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  // Modal Styles
  filterModalContent: {
    flex: 1,
    padding: 24,
  },
  filterModalTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    marginBottom: 24,
    textAlign: "center",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#374151",
    marginBottom: 12,
  },
  modalInput: {
    height: 52,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceSpacer: {
    width: 10,
    height: 1,
    backgroundColor: "#9CA3AF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingBottom: 20,
  },
  revComplexCardFlat: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  revHeaderMerged: {
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  revRatingCornerMerged: {
    alignItems: "center",
    gap: 4,
  },
  revRateNumMerged: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
  userInfoRowMerged: {
    flex: 1,
    alignItems: "flex-start",
  },
  nameAndBodyMerged: {
    flex: 1,
  },
  reviewerNameMerged: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  revMessageMerged: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    marginTop: 4,
  },
  avatarCircleMerged: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  userAvatarImgMerged: {
    width: "100%",
    height: "100%",
  },
  dateWrapperMerged: {
    marginTop: 8,
  },
  revTimeTextMerged: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Alexandria-Medium",
  },
});

const filterBannerStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pillText: {
    fontSize: 8,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
