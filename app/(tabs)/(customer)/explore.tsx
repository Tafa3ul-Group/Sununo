import {
  SolarAltArrowRightBold,
  SolarCloseBold,
  SolarFilterBold,
  SolarMagnifierBold,
  SolarMapBoldDuotone,
  SolarMapPointBold,
  SolarSquareShareLineBoldDuotone,
  SolarStarBold,
  SolarTreeBold,
  SolarWaterBold,
  SolarWheelBold,
  SolarWidgetBold,
  SolarCloseCircleBold,
  SolarFireBold,
  SolarUsersGroupBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { RootState } from "@/store";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, BottomSheetTextInput, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { Redirect, useRouter } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  TextInput,
  Text,
  Keyboard
} from "react-native";
import { getImageSrc } from "@/hooks/useImageSrc";
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
    limit: 100,
    search: search || undefined,
    maxAdults: maxAdults ? parseInt(maxAdults) : undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
  });

  const chaletsRaw = chaletsResponse?.data || [];

  const MOCK_CHALETS = useMemo(() => {
    return chaletsRaw.map((item: any) => {
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
  }, [chaletsRaw]);
  
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
        onRegionChange={(region) => {
           setCurrentMapRegion(region);
           if (!selectedChalet) {
              browsingRegionRef.current = region;
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
        <BottomSheetView style={styles.sheetContent}>
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
                <View style={styles.imageCountBadge}>
                  <ThemedText style={styles.imageCountText}>
                    {(selectedChalet.allImages?.length || 1)} {isRTL ? 'صور' : 'Photos'}
                  </ThemedText>
                </View>
              </View>

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

              {/* Enhanced Info Grid */}
              <View style={[styles.enhancedInfoGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.enhancedInfoItem}>
                  <SolarWidgetBold size={18} color={Colors.primary} />
                  <ThemedText style={styles.enhancedInfoValue}>{selectedChalet.area || 0} م²</ThemedText>
                  <ThemedText style={styles.enhancedInfoLabel}>{isRTL ? 'المساحة' : 'Area'}</ThemedText>
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
