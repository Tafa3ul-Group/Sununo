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
 * AppMap - A Mapbox wrapper component.
 * Includes a design-accurate fallback for Expo Go to match USER screenshot.
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

  if (loading) {
    return (
      <View style={[styles.container, style, styles.loading]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Fallback for Expo Go / Web to match USER screenshot design
  if (!hasNativeMap || Platform.OS === 'web') {
    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <Image 
          source={{ uri: 'https://api.mapbox.com/styles/v1/mapbox/light-v10/static/47.85,30.50,12/800x400?access_token=MOCK_TOKEN' }}
          style={styles.fallbackImage}
          resizeMode="cover"
        />
        
        {/* Design-accurate markers based on user image 1 */}
        <View style={[styles.designMarker, { top: '30%', right: '20%', borderColor: '#035DF9' }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=100' }} style={styles.markerImage} />
        </View>
        <View style={[styles.designMarker, { top: '50%', left: '40%', borderColor: '#EF79D7' }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=100' }} style={styles.markerImage} />
        </View>
        <View style={[styles.designMarker, { bottom: '20%', right: '30%', borderColor: '#EA2129' }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1449156001437-3a1621dfbe2b?w=100' }} style={styles.markerImage} />
        </View>
        <View style={[styles.designMarker, { bottom: '35%', left: '25%', borderColor: '#15AB64' }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=100' }} style={styles.markerImage} />
        </View>

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
        />
        {/* Markers are handled via children of Mapbox.MapView if we have real data */}
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
});
