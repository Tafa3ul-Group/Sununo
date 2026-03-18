import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Colors, normalize } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

// Lazy load Mapbox to avoid crashes in environments without native code (like Expo Go)
let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps').default;
  if (Mapbox) {
    Mapbox.setAccessToken('sk.eyJ1Ijoibm92YWl0aCIsImEiOiJjbXNneHdhd2YwYXZwMmtxeGZnb3l0OG0zIn0.n-s6o_-wXo_-w');
  }
} catch (e) {
  console.log('Mapbox could not be initialized:', e);
}

interface AppMapProps {
  style?: any;
  centerCoordinate?: [number, number]; // [lng, lat]
  zoomLevel?: number;
  interactive?: boolean;
  showMarker?: boolean;
}

/**
 * AppMap - A Mapbox wrapper component.
 * Includes a design-accurate fallback for Expo Go to match USER screenshot.
 */
export const AppMap = ({ 
  style, 
  centerCoordinate, 
  zoomLevel = 12, 
  interactive = true,
  showMarker = false
}: AppMapProps) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNativeMap] = useState(!!Mapbox);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Geolocation permission denied');
        } else {
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

  // Fallback for Expo Go / Web to match USER screenshot design
  if (!hasNativeMap || Platform.OS === 'web') {
    const fallbackLng = centerCoordinate?.[0] || 47.85;
    const fallbackLat = centerCoordinate?.[1] || 30.50;

    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <Image 
          source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${fallbackLng},${fallbackLat},${zoomLevel}/800x400?access_token=MOCK_TOKEN` }}
          style={styles.fallbackImage}
          resizeMode="cover"
        />
        
        {showMarker && (
          <View style={[styles.designMarker, { top: '50%', left: '50%', transform: [{translateX: -16}, {translateY: -16}], borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
        )}

        <View style={styles.fallbackOverlay}>
          <ThemedText style={styles.fallbackText}>
            {Platform.OS === 'web' 
              ? 'الخارطة الحية (قيد التطوير)' 
              : 'الخارطة الحية تتطلب اصدار مخصص'}
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
        scrollEnabled={interactive}
        zoomEnabled={interactive}
      >
        <Mapbox.Camera
          zoomLevel={zoomLevel}
          centerCoordinate={finalCenter}
          animationMode="flyTo"
        />
        {showMarker && (
          <Mapbox.PointAnnotation
            id="chaletLocation"
            coordinate={finalCenter}
          >
            <View style={styles.nativeMarker}>
                <Ionicons name="location" size={30} color={Colors.primary} />
            </View>
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24, // Consistent with HomeScreen mapContainer
    overflow: 'hidden',
    backgroundColor: '#eee',
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
    backgroundColor: '#F3F4F6',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  designMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'white',
    padding: 1,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  fallbackOverlay: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
  },
  fallbackText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  nativeMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.primary,
  }
});
