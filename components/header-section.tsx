import { Colors, normalize, Spacing } from '@/constants/theme';
import { RootState } from '@/store';
import { UserType } from '@/store/authSlice';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSelector } from 'react-redux';
import { ThemedText } from './themed-text';


interface HeaderSectionProps {
  userType?: UserType;
  userName?: string;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  extraIcon?: string | any;
  onExtraIconPress?: () => void;
  showProfile?: boolean;
  onProfilePress?: () => void;
  onDeletePress?: () => void;
  showLogo?: boolean;
  showExtra?: boolean;
  marginBottom?: number;
}

export function HeaderSection({
  userType,
  userName,
  title,
  subtitle,
  showSearch = true,
  showCategories = true,
  showBackButton = false,
  onBackPress,
  extraIcon,
  onExtraIconPress,
  showProfile = false,
  onProfilePress,
  onDeletePress,
  showLogo = false,
  showExtra = true,
  marginBottom = Spacing.md
}: HeaderSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const [selectedCategory, setSelectedCategory] = React.useState('all');


  const isOwner = userType === 'owner';
  const isRTL = language === 'ar';
  const [useArLogo, setUseArLogo] = React.useState(true);

  const toggleLogo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUseArLogo(!useArLogo);
  };

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
      <View style={[styles.topRow, { flexDirection, marginBottom }]}>
        <View style={[styles.titleContainer, { flexDirection, flex: showLogo ? 0 : 1, alignItems: showLogo ? 'flex-end' : (showBackButton ? 'center' : (isRTL ? 'flex-end' : 'flex-start')) }]}>
          {showBackButton && (
            <TouchableOpacity
              onPress={onBackPress || (() => router.back())}
              style={styles.backButton}
            >
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={normalize.width(24)} color={Colors.text.primary} />
            </TouchableOpacity>
          )}

          {showLogo ? (
            <TouchableOpacity onPress={toggleLogo} activeOpacity={0.8}>
              <Image
                source={useArLogo ? require('@/assets/arlogo.svg') : require('@/assets/logo.svg')}
                style={styles.logo}
                contentFit="contain"
              />
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: showBackButton ? 'center' : (isRTL ? 'flex-end' : 'flex-start'), flex: showBackButton ? 1 : 0 }}>
              <ThemedText style={{ fontSize: normalize.font(18), fontWeight: '700' }}>
                {title || (isOwner ? t('tabs.home') : t('tabs.myChalets'))}
              </ThemedText>
              {subtitle && (
                <ThemedText style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </ThemedText>
              )}
            </View>
          )}
        </View>

        <View style={[styles.actionsContainer, { flexDirection: 'row' }]}>
          {showProfile && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onProfilePress || (() => {
                if (userType === 'owner') {
                  router.push('/(dashboard)/profile');
                } else {
                  router.push('/(customer)/profile');
                }
              })}
            >
              <Ionicons name="person-outline" size={normalize.width(22)} color={Colors.text.primary} />
            </TouchableOpacity>
          )}

          {showExtra && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onExtraIconPress || (() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(dashboard)/notifications');
              })}
            >
              {extraIcon ? (
                typeof extraIcon === 'string' ? (
                  <Ionicons name={extraIcon as any} size={normalize.width(22)} color={Colors.text.primary} />
                ) : (extraIcon)
              ) : (
                <Ionicons name="notifications-outline" size={normalize.width(22)} color={Colors.text.primary} />
              )}
            </TouchableOpacity>
          )}

          {onDeletePress && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDeletePress();
              }}
            >
              <Ionicons name="trash-outline" size={normalize.width(22)} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
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
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  titleContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: normalize.width(62),
    height: normalize.width(62),
  },
  backButton: {
    padding: normalize.width(4),
  },
  subtitle: {
    fontSize: normalize.font(14),
    color: Colors.text.muted,
    fontWeight: '400',
  },
  actionsContainer: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: Colors.white,
    padding: normalize.width(8),
    borderRadius: normalize.radius(50),
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
