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
  useGetShiftDefaultsQuery } from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SolarMapPointBold, 
  SolarCloseCircleBold, 
  SolarGalleryBold, 
  SolarCameraBold,
  SolarAddCircleBold,
  SolarTrashBinBold,
  SolarPenBold,
  SolarClockCircleBold,
  SolarAltArrowLeftBold,
  SolarInfoCircleBold,
  SolarMagnifierBold } from "@/components/icons/solar-icons";
import {
  ActivityIndicator,
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
import { isRTL } from "@/i18n";

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

const createDefaultPricing = () => Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  price: i >= 5 ? 150000 : 100000 }));

export default function AddChaletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);

  
  const [createChalet, { isLoading: isCreating }] = useCreateChaletMutation();
  const isLoading = isCreating;

  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    cityId: '',
    cityName: '',
    depositPercentage: '25',
    phone: '',
    whatsapp: '',
    policiesAr: '',
    policiesEn: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    latitude: '33.3152',
    longitude: '44.3661',
    capacity: '4',
    priceCapacity: '4',
    extraPersonPrice: '10000' });

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const { data: amenityCategories } = useGetAmenityCategoriesQuery();

  const steps = useMemo(() => [
    { id: 'name', title: isRTL ? 'الاسماء' : 'Names', icon: '🏠' },
    { id: 'location', title: isRTL ? 'الموقع' : 'Location', icon: '📍' },
    { id: 'shifts', title: isRTL ? 'الفترات' : 'Shifts', icon: '⏰' },
    { id: 'capacity', title: isRTL ? 'السعة' : 'Capacity', icon: '👥' },
    { id: 'amenities', title: isRTL ? 'المرافق' : 'Amenities', icon: '✨' },
  ], [isRTL]);

  const [currentStep, setCurrentStep] = useState(0);
  const [currentAmenitySubStep, setCurrentAmenitySubStep] = useState(0);

  const [showMap, setShowMap] = useState(false);
  
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const { data: defaultShifts } = useGetShiftDefaultsQuery();

  useEffect(() => {
    if (defaultShifts && shifts.length === 0) {
      setShifts(defaultShifts.map(s => ({
        ...s,
        pricing: createDefaultPricing()
      })));
    }
  }, [defaultShifts]);

  const [imagesByCategory, setImagesByCategory] = useState<Record<string, string[]>>({});
  const { data: cities, isLoading: loadingCities } = useGetCitiesQuery();
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = useMemo(() => {
    if (!cities) return [];
    if (!citySearch) return cities;
    return cities.filter((city: any) => 
      city.name?.toLowerCase().includes(citySearch.toLowerCase()) ||
      (city.nameAr && city.nameAr.includes(citySearch)) ||
      (city.nameEn && city.nameEn.toLowerCase().includes(citySearch.toLowerCase()))
    );
  }, [cities, citySearch]);

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null);

  // Bottom Sheet Refs
  const citySheetRef = useRef<BottomSheetModal>(null);
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const editShiftSheetRef = useRef<BottomSheetModal>(null);

  const [editingShiftIndex, setEditingShiftIndex] = useState<number | null>(null);

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? (isRTL ? 'مساءً' : 'PM') : (isRTL ? 'صباحاً' : 'AM');
    const hours12 = h % 12 || 12;
    return `${hours12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const setUniformPrice = (shiftIndex: number, priceStr: string) => {
    const price = parseInt(priceStr) || 0;
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      const newPricing = shift.pricing.map(p => ({ ...p, price }));
      return { ...shift, pricing: newPricing };
    }));
  };

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

  const shiftTimeHelper = (timeStr: string, minutesToShift: number): string => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return timeStr;
    let totalMinutes = h * 60 + m + minutesToShift;
    totalMinutes = (totalMinutes % 1440 + 1440) % 1440;
    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const adjustShiftTime = (shiftIndex: number, field: 'startTime' | 'endTime', amount: number) => {
    setShifts(prev => prev.map((shift, i) => {
      if (i !== shiftIndex) return shift;
      const newTime = shiftTimeHelper(shift[field], amount);
      return { ...shift, [field]: newTime };
    }));
  };

  // ── Overlap Detection ──
  const getShiftIntervals = (startTime: string, endTime: string): { start: number; end: number }[] => {
    if (!startTime || !endTime) return [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const s = (isNaN(sh) ? 0 : sh) * 60 + (isNaN(sm) ? 0 : sm);
    const e = (isNaN(eh) ? 0 : eh) * 60 + (isNaN(em) ? 0 : em);
    if (s === e) return [{ start: 0, end: 1440 }];
    if (s > e) return [{ start: s, end: 1440 }, { start: 0, end: e }];
    return [{ start: s, end: e }];
  };

  const shiftOverlapInfo = useMemo(() => {
    const activeShifts = shifts.filter(s => s.isActive);
    const overlappingIndices: number[] = [];
    let conflictMsg: { ar: string; en: string } | undefined;
    for (let i = 0; i < activeShifts.length; i++) {
      for (let j = i + 1; j < activeShifts.length; j++) {
        const ints1 = getShiftIntervals(activeShifts[i].startTime, activeShifts[i].endTime);
        const ints2 = getShiftIntervals(activeShifts[j].startTime, activeShifts[j].endTime);
        let overlapping = false;
        for (const a of ints1) {
          for (const b of ints2) {
            if (Math.max(a.start, b.start) < Math.min(a.end, b.end)) { overlapping = true; break; }
          }
          if (overlapping) break;
        }
        if (overlapping) {
          const idxI = shifts.indexOf(activeShifts[i]);
          const idxJ = shifts.indexOf(activeShifts[j]);
          if (!overlappingIndices.includes(idxI)) overlappingIndices.push(idxI);
          if (!overlappingIndices.includes(idxJ)) overlappingIndices.push(idxJ);
          conflictMsg = {
            ar: `تداخل بين (${activeShifts[i].name.ar}) و (${activeShifts[j].name.ar})`,
            en: `Overlap between (${activeShifts[i].name.en}) and (${activeShifts[j].name.en})`
          };
        }
      }
    }
    return { hasOverlap: overlappingIndices.length > 0, overlappingIndices, conflictMsg };
  }, [shifts]);

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
      Toast.show({ type: 'info', text1: isRTL ? 'تنبيه' : 'Alert', text2: isRTL ? 'نحتاج صلاحية الوصول للأستوديو' : 'Permission needed' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8 });
    
    if (!result.canceled) {
      const catId = uploadingCategoryId || 'general';
      setImagesByCategory(prev => ({
        ...prev,
        [catId]: [...(prev[catId] || []), ...result.assets.map(a => a.uri)]
      }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'info', text1: isRTL ? 'تنبيه' : 'Alert', text2: isRTL ? 'نحتاج صلاحية الوصول للكاميرا' : 'Permission needed' });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8 });
 
    if (!result.canceled) {
      const catId = uploadingCategoryId || 'general';
      setImagesByCategory(prev => ({
        ...prev,
        [catId]: [...(prev[catId] || []), result.assets[0].uri]
      }));
    }
  };

  const removeImage = (index: number, categoryId: string = 'general') => {
    setImagesByCategory(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    // ── Full validation before submit ──
    if (!form.nameAr) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى ملء اسم الشاليه' : 'Please fill chalet name', position: 'bottom' });
      setCurrentStep(0);
      return;
    }
    if (!form.cityId) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
      setCurrentStep(1);
      return;
    }

    const activeShifts = shifts.filter(s => s.isActive);
    if (activeShifts.length === 0) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يجب تفعيل شفت واحد على الأقل' : 'At least one shift must be active', position: 'bottom' });
      setCurrentStep(2);
      return;
    }

    // Validate each active shift has at least 1 pricing entry > 0
    for (const shift of activeShifts) {
      const hasValidPricing = shift.pricing.some(p => p.price > 0);
      if (!hasValidPricing) {
        const shiftName = isRTL ? shift.name.ar : shift.name.en;
        Toast.show({ type: 'error', text1: isRTL ? 'خطأ في الأسعار' : 'Pricing Error', text2: isRTL ? `يجب تحديد سعر أكبر من صفر للشفت: ${shiftName}` : `Set a price > 0 for shift: ${shiftName}`, position: 'bottom' });
        setCurrentStep(2);
        return;
      }
    }

    try {
      const formData = new FormData();

      // ── Required fields ──
      formData.append('name', JSON.stringify({ ar: form.nameAr, en: form.nameEn || form.nameAr }));
      formData.append('cityId', form.cityId);
      formData.append('latitude', form.latitude || '33.3152');
      formData.append('longitude', form.longitude || '44.3661');
      formData.append('capacity', form.capacity || '1');
      formData.append('priceCapacity', form.priceCapacity || '1');
      formData.append('extraPersonPrice', form.extraPersonPrice || '0');
      
      // Filter only active shifts for submission
      const shiftsPayload = activeShifts.map(s => ({
        name: s.name,
        startTime: s.startTime?.split(':').slice(0, 2).join(':'),
        endTime: s.endTime?.split(':').slice(0, 2).join(':'),
        type: s.type,
        isActive: s.isActive,
        pricing: s.pricing.filter(p => p.price > 0),
      }));
      formData.append('shifts', JSON.stringify(shiftsPayload));
 
      // ── Optional fields ──
      if (form.descriptionAr) {
        formData.append('description', JSON.stringify({ ar: form.descriptionAr, en: form.descriptionEn || form.descriptionAr }));
      }
      if (form.policiesAr) {
        formData.append('terms', JSON.stringify({ ar: form.policiesAr, en: form.policiesEn || form.policiesAr }));
      }
      if (form.phone) formData.append('phone', form.phone);
      if (form.whatsapp) formData.append('whatsapp', form.whatsapp);
      if (form.depositPercentage) formData.append('depositPercentage', form.depositPercentage);
      if (form.area) formData.append('area', form.area);
      if (form.bedrooms) formData.append('bedrooms', form.bedrooms);
      if (form.bathrooms) formData.append('bathrooms', form.bathrooms);

      // ── Features ──
      if (selectedFeatures.length > 0) {
        formData.append('featureIds', JSON.stringify(selectedFeatures));
      }

      // ── Images ──
      Object.entries(imagesByCategory).forEach(([catId, uris]) => {
        const backendCatId = catId === 'general' ? '' : catId;
        uris.forEach(uri => {
          const filename = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          // @ts-ignore
          formData.append('images', { uri, name: filename, type });
          formData.append('imageCategoryIds', backendCatId);
        });
      });

      await createChalet(formData).unwrap();

      Toast.show({ type: 'success', text1: isRTL ? 'تم بنجاح' : 'Success', text2: isRTL ? 'تمت إضافة الشاليه بنجاح' : 'Chalet added successfully', position: 'bottom' });
      router.back();
    } catch (error: any) {
      console.error('Error creating chalet:', error);
      const rawMsg = error?.data?.message;
      const errorMessage = Array.isArray(rawMsg) ? rawMsg[0] : (rawMsg || (isRTL ? 'فشل إرسال البيانات، حاول لاحقاً' : 'Failed to save data, try again'));
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), position: 'bottom' });
    }
  };

  const handleCitySelect = (city: any) => {
    const cityName = typeof city.name === 'object' ? (isRTL ? city.name.ar : city.name.en) : city.name;
    setForm({ ...form, cityId: city.id, cityName });
    citySheetRef.current?.dismiss();
  };

  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: // Names
        return !!form.nameAr;
      case 1: // Location
        return !!form.cityId;
      case 2: { // Shifts
        const activeShifts = shifts.filter(s => s.isActive);
        if (activeShifts.length === 0) return false;
        return activeShifts.every(s => s.pricing.some(p => p.price > 0));
      }
      case 3: // Capacity — has defaults, always valid
        return true;
      case 4: // Amenities — optional
        return true;
      default:
        return true;
    }
  }, [currentStep, form, shifts]);

  const nextStep = () => {
    if (!isStepValid) {
      if (currentStep === 0) {
        if (!form.nameAr) Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يرجى إدخال اسم الشاليه بالعربي' : 'Please enter chalet name in Arabic', position: 'bottom' });
      } else if (currentStep === 1) {
        if (!form.cityId) Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
      } else if (currentStep === 2) {
        const activeShifts = shifts.filter(s => s.isActive);
        if (activeShifts.length === 0) {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يجب تفعيل شفت واحد على الأقل' : 'Activate at least one shift', position: 'bottom' });
        } else {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يجب تحديد أسعار أكبر من صفر لكل شفت مفعّل' : 'Set prices > 0 for all active shifts', position: 'bottom' });
        }
      }
      return;
    }
    
    // Internal Amenity sub-steps
    if (currentStep === 4 && amenityCategories) {
      if (currentAmenitySubStep < amenityCategories.length - 1) {
        setCurrentAmenitySubStep(currentAmenitySubStep + 1);
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const prevStep = () => {
    // Internal Amenity sub-steps
    if (currentStep === 4 && currentAmenitySubStep > 0) {
      setCurrentAmenitySubStep(currentAmenitySubStep - 1);
      return;
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const textAlign = 'left' as const;
  const flexDirection = 'row' as const;
  // ── Shift Row ──
  const renderShiftRow = (shift: ShiftData, index: number) => {
    const isActive = shift.isActive;
    const weekdayPrice = shift.pricing.find(p => p.dayOfWeek === 0)?.price || 0;
    
    const shiftIcon = shift.type === 'MORNING'
      ? require('../../assets/tabs/sun.svg')
      : shift.type === 'EVENING'
        ? require('../../assets/tabs/night.svg')
        : require('../../assets/tabs/sleep.svg');

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

          {/* Name & Price & Time */}
          <View style={[styles.shiftInfo, { flexDirection }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.shiftValueName}>
                {isRTL ? shift.name.ar : shift.name.en}
                {isActive && weekdayPrice > 0 && (
                  <Text style={styles.shiftPriceText}> ({weekdayPrice.toLocaleString()})</Text>
                )}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <SolarClockCircleBold size={11} color="#94A3B8" />
                <Text style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'Alexandria-Medium' }}>
                  {formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}
                </Text>
              </View>
            </View>
            <ExpoImage source={shiftIcon} style={{ width: 26, height: 26 }} contentFit="contain" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
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

          {/* ═══════════ Step 0: الاسماء ═══════════ */}
          {currentStep === 0 && (
            <>
              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (عربي) *' : 'Chalet Name (AR) *'}</Text>
                  <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={isRTL ? "اسم الشاليه بالعربي" : "e.g. شاليه الورد"}
                    placeholderTextColor="#BCBCBC"
                    value={form.nameAr}
                    onChangeText={(val) => setForm({ ...form, nameAr: val })}
                  />
                </View>
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
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وصف الشاليه (عربي)' : 'Description (AR)'}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { textAlign }]}
                    placeholder={isRTL ? "ادخل وصفاً للشاليه بالعربي" : "Enter description in Arabic..."}
                    placeholderTextColor="#BCBCBC"
                    multiline
                    numberOfLines={4}
                    value={form.descriptionAr}
                    onChangeText={(val) => setForm({ ...form, descriptionAr: val })}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وصف الشاليه (إنجليزي)' : 'Description (EN)'}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { textAlign: 'left' }]}
                    placeholder="Enter description in English..."
                    placeholderTextColor="#BCBCBC"
                    multiline
                    numberOfLines={4}
                    value={form.descriptionEn}
                    onChangeText={(val) => setForm({ ...form, descriptionEn: val })}
                  />
                </View>
              </View>
            </>
          )}

          {/* ═══════════ Step 1: الموقع ═══════════ */}
          {currentStep === 1 && (
            <>
              <View style={styles.sectionCard}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { textAlign }]}>{isRTL ? 'المدينة *' : 'City *'}</Text>
                  <TouchableOpacity
                    style={[styles.input, { justifyContent: 'center' }]}
                    onPress={() => citySheetRef.current?.present()}
                  >
                    <Text style={{ color: form.cityName ? Colors.text.primary : '#BCBCBC', textAlign }}>
                      {form.cityName || (isRTL ? 'اختر المدينة' : 'Select City')}
                    </Text>
                  </TouchableOpacity>
                </View>

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
                <ThemedText type="h2" style={[styles.sectionHeader, { textAlign }]}>{isRTL ? 'المواصفات' : 'Specifications'}</ThemedText>
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
            </>
          )}

          {/* ═══════════ Step 2: الفترات ═══════════ */}
          {currentStep === 2 && (
            <>
              <View style={styles.sectionCard}>
                <View style={[styles.shiftsHeaderRow, { flexDirection }]}>
                  <ThemedText type="h2" style={styles.sectionHeader}>
                    {isRTL ? 'الفترات المتاحة' : 'Available Shifts'}
                  </ThemedText>
                </View>
                <View style={styles.shiftListContainer}>
                  {shifts.map((shift, index) => renderShiftRow(shift, index))}
                </View>
              </View>
            </>
          )}

          {/* ═══════════ Step 3: السعة والتسعير ═══════════ */}
          {currentStep === 3 && (
            <>
              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={[styles.sectionHeader, { textAlign }]}>{isRTL ? 'السعة والتسعير الإضافي' : 'Capacity & Extra Pricing'}</ThemedText>
                
                <View style={styles.capacityList}>
                  {/* Max Capacity Card */}
                  <View style={[styles.capacityCard, { flexDirection }]}>
                    <GuestCounter 
                      value={parseInt(form.capacity) || 1} 
                      onIncrement={() => setForm({ ...form, capacity: (parseInt(form.capacity || '1') + 1).toString() })}
                      onDecrement={() => setForm({ ...form, capacity: Math.max(1, parseInt(form.capacity || '1') - 1).toString() })}
                    />
                    <View style={[styles.capacityInfo, { alignItems: 'flex-start' }]}>
                      <Text style={styles.capacityLabel}>{isRTL ? 'سعة الشاليه (الحد الأقصى للزيادة)' : 'Chalet Capacity'}</Text>
                      <Text style={styles.capacitySubLabel}>{isRTL ? 'الحد الكلي المسموح به بعد الزيادة' : 'Maximum total guests allowed'}</Text>
                    </View>
                  </View>

                  {/* Price Capacity Card */}
                  <View style={[styles.capacityCard, { flexDirection }]}>
                    <GuestCounter 
                      value={parseInt(form.priceCapacity) || 1} 
                      onIncrement={() => setForm({ ...form, priceCapacity: (parseInt(form.priceCapacity || '1') + 1).toString() })}
                      onDecrement={() => setForm({ ...form, priceCapacity: Math.max(1, parseInt(form.priceCapacity || '1') - 1).toString() })}
                    />
                    <View style={[styles.capacityInfo, { alignItems: 'flex-start' }]}>
                      <Text style={styles.capacityLabel}>{isRTL ? 'سعة المبلغ (العدد المشمول بالسعر)' : 'Price Capacity'}</Text>
                      <Text style={styles.capacitySubLabel}>{isRTL ? 'العدد المشمول بسعر الفترة الأساسي' : 'Base guests covered under standard shift price'}</Text>
                    </View>
                  </View>

                  <View style={[styles.rowInputs, { flexDirection, marginTop: 12 }]}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.label, { textAlign }]}>{isRTL ? 'سعر الشخص الإضافي' : 'Extra Person Price'}</Text>
                      <TextInput style={[styles.input, { textAlign: 'center' }]} keyboardType="numeric" value={form.extraPersonPrice} onChangeText={(val) => setForm({ ...form, extraPersonPrice: val })} />
                      <Text style={[styles.smallLabel, { textAlign }]}>{isRTL ? 'لكل شخص إضافي فوق سعة المبلغ' : 'Per extra guest above price capacity'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <ThemedText type="h2" style={[styles.sectionHeader, { textAlign }]}>{isRTL ? 'معلومات التواصل' : 'Contact Info'}</ThemedText>
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

          {/* ═══════════ Step 4: المرافق والخدمات ═══════════ */}
          {currentStep === 4 && amenityCategories && amenityCategories[currentAmenitySubStep] && (
            <View key={amenityCategories[currentAmenitySubStep].id}>
              <View style={styles.sectionCard}>
                <Text style={[styles.categorySectionTitle, { textAlign: 'center' }]}>
                  {isRTL ? amenityCategories[currentAmenitySubStep].name?.ar : amenityCategories[currentAmenitySubStep].name?.en}
                </Text>
                
                {/* Feature Cards - matching amenities-modal design */}
                <View style={{ gap: 12, marginBottom: 24 }}>
                  {amenityCategories[currentAmenitySubStep].features?.map((feature: any) => {
                    const isSelected = selectedFeatures.includes(feature.id);
                    return (
                      <TouchableOpacity
                        key={feature.id}
                        style={[
                          styles.swiperFeatureCard,
                          isSelected && styles.swiperFeatureCardActive,
                          { flexDirection }
                        ]}
                        onPress={() => toggleFeature(feature.id)}
                        activeOpacity={0.7}
                      >
                        {/* Checkbox */}
                        <View style={styles.swiperCheckboxContainer}>
                          {isSelected ? (
                            <View style={styles.swiperCheckboxActive}>
                              <Text style={styles.swiperCheckmark}>✓</Text>
                            </View>
                          ) : (
                            <View style={styles.swiperCheckboxInactive} />
                          )}
                        </View>

                        {/* Info */}
                        <View style={[styles.swiperFeatureInfo, { flexDirection }]}>
                          <Text style={[styles.swiperFeatureName, { textAlign }]}>
                            {isRTL ? feature.name?.ar : feature.name?.en}
                          </Text>
                          {/* Orange Badge */}
                          <View style={styles.orangeBadgeContainer}>
                            <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '0deg' }] }]} />
                            <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '30deg' }] }]} />
                            <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '60deg' }] }]} />
                            <View style={styles.orangeBadgeContent}>
                              <Text style={{ fontSize: 14 }}>
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
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Section Photos */}
                <View style={{ marginTop: 4 }}>
                  <Text style={[styles.swiperSectionTitle, { textAlign }]}>
                    {isRTL ? 'صور هذا المرفق' : 'Amenity Images'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                    <TouchableOpacity 
                      style={styles.swiperUploadBtn}
                      onPress={() => {
                        setUploadingCategoryId(amenityCategories[currentAmenitySubStep].id);
                        imageSourceSheetRef.current?.present();
                      }}
                    >
                      <SolarCameraBold size={24} color="#94A3B8" />
                    </TouchableOpacity>
                    {(imagesByCategory[amenityCategories[currentAmenitySubStep].id] || []).map((uri, index) => (
                      <View key={index} style={styles.swiperImageContainer}>
                        <Image source={{ uri }} style={styles.swiperImage} />
                        <TouchableOpacity 
                          style={styles.swiperImageDeleteBtn}
                          onPress={() => removeImage(index, amenityCategories[currentAmenitySubStep].id)}
                        >
                          <Text style={styles.swiperImageDeleteText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Progress Dots */}
                <View style={[styles.swiperPaginationDots, { flexDirection, marginTop: 20 }]}>
                  {amenityCategories.map((_: any, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setCurrentAmenitySubStep(idx)}
                      hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                      style={[
                        styles.swiperDot, 
                        currentAmenitySubStep === idx && styles.swiperDotActive,
                      ]} 
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* General Photos */}
          {currentStep === 4 && currentAmenitySubStep === 0 && (
             <View style={styles.sectionCard}>
                <ThemedText type="h2" style={styles.sectionHeader}>{isRTL ? 'صور الشاليه العامة' : 'General Photos'}</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                  <TouchableOpacity style={styles.swiperUploadBtn} onPress={() => { setUploadingCategoryId('general'); imageSourceSheetRef.current?.present(); }}>
                    <SolarGalleryBold size={24} color="#94A3B8" />
                  </TouchableOpacity>
                  {(imagesByCategory['general'] || []).map((uri, index) => (
                    <View key={index} style={styles.swiperImageContainer}>
                      <Image source={{ uri }} style={styles.swiperImage} />
                      <TouchableOpacity style={styles.swiperImageDeleteBtn} onPress={() => removeImage(index, 'general')}>
                        <Text style={styles.swiperImageDeleteText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
             </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { flexDirection }]}>
          {currentStep > 0 && (
            <SecondaryButton label={isRTL ? 'السابق' : 'Back'} onPress={prevStep} style={{ flex: 1 }} />
          )}
          
          {/* Logic to determine if we should show 'Next' or 'Save' */}
          {(() => {
            const isOnLastMainStep = currentStep === steps.length - 1;
            const hasMoreAmenities = amenityCategories && currentAmenitySubStep < amenityCategories.length - 1;
            const shouldShowNext = !isOnLastMainStep || (isOnLastMainStep && hasMoreAmenities);

            if (shouldShowNext) {
              return (
                <PrimaryButton
                  label={isRTL ? 'التالي' : 'Next'}
                  onPress={nextStep}
                  disabled={!isStepValid}
                  activeColor={isStepValid ? Colors.primary : '#CBD5E1'}
                  style={{ flex: 2 }}
                />
              );
            } else {
              return (
                <PrimaryButton
                  label={isRTL ? 'حفظ ونشر الشاليه' : 'Save & Publish'}
                  onPress={handleSave}
                  loading={isLoading}
                  disabled={!isStepValid}
                  activeColor={isStepValid ? Colors.primary : '#CBD5E1'}
                  style={{ flex: 2 }}
                />
              );
            }
          })()}
        </View>
      </KeyboardAvoidingView>

      {/* ── Bottom Sheets ── */}

      {/* City Picker */}
      <BottomSheetModal ref={citySheetRef} index={0} snapPoints={snapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          {loadingCities ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 20 }} />
          ) : (
            <View style={{ width: '100%', flex: 1 }}>
              <View style={[styles.modalSearchContainer, { flexDirection: 'row' }]}>
                <SolarMagnifierBold size={20} color={Colors.text.muted} />
                <TextInput
                  style={[styles.modalSearchInput, { textAlign }]}
                  placeholder={isRTL ? 'ابحث عن مدينة...' : 'Search for a city...'}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
              </View>
              <BottomSheetFlatList
                data={filteredCities}
                keyExtractor={(item: any) => item.id}
                style={{ width: '100%' }}
                ListHeaderComponent={<Text style={styles.modalTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</Text>}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity style={[styles.pickerItem, { flexDirection: 'row', alignItems: 'center', gap: 10 }]} onPress={() => handleCitySelect(item)}>
                    <SolarMapPointBold size={20} color={Colors.primary} />
                    <Text style={[styles.pickerItemText, { textAlign, flex: 1 }]}>
                      {typeof item.name === 'object' ? (isRTL ? item.name.ar : item.name.en) : item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: Colors.text.muted }}>{isRTL ? 'لا توجد نتائج' : 'No results found'}</Text>
                  </View>
                }
              />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Image Source Picker */}
      <BottomSheetModal ref={imageSourceSheetRef} index={0} snapPoints={imageSnapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: normalize.radius(24) }}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.modalTitle}>{isRTL ? 'اختر مصدر الصورة' : 'Select Image Source'}</Text>
          <View style={[styles.modalOptions, { flexDirection }]}>
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
      <BottomSheetModal ref={editShiftSheetRef} index={0} snapPoints={editShiftSnapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: 28, backgroundColor: '#FFFFFF' }}>
        <BottomSheetView style={{ flex: 1, padding: 20 }}>
          {editingShiftIndex !== null && (() => {
            const shift = shifts[editingShiftIndex];
            const shiftName = isRTL ? shift.name.ar : shift.name.en;

            const uniformPrice = shift.pricing[0]?.price || 0;

            const parseTimeDisplay = (timeStr: string) => {
              if (!timeStr) return { time: '00:00', period: '' };
              const [h, m] = timeStr.split(':').map(Number);
              const hours12 = h % 12 || 12;
              const period = h >= 12 ? (isRTL ? 'مساءاً' : 'PM') : (isRTL ? 'صباحاً' : 'AM');
              return { time: `${hours12.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`, period };
            };

            const startDisplay = parseTimeDisplay(shift.startTime);
            const endDisplay = parseTimeDisplay(shift.endTime);

            const isCurrentOverlapping = shiftOverlapInfo.overlappingIndices.includes(editingShiftIndex);

            return (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Shift Name Header (Editable) */}
                <View style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}>

                  <TextInput
                    style={{ flex: 1, fontSize: 16, fontFamily: 'Alexandria-Bold', color: '#1E293B', textAlign: 'left' }}
                    value={isRTL ? shift.name.ar : shift.name.en}
                    onChangeText={(val) => updateShiftField(editingShiftIndex, isRTL ? 'nameAr' : 'nameEn', val)}
                    placeholder={isRTL ? 'اسم الفترة' : 'Shift name'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Time Card (matching shifts.tsx) */}
                <View style={[{
                  backgroundColor: '#fff',
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#F0F2F7',
                  marginBottom: 20,
                }, isCurrentOverlapping && { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }]}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[{ fontSize: 13, fontFamily: 'Alexandria-Bold', color: '#475569' }, isCurrentOverlapping && { color: '#991B1B' }]}>
                      {isRTL ? 'أوقات الفترة' : 'Shift Times'}
                    </Text>
                    {isCurrentOverlapping && (
                      <View style={{ backgroundColor: '#FEE4E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, color: '#D92D20', fontFamily: 'Alexandria-Bold' }}>
                          {isRTL ? 'تداخل' : 'Overlap'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Start / End Time */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {/* Start Time */}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Alexandria-Medium', color: '#64748B' }}>
                        {isRTL ? 'وقت البدء' : 'Start Time'}
                      </Text>
                      <View style={{ alignItems: 'center', marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => adjustShiftTime(editingShiftIndex, 'startTime', -30)} style={styles.adjustTimeBtnSmall}>
                            <Text style={styles.adjustTimeBtnTextSmall}>-</Text>
                          </TouchableOpacity>
                          <Text style={[styles.timeValueText, isCurrentOverlapping && { color: '#D92D20' }]}>
                            {formatTime12h(shift.startTime)}
                          </Text>
                          <TouchableOpacity onPress={() => adjustShiftTime(editingShiftIndex, 'startTime', 30)} style={styles.adjustTimeBtnSmall}>
                            <Text style={styles.adjustTimeBtnTextSmall}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <View style={{ width: 1, height: '80%', backgroundColor: '#E2E8F0', alignSelf: 'center' }} />

                    {/* End Time */}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Alexandria-Medium', color: '#64748B' }}>
                        {isRTL ? 'وقت الانتهاء' : 'End Time'}
                      </Text>
                      <View style={{ alignItems: 'center', marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <TouchableOpacity onPress={() => adjustShiftTime(editingShiftIndex, 'endTime', -30)} style={styles.adjustTimeBtnSmall}>
                            <Text style={styles.adjustTimeBtnTextSmall}>-</Text>
                          </TouchableOpacity>
                          <Text style={[styles.timeValueText, isCurrentOverlapping && { color: '#D92D20' }]}>
                            {formatTime12h(shift.endTime)}
                          </Text>
                          <TouchableOpacity onPress={() => adjustShiftTime(editingShiftIndex, 'endTime', 30)} style={styles.adjustTimeBtnSmall}>
                            <Text style={styles.adjustTimeBtnTextSmall}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Overlap Warning */}
                  {isCurrentOverlapping && shiftOverlapInfo.conflictMsg && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FEE4E2',
                      borderRadius: 8,
                      padding: 10,
                      marginTop: 12,
                      gap: 6
                    }}>
                      <SolarInfoCircleBold size={16} color="#D92D20" />
                      <Text style={{ color: '#D92D20', fontSize: 11, fontFamily: 'Alexandria-Medium', flex: 1, textAlign: 'left' }}>
                        {isRTL
                          ? `تنبيه: ${shiftOverlapInfo.conflictMsg.ar}. يجب تغيير الوقت.`
                          : `Warning: ${shiftOverlapInfo.conflictMsg.en}. Please change the time.`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price Section */}
                <Text style={{ fontSize: 15, fontFamily: 'Alexandria-Bold', color: '#1E293B', textAlign: 'left', marginBottom: 12 }}>
                  {isRTL ? 'تحديد السعر' : 'Set Price'}
                </Text>

                <View style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  paddingVertical: 4,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 32,
                }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Alexandria-Medium', color: '#94A3B8', marginEnd: 12 }}>
                    {isRTL ? 'د.ع' : 'IQD'}
                  </Text>
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 18,
                      fontFamily: 'Alexandria-Bold',
                      color: '#1E293B',
                      textAlign: 'right',
                      paddingVertical: 14,
                    }}
                    value={uniformPrice > 0 ? uniformPrice.toLocaleString() : ''}
                    onChangeText={(val) => setUniformPrice(editingShiftIndex, val.replace(/,/g, ''))}
                    keyboardType="numeric"
                    placeholder="600,000"
                    placeholderTextColor="#CBD5E1"
                  />
                </View>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <SecondaryButton
                    label={isRTL ? 'الغاء' : 'Cancel'}
                    onPress={() => editShiftSheetRef.current?.dismiss()}
                    style={{ flex: 1 }}
                  />
                  <SecondaryButton
                    label={isRTL ? 'تاكيد' : 'Confirm'}
                    onPress={() => editShiftSheetRef.current?.dismiss()}
                    isActive={true}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            );
          })()}
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
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md },
  sectionCard: { backgroundColor: 'transparent', padding: 0, gap: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { fontSize: normalize.font(16), fontFamily: "Alexandria-Black", color: Colors.text.primary, marginBottom: 2 },
  rowInputs: { gap: Spacing.sm },
  inputGroup: { gap: 6 },
  label: { ...Typography.caption, color: Colors.text.primary, fontFamily: "Alexandria-Black", fontSize: normalize.font(14) },
  smallLabel: { ...Typography.caption, color: Colors.text.muted, fontFamily: "Alexandria-SemiBold", fontSize: normalize.font(12) },
  input: {
    height: normalize.height(48), backgroundColor: '#FFFFFF', borderRadius: normalize.radius(12),
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: '#E8E8E8',
    fontSize: normalize.font(15), color: Colors.text.primary, fontFamily: "Alexandria-Regular" },
  textArea: { height: normalize.height(100), paddingTop: 18, textAlignVertical: 'top' },
  // Map
  mapPreviewContainer: {
    height: normalize.height(160), width: '100%', borderRadius: normalize.radius(12),
    overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative' },
  miniMap: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: Spacing.sm, left: 0, right: 0, alignItems: 'center' },
  editLocBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(3, 93, 249, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  editLocText: { color: Colors.white, fontSize: normalize.font(12), fontFamily: "Alexandria-Bold" },
  // Shifts
  shiftsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftHint: { fontSize: normalize.font(13), color: Colors.text.muted, fontFamily: "Alexandria-Regular", marginBottom: 4 },
  pricingTitle: { fontSize: normalize.font(14), fontFamily: "Alexandria-Bold", color: Colors.text.primary },
  dayPricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  dayPriceItem: { alignItems: 'center', gap: 4, width: '13%' },
  dayLabel: { fontSize: normalize.font(10), fontFamily: "Alexandria-Black", color: Colors.text.muted },
  dayPriceInput: {
    width: '100%', height: 36, backgroundColor: '#F8FAFC', borderRadius: 8,
    borderWidth: 1, borderColor: '#E2E8F0', textAlign: 'center',
    fontSize: normalize.font(11), color: Colors.text.primary, fontFamily: "Alexandria-Medium", paddingHorizontal: 2 },
  // Shift Card Row (Matches Screenshot)
  shiftListContainer: { gap: 12, marginBottom: 16 },
  shiftCardRow: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(16),
    borderWidth: 1.5, borderColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 14 },
  shiftCardRowActive: { borderColor: Colors.primary + '20' },
  shiftRowInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shiftActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shiftEditBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  shiftInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' },
  shiftIconLarge: { fontSize: 24 },
  shiftValueName: { fontSize: normalize.font(15), fontFamily: "Alexandria-Bold", color: Colors.text.primary },
  shiftPriceText: { color: Colors.text.primary, fontFamily: "Alexandria-Black" },
  addShiftBtnFull: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.primary + '40',
    borderRadius: 14, marginTop: 8 },
  addShiftBtnFullText: { color: Colors.primary, fontFamily: "Alexandria-Bold" },
  // Capacity (Matches Screenshot)
  capacityList: { gap: 12, marginTop: 8 },
  capacityCard: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(16),
    borderWidth: 1.5, borderColor: '#F1F5F9', padding: 16,
    justifyContent: 'space-between', alignItems: 'center' },
  capacityInfo: { flex: 1, gap: 2 },
  capacityLabel: { fontSize: normalize.font(18), fontFamily: "Alexandria-Bold", color: Colors.text.primary },
  capacitySubLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-Regular", color: Colors.text.muted },
  // Modal Edit
  shiftModalCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, gap: 16 },
  pricingSectionModal: { gap: 12 },
  modalDeleteBtn: { paddingVertical: 16, alignItems: 'center' },
  modalDeleteText: { color: Colors.error, fontFamily: "Alexandria-Bold" },
  // Amenity Categories & Feature Rows
  categorySectionTitle: {
    fontSize: normalize.font(16), fontFamily: "Alexandria-Black", color: Colors.text.primary,
    textAlign: 'center', marginBottom: 8 },
  featuresList: { gap: 8 },
  featureRow: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(14),
    borderWidth: 1.5, borderColor: '#E8E8E8', paddingHorizontal: 16, paddingVertical: 14 },
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
    elevation: 3 },
  featureIconText: { fontSize: normalize.font(20), color: '#FFFFFF' },
  featureName: {
    fontSize: normalize.font(14), fontFamily: "Alexandria-Bold", color: Colors.text.primary,
    flex: 1 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxCheck: { color: '#FFFFFF', fontSize: normalize.font(14), fontFamily: "Alexandria-Bold" },
  uploadText: { marginTop: normalize.height(4), color: Colors.text.muted, fontSize: normalize.font(12), fontFamily: "Alexandria-SemiBold" },
  photoHint: { fontSize: normalize.font(12), color: Colors.text.muted, fontFamily: "Alexandria-Regular", marginBottom: 4 },
  imageContainer: { gap: Spacing.sm },
  imageItem: { width: normalize.width(100), height: normalize.width(100), borderRadius: normalize.radius(16), overflow: 'hidden', position: 'relative' },
  uploadedImage: { width: '100%', height: '100%' },
  removeImageButton: { position: 'absolute', top: normalize.height(6), backgroundColor: Colors.white, borderRadius: normalize.radius(12) },
  imageUpload: {
    width: normalize.width(100), height: normalize.width(100), backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16), borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center' },
  coverBadge: { position: 'absolute', bottom: 6, start: 6, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  coverBadgeText: { color: '#FFFFFF', fontSize: normalize.font(9), fontFamily: "Alexandria-Bold" },
  // Amenity Wizard Progress
  amenityProgressContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24, marginBottom: 12 },
  amenityDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  amenityDotActive: {
    width: 24, backgroundColor: Colors.primary },
  amenityDotPassed: {
    backgroundColor: Colors.primary + '60' },
  // Bottom sheets
  sheetContent: { padding: Spacing.lg, alignItems: 'center', flex: 1 },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  modalOptions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.lg },
  modalOption: { alignItems: 'center', gap: Spacing.sm },
  modalIcon: { width: normalize.width(70), height: normalize.width(70), borderRadius: normalize.radius(35), justifyContent: 'center', alignItems: 'center' },
  modalOptionText: { ...Typography.body, fontFamily: "Alexandria-SemiBold" },
  pickerItem: { width: '100%', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemText: { ...Typography.body, fontSize: normalize.font(16), color: Colors.text.primary },
  modalSearchContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0' },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: "Alexandria-Regular" },
  shiftRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 14, marginBottom: 10 },
  timeSelectBtn: { height: 48, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  timeSelectText: { fontSize: normalize.font(15), fontFamily: "Alexandria-Bold", color: Colors.text.primary },
  bulkPricingRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  bulkBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE' },
  bulkBtnText: { color: Colors.primary, fontSize: normalize.font(12), fontFamily: "Alexandria-Bold" },

  // ── Time Adjustment Styles (matching shifts.tsx) ──
  adjustTimeBtnSmall: {
    backgroundColor: Colors.primary + '10',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  adjustTimeBtnTextSmall: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
    lineHeight: 18,
  },
  timeValueText: {
    fontSize: 13,
    fontFamily: 'Alexandria-Bold',
    color: '#0F172A',
    minWidth: 70,
    textAlign: 'center',
  },

  // ── Swiper Amenity Styles (matching amenities-modal) ──
  swiperFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  swiperFeatureCardActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F7FF',
  },
  swiperCheckboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperCheckboxActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Alexandria-Bold',
    marginTop: -1,
  },
  swiperCheckboxInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  swiperFeatureInfo: {
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  swiperFeatureName: {
    fontSize: 14,
    fontFamily: 'Alexandria-SemiBold',
    color: Colors.text.primary,
    flex: 1,
  },
  orangeBadgeContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orangeBadgeLayer: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FF5B00',
  },
  orangeBadgeContent: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperSectionTitle: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  swiperUploadBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    position: 'relative',
  },
  swiperImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  swiperImageDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  swiperImageDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    marginTop: -2.5,
  },
  swiperPaginationDots: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  swiperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  swiperDotActive: {
    backgroundColor: '#0066FF',
    width: 18,
  } });
