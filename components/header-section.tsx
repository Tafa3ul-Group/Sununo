import { Colors, normalize, Shadows, Spacing } from '@/constants/theme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './themed-text';

const CATEGORIES = [
  { id: 'cabin', label: 'Cabin', icon: 'home' },
  { id: 'luxury', label: 'Luxury', icon: 'gem' },
  { id: 'pet', label: 'Pet-friendly', icon: 'paw' },
];

export function HeaderSection() {
  const [selectedCategory, setSelectedCategory] = React.useState('cabin');

  return (
    <View style={styles.container}>
      {/* Title & Filter Row */}
      <View style={styles.topRow}>
        <ThemedText type="h1">Explore</ThemedText>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={normalize.width(22)} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={normalize.width(20)} color={Colors.text.muted} />
          <TextInput 
            placeholder="Location • Dates • Guests"
            placeholderTextColor={Colors.text.muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Categories Scrollable */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[
              styles.categoryItem,
              selectedCategory === cat.id && styles.categoryItemActive
            ]}
          >
            <FontAwesome5 
              name={cat.icon} 
              size={normalize.width(16)} 
              color={selectedCategory === cat.id ? Colors.background : Colors.text.primary} 
            />
            <ThemedText 
              style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive
              ]}
            >
              {cat.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  filterButton: {
    backgroundColor: Colors.surface,
    padding: normalize.width(8),
    borderRadius: normalize.radius(50),
    ...Shadows.light,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(12),
    paddingHorizontal: Spacing.md,
    height: normalize.height(52),
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: normalize.font(16),
    color: Colors.text.primary,
  },
  categoriesScroll: {
    paddingLeft: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(10),
    gap: 8,
  },
  categoryItemActive: {
    backgroundColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: normalize.font(14),
    fontWeight: '500',
    color: Colors.text.primary,
  },
  categoryLabelActive: {
    color: Colors.background,
  },
});
