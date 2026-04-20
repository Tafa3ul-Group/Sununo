import {
  SolarAltArrowRightBold,
  SolarCloseBold,
  SolarFireBold,
  SolarMapBoldDuotone,
  SolarMapPointBold,
  SolarSquareShareLineBoldDuotone,
  SolarStarBold,
  SolarTreeBold,
  SolarWaterBold,
  SolarWheelBold,
  SolarWidgetBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { AppMap } from "@/components/user/app-map";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { RootState } from "@/store";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
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
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

const MOCK_CHALETS = [
  {
    id: "1",
    title: { ar: "شالية الاروع علة الطلاق", en: "Absolute Best Chalet" },
    location: { ar: "البصرة - الجزائر", en: "Basra - Algeria" },
    price: "30,000",
    rating: 4.5,
    color: Colors.primary,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.82, 30.51] as [number, number],
  },
  {
    id: "2",
    title: { ar: "جنة الوطن", en: "Homeland Paradise" },
    location: { ar: "البصرة - شط العرب", en: "Basra - Shatt Al-Arab" },
    price: "45,000",
    rating: 4.8,
    color: Colors.secondary,
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.85, 30.52] as [number, number],
  },
  {
    id: "3",
    title: { ar: "شالية الملك", en: "King's Chalet" },
    location: { ar: "البصرة - القبلة", en: "Basra - Al-Qibla" },
    price: "25,000",
    rating: 4.2,
    color: Colors.accent,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.88, 30.53] as [number, number],
  },
  {
    id: "4",
    title: { ar: "شالية محسن", en: "Mohsen's Chalet" },
    location: { ar: "البصرة - الزبير", en: "Basra - Al-Zubair" },
    price: "35,000",
    rating: 4.9,
    color: Colors.secondary,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600",
    coordinates: [47.84, 30.49] as [number, number],
  },
];

