import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform, ActivityIndicator, Dimensions, Animated, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Colors, normalize, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { getImageSrc } from '@/hooks/useImageSrc';
import { useGetOwnerChaletDetailsQuery, useDeleteChaletMutation } from '@/store/api/apiSlice';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { 
  SolarTrashBinBold,
  SolarPenBold,
  SolarMapPointBold,
  SolarBanknoteBold,
  SolarStarBold, 
  SolarUsersGroupBold,
  SolarChartBold,
  SolarClockCircleBold,
  SolarCalendarBold
} from "@/components/icons/solar-icons";
import { CircleBackButton } from '@/components/ui/circle-back-button';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 420;

export default function ChaletDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  
  const { data: response, isLoading } = useGetOwnerChaletDetailsQuery(id);
  const [deleteChalet] = useDeleteChaletMutation();
  const chalet = response?.data || (response?.id ? response : null);

  const [isActive, setIsActive] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleDelete = () => {
    Alert.alert(
      isRTL ? 'حذف الشاليه' : 'Delete Chalet',
      isRTL ? 'هل أنت متأكد من حذف هذا الشاليه نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to permanently delete this chalet? This action cannot be undone.',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRTL ? 'حذف' : 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChalet(id).unwrap();
              router.replace('/(tabs)/(dashboard)/home');
            } catch (err) {
              Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل حذف الشاليه' : 'Failed to delete chalet');
            }
          }
        }
      ]
    );
  };
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

  // Fixed Header State - Image stays background, content slides UP over it.
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const navBarOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Persistent Nav Bar (Sticky title only) */}
      <Animated.View style={[styles.navBar, { opacity: navBarOpacity }]}>
        <SafeAreaView edges={['top']} style={styles.navBarContent}>
          <View style={styles.navBarButtonPlaceholder} />
          <Text style={styles.navBarTitle} numberOfLines={1}>
            {chaletName}
          </Text>
          <View style={styles.navBarButtonPlaceholder} />
        </SafeAreaView>
      </Animated.View>

      {/* Hero Background - Static (Content slides over this) */}
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
      </View>

      {/* Persistent Header Actions (Always in the same place & design) */}
      <View style={styles.fixedHeaderActions}>
        <SafeAreaView edges={['top']} style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <CircleBackButton 
            onPress={() => router.back()} 
            style={{ width: 42, height: 42, borderRadius: 21 }} 
          />
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]} 
              onPress={handleDelete}
            >
              <SolarTrashBinBold size={22} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: chalet.id } })}>
              <SolarPenBold size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Scroll Content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        <View style={styles.heroSpacer} />
        
        <View style={styles.contentCard}>
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
                  <SolarMapPointBold size={16} color={Colors.primary} style={{ marginTop: 2 }} />
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
                  <SolarBanknoteBold size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{chalet?.revenue || '0'}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'الأرباح' : 'Revenue'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <SolarCalendarBold size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{chalet?.reviewCount || 0}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
                  <SolarStarBold size={20} color="#F97316" />
                </View>
                <Text style={styles.statValue}>{typeof chalet?.rating === 'string' ? parseFloat(chalet.rating).toFixed(1) : (chalet?.rating || 0)}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'التقييم' : 'Rating'}</Text>
              </View>
            </View>

            {/* Main Management Action - Calendar */}
            <View style={styles.managementSection}>
              <SecondaryButton 
                label={isRTL ? 'إدارة الفترات والأسعار' : 'Manage Shifts & Pricing'}
                onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/shifts', params: { id: chalet?.id } })}
                icon={<SolarClockCircleBold size={22} color={Colors.primary} />}
                isActive={false} // Use the outlined design system style
                style={styles.fullWidthButton}
              />
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
                  <SolarUsersGroupBold size={20} color={Colors.primary} />
                  <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.maxGuests}</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'أقصى عدد' : 'Max Guests'}</Text>
                  </View>
                </View>
                <View style={styles.detailCard}>
                  <SolarBanknoteBold size={20} color={Colors.primary} />
                  <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.depositPercentage}%</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'العربون' : 'Deposit'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Navigation Actions */}
            <View style={styles.navigationGrid}>
              <SecondaryButton
                label={isRTL ? 'إدارة حجوزاتك' : 'Manage Bookings'}
                onPress={() => router.push('/(tabs)/(dashboard)/bookings')}
                icon={<SolarCalendarBold size={22} color={Colors.primary} />}
                style={styles.navActionButton}
              />
              
              <SecondaryButton
                label={isRTL ? 'التقارير المالية' : 'Financial Reports'}
                onPress={() => router.push('/(tabs)/(dashboard)/revenue')}
                icon={<SolarChartBold size={22} color={Colors.primary} />}
                style={styles.navActionButton}
              />
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
        <SafeAreaView edges={['bottom']} style={[styles.footerContent, { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 20 }]}>
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.footerPriceLabel}>{isRTL ? 'السعر لليلة' : 'Price per night'}</Text>
            <Text style={styles.footerPriceValue}>
              {(chalet?.price || 0).toLocaleString()} 
              <Text style={styles.footerCurrency}> {isRTL ? 'د.ع' : 'IQD'}</Text>
            </Text>
          </View>
          <PrimaryButton 
            label={isRTL ? 'تعديل التفاصيل والسعر' : 'Edit Details & Price'}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={styles.footerButtonOverride}
          />
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
    zIndex: 50, // Below buttons
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBarButtonPlaceholder: {
    width: 42, // Match iconButton size
    height: 42,
  },
  navBarTitle: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: '65%',
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minHeight: SCREEN_HEIGHT - 100,
  },
  fixedHeaderActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Top-most
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
    paddingHorizontal: 14,
    paddingTop: 24,
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
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  managementSection: {
    marginBottom: 32,
  },
  fullWidthButton: {
    width: '100%',
  },
  navActionButton: {
    width: '100%',
    marginBottom: 10,
  },
  navigationGrid: {
    marginBottom: 32,
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
    borderColor: '#F0F0F0',
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
    borderColor: '#F0F0F0',
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
  footerButtonOverride: {
    flex: 1,
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

