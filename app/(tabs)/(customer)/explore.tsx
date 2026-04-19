import {
  SolarAltArrowRightBold,
  SolarFireBold,
  SolarMapBoldDuotone,
  SolarMapPointBold,
  SolarMapPointLinear,
  SolarStarBold,
  SolarTreeBold,
  SolarWaterBold,
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
  View
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

  // Navigation & Routing State
  const [route, setRoute] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["38%"], []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
      }
    })();
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
    setSelectedChalet(fullChalet);
    setZoom(17);
    setRoute(null);
    setIsNavigating(false);
    bottomSheetRef.current?.present();
  };

  const handleDismissSheet = () => {
    setSelectedChalet(null);
    setZoom(13);
  };

  const getRoute = async () => {
    if (!location || !selectedChalet) return;
    const start = [location.coords.longitude, location.coords.latitude];
    const end = selectedChalet.coordinates;

    try {
      const resp = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await resp.json();
      if (data.routes && data.routes[0]) {
        setRoute(data.routes[0].geometry);
        bottomSheetRef.current?.dismiss(); // Hide sheet to show map/route
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
          centerCoordinate={selectedChalet?.coordinates}
          zoomLevel={zoom}
          showMarker={true}
          markers={filteredChalets}
          selectedChalet={selectedChalet}
          route={route}
          isNavigating={isNavigating}
          onSelectMarker={handleSelectChalet}
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

      {/* Navigation Overlays (FABs) */}
      {!route && !selectedChalet && location && (
        <TouchableOpacity 
          style={styles.myLocationFab} 
          onPress={() => {
            setSelectedChalet(null);
            setZoom(15);
          }}
        >
          <SolarMapBoldDuotone size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {route && (
        <View style={styles.navFabContainer}>
          <TouchableOpacity
            style={[styles.navFab, isNavigating && styles.navFabActive]}
            onPress={() => setIsNavigating(!isNavigating)}
          >
            <SolarMapBoldDuotone size={24} color={isNavigating ? "white" : Colors.primary} />
            <ThemedText style={[styles.navFabText, isNavigating && { color: 'white' }]}>
              {isRTL ? 'وضعية القيادة' : 'Driving Mode'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navFab} onPress={shareChalet}>
            <SolarMapPointLinear size={24} color={Colors.primary} />
            <ThemedText style={styles.navFabText}>{isRTL ? 'المشاركة' : 'Share'}</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navFab, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
            onPress={() => {
              setRoute(null);
              setIsNavigating(false);
            }}
          >
            <ThemedText style={[styles.navFabText, { color: '#EF4444' }]}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </ThemedText>
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
                    {isRTL ? selectedChalet.title.ar : selectedChalet.title.en}
                  </ThemedText>
                  <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <SolarMapPointBold size={14} color="#6B7280" />
                    <ThemedText style={styles.chaletLocation}>
                      {isRTL ? selectedChalet.location.ar : selectedChalet.location.en}
                    </ThemedText>
                  </View>
                  <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <ThemedText style={styles.priceText}>{selectedChalet.price} د.ع</ThemedText>
                    <View style={[styles.dot, { marginHorizontal: 8 }]} />
                    <SolarStarBold size={14} color="#F59E0B" />
                    <ThemedText style={styles.ratingText}>{selectedChalet.rating}</ThemedText>
                  </View>
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

              <View style={[styles.actionGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, route && styles.actionBtnActive]}
                  onPress={() => route ? setRoute(null) : getRoute()}
                >
                  <SolarMapPointBold size={22} color={route ? "white" : Colors.primary} />
                  <ThemedText style={[styles.actionText, route && { color: 'white' }]}>
                    {isRTL ? 'تتبع المسار' : 'Track Route'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, isNavigating && styles.actionBtnActive]}
                  onPress={() => {
                    if (!route) getRoute();
                    setIsNavigating(!isNavigating);
                  }}
                >
                  <SolarMapBoldDuotone size={22} color={isNavigating ? "white" : Colors.primary} />
                  <ThemedText style={[styles.actionText, isNavigating && { color: 'white' }]}>
                    {isRTL ? 'وضعية القيادة' : 'Driving Mode'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={shareChalet}>
                  <SolarMapPointLinear size={22} color={Colors.primary} />
                  <ThemedText style={styles.actionText}>{isRTL ? 'المشاركة' : 'Share'}</ThemedText>
                </TouchableOpacity>
              </View>

              <PrimaryButton
                label={isRTL ? "مشاهدة المزيد من التفاصيل" : "View More Details"}
                onPress={() => {
                  bottomSheetRef.current?.dismiss();
                  router.push(`/(customer)/chalet/${selectedChalet.id}`);
                }}
                style={styles.fullDetailBtn}
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
  navFabContainer: {
    position: 'absolute',
    bottom: normalize.height(40),
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 100,
  },
  navFab: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  navFabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  navFabText: {
    fontSize: 12,
    fontFamily: "LamaSans-Bold",
    color: Colors.primary,
  },
  myLocationFab: {
    position: 'absolute',
    bottom: normalize.height(40),
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
  }
});
