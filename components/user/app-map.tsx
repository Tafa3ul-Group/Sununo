import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image, Platform, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { SolarMapPointBold } from "@/components/icons/solar-icons";

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

import { MapCard } from './map-card';

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
          source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${fallbackLng},${fallbackLat},${zoomLevel}/800x800?access_token=sk.eyJ1Ijoibm92YWl0aCIsImEiOiJjbXNneHdhd2YwYXZwMmtxeGZnb3l0OG0zIn0.n-s6o_-wXo_-w` }}
          style={styles.fallbackImage}
          resizeMode="cover"
        />
        
        {/* Render fallback markers in a somewhat distributed way */}
        {!selectedChalet && markers.map((marker, idx) => (
          <TouchableOpacity 
            key={marker.id}
            onPress={() => onSelectMarker?.(marker)}
            style={[
              styles.customMarker, 
              { 
                position: 'absolute',
                top: 100 + (idx * 60), 
                left: 50 + (idx * 80),
              }
            ]}
          >
            <View style={styles.markerCircle}>
              <Image source={{ uri: marker.image }} style={styles.markerImage} />
            </View>
            <ThemedText style={styles.markerTitle}>{marker.title}</ThemedText>
          </TouchableOpacity>
        ))}

        {showMarker && !selectedChalet && (
          <TouchableOpacity 
            onPress={() => onSelectMarker?.({ id: '1', title: 'شالية الاروع علة الطلاق', location: 'البصرة - الجزائر', rating: 4.5, image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1000&auto=format&fit=crop', price: 'IQD 30,000' })}
            style={[styles.designMarker, { top: '50%', left: '50%', transform: [{translateX: -16}, {translateY: -16}], borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}
          >
            <SolarMapPointBold size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {selectedChalet && (
          <View style={styles.cardOverlay}>
            <MapCard 
              {...selectedChalet} 
              onPress={() => onPressCard?.(selectedChalet.id)}
              onClose={() => onSelectMarker?.(null)}
            />
          </View>
        )}

        <View style={styles.fallbackOverlay}>
          <ThemedText style={styles.fallbackText}>
            الخارطة الحية - {centerCoordinate ? 'موقع الشالية' : 'موقعك الحالي'}
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

        {markers.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={marker.coordinates}
            onSelected={() => onSelectMarker?.(marker)}
          >
            <View style={styles.customMarker}>
              <View style={styles.markerCircle}>
                <Image source={{ uri: marker.image }} style={styles.markerImage} />
              </View>
              <ThemedText style={styles.markerTitle}>{marker.title}</ThemedText>
            </View>
          </Mapbox.PointAnnotation>
        ))}

        {showMarker && !markers.length && (
          <Mapbox.PointAnnotation
            id="chaletLocation"
            coordinate={finalCenter}
          >
            <View style={styles.nativeMarker}>
                <SolarMapPointBold size={30} color={Colors.primary} />
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
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    ...Shadows.small,
  },
  markerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    borderRadius: 4,
  }
});
