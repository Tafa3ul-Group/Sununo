import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { forwardRef, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows, Spacing } from '@/constants/theme';
import { AppButton } from './app-button';
import { MainTabs, TabType } from './MainTabs';

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
  const [activeTab, setActiveTab] = useState<TabType>('WHERE');
  const [selectedCity, setSelectedCity] = useState('basra');

  const snapPoints = useMemo(() => ['75%'], []);

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
        {/* Wavy Tabs */}
        <MainTabs 
          activeTab={activeTab} 
          onChange={setActiveTab} 
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
    alignItems: 'flex-start',
  },
  nextButton: {
    width: normalize.width(120),
  }
});
