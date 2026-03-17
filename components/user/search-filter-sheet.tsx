import React, { forwardRef, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Colors, normalize, Shadows, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AdvancedSegmentTab } from './advanced-segment-tab';
import { AppButton } from './app-button';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const CITIES = [
  { id: 'basra', name: 'البصرة', icon: 'map' },
  { id: 'baghdad', name: 'بغداد', icon: 'map' },
  { id: 'erbil', name: 'اربيل', icon: 'map' },
  { id: 'duhok', name: 'دهوك', icon: 'map' },
];

/**
 * SearchFilterSheet - A search and filter drawer matching the provided design.
 */
export const SearchFilterSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const [activeTab, setActiveTab] = useState('where');
  const [selectedCity, setSelectedCity] = useState('basra');

  const snapPoints = useMemo(() => ['75%'], []);

  const tabs = [
    { id: 'where', label: 'وين', color: '#2B66FF' },
    { id: 'when', label: 'شوكت', color: '#00B36B' },
    { id: 'who', label: 'منو', color: '#FF7A00' },
  ];

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsAt={0} appearsAt={0.5} />
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: Colors.border }}
    >
      <BottomSheetView style={styles.container}>
        {/* Tabs */}
        <AdvancedSegmentTab 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Search Input */}
          <View style={styles.searchBar}>
            <TextInput 
              placeholder="ابحث" 
              style={styles.searchInput}
              placeholderTextColor={Colors.text.muted}
            />
            <Ionicons name="search-outline" size={22} color={Colors.text.muted} />
          </View>

          {/* City List */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.cityList}>
            {CITIES.map((city) => (
              <TouchableOpacity 
                key={city.id}
                onPress={() => setSelectedCity(city.id)}
                style={[
                  styles.cityItem,
                  selectedCity === city.id && styles.selectedCityItem
                ]}
              >
                <View style={styles.cityLeft}>
                   <MaterialCommunityIcons 
                    name="map-outline" 
                    size={24} 
                    color={Colors.primary} 
                  />
                </View>
                <ThemedText style={styles.cityName}>{city.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <AppButton 
              label="التالية" 
              onPress={() => {}} 
              style={styles.nextButton}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  contentCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: normalize.radius(30),
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    // Borders/Shadows to distinguish from background
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: normalize.radius(12),
    paddingHorizontal: Spacing.md,
    height: normalize.height(52),
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: normalize.font(16),
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: normalize.radius(12),
    backgroundColor: '#F0F4FF',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCityItem: {
    borderColor: Colors.primary,
    backgroundColor: '#E6EFFF',
  },
  cityName: {
    fontSize: normalize.font(18),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  cityLeft: {
    backgroundColor: 'white',
    width: normalize.width(40),
    height: normalize.width(40),
    borderRadius: normalize.radius(10),
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  footer: {
    marginTop: Spacing.md,
    alignItems: 'flex-start', // Next button on the left
  },
  nextButton: {
    width: normalize.width(120),
  }
});
