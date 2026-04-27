import {
  SolarClockCircleBold,
  SolarCloseBold,
  SolarCloseCircleBold,
  SolarFilterBold,
  SolarFireBold,
  SolarHeartBold,
  SolarHome2Bold,
  SolarMagnifierBold,
  SolarMapBoldDuotone,
  SolarMapPointBold,
  SolarSettingsBold,
  SolarStarBold,
  SolarTreeBold,
  SolarWaterBold,
  SolarWidgetBold,
<<<<<<< Updated upstream
  SolarCloseCircleBold,
  SolarFireBold,
  SolarUsersGroupBold,
} from "@/components/icons/solar-icons";
=======
  SolarWifiBold,
  SolarWindBold
} from "@/components/icons/solar-icons";
import { HorizontalSwiper } from "@/components/user/horizontal-swiper";
import {
  useGetChaletReviewsQuery,
  useGetCustomerChaletDetailsQuery,
  useGetFavoriteIdsQuery,
  useGetSimilarChaletsQuery,
  useToggleFavoriteMutation
} from "@/store/api/customerApiSlice";


>>>>>>> Stashed changes
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { RootState } from "@/store";
<<<<<<< Updated upstream
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, BottomSheetTextInput, BottomSheetScrollView } from "@gorhom/bottom-sheet";
=======
import { BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Animated, { FadeInUp } from "react-native-reanimated";

import { HostContactCard } from "@/components/user/host-contact-card";
import { useFormatTime } from '@/hooks/useFormatTime';
import Svg, { Path } from "react-native-svg";

import { getImageSrc } from "@/hooks/useImageSrc";
>>>>>>> Stashed changes
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

import { useGetChaletsQuery } from "@/store/api/apiSlice";

const FILTER_OPTIONS = [
  { id: "all", label: "الكل", icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
  { id: "pool", label: "يحتوي مسبح", icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
  { id: "bbq", label: "شواء", icon: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />, activeColor: Colors.accent },
  { id: "garden", label: "حديقة", icon: (isActive: boolean) => <SolarTreeBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  // Map State
  const [zoom, setZoom] = useState(6);
  const [cameraPosition, setCameraPosition] = useState<[number, number]>([44.36, 33.31]);

  // Filtering State
  const [search, setSearch] = useState("");
  const [maxAdults, setMaxAdults] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Bottom Sheet Ref for Filters
  const filterSheetRef = useRef<BottomSheetModal>(null);

  // API Data
  const { data: chaletsResponse, isLoading: isChaletsLoading } = useGetChaletsQuery({
    isActive: true,
    isApproved: true,
    limit: zoom >= 14 ? 300 : zoom >= 10 ? 150 : zoom >= 6 ? 80 : 40,
    search: search || undefined,
    maxAdults: maxAdults ? parseInt(maxAdults) : undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
  });

  const chaletsRaw = chaletsResponse?.data || [];

  const MOCK_CHALETS = useMemo(() => {
    return chaletsRaw
      .filter((item: any) => {
        const lng = Number(item.longitude);
        const lat = Number(item.latitude);
        return lng && lat && lng !== 0 && lat !== 0;
      })
      .map((item: any) => {
        const mainImage = item.images?.find((img: any) => img.isMain) || item.images?.[0];

        return {
          id: item.id,
          title: item.name,
          location: item.address,
          price: (item.basePrice || "0").toLocaleString(),
          rating: item.rating || 0,
          color: Colors.primary,
          image: getImageSrc(mainImage?.url),
          allImages: (item.images || []).map((img: any) => getImageSrc(img.url)),
          coordinates: [item.longitude, item.latitude] as [number, number],
          description: isRTL ? item.description?.ar : item.description?.en,
          area: item.area,
          maxAdults: item.maxAdults,
          maxChildren: item.maxChildren,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
        };
      });
  }, [chaletsRaw, isRTL]);

  // Track Current Map State for restoration
  const [currentMapRegion, setCurrentMapRegion] = useState({ center: [44.36, 33.31] as [number, number], zoom: 6 });
  const [preSelectionRegion, setPreSelectionRegion] = useState<{ center: [number, number], zoom: number } | null>(null);

  // Navigation & Routing State
  const [route, setRoute] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMapTools, setShowMapTools] = useState(false);
  const showMapToolsRef = useRef(false);
  const browsingRegionRef = useRef<{ center: [number, number], zoom: number }>({ center: [44.36, 33.31], zoom: 6 });

  const toggleMapTools = (val: boolean) => {
    setShowMapTools(val);
    showMapToolsRef.current = val;
  };

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["55%", "92%"], []);

  useEffect(() => {
    let subscription: any = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
        },
        (newLoc) => {
          setLocation(newLoc);
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const [selectedChalet, setSelectedChalet] = useState<any>(null);

<<<<<<< Updated upstream
=======
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch full details when a chalet is selected
  const { data: chaletFullDetails, isLoading: isDetailsLoading } = useGetCustomerChaletDetailsQuery(selectedChalet?.id, {
    skip: !selectedChalet?.id
  });

  const { data: reviewsResponse } = useGetChaletReviewsQuery({ chaletId: selectedChalet?.id, page: 1, limit: 5 }, {
    skip: !selectedChalet?.id
  });

  const { data: similarResponse } = useGetSimilarChaletsQuery(selectedChalet?.id, {
    skip: !selectedChalet?.id
  });

  const { data: favoriteIds = [], refetch: refetchFavorites } = useGetFavoriteIdsQuery(undefined, {
    skip: !isAuthenticated
  });

  const [toggleFavorite] = useToggleFavoriteMutation();

  const handleToggleFavorite = async (chaletId: string) => {
    try {
      await toggleFavorite(chaletId).unwrap();
      refetchFavorites();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const chaletDetails = chaletFullDetails || {} as any;
  const reviews = reviewsResponse?.data || [];
  const chaletRating = chaletDetails.averageRating || selectedChalet?.rating || 0;


  const renderFooter = useCallback(
    (props: any) => {
      if (!selectedChalet) return null;
      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View style={[styles.stickyFooterMain, { paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.footerContent, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
              <TouchableOpacity
                style={styles.bookButtonCustom}
                onPress={() => {
                  bottomSheetRef.current?.dismiss();
                  router.push(`/(customer)/booking/complete?id=${selectedChalet.id}`);
                }}
              >
                <View style={styles.buttonSideShape} />
                <View style={styles.buttonMainShape}>
                  <ThemedText style={styles.bookButtonText}>{isRTL ? 'احجز الان' : 'Book Now'}</ThemedText>
                </View>
                <View style={styles.buttonSideShape} />
              </TouchableOpacity>

              <View style={styles.priceContainer}>
                <ThemedText style={styles.footerPrice}>{selectedChalet.price} IQD</ThemedText>
              </View>
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [selectedChalet, isRTL, insets.bottom]
  );

>>>>>>> Stashed changes
  const handleSelectChalet = (chalet: any) => {
    Keyboard.dismiss();
    // Save previous camera state if not already in selection mode
    if (!selectedChalet) {
      setPreSelectionRegion({ center: currentMapRegion.center, zoom: currentMapRegion.zoom });
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
    []
  );

  const handleFilterPress = () => {
    filterSheetRef.current?.present();
  };

  const handleApplyFilters = () => {
    filterSheetRef.current?.dismiss();
  };

  const handleResetFilters = () => {
    setSearch("");
    setMaxAdults("");
    setMinPrice("");
    setMaxPrice("");
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
        onPress={() => Keyboard.dismiss()}
        onCameraChanged={(center, zoomLevel) => {
          setCurrentMapRegion({ center, zoom: zoomLevel });
          setZoom(zoomLevel);
          setCameraPosition(center);
          if (!selectedChalet) {
            browsingRegionRef.current = { center, zoom: zoomLevel };
          }
        }}
      />

      {/* Conditional Interface Elements */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + normalize.height(10) }]}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <SolarMagnifierBold size={20} color={Colors.text.muted} />
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? "ابحث عن شاليه باسمه أو مكانه..." : "Search by name or location..."}
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
          <TouchableOpacity
            style={styles.filterButtonCircle}
            onPress={handleFilterPress}
            activeOpacity={0.8}
          >
            <SolarFilterBold size={24} color="white" />
            {hasActiveFilters && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>

        {!selectedChalet && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {FILTER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.filterChip,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}
              >
                {opt.icon(false)}
                <ThemedText style={styles.filterChipText}>{opt.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
            style={[styles.navCircleFab, { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1 }]}
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
        backdropComponent={renderBackdrop}
        onDismiss={handleDismissSheet}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: '#E5E7EB', width: 40 }}
        style={styles.bottomSheet}
      >
<<<<<<< Updated upstream
        <BottomSheetView style={styles.sheetContent}>
=======
        <BottomSheetScrollView
          style={styles.sheetContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >

>>>>>>> Stashed changes
          {selectedChalet && (
            <View style={styles.cardContainer}>
              {/* Image Carousel Swiper */}
              <View style={styles.imageCarouselContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => {
                    // Potential indicator logic here if needed
                  }}
                  scrollEventThrottle={16}
                  style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                >
                  {(selectedChalet.allImages || [selectedChalet.image]).map((img: any, index: number) => (
                    <Image
                      key={index}
                      source={img}
                      style={[styles.carouselImage, { transform: [{ scaleX: isRTL ? -1 : 1 }] }]}
                    />
                  ))}
                </ScrollView>
<<<<<<< Updated upstream
                <View style={styles.imageCountBadge}>
                  <ThemedText style={styles.imageCountText}>
                    {(selectedChalet.allImages?.length || 1)} {isRTL ? 'صور' : 'Photos'}
=======

                {/* Heart / Favorite Button */}
                <TouchableOpacity style={styles.favoriteBtn}>
                  <SolarHeartBold size={24} color="#FF4B4B" />
                </TouchableOpacity>

                {/* Pagination Dots */}
                <View style={styles.paginationDots}>
                  {(selectedChalet.allImages || [selectedChalet.image]).map((_: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: activeImageIndex === index ? Colors.primary : "rgba(255,255,255,0.5)",
                          width: activeImageIndex === index ? 10 : 8,
                          height: activeImageIndex === index ? 10 : 8,
                        }
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={[styles.mainInfoRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {/* Rating */}
                <View style={styles.ratingSection}>
                  <SolarStarBold size={20} color={Colors.primary} />
                  <ThemedText style={styles.ratingValue}>{selectedChalet.rating || '4.5'}</ThemedText>
                </View>

                {/* Title and Location */}
                <View style={[styles.titleSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <ThemedText style={styles.chaletTitleMain}>
                    {typeof selectedChalet?.title === 'string' ? selectedChalet.title : (isRTL ? selectedChalet?.title?.ar : selectedChalet?.title?.en) || ''}
                  </ThemedText>
                  <ThemedText style={styles.chaletLocationSub}>
                    {typeof selectedChalet?.location === 'string' ? selectedChalet.location : (isRTL ? selectedChalet?.location?.ar : selectedChalet?.location?.en) || ''}
>>>>>>> Stashed changes
                  </ThemedText>
                </View>
              </View>

<<<<<<< Updated upstream
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 16 }]}>
                <View style={[styles.headerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <ThemedText style={styles.chaletTitle}>
                      {typeof selectedChalet?.title === 'string' ? selectedChalet.title : (isRTL ? selectedChalet?.title?.ar : selectedChalet?.title?.en) || ''}
                    </ThemedText>
                    <TouchableOpacity 
                      style={styles.navActionBtn}
                      onPress={() => {
                        toggleMapTools(true);
                        getRoute();
                        bottomSheetRef.current?.dismiss();
                      }}
                    >
                      <SolarMapPointBold size={18} color="white" />
                      <ThemedText style={styles.navActionText}>{isRTL ? 'المسار' : 'Route'}</ThemedText>
                    </TouchableOpacity>
=======
              {/* Specifications Section */}
              <View style={[styles.specsSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <ThemedText style={styles.sectionLabel}>{isRTL ? 'المواصفات الاساسية' : 'Basic Specifications'}</ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.specsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  <View style={styles.specChip}>
                    <ThemedText style={styles.specText}>{isRTL ? 'بستان مع بيت' : 'Garden with house'}</ThemedText>
>>>>>>> Stashed changes
                  </View>
                  
                  <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 4 }]}>
                    <SolarMapPointBold size={14} color="#6B7280" />
                    <ThemedText style={styles.chaletLocation}>
                      {typeof selectedChalet?.location === 'string' ? selectedChalet.location : (isRTL ? selectedChalet?.location?.ar : selectedChalet?.location?.en) || ''}
                    </ThemedText>
                  </View>

                  <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 8 }]}>
                    <ThemedText style={styles.priceText}>{selectedChalet.price} د.ع / ليلة</ThemedText>
                    <View style={[styles.dot, { marginHorizontal: 8 }]} />
                    <SolarStarBold size={14} color="#F59E0B" />
                    <ThemedText style={styles.ratingText}>{selectedChalet.rating}</ThemedText>
                  </View>
                </View>
              </View>

<<<<<<< Updated upstream
              {/* Enhanced Info Grid */}
              <View style={[styles.enhancedInfoGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.enhancedInfoItem}>
                  <SolarWidgetBold size={18} color={Colors.primary} />
                  <ThemedText style={styles.enhancedInfoValue}>{selectedChalet.area || 0} م²</ThemedText>
                  <ThemedText style={styles.enhancedInfoLabel}>{isRTL ? 'المساحة' : 'Area'}</ThemedText>
=======
              {/* Seamless Full Details Content (Visible when expanded) */}
              {isExpanded && (
                <View style={{ marginTop: 20 }}>
                  {isDetailsLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
                  ) : (
                    <>
                      {/* Shifts Section */}
                      <Animated.View entering={FadeInUp.delay(50).duration(300)}>
                        <SectionHeader title={isRTL ? "الشفتات المتوفرة" : "Available Shifts"} isRTL={isRTL} />
                        <View style={{ gap: 10, marginBottom: 10 }}>
                          {(chaletDetails.shifts || []).map((shift: any, index: number) => (
                            <View key={shift.id || index} style={{ backgroundColor: "#F3F7FF", borderRadius: 12, padding: 12, alignItems: "center", gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "white", justifyContent: "center", alignItems: "center" }}>
                                <SolarClockCircleBold size={20} color={Colors.primary} />
                              </View>
                              <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                                <ThemedText style={{ fontSize: 14, fontFamily: "Tajawal-Bold", color: "#1F2937" }}>
                                  {isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name)}
                                </ThemedText>
                                <ThemedText style={{ fontSize: 12, fontFamily: "Tajawal-Medium", color: "#6B7280", marginTop: 2 }}>
                                  {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                                </ThemedText>
                              </View>
                            </View>
                          ))}
                        </View>
                      </Animated.View>

                      {/* Facilities Section */}
                      <Animated.View entering={FadeInUp.delay(100).duration(300)}>
                        <SectionHeader title={isRTL ? "المرافق" : "Facilities"} isRTL={isRTL} />
                        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 15 }}>
                          {(chaletDetails.chaletFeatures || []).map((item: any, idx: number) => {
                            const feature = item.feature || item;
                            const Icon = FEATURE_ICON_MAP[feature.icon] || SolarWidgetBold;
                            return (
                              <View key={idx} style={{ width: "23%", alignItems: "center", marginBottom: 20 }}>
                                <View style={{ width: 55, height: 55, justifyContent: "center", alignItems: "center" }}>
                                  <Svg height={55} width={55} viewBox="0 0 60 60">
                                    <Path d={SHAPES.blue} fill={CARD_COLORS[idx % CARD_COLORS.length]} />
                                  </Svg>
                                  <View style={{ position: "absolute" }}>
                                    <Icon size={22} color="white" />
                                  </View>
                                </View>
                                <ThemedText style={{ fontSize: 11, fontFamily: "Tajawal-Bold", marginTop: 6, textAlign: 'center' }}>
                                  {isRTL ? feature.name?.ar : feature.name?.en}
                                </ThemedText>
                              </View>
                            );
                          })}
                        </View>
                      </Animated.View>

                      {/* Overview Section */}
                      <Animated.View entering={FadeInUp.delay(150).duration(300)}>
                        <SectionHeader title={isRTL ? "نظرة عامة" : "Overview"} isRTL={isRTL} />
                        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                          <ThemedText style={{ fontSize: 14, color: "#64748B", lineHeight: 22, textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? chaletDetails.description?.ar : chaletDetails.description?.en}
                          </ThemedText>
                        </View>
                      </Animated.View>

                      {/* Host Section */}
                      <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                        <HostContactCard
                          name={chaletDetails.owner?.name || (isRTL ? "مضيف عراقي" : "Iraqi Host")}
                          avatar={chaletDetails.owner?.image ? getImageSrc(chaletDetails.owner.image) : null}
                          isRTL={isRTL}
                        />
                      </Animated.View>

                      {/* Location Section */}
                      <Animated.View entering={FadeInUp.delay(250).duration(300)}>
                        <SectionHeader title={isRTL ? "الموقع" : "Location"} isRTL={isRTL} />
                        <View style={styles.mapCardFlat}>
                          <View style={styles.mapInner}>
                            <Image 
                              source={{ 
                                uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+${Colors.primary.replace('#', '')}(${chaletDetails.longitude || 44.3661},${chaletDetails.latitude || 33.3152})/${chaletDetails.longitude || 44.3661},${chaletDetails.latitude || 33.3152},14/600x300@2x?access_token=${MAPBOX_ACCESS_TOKEN}` 
                              }} 
                              style={{ width: '100%', height: '100%' }} 
                              resizeMode="cover"
                            />
                          </View>
                          <View style={{ paddingVertical: 14, alignItems: 'center', backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
                             <ThemedText style={{ fontSize: 16, fontFamily: "Tajawal-Black", color: Colors.primary }}>
                               {isRTL ? chaletDetails.region?.name?.ar : chaletDetails.region?.name?.en || chaletDetails.address?.ar || chaletDetails.address?.en || ''}
                             </ThemedText>
                             <ThemedText style={{ fontSize: 12, color: "#64748B", fontFamily: "Tajawal-Medium", marginTop: 2 }}>
                               {isRTL ? "انقر لرؤية الموقع بدقة" : "Click to see precise location"}
                             </ThemedText>
                          </View>
                        </View>
                      </Animated.View>

                      {/* Reviews Section */}
                      <Animated.View entering={FadeInUp.delay(300).duration(300)}>
                        <SectionHeader title={isRTL ? "التقييمات" : "Reviews"} isRTL={isRTL} />
                        {reviews.length > 0 ? (
                          reviews.slice(0, 2).map((reviewItem: any, i: number) => (
                            <View key={reviewItem.id || i} style={styles.revComplexCardFlat}>
                              <View style={[styles.revHeaderMerged, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                                <View style={[styles.revRatingCornerMerged, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                                  <SolarStarBold size={14} color={Colors.primary} />
                                  <ThemedText style={styles.revRateNumMerged}>{reviewItem.rating}</ThemedText>
                                </View>
                                <View style={[styles.userInfoRowMerged, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
                                  <View style={[styles.nameAndBodyMerged, { alignItems: isRTL ? "flex-end" : "flex-start" }, isRTL ? { marginRight: 15 } : { marginLeft: 15 }]}>
                                    <ThemedText style={styles.reviewerNameMerged}>{reviewItem.customer?.name}</ThemedText>
                                    <ThemedText style={[styles.revMessageMerged, { textAlign: isRTL ? "right" : "left" }]}>
                                      {reviewItem.comment}
                                    </ThemedText>
                                  </View>
                                  <View style={styles.avatarCircleMerged}>
                                    <Image
                                      source={require("@/assets/profile.svg")}
                                      style={styles.userAvatarImgMerged}
                                    />
                                  </View>
                                </View>
                              </View>
                            </View>
                          ))
                        ) : (
                          <ThemedText style={{ textAlign: 'center', color: '#94A3B8', marginTop: 10 }}>
                            {isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}
                          </ThemedText>
                        )}
                      </Animated.View>

                      {/* Similar Chalets Section */}
                      <Animated.View entering={FadeInUp.delay(350).duration(300)}>
                        <SectionHeader title={isRTL ? "قد يعجبك أيضاً" : "You might also like"} isRTL={isRTL} />
                        <HorizontalSwiper
                          data={(similarResponse || []).map((item: any, index: number) => ({
                            id: item.id,
                            title: isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name),
                            location: isRTL ? (item.city?.name || '') : (item.city?.enName || item.city?.name || ''),
                            price: item.basePrice ? Number(item.basePrice).toLocaleString() : '0',
                            rating: item.rating || 0,
                            image: getImageSrc(item.images?.[0]?.url),
                            color: CARD_COLORS[index % CARD_COLORS.length],
                          }))}
                          onPressCard={(id) => {
                            router.push(`/chalet-details/${id}`);
                          }}
                          favoriteIds={favoriteIds}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      </Animated.View>
                    </>
                  )}
>>>>>>> Stashed changes
                </View>
                <View style={styles.enhancedInfoItem}>
                  <SolarUsersGroupBold size={18} color={Colors.secondary} />
                  <ThemedText style={styles.enhancedInfoValue}>{selectedChalet.maxAdults || 0}</ThemedText>
                  <ThemedText style={styles.enhancedInfoLabel}>{isRTL ? 'بالغين' : 'Adults'}</ThemedText>
                </View>
                <View style={styles.enhancedInfoItem}>
                  <SolarWaterBold size={18} color={Colors.accent} />
                  <ThemedText style={styles.enhancedInfoValue}>{selectedChalet.bedrooms || 0}</ThemedText>
                  <ThemedText style={styles.enhancedInfoLabel}>{isRTL ? 'غرف' : 'Rooms'}</ThemedText>
                </View>
                <View style={styles.enhancedInfoItem}>
                  <SolarStarBold size={18} color="#F59E0B" />
                  <ThemedText style={styles.enhancedInfoValue}>{selectedChalet.bathrooms || 0}</ThemedText>
                  <ThemedText style={styles.enhancedInfoLabel}>{isRTL ? 'حمامات' : 'Baths'}</ThemedText>
                </View>
              </View>

              {/* Actions Section */}
              <View style={styles.cardActionsWrapper}>
                <View style={[styles.mainActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <PrimaryButton
                    label={isRTL ? 'احجز الآن' : 'Book Now'}
                    icon={<SolarAltArrowRightBold size={20} color="white" />}
                    onPress={() => {
                      bottomSheetRef.current?.dismiss();
                      router.push(`/(customer)/booking/complete?id=${selectedChalet.id}`);
                    }}
                    style={{ flex: 1 }}
                    height={54}
                  />
                </View>

                <SecondaryButton
                  label={isRTL ? 'عرض كامل التفاصيل' : 'View Full Details'}
                  icon={<SolarSquareShareLineBoldDuotone size={20} color={Colors.primary} />}
                  onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/(customer)/chalet-details/${selectedChalet.id}`);
                  }}
                  isActive={false} // Uses inactive styles which have better contrast
                  style={{ marginTop: 12 }}
                  height={54}
                />
              </View>
            </View>
          )}
        </BottomSheetView>
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
        <BottomSheetScrollView contentContainerStyle={styles.filterModalContent}>
          <Text style={styles.filterModalTitle}>{isRTL ? 'تصفية النتائج' : 'Filter Results'}</Text>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>{isRTL ? 'عدد البالغين' : 'Max Adults'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? "مثلاً: 5" : "e.g. 5"}
              keyboardType="numeric"
              value={maxAdults}
              onChangeText={setMaxAdults}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>{isRTL ? 'نطاق السعر (د.ع)' : 'Price Range (IQD)'}</Text>
            <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <BottomSheetTextInput
                style={[styles.modalInput, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={isRTL ? "من" : "Min"}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <View style={styles.priceSpacer} />
              <BottomSheetTextInput
                style={[styles.modalInput, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={isRTL ? "إلى" : "Max"}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <SecondaryButton
              label={isRTL ? 'إعادة ضبط' : 'Reset'}
              onPress={handleResetFilters}
              style={{ flex: 1 }}
              height={50}
            />
            <PrimaryButton
              label={isRTL ? 'تطبيق الفلترة' : 'Apply Filters'}
              onPress={handleApplyFilters}
              style={{ flex: 1 }}
              height={50}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
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
    fontSize: 13,
    fontFamily: "Tajawal-SemiBold",
    color: "#1F2937",
  },
  bottomSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...Shadows.large,
  },
  sheetContent: {
    flex: 1,
    padding: 20,
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
    backgroundColor: '#F3F4F6',
  },
  imageCarouselContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  carouselImage: {
    width: SCREEN_WIDTH - 40, // Parent padding adjustment
    height: 180,
    resizeMode: 'cover',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: 'white',
    fontSize: 11,
    fontFamily: "Tajawal-Bold",
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  chaletTitle: {
    fontSize: 18,
    fontFamily: "Tajawal-Black",
    color: "#111827",
  },
  locationRow: {
    alignItems: "center",
    gap: 4,
  },
  chaletLocation: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Tajawal-Medium",
  },
  ratingRow: {
    alignItems: "center",
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontFamily: "Tajawal-Black",
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
    fontFamily: "Tajawal-Bold",
    color: "#1F2937",
    marginLeft: 4,
  },
  rightNavActions: {
    position: 'absolute',
    right: 20,
    top: SCREEN_HEIGHT * 0.35,
    gap: 12,
    zIndex: 30,
  },
  navInfoCard: {
    flex: 1,
    backgroundColor: 'white',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
    paddingHorizontal: 20,
  },
  navInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  navInfoVal: {
    fontSize: 18,
    fontFamily: "Tajawal-Black",
    color: Colors.primary,
  },
  navInfoLbl: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: "Tajawal-Bold",
    textTransform: 'uppercase',
  },
  navCircleFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  navSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  navActionBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  navActionText: {
    color: 'white',
    fontSize: 13,
    fontFamily: "Tajawal-Bold",
  },
  enhancedInfoGrid: {
    marginTop: 24,
    paddingHorizontal: 0,
    gap: 8,
  },
  enhancedInfoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.small,
  },
  enhancedInfoValue: {
    fontSize: 15,
    fontFamily: "Tajawal-Black",
    color: '#1E293B',
    marginTop: 6,
  },
  enhancedInfoLabel: {
    fontSize: 10,
    fontFamily: "Tajawal-Medium",
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navOutlineText: {
    fontSize: 14,
    fontFamily: "Tajawal-Bold",
    color: Colors.primary,
  },
<<<<<<< Updated upstream
=======

  // New Design Styles
  mainInfoRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingValue: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#1E293B",
  },
  titleSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chaletTitleMain: {
    fontSize: 22,
    fontFamily: "Tajawal-Black",
    color: "#111827",
    textAlign: 'right',
  },
  chaletLocationSub: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: "Tajawal-Medium",
    marginTop: 2,
  },
  specsSection: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#1E293B",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  specsContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  specChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  specText: {
    fontSize: 14,
    fontFamily: "Tajawal-Bold",
    color: "#334155",
  },
  favoriteBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerSpacer: {
    height: 0,
  },
  footerContentInFlow: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 20,
  },
  stickyFooterMain: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 16,
    ...Shadows.large,
  },
  footerContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  mapCardFlat: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.medium,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mapInner: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  priceContainer: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 24,
    fontFamily: "Tajawal-Black",
    color: "#000000",
    textAlign: 'right',
  },
  bookButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
  },
  buttonMainShape: {
    backgroundColor: Colors.primary,
    height: 54,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: 'white',
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
>>>>>>> Stashed changes
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Advanced Filtering Styles
  searchBarContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  searchInputWrapper: {
    flex: 1,
    height: 52,
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    ...Shadows.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Tajawal-Medium",
    color: "#1F2937",
  },
  filterButtonCircle: {
    width: 52,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  filterActiveDot: {
    position: 'absolute',
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
    fontSize: 20,
    fontFamily: "Tajawal-Black",
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionLabel: {
    fontSize: 14,
    fontFamily: "Tajawal-Bold",
    color: '#374151',
    marginBottom: 12,
  },
  modalInput: {
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Tajawal-Medium",
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceSpacer: {
    width: 10,
    height: 1,
    backgroundColor: '#9CA3AF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingBottom: 20,
  },
});
