import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from './themed-text';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { UserType } from '@/store/authSlice';

interface HeaderSectionProps {
  userType?: UserType;
  userName?: string;
  title?: string;
  showSearch?: boolean;
  showCategories?: boolean;
}

export function HeaderSection({ 
  userType, 
  userName, 
  title, 
  showSearch = true, 
  showCategories = true 
}: HeaderSectionProps) {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  
  const isOwner = userType === 'owner';
  const isRTL = language === 'ar';

  const CATEGORIES = [
    { id: 'all', label: t('home.categories.all'), icon: 'th-large' },
    { id: 'popular', label: t('home.categories.popular'), icon: 'fire' },
    { id: 'nearby', label: t('home.categories.nearby'), icon: 'map-marker-alt' },
    { id: 'luxury', label: t('home.categories.luxury'), icon: 'crown' },
  ];

  const flexDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Title & Filter Row */}
      <View style={[styles.topRow, { flexDirection }]}>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <ThemedText type="h1">
            {title || (isOwner ? t('tabs.myChalets') : t('tabs.home'))}
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: Colors.text.secondary }}>
            {userName ? `${t('home.welcome')}, ${userName}` : t('home.welcome')}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={normalize.width(22)} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { flexDirection }]}>
            <Ionicons name="search" size={normalize.width(20)} color={Colors.text.muted} />
            <TextInput 
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={Colors.text.muted}
              style={[styles.searchInput, { textAlign }]}
            />
          </View>
        </View>
      )}

      {/* Categories Scrollable */}
      {showCategories && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoriesContent, { flexDirection }]}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryItem,
                { flexDirection },
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.md,
  },
  topRow: {
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
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(12),
    paddingHorizontal: Spacing.md,
    height: normalize.height(52),
  },
  searchInput: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    fontSize: normalize.font(16),
    color: Colors.text.primary,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(10),
    gap: normalize.width(8),
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
