import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform, ActivityIndicator, Dimensions, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Shadows, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { getImageSrc } from '@/hooks/useImageSrc';
import { useGetOwnerChaletDetailsQuery } from '@/store/api/apiSlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 420;

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
  const scrollY = useRef(new Animated.Value(0)).current;

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

  // Parallax Header Animations
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-150, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT / 1.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const navBarOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Persistent Nav Bar (Sticky on scroll) */}
      <Animated.View style={[styles.navBar, { opacity: navBarOpacity }]}>
        <SafeAreaView edges={['top']} style={styles.navBarContent}>
          <TouchableOpacity style={styles.navBarButton} onPress={() => router.back()}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.navBarTitle} numberOfLines={1}>
            {chaletName}
          </Text>
          <TouchableOpacity style={styles.navBarButton} onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: chalet.id } })}>
            <Ionicons name="create-outline" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* Hero Background - Parallax */}
      <Animated.View style={[styles.imageContainer, { transform: [{ translateY: headerTranslate }, { scale: imageScale }] }]}>
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
        <View style={styles.imageOverlayDarken} />
        
        {/* Pagination Dots */}
        {chalet.images && chalet.images.length > 1 && (
          <View style={styles.pagination}>
            {chalet.images.map((_: any, i: number) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  { 
                    width: i === activeImageIndex ? 18 : 6, 
                    backgroundColor: i === activeImageIndex ? Colors.white : 'rgba(255,255,255,0.4)',
                    opacity: i === activeImageIndex ? 1 : 0.7
                  }
                ]} 
              />
            ))}
          </View>
        )}
      </Animated.View>

      {/* Main Scroll Content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSpacer} />
        
        <View style={styles.contentCard}>
          {/* Header Controls (Only visible when at top) */}
          <Animated.View style={[styles.headerActionsOverlay, { opacity: headerOpacity }]}>
            <SafeAreaView edges={['top']} style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: chalet.id } })}>
                <Ionicons name="create-outline" size={22} color={Colors.white} />
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>

          <View style={styles.contentBody}>
            {/* Title & Status Block */}
            <View style={[styles.titleSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.chaletName}>{chaletName || ''}</Text>
                  <View style={[styles.approvalBadge, { backgroundColor: chalet?.isApproved ? '#ECFDF5' : '#FFFBEB' }]}>
                    <Text style={[styles.approvalText, { color: chalet?.isApproved ? '#10B981' : '#F59E0B' }]}>
                      {chalet?.isApproved ? (isRTL ? 'مقبول' : 'Approved') : (isRTL ? 'قيد المراجعة' : 'Pending')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Ionicons name="location" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.locationText}>{chaletLocation || ''}</Text>
                </View>
              </View>
              <View style={styles.statusBox}>
                <Switch 
                  value={isActive} 
                  onValueChange={toggleStatus} 
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }} 
                  thumbColor="#fff"
                />
                <Text style={[styles.statusLabel, { color: isActive ? Colors.primary : Colors.text.muted }]}>
                  {isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'مخفي' : 'Hidden')}
                </Text>
              </View>
            </View>

            {/* Performance Stats */}
            <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{chalet?.revenue || '0'}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'الأرباح' : 'Revenue'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{chalet?.reviewCount || 0}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="star" size={20} color="#F97316" />
                </View>
                <Text style={styles.statValue}>{typeof chalet?.rating === 'string' ? parseFloat(chalet.rating).toFixed(1) : (chalet?.rating || 0)}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'التقييم' : 'Rating'}</Text>
              </View>
            </View>

            {/* Quick Management Tools */}
            <View style={[styles.managerGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity 
                style={styles.managerAction}
                onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/calendar', params: { id: chalet?.id } })}
              >
                <View style={styles.managerIconCircle}>
                  <Ionicons name="calendar" size={22} color={Colors.text.primary} />
                </View>
                <Text style={styles.managerLabel}>{isRTL ? 'التقويم' : 'Calendar'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.managerAction}
                onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: chalet?.id } })}
              >
                <View style={styles.managerIconCircle}>
                  <Ionicons name="options" size={22} color={Colors.text.primary} />
                </View>
                <Text style={styles.managerLabel}>{isRTL ? 'تعديل' : 'Edit'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.managerAction}>
                <View style={styles.managerIconCircle}>
                  <Ionicons name="share-social" size={22} color={Colors.text.primary} />
                </View>
                <Text style={styles.managerLabel}>{isRTL ? 'مشاركة' : 'Share'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionDivider} />

            {/* Chalet Amenities */}
            {chalet?.chaletAmenities && chalet.chaletAmenities.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المرافق المتاحة' : 'Amenities'}</Text>
                <View style={[styles.amenitiesWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {chalet.chaletAmenities.map((item: any) => (
                    <View key={item.id} style={styles.amenityPill}>
                      <Text style={styles.amenityEmoji}>{item.amenity?.icon || '✨'}</Text>
                      <Text style={styles.amenityText}>{isRTL ? item.amenity?.name?.ar : item.amenity?.name?.en}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Essential Details Tags */}
            <View style={styles.infoSection}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'معلومات أساسية' : 'Key Info'}</Text>
              <View style={[styles.detailsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.detailCard}>
                  <Ionicons name="people" size={20} color={Colors.primary} />
                  <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.maxGuests}</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'أقصى عدد' : 'Max Guests'}</Text>
                  </View>
                </View>
                <View style={styles.detailCard}>
                  <Ionicons name="card" size={20} color={Colors.primary} />
                  <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.depositPercentage}%</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'العربون' : 'Deposit'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Navigation Actions */}
            <View style={styles.navigationGrid}>
              <TouchableOpacity style={[styles.navActionCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => router.push('/(tabs)/(dashboard)/bookings')}>
                <View style={[styles.navActionIcon, { backgroundColor: '#F1F5F9' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.text.primary} />
                </View>
                <Text style={styles.navActionText}>{isRTL ? 'إدارة حجوزاتك' : 'Manage Bookings'}</Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={Colors.text.muted} />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.navActionCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => router.push('/(tabs)/(dashboard)/revenue')}>
                <View style={[styles.navActionIcon, { backgroundColor: '#F1F5F9' }]}>
                  <MaterialCommunityIcons name="chart-line" size={24} color={Colors.text.primary} />
                </View>
                <Text style={styles.navActionText}>{isRTL ? 'التقارير المالية' : 'Financial Reports'}</Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={[styles.infoSection, { marginBottom: 120 }]}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'عن المكان' : 'About the Space'}</Text>
              <Text style={[styles.descriptionText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {chaletDescription || ''}
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Modern Bottom Action Bar */}
      <View style={styles.stickyFooter}>
        <SafeAreaView edges={['bottom']} style={[styles.footerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.footerPriceLabel}>{isRTL ? 'السعر لليلة' : 'Price per night'}</Text>
            <Text style={styles.footerPriceValue}>
              {(chalet?.price || 0).toLocaleString()} 
              <Text style={styles.footerCurrency}> {isRTL ? 'د.ع' : 'IQD'}</Text>
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.footerPrimaryBtn} 
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Text style={styles.footerBtnText}>{isRTL ? 'تعديل السعر' : 'Update Price'}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Shadows.small,
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBarTitle: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: '70%',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: '#111',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  imageOverlayDarken: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSpacer: {
    height: HERO_HEIGHT - 60,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    ...Shadows.large,
    shadowOpacity: 0.1,
    minHeight: SCREEN_HEIGHT - 100,
  },
  headerActionsOverlay: {
    position: 'absolute',
    top: -HERO_HEIGHT + 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerActions: {
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  contentBody: {
    padding: 24,
    paddingTop: 36,
  },
  titleSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chaletName: {
    fontSize: normalize.font(26),
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  approvalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalText: {
    fontSize: normalize.font(11),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: normalize.font(15),
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  statusBox: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: normalize.font(10),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: normalize.font(17),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  managerGrid: {
    gap: 12,
    marginBottom: 32,
  },
  managerAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.small,
  },
  managerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  managerLabel: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 32,
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  amenitiesWrap: {
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
    minWidth: '47%',
  },
  amenityEmoji: {
    fontSize: 18,
  },
  amenityText: {
    fontSize: normalize.font(14),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  detailsRow: {
    gap: 12,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailValue: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  detailLabel: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  navigationGrid: {
    gap: 14,
    marginBottom: 32,
  },
  navActionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.small,
  },
  navActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActionText: {
    flex: 1,
    fontSize: normalize.font(15),
    fontWeight: '700',
    color: Colors.text.primary,
    marginHorizontal: 16,
  },
  descriptionText: {
    fontSize: normalize.font(15),
    color: Colors.text.secondary,
    lineHeight: 24,
    opacity: 0.9,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  footerPriceLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  footerPriceValue: {
    fontSize: normalize.font(20),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  footerCurrency: {
    fontSize: normalize.font(14),
    color: Colors.primary,
    fontWeight: '700',
  },
  footerPrimaryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 18,
    ...Shadows.medium,
  },
  footerBtnText: {
    color: '#fff',
    fontSize: normalize.font(15),
    fontWeight: '700',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    ...Shadows.large,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  }
});

