import { ThemedText } from '@/components/themed-text';
import * as Theme from '@/constants/theme';
import { RootState } from '@/store';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSelector } from 'react-redux';

const { Colors, normalize, Shadows } = Theme;
const SafeShadows = Shadows || { small: {}, medium: {}, large: {} };

// Mapbox Token
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Lazy load Mapbox
let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps').default;
  if (Mapbox) {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  }
} catch (e) {
  console.log('Mapbox native module not found:', e);
}

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

interface MarkerData {
  id: string;
  title: string | { ar: string; en: string };
  image: string;
  coordinates: [number, number];
  [key: string]: any;
}

interface AppMapProps {
  style?: any;
  centerCoordinate?: [number, number]; // [lng, lat]
  zoomLevel?: number;
  interactive?: boolean;
  showMarker?: boolean;
  selectedChalet?: any;
  markers?: MarkerData[];
  route?: any;
  isNavigating?: boolean;
  onSelectMarker?: (chalet: any) => void;
  onPressCard?: (id: string) => void;
  onCameraChanged?: (center: [number, number], zoom: number) => void;
  onPress?: () => void;
}

export const AppMap = ({
  style,
  centerCoordinate,
  zoomLevel = 12,
  interactive = true,
  showMarker = false,
  selectedChalet,
  markers = [],
  route,
  isNavigating = false,
  onSelectMarker,
  onPressCard,
  onCameraChanged,
  onPress
}: AppMapProps) => {
  const { i18n } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar' || i18n.language === 'ar';
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedChaletState, setSelectedChaletState] = useState<any>(selectedChalet);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNativeMap, setHasNativeMap] = useState(false);
  const cameraRef = React.useRef<any>(null);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(2, { duration: 2000 }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );

    // Check if native Mapbox is truly ready
    if (Mapbox && Platform.OS !== 'web') {
      setHasNativeMap(true);
    }

    let locationSubscription: any = null;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Get initial position
          let currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentLocation);

          // Watch for changes
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 5, // update every 5 meters
              timeInterval: 1000,   // or every second
            },
            (newLocation) => {
              setLocation(newLocation);
            }
          );
        }
      } catch (err) {
        console.warn('Location error:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const handleMapLoadingError = useCallback((err: any) => {
    console.warn('Mapbox Load Error:', err);
  }, []);

  const handleMapIdle = useCallback((feature: any) => {
    if (onCameraChanged && feature.geometry && feature.geometry.coordinates) {
      onCameraChanged(
        feature.geometry.coordinates as [number, number],
        feature.properties.zoomLevel
      );
    }
  }, [onCameraChanged]);

  // Automatically fit map to markers when they load
  useEffect(() => {
    // Only auto-fit if we don't have a specific chalet selected
    if (markers && markers.length > 0 && cameraRef.current && !selectedChalet) {
      // Small delay to ensure map is ready
      const timer = setTimeout(() => {
        if (markers.length === 1) {
          cameraRef.current?.setCamera({
            centerCoordinate: markers[0].coordinates,
            zoomLevel: 14,
            animationDuration: 1000,
          });
        } else {
          const lats = markers.map(m => m.coordinates[1]);
          const lngs = markers.map(m => m.coordinates[0]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          cameraRef.current?.fitBounds(
            [maxLng, maxLat], // North East
            [minLng, minLat], // South West
            Platform.OS === 'ios' ? 80 : 100, // Padding
            1000 // Duration
          );
        }
      }, 800); // Increased delay for better stability
      return () => clearTimeout(timer);
    }
  }, [markers?.length, !!selectedChalet]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const routeShape = React.useMemo(() => {
    if (!route) return null;
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: route
      }]
    };
  }, [route]);

  if (loading) {
    return (
      <View style={[styles.container, style, styles.loading]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

// Fallback for Expo Go / Web / Error

  if (!hasNativeMap || Platform.OS === 'web') {
    const fallbackLng = centerCoordinate?.[0] || 47.85;
    const fallbackLat = centerCoordinate?.[1] || 30.50;
    const showStaticMarker = showMarker && centerCoordinate && !isNaN(centerCoordinate[0]) && !isNaN(centerCoordinate[1]);
    const markerOverlay = showStaticMarker ? `pin-l+${Colors.primary.replace('#', '')}(${fallbackLng},${fallbackLat})/` : '';

    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <View style={styles.abstractMapBackground}>
          <Image
            source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markerOverlay}${fallbackLng},${fallbackLat},${zoomLevel}/800x800?access_token=${MAPBOX_ACCESS_TOKEN}` }}
            style={styles.fallbackImage}
            contentFit="cover"
          />
        </View>

        {/* Render markers */}
        {markers.map((marker, idx) => (
          <TouchableOpacity
            key={marker.id}
            onPress={() => onSelectMarker?.(marker)}
            style={[
              styles.customMarkerUI,
              {
                position: 'absolute',
                top: 150 + (idx * 100),
                left: 50 + (idx * 40 * (idx % 2 === 0 ? 1 : -1)),
              }
            ]}
          >
            <View style={styles.markerCircle}>
              <Image source={marker.image} style={styles.markerImage} contentFit="cover" transition={200} />
            </View>
            <ThemedText style={styles.markerTitle}>
              {typeof marker.title === 'object' ? (isRTL ? marker.title.ar : marker.title.en) : marker.title}
            </ThemedText>
          </TouchableOpacity>
        ))}

        <View style={styles.fallbackOverlay}>
          <ThemedText style={styles.fallbackText}>
            Mapbox Live requires a Development Build
          </ThemedText>
        </View>
      </View>
    );
  }

  const hasValidCenter = centerCoordinate && !isNaN(centerCoordinate[0]) && !isNaN(centerCoordinate[1]);

  const finalCenter: [number, number] = hasValidCenter ? centerCoordinate : (location
    ? [location.coords.longitude, location.coords.latitude]
    : [47.82, 30.51]); // Default to a central Basra point

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={isNavigating ? Mapbox.StyleURL.NavigationDay : Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={handlePress}
        onMapLoadingError={handleMapLoadingError}
        onMapIdle={handleMapIdle}
      >
        {/* Immersive 3D Buildings - Temporarily disabled for debugging route */}
        {/*
        {isNavigating && (
          <Mapbox.FillExtrusionLayer
            id="3d-buildings"
            sourceID="composite"
            sourceLayerID="building"
            filter={['==', 'extrude', 'true']}
            style={{
              fillExtrusionColor: '#D1D5DB',
              fillExtrusionHeight: ['get', 'height'],
              fillExtrusionBase: ['get', 'min_height'],
              fillExtrusionOpacity: 0.6,
            }}
          />
        )}
        */}
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={isNavigating ? 18 : zoomLevel}
          centerCoordinate={isNavigating ? undefined : finalCenter}
          followUserLocation={isNavigating}
          followUserMode={isNavigating ? "course" : "normal"}
          followPitch={isNavigating ? 70 : 0}
          animationMode="flyTo"
          animationDuration={1500}
        />

        {/* User Location Marker - Using MarkerView for custom UI and reliability */}
        {location && (
          <Mapbox.MarkerView
            id="user-location"
            coordinate={[location.coords.longitude, location.coords.latitude]}
          >
            <View style={[
              styles.userLocationMarker,
              isNavigating && location.coords.heading !== null && { transform: [{ rotate: `${location.coords.heading}deg` }] }
            ]}>
              {/* Premium Pulse for driving mode */}
              <Animated.View style={[styles.userLocationPulse, pulseStyle, { backgroundColor: isNavigating ? 'rgba(59, 130, 246, 0.4)' : Colors.primary }]} />

              {/* Navigation Puck style to match screenshot */}
              <View style={[styles.userLocationDot, isNavigating && styles.navPuck]}>
                {isNavigating && (
                  <View style={styles.puckArrow} />
                )}
              </View>

              {/* Static Heading Arrow (for non-navigation) */}
              {!isNavigating && location.coords.heading !== null && location.coords.heading >= 0 && (
                <View style={[styles.headingArrowContainer, { transform: [{ rotate: `${location.coords.heading}deg` }] }]}>
                  <View style={styles.headingArrow} />
                </View>
              )}
            </View>
          </Mapbox.MarkerView>
        )}

        {/* Single Marker for center coordinate if requested and no markers provided */}
        {showMarker && hasValidCenter && markers.length === 0 && (
          <Mapbox.MarkerView id="centerMarker" coordinate={centerCoordinate}>
            <View style={styles.simpleMarker}>
              <View style={[styles.markerPin, { backgroundColor: Colors.primary }]} />
              <View style={[styles.markerDot, { backgroundColor: Colors.primary }]} />
            </View>
          </Mapbox.MarkerView>
        )}

        {/* Render all active markers */}
        {markers.map((marker) => (
          <Mapbox.MarkerView
            key={marker.id}
            id={marker.id}
            coordinate={marker.coordinates}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                onSelectMarker?.(marker);
              }}
              style={styles.customMarkerUI}
            >
              <View style={styles.markerCircle}>
                <Image 
                  source={marker.image} 
                  style={styles.markerImage} 
                  contentFit="cover" 
                  transition={300}
                />
              </View>
              <ThemedText style={styles.markerTitle}>
                {typeof marker.title === 'object' ? (isRTL ? marker.title.ar : marker.title.en) : marker.title}
              </ThemedText>
            </TouchableOpacity>
          </Mapbox.MarkerView>
        ))}



        {/* Route Source - Moved to bottom for max z-index */}
        {routeShape && (
          <Mapbox.ShapeSource
            id="routeSource"
            key={route ? 'route-active' : 'route-inactive'}
            shape={routeShape}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: '#3B82F6',
                lineWidth: 10,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 1,
              }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    position: 'relative',
    height: '100%',
    width: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  abstractMapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F9FA',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  customMarkerUI: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  markerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerTitle: {
    fontSize: 11,
    fontFamily: "Alexandria-Black",
    color: '#111827',
    marginTop: 6,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    ...SafeShadows.small,
  },
  fallbackOverlay: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fallbackText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: "Alexandria-SemiBold",
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: normalize.height(100),
    right: normalize.width(16),
    left: normalize.width(16),
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fab: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    ...SafeShadows.medium,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  fabActive: {
    backgroundColor: Theme.Colors.primary,
    borderColor: Theme.Colors.primary,
  },
  fabText: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
  },
  userLocationMarker: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.Colors.primary,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
    ...SafeShadows.small,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.Colors.primary,
    zIndex: 1,
  },
  simpleMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.Colors.primary,
    borderWidth: 3,
    borderColor: 'white',
    ...SafeShadows.medium,
  },
  navPuck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    transform: [{ translateY: -2 }],
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.Colors.primary,
    position: 'absolute',
    bottom: -10,
  },
  headingArrowContainer: {
    position: 'absolute',
    top: -10,
    width: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  headingArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Theme.Colors.primary,
  },
});
