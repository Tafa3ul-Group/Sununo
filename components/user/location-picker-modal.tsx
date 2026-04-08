import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { Colors, Spacing, normalize, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './primary-button';
import { SafeAreaView } from 'react-native-safe-area-context';

let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps').default;
  if (Mapbox) {
    Mapbox.setAccessToken('sk.eyJ1Ijoibm92YWl0aCIsImEiOiJjbXNneHdhd2YwYXZwMmtxeGZnb3l0OG0zIn0.n-s6o_-wXo_-w');
  }
} catch (e) {
  console.log('Mapbox could not be initialized:', e);
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initialLocation?: { latitude: number; longitude: number };
}

export const LocationPickerModal = ({ visible, onClose, onSelect, initialLocation }: LocationPickerModalProps) => {
  const [region, setRegion] = useState(initialLocation || { latitude: 33.3152, longitude: 44.3661 });
  const [hasNativeMap] = useState(!!Mapbox);

  const handleConfirm = () => {
    onSelect(region.latitude, region.longitude);
    onClose();
  };

  const onRegionChange = (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    setRegion({ latitude: lat, longitude: lng });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SolarIcon name="4k-bold" size={28} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>تحديد الموقع</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mapWrapper}>
          {hasNativeMap && Platform.OS !== 'web' ? (
            <Mapbox.MapView 
                style={styles.map} 
                styleURL={Mapbox.StyleURL.Light}
                onRegionIsChanging={onRegionChange}
            >
              <Mapbox.Camera
                zoomLevel={14}
                centerCoordinate={[region.longitude, region.latitude]}
              />
            </Mapbox.MapView>
          ) : (
            <View style={styles.fallback}>
                <SolarIcon name="4k-bold" size={64} color={Colors.text.muted} />
                <Text style={styles.fallbackText}>الخارطة الحية تتطلب بيئة تشغيل حقيقية</Text>
            </View>
          )}

          {/* Center Pin / Crosshair */}
          <View style={[styles.markerFixed, { pointerEvents: "none" }]}>
            <SolarIcon name="4k-bold" size={40} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.locationInfo}>
            <Text style={styles.coordinateLabel}>Lat: {region.latitude.toFixed(6)}</Text>
            <Text style={styles.coordinateLabel}>Long: {region.longitude.toFixed(6)}</Text>
          </View>
          <PrimaryButton 
            label="تأكيد الموقع" 
            onPress={handleConfirm} 
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    ...Typography.h2,
    fontSize: normalize.font(18),
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  fallbackText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.text.muted,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40, // Adjust based on icon size and point
    zIndex: 10,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  coordinateLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    fontSize: normalize.font(12),
  }
});
