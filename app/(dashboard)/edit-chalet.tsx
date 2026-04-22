import { ChaletProgressTabs } from '@/components/chalet-progress-tabs';
import {
  SolarCameraBold,
  SolarGalleryBold,
  SolarCloseCircleBold,
  SolarCameraAddBold,
  SolarMapPointBold,
  SolarStarBold,
  SolarAddCircleBold,
  SolarTrashBinBold,
  SolarPenBold,
} from '@/components/icons/solar-icons';
import { ThemedText } from '@/components/themed-text';
import { AppMap } from '@/components/user/app-map';
import { LocationPickerModal } from '@/components/user/location-picker-modal';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize, Spacing, Typography } from '@/constants/theme';
import { GuestCounter } from '@/components/user/guest-counter';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import {
  useDeleteChaletMutation,
  useGetAmenityCategoriesQuery,
  useGetChaletAmenitiesQuery,
  useGetCitiesQuery,
  useGetOwnerChaletDetailsQuery,
  useGetChaletShiftsQuery,
  useSetChaletAmenitiesMutation,
  useUpdateChaletMutation,
  useUploadChaletImageMutation
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';

// ── Types ──
interface ShiftPricing { dayOfWeek: number; price: number; }
interface ShiftData {
  id?: string;
  name: { ar: string; en: string };
  startTime: string;
  endTime: string;
  type: 'MORNING' | 'EVENING' | 'OVERNIGHT';
  isActive: boolean;
  pricing: ShiftPricing[];
}

const DAY_NAMES_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SHIFT_TYPES = [
  { value: 'MORNING' as const, labelAr: 'صباحي', labelEn: 'Morning', defaultStart: '08:00', defaultEnd: '14:00' },
  { value: 'EVENING' as const, labelAr: 'مسائي', labelEn: 'Evening', defaultStart: '14:00', defaultEnd: '20:00' },
  { value: 'OVERNIGHT' as const, labelAr: 'مبيت', labelEn: 'Overnight', defaultStart: '20:00', defaultEnd: '08:00' },
];

const createDefaultShift = (type: 'MORNING' | 'EVENING' | 'OVERNIGHT'): ShiftData => {
  const shiftType = SHIFT_TYPES.find(s => s.value === type)!;
  return {
    name: { ar: shiftType.labelAr, en: shiftType.labelEn },
    startTime: shiftType.defaultStart,
    endTime: shiftType.defaultEnd,
    type,
    isActive: true,
    pricing: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, price: i >= 5 ? 150000 : 100000 })),
  };
};

