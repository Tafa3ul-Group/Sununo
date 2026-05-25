import { ChaletProgressTabs } from '@/components/chalet-progress-tabs';
import { ThemedText } from '@/components/themed-text';

import {
  SolarCameraBold,
  SolarClockCircleBold,
  SolarDocumentAddBoldDuotone,
  SolarGalleryBold,
  SolarHomeBoldDuotone,
  SolarInfoCircleBold,
  SolarMagnifierBold,
  SolarMapPointBold,
  SolarMapPointWaveBoldDuotone,
  SolarPenBold,
  SolarPostsCarouselBoldDuotone,
  SolarSortByTimeBold,
  SolarStarBold,
  SolarWifiBold
} from "@/components/icons/solar-icons";
import { AppMap } from '@/components/user/app-map';
import { GuestCounter } from '@/components/user/guest-counter';
import { LocationPickerModal } from '@/components/user/location-picker-modal';
import { PrimaryButton } from '@/components/user/primary-button';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize, Spacing, Typography } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { isRTL } from "@/i18n";
import { RootState } from '@/store';
import {
  useCreateChaletMutation,
  useGetAmenityCategoriesQuery,
  useGetCitiesQuery,
  useGetShiftDefaultsQuery
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
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

// ── Amenity Icon (matching amenities-modal) ──
const AmenityIcon = ({ icon, size = 18 }: { icon: string; size?: number }) => {
  if (!icon) return <SolarStarBold size={size} color="#FFF" />;
  if (icon === "wifi") return <SolarWifiBold size={size} color="#FFF" />;
  const lower = icon.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) {
    return <SolarWifiBold size={size} color="#FFF" />;
  }
  if (icon.startsWith("http") || icon.startsWith("/") || icon.includes(".")) {
    return (
      <Image
        source={getImageSrc(icon)}
        style={{ width: size, height: size, tintColor: "#FFF" }}
        resizeMode="contain"
      />
    );
  }
  return <SolarStarBold size={size} color="#FFF" />;
};

