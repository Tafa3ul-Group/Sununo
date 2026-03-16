import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import useImageSrc from '@/hooks/useImageSrc';
import { useGetOwnerChaletDetailsQuery } from '@/store/api/apiSlice';

export default function ChaletDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const { data: response, isLoading } = useGetOwnerChaletDetailsQuery(id);
  const chalet = response?.data;

  const chaletImage = useImageSrc(chalet?.images?.[0]?.url);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (chalet) {
      setIsActive(chalet.isActive);
    }
  }, [chalet]);

  const toggleStatus = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(value);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!chalet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.text.muted }}>
          {isRTL ? 'لم يتم العثور على الشاليه' : 'Chalet not found'}
        </Text>
      </View>
    );
  }

  const chaletName = isRTL ? (chalet.name?.ar || chalet.name) : (chalet.name?.en || chalet.name);
  const chaletLocation = isRTL ? (chalet.address?.ar || chalet.region?.name) : (chalet.address?.en || chalet.region?.enName);
  const chaletDescription = isRTL ? (chalet.description?.ar || chalet.description) : (chalet.description?.en || chalet.description);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.imageContainer}>
          <Image source={chaletImage} style={styles.heroImage} />
          <SafeAreaView style={styles.imageOverlay}>
            <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => console.log('Edit')}>
                <Ionicons name="create-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          {/* Title & Status Section */}
          <View style={[styles.titleSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.chaletName}>{chaletName}</Text>
              <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="location-outline" size={16} color={Colors.text.muted} />
                <Text style={styles.locationText}>{chaletLocation}</Text>
              </View>
            </View>
            <View style={styles.statusToggle}>
              <Text style={[styles.statusLabel, { color: isActive ? '#34C759' : '#8E8E93' }]}>
                {isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'متوقف' : 'Paused')}
              </Text>
              <Switch 
                value={isActive} 
                onValueChange={toggleStatus}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : Colors.white}
              />
            </View>
          </View>

          {/* Quick Performance Stats */}
          <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isRTL ? 'الأرباح' : 'Revenue'}</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{chalet.revenue}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
              <Text style={styles.statValue}>{chalet.reviewCount || 0}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isRTL ? 'التقييم' : 'Rating'}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.statValue}>{typeof chalet.rating === 'string' ? parseFloat(chalet.rating).toFixed(1) : (chalet.rating || 0)}</Text>
              </View>
            </View>
 Kinder:
          </View>

          {/* Action Grid */}
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => router.push('/(tabs)/(dashboard)/bookings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E5F1FF' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color="#007AFF" />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'إدارة الحجوزات' : 'Manage Bookings'}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={Colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => router.push('/(tabs)/(dashboard)/revenue')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EBF9EE' }]}>
                <MaterialCommunityIcons name="finance" size={24} color="#34C759" />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'تقارير الأرباح' : 'Revenue Reports'}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={[styles.aboutSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'عن الشاليه' : 'About Chalet'}</Text>
            <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}>
              {chaletDescription}
            </Text>
          </View>

          {/* Pricing Info */}
          <View style={styles.pricingCard}>
             <View style={[styles.pricingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.pricingLabel}>{isRTL ? 'السعر لليلة الواحدة' : 'Price per night'}</Text>
                <Text style={styles.priceValue}>{(chalet.price || 0).toLocaleString()} <Text style={styles.currency}>د.ع</Text></Text>
             </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerActions: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
  },
  titleSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  chaletName: {
    fontSize: normalize.font(24),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  locationRow: {
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: normalize.font(14),
    color: Colors.text.muted,
  },
  statusToggle: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: normalize.font(12),
    fontWeight: '700',
  },
  statsRow: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
    ...Shadows.small,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },
  actionGrid: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: normalize.font(15),
    fontWeight: '600',
    color: Colors.text.primary,
    marginHorizontal: 16,
  },
  aboutSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: normalize.font(15),
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  pricingCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  pricingRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: normalize.font(14),
    color: '#999',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: normalize.font(20),
    fontWeight: '800',
    color: Colors.white,
  },
  currency: {
    fontSize: normalize.font(12),
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  }
});