const FILTER_OPTIONS = [
  { id: "all", label: "الكل", icon: (isActive: boolean) => <SolarWidgetBold size={18} color={isActive ? "white" : Colors.primary} />, activeColor: Colors.primary },
  { id: "pool", label: "يحتوي مسبح", icon: (isActive: boolean) => <SolarWaterBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
  { id: "bbq", label: "شواء", icon: (isActive: boolean) => <SolarFireBold size={18} color={isActive ? "white" : Colors.accent} />, activeColor: Colors.accent },
  { id: "garden", label: "حديقة", icon: (isActive: boolean) => <SolarTreeBold size={18} color={isActive ? "white" : Colors.secondary} />, activeColor: Colors.secondary },
];

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const { userType } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedChalet, setSelectedChalet] = useState<any>(null);
  const [zoom, setZoom] = useState(13);
  const [cameraPosition, setCameraPosition] = useState<[number, number]>([47.85, 30.52]);
  
  // Track Current Map State for restoration
  const [currentMapRegion, setCurrentMapRegion] = useState({ center: [47.85, 30.52] as [number, number], zoom: 13 });
  const [preSelectionRegion, setPreSelectionRegion] = useState<{ center: [number, number], zoom: number } | null>(null);

  // Navigation & Routing State
  const [route, setRoute] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMapTools, setShowMapTools] = useState(false);
  const showMapToolsRef = useRef(false);
  const browsingRegionRef = useRef<{ center: [number, number], zoom: number }>({ center: [47.85, 30.52], zoom: 13 });
  
  const toggleMapTools = (val: boolean) => {
    setShowMapTools(val);
    showMapToolsRef.current = val;
  };

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["38%"], []);

  useEffect(() => {
    let subscription: any = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Initial location
        try {
          const currentLocation = await Location.getCurrentPositionAsync({});
          setLocation(currentLocation);
        } catch (e) {}

        // Watch location for routing
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (newLoc) => setLocation(newLoc)
        );
      }
    })();
    return () => subscription?.remove();
  }, []);

  const filteredChalets = activeFilter === "all"
    ? MOCK_CHALETS
    : MOCK_CHALETS.filter(c => {
      if (activeFilter === "pool") return c.id === "1" || c.id === "3";
      if (activeFilter === "bbq") return c.id === "2" || c.id === "4";
      if (activeFilter === "garden") return c.id === "2" || c.id === "3";
      return true;
    });

  if (userType === "owner") return <Redirect href="/(tabs)/(dashboard)/home" />;

  const handleSelectChalet = (chalet: any) => {
    if (!chalet) return;
    const fullChalet = MOCK_CHALETS.find(c => c.id === chalet.id) || chalet;
    
    // Save current map region (which is being tracked only during browsing)
    setPreSelectionRegion({ ...browsingRegionRef.current });
    
    // Completely reset map tools and routes when a new chalet is selected
    setRoute(null);
    setRouteInfo(null);
    setIsNavigating(false);
    toggleMapTools(false);
    
    setSelectedChalet(fullChalet);
    setCameraPosition(fullChalet.coordinates);
    setZoom(17);
    bottomSheetRef.current?.present();
  };

  const handleDismissSheet = () => {
    if (!showMapToolsRef.current) {
      setSelectedChalet(null);
      setZoom(13);
    }
  };

  const getRoute = async () => {
    if (!selectedChalet) return;
    
    // If no location yet, try to get it quickly
    let currentLoc = location;
    if (!currentLoc) {
       try {
         currentLoc = await Location.getCurrentPositionAsync({});
         setLocation(currentLoc);
       } catch (e) {
         Alert.alert('Location Error', 'Please enable location services to see the route.');
         return;
       }
    }

    const start = [currentLoc.coords.longitude, currentLoc.coords.latitude];
    const end = selectedChalet.coordinates;

    try {
      const resp = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await resp.json();
      if (data.routes && data.routes[0]) {
        console.log('Route found:', data.routes[0].duration);
        setRoute(data.routes[0].geometry);
        setRouteInfo({
          distance: data.routes[0].distance,
          duration: data.routes[0].duration
        });
        bottomSheetRef.current?.dismiss();
      }
    } catch (e) {
      console.error('Routing error:', e);
    }
  };

  const shareChalet = async () => {
    if (!selectedChalet) return;
    try {
      await Share.share({
        message: `Check out this chalet: ${isRTL ? selectedChalet.title.ar : selectedChalet.title.en}\nLocation: https://www.google.com/maps/search/?api=1&query=${selectedChalet.coordinates[1]},${selectedChalet.coordinates[0]}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.3} />,
    []
  );

  return (
    <View style={styles.container}>
      <ExpoStatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Background Map */}
      <View style={styles.mapBackground}>
        <AppMap
          style={styles.map}
          centerCoordinate={cameraPosition}
          zoomLevel={zoom}
          showMarker={true}
          markers={filteredChalets}
          selectedChalet={selectedChalet}
          route={route}
          isNavigating={isNavigating}
          onSelectMarker={handleSelectChalet}
          onCameraChanged={(center, zoomLvl) => {
            setCurrentMapRegion({ center, zoom: zoomLvl });
            // Only update "browsing position" if we aren't in tools/nav mode
            if (!showMapToolsRef.current && !selectedChalet) {
              browsingRegionRef.current = { center, zoom: zoomLvl };
            }
          }}
        />
      </View>

      {/* Top UI Overlays */}
      <View style={[styles.topOverlay, { paddingTop: insets.top }]}>
        {/* Filter Bar */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }}>
              {FILTER_OPTIONS.map((filter) => (
                <SecondaryButton
                  key={filter.id}
                  label={filter.id === 'all' ? t('home.categories.all') : filter.label}
                  icon={filter.icon(activeFilter === filter.id)}
                  active={activeFilter === filter.id}
                  activeColor={filter.activeColor}
                  onPress={() => setActiveFilter(filter.id)}
                  style={styles.filterButton}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* My Location FAB removed as per user request */}

      {showMapTools && selectedChalet && (
        <View style={styles.navStackContainer}>
          <TouchableOpacity 
            style={[styles.navCircleFab, isNavigating && styles.navFabActive]} 
            onPress={() => {
              if (!route) getRoute();
              setIsNavigating(!isNavigating);
            }}
          >
            <SolarWheelBold size={26} color={isNavigating ? "white" : Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCircleFab} onPress={shareChalet}>
            <SolarSquareShareLineBoldDuotone size={24} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navCircleFab, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]} 
            onPress={() => {
              setRoute(null);
              setRouteInfo(null);
              setIsNavigating(false);
              toggleMapTools(false);
              setSelectedChalet(null);
              
              // Restore map to pre-selection view immediately
              if (preSelectionRegion) {
                setZoom(preSelectionRegion.zoom);
                setCameraPosition(preSelectionRegion.center);
                setPreSelectionRegion(null);
              } else {
                setZoom(13);
              }
            }}
          >
            <SolarCloseBold size={20} color="#EF4444" />
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
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Image source={{ uri: selectedChalet.image }} style={styles.chaletThumb} />
                <View style={[styles.headerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <ThemedText style={styles.chaletTitle}>
                    {typeof selectedChalet?.title === 'string' ? selectedChalet.title : (isRTL ? selectedChalet?.title?.ar : selectedChalet?.title?.en) || ''}
                  </ThemedText>
                  <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <SolarMapPointBold size={14} color="#6B7280" />
                    <ThemedText style={styles.chaletLocation}>
                      {typeof selectedChalet?.location === 'string' ? selectedChalet.location : (isRTL ? selectedChalet?.location?.ar : selectedChalet?.location?.en) || ''}
                    </ThemedText>
                  </View>
                  <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <ThemedText style={styles.priceText}>{selectedChalet.price} د.ع / ليلة</ThemedText>
                    <View style={[styles.dot, { marginHorizontal: 8 }]} />
                    <SolarStarBold size={14} color="#F59E0B" />
                    <ThemedText style={styles.ratingText}>{selectedChalet.rating}</ThemedText>
                  </View>

                  {/* Additional Info Mockup */}
                  <View style={[styles.infoGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.infoItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <SolarWidgetBold size={14} color={Colors.primary} />
                      <ThemedText style={styles.infoValue}>600 م²</ThemedText>
                    </View>
                    <View style={[styles.infoItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <SolarTreeBold size={14} color={Colors.secondary} />
                      <ThemedText style={styles.infoValue}>حديقة</ThemedText>
                    </View>
                    <View style={[styles.infoItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <SolarWaterBold size={14} color={Colors.accent} />
                      <ThemedText style={styles.infoValue}>مسبح</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity 
                  style={styles.navActionBtn}
                  onPress={() => {
                    toggleMapTools(true);
                    getRoute();
                    bottomSheetRef.current?.dismiss();
                  }}
                >
                  <SolarMapPointBold size={20} color="white" />
                  <ThemedText style={styles.navActionText}>{isRTL ? 'الذهاب للمسار' : 'Go to Route'}</ThemedText>
                </TouchableOpacity>
              </View>
                <TouchableOpacity
                  onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/(customer)/chalet/${selectedChalet.id}`);
                  }}
                  style={styles.detailsCircle}
                >
                  <SolarAltArrowRightBold size={20} color={Colors.primary} style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>
              </View>

              <PrimaryButton
                label={isRTL ? "ﺣﺠﺰ اﻵن" : "Book Now"}
                onPress={() => {
                  bottomSheetRef.current?.dismiss();
                  router.push(`/(customer)/chalet/${selectedChalet.id}`);
                }}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterWrapper: {
    paddingVertical: normalize.height(10),
  },
  filterBar: {
    paddingHorizontal: normalize.width(16),
  },
  filterButton: {
    minWidth: normalize.width(120),
    height: normalize.height(44),
  },
  bottomSheet: {
    borderRadius: 24,
    ...Shadows.large,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  cardContainer: {
    flex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  chaletThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  chaletTitle: {
    fontSize: 18,
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  locationRow: {
    alignItems: 'center',
    gap: 4,
  },
  chaletLocation: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "LamaSans-Medium",
  },
  ratingRow: {
    alignItems: 'center',
    marginTop: 2,
  },
  priceText: {
    fontSize: 15,
    fontFamily: "LamaSans-Bold",
    color: Colors.primary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "LamaSans-SemiBold",
    color: "#4B5563",
    marginLeft: 4,
  },
  detailsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionGrid: {
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionText: {
    fontSize: 11,
    fontFamily: "LamaSans-Bold",
    color: Colors.primary,
  },
  fullDetailBtn: {
    height: 54,
    borderRadius: 18,
  },
  navStackContainer: {
    position: 'absolute',
    bottom: normalize.height(115),
    right: 20,
    gap: 12,
    zIndex: 100,
  },
  navCircleFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  navFabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  myLocationFab: {
    position: 'absolute',
    bottom: normalize.height(110),
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 100,
  },
  tripInfoBar: {
    position: 'absolute',
    left: 20,
    right: 84,
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 20,
    ...Shadows.large,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 100,
  },
  tripInfoRow: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tripInfoItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tripInfoLabel: {
    fontSize: 10,
    fontFamily: "LamaSans-Medium",
    color: "#6B7280",
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  tripInfoValue: {
    fontSize: 15,
    fontFamily: "LamaSans-Bold",
    color: Colors.primary,
  },
  tripVerticalDivider: {
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
    fontFamily: "LamaSans-Bold",
  },
});
