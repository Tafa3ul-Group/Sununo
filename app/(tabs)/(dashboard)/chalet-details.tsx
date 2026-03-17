import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { getImageSrc } from '@/hooks/useImageSrc';
import { useGetOwnerChaletDetailsQuery } from '@/store/api/apiSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChaletDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const { data: response, isLoading } = useGetOwnerChaletDetailsQuery(id);
  const chalet = response?.data || (response?.id ? response : null);

  const [isActive, setIsActive] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
        {/* Hero Image Section/Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.floor(x / SCREEN_WIDTH));
            }}
            scrollEventThrottle={16}
          >
            {chalet.images && chalet.images.length > 0 ? (
              chalet.images.map((img: any, index: number) => (
                <Image 
                  key={img.id || index}
                  source={getImageSrc(img.url)} 
                  style={styles.heroImage} 
                  resizeMode="cover"
                />
              ))
            ) : (
              <Image 
                source={getImageSrc('')} 
                style={styles.heroImage} 
                resizeMode="cover"
              />
            )}
          </ScrollView>

          {/* Gallery Pagination Dots */}
          {chalet.images && chalet.images.length > 1 && (
            <View style={styles.pagination}>
              {chalet.images.map((_: any, i: number) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    { backgroundColor: i === activeImageIndex ? Colors.white : 'rgba(255,255,255,0.5)' }
                  ]} 
                />
              ))}
            </View>
          )}

          <SafeAreaView style={styles.imageOverlay}>
            <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: chalet.id } })}>
                <Ionicons name="create-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={[styles.titleSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.chaletName}>{chaletName || ''}</Text>
                <View style={[styles.approvalBadge, { backgroundColor: chalet?.isApproved ? '#EBF9EE' : '#FFF5E5' }]}>
                  <Text style={[styles.approvalText, { color: chalet?.isApproved ? '#34C759' : '#FF9500' }]}>
                    {chalet?.isApproved ? (isRTL ? 'مقبول' : 'Approved') : (isRTL ? 'قيد المراجعة' : 'Pending')}
                  </Text>
                </View>
              </View>
              <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="location-outline" size={16} color={Colors.text.muted} />
                <Text style={styles.locationText}>{chaletLocation || ''}</Text>
              </View>
            </View>
            <View style={styles.statusToggle}>
              <Text style={[styles.statusLabel, { color: isActive ? '#34C759' : '#8E8E93' }]}>
                {isActive ? (isRTL ? 'ظاهر' : 'Visible') : (isRTL ? 'مخفي' : 'Hidden')}
              </Text>
              <Switch value={isActive} onValueChange={toggleStatus} trackColor={{ false: '#D1D1D6', true: '#34C759' }} thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : Colors.white} />
            </View>
          </View>
          <Text style={[styles.sectionTitle, { marginBottom: 12, textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'أداء الشاليه' : 'Listing Performance'}
          </Text>
          <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isRTL ? 'الفواتير' : 'Revenue'}</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{chalet?.revenue || '0'}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
              <Text style={styles.statValue}>{chalet?.reviewCount || 0}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isRTL ? 'التقييم' : 'Rating'}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.statValue}>{typeof chalet?.rating === 'string' ? parseFloat(chalet.rating).toFixed(1) : (chalet?.rating || 0)}</Text>
              </View>
            </View>
          </View>
          {/* Provider Specific Actions */}
          <View style={styles.managerGrid}>
            <TouchableOpacity 
              style={styles.managerBtn}
              onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/calendar', params: { id: chalet?.id } })}
            >
              <View style={[styles.managerIcon, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.text.primary} />
              </View>
              <Text style={styles.managerText}>{isRTL ? 'إدارة الكالندر' : 'Calendar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.managerBtn} onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: chalet?.id } })}>
              <View style={[styles.managerIcon, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
              </View>
              <Text style={styles.managerText}>{isRTL ? 'تعديل البيانات' : 'Edit Listing'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.managerBtn}>
              <View style={[styles.managerIcon, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="share-outline" size={20} color={Colors.text.primary} />
              </View>
              <Text style={styles.managerText}>{isRTL ? 'مشاركة رابط' : 'Share'}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.detailsSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'تفاصيل الإقامة' : 'Listing Details'}</Text>
            <View style={[styles.detailItems, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.detailTag}>
                <Ionicons name="people-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.detailTagText}>{chalet?.maxGuests} {isRTL ? 'شخص' : 'Guests'}</Text>
              </View>
              <View style={styles.detailTag}>
                <Ionicons name="cash-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.detailTagText}>{chalet?.depositPercentage}% {isRTL ? 'عربون' : 'Deposit'}</Text>
              </View>
            </View>
          </View>
          {chalet?.chaletAmenities && chalet.chaletAmenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>{isRTL ? 'المرافق والخدمات' : 'Amenities'}</Text>
              <View style={[styles.amenitiesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {chalet.chaletAmenities.map((item: any) => (
                  <View key={item.id} style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>{item.amenity?.icon || '✨'}</Text>
                    <Text style={styles.amenityName}>{isRTL ? item.amenity?.name?.ar : item.amenity?.name?.en}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => router.push('/(tabs)/(dashboard)/bookings')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E5F1FF' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color="#007AFF" />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'إدارة الحجوزات' : 'Manage Bookings'}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={Colors.text.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => router.push('/(tabs)/(dashboard)/revenue')}>
              <View style={[styles.actionIcon, { backgroundColor: '#EBF9EE' }]}>
                <MaterialCommunityIcons name="finance" size={24} color="#34C759" />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'تقارير الأرباح' : 'Revenue Reports'}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
          <View style={[styles.aboutSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.sectionTitle}>{isRTL ? 'عن الشاليه' : 'About Chalet'}</Text>
            <Text style={[styles.description, { textAlign: isRTL ? 'right' : 'left' }]}>{chaletDescription || ''}</Text>
          </View>
          <View style={styles.pricingCard}>
             <View style={[styles.pricingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.pricingLabel}>{isRTL ? 'السعر لليلة الواحدة' : 'Price per night'}</Text>
                <Text style={styles.priceValue}>{(chalet?.price || 0).toLocaleString()} <Text style={styles.currency}>د.ع</Text></Text>
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
    width: SCREEN_WIDTH,
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
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  amenitiesSection: {
    marginBottom: 24,
  },
  amenitiesGrid: {
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityItem: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  amenityIcon: {
    fontSize: 18,
  },
  amenityName: {
    fontSize: normalize.font(13),
    color: Colors.text.primary,
    fontWeight: '500',
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  approvalText: {
    fontSize: normalize.font(10),
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  managerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  managerBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    ...Shadows.small,
  },
  managerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  managerText: {
    fontSize: normalize.font(11),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailItems: {
    gap: 12,
    marginTop: 8,
  },
  detailTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailTagText: {
    fontSize: normalize.font(13),
    color: Colors.text.secondary,
    fontWeight: '500',
  }
});
