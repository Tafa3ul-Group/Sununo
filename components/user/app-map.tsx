import { ThemedText } from '@/components/themed-text';
import * as Theme from '@/constants/theme';
import { RootState } from '@/store';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  onPressCard
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

  useEffect(() => {
    // Check if native Mapbox is truly ready
    if (Mapbox && Platform.OS !== 'web') {
      setHasNativeMap(true);
    }

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          setLocation(currentLocation);
        }
      } catch (err) {
        console.warn('Location error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <View style={styles.abstractMapBackground}>
          <Image
            source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${fallbackLng},${fallbackLat},${zoomLevel}/800x800?access_token=${MAPBOX_ACCESS_TOKEN}` }}
            style={styles.fallbackImage}
            resizeMode="cover"
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
              <Image source={{ uri: marker.image }} style={styles.markerImage} />
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

  const finalCenter: [number, number] = centerCoordinate || (location 
    ? [location.coords.longitude, location.coords.latitude] 
    : [47.82, 30.51]); // Default to a central Basra point

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={zoomLevel}
          centerCoordinate={finalCenter}
          animationMode="flyTo"
          animationDuration={1000}
          followUserLocation={isNavigating}
          followUserMode={isNavigating ? "course" : undefined}
          followPitch={isNavigating ? 45 : 0}
        />

        <Mapbox.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          renderMode="compass"
        />

        {/* Render all active markers */}
        {markers.map((marker) => (
          <Mapbox.MarkerView
            key={marker.id}
            id={marker.id}
            coordinate={marker.coordinates}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                onSelectMarker?.(marker);
              }}
              style={styles.customMarkerUI}
            >
              <View style={styles.markerCircle}>
                <Image source={{ uri: marker.image }} style={styles.markerImage} resizeMode="cover" />
              </View>
              <ThemedText style={styles.markerTitle}>
                {typeof marker.title === 'object' ? (isRTL ? marker.title.ar : marker.title.en) : marker.title}
              </ThemedText>
            </TouchableOpacity>
          </Mapbox.MarkerView>
        ))}



        {route && (
          <Mapbox.ShapeSource id="routeSource" shape={route}>
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: Colors.primary,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.8,
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
    ...SafeShadows.medium,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerTitle: {
    fontSize: 11,
    fontFamily: "LamaSans-Black",
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
    fontFamily: "LamaSans-SemiBold",
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
    fontFamily: "LamaSans-Bold",
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.Colors.primary,
    opacity: 0.2,
    zIndex: 1,
  },
});
