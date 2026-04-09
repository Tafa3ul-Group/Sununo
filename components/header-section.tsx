import {
  SolarAltArrowLeftBold,
  SolarBellBold,
  SolarDangerCircleBold,
  SolarGalleryBold,
  SolarMagnifierBold,
  SolarMapPointBold,
  SolarStarBold,
  SolarTrashBinBold,
  SolarUserBold,
  SolarAltArrowRightBold
} from '@/components/icons/solar-icons';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { RootState } from '@/store';
import { UserType } from '@/store/authSlice';
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
import { CircleBackButton } from './ui/circle-back-button';

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
  const { language, userType: stateUserType } = useSelector((state: RootState) => state.auth);
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const finalUserType = userType || stateUserType;
  const isOwner = finalUserType === 'owner';
  const isRTL = language === 'ar';
  const [useArLogo, setUseArLogo] = React.useState(true);

  const toggleLogo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUseArLogo(!useArLogo);
  };

  const CATEGORIES = [
    { id: 'all', label: t('home.categories.all'), icon: <SolarGalleryBold size={normalize.width(18)} /> },
    { id: 'popular', label: t('home.categories.popular'), icon: <SolarDangerCircleBold size={normalize.width(18)} /> },
    { id: 'nearby', label: t('home.categories.nearby'), icon: <SolarMapPointBold size={normalize.width(18)} /> },
    { id: 'luxury', label: t('home.categories.luxury'), icon: <SolarStarBold size={normalize.width(18)} /> },
  ];

  const textAlign = isRTL ? 'right' : 'left';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Title Bar Section */}
      <View style={[styles.topRow, { marginBottom }]}>
        {/* Left Side (Back button for LTR, Logo for RTL) */}
        <View style={styles.headerSide}>
          {!isRTL && showBackButton && (
            isOwner ? <CircleBackButton onPress={onBackPress} /> : (
              <TouchableOpacity onPress={onBackPress || (() => router.back())} style={styles.backButton}>
                <SolarAltArrowLeftBold size={normalize.width(22)} color={Colors.text.primary} />
              </TouchableOpacity>
            )
          )}
          {isRTL && showLogo && (
            <TouchableOpacity onPress={toggleLogo} activeOpacity={0.8}>
               <Image
                 source={useArLogo ? require('@/assets/arlogo.svg') : require('@/assets/logo.svg')}
                 style={styles.logo}
                 contentFit="contain"
               />
             </TouchableOpacity>
          )}
        </View>

        {/* Center - Title (perfectly centered in the screen) */}
        <View style={styles.titleWrapper}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {title || (isOwner ? t('tabs.home') : t('tabs.myChalets'))}
          </ThemedText>
        </View>

        {/* Right Side (Back button for RTL, Logo/Actions for LTR) */}
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          {isRTL && showBackButton && (
            isOwner ? <CircleBackButton onPress={onBackPress} /> : (
              <TouchableOpacity onPress={onBackPress || (() => router.back())} style={styles.backButton}>
                <SolarAltArrowRightBold size={normalize.width(22)} color={Colors.text.primary} />
              </TouchableOpacity>
            )
          )}
          {!isRTL && showLogo && (
            <TouchableOpacity onPress={toggleLogo} activeOpacity={0.8}>
               <Image
                 source={useArLogo ? require('@/assets/arlogo.svg') : require('@/assets/logo.svg')}
                 style={styles.logo}
                 contentFit="contain"
               />
             </TouchableOpacity>
          )}
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {showProfile && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onProfilePress || (() => {
                  if (finalUserType === 'owner') {
                    router.push('/(dashboard)/profile');
                  } else {
                    router.push('/(customer)/profile');
                  }
                })}
              >
                <SolarUserBold size={normalize.width(22)} color={Colors.text.primary} />
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
                     <SolarBellBold size={normalize.width(22)} color={Colors.text.primary} />
                  ) : (extraIcon)
                ) : (
                  <SolarBellBold size={normalize.width(22)} color={Colors.text.primary} />
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
                <SolarTrashBinBold size={normalize.width(22)} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SolarMagnifierBold size={normalize.width(20)} color={Colors.text.muted} />
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
          contentContainerStyle={[styles.categoriesContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryItem,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                selectedCategory === cat.id && styles.categoryItemActive
              ]}
            >
              {React.cloneElement(cat.icon as React.ReactElement, {
                color: selectedCategory === cat.id ? Colors.background : Colors.text.primary
              })}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    height: normalize.height(60),
  },
  headerSide: {
    width: normalize.width(80),
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontWeight: '700',
    color: Colors.text.primary,
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
