import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform, ActivityIndicator, Dimensions, Animated, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, normalize } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { getImageSrc } from '@/hooks/useImageSrc';
import {
  useDeleteChaletImageMutation,
  useDeleteChaletMutation,
  useGetAmenityCategoriesQuery,
  useGetChaletAmenitiesQuery,
  useGetCitiesQuery,
  useGetOwnerChaletDetailsQuery,
  useGetProviderChaletStatsQuery,
  useSetChaletAmenitiesMutation,
  useUpdateChaletImageMutation,
  useUpdateChaletMutation,
  useUploadChaletImageMutation,
} from '@/store/api/apiSlice';
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
  SolarCalendarBold,
  SolarCameraAddBold,
  SolarGalleryBold,
  SolarCloseCircleBold,
  SolarCheckCircleBold,
  SolarNotebookBold,
  SolarShieldWarningBold,
} from "@/components/icons/solar-icons";
import { CircleBackButton } from '@/components/ui/circle-back-button';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, BottomSheetScrollView, BottomSheetTextInput, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { GuestCounter } from '@/components/user/guest-counter';
import { isRTL } from "@/i18n";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 420;

export default function ChaletDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chaletId = Array.isArray(id) ? id[0] : id;
    
  const { data: response, isLoading, refetch } = useGetOwnerChaletDetailsQuery(chaletId as string, { skip: !chaletId });
  const { data: chaletStatsResponse, isLoading: isLoadingStats, refetch: refetchStats } = useGetProviderChaletStatsQuery(chaletId as string, { skip: !chaletId });
  const [deleteChalet] = useDeleteChaletMutation();
  const [updateChalet, { isLoading: isUpdating }] = useUpdateChaletMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadChaletImageMutation();
  const [updateImage] = useUpdateChaletImageMutation();
  const [deleteImage] = useDeleteChaletImageMutation();
  const [setAmenitiesMutation, { isLoading: isLinking }] = useSetChaletAmenitiesMutation();
  const { data: cities } = useGetCitiesQuery();
  const { data: amenityCategories } = useGetAmenityCategoriesQuery();
  const { data: currentAmenities } = useGetChaletAmenitiesQuery(chaletId as string, { skip: !chaletId });
  
  const chalet = response?.data || (response?.id ? response : null);
  const chaletStats = chaletStatsResponse?.data || chaletStatsResponse || {};
  const chaletSummary = chaletStats.summary || {};

  const [isActive, setIsActive] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Modal Refs
  const basicInfoModalRef = useRef<BottomSheetModal>(null);
  const depositModalRef = useRef<BottomSheetModal>(null);
  const capacityModalRef = useRef<BottomSheetModal>(null);
  const amenitiesModalRef = useRef<BottomSheetModal>(null);
  const imagesModalRef = useRef<BottomSheetModal>(null);
  const policiesModalRef = useRef<BottomSheetModal>(null);
  const citySheetRef = useRef<BottomSheetModal>(null);

  // Form States
  const [basicForm, setBasicForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    cityId: '',
    cityName: '',
    basePrice: '',
    depositPercentage: '25',
    maxAdults: '0',
    maxChildren: '0',
    baseCapacity: '0',
    extraPersonPrice: '0',
    latitude: '',
    longitude: '',
    addressAr: '',
    addressEn: '',
    phone: '',
    whatsapp: '',
    area: '',
    bedrooms: '',
    bathrooms: '' });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const [policiesForm, setPoliciesForm] = useState({
    policiesAr: '',
    policiesEn: '',
    termsAr: '',
    termsEn: '',
    cancellationAr: '',
    cancellationEn: '',
    checkInTime: '',
    checkOutTime: '' });

  useEffect(() => {
    if (chalet) {
      setIsActive(chalet.isActive);
      setBasicForm({
        nameAr: chalet.name?.ar || chalet.name || '',
        nameEn: chalet.name?.en || '',
        descriptionAr: chalet.description?.ar || chalet.description || '',
        descriptionEn: chalet.description?.en || '',
        maxAdults: chalet.maxAdults?.toString() || '0',
        maxChildren: chalet.maxChildren?.toString() || '0',
        baseCapacity: chalet.baseCapacity?.toString() || '0',
        extraPersonPrice: chalet.extraPersonPrice?.toString() || '0',
        cityId: chalet.cityId || '',
        cityName: isRTL ? chalet.city?.name?.ar : chalet.city?.name?.en || '',
        depositPercentage: chalet.depositPercentage?.toString() || '25',
        phone: chalet.phone || '',
        whatsapp: chalet.whatsapp || '',
        latitude: chalet.latitude?.toString() || '',
        longitude: chalet.longitude?.toString() || '',
        basePrice: chalet.basePrice?.toString() || '',
        addressAr: chalet.address?.ar || '',
        addressEn: chalet.address?.en || '',
        area: chalet.area?.toString() || '',
        bedrooms: chalet.bedrooms?.toString() || '',
        bathrooms: chalet.bathrooms?.toString() || '' });
      setPoliciesForm({
        policiesAr: chalet.policies?.ar || '',
        policiesEn: chalet.policies?.en || '',
        termsAr: chalet.terms?.ar || '',
        termsEn: chalet.terms?.en || '',
        cancellationAr: chalet.cancellationPolicy?.ar || '',
        cancellationEn: chalet.cancellationPolicy?.en || '',
        checkInTime: chalet.checkInTime || '',
        checkOutTime: chalet.checkOutTime || '' });
    }
  }, [chalet]);

  useEffect(() => {
    if (currentAmenities) {
      const amenities = Array.isArray(currentAmenities?.data) ? currentAmenities.data : currentAmenities;
      setSelectedFeatures((amenities || []).map((a: any) => a.featureId || a.amenityId || a.feature?.id || a.amenity?.id).filter(Boolean));
    }
  }, [currentAmenities]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ), []
  );

  const handleUpdateBasic = async () => {
    try {
      const payload: any = {
        name: { ar: basicForm.nameAr, en: basicForm.nameEn || basicForm.nameAr },
        description: { ar: basicForm.descriptionAr, en: basicForm.descriptionEn || basicForm.descriptionAr },
        address: { ar: basicForm.addressAr, en: basicForm.addressEn || basicForm.addressAr },
        phone: basicForm.phone,
        whatsapp: basicForm.whatsapp,
      };
      if (basicForm.cityId) payload.cityId = basicForm.cityId;
      if (basicForm.latitude) payload.latitude = parseFloat(basicForm.latitude);
      if (basicForm.longitude) payload.longitude = parseFloat(basicForm.longitude);
      await updateChalet({ id: chaletId as string, data: payload }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث التفاصيل' : 'Details updated' });
      basicInfoModalRef.current?.dismiss();
      refetch();
      refetchStats();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleUpdateDeposit = async () => {
    try {
      await updateChalet({
        id: chaletId as string,
        data: { depositPercentage: parseFloat(basicForm.depositPercentage) || 0 }
      }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث العربون' : 'Deposit updated' });
      depositModalRef.current?.dismiss();
      refetch();
      refetchStats();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleUpdateCapacity = async () => {
    try {
      const payload = {
        maxAdults: parseInt(basicForm.maxAdults) || 0,
        maxChildren: parseInt(basicForm.maxChildren) || 0,
        baseCapacity: parseInt(basicForm.baseCapacity) || 0,
        extraPersonPrice: parseFloat(basicForm.extraPersonPrice) || 0,
        basePrice: parseFloat(basicForm.basePrice) || 0,
      };
      await updateChalet({ id: chaletId as string, data: payload }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث السعة' : 'Capacity updated' });
      capacityModalRef.current?.dismiss();
      refetch();
      refetchStats();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const handleUpdateAmenities = async () => {
    try {
      await setAmenitiesMutation({ chaletId: chaletId as string, data: { featureIds: selectedFeatures } }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم الحفظ' : 'Saved' });
      amenitiesModalRef.current?.dismiss();
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error' });
    }
  };

  const handleUploadImages = async () => {
    try {
      for (const uri of selectedImages) {
        const imageFormData = new FormData();
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        // @ts-ignore
        imageFormData.append('image', { uri, name: filename, type });
        await uploadImage({ chaletId: chaletId as string, formData: imageFormData }).unwrap();
      }
      Toast.show({ type: 'success', text1: isRTL ? 'تم الرفع' : 'Uploaded' });
      setSelectedImages([]);
      imagesModalRef.current?.dismiss();
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error' });
    }
  };

  const handleDeleteChaletImage = async (imageId: string) => {
    Alert.alert(
      isRTL ? 'تنبيه' : 'Warning',
      isRTL ? 'هل أنت متأكد من حذف هذه الصورة؟' : 'Are you sure you want to delete this image?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRTL ? 'حذف' : 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImage({ chaletId: chaletId as string, imageId }).unwrap();
              Toast.show({ type: 'success', text1: isRTL ? 'تم الحذف' : 'Deleted' });
              refetch();
            } catch {
              Toast.show({ type: 'error', text1: isRTL ? 'فشل الحذف' : 'Delete failed' });
            }
          }
        }
      ]
    );
  };

  const handleSetAsCover = async (imageId: string) => {
    try {
      await updateImage({ 
        chaletId: chaletId as string,
        imageId,
        data: { isMain: true }
      }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم التحديث' : 'Updated' });
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'فشل التحديث' : 'Update failed' });
    }
  };

  const handleUpdatePolicies = async () => {
    try {
      const payload = {
        cancellationPolicy: { ar: policiesForm.cancellationAr, en: policiesForm.cancellationEn || policiesForm.cancellationAr },
        checkInTime: policiesForm.checkInTime,
        checkOutTime: policiesForm.checkOutTime };
      await updateChalet({ id: chaletId as string, data: payload }).unwrap();
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث السياسات' : 'Policies updated' });
      policiesModalRef.current?.dismiss();
      refetch();
    } catch {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setSelectedImages([...selectedImages, result.assets[0].uri]);
  };

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
              await deleteChalet(chaletId as string).unwrap();
              router.replace('/(tabs)/(dashboard)/home');
            } catch {
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

  const toggleStatus = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(value);
    try {
      await updateChalet({ id: chaletId as string, data: { isActive: value } }).unwrap();
      Toast.show({
        type: 'success',
        text1: value ? (isRTL ? 'الشاليه ظاهر للزبائن' : 'Chalet is visible') : (isRTL ? 'الشاليه مخفي حالياً' : 'Chalet is hidden'),
      });
      refetch();
    } catch {
      setIsActive(!value);
      Toast.show({ type: 'error', text1: isRTL ? 'تعذر تغيير الحالة' : 'Status update failed' });
    }
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
  const activeAmenities = chalet?.chaletFeatures || chalet?.chaletAmenities || [];
  const coverImage = chalet?.images?.find((img: any) => img.isMain || img.isCover);
  const totalBookings = chaletSummary.totalBookings ?? chalet?.bookingCount ?? 0;
  const totalEarnings = chaletSummary.totalProviderEarnings ?? chaletSummary.totalRevenue ?? chalet?.revenue ?? 0;
  const ratingValue = typeof chalet?.rating === 'string' ? parseFloat(chalet.rating) : (chalet?.rating || 0);

  const navBarOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 60],
    outputRange: [0, 1],
    extrapolate: 'clamp' });

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Persistent Nav Bar (Sticky title only) */}
      <Animated.View 
        style={[styles.navBar, { opacity: navBarOpacity }]}
        pointerEvents="box-none"
      >
        <SafeAreaView edges={['top']} style={[styles.navBarContent, { flexDirection: 'row' }]}>
          <View style={styles.navBarButtonPlaceholder} />
          <Text style={styles.navBarTitle} numberOfLines={1}>
            {chaletName}
          </Text>
          <View style={styles.navBarButtonPlaceholder} />
        </SafeAreaView>
      </Animated.View>

      {/* Persistent Header Actions (Always in the same place & design) */}
      <View style={styles.fixedHeaderActions} pointerEvents="box-none">
        <SafeAreaView edges={['top']} style={[styles.headerActions, { flexDirection: 'row' }]} pointerEvents="box-none">
          <CircleBackButton 
            onPress={() => router.back()} 
            style={{ width: 42, height: 42, borderRadius: 21 }} 
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]} 
              onPress={handleDelete}
            >
              <SolarTrashBinBold size={22} color="#EF4444" />
            </TouchableOpacity>
            {/* Main Edit Button opens Basic Info modal */}
            <TouchableOpacity style={styles.iconButton} onPress={() => basicInfoModalRef.current?.present()}>
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
        {/* Hero Background - Parallax Effect */}
        <Animated.View 
          style={[
            styles.imageContainer, 
            { 
              transform: [
                { 
                  translateY: scrollY.interpolate({
                    inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
                    outputRange: [HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.75] }) 
                },
                {
                  scale: scrollY.interpolate({
                    inputRange: [-HERO_HEIGHT, 0],
                    outputRange: [2, 1],
                    extrapolate: 'clamp' })
                }
              ] 
            }
          ]}
        >
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.round(x / SCREEN_WIDTH));
            }}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            disableIntervalMomentum={true}
          >
            {chalet.images && chalet.images.length > 0 ? (
              [coverImage, ...chalet.images.filter((img: any) => img.id !== coverImage?.id)].filter(Boolean).map((img: any, index: number) => (
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
          <View style={styles.imageOverlayDarken} pointerEvents="none" />
          
          {/* Pagination Dots */}
          {chalet.images && chalet.images.length > 1 && (
            <View style={[styles.pagination, { flexDirection: 'row' }]} pointerEvents="none">
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

          {/* Edit Images Overlay Button */}
          <TouchableOpacity 
            style={styles.editImagesOverlay} 
            onPress={() => imagesModalRef.current?.present()}
          >
            <SolarPenBold size={16} color={Colors.white} />
            <Text style={styles.editImagesText}>{isRTL ? 'تعديل الصور' : 'Edit Photos'}</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Spacer for the overlapping effect - Must be pointerEvents="none" to let touches through to images */}
        <View style={{ height: HERO_HEIGHT - 60 }} pointerEvents="none" />

        
        <View style={styles.contentCard}>
          <View style={styles.contentBody}>
            {/* Title & Status Block */}
            <View style={[styles.titleSection, { flexDirection: 'row' }]}>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <View style={[styles.titleRow, { flexDirection: 'row' }]}>
                  <Text style={styles.chaletName}>{chaletName || ''}</Text>
                  <View style={[styles.approvalBadge, { backgroundColor: chalet?.isApproved ? '#ECFDF5' : '#FFFBEB' }]}>
                    <Text style={[styles.approvalText, { color: chalet?.isApproved ? '#10B981' : '#F59E0B' }]}>
                      {chalet?.isApproved ? (isRTL ? 'مقبول' : 'Approved') : (isRTL ? 'قيد المراجعة' : 'Pending')}
                    </Text>
                  </View>
                </View>
                <View style={[styles.locationRow, { flexDirection: 'row' }]}>
                  <SolarMapPointBold size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.locationText}>{chaletLocation || ''}</Text>
                </View>
              </View>
              <View style={styles.statusBox}>
                <Switch 
                  value={isActive} 
                  onValueChange={toggleStatus} 
                  disabled={isUpdating}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }} 
                  thumbColor="#fff"
                />
                <Text style={[styles.statusLabel, { color: isActive ? Colors.primary : Colors.text.muted }]}>
                  {isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'مخفي' : 'Hidden')}
                </Text>
              </View>
            </View>

            {!chalet?.isApproved && (
              <View style={[styles.noticeBox, { flexDirection: 'row' }]}>
                <SolarShieldWarningBold size={20} color="#B45309" />
                <Text style={[styles.noticeText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'الشاليه بانتظار موافقة الإدارة. جهّز الصور والمعلومات حتى يظهر للزبائن بعد الموافقة.' : 'This chalet is waiting for admin approval. Complete photos and details so it is ready when approved.'}
                </Text>
              </View>
            )}

            <View style={[styles.quickActionsRow, { flexDirection: 'row' }]}>
              <TouchableOpacity style={styles.quickAction} onPress={() => basicInfoModalRef.current?.present()}>
                <SolarPenBold size={20} color={Colors.primary} />
                <Text style={styles.quickActionText}>{isRTL ? 'المعلومات' : 'Info'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => imagesModalRef.current?.present()}>
                <SolarGalleryBold size={20} color={Colors.primary} />
                <Text style={styles.quickActionText}>{isRTL ? 'الصور' : 'Photos'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/shifts', params: { id: chalet?.id } })}>
                <SolarClockCircleBold size={20} color={Colors.primary} />
                <Text style={styles.quickActionText}>{isRTL ? 'الفترات' : 'Shifts'}</Text>
              </TouchableOpacity>
            </View>

            {/* Performance Stats */}
            <View style={[styles.statsRow, { flexDirection: 'row' }]}>
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <SolarBanknoteBold size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{isLoadingStats ? '...' : Number(totalEarnings || 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'الأرباح' : 'Revenue'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <SolarCalendarBold size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{isLoadingStats ? '...' : totalBookings}</Text>
                <Text style={styles.statLabel}>{isRTL ? 'الحجوزات' : 'Bookings'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
                  <SolarStarBold size={20} color="#F97316" />
                </View>
                <Text style={styles.statValue}>{ratingValue.toFixed(1)}</Text>
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
            {activeAmenities.length > 0 && (
              <View style={styles.infoSection}>
                <View style={[styles.sectionHeaderRow, { flexDirection: 'row' }]}>
                  <Text style={styles.sectionTitle}>{isRTL ? 'المرافق المتاحة' : 'Amenities'}</Text>
                </View>
                <View style={[styles.amenitiesWrap, { flexDirection: 'row' }]}>
                  {activeAmenities.map((item: any) => {
                    const feature = item.feature || item.amenity || item;
                    return (
                    <View key={item.id} style={styles.amenityPill}>
                      <Text style={styles.amenityEmoji}>{feature.icon || '✨'}</Text>
                      <Text style={styles.amenityText}>{isRTL ? feature.name?.ar : feature.name?.en}</Text>
                    </View>
                  )})}
                </View>
              </View>
            )}

            {/* Essential Details Tags */}
            <View style={styles.infoSection}>
              <View style={[styles.sectionHeaderRow, { flexDirection: 'row' }]}>
                <Text style={styles.sectionTitle}>{isRTL ? 'معلومات أساسية' : 'Key Info'}</Text>
              </View>
              <View style={[styles.detailsRow, { flexDirection: 'row' }]}>
                <View style={styles.detailCard}>
                  <SolarUsersGroupBold size={20} color={Colors.primary} />
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={styles.detailValue}>{(chalet?.maxAdults || chalet?.maxGuests || 0) + (chalet?.maxChildren || 0)}</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'أقصى عدد' : 'Max Guests'}</Text>
                  </View>
                </View>
                <View style={styles.detailCard}>
                  <SolarBanknoteBold size={20} color={Colors.primary} />
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.depositPercentage}%</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'العربون' : 'Deposit'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Policies & Times Section */}
            <View style={styles.infoSection}>
              <View style={[styles.sectionHeaderRow, { flexDirection: 'row' }]}>
                <Text style={styles.sectionTitle}>{isRTL ? 'السياسات والأوقات' : 'Policies & Times'}</Text>
              </View>
              <View style={[styles.detailsRow, { flexDirection: 'row' }]}>
                <View style={styles.detailCard}>
                  <SolarClockCircleBold size={20} color={Colors.primary} />
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.checkInTime || '--:--'}</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'وقت الدخول' : 'Check-in'}</Text>
                  </View>
                </View>
                <View style={styles.detailCard}>
                  <SolarClockCircleBold size={20} color={Colors.primary} />
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={styles.detailValue}>{chalet?.checkOutTime || '--:--'}</Text>
                    <Text style={styles.detailLabel}>{isRTL ? 'وقت الخروج' : 'Check-out'}</Text>
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

            {/* Management Section */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
               <Text style={[styles.sectionTitle, { marginBottom: 16, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'إدارة الشاليه' : 'Chalet Management'}
              </Text>

              <View style={styles.managementList}>
                <SecondaryButton
                  label={isRTL ? 'التفاصيل الأساسية' : 'Basic Details'}
                  onPress={() => basicInfoModalRef.current?.present()}
                  icon={<SolarNotebookBold size={22} color={Colors.primary} />}
                  style={styles.managementBtn}
                />
                <SecondaryButton
                  label={isRTL ? 'نسبة العربون' : 'Deposit %'}
                  onPress={() => depositModalRef.current?.present()}
                  icon={<SolarBanknoteBold size={22} color={Colors.primary} />}
                  style={styles.managementBtn}
                />
                <SecondaryButton
                  label={isRTL ? 'السعة القصوى' : 'Max Capacity'}
                  onPress={() => capacityModalRef.current?.present()}
                  icon={<SolarUsersGroupBold size={22} color={Colors.primary} />}
                  style={styles.managementBtn}
                />
                <SecondaryButton
                  label={isRTL ? 'المرافق والخدمات' : 'Amenities'}
                  onPress={() => amenitiesModalRef.current?.present()}
                  icon={<SolarStarBold size={22} color={Colors.primary} />}
                  style={styles.managementBtn}
                />
                <SecondaryButton
                  label={isRTL ? 'السياسات والأوقات' : 'Policies & Times'}
                  onPress={() => policiesModalRef.current?.present()}
                  icon={<SolarShieldWarningBold size={22} color={Colors.primary} />}
                  style={styles.managementBtn}
                />
                <SecondaryButton
                  label={isRTL ? 'تعديل الصور' : 'Edit Photos'}
                  onPress={() => imagesModalRef.current?.present()}
                  icon={<SolarGalleryBold size={22} color={Colors.primary} />}
                  style={styles.managementBtn}
                />
              </View>
            </View>

            {/* About Section */}
            <View style={[styles.infoSection, { marginBottom: 120 }]}>
              <View style={[styles.sectionHeaderRow, { flexDirection: 'row' }]}>
                <Text style={styles.sectionTitle}>{isRTL ? 'عن المكان' : 'About the Space'}</Text>
              </View>
              <Text style={[styles.descriptionText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {chaletDescription || ''}
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.stickyFooter}>
        <SafeAreaView edges={['bottom']} style={[styles.footerContent, { flexDirection: 'row', gap: 20 }]}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={styles.footerPriceLabel}>{isRTL ? 'السعر لليلة' : 'Price per night'}</Text>
            <Text style={styles.footerPriceValue}>
              {(chalet?.basePrice || 0).toLocaleString()} 
              <Text style={styles.footerCurrency}> {isRTL ? 'د.ع' : 'IQD'}</Text>
            </Text>
          </View>
          <PrimaryButton 
            label={isRTL ? 'إدارة الأسعار' : 'Manage Pricing'}
            onPress={() => router.push({ pathname: '/(tabs)/(dashboard)/shifts', params: { id: chalet?.id } })}
            style={styles.footerButtonOverride}
          />
        </SafeAreaView>
      </View>

      {/* ─── Modals ─── */}

      {/* 1. Basic Info Modal */}
      <BottomSheetModal
        ref={basicInfoModalRef}
        index={0}
        snapPoints={['90%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'المعلومات الأساسية' : 'Basic Information'}</Text>
          
          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'اسم الشاليه (عربي)' : 'Name (AR)'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]} 
              value={basicForm.nameAr} 
              onChangeText={(val) => setBasicForm({ ...basicForm, nameAr: val })} 
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'اسم الشاليه (English)' : 'Name (EN)'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, { textAlign: 'left' }]} 
              value={basicForm.nameEn} 
              onChangeText={(val) => setBasicForm({ ...basicForm, nameEn: val })} 
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'وصف الشاليه (عربي)' : 'Description (AR)'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, styles.modalTextArea, { textAlign: isRTL ? 'right' : 'left' }]} 
              multiline 
              numberOfLines={4} 
              value={basicForm.descriptionAr} 
              onChangeText={(val) => setBasicForm({ ...basicForm, descriptionAr: val })} 
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'وصف الشاليه (English)' : 'Description (EN)'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, styles.modalTextArea, { textAlign: 'left' }]} 
              multiline 
              numberOfLines={4} 
              value={basicForm.descriptionEn} 
              onChangeText={(val) => setBasicForm({ ...basicForm, descriptionEn: val })} 
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'العنوان (عربي)' : 'Address (AR)'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]} 
              value={basicForm.addressAr} 
              onChangeText={(val) => setBasicForm({ ...basicForm, addressAr: val })} 
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'العنوان (English)' : 'Address (EN)'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, { textAlign: 'left' }]} 
              value={basicForm.addressEn} 
              onChangeText={(val) => setBasicForm({ ...basicForm, addressEn: val })} 
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.modalInputGroup, { flex: 1 }]}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'رقم الهاتف' : 'Phone'}</Text>
              <BottomSheetTextInput
                style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                keyboardType="phone-pad"
                value={basicForm.phone}
                onChangeText={(val) => setBasicForm({ ...basicForm, phone: val })}
              />
            </View>
            <View style={[styles.modalInputGroup, { flex: 1 }]}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'واتساب' : 'WhatsApp'}</Text>
              <BottomSheetTextInput
                style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
                keyboardType="phone-pad"
                value={basicForm.whatsapp}
                onChangeText={(val) => setBasicForm({ ...basicForm, whatsapp: val })}
              />
            </View>
          </View>
          
          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المدينة' : 'City'}</Text>
            <TouchableOpacity style={styles.modalInput} onPress={() => citySheetRef.current?.present()}>
              <Text style={{ color: basicForm.cityName ? Colors.text.primary : Colors.text.muted, textAlign: isRTL ? 'right' : 'left', marginTop: 14 }}>
                {basicForm.cityName || (isRTL ? 'اختر المدينة' : 'Select City')}
              </Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton label={isRTL ? 'حفظ المعلومات' : 'Save Info'} onPress={handleUpdateBasic} loading={isUpdating} style={{ marginTop: 20 }} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 2. Deposit Modal */}
      <BottomSheetModal
        ref={depositModalRef}
        index={0}
        snapPoints={['40%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetView style={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'نسبة العربون' : 'Deposit Percentage'}</Text>
          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'نسبة العربون %' : 'Deposit %'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, { textAlign: 'center' }]} 
              keyboardType="numeric" 
              value={basicForm.depositPercentage} 
              onChangeText={(val) => setBasicForm({ ...basicForm, depositPercentage: val })} 
            />
          </View>
          <PrimaryButton label={isRTL ? 'حفظ النسبة' : 'Save Percentage'} onPress={handleUpdateDeposit} loading={isUpdating} />
        </BottomSheetView>
      </BottomSheetModal>

      {/* 3. Capacity Modal */}
      <BottomSheetModal
        ref={capacityModalRef}
        index={0}
        snapPoints={['70%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'السعة والتسعير' : 'Capacity & Pricing'}</Text>
          
          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'السعة' : 'Capacity'}</Text>
            <View style={styles.capacityListInline}>
              <View style={[styles.capacityCardInline, { flexDirection: 'row' }]}>
                <GuestCounter value={parseInt(basicForm.maxAdults) || 0} onIncrement={() => setBasicForm({ ...basicForm, maxAdults: (parseInt(basicForm.maxAdults) + 1).toString() })} onDecrement={() => setBasicForm({ ...basicForm, maxAdults: Math.max(0, parseInt(basicForm.maxAdults) - 1).toString() })} />
                <Text style={styles.capacityLabelInline}>{isRTL ? 'بالغين' : 'Adults'}</Text>
              </View>
              <View style={[styles.capacityCardInline, { flexDirection: 'row' }]}>
                <GuestCounter value={parseInt(basicForm.maxChildren) || 0} onIncrement={() => setBasicForm({ ...basicForm, maxChildren: (parseInt(basicForm.maxChildren) + 1).toString() })} onDecrement={() => setBasicForm({ ...basicForm, maxChildren: Math.max(0, parseInt(basicForm.maxChildren) - 1).toString() })} />
                <Text style={styles.capacityLabelInline}>{isRTL ? 'أطفال' : 'Children'}</Text>
              </View>
              <View style={[styles.capacityCardInline, { flexDirection: 'row' }]}>
                <GuestCounter value={parseInt(basicForm.baseCapacity) || 0} onIncrement={() => setBasicForm({ ...basicForm, baseCapacity: (parseInt(basicForm.baseCapacity) + 1).toString() })} onDecrement={() => setBasicForm({ ...basicForm, baseCapacity: Math.max(0, parseInt(basicForm.baseCapacity) - 1).toString() })} />
                <Text style={styles.capacityLabelInline}>{isRTL ? 'السعة الأساسية' : 'Base Capacity'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'سعر الشخص الإضافي' : 'Extra Person Price'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]} 
              keyboardType="numeric" 
              value={basicForm.extraPersonPrice} 
              onChangeText={(val) => setBasicForm({ ...basicForm, extraPersonPrice: val })} 
            />
          </View>

          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'السعر الأساسي' : 'Base Price'}</Text>
            <BottomSheetTextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              keyboardType="numeric"
              value={basicForm.basePrice}
              onChangeText={(val) => setBasicForm({ ...basicForm, basePrice: val })}
            />
          </View>

          <PrimaryButton label={isRTL ? 'حفظ السعة' : 'Save Capacity'} onPress={handleUpdateCapacity} loading={isUpdating} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 2. Amenities Modal */}
      <BottomSheetModal
        ref={amenitiesModalRef}
        index={0}
        snapPoints={['80%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'المرافق والخدمات' : 'Amenities'}</Text>
          {amenityCategories?.map((category: any) => (
            <View key={category.id} style={{ marginBottom: 24 }}>
              <Text style={[styles.modalSubTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? category.name?.ar : category.name?.en}</Text>
              <View style={styles.amenitiesGrid}>
                {category.features?.map((feature: any) => {
                  const isSelected = selectedFeatures.includes(feature.id);
                  return (
                    <TouchableOpacity 
                      key={feature.id} 
                      style={[styles.amenityItem, isSelected && styles.amenityItemActive]} 
                      onPress={() => setSelectedFeatures(prev => prev.includes(feature.id) ? prev.filter(f => f !== feature.id) : [...prev, feature.id])}
                    >
                      <View style={styles.amenityIcon}>
                        {feature.icon && feature.icon !== 'wifi' && feature.icon !== 'default' ? (
                          <Image 
                            source={getImageSrc(feature.icon)} 
                            style={{ width: 22, height: 22 }} 
                            resizeMode="contain" 
                          />
                        ) : (
                          <Text style={{ fontSize: 20 }}>{feature.icon === 'wifi' ? '📶' : '✨'}</Text>
                        )}
                      </View>
                      <Text style={styles.amenityName} numberOfLines={1}>{isRTL ? feature.name?.ar : feature.name?.en}</Text>
                      {isSelected && <View style={styles.checkBadge}><Text style={{ color: '#fff', fontSize: 10 }}>✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <PrimaryButton label={isRTL ? 'حفظ المرافق' : 'Save Amenities'} onPress={handleUpdateAmenities} loading={isLinking} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 3. Images Modal */}
      <BottomSheetModal
        ref={imagesModalRef}
        index={0}
        snapPoints={['85%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'إدارة الصور' : 'Manage Images'}</Text>
          
          {/* Existing Images Section */}
          <Text style={[styles.modalSubTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'الصور الحالية' : 'Current Images'}
          </Text>
          <View style={styles.imagesUploadGrid}>
            {chalet?.images?.map((img: any) => (
              <View key={img.id} style={styles.uploadImageItem}>
                <Image source={{ uri: getImageSrc(img.url).uri }} style={styles.uploadImage} />
                
                {/* Delete Button */}
                <TouchableOpacity 
                  style={styles.removeUploadBtn} 
                  onPress={() => handleDeleteChaletImage(img.id)}
                >
                  <SolarTrashBinBold size={18} color={Colors.error} />
                </TouchableOpacity>

                {/* Cover Indicator/Toggle */}
                <TouchableOpacity 
                  style={[
                    styles.coverIndicator, 
                    (img.isMain || img.isCover) && { backgroundColor: Colors.primary }
                  ]}
                  onPress={() => !(img.isMain || img.isCover) && handleSetAsCover(img.id)}
                >
                  {(img.isMain || img.isCover) ? (
                    <SolarCheckCircleBold size={14} color="white" />
                  ) : (
                    <SolarStarBold size={14} color={Colors.text.muted} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { marginVertical: 24 }]} />

          {/* New Images Section */}
          <Text style={[styles.modalSubTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'إضافة صور جديدة' : 'Add New Photos'}
          </Text>
          <View style={styles.imagesUploadGrid}>
            {selectedImages.map((uri, idx) => (
              <View key={idx} style={styles.uploadImageItem}>
                <Image source={{ uri }} style={styles.uploadImage} />
                <TouchableOpacity style={styles.removeUploadBtn} onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}>
                  <SolarCloseCircleBold size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotosBtn} onPress={pickImage}>
              <SolarCameraAddBold size={30} color={Colors.text.muted} />
              <Text style={styles.addPhotosText}>{isRTL ? 'إضافة' : 'Add'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addPhotosBtn} onPress={takePhoto}>
              <SolarCameraAddBold size={30} color={Colors.text.muted} />
              <Text style={styles.addPhotosText}>{isRTL ? 'كاميرا' : 'Camera'}</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton 
            label={isRTL ? 'رفع الصور المختارة' : 'Upload Selected Photos'} 
            onPress={handleUploadImages} 
            loading={isUploading} 
            disabled={selectedImages.length === 0} 
            style={{ marginTop: 24 }}
          />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* 4. Policies Modal */}
      <BottomSheetModal
        ref={policiesModalRef}
        index={0}
        snapPoints={['85%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'السياسات والأوقات' : 'Policies & Times'}</Text>
          
          <View style={styles.modalInputGroup}>
            <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'سياسة الإلغاء' : 'Cancellation Policy'}</Text>
            <BottomSheetTextInput 
              style={[styles.modalInput, styles.modalTextArea, { textAlign: isRTL ? 'right' : 'left' }]} 
              multiline 
              value={policiesForm.cancellationAr} 
              onChangeText={(val) => setPoliciesForm({ ...policiesForm, cancellationAr: val })} 
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.modalInputGroup, { flex: 1 }]}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'وقت الدخول' : 'Check-in'}</Text>
              <BottomSheetTextInput 
                style={[styles.modalInput, { textAlign: 'center' }]} 
                placeholder="08:00 AM" 
                value={policiesForm.checkInTime} 
                onChangeText={(val) => setPoliciesForm({ ...policiesForm, checkInTime: val })} 
              />
            </View>
            <View style={[styles.modalInputGroup, { flex: 1 }]}>
              <Text style={[styles.modalLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'وقت الخروج' : 'Check-out'}</Text>
              <BottomSheetTextInput 
                style={[styles.modalInput, { textAlign: 'center' }]} 
                placeholder="10:00 PM" 
                value={policiesForm.checkOutTime} 
                onChangeText={(val) => setPoliciesForm({ ...policiesForm, checkOutTime: val })} 
              />
            </View>
          </View>

          <PrimaryButton label={isRTL ? 'حفظ السياسات' : 'Save Policies'} onPress={handleUpdatePolicies} loading={isUpdating} style={{ marginTop: 20 }} />
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* City Picker Modal */}
      <BottomSheetModal
        ref={citySheetRef}
        index={0}
        snapPoints={['70%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
      >
        <BottomSheetView style={{ padding: 20, flex: 1 }}>
          <Text style={styles.modalTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</Text>
          <BottomSheetFlatList 
            data={cities} 
            keyExtractor={(item: any) => item.id} 
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity 
                style={styles.cityPickerItem} 
                onPress={() => {
                  setBasicForm({ ...basicForm, cityId: item.id, cityName: item.name?.ar || item.name });
                  citySheetRef.current?.dismiss();
                }}
              >
                <Text style={[styles.cityPickerText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name?.ar || item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff' },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50, // Below buttons
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9' },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12 },
  navBarButtonPlaceholder: {
    width: 42, // Match iconButton size
    height: 42 },
  navBarTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    maxWidth: '65%',
    textAlign: 'center' },
  imageContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: '#111' },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT },
  imageOverlayDarken: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)' },
  scrollContent: {
    flexGrow: 1 },
  heroSpacer: {
    height: HERO_HEIGHT - 60 },
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minHeight: SCREEN_HEIGHT - 100 },
  contentBody: {
    paddingTop: 24,
    paddingBottom: 16 },
  titleSection: {
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16 },
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
    paddingTop: Platform.OS === 'android' ? 10 : 0 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)' },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 32 },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8 },
  chaletName: {
    fontSize: normalize.font(26),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
    letterSpacing: -0.5 },
  approvalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12 },
  approvalText: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Bold",
    textTransform: 'uppercase' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 },
  locationText: {
    fontSize: normalize.font(15),
    color: Colors.text.secondary,
    fontFamily: "Alexandria-Medium" },
  statusBox: {
    alignItems: 'center',
    gap: 4 },
  statusLabel: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Black",
    textTransform: 'uppercase' },
  noticeBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'flex-start',
    gap: 10 },
  noticeText: {
    flex: 1,
    fontSize: normalize.font(12),
    lineHeight: 20,
    color: '#92400E',
    fontFamily: "Alexandria-Medium" },
  quickActionsRow: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 18 },
  quickAction: {
    flex: 1,
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8 },
  quickActionText: {
    fontSize: normalize.font(12),
    color: Colors.text.primary,
    fontFamily: "Alexandria-Bold",
    textAlign: 'center' },
  statsRow: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0' },
  statItem: {
    alignItems: 'center',
    flex: 1 },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10 },
  statValue: {
    fontSize: normalize.font(17),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary },
  statLabel: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontFamily: "Alexandria-SemiBold",
    marginTop: 2 },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center' },
  managementSection: {
    marginBottom: 32 },
  fullWidthButton: {
    width: '100%' },
  navActionButton: {
    width: '100%',
    marginBottom: 10 },
  navigationGrid: {
    marginBottom: 32 },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 32 },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
    marginBottom: 16 },
  amenitiesWrap: {
    flexWrap: 'wrap',
    gap: 12 },
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
    minWidth: '47%' },
  amenityEmoji: {
    fontSize: 18,
   fontFamily: "Alexandria-Regular" },
  amenityText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: Colors.text.primary },
  detailsRow: {
    gap: 12 },
  detailCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0' },
  detailValue: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary },
  detailLabel: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontFamily: "Alexandria-SemiBold" },
  descriptionText: {
    fontSize: normalize.font(15),
    color: Colors.text.secondary,
    lineHeight: 24,
    opacity: 0.9,
   fontFamily: "Alexandria-Regular" },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between' },
  footerPriceLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontFamily: "Alexandria-SemiBold" },
  footerPriceValue: {
    fontSize: normalize.font(20),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary },
  footerCurrency: {
    fontSize: normalize.font(14),
    color: Colors.primary,
    fontFamily: "Alexandria-Bold" },
  footerButtonOverride: {
    flex: 1 },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9' },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    gap: 6 },
  dot: {
    height: 6,
    borderRadius: 3 },
  editImagesOverlay: {
    position: 'absolute',
    bottom: 20,
    end: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6 },
  editImagesText: {
    color: Colors.white,
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Bold" },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40 },
  modalTitle: {
    fontSize: normalize.font(20),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
    marginBottom: 24,
    textAlign: 'center' },
  modalSubTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    marginBottom: 12 },
  modalInputGroup: {
    marginBottom: 20 },
  modalLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.muted,
    marginBottom: 8 },
  modalInput: {
    height: 52,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary },
  modalTextArea: {
    minHeight: 100,
    paddingTop: 16,
    textAlignVertical: 'top' },
  capacityListInline: {
    gap: 10 },
  capacityCardInline: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0' },
  capacityLabelInline: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
    flex: 1,
    marginHorizontal: 10 },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10 },
  amenityItem: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative' },
  amenityItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05' },
  amenityIcon: {
    fontSize: 20,
    marginBottom: 4 },
  amenityName: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: 'center' },
  checkBadge: {
    position: 'absolute',
    top: -5,
    end: -5,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center' },
  imagesUploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10 },
  uploadImageItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative' },
  uploadImage: {
    width: '100%',
    height: '100%' },
  coverIndicator: {
    position: 'absolute',
    bottom: 5,
    start: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0' },
  removeUploadBtn: {
    position: 'absolute',
    top: 5,
    end: 5,
    backgroundColor: '#fff',
    borderRadius: 10 },
  addPhotosBtn: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC' },
  addPhotosText: {
    fontSize: 12,
    fontFamily: "Alexandria-Bold",
    color: Colors.text.muted,
    marginTop: 4 },
  cityPickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9' },
  cityPickerText: {
    fontSize: 16,
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary },
  managementList: {
    gap: 12 },
  managementBtn: {
    marginBottom: 0 } });
