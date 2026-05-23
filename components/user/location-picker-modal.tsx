import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Spacing, normalize, Typography } from '@/constants/theme';
import { PrimaryButton } from './primary-button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SolarCloseCircleBold, SolarMagnifierBold, SolarMapPointBold, SolarMapPointLinear } from "@/components/icons/solar-icons";
import { isRTL } from "@/i18n";

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps').default;
  if (Mapbox) {
    Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
  }
} catch (e) {
  console.log('Mapbox could not be initialized:', e);
}

interface GeoResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
  initialLocation?: { latitude: number; longitude: number };
}

export const LocationPickerModal = ({ visible, onClose, onSelect, initialLocation }: LocationPickerModalProps) => {
  const [region, setRegion] = useState({ latitude: 33.3152, longitude: 44.3661 });
  const [hasNativeMap] = useState(!!Mapbox);
  const cameraRef = useRef<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Sync with initialLocation when modal opens
  React.useEffect(() => {
    if (visible) {
      const startLoc = initialLocation || { latitude: 33.3152, longitude: 44.3661 };
      setRegion(startLoc);
      // Reset search state
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      if (cameraRef.current) {
        cameraRef.current.setCamera({
          centerCoordinate: [startLoc.longitude, startLoc.latitude],
          zoomLevel: 14,
          animationDuration: 0,
        });
      }
    }
  }, [visible, initialLocation]);

  const handleConfirm = () => {
    onSelect(region.latitude, region.longitude);
    onClose();
  };

  const onCameraChanged = (state: any) => {
    // onCameraChanged uses properties.center [lng, lat]
    if (state?.properties?.center) {
      const [lng, lat] = state.properties.center;
      setRegion({ latitude: lat, longitude: lng });
    }
  };

  const onMapIdle = (state: any) => {
    // onMapIdle uses geometry.coordinates [lng, lat]
    if (state?.geometry?.coordinates) {
      const [lng, lat] = state.geometry.coordinates;
      setRegion({ latitude: lat, longitude: lng });
    }
  };

  // ── Geocoding Search ──
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Bias search towards Iraq region
      const bbox = '38.79,29.06,48.57,37.38'; // Iraq bounding box
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&bbox=${bbox}&limit=5&language=ar,en&types=place,locality,neighborhood,address,poi`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
        const results: GeoResult[] = data.features.map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center,
          text: f.text,
        }));
        setSearchResults(results);
        setShowResults(true);
      }
    } catch (error) {
      console.warn('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Debounce API calls
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      searchPlaces(text);
    }, 400);
  }, [searchPlaces]);

  const handleSelectResult = useCallback((result: GeoResult) => {
    const [lng, lat] = result.center;
    setRegion({ latitude: lat, longitude: lng });
    setSearchQuery(result.text);
    setShowResults(false);
    Keyboard.dismiss();

    // Fly to selected location
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 15,
        animationDuration: 1200,
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SolarCloseCircleBold size={28} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'تحديد الموقع' : 'Set Location'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SolarMagnifierBold size={18} color="#94A3B8" />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'ابحث عن موقع أو مكان...' : 'Search for a place...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              returnKeyType="search"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginEnd: 4 }} />
            )}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity onPress={clearSearch} style={styles.searchClearBtn}>
                <Text style={styles.searchClearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <View style={styles.resultsDropdown}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.resultItem,
                      index < searchResults.length - 1 && styles.resultItemBorder,
                    ]}
                    onPress={() => handleSelectResult(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultIcon}>
                      <SolarMapPointBold size={16} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                        {item.text}
                      </Text>
                      <Text style={[styles.resultAddress, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                        {item.place_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Map */}
        <View style={styles.mapWrapper}>
          {hasNativeMap && Platform.OS !== 'web' ? (
            <Mapbox.MapView
              style={styles.map}
              styleURL={"mapbox://styles/mapbox/light-v11"}
              onCameraChanged={onCameraChanged}
              onMapIdle={onMapIdle}
              onPress={() => { setShowResults(false); Keyboard.dismiss(); }}
            >
              <Mapbox.Camera
                ref={cameraRef}
                defaultSettings={{
                  zoomLevel: 14,
                  centerCoordinate: [region.longitude, region.latitude],
                }}
              />
            </Mapbox.MapView>
          ) : (
            <View style={styles.fallback}>
              <SolarMapPointLinear size={64} color={Colors.text.muted} />
              <Text style={styles.fallbackText}>
                {isRTL ? 'الخارطة الحية تتطلب بيئة تشغيل حقيقية' : 'Live map requires a development build'}
              </Text>
            </View>
          )}

          {/* Center Pin / Crosshair */}
          <View style={[styles.markerFixed, { pointerEvents: "none" }]}>
            <SolarMapPointBold size={40} color={Colors.primary} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.locationInfo}>
            <View style={styles.coordBadge}>
              <Text style={styles.coordBadgeLabel}>Lat</Text>
              <Text style={styles.coordBadgeValue}>{region.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.coordBadge}>
              <Text style={styles.coordBadgeLabel}>Long</Text>
              <Text style={styles.coordBadgeValue}>{region.longitude.toFixed(6)}</Text>
            </View>
          </View>
          <PrimaryButton
            label={isRTL ? 'تأكيد الموقع' : 'Confirm Location'}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: normalize.font(16),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
  },
  // Search
  searchContainer: {
    position: 'relative',
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Alexandria-Regular',
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  searchClearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Alexandria-Bold',
  },
  // Results Dropdown
  resultsDropdown: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  resultItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultName: {
    fontSize: 14,
    fontFamily: 'Alexandria-SemiBold',
    color: Colors.text.primary,
  },
  resultAddress: {
    fontSize: 11,
    fontFamily: 'Alexandria-Regular',
    color: '#94A3B8',
    marginTop: 2,
  },
  // Map
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
    marginTop: -40,
    zIndex: 10,
  },
  // Footer
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  coordBadge: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordBadgeLabel: {
    fontSize: 10,
    fontFamily: 'Alexandria-Bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  coordBadgeValue: {
    fontSize: 12,
    fontFamily: 'Alexandria-SemiBold',
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
});
