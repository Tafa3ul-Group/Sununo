import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Colors, normalize } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

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
}

/**
 * AppMap - A Mapbox wrapper component that shows the user's current location.
 * Includes a fallback for Expo Go where native code is not available.
 */
export const AppMap = ({ style }: AppMapProps) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasNativeMap, setHasNativeMap] = useState(!!Mapbox);

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

  // Check if Mapbox is available
  useEffect(() => {
    if (!Mapbox || !Mapbox.StyleURL) {
      setHasNativeMap(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, style, styles.loading]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Fallback for Expo Go / Missing Native Code / Web
  if (!hasNativeMap || Platform.OS === 'web') {
    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <Image 
          source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/static/47.85,30.50,12/800x400?access_token=MOCK_TOKEN' }}
          style={styles.fallbackImage}
          resizeMode="cover"
        />
        <View style={styles.fallbackOverlay}>
          <ThemedText style={styles.fallbackText}>
            {Platform.OS === 'web' 
              ? 'الخارطة الحية غير متوفرة على الويب حالياً' 
              : 'تتطلب الخارطة الحية بناء اصدار مخصص (Dev Build)'}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Light}>
        <Mapbox.Camera
          zoomLevel={12}
          centerCoordinate={
            location 
              ? [location.coords.longitude, location.coords.latitude] 
              : [47.85, 30.50]
          }
          animationMode="flyTo"
          animationDuration={2000}
        />
        {location && (
          <Mapbox.PointAnnotation
            id="currentLocation"
            coordinate={[location.coords.longitude, location.coords.latitude]}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker} />
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
    borderRadius: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  fallbackOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    maxWidth: '80%',
  },
  fallbackText: {
    textAlign: 'center',
    fontSize: normalize.font(14),
    color: '#333',
    fontWeight: '600',
  },
  markerContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#035DF9',
    borderWidth: 2,
    borderColor: 'white',
  },
});
