import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Platform, TouchableOpacity, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Theme from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarMapPointBold } from '@/components/icons/solar-icons';

const { Colors, normalize, Shadows } = Theme;
const SafeShadows = Shadows || { small: {}, medium: {}, large: {} };

// Mapbox Token
const MAPBOX_ACCESS_TOKEN = 'sk.eyJ1Ijoibm92YWl0aCIsImEiOiJjbXNneHdhd2YwYXZwMmtxeGZnb3l0OG0zIn0.n-s6o_-wXo_-w';

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
  title: string;
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
  onSelectMarker,
  onPressCard
}: AppMapProps) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNativeMap, setHasNativeMap] = useState(false);

  useEffect(() => {
    // Check if native Mapbox is truly ready
    if (Mapbox && Platform.OS !== 'web') {
      setHasNativeMap(true);
    }

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let currentLocation = await Location.getCurrentPositionAsync({});
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
            <ThemedText style={styles.markerTitle}>{marker.title}</ThemedText>
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
    : [47.85, 30.50]);

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView 
        style={styles.map} 
        styleURL={Mapbox.StyleURL.Light}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={zoomLevel}
          centerCoordinate={finalCenter}
          animationMode="flyTo"
        />

        {markers.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={marker.coordinates}
            onSelected={() => onSelectMarker?.(marker)}
          >
            <View style={styles.customMarkerUI}>
              <View style={styles.markerCircle}>
                <Image source={{ uri: marker.image }} style={styles.markerImage} resizeMode="cover" />
              </View>
              <ThemedText style={styles.markerTitle}>{marker.title}</ThemedText>
            </View>
          </Mapbox.PointAnnotation>
        ))}
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
    fontWeight: '800', fontFamily: "LamaSans-Black",
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
    fontWeight: '600', fontFamily: "LamaSans-SemiBold",
    textAlign: 'center',
  },
});