// ── Phone Validation (matching login.tsx) ──
function validatePhoneNumber(text: string): string | null {
  if (!text) return null;
  const clean = text.replace(/[\s\-\(\)]/g, "");

  // Check if contains non-numeric (excluding leading +)
  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return "يجب أن يحتوي رقم الهاتف على أرقام فقط";
  }

  // Allow test numbers (10-15 digits of non-standard format)
  const isTestNumber = /^\d{10,15}$/.test(clean) && !clean.startsWith("07") && !clean.startsWith("7") && !clean.startsWith("+964") && !clean.startsWith("00964");
  if (isTestNumber) return null;

  // Iraqi prefixes check
  const hasIraqiPrefix = clean.startsWith("07") ||
    clean.startsWith("7") ||
    clean.startsWith("+9647") ||
    clean.startsWith("9647") ||
    clean.startsWith("009647") ||
    clean === "+" || clean === "+9" || clean === "+96" || clean === "+964" ||
    clean === "0" || clean === "00" || clean === "009" || clean === "0096" || clean === "00964";

  if (!hasIraqiPrefix) {
    return "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+";
  }

  // Length check based on prefix
  if (clean.startsWith("07")) {
    if (clean.length < 11) return "رقم الهاتف قصير جداً (مطلوب 11 رقماً)";
    if (clean.length > 11) return "رقم الهاتف طويل جداً (مطلوب 11 رقماً)";
  } else if (clean.startsWith("7")) {
    if (clean.length < 10) return "رقم الهاتف قصير جداً (مطلوب 10 أرقام)";
    if (clean.length > 10) return "رقم الهاتف طويل جداً (مطلوب 10 أرقام)";
  } else if (clean.startsWith("+9647")) {
    if (clean.length < 13) return "رقم الهاتف قصير جداً (مطلوب 13 رقماً)";
    if (clean.length > 13) return "رقم الهاتف طويل جداً (مطلوب 13 رقماً)";
  } else if (clean.startsWith("9647")) {
    if (clean.length < 12) return "رقم الهاتف قصير جداً (مطلوب 12 رقماً)";
    if (clean.length > 12) return "رقم الهاتف طويل جداً (مطلوب 12 رقماً)";
  } else if (clean.startsWith("009647")) {
    if (clean.length < 14) return "رقم الهاتف قصير جداً (مطلوب 14 رقماً)";
    if (clean.length > 14) return "رقم الهاتف طويل جداً (مطلوب 14 رقماً)";
  }

  return null;
}

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
  price: i >= 5 ? 150000 : 100000
}));

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
    extraPersonPrice: '10000'
  });

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const { data: amenityCategories } = useGetAmenityCategoriesQuery();

  const steps = useMemo(() => [
    { id: 'name', title: isRTL ? 'الاسماء' : 'Names', icon: <SolarDocumentAddBoldDuotone size={18} color="#FFF" /> },
    { id: 'location', title: isRTL ? 'الموقع' : 'Location', icon: <SolarMapPointWaveBoldDuotone size={18} color="#FFF" /> },
    { id: 'shifts', title: isRTL ? 'الفترات' : 'Shifts', icon: <SolarSortByTimeBold size={18} color="#FFF" /> },
    { id: 'capacity', title: isRTL ? 'السعة' : 'Capacity', icon: <SolarPostsCarouselBoldDuotone size={18} color="#FFF" /> },
    { id: 'amenities', title: isRTL ? 'المرافق' : 'Amenities', icon: <SolarHomeBoldDuotone size={18} color="#FFF" /> },
  ], [isRTL]);

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const changeStep = useCallback((newStep: number) => {
    const goingForward = newStep > currentStep;
    // Phase 1: Exit — fade out + slide + scale down
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: goingForward ? -15 : 15, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(newStep);
      // Reset to entry position
      slideAnim.setValue(goingForward ? 20 : -20);
      scaleAnim.setValue(0.97);
      // Phase 2: Enter — spring in
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, scaleAnim, currentStep]);

  const [currentAmenitySubStep, setCurrentAmenitySubStep] = useState(0);

  const changeAmenitySubStep = useCallback((newIdx: number) => {
    const goingForward = newIdx > currentAmenitySubStep;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: goingForward ? -15 : 15, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentAmenitySubStep(newIdx);
      slideAnim.setValue(goingForward ? 20 : -20);
      scaleAnim.setValue(0.97);
      Animated.parallel([
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, scaleAnim, currentAmenitySubStep]);

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
  const [phoneError, setPhoneError] = useState<string | null>(null);

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
    // Check ALL shifts for overlap (not just active), so user sees conflicts during editing
    const overlappingIndices: number[] = [];
    let conflictMsg: { ar: string; en: string } | undefined;
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const ints1 = getShiftIntervals(shifts[i].startTime, shifts[i].endTime);
        const ints2 = getShiftIntervals(shifts[j].startTime, shifts[j].endTime);
        let overlapping = false;
        for (const a of ints1) {
          for (const b of ints2) {
            if (Math.max(a.start, b.start) < Math.min(a.end, b.end)) { overlapping = true; break; }
          }
          if (overlapping) break;
        }
        if (overlapping) {
          if (!overlappingIndices.includes(i)) overlappingIndices.push(i);
          if (!overlappingIndices.includes(j)) overlappingIndices.push(j);
          conflictMsg = {
            ar: `تداخل بين (${shifts[i].name.ar}) و (${shifts[j].name.ar})`,
            en: `Overlap between (${shifts[i].name.en}) and (${shifts[j].name.en})`
          };
        }
      }
    }
    return { hasOverlap: overlappingIndices.length > 0, overlappingIndices, conflictMsg };
  }, [shifts]);

  const openEditShift = (index: number) => {
    setEditingShiftIndex(index);
    // Delay present() so React renders the content before the sheet opens
    requestAnimationFrame(() => {
      editShiftSheetRef.current?.present();
    });
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
      quality: 0.8
    });

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
      quality: 0.8
    });

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
    if (!form.nameAr || !form.descriptionAr) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى ملء جميع الحقول المطلوبة في الأسماء' : 'Please fill all required name/description fields', position: 'bottom' });
      changeStep(0);
      return;
    }
    if (!form.cityId) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
      changeStep(1);
      return;
    }

    const activeShifts = shifts.filter(s => s.isActive);
    if (activeShifts.length === 0) {
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يجب تفعيل شفت واحد على الأقل' : 'At least one shift must be active', position: 'bottom' });
      changeStep(2);
      return;
    }

    // Validate each active shift has at least 1 pricing entry > 0
    for (const shift of activeShifts) {
      const hasValidPricing = shift.pricing.some(p => p.price > 0);
      if (!hasValidPricing) {
        const shiftName = isRTL ? shift.name.ar : shift.name.en;
        Toast.show({ type: 'error', text1: isRTL ? 'خطأ في الأسعار' : 'Pricing Error', text2: isRTL ? `يجب تحديد سعر أكبر من صفر للشفت: ${shiftName}` : `Set a price > 0 for shift: ${shiftName}`, position: 'bottom' });
        changeStep(2);
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
      case 0: // Names & Descriptions — Arabic required, English optional
        return !!form.nameAr && !!form.descriptionAr;
      case 1: { // Location + Phone
        if (!form.cityId) return false;
        if (!form.phone) return false;
        const phoneErr = validatePhoneNumber(form.phone);
        return phoneErr === null;
      }
      case 2: { // Shifts
        const activeShifts = shifts.filter(s => s.isActive);
        if (activeShifts.length === 0) return false;
        if (shiftOverlapInfo.hasOverlap) return false;
        return activeShifts.every(s => s.pricing.some(p => p.price > 0));
      }
      case 3: // Capacity — has defaults, always valid
        return true;
      case 4: // Amenities — optional
        return true;
      default:
        return true;
    }
  }, [currentStep, form, shifts, shiftOverlapInfo]);

  const nextStep = () => {
    if (!isStepValid) {
      if (currentStep === 0) {
        if (!form.nameAr) {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يرجى إدخال اسم الشاليه بالعربي' : 'Please enter chalet name in Arabic', position: 'bottom' });
        } else if (!form.descriptionAr) {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يرجى إدخال وصف الشاليه بالعربي' : 'Please enter description in Arabic', position: 'bottom' });
        }
      } else if (currentStep === 1) {
        if (!form.cityId) {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يرجى اختيار المدينة' : 'Please select a city', position: 'bottom' });
        } else if (!form.phone) {
          setPhoneError(isRTL ? 'يرجى إدخال رقم الهاتف' : 'Please enter phone number');
        } else {
          const err = validatePhoneNumber(form.phone);
          if (err) setPhoneError(err);
        }
      } else if (currentStep === 2) {
        const activeShifts = shifts.filter(s => s.isActive);
        if (activeShifts.length === 0) {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يجب تفعيل شفت واحد على الأقل' : 'Activate at least one shift', position: 'bottom' });
        } else if (shiftOverlapInfo.hasOverlap) {
          Toast.show({ type: 'error', text1: isRTL ? 'تداخل في الأوقات' : 'Time Overlap', text2: isRTL ? shiftOverlapInfo.conflictMsg?.ar || 'يوجد تداخل بين الفترات المفعّلة' : shiftOverlapInfo.conflictMsg?.en || 'Active shifts have overlapping times', position: 'bottom' });
        } else {
          Toast.show({ type: 'error', text1: isRTL ? 'مطلوب' : 'Required', text2: isRTL ? 'يجب تحديد أسعار أكبر من صفر لكل شفت مفعّل' : 'Set prices > 0 for all active shifts', position: 'bottom' });
        }
      }
      return;
    }

    // Internal Amenity sub-steps
    if (currentStep === 4 && amenityCategories) {
      if (currentAmenitySubStep < amenityCategories.length - 1) {
        changeAmenitySubStep(currentAmenitySubStep + 1);
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      changeStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const prevStep = () => {
    // Internal Amenity sub-steps
    if (currentStep === 4 && currentAmenitySubStep > 0) {
      changeAmenitySubStep(currentAmenitySubStep - 1);
      return;
    }

    if (currentStep > 0) {
      changeStep(currentStep - 1);
    }
  };

  const textAlign = 'left' as const;
  const flexDirection = 'row' as const;
  // ── Shift Row ──
  const renderShiftRow = (shift: ShiftData, index: number) => {
    const isActive = shift.isActive;
    const weekdayPrice = shift.pricing.find(p => p.dayOfWeek === 0)?.price || 0;
    const isOverlapping = shiftOverlapInfo.overlappingIndices.includes(index);

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
        style={[styles.shiftCardRow, isActive && styles.shiftCardRowActive, isOverlapping && { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }]}
      >
        <View style={[styles.shiftRowInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Edit & Checkbox */}
          <View style={[styles.shiftActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                openEditShift(index);
              }}
              style={styles.shiftEditBtn}
            >
              <SolarPenBold size={18} color={isOverlapping ? '#D92D20' : '#94A3B8'} />
            </TouchableOpacity>

            <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
              {isActive && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
          </View>

          {/* Name & Price & Time */}
          <View style={[styles.shiftInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 0 }}>
              <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.shiftValueName, isOverlapping && { color: '#D92D20' }]}>
                  {isRTL ? shift.name.ar : shift.name.en}
                  {isActive && weekdayPrice > 0 && (
                    <Text style={styles.shiftPriceText}> ({weekdayPrice.toLocaleString()})</Text>
                  )}
                </Text>
                {isOverlapping && (
                  <View style={{ backgroundColor: '#FEE4E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, color: '#D92D20', fontFamily: 'Alexandria-Bold' }}>
                      {isRTL ? '⚠ تداخل' : '⚠ Overlap'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <SolarClockCircleBold size={11} color={isOverlapping ? '#D92D20' : '#94A3B8'} />
                <Text style={{ fontSize: 10, color: isOverlapping ? '#D92D20' : '#94A3B8', fontFamily: 'Alexandria-Medium' }}>
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
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: Colors.white }}>
          <ChaletProgressTabs
            steps={steps}
            currentStep={currentStep}
            onStepPress={(index) => { if (index <= currentStep) changeStep(index); }}
            isRTL={isRTL}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>

            {/* ═══════════ Step 0: الاسماء ═══════════ */}
            {currentStep === 0 && (
              <>
                <View style={styles.sectionCard}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (عربي)' : 'Chalet Name (AR)'} <Text style={styles.requiredStar}>{isRTL ? '* مطلوب' : '* Required'}</Text></Text>
                    <TextInput
                      style={[styles.input, { textAlign: isRTL ? 'left' : 'right' }]}
                      placeholder={isRTL ? "اسم الشاليه بالعربي" : "e.g. شاليه الورد"}
                      placeholderTextColor="#BCBCBC"
                      value={form.nameAr}
                      onChangeText={(val) => setForm({ ...form, nameAr: val })}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الشاليه (إنجليزي)' : 'Chalet Name (EN)'} <Text style={styles.optionalLabel}>{isRTL ? 'اختياري' : 'Optional'}</Text></Text>
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
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وصف الشاليه (عربي)' : 'Description (AR)'} <Text style={styles.requiredStar}>{isRTL ? '* مطلوب' : '* Required'}</Text></Text>
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
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وصف الشاليه (إنجليزي)' : 'Description (EN)'} <Text style={styles.optionalLabel}>{isRTL ? 'اختياري' : 'Optional'}</Text></Text>
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
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'المدينة' : 'City'} <Text style={styles.requiredStar}>{isRTL ? '* مطلوب' : '* Required'}</Text></Text>
                    <TouchableOpacity
                      style={[styles.input, { flexDirection, alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => citySheetRef.current?.present()}
                      activeOpacity={0.7}
                    >
                      <Text style={{ flex: 1, fontSize: 15, fontFamily: form.cityName ? 'Alexandria-Medium' : 'Alexandria-Regular', color: form.cityName ? '#1E293B' : '#BCBCBC', textAlign }}>
                        {form.cityName || (isRTL ? 'اختر المدينة' : 'Select City')}
                      </Text>
                      <Text style={{ fontSize: 16, color: '#94A3B8' }}>{isRTL ? '‹' : '›'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <TouchableOpacity
                      style={styles.mapPreviewContainer}
                      onPress={() => setShowMap(true)}
                      activeOpacity={0.8}
                    >
                      <AppMap
                        key={`map-${form.latitude}-${form.longitude}`}
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

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'رقم الهاتف' : 'Phone'} <Text style={styles.requiredStar}>{isRTL ? '* مطلوب' : '* Required'}</Text></Text>
                    <TextInput
                      style={[styles.input, { textAlign: 'left' }, phoneError ? { borderColor: '#EF4444' } : null]}
                      placeholder="0777...."
                      placeholderTextColor="#BCBCBC"
                      keyboardType="phone-pad"
                      value={form.phone}
                      onChangeText={(val) => {
                        setForm({ ...form, phone: val });
                        setPhoneError(validatePhoneNumber(val));
                      }}
                    />
                    {phoneError && (
                      <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: 'Alexandria-Medium', marginTop: 6, textAlign: isRTL ? 'right' : 'left' }}>
                        {phoneError}
                      </Text>
                    )}
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
                    <View style={[styles.capacityCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <GuestCounter
                        value={parseInt(form.capacity) || 1}
                        onIncrement={() => setForm({ ...form, capacity: (parseInt(form.capacity || '1') + 1).toString() })}
                        onDecrement={() => setForm({ ...form, capacity: Math.max(1, parseInt(form.capacity || '1') - 1).toString() })}
                      />
                      <View style={[styles.capacityInfo, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                        <Text style={styles.capacityLabel}>{isRTL ? 'سعة الشاليه (الحد الأقصى للزيادة)' : 'Chalet Capacity'}</Text>
                        <Text style={styles.capacitySubLabel}>{isRTL ? 'الحد الكلي المسموح به بعد الزيادة' : 'Maximum total guests allowed'}</Text>
                      </View>
                    </View>

                    {/* Price Capacity Card */}
                    <View style={[styles.capacityCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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

                    {/* Extra Person Price Card */}
                    <View style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: '#F1F5F9',
                      padding: 16,
                      marginTop: 4,
                    }}>
                      <Text style={{ fontSize: 14, fontFamily: 'Alexandria-Bold', color: '#1E293B', textAlign: isRTL ? 'left' : 'right', marginBottom: 4 }}>
                        {isRTL ? 'سعر الشخص الإضافي' : 'Extra Person Price'}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: 'Alexandria-Regular', color: '#94A3B8', textAlign: isRTL ? 'left' : 'right', marginBottom: 12 }}>
                        {isRTL ? 'لكل شخص إضافي فوق سعة المبلغ' : 'Per extra guest above price capacity'}
                      </Text>
                      <View style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
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
                            textAlign: isRTL ? 'right' : 'left',
                            paddingVertical: 14,
                          }}
                          keyboardType="numeric"
                          value={form.extraPersonPrice ? parseInt(form.extraPersonPrice).toLocaleString() : ''}
                          onChangeText={(val) => setForm({ ...form, extraPersonPrice: val.replace(/,/g, '') })}
                          placeholder="25,000"
                          placeholderTextColor="#CBD5E1"
                        />
                      </View>
                    </View>
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
                            { flexDirection: isRTL ? 'row-reverse' : 'row' }
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
                          <View style={[styles.swiperFeatureInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={[styles.swiperFeatureName, { textAlign: isRTL ? 'left' : 'right' }]}>
                              {isRTL ? feature.name?.ar : feature.name?.en}
                            </Text>
                            {/* Orange Badge */}
                            <View style={styles.orangeBadgeContainer}>
                              <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '0deg' }] }]} />
                              <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '30deg' }] }]} />
                              <View style={[styles.orangeBadgeLayer, { transform: [{ rotate: '60deg' }] }]} />
                              <View style={styles.orangeBadgeContent}>
                                <AmenityIcon icon={feature.icon} />
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Section Photos - Improved Design */}
                  <View style={{
                    marginTop: 8,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    padding: 14,
                  }}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, fontFamily: 'Alexandria-Bold', color: '#1E293B', textAlign: isRTL ? 'left' : 'right' }}>
                        {isRTL ? 'صور المرفق' : 'Amenity Photos'}
                      </Text>
                      {(imagesByCategory[amenityCategories[currentAmenitySubStep].id] || []).length > 0 && (
                        <View style={{ backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontFamily: 'Alexandria-Bold', color: Colors.primary }}>
                            {(imagesByCategory[amenityCategories[currentAmenitySubStep].id] || []).length} {isRTL ? 'صور' : 'photos'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4, paddingHorizontal: 2 }} style={{ overflow: 'visible' }}>
                      <TouchableOpacity
                        style={{
                          width: 110,
                          height: 110,
                          borderRadius: 14,
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1.5,
                          borderColor: '#CBD5E1',
                          borderStyle: 'dashed',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        onPress={() => {
                          setUploadingCategoryId(amenityCategories[currentAmenitySubStep].id);
                          imageSourceSheetRef.current?.present();
                        }}
                      >
                        <SolarCameraBold size={26} color="#94A3B8" />
                        <Text style={{ fontSize: 10, fontFamily: 'Alexandria-Medium', color: '#94A3B8' }}>
                          {isRTL ? 'إضافة صورة' : 'Add Photo'}
                        </Text>
                      </TouchableOpacity>
                      {(imagesByCategory[amenityCategories[currentAmenitySubStep].id] || []).map((uri, index) => (
                        <View key={index} style={{ width: 110, height: 110, borderRadius: 14 }}>
                          <Image source={{ uri }} style={{ width: 110, height: 110, borderRadius: 14 }} />
                          <TouchableOpacity
                            style={{
                              position: 'absolute',
                              top: 5,
                              right: 5,
                              backgroundColor: 'rgba(0,0,0,0.55)',
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                            onPress={() => removeImage(index, amenityCategories[currentAmenitySubStep].id)}
                          >
                            <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Alexandria-Bold', marginTop: -2 }}>×</Text>
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
                        onPress={() => changeAmenitySubStep(idx)}
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
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { flexDirection }]}>
          {currentStep > 0 && (
            <SecondaryButton label={isRTL ? 'السابق' : 'Back'} onPress={prevStep} style={{ flex: 1, minWidth: 80 }} />
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
      <BottomSheetModal ref={citySheetRef} index={0} snapPoints={snapPoints} backdropComponent={renderBackdrop} backgroundStyle={{ borderRadius: 28, backgroundColor: '#FFFFFF' }}>
        <BottomSheetView style={styles.citySheetContent}>
          {loadingCities ? (
            <ActivityIndicator color={Colors.primary} style={{ margin: 40 }} />
          ) : (
            <View style={{ width: '100%', flex: 1 }}>
              {/* Header */}
              <View style={styles.citySheetHeader}>
                <View style={styles.citySheetIconBadge}>
                  <SolarMapPointBold size={22} color={Colors.white} />
                </View>
                <Text style={styles.citySheetTitle}>{isRTL ? 'اختر المدينة' : 'Select City'}</Text>
                <Text style={styles.citySheetSubtitle}>{isRTL ? 'اختر مدينة الشاليه' : 'Choose the chalet\'s city'}</Text>
              </View>

              {/* Search */}
              <View style={styles.citySearchContainer}>
                <View style={styles.citySearchIconWrap}>
                  <SolarMagnifierBold size={18} color="#94A3B8" />
                </View>
                <TextInput
                  style={[styles.citySearchInput, { textAlign }]}
                  placeholder={isRTL ? 'ابحث عن مدينة...' : 'Search for a city...'}
                  placeholderTextColor="#94A3B8"
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
                {citySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCitySearch('')} style={styles.citySearchClear}>
                    <Text style={styles.citySearchClearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* City List */}
              <BottomSheetFlatList
                data={filteredCities}
                keyExtractor={(item: any) => item.id}
                style={{ width: '100%' }}
                renderItem={({ item }: { item: any }) => {
                  const isSelected = form.cityId === item.id;
                  const cityName = typeof item.name === 'object' ? (isRTL ? item.name.ar : item.name.en) : item.name;
                  return (
                    <TouchableOpacity
                      style={[styles.cityListItem, isSelected && styles.cityListItemSelected]}
                      onPress={() => handleCitySelect(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.cityListInner, { flexDirection }]}>
                        <View style={[styles.cityListIcon, isSelected && styles.cityListIconSelected]}>
                          <SolarMapPointBold size={18} color={isSelected ? Colors.white : '#94A3B8'} />
                        </View>
                        <Text style={[styles.cityListName, isSelected && styles.cityListNameSelected, { textAlign, flex: 1 }]}>
                          {cityName}
                        </Text>
                        {isSelected && (
                          <View style={styles.cityListCheck}>
                            <Text style={styles.cityListCheckText}>✓</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20, gap: 8 }}
                ListEmptyComponent={
                  <View style={styles.cityListEmpty}>
                    <Text style={styles.cityListEmptyIcon}>🔍</Text>
                    <Text style={styles.cityListEmptyText}>{isRTL ? 'لا توجد نتائج' : 'No results found'}</Text>
                    <Text style={styles.cityListEmptyHint}>{isRTL ? 'جرّب كلمة بحث أخرى' : 'Try a different search term'}</Text>
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
        onSelect={(lat, lng) => setForm(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }))}
        initialLocation={form.latitude && form.longitude ? { latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) } : undefined}
      />

      {/* Edit Shift Modal */}
      <BottomSheetModal
        ref={editShiftSheetRef}
        enableDynamicSizing={true}
        maxDynamicContentSize={800}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 28, backgroundColor: '#FFFFFF' }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 50 }}>
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
              <View>
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

                  <BottomSheetTextInput
                    style={{ flex: 1, fontSize: 16, fontFamily: 'Alexandria-Bold', color: '#1E293B', textAlign: isRTL ? 'right' : 'left' }}
                    value={isRTL ? shift.name.ar : shift.name.en}
                    onChangeText={(val) => updateShiftField(editingShiftIndex, isRTL ? 'nameAr' : 'nameEn', val)}
                    placeholder={isRTL ? 'اسم الفترة' : 'Shift name'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Time Card */}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {isCurrentOverlapping && (
                        <View style={{ backgroundColor: '#FEE4E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, color: '#D92D20', fontFamily: 'Alexandria-Bold' }}>
                            {isRTL ? 'تداخل' : 'Overlap'}
                          </Text>
                        </View>
                      )}
                    </View>
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
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      backgroundColor: '#FEF2F2',
                      borderRadius: 10,
                      padding: 10,
                      marginTop: 14,
                      gap: 8,
                      borderWidth: 1,
                      borderColor: '#FECACA',
                    }}>
                      <SolarInfoCircleBold size={16} color="#DC2626" />
                      <Text style={{ color: '#DC2626', fontSize: 11, fontFamily: 'Alexandria-Medium', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                        {isRTL
                          ? `${shiftOverlapInfo.conflictMsg.ar}. يجب تغيير بقية الأوقات`
                          : `${shiftOverlapInfo.conflictMsg.en}. Change the other shift times`}
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
                  <BottomSheetTextInput
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
              </View>
            );
          })()}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: Spacing.xl },
  footer: {
    flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    overflow: 'visible',
  },
  sectionCard: { backgroundColor: 'transparent', padding: 0, gap: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { fontSize: normalize.font(16), fontFamily: "Alexandria-Black", color: Colors.text.primary, marginBottom: 2 },
  rowInputs: { gap: Spacing.sm },
  inputGroup: { gap: 6 },
  label: { ...Typography.caption, color: Colors.text.primary, fontFamily: "Alexandria-Black", fontSize: normalize.font(14), lineHeight: normalize.font(22) },
  requiredStar: { color: '#EF4444', fontSize: normalize.font(11), fontFamily: 'Alexandria-SemiBold' },
  optionalLabel: { color: '#94A3B8', fontSize: normalize.font(11), fontFamily: 'Alexandria-SemiBold' },
  smallLabel: { ...Typography.caption, color: Colors.text.muted, fontFamily: "Alexandria-SemiBold", fontSize: normalize.font(12) },
  input: {
    height: normalize.height(48), backgroundColor: '#FFFFFF', borderRadius: normalize.radius(12),
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: '#E8E8E8',
    fontSize: normalize.font(15), color: Colors.text.primary, fontFamily: "Alexandria-Regular"
  },
  // City Picker Card
  cityPickerCard: {
    backgroundColor: '#FAFBFC',
    borderRadius: normalize.radius(16),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cityPickerCardSelected: {
    backgroundColor: '#F0F7FF',
    borderColor: Colors.primary + '40',
    borderStyle: 'solid',
  },
  cityPickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cityPickerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityPickerIconSelected: {
    backgroundColor: Colors.primary,
  },
  cityPickerText: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-SemiBold',
    color: '#94A3B8',
  },
  cityPickerTextSelected: {
    color: Colors.text.primary,
    fontFamily: 'Alexandria-Bold',
  },
  cityPickerHint: {
    fontSize: normalize.font(11),
    fontFamily: 'Alexandria-Regular',
    color: '#CBD5E1',
    marginTop: 2,
  },
  cityPickerChevron: {
    fontSize: 24,
    color: '#94A3B8',
    fontFamily: 'Alexandria-Bold',
  },
  textArea: { height: normalize.height(100), paddingTop: 18, textAlignVertical: 'top' },
  // Map
  mapPreviewContainer: {
    height: normalize.height(160), width: '100%', borderRadius: normalize.radius(12),
    overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative'
  },
  miniMap: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: Spacing.sm, left: 0, right: 0, alignItems: 'center' },
  editLocBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(3, 93, 249, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100
  },
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
    fontSize: normalize.font(11), color: Colors.text.primary, fontFamily: "Alexandria-Medium", paddingHorizontal: 2
  },
  // Shift Card Row (Matches Screenshot)
  shiftListContainer: { gap: 12, marginBottom: 16 },
  shiftCardRow: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(16),
    borderWidth: 1.5, borderColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 14
  },
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
    borderRadius: 14, marginTop: 8
  },
  addShiftBtnFullText: { color: Colors.primary, fontFamily: "Alexandria-Bold" },
  // Capacity (Matches Screenshot)
  capacityList: { gap: 12, marginTop: 8 },
  capacityCard: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(16),
    borderWidth: 1.5, borderColor: '#F1F5F9', padding: 16,
    justifyContent: 'space-between', alignItems: 'center'
  },
  capacityInfo: { flex: 1, gap: 2 },
  capacityLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-Bold", color: Colors.text.primary },
  capacitySubLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-Regular", color: Colors.text.muted },
  // Modal Edit
  shiftModalCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, gap: 16 },
  pricingSectionModal: { gap: 12 },
  modalDeleteBtn: { paddingVertical: 16, alignItems: 'center' },
  modalDeleteText: { color: Colors.error, fontFamily: "Alexandria-Bold" },
  // Amenity Categories & Feature Rows
  categorySectionTitle: {
    fontSize: normalize.font(16), fontFamily: "Alexandria-Black", color: Colors.text.primary,
    textAlign: 'center', marginBottom: 8
  },
  featuresList: { gap: 8 },
  featureRow: {
    backgroundColor: '#FFFFFF', borderRadius: normalize.radius(14),
    borderWidth: 1.5, borderColor: '#E8E8E8', paddingHorizontal: 16, paddingVertical: 14
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
    elevation: 3
  },
  featureIconText: { fontSize: normalize.font(20), color: '#FFFFFF' },
  featureName: {
    fontSize: normalize.font(14), fontFamily: "Alexandria-Bold", color: Colors.text.primary,
    flex: 1
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center'
  },
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
    justifyContent: 'center', alignItems: 'center'
  },
  coverBadge: { position: 'absolute', bottom: 6, start: 6, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  coverBadgeText: { color: '#FFFFFF', fontSize: normalize.font(9), fontFamily: "Alexandria-Bold" },
  // Amenity Wizard Progress
  amenityProgressContainer: {
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 24, marginBottom: 12
  },
  amenityDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0'
  },
  amenityDotActive: {
    width: 24, backgroundColor: Colors.primary
  },
  amenityDotPassed: {
    backgroundColor: Colors.primary + '60'
  },
  // Bottom sheets
  sheetContent: { padding: Spacing.lg, alignItems: 'center', flex: 1 },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  modalOptions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.lg },
  modalOption: { alignItems: 'center', gap: Spacing.sm },
  modalIcon: { width: normalize.width(70), height: normalize.width(70), borderRadius: normalize.radius(35), justifyContent: 'center', alignItems: 'center' },
  modalOptionText: { ...Typography.body, fontFamily: "Alexandria-SemiBold" },
  pickerItem: { width: '100%', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemText: { ...Typography.body, fontSize: normalize.font(16), color: Colors.text.primary },
  // City Sheet Premium Styles
  citySheetContent: {
    flex: 1,
    alignItems: 'center',
  },
  citySheetHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  citySheetIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  citySheetTitle: {
    fontSize: normalize.font(18),
    fontFamily: 'Alexandria-Black',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  citySheetSubtitle: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Regular',
    color: '#94A3B8',
  },
  citySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
  },
  citySearchIconWrap: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  citySearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'Alexandria-Regular',
    paddingVertical: 0,
  },
  citySearchClear: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 6,
  },
  citySearchClearText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Alexandria-Bold',
  },
  cityListItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cityListItemSelected: {
    backgroundColor: '#F0F7FF',
    borderColor: Colors.primary + '30',
  },
  cityListInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cityListIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityListIconSelected: {
    backgroundColor: Colors.primary,
  },
  cityListName: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-SemiBold',
    color: Colors.text.primary,
  },
  cityListNameSelected: {
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
  },
  cityListCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityListCheckText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Alexandria-Bold',
  },
  cityListEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  cityListEmptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  cityListEmptyText: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Bold',
    color: Colors.text.primary,
  },
  cityListEmptyHint: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Regular',
    color: '#94A3B8',
  },
  modalSearchContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: "Alexandria-Regular"
  },
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
  }
});