export default function EditChaletScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const { data: response, isLoading: isLoadingDetails } = useGetOwnerChaletDetailsQuery(id);
  const chalet = response?.data || response;

  const [updateChalet, { isLoading: isUpdating }] = useUpdateChaletMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadChaletImageMutation();
  const [setAmenities, { isLoading: isLinking }] = useSetChaletAmenitiesMutation();
  const [deleteChalet, { isLoading: isDeletingChalet }] = useDeleteChaletMutation();
  const isLoading = isUpdating || isUploading || isLoadingDetails || isLinking || isDeletingChalet;

  const [form, setForm] = useState({
    nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '',
    maxAdults: '4', maxChildren: '2', cityId: '', cityName: '',
    depositPercentage: '25', phone: '', whatsapp: '',
    policiesAr: '', policiesEn: '', latitude: '', longitude: '',
    basePrice: '', area: '', bedrooms: '', bathrooms: '',
  });

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 'details', title: isRTL ? 'التفاصيل' : 'Details' },
    { id: 'extra', title: isRTL ? 'تفاصيل اضافية' : 'More Info' },
    { id: 'amenities', title: isRTL ? 'المرافق' : 'Amenities' },
  ];

  const [showMap, setShowMap] = useState(false);
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const { data: cities } = useGetCitiesQuery();
  const { data: amenityCategories } = useGetAmenityCategoriesQuery();
  const { data: currentAmenities } = useGetChaletAmenitiesQuery(id as string);
  const { data: chaletShifts } = useGetChaletShiftsQuery(id as string);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const citySheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const shiftTypeSheetRef = useRef<BottomSheetModal>(null);
  const editShiftSheetRef = useRef<BottomSheetModal>(null);

  const [editingShiftIndex, setEditingShiftIndex] = useState<number | null>(null);

  const snapPoints = useMemo(() => ['65%', '90%'], []);
  const imageSnapPoints = useMemo(() => ['30%'], []);
  const shiftTypeSnapPoints = useMemo(() => ['35%'], []);
  const editShiftSnapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ), []
  );

  // ── Populate form ──
  useEffect(() => {
    if (chalet) {
      setForm({
        nameAr: chalet.name?.ar || chalet.name || '', nameEn: chalet.name?.en || '',
        descriptionAr: chalet.description?.ar || chalet.description || '', descriptionEn: chalet.description?.en || '',
        maxAdults: chalet.maxAdults?.toString() || chalet.maxGuests?.toString() || '4',
        maxChildren: chalet.maxChildren?.toString() || '0',
        cityId: chalet.cityId || chalet.region?.cityId || '',
        cityName: chalet.city?.name || chalet.region?.city?.name || '',
        depositPercentage: chalet.depositPercentage?.toString() || '25',
        phone: chalet.phone || '', whatsapp: chalet.whatsapp || '',
        policiesAr: chalet.policies?.ar || '', policiesEn: chalet.policies?.en || '',
        latitude: chalet.latitude?.toString() || '', longitude: chalet.longitude?.toString() || '',
        basePrice: chalet.basePrice?.toString() || '',
        area: chalet.area?.toString() || '',
        bedrooms: chalet.bedrooms?.toString() || '',
        bathrooms: chalet.bathrooms?.toString() || '',
        latitude: chalet.latitude?.toString() || '',
        longitude: chalet.longitude?.toString() || '',
      });
      setExistingImages(chalet.images || []);
    }
  }, [chalet]);

  useEffect(() => {
    if (chaletShifts && Array.isArray(chaletShifts)) {
      // Ensure we have exactly the 3 standard shifts by merging or filtering
      const standardTypes = ['MORNING', 'EVENING', 'OVERNIGHT'];
      const mapped: ShiftData[] = standardTypes.map(type => {
        const existing = (chaletShifts as any[]).find(s => s.type === type);
        if (existing) {
          return {
            id: existing.id,
            name: typeof existing.name === 'object' ? existing.name : { ar: existing.name || '', en: existing.name || '' },
            startTime: existing.startTime || (type === 'MORNING' ? '08:00' : type === 'EVENING' ? '15:00' : '22:00'),
            endTime: existing.endTime || (type === 'MORNING' ? '14:00' : type === 'EVENING' ? '21:00' : '07:00'),
            type: existing.type,
            isActive: existing.isActive !== false,
            pricing: existing.pricing?.length > 0
              ? existing.pricing.map((p: any) => ({ dayOfWeek: p.dayOfWeek, price: p.price }))
              : Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, price: 100000 })),
          };
        }
        return createDefaultShift(type as any); // Fallback for missing type
      });
      setShifts(mapped);
    } else if (chalet && shifts.length === 0) {
      setShifts(SHIFT_TYPES.map(s => createDefaultShift(s.value)));
    }
  }, [chaletShifts, chalet]);

  useEffect(() => {
    if (currentAmenities) {
      setSelectedFeatures(currentAmenities.map((a: any) => a.amenityId || a.amenity?.id));
    }
  }, [currentAmenities]);

  const toggleShiftActive = (index: number) => {
    setShifts(prev => prev.map((s, i) => i === index ? { ...s, isActive: !s.isActive } : s));
  };

  const openEditShift = (index: number) => {
    setEditingShiftIndex(index);
    editShiftSheetRef.current?.present();
  };

  const updateShiftField = (index: number, field: string, value: any) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== index) return shift;
      if (field === 'nameAr') return { ...shift, name: { ...shift.name, ar: value } };
      if (field === 'nameEn') return { ...shift, name: { ...shift.name, en: value } };
      return { ...shift, [field]: value };
    }));
  };

  const updateShiftPricing = (shiftIndex: number, dayOfWeek: number, price: string) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      return { ...shift, pricing: shift.pricing.map(p => p.dayOfWeek === dayOfWeek ? { ...p, price: parseInt(price) || 0 } : p) };
    }));
  };

  const setWeekdayPrice = (shiftIndex: number, price: string) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      return { ...shift, pricing: shift.pricing.map(p => p.dayOfWeek < 5 ? { ...p, price: parseInt(price) || 0 } : p) };
    }));
  };

  const setWeekendPrice = (shiftIndex: number, price: string) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      return { ...shift, pricing: shift.pricing.map(p => p.dayOfWeek >= 5 ? { ...p, price: parseInt(price) || 0 } : p) };
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'نحتاج صلاحية الوصول للأستوديو' : 'Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'نحتاج صلاحية الوصول للكاميرا' : 'Permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setSelectedImages([...selectedImages, result.assets[0].uri]);
  };

  const removeSelectedImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)); };

  const handleUpdate = async () => {
    if (!form.nameAr) { Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى ملء اسم الشاليه' : 'Please fill Chalet name', position: 'bottom' }); return; }
    if (!form.cityId) { Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' }); return; }

    try {
      const payload: any = {
        name: { ar: form.nameAr, en: form.nameEn || form.nameAr },
        description: { ar: form.descriptionAr, en: form.descriptionEn || form.descriptionAr },
        cityId: form.cityId,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        phone: form.phone || null, whatsapp: form.whatsapp || null,
        maxAdults: parseInt(form.maxAdults) || 1, maxChildren: parseInt(form.maxChildren) || 0,
        depositPercentage: parseFloat(form.depositPercentage) || 0,
        basePrice: parseFloat(form.basePrice) || 0,
        area: parseInt(form.area) || 0,
        bedrooms: parseInt(form.bedrooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
      };
      if (form.policiesAr) payload.policies = { ar: form.policiesAr, en: form.policiesEn || form.policiesAr };

      await updateChalet({ id, data: payload }).unwrap();

      if (selectedImages.length > 0) {
        for (const uri of selectedImages) {
          const imageFormData = new FormData();
          const filename = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          // @ts-ignore
          imageFormData.append('image', { uri, name: filename, type });
          await uploadImage({ chaletId: id, formData: imageFormData }).unwrap();
        }
      }

      await setAmenities({ chaletId: id, data: { amenityIds: selectedFeatures } }).unwrap();

      Toast.show({ type: 'success', text1: isRTL ? 'تم بنجاح' : 'Success', text2: isRTL ? 'تم تحديث البيانات بنجاح' : 'Listing updated successfully', position: 'bottom' });
      router.back();
    } catch (error: any) {
      console.error('Error updating chalet:', error);
      const errorMessage = error?.data?.message?.[0] || error?.data?.message || (isRTL ? 'فشل تحديث البيانات' : 'Failed to update');
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), position: 'bottom' });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      isRTL ? 'حذف الشاليه' : 'Delete Chalet',
      isRTL ? 'هل أنت متأكد من حذف هذا الشاليه نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to permanently delete this chalet? This action cannot be undone.',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isRTL ? 'حذف' : 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteChalet(id).unwrap(); router.replace('/(tabs)/(dashboard)/home'); }
          catch (err) { Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل حذف الشاليه' : 'Failed to delete chalet'); }
        }}
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({ /* @ts-ignore */ onDeletePress: handleDelete });
  }, [navigation, chalet]);

  const handleCitySelect = (city: any) => {
    setForm({ ...form, cityId: city.id, cityName: city.name });
    citySheetRef.current?.dismiss();
  };

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: return !!form.nameAr && !!form.cityId;
      case 1: return shifts.some(s => s.isActive);
      default: return true;
    }
  }, [currentStep, form, shifts]);

  const nextStep = () => { if (!isStepValid) return; if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // ── Shift Row (Matching Screenshot) ──
  const renderShiftRow = (shift: ShiftData, index: number) => {
    const isActive = shift.isActive;
    const weekdayPrice = shift.pricing.find(p => p.dayOfWeek === 0)?.price || 0;
    
    let icon = '☀️';
    if (shift.type === 'EVENING') icon = '🌙';
    if (shift.type === 'OVERNIGHT') icon = '🌙💤';

    const flexDirection = isRTL ? 'row-reverse' : 'row';

    return (
      <TouchableOpacity 
        key={index} 
        activeOpacity={0.8}
        onPress={() => toggleShiftActive(index)}
        style={[styles.shiftCardRow, isActive && styles.shiftCardRowActive]}
      >
        <View style={[styles.shiftRowInner, { flexDirection }]}>
          {/* Edit & Checkbox */}
          <View style={[styles.shiftActions, { flexDirection }]}>
            <TouchableOpacity 
              onPress={(e) => { 
                e.stopPropagation();
                openEditShift(index);
              }} 
              style={styles.shiftEditBtn}
            >
              <SolarPenBold size={18} color="#94A3B8" />
            </TouchableOpacity>
            
            <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
              {isActive && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
          </View>

          {/* Name & Price */}
          <View style={[styles.shiftInfo, { flexDirection }]}>
            <Text style={styles.shiftValueName}>
              {isRTL ? shift.name.ar : shift.name.en}
              {isActive && weekdayPrice > 0 && (
                <Text style={styles.shiftPriceText}> ({weekdayPrice.toLocaleString()})</Text>
              )}
            </Text>
            <Text style={styles.shiftIconLarge}>{icon}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoadingDetails) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ChaletProgressTabs steps={steps} currentStep={currentStep} onStepPress={(index) => { if (index <= currentStep) setCurrentStep(index); }} isRTL={isRTL} />

          {/* ═══════════ Step 0: التفاصيل ═══════════ */}
          {currentStep === 0 && (
            <>
              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (عربي)' : 'Chalet Name (AR)'}</Text>
                  <TextInput style={[styles.input, { textAlign }]} placeholder={isRTL ? "اسم الشاليه بالعربي" : "e.g. شاليه الورد"} placeholderTextColor="#BCBCBC" value={form.nameAr} onChangeText={(val) => setForm({ ...form, nameAr: val })} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (إنجليزي)' : 'Chalet Name (EN)'}</Text>
                  <TextInput style={[styles.input, { textAlign: 'left' }]} placeholder="e.g. Rose Chalet" placeholderTextColor="#BCBCBC" value={form.nameEn} onChangeText={(val) => setForm({ ...form, nameEn: val })} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وصف الشاليه' : 'Description'}</Text>
                  <TextInput style={[styles.input, styles.textArea, { textAlign }]} placeholder={isRTL ? "ادخل وصفاً للشاليه" : "Enter description..."} placeholderTextColor="#BCBCBC" multiline numberOfLines={4} value={form.descriptionAr} onChangeText={(val) => setForm({ ...form, descriptionAr: val })} />
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'المدينة' : 'City'}</Text>
                  <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => citySheetRef.current?.present()}>
                    <Text style={{ color: form.cityName ? Colors.text.primary : Colors.text.muted, textAlign }}>{form.cityName || (isRTL ? 'اختر المدينة' : 'Select City')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <TouchableOpacity style={styles.mapPreviewContainer} onPress={() => setShowMap(true)} activeOpacity={0.8}>
                    <AppMap style={styles.miniMap} centerCoordinate={form.latitude && form.longitude ? [parseFloat(form.longitude), parseFloat(form.latitude)] : undefined} zoomLevel={15} interactive={false} showMarker={true} />
                    <View style={styles.mapOverlay}>
                      <View style={styles.editLocBadge}>
                        <SolarMapPointBold size={16} color={Colors.white} />
                        <Text style={styles.editLocText}>{isRTL ? 'تعديل الموقع على الخارطة' : 'Edit on Map'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'السعر التجريبي / الأساسي (د.ع)' : 'Base Price (IQD)'}</Text>
                  <TextInput style={[styles.input, { textAlign: 'left' }]} placeholder="e.g. 150000" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.basePrice} onChangeText={(val) => setForm({ ...form, basePrice: val })} />
                </View>

                <View style={[styles.rowInputs, { flexDirection }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'center' }]} placeholder="300" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.area} onChangeText={(val) => setForm({ ...form, area: val })} />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'الغرف' : 'Bedrooms'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'center' }]} placeholder="2" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.bedrooms} onChangeText={(val) => setForm({ ...form, bedrooms: val })} />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'الحمامات' : 'Bathrooms'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'center' }]} placeholder="1" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.bathrooms} onChangeText={(val) => setForm({ ...form, bathrooms: val })} />
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'رقم الهاتف' : 'Phone'}</Text>
                  <TextInput style={[styles.input, { textAlign: 'left' }]} placeholder="+964..." placeholderTextColor="#BCBCBC" keyboardType="phone-pad" value={form.phone} onChangeText={(val) => setForm({ ...form, phone: val })} />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'نسبة العربون (%)' : 'Deposit %'}</Text>
                  <TextInput style={[styles.input, { textAlign: 'left' }]} placeholder="25" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.depositPercentage} onChangeText={(val) => setForm({ ...form, depositPercentage: val })} />
                </View>
              </View>
            </>
          )}

          {/* ═══════════ Step 1: تفاصيل اضافية ═══════════ */}
          {currentStep === 1 && (
            <>
              <View style={styles.sectionCard}>
                <View style={[styles.shiftsHeaderRow, { flexDirection }]}>
                  <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'الفترات' : 'Shifts'}</ThemedText>
                </View>

                <View style={styles.shiftListContainer}>
                  {shifts.map((shift, index) => renderShiftRow(shift, index))}
                </View>
              </View>

              {/* Max Adults / Children (Matching Screenshot) */}
              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={[styles.sectionHeader, { textAlign }]}>{isRTL ? 'السعة الأقصى للأشخاص' : 'Maximum Capacity'}</ThemedText>
                
                <View style={styles.capacityList}>
                  {/* Adults Card */}
                  <View style={[styles.capacityCard, { flexDirection }]}>
                    <GuestCounter 
                      value={parseInt(form.maxAdults) || 1} 
                      onIncrement={() => setForm({ ...form, maxAdults: (parseInt(form.maxAdults || '1') + 1).toString() })}
                      onDecrement={() => setForm({ ...form, maxAdults: Math.max(1, parseInt(form.maxAdults || '1') - 1).toString() })}
                    />
                    <View style={[styles.capacityInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={styles.capacityLabel}>{isRTL ? 'البالغين' : 'Adults'}</Text>
                      <Text style={styles.capacitySubLabel}>{isRTL ? '18 وأكبر' : '18 and above'}</Text>
                    </View>
                  </View>

                  {/* Children Card */}
                  <View style={[styles.capacityCard, { flexDirection }]}>
                    <GuestCounter 
                      value={parseInt(form.maxChildren) || 0} 
                      onIncrement={() => setForm({ ...form, maxChildren: (parseInt(form.maxChildren || '0') + 1).toString() })}
                      onDecrement={() => setForm({ ...form, maxChildren: Math.max(0, parseInt(form.maxChildren || '0') - 1).toString() })}
                    />
                    <View style={[styles.capacityInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={styles.capacityLabel}>{isRTL ? 'الاطفال' : 'Children'}</Text>
                      <Text style={styles.capacitySubLabel}>{isRTL ? '0 - 18' : '0 - 18 years'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'سعة الشاليه' : 'Capacity'}</ThemedText>
                <View style={[styles.rowInputs, { flexDirection }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'أقصى عدد بالغين' : 'Max Adults'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'left' }]} placeholder="8" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.maxAdults} onChangeText={(val) => setForm({ ...form, maxAdults: val })} />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'أقصى عدد أطفال' : 'Max Children'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'left' }]} placeholder="4" placeholderTextColor="#BCBCBC" keyboardType="numeric" value={form.maxChildren} onChangeText={(val) => setForm({ ...form, maxChildren: val })} />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ═══════════ Step 2: المرافق ═══════════ */}
          {currentStep === 2 && (
            <>
              {/* Amenity Categories with nested Features */}
              {amenityCategories?.map((category: any) => (
                <View key={category.id} style={styles.sectionCard}>
                  <Text style={[styles.categorySectionTitle, { textAlign }]}>
                    {isRTL ? category.name?.ar : category.name?.en}
                  </Text>
                  <View style={styles.featuresList}>
                    {category.features?.map((feature: any) => {
                      const isSelected = selectedFeatures.includes(feature.id);
                      return (
                        <TouchableOpacity
                          key={feature.id}
                          style={[styles.featureRow, isSelected && styles.featureRowActive]}
                          onPress={() => toggleFeature(feature.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.featureRowInner, { flexDirection }]}>
                            {/* Icon + Name */}
                            <View style={[styles.featureInfo, { flexDirection }]}>
                              <View style={styles.featureIconContainer}>
                                <Text style={styles.featureIconText}>
                                  {feature.icon === 'wifi' ? '📶' : 
                                   feature.icon === 'parking' ? '🚗' : 
                                   feature.icon === 'generator' ? '⚡' : 
                                   feature.icon === 'pool' ? '🏊' : 
                                   feature.icon === 'ac' ? '❄️' : 
                                   feature.icon === 'playstation' ? '🎮' : 
                                   feature.icon === 'billiards' ? '🎱' : 
                                   feature.icon === 'bbq' ? '🔥' : '✨'}
                                </Text>
                              </View>
                              <Text style={[styles.featureName, { textAlign }]}>
                                {isRTL ? feature.name?.ar : feature.name?.en}
                              </Text>
                            </View>
                            {/* Checkbox */}
                            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                              {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'صور الشاليه' : 'Chalet Photos'}</ThemedText>
                {existingImages.length > 0 && (
                  <View style={{ marginBottom: Spacing.md }}>
                    <Text style={[styles.label, { textAlign, marginBottom: 8 }]}>{isRTL ? 'الصور الحالية' : 'Current Photos'}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
                      {existingImages.map((img: any, index: number) => (
                        <View key={img.id || index} style={styles.imageItem}>
                          <Image source={{ uri: getImageSrc(img.url) }} style={styles.uploadedImage} />
                          {index === 0 && <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>{isRTL ? 'غلاف' : 'Cover'}</Text></View>}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                <Text style={[styles.label, { textAlign, marginBottom: 8 }]}>{isRTL ? 'إضافة صور جديدة' : 'Add New Photos'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri }} style={styles.uploadedImage} />
                      <TouchableOpacity style={styles.removeImageButton} onPress={() => removeSelectedImage(index)}>
                        <SolarCloseCircleBold size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.imageUpload} onPress={() => imageSourceSheetRef.current?.present()}>
                    <SolarCameraAddBold size={32} color={Colors.text.muted} />
                    <Text style={styles.uploadText}>{isRTL ? 'إضافة صور' : 'Add Photos'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { flexDirection }]}>
          {currentStep > 0 && <SecondaryButton label={isRTL ? 'السابق' : 'Back'} onPress={prevStep} style={{ flex: 1 }} />}
          {currentStep < steps.length - 1 ? (
            <PrimaryButton label={isRTL ? 'التالي' : 'Next'} onPress={nextStep} disabled={!isStepValid} activeColor={isStepValid ? Colors.primary : '#CBD5E1'} style={{ flex: 2 }} />
          ) : (
            <PrimaryButton label={isRTL ? 'تحديث البيانات' : 'Update Listing'} onPress={handleUpdate} loading={isUpdating || isUploading} disabled={!isStepValid} activeColor={isStepValid ? Colors.primary : '#CBD5E1'} style={{ flex: 2 }} />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Bottom Sheets ── */}
      <BottomSheetModal ref={citySheetRef} index={0} snapPoints={snapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          <BottomSheetFlatList data={cities} keyExtractor={(item: any) => item.id} style={{ width: '100%' }}
            ListHeaderComponent={<Text style={styles.modalTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</Text>}
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity style={styles.pickerItem} onPress={() => handleCitySelect(item)}>
                <Text style={[styles.pickerItemText, { textAlign }]}>{item.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
          />
        </BottomSheetView>
      </BottomSheetModal>



      <BottomSheetModal ref={imageSourceSheetRef} index={0} snapPoints={imageSnapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'اختر مصدر الصورة' : 'Select Image Source'}</Text>
          <View style={styles.modalOptions}>
            <TouchableOpacity style={styles.modalOption} onPress={() => { takePhoto(); imageSourceSheetRef.current?.dismiss(); }}>
              <View style={[styles.modalIcon, { backgroundColor: '#E3F2FD' }]}><SolarCameraBold size={30} color={Colors.primary} /></View>
              <Text style={styles.modalOptionText}>{isRTL ? 'الكاميرا' : 'Camera'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => { pickImage(); imageSourceSheetRef.current?.dismiss(); }}>
              <View style={[styles.modalIcon, { backgroundColor: '#F3E5F5' }]}><SolarGalleryBold size={30} color="#9C27B0" /></View>
              <Text style={styles.modalOptionText}>{isRTL ? 'الأستوديو' : 'Gallery'}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Edit Shift Modal */}
      <BottomSheetModal ref={editShiftSheetRef} index={0} snapPoints={editShiftSnapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          {editingShiftIndex !== null && (
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{isRTL ? 'تعديل الفترة' : 'Edit Shift'}</Text>
              
              <View style={styles.shiftModalCard}>
                <View style={[styles.shiftRow, { flexDirection }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشفت (عربي)' : 'Name (AR)'}</Text>
                    <TextInput style={[styles.input, { textAlign }]} value={shifts[editingShiftIndex].name.ar} onChangeText={(val) => updateShiftField(editingShiftIndex, 'nameAr', val)} />
                  </View>
                </View>

                <View style={[styles.shiftRow, { flexDirection }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وقت البداية' : 'Start'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'center' }]} value={shifts[editingShiftIndex].startTime} onChangeText={(val) => updateShiftField(editingShiftIndex, 'startTime', val)} keyboardType="numbers-and-punctuation" />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وقت النهاية' : 'End'}</Text>
                    <TextInput style={[styles.input, { textAlign: 'center' }]} value={shifts[editingShiftIndex].endTime} onChangeText={(val) => updateShiftField(editingShiftIndex, 'endTime', val)} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>

                <View style={styles.pricingSectionModal}>
                  <Text style={[styles.pricingTitle, { textAlign }]}>{isRTL ? 'الأسعار (د.ع)' : 'Pricing (IQD)'}</Text>
                  <View style={[styles.dayPricingGrid]}>
                    {shifts[editingShiftIndex].pricing.map((p) => (
                      <View key={p.dayOfWeek} style={styles.dayPriceItem}>
                        <Text style={styles.dayLabel}>{isRTL ? DAY_NAMES_AR[p.dayOfWeek] : DAY_NAMES_EN[p.dayOfWeek]}</Text>
                        <TextInput style={styles.dayPriceInput} value={p.price.toString()} onChangeText={(val) => updateShiftPricing(editingShiftIndex, p.dayOfWeek, val)} keyboardType="numeric" />
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <PrimaryButton label={isRTL ? 'تم' : 'Done'} onPress={() => editShiftSheetRef.current?.dismiss()} style={{ marginTop: 20 }} />
            </ScrollView>
          )}
        </BottomSheetView>
      </BottomSheetModal>
      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        initialLocation={{ 
          latitude: parseFloat(form.latitude) || 33.3152, 
          longitude: parseFloat(form.longitude) || 44.3661 
        }}
        onSelect={(lat, lng) => {
          setForm({ ...form, latitude: lat.toString(), longitude: lng.toString() });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: Spacing.xl },
  footer: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.md,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
  },
  sectionCard: { backgroundColor: 'transparent', padding: 0, gap: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { fontSize: normalize.font(16), fontFamily: "Tajawal-Black", color: Colors.text.primary, marginBottom: 2 },
  rowInputs: { gap: Spacing.sm },
  inputGroup: { gap: 6 },
  label: { ...Typography.caption, color: Colors.text.primary, fontFamily: "Tajawal-Black", fontSize: normalize.font(14) },
  smallLabel: { ...Typography.caption, color: Colors.text.muted, fontFamily: "Tajawal-SemiBold", fontSize: normalize.font(12) },
  input: {
    height: normalize.height(48), backgroundColor: '#FFFFFF', borderRadius: normalize.radius(12),
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: '#E8E8E8',
    fontSize: normalize.font(15), color: Colors.text.primary, fontFamily: "Tajawal-Regular",
  },
  textArea: { height: normalize.height(100), paddingTop: 18, textAlignVertical: 'top' },
  mapPreviewContainer: { height: normalize.height(140), borderRadius: normalize.radius(16), overflow: 'hidden', marginTop: 4 },
  miniMap: { flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  editLocBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  editLocText: { color: Colors.white, fontSize: normalize.font(12), fontFamily: "Tajawal-Bold" },
  // Shifts
  shiftsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addShiftBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addShiftText: { color: Colors.primary, fontSize: normalize.font(14), fontFamily: "Tajawal-Bold" },
  shiftHint: { fontSize: normalize.font(13), color: Colors.text.muted, fontFamily: "Tajawal-Regular", marginBottom: 4 },
  // Shift Card Row (Matches Screenshot)
  shiftListContainer: { gap: 12, marginBottom: 16 },
  shiftCardRow: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(16),
    borderWidth: 1.5, borderColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 14,
  },
  shiftCardRowActive: { borderColor: Colors.primary + '20' },
  shiftRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shiftEditBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  shiftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' },
  shiftIconLarge: { fontSize: 24 },
  shiftValueName: { fontSize: normalize.font(15), fontFamily: "Tajawal-Bold", color: Colors.text.primary },
  shiftPriceText: { color: Colors.text.primary, fontFamily: "Tajawal-Black" },
  addShiftBtnFull: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.primary + '40',
    borderRadius: 14, marginTop: 8,
  },
  addShiftBtnFullText: { color: Colors.primary, fontFamily: "Tajawal-Bold" },
  // Capacity (Matches Screenshot)
  capacityList: { gap: 12, marginTop: 8 },
  capacityCard: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(16),
    borderWidth: 1.5, borderColor: '#F1F5F9', padding: 16,
    justifyContent: 'space-between', alignItems: 'center',
  },
  capacityInfo: { flex: 1, gap: 2 },
  capacityLabel: { fontSize: normalize.font(18), fontFamily: "Tajawal-Bold", color: Colors.text.primary },
  capacitySubLabel: { fontSize: normalize.font(14), fontFamily: "Tajawal-Regular", color: Colors.text.muted },
  // Modal Edit
  shiftModalCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, gap: 16 },
  pricingSectionModal: { gap: 12 },
  pricingTitle: { fontSize: normalize.font(14), fontFamily: "Tajawal-Bold", color: Colors.text.primary },
  modalDeleteBtn: { paddingVertical: 16, alignItems: 'center' },
  modalDeleteText: { color: Colors.error, fontFamily: "Tajawal-Bold" },
  dayPricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dayPriceItem: { alignItems: 'center', gap: 4, width: '13%' },
  dayLabel: { fontSize: normalize.font(10), fontFamily: "Tajawal-Bold", color: Colors.text.muted },
  dayPriceInput: { width: '100%', height: 36, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', textAlign: 'center', fontSize: normalize.font(11), color: Colors.text.primary, fontFamily: "Tajawal-Medium", paddingHorizontal: 2 },
  shiftRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 14, marginBottom: 10 },
  shiftTypeDot: { width: 12, height: 12, borderRadius: 6 },
  // Amenity Categories & Feature Rows
  categorySectionTitle: {
    fontSize: normalize.font(16), fontFamily: "Tajawal-Black", color: Colors.text.primary,
    textAlign: 'center', marginBottom: 8,
  },
  featuresList: { gap: 8 },
  featureRow: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(14),
    borderWidth: 1.5, borderColor: '#E8E8E8', paddingHorizontal: 16, paddingVertical: 14,
  },
  featureRowActive: { borderColor: Colors.primary + '40', backgroundColor: '#F8FAFF' },
  featureRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  featureIconContainer: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FF5722', justifyContent: 'center', alignItems: 'center',
    // Adding a subtle "badge" feel like the screenshot
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconText: { fontSize: normalize.font(20), color: '#FFFFFF' },
  featureName: {
    fontSize: normalize.font(14), fontFamily: "Tajawal-Bold", color: Colors.text.primary,
    flex: 1,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxCheck: { color: '#FFFFFF', fontSize: normalize.font(14), fontFamily: "Tajawal-Bold" },
  uploadText: { marginTop: 4, color: Colors.text.muted, fontSize: normalize.font(12), fontFamily: "Tajawal-SemiBold" },
  imageContainer: { gap: Spacing.sm },
  imageItem: { width: normalize.width(100), height: normalize.width(100), borderRadius: normalize.radius(16), overflow: 'hidden', position: 'relative' },
  uploadedImage: { width: '100%', height: '100%' },
  removeImageButton: { position: 'absolute', top: normalize.height(6), right: normalize.width(6), backgroundColor: Colors.white, borderRadius: normalize.radius(12) },
  imageUpload: { width: normalize.width(100), height: normalize.width(100), backgroundColor: Colors.surface, borderRadius: normalize.radius(16), borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  coverBadgeText: { color: '#FFFFFF', fontSize: normalize.font(9), fontFamily: "Tajawal-Bold" },
  // Bottom sheets
  sheetContent: { padding: Spacing.lg, alignItems: 'center' },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  modalOptions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.lg },
  modalOption: { alignItems: 'center', gap: Spacing.sm },
  modalIcon: { width: normalize.width(70), height: normalize.width(70), borderRadius: normalize.radius(35), justifyContent: 'center', alignItems: 'center' },
  modalOptionText: { ...Typography.body, fontFamily: "Tajawal-SemiBold" },
  pickerItem: { width: '100%', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemText: { ...Typography.body, fontSize: normalize.font(16), color: Colors.text.primary },
  locationPickerBtn: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  locationBtnInner: {
    alignItems: "center",
  },
  locationBtnTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#111827",
  },
  locationBtnCoords: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Tajawal-Medium",
    marginTop: 4,
  },
});
