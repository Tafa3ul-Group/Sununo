import { ChaletProgressTabs } from '@/components/chalet-progress-tabs';
import { ThemedText } from '@/components/themed-text';
import { AppMap } from '@/components/user/app-map';
import { LocationPickerModal } from '@/components/user/location-picker-modal';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize, Spacing, Typography } from '@/constants/theme';
import { GuestCounter } from '@/components/user/guest-counter';
import { RootState } from '@/store';
import {
  useCreateChaletMutation,
  useGetAmenityCategoriesQuery,
  useGetCitiesQuery,
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SolarMapPointBold, 
  SolarCloseCircleBold, 
  SolarGalleryBold, 
  SolarCameraBold,
  SolarAddCircleBold,
  SolarTrashBinBold,
  SolarPenBold,
} from "@/components/icons/solar-icons";
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
interface ShiftPricing {
  dayOfWeek: number;
  price: number;
}

interface ShiftData {
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
    pricing: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      price: i >= 5 ? 150000 : 100000,
    })),
  };
};

export default function AddChaletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const [createChalet, { isLoading: isCreating }] = useCreateChaletMutation();
  const isLoading = isCreating;

  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    maxAdults: '4',
    maxChildren: '2',
    cityId: '',
    cityName: '',
    depositPercentage: '25',
    phone: '',
    whatsapp: '',
    policiesAr: '',
    policiesEn: '',
    latitude: '',
    longitude: '',
    basePrice: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 'details', title: isRTL ? 'التفاصيل' : 'Details' },
    { id: 'extra', title: isRTL ? 'تفاصيل اضافية' : 'More Info' },
    { id: 'amenities', title: isRTL ? 'المرافق' : 'Amenities' },
  ];

  const [showMap, setShowMap] = useState(false);
  
  // Pre-fixed 3 shifts
  const [shifts, setShifts] = useState<ShiftData[]>([
    createDefaultShift('MORNING'),
    createDefaultShift('EVENING'),
    createDefaultShift('OVERNIGHT'),
  ]);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { data: cities, isLoading: loadingCities } = useGetCitiesQuery();
  const { data: amenityCategories } = useGetAmenityCategoriesQuery();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Bottom Sheet Refs
  const citySheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const editShiftSheetRef = useRef<BottomSheetModal>(null);

  const [editingShiftIndex, setEditingShiftIndex] = useState<number | null>(null);

  // Snap Points
  const snapPoints = useMemo(() => ['65%', '90%'], []);
  const imageSnapPoints = useMemo(() => ['30%'], []);
  const editShiftSnapPoints = useMemo(() => ['85%'], []);

  // Backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // ── Shift Management ──
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
      const newPricing = shift.pricing.map(p =>
        p.dayOfWeek === dayOfWeek ? { ...p, price: parseInt(price) || 0 } : p
      );
      return { ...shift, pricing: newPricing };
    }));
  };

  const setWeekdayPrice = (shiftIndex: number, price: string) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      const newPricing = shift.pricing.map(p =>
        p.dayOfWeek < 5 ? { ...p, price: parseInt(price) || 0 } : p
      );
      return { ...shift, pricing: newPricing };
    }));
  };

  const setWeekendPrice = (shiftIndex: number, price: string) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      const newPricing = shift.pricing.map(p =>
        p.dayOfWeek >= 5 ? { ...p, price: parseInt(price) || 0 } : p
      );
      return { ...shift, pricing: newPricing };
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'نحتاج صلاحية الوصول للأستوديو' : 'Permission needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(isRTL ? 'تنبيه' : 'Alert', isRTL ? 'نحتاج صلاحية الوصول للكاميرا' : 'Permission needed');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.nameAr) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى ملء اسم الشاليه' : 'Please fill chalet name', position: 'bottom' });
      return;
    }
    if (!form.cityId) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
      return;
    }
    if (shifts.length === 0) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يجب إضافة شفت واحد على الأقل' : 'At least one shift is required', position: 'bottom' });
      return;
    }

    try {
      const formData = new FormData();

      // ── Required fields ──
      formData.append('name', JSON.stringify({ ar: form.nameAr, en: form.nameEn || form.nameAr }));
      formData.append('cityId', form.cityId);
      formData.append('latitude', form.latitude || '33.3152');
      formData.append('longitude', form.longitude || '44.3661');
      formData.append('maxAdults', form.maxAdults || '1');
      formData.append('maxChildren', form.maxChildren || '0');
      
      // Filter only active shifts for submission
      const activeShifts = shifts.filter(s => s.isActive);
      formData.append('shifts', JSON.stringify(activeShifts));

      // ── Optional fields ──
      if (form.descriptionAr) {
        formData.append('description', JSON.stringify({ ar: form.descriptionAr, en: form.descriptionEn || form.descriptionAr }));
      }
      if (form.policiesAr) {
        formData.append('policies', JSON.stringify({ ar: form.policiesAr, en: form.policiesEn || form.policiesAr }));
      }
      if (form.phone) formData.append('phone', form.phone);
      if (form.whatsapp) formData.append('whatsapp', form.whatsapp);
      if (form.depositPercentage) formData.append('depositPercentage', form.depositPercentage);
      if (form.basePrice) formData.append('basePrice', form.basePrice);
      if (form.area) formData.append('area', form.area);
      if (form.bedrooms) formData.append('bedrooms', form.bedrooms);
      if (form.bathrooms) formData.append('bathrooms', form.bathrooms);

      // ── Features ──
      if (selectedFeatures.length > 0) {
        formData.append('featureIds', JSON.stringify(selectedFeatures));
      }

      // ── Images ──
      if (selectedImages.length > 0) {
        for (const uri of selectedImages) {
          const filename = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          // @ts-ignore
          formData.append('images', { uri, name: filename, type });
          formData.append('imageCategoryIds', '');
        }
      }

      await createChalet(formData).unwrap();

      Toast.show({ type: 'success', text1: isRTL ? 'تم بنجاح' : 'Success', text2: isRTL ? 'تمت إضافة الشاليه بنجاح' : 'Chalet added successfully', position: 'bottom' });
      router.back();
    } catch (error: any) {
      console.error('Error creating chalet:', error);
      const errorMessage = error?.data?.message?.[0] || error?.data?.message || (isRTL ? 'فشل إرسال البيانات، حاول لاحقاً' : 'Failed to save data, try again');
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), position: 'bottom' });
    }
  };

  const handleCitySelect = (city: any) => {
    setForm({ ...form, cityId: city.id, cityName: city.name });
    citySheetRef.current?.dismiss();
  };

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0:
        return !!form.nameAr && !!form.cityId;
      case 1:
        // Must have at least one active shift
        return shifts.some(s => s.isActive);
      case 2:
        return true;
      default:
        return true;
    }
  }, [currentStep, form, shifts]);

  const nextStep = () => {
    if (!isStepValid) return;
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  // ── Shift Row (Matching Screenshot) ──
  const renderShiftRow = (shift: ShiftData, index: number) => {
    const isActive = shift.isActive;
    const weekdayPrice = shift.pricing.find(p => p.dayOfWeek === 0)?.price || 0;
    
    let icon = '☀️';
    if (shift.type === 'EVENING') icon = '🌙';
    if (shift.type === 'OVERNIGHT') icon = '🌙💤';

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ChaletProgressTabs
            steps={steps}
            currentStep={currentStep}
            onStepPress={(index) => { if (index <= currentStep) setCurrentStep(index); }}
            isRTL={isRTL}
          />

          {/* ═══════════ Step 0: التفاصيل ═══════════ */}
          {currentStep === 0 && (
            <>
              <View style={styles.sectionCard}>
                {/* اسم الشاليه عربي */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (عربي)' : 'Chalet Name (AR)'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={isRTL ? "اسم الشاليه بالعربي" : "e.g. شاليه الورد"}
                    placeholderTextColor="#BCBCBC"
                    value={form.nameAr}
                    onChangeText={(val) => setForm({ ...form, nameAr: val })}
                  />
                </View>

                {/* اسم الشاليه إنجليزي */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (إنجليزي)' : 'Chalet Name (EN)'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    placeholder="e.g. Rose Chalet"
                    placeholderTextColor="#BCBCBC"
                    value={form.nameEn}
                    onChangeText={(val) => setForm({ ...form, nameEn: val })}
                  />
                </View>

                {/* وصف الشاليه */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وصف الشاليه' : 'Description'}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { textAlign }]}
                    placeholder={isRTL ? "ادخل وصفاً للشاليه" : "Enter description..."}
                    placeholderTextColor="#BCBCBC"
                    multiline
                    numberOfLines={4}
                    value={form.descriptionAr}
                    onChangeText={(val) => setForm({ ...form, descriptionAr: val })}
                  />
                </View>
              </View>

              <View style={styles.sectionCard}>
                {/* المدينة */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'المدينة' : 'City'}</Text>
                  <TouchableOpacity
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => citySheetRef.current?.present()}
                  >
                    <Text style={{ color: form.cityName ? Colors.text.primary : '#BCBCBC', textAlign }}>
                      {form.cityName || (isRTL ? 'اختر المدينة' : 'Select City')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* الموقع */}
                <View style={styles.inputGroup}>
                  <TouchableOpacity
                    style={styles.mapPreviewContainer}
                    onPress={() => setShowMap(true)}
                    activeOpacity={0.8}
                  >
                    <AppMap
                      style={styles.miniMap}
                      centerCoordinate={form.latitude && form.longitude ? [parseFloat(form.longitude), parseFloat(form.latitude)] : undefined}
                      zoomLevel={15}
                      interactive={false}
                      showMarker={true}
                    />
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
                {/* السعر الأساسي */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'السعر التجريبي / الأساسي (د.ع)' : 'Base Price (IQD)'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    placeholder="e.g. 150000"
                    placeholderTextColor="#BCBCBC"
                    keyboardType="numeric"
                    value={form.basePrice}
                    onChangeText={(val) => setForm({ ...form, basePrice: val })}
                  />
                </View>

                {/* المواصفات الأساسية */}
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
                {/* رقم الهاتف */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'رقم الهاتف' : 'Phone'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    placeholder="+964..."
                    placeholderTextColor="#BCBCBC"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(val) => setForm({ ...form, phone: val })}
                  />
                </View>

                {/* نسبة العربون */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'نسبة العربون (%)' : 'Deposit %'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'left' }]}
                    placeholder="25"
                    placeholderTextColor="#BCBCBC"
                    keyboardType="numeric"
                    value={form.depositPercentage}
                    onChangeText={(val) => setForm({ ...form, depositPercentage: val })}
                  />
                </View>
              </View>
            </>
          )}

          {/* ═══════════ Step 1: تفاصيل اضافية ═══════════ */}
          {currentStep === 1 && (
            <>
              {/* Shifts Section */}
              <View style={styles.sectionCard}>
                <View style={[styles.shiftsHeaderRow, { flexDirection }]}>
                  <ThemedText type="h2" style={styles.sectionHeader}>
                    {isRTL ? 'الفترات' : 'Shifts'}
                  </ThemedText>
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

              {/* Photos */}
              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'صور الشاليه' : 'Chalet Photos'}</ThemedText>
                <Text style={[styles.photoHint, { textAlign }]}>
                  {isRTL ? 'أول صورة ستكون صورة الغلاف تلقائياً' : 'First photo will be the cover image'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.imageContainer, { flexDirection }]}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri }} style={styles.uploadedImage} />
                      {index === 0 && (
                        <View style={styles.coverBadge}>
                          <Text style={styles.coverBadgeText}>{isRTL ? 'غلاف' : 'Cover'}</Text>
                        </View>
                      )}
                      <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                        <SolarCloseCircleBold size={24} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.imageUpload} onPress={() => imageSourceSheetRef.current?.present()}>
                    <SolarGalleryBold size={32} color={Colors.text.muted} />
                    <Text style={styles.uploadText}>{isRTL ? 'إضافة صور' : 'Add Photos'}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { flexDirection }]}>
          {currentStep > 0 && (
            <SecondaryButton label={isRTL ? 'السابق' : 'Back'} onPress={prevStep} style={{ flex: 1 }} />
          )}
          {currentStep < steps.length - 1 ? (
            <PrimaryButton
              label={isRTL ? 'التالي' : 'Next'}
              onPress={nextStep}
              disabled={!isStepValid}
              activeColor={isStepValid ? Colors.primary : '#CBD5E1'}
              style={{ flex: 2 }}
            />
          ) : (
            <PrimaryButton
              label={isRTL ? 'حفظ ونشر الشاليه' : 'Save & Publish'}
              onPress={handleSave}
              loading={isLoading}
              disabled={!isStepValid}
              activeColor={isStepValid ? Colors.primary : '#CBD5E1'}
              style={{ flex: 2 }}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Bottom Sheets ── */}

      {/* City Picker */}
      <BottomSheetModal ref={citySheetRef} index={0} snapPoints={snapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          {loadingCities ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : (
            <BottomSheetFlatList
              data={cities}
              keyExtractor={(item: any) => item.id}
              style={{ width: '100%' }}
              ListHeaderComponent={<Text style={styles.modalTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</Text>}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => handleCitySelect(item)}>
                  <Text style={[styles.pickerItemText, { textAlign }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Image Source Picker */}
      <BottomSheetModal ref={imageSourceSheetRef} index={0} snapPoints={imageSnapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'اختر مصدر الصورة' : 'Select Image Source'}</Text>
          <View style={styles.modalOptions}>
            <TouchableOpacity style={styles.modalOption} onPress={() => { takePhoto(); imageSourceSheetRef.current?.dismiss(); }}>
              <View style={[styles.modalIcon, { backgroundColor: '#E3F2FD' }]}>
                <SolarCameraBold size={30} color={Colors.primary} />
              </View>
              <Text style={styles.modalOptionText}>{isRTL ? 'الكاميرا' : 'Camera'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => { pickImage(); imageSourceSheetRef.current?.dismiss(); }}>
              <View style={[styles.modalIcon, { backgroundColor: '#F3E5F5' }]}>
                <SolarGalleryBold size={30} color="#9C27B0" />
              </View>
              <Text style={styles.modalOptionText}>{isRTL ? 'الأستوديو' : 'Gallery'}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <LocationPickerModal
        visible={showMap}
        onClose={() => setShowMap(false)}
        onSelect={(lat, lng) => setForm({ ...form, latitude: lat.toString(), longitude: lng.toString() })}
        initialLocation={form.latitude && form.longitude ? { latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) } : undefined}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  // Map
  mapPreviewContainer: {
    height: normalize.height(160), width: '100%', borderRadius: normalize.radius(12),
    overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative',
  },
  miniMap: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: Spacing.sm, left: 0, right: 0, alignItems: 'center' },
  editLocBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(3, 93, 249, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100,
  },
  editLocText: { color: Colors.white, fontSize: normalize.font(12), fontFamily: "Tajawal-Bold" },
  // Shifts
  shiftsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftHint: { fontSize: normalize.font(13), color: Colors.text.muted, fontFamily: "Tajawal-Regular", marginBottom: 4 },
  pricingTitle: { fontSize: normalize.font(14), fontFamily: "Tajawal-Bold", color: Colors.text.primary },
  dayPricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dayPriceItem: { alignItems: 'center', gap: 4, width: '13%' },
  dayLabel: { fontSize: normalize.font(10), fontFamily: "Tajawal-Black", color: Colors.text.muted },
  dayPriceInput: {
    width: '100%', height: 36, backgroundColor: '#F8FAFC', borderRadius: 8,
    borderWidth: 1, borderColor: '#E2E8F0', textAlign: 'center',
    fontSize: normalize.font(11), color: Colors.text.primary, fontFamily: "Tajawal-Medium", paddingHorizontal: 2,
  },
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
  modalDeleteBtn: { paddingVertical: 16, alignItems: 'center' },
  modalDeleteText: { color: Colors.error, fontFamily: "Tajawal-Bold" },
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
  uploadText: { marginTop: normalize.height(4), color: Colors.text.muted, fontSize: normalize.font(12), fontFamily: "Tajawal-SemiBold" },
  photoHint: { fontSize: normalize.font(12), color: Colors.text.muted, fontFamily: "Tajawal-Regular", marginBottom: 4 },
  imageContainer: { gap: Spacing.sm },
  imageItem: { width: normalize.width(100), height: normalize.width(100), borderRadius: normalize.radius(16), overflow: 'hidden', position: 'relative' },
  uploadedImage: { width: '100%', height: '100%' },
  removeImageButton: { position: 'absolute', top: normalize.height(6), right: normalize.width(6), backgroundColor: Colors.white, borderRadius: normalize.radius(12) },
  imageUpload: {
    width: normalize.width(100), height: normalize.width(100), backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16), borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  coverBadgeText: { color: '#FFFFFF', fontSize: normalize.font(9), fontFamily: "Tajawal-Bold" },
  // Bottom sheets
  sheetContent: { padding: Spacing.lg, alignItems: 'center', flex: 1 },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  modalOptions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.lg },
  modalOption: { alignItems: 'center', gap: Spacing.sm },
  modalIcon: { width: normalize.width(70), height: normalize.width(70), borderRadius: normalize.radius(35), justifyContent: 'center', alignItems: 'center' },
  modalOptionText: { ...Typography.body, fontFamily: "Tajawal-SemiBold" },
  pickerItem: { width: '100%', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemText: { ...Typography.body, fontSize: normalize.font(16), color: Colors.text.primary },
});
