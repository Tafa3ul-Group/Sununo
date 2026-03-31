import { HeaderSection } from '@/components/header-section';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import { RootState } from '@/store';
import {
  useCreateShiftMutation,
  useDeleteShiftMutation,
  useGetChaletCancellationPoliciesQuery,
  useGetChaletShiftsQuery,
  useGetOwnerChaletDetailsQuery,
  useGetOwnerChaletsQuery,
  useGetShiftPricingQuery,
  useSetChaletPoliciesMutation,
  useUpdateShiftPricingDayMutation,
  useCreateChaletPolicyMutation,
  useDeleteChaletPolicyMutation,
  useUpdateShiftMutation,
  useSetShiftPricingMutation
} from '@/store/api/apiSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
// Re-bundling fix
import { formatPrice } from '@/utils/format';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';

// Sub-component for Shift Pricing to avoid fetching all at once or handle per-shift logic
function ShiftPricingView({ shift, isRTL, onEdit }: { shift: any; isRTL: boolean; onEdit: (data?: any[]) => void }) {
  const { data: pricingResponse, isLoading } = useGetShiftPricingQuery(shift.id);
  const pricing = pricingResponse?.data || pricingResponse;

  const days = isRTL
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (isLoading) return <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 10 }} />;

  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <View>
      <View style={[styles.expandedHeader, { flexDirection, marginBottom: 12 }]}>
        <Text style={styles.expandedTitle}>{isRTL ? 'أسعار أيام الأسبوع' : 'Weekly Pricing'}</Text>
        {pricing && pricing.length > 0 && (
          <TouchableOpacity onPress={() => onEdit(pricing)}>
            <Text style={styles.editText}>{isRTL ? 'تعديل' : 'Edit'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!pricing || !pricing.length ? (
        <View style={styles.emptyPricing}>
          <Text style={styles.emptyPricingText}>
            {isRTL ? 'لا توجد أسعار محددة للأيام' : 'No custom pricing set for days'}
          </Text>
          <TouchableOpacity onPress={() => onEdit(pricing)} style={{ marginTop: 8 }}>
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>{isRTL ? 'إعداد الأسعار' : 'Set Prices'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pricingContainer}>
          {[...pricing].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((item) => {
            const isWeekend = item.dayOfWeek === 5 || item.dayOfWeek === 6;
            return (
              <TouchableOpacity
                key={item.id || item.dayOfWeek}
                style={[styles.pricingCard, isWeekend && styles.weekendCard]}
                onPress={() => onEdit(pricing)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pricingCardDay, isWeekend && styles.weekendText]}>{days[item.dayOfWeek]}</Text>
                <View style={[styles.pricingCardValue, { marginTop: 4 }]}>
                  <Text style={[styles.pricingCardPrice, isWeekend && styles.weekendText, { fontSize: normalize.font(14) }]}>{formatPrice(item.price)}</Text>
                  <Text style={[styles.pricingCardCurrency, isWeekend && styles.weekendText]}>د.ع</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function ShiftsAndPricesScreen() {
  const router = useRouter();
  const { id: initialId } = useLocalSearchParams();
  const [selectedChaletId, setSelectedChaletId] = useState<string | null>(initialId as string || null);
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const { data: ownerChaletsResponse, isLoading: isLoadingOwnerChalets } = useGetOwnerChaletsQuery({});
  const ownerChalets = ownerChaletsResponse?.data || [];

  React.useEffect(() => {
    if (!selectedChaletId && ownerChalets.length > 0) {
      setSelectedChaletId(ownerChalets[0].id);
    }
  }, [ownerChalets, selectedChaletId]);

  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  // Picker States
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Sheet Refs
  const shiftSheetRef = useRef<BottomSheetModal>(null);
  const pricingSheetRef = useRef<BottomSheetModal>(null);
  const policySheetRef = useRef<BottomSheetModal>(null);
  const chaletSelectSheetRef = useRef<BottomSheetModal>(null);

  // Form States
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '08:00', endTime: '23:00', price: '' });
  const [pricingForm, setPricingForm] = useState<any[]>([]);
  const [policyForm, setPolicyForm] = useState<any[]>([]);

  const { data: chaletResponse } = useGetOwnerChaletDetailsQuery(selectedChaletId, { skip: !selectedChaletId });
  const chalet = chaletResponse?.data || chaletResponse;

  const { data: shiftsResponse, isLoading: isLoadingShifts, refetch: refetchShifts } = useGetChaletShiftsQuery(selectedChaletId, { skip: !selectedChaletId });
  const shifts = shiftsResponse?.data || shiftsResponse;

  const { data: policiesResponse, isLoading: isLoadingPolicies } = useGetChaletCancellationPoliciesQuery(selectedChaletId, { skip: !selectedChaletId });
  const policies = policiesResponse?.data || policiesResponse;

  // Reset states when chalet changes
  React.useEffect(() => {
    setSelectedShift(null);
    setExpandedShift(null);
  }, [selectedChaletId]);

  const [createShift, { isLoading: isCreatingShift }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdatingShift }] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();
  const [setShiftPricing, { isLoading: isSettingPricing }] = useSetShiftPricingMutation();
  const [updateShiftPricingDay] = useUpdateShiftPricingDayMutation();
  const [setChaletPolicies, { isLoading: isSavingPolicies }] = useSetChaletPoliciesMutation();
  const [createChaletPolicy] = useCreateChaletPolicyMutation();
  const [deleteChaletPolicy] = useDeleteChaletPolicyMutation();

  // Custom Time Picker State
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const getInitialTimeParts = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const roundedMin = (Math.round(m / 5) * 5) % 60;
    return { hour: hour12, minute: roundedMin.toString().padStart(2, '0'), period };
  };

  const handleTimeSelect = (type: 'start' | 'end', part: 'hour' | 'minute' | 'period', value: string | number) => {
    const currentTime = type === 'start' ? shiftForm.startTime : shiftForm.endTime;
    const { hour, minute, period } = getInitialTimeParts(currentTime);

    let newHour = hour;
    let newMinute = minute;
    let newPeriod = period;

    if (part === 'hour') newHour = value as number;
    if (part === 'minute') newMinute = value as string;
    if (part === 'period') newPeriod = value as string;

    let h24 = newHour % 12;
    if (newPeriod === 'PM') h24 += 12;

    const timeStr = `${h24.toString().padStart(2, '0')}:${newMinute}`;
    setShiftForm({ ...shiftForm, [type === 'start' ? 'startTime' : 'endTime']: timeStr });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isTimeSlotTaken = (h: number, m: string, p: string, type: 'start' | 'end') => {
    if (!shifts || !shifts.length) return false;

    let h24 = h % 12;
    if (p === 'PM') h24 += 12;
    const timeVal = h24 * 60 + parseInt(m);

    // Precise overlap check supporting night shifts (24h modulo)
    const conflict = shifts.find((s: any) => {
      if (selectedShift && s.id === selectedShift.id) return false;
      const sOld = parseInt(s.startTime.split(':')[0]) * 60 + parseInt(s.startTime.split(':')[1]);
      const eOld = parseInt(s.endTime.split(':')[0]) * 60 + parseInt(s.endTime.split(':')[1]);

      const isNight = sOld > eOld;
      const isPointInside = isNight
        ? (timeVal > sOld || timeVal < eOld)
        : (timeVal > sOld && timeVal < eOld);

      if (isPointInside) return true;
      if (type === 'start' && timeVal === sOld) return true;
      if (type === 'end' && timeVal === eOld) return true;

      return false;
    });

    if (conflict) return true;

    // Range-Aware Constraint:
    if (type === 'end') {
      const startVal = parseInt(shiftForm.startTime.split(':')[0]) * 60 + parseInt(shiftForm.startTime.split(':')[1]);
      if (timeVal === startVal) return true;

      const sortedStarts = shifts
        .filter((s: any) => !(selectedShift && s.id === selectedShift.id))
        .map((s: any) => parseInt(s.startTime.split(':')[0]) * 60 + parseInt(s.startTime.split(':')[1]))
        .sort((a: number, b: number) => a - b);

      const nextShiftStart = sortedStarts.find((st: number) => st > startVal);
      if (nextShiftStart && timeVal > nextShiftStart) return true;
      if (!nextShiftStart && sortedStarts.length > 0 && timeVal > sortedStarts[0] && timeVal < startVal) return true;
    }

    return false;
  };

  const conflictShift = useMemo(() => {
    if (!shifts || !shifts.length) return null;
    const [sH, sM] = shiftForm.startTime.split(':').map(Number);
    const [eH, eM] = shiftForm.endTime.split(':').map(Number);
    const sNew = sH * 60 + sM;
    let eNew = eH * 60 + eM;
    if (eNew <= sNew) eNew += 1440;

    return shifts.find((s: any) => {
      if (selectedShift && s.id === selectedShift.id) return false;
      const [sOH, sOM] = s.startTime.split(':').map(Number);
      const [eOH, eOM] = s.endTime.split(':').map(Number);
      const sOld = sOH * 60 + sOM;
      let eOld = eOH * 60 + eOM;
      if (eOld <= sOld) eOld += 1440;

      // Overlap detection
      return (sNew < eOld && eNew > sOld) || 
             (sNew < eOld + 1440 && eNew > sOld + 1440) ||
             (sNew + 1440 < eOld && eNew + 1440 > sOld);
    });
  }, [shiftForm.startTime, shiftForm.endTime, shifts, selectedShift]);

  const isDayFull = useMemo(() => {
    if (!shifts || !shifts.length) return false;

    // Check all 24 hours
    for (let i = 0; i < 24; i++) {
      const hourFree = !shifts.some((s: any) => {
        if (selectedShift && s.id === selectedShift.id) return false;
        const sT = parseInt(s.startTime.split(':')[0]);
        const sE = parseInt(s.endTime.split(':')[0]);
        const isNight = sT > sE;
        return isNight ? (i >= sT || i < sE) : (i >= sT && i < sE);
      });
      if (hourFree) return false;
    }
    return true;
  }, [shifts, selectedShift]);

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);

    let diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    if (diff <= 0) diff += 24 * 60; // Midnight cross
    return diff / 60;
  };

  const duration = useMemo(() => calculateDuration(shiftForm.startTime, shiftForm.endTime), [shiftForm.startTime, shiftForm.endTime]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const handleAddShift = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(null);

    // Find first available slot
    let defaultStart = '08:00';
    let defaultEnd = '13:00';

    if (shifts && shifts.length > 0) {
      const sortedShifts = [...shifts].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      // Try morning
      const morningTaken = sortedShifts.some((s: any) => s.startTime < '10:00' && s.endTime > '08:00');
      if (morningTaken) {
        // Find end of last shift
        const lastShift = sortedShifts[sortedShifts.length - 1];
        const [h, m] = lastShift.endTime.split(':').map(Number);
        if (h < 21) {
          defaultStart = `${(h + 1).toString().padStart(2, '0')}:00`;
          defaultEnd = `${(h + 4).toString().padStart(2, '0')}:00`;
        }
      }
    }

    setShiftForm({ name: '', startTime: defaultStart, endTime: defaultEnd, price: '' });
    shiftSheetRef.current?.present();
  };

  const handleEditShift = (shift: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(shift);

    // Normalize time to HH:mm in case API returns HH:mm:ss
    const normalizeTime = (t: string) => t ? t.substring(0, 5) : '';

    setShiftForm({
      name: isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name),
      startTime: normalizeTime(shift.startTime) || '08:00',
      endTime: normalizeTime(shift.endTime) || '23:00',
      price: '' // Don't pre-fill in Edit Mode
    });
    shiftSheetRef.current?.present();
  };

  const onTimeChange = (event: any, selectedDate?: Date, type: 'start' | 'end' = 'start') => {
    if (event.type === 'dismissed') {
      if (type === 'start') setShowStartTimePicker(false);
      else setShowEndTimePicker(false);
      return;
    }

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      setShiftForm({ ...shiftForm, [type === 'start' ? 'startTime' : 'endTime']: timeStr });
    }

    if (Platform.OS === 'android') {
      if (type === 'start') setShowStartTimePicker(false);
      else setShowEndTimePicker(false);
    }
  };

  const getTimeDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(hours || 0, minutes || 0, 0, 0);
    return d;
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? (isRTL ? 'مساءً' : 'PM') : (isRTL ? 'صباحاً' : 'AM');
    const hours12 = h % 12 || 12;
    return `${hours12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const saveShift = async () => {
    const isNew = !selectedShift;
    const isMissingRequired = !shiftForm.name || !shiftForm.startTime || !shiftForm.endTime || (isNew && !shiftForm.price);
    
    if (isMissingRequired) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى ملء كافة الحقول' : 'Please fill all fields' });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Ensure time is strictly HH:mm
      const startTime = shiftForm.startTime.substring(0, 5);
      const endTime = shiftForm.endTime.substring(0, 5);

      const data = {
        name: { ar: shiftForm.name, en: shiftForm.name },
        startTime,
        endTime,
        isActive: true
      };

      if (selectedShift) {
        await updateShift({ chaletId: selectedChaletId, shiftId: selectedShift.id, data }).unwrap();
        
        // If price is provided and changed, update all days pricing
        if (shiftForm.price) {
          const p = parseInt(shiftForm.price);
          if (!isNaN(p)) {
            const initialPricing = Array.from({ length: 7 }, (_, i) => ({
              dayOfWeek: i,
              price: p
            }));
            await setShiftPricing({
              shiftId: selectedShift.id,
              data: { pricing: initialPricing }
            }).unwrap();
          }
        }
      } else {
        const result = await createShift({ chaletId: selectedChaletId, data }).unwrap();
        const newShiftId = result?.data?.id || result?.id;
        
        // If price is provided, set initial pricing for all days
        if (newShiftId && shiftForm.price) {
          const p = parseInt(shiftForm.price);
          if (!isNaN(p)) {
            const initialPricing = Array.from({ length: 7 }, (_, i) => ({
              dayOfWeek: i,
              price: p
            }));
            await setShiftPricing({
              shiftId: newShiftId,
              data: { pricing: initialPricing }
            }).unwrap();
          }
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم بنجاح' : 'Success' });
      shiftSheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Save Shift Error Details:', JSON.stringify(e, null, 2));

      let displayMsg = e.data?.message || (isRTL ? 'خطأ في الحفظ' : 'Error saving');

      // Localize specific error keys
      if (e.data?.key === 'SHIFT_OVERLAP') {
        const apiMsg = typeof e.data?.message === 'string' ? e.data.message : (Array.isArray(e.data?.message) ? e.data.message[0] : '');

        // Very resilient regex to capture name between quotes
        const match = apiMsg.match(/shift\s+[\\"]*(.*?)[\\"]*\s+\((.*?)-(.*?)\)/i);

        if (match && isRTL) {
          const [_, name, start, end] = match;
          const cleanStart = (start || '').split(':').slice(0, 2).join(':');
          const cleanEnd = (end || '').split(':').slice(0, 2).join(':');

          if (!selectedShift) {
            displayMsg = `توجد فترة متداخلة مسبقاً باسم "${name}" (${cleanStart} - ${cleanEnd}). يرجى تعديلها بدلاً من إضافة فترة جديدة لتجنب التعارض.`;
          } else {
            displayMsg = `هذه الفترة تتداخل مع فترة أخرى باسم "${name}" (من ${cleanStart} إلى ${cleanEnd}).`;
          }
        } else if (isRTL) {
          displayMsg = 'عذراً، لا يمكن الحفظ بسبب تداخل الأوقات مع فترة أخرى مسجلة مسبقاً لهذا الشاليه.';
        }
      }

      Toast.show({
        type: 'error',
        text1: isRTL ? 'فشل الحفظ' : 'Save Failed',
        text2: Array.isArray(displayMsg) ? displayMsg[0] : displayMsg
      });
    }
  };

  const handlePricing = (shift: any, existingPricing?: any[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(shift);

    // Initialize pricing form
    const pricingToUse = existingPricing || shift.pricing;
    if (pricingToUse && pricingToUse.length > 0) {
      setPricingForm(pricingToUse.map((p: any) => ({
        ...p,
        price: p.price ?? shift.price ?? 0
      })));
    } else {
      const initialPricing = Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        price: shift.price ?? 0
      }));
      setPricingForm(initialPricing);
    }
    pricingSheetRef.current?.present();
  };

  const applyToAllDays = (price: string) => {
    const p = parseInt(price) || 0;
    setPricingForm(pricingForm.map(item => ({ ...item, price: p })));
  };

  const adjustPrice = (index: number, amount: number) => {
    const newPricing = [...pricingForm];
    const currentPrice = parseInt(String(newPricing[index].price)) || 0;
    newPricing[index].price = Math.max(0, currentPrice + amount);
    setPricingForm(newPricing);
  };

  const savePricing = async () => {
    if (!selectedShift?.id) {
      Toast.show({ type: 'error', text2: isRTL ? 'خطأ في تحديد الفترة' : 'Invalid shift selection' });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Frontend Verification
      const minPrice = 0.01;
      const invalidDays = pricingForm.filter(item => (parseInt(String(item.price)) || 0) < minPrice);
      if (invalidDays.length > 0) {
        const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const daysOfWeekEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = isRTL ? daysOfWeekAr[invalidDays[0].dayOfWeek] : daysOfWeekEn[invalidDays[0].dayOfWeek];
        
        Toast.show({
          type: 'info',
          text1: isRTL ? 'تنبيه' : 'Minimum Price Required',
          text2: isRTL ? `يجب أن يكون السعر أكبر من صفر ليوم ${dayName}` : `Price for ${dayName} must be greater than zero`
        });
        return;
      }

      // Clean the pricing form to only include required fields
      // NOTE: Backend rejected including 'id' here for bulk replacement.
      const cleanPricing = pricingForm.map(item => ({
        dayOfWeek: item.dayOfWeek,
        price: parseInt(String(item.price)) || 0
      }));

      await setShiftPricing({
        shiftId: selectedShift.id,
        data: { pricing: cleanPricing }
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث الأسعار' : 'Pricing updated' });
      pricingSheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Save Pricing Error:', e);
      
      const errorMessage = e.data?.message;
      let displayMsg = isRTL ? 'فشل في حفظ الأسعار، يرجى التأكد من المبالغ المدخلة' : 'Failed to save pricing, please check your values';
      
      if (Array.isArray(errorMessage)) {
        displayMsg = errorMessage[0];
      } else if (typeof errorMessage === 'string') {
        displayMsg = errorMessage;
      }

      Toast.show({
        type: 'error',
        text1: isRTL ? 'فشل الحفظ' : 'Update Failed',
        text2: displayMsg
      });
    }
  };

  const handleUpdateSingleDay = async (index: number) => {
    if (!selectedShift?.id) {
       Toast.show({ type: 'error', text2: isRTL ? 'خطأ في تحديد الفترة' : 'Invalid shift selection' });
       return;
    }

    const item = pricingForm[index];
    if (!item.id) {
       // If no ID, we must use the bulk update or the backend might create it
       // But the image shows PATCH requires pricingId
       Toast.show({ type: 'error', text2: isRTL ? 'يجب استخدام الحفظ العام لهذه الفترة' : 'Must use general save for this day' });
       return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const price = parseInt(String(item.price)) || 0;
      if (price < 0.01) {
        Toast.show({ type: 'info', text1: isRTL ? 'تنبيه' : 'Invalid Price', text2: isRTL ? 'يجب أن يكون السعر أكبر من صفر' : 'Price must be greater than zero' });
        return;
      }

      await updateShiftPricingDay({
        shiftId: selectedShift.id,
        pricingId: item.id,
        price: price
      }).unwrap();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ 
        type: 'success', 
        text1: isRTL ? 'تم تحديث السعر' : 'Price updated',
        text2: isRTL ? `تم حفظ سعر يوم ${['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][item.dayOfWeek]}` : `Price for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.dayOfWeek]} saved`
      });
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ في التحديث' : 'Update failed' });
    }
  };

  // Refund Policy (Cancellation)
  const handleEditPolicies = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const existingPolicies = policies || [];
    setPolicyForm(existingPolicies.length > 0 ? existingPolicies.map((p: any) => ({ ...p })) : [{ daysBeforeBooking: 7, penaltyPercentage: 50 }]);
    policySheetRef.current?.present();
  };

  const addPolicyTier = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPolicyForm([...policyForm, { daysBeforeBooking: 1, penaltyPercentage: 100 }]);
  };

  const removePolicyTier = async (index: number) => {
    const policy = policyForm[index];
    if (policy.id) {
       // Live delete if it exists on server
       try {
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
         await deleteChaletPolicy({ chaletId: selectedChaletId, policyId: policy.id }).unwrap();
         Toast.show({ type: 'success', text1: isRTL ? 'تم الحذف' : 'Deleted' });
       } catch (e) {
         Toast.show({ type: 'error', text1: isRTL ? 'خطأ في الحذف' : 'Delete failed' });
         return;
       }
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPolicyForm(policyForm.filter((_, i) => i !== index));
  };

  const updatePolicyTier = (index: number, field: string, value: string) => {
    const newForm = [...policyForm];
    newForm[index] = { ...newForm[index], [field]: parseInt(value) || 0 };
    setPolicyForm(newForm);
  };

  const savePolicies = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Basic validation
      if (policyForm.some(p => p.daysBeforeBooking < 0 || p.penaltyPercentage < 0 || p.penaltyPercentage > 100)) {
        Toast.show({ type: 'error', text1: isRTL ? 'خطأ في المدخلات' : 'Input Error' });
        return;
      }

      const cleanPolicies = policyForm.map(p => ({
        daysBeforeBooking: p.daysBeforeBooking,
        penaltyPercentage: p.penaltyPercentage
      }));

      await setChaletPolicies({
        chaletId: selectedChaletId,
        data: { policies: cleanPolicies }
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم التحديث' : 'Refund policy updated' });
      policySheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(e);
      const errorMsg = e.data?.message || (isRTL ? 'خطأ في الحفظ' : 'Error saving');
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg
      });
    }
  };

  const confirmDeleteShift = (shiftId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      isRTL ? 'حذف الفترة' : 'Delete Shift',
      isRTL ? 'هل أنت متأكد من حذف هذه الفترة؟' : 'Are you sure you want to delete this shift?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteShift({ chaletId: selectedChaletId, shiftId }).unwrap();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }
        }
      ]
    );
  };

  if (isLoadingShifts || isLoadingPolicies) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const chaletName = isRTL ? (chalet?.name?.ar || chalet?.name) : (chalet?.name?.en || chalet?.name);

  const renderShiftActions = (shift: any, shiftName: string) => {
    return (
      <View style={[styles.swipeActions, { flexDirection: isRTL ? 'row' : 'row' }]}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#F5F5F7' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleEditShift(shift);
          }}
        >
          <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
          <Text style={[styles.swipeActionText, { color: Colors.text.primary }]}>{isRTL ? 'تعديل' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#FFF5F5' }]}
          onPress={() => confirmDeleteShift(shift.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.swipeActionText, { color: '#FF3B30' }]}>{isRTL ? 'حذف' : 'Delete'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSwitchChalet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    chaletSelectSheetRef.current?.present();
  };

  if (!selectedChaletId && ownerChalets.length === 0 && !isLoadingOwnerChalets) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <HeaderSection title={isRTL ? 'الفترات والأسعار' : 'Shifts & Prices'} showBackButton />
        <View style={styles.centeredContent}>
          <Ionicons name="home-outline" size={64} color={Colors.primary + '20'} />
          <Text style={styles.emptyTextLarge}>
            {isRTL ? 'لا يوجد لديك شاليهات مضافة حالياً' : 'You don\'t have any chalets added yet'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <HeaderSection
          title={chaletName || (isRTL ? 'اختر الشاليه' : 'Select Chalet')}
          subtitle={isRTL ? (ownerChalets.length > 1 ? 'اضغط للتبديل بين الشاليهات' : 'إدارة الفترات والأسعار') : (ownerChalets.length > 1 ? 'Tap to switch chalets' : 'Manage shifts & prices')}
          showBackButton={true}
          showSearch={false}
          showCategories={false}
          extraIcon={ownerChalets.length > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-down" size={16} color={Colors.text.muted} style={{ marginRight: 4 }} />
              <Ionicons name="home-outline" size={20} color={Colors.primary} />
            </View>
          ) : <Ionicons name="refresh" size={18} color={Colors.primary} />}
          onExtraIconPress={() => ownerChalets.length > 1 ? handleSwitchChalet() : refetchShifts()}
        />

        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Shifts & Pricing Section */}
            <View style={styles.section}>
              <View style={[styles.sectionHeader, { flexDirection }]}>
                <View style={[styles.row, { flex: 1 }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color={Colors.primary} />
                  <Text style={[styles.sectionTitle, { textAlign, marginLeft: 8 }]}>{isRTL ? 'الفترات والأسعار' : 'Shifts & Pricing'}</Text>
                </View>
              </View>

              {isDayFull && (
                <View style={[styles.fullDayWarning, { marginHorizontal: 0, marginBottom: 16 }]}>
                  <Ionicons name="lock-closed" size={24} color="#FF3B30" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fullDayTitle}>{isRTL ? 'اليوم ممتلئ تماماً' : 'No More Shifts Possible'}</Text>
                    <Text style={styles.fullDayText}>
                      {isRTL ? 'لقد قمت بتوزيع كافة ساعات اليوم الـ 24 على الفترات الحالية.' : 'All 24 hours of the day have already been assigned to existing shifts.'}
                    </Text>
                  </View>
                </View>
              )}

              {shifts && shifts.length > 0 ? (
                shifts.map((shift: any) => {
                  const isExpanded = expandedShift === shift.id;
                  const shiftName = isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name);

                  return (
                    <Swipeable
                      key={shift.id}
                      renderRightActions={!isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                      renderLeftActions={isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      friction={2}
                      containerStyle={styles.swipeableContainer}
                    >
                      <View style={styles.cardFlat}>
                        <TouchableOpacity
                          style={[styles.cardHeader, { flexDirection }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setExpandedShift(isExpanded ? null : shift.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.cardIconContainer, { marginLeft: isRTL ? 12 : 0, marginRight: isRTL ? 0 : 12 }]}>
                            <View style={styles.iconCircle}>
                              <Ionicons
                                name={shift.startTime?.includes('1') ? "moon" : "sunny"}
                                size={20}
                                color={Colors.primary}
                              />
                            </View>
                          </View>

                          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                            <Text style={styles.cardTitle}>{shiftName}</Text>
                            <View style={[styles.timeBadge, { flexDirection, marginTop: 6 }]}>
                              <Ionicons name="time" size={14} color={Colors.primary} style={{ marginHorizontal: 2 }} />
                              <Text style={styles.timeBadgeText}>
                                {formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.row, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                            <TouchableOpacity
                              style={styles.editCardBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleEditShift(shift);
                              }}
                            >
                              <Ionicons name="pencil" size={16} color={Colors.primary} />
                            </TouchableOpacity>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color={Colors.text.muted}
                            />
                          </View>
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <ShiftPricingView shift={shift} isRTL={isRTL} onEdit={(data) => handlePricing(shift, data)} />
                          </View>
                        )}
                      </View>
                    </Swipeable>
                  );
                })
              ) : (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="calendar-outline" size={48} color={Colors.primary + '40'} />
                  </View>
                  <Text style={styles.emptyTitle}>{isRTL ? 'لا توجد فترات' : 'No Shifts Yet'}</Text>
                  <Text style={styles.emptyText}>
                    {isRTL
                      ? 'ابدأ بإضافة فترات عمل لشاليهك لتحديد الأوقات والأسعار المتاحة للحجز'
                      : 'Add working shifts to your chalet to define booking times and prices'}
                  </Text>
                  {!isDayFull && (
                    <TouchableOpacity style={styles.addInlineBtn} onPress={handleAddShift}>
                      <Ionicons name="add" size={20} color="#fff" style={{ marginHorizontal: 4 }} />
                      <Text style={styles.addInlineText}>{isRTL ? 'أضف فترة جديدة' : 'Add New Shift'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {shifts && shifts.length > 0 && !isDayFull && (
                <View style={{ marginTop: 8 }}>
                  <SecondaryButton
                    label={isRTL ? 'إضافة فترة (Shift) إضافية' : 'Add another shift'}
                    onPress={handleAddShift}
                    icon="plus"
                    isActive={false}
                    style={{ width: '100%' }}
                  />
                </View>
              )}
            </View>

            {/* Refund Policy Section */}
            <View style={[styles.section, { marginTop: Spacing.xl }]}>
              <View style={[styles.sectionHeader, { flexDirection }]}>
                <View style={[styles.row, { flex: 1 }]}>
                  <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
                  <Text style={[styles.sectionTitle, { textAlign, marginLeft: 8 }]}>{isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}</Text>
                </View>
              </View>

              {policies && policies.length > 0 ? (
                <TouchableOpacity 
                   style={styles.cardFlat} 
                   activeOpacity={0.8}
                   onPress={handleEditPolicies}
                >
                  <View style={{ padding: 20 }}>
                    {policies.map((p: any, i: number) => (
                      <View key={p.id || i} style={[styles.row, { marginBottom: 12, alignItems: 'center' }]}>
                        <View style={[styles.iconCircleSmall, { backgroundColor: Colors.primary + '10' }]}>
                          <Ionicons name="time-outline" size={14} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                          <Text style={styles.detailTextLarge}>
                            {isRTL 
                              ? `قبل ${p.daysBeforeBooking} أيام أو أكثر` 
                              : `${p.daysBeforeBooking} days or more`}
                          </Text>
                          <Text style={styles.detailLabelSmall}>
                            {isRTL 
                                ? `خصم مالي بقيمة ${p.penaltyPercentage}%` 
                                : `Penalty amount: ${p.penaltyPercentage}%`}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                      </View>
                    ))}
                    
                    <View style={[styles.sectionDivider, { marginVertical: 12, marginBottom: 8 }]} />
                    <View style={[styles.row, { justifyContent: 'center' }]}>
                      <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>
                        {isRTL ? 'تعديل سياسة الاسترجاع' : 'Edit Refund Policy'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.emptyCard} onPress={handleEditPolicies}>
                  <Ionicons name="receipt-outline" size={36} color={Colors.primary + '40'} />
                  <Text style={styles.emptyTitle}>{isRTL ? 'لا توجد سياسة مضافة' : 'No Policy Added'}</Text>
                  <Text style={styles.emptyText}>
                    {isRTL 
                      ? 'حدد القواعد المالية لعمليات إلغاء الحجز من قبل العملاء' 
                      : 'Define financial rules for booking cancellations by customers'}
                  </Text>
                  <View style={[styles.addInlineBtn, { marginTop: 12 }]}>
                    <Text style={styles.addInlineText}>{isRTL ? 'إضافة سياسة' : 'Add Policy'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>
        </View>

        {/* Add Shift Bottom Sheet */}
        <BottomSheetModal
          ref={shiftSheetRef}
          index={0}
          snapPoints={['50%', '75%']}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 24 }}
        >
          <BottomSheetView style={styles.sheetContent}>
            <Text style={styles.modalTitle}>{selectedShift ? (isRTL ? 'تعديل الفترة' : 'Edit Shift') : (isRTL ? 'إضافة فترة جديدة' : 'Add New Shift')}</Text>
            <View style={styles.formContainer}>
              {(!shiftForm.name || (!selectedShift && !shiftForm.price)) && (
                <View style={[styles.fullDayWarning, { backgroundColor: '#FFF9F9', borderColor: '#FFE0E0', padding: 12, marginBottom: 16 }]}>
                  <Ionicons name="information-circle-outline" size={20} color="#FF3B30" />
                  <Text style={{ fontSize: 13, color: '#FF3B30', fontWeight: '700', marginLeft: 8 }}>
                    {isRTL ? 'يرجى ملء الاسم والسعر' : 'Please fill the Name & Price'}
                  </Text>
                </View>
              )}
              {isDayFull && !selectedShift && (
                <View style={styles.fullDayWarning}>
                  <Ionicons name="lock-closed" size={24} color="#FF3B30" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fullDayTitle}>{isRTL ? 'اليوم ممتلئ تماماً' : 'Day is Fully Booked'}</Text>
                    <Text style={styles.fullDayText}>
                      {isRTL ? 'لقد تم توزيع كافة ساعات اليوم على الفترات الحالية. لا توجد مساحة لإضافة فترة جديدة.' : 'All 24 hours are already allocated to existing shifts. No space left for new entries.'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Visual 24h Timeline */}
              <View style={[styles.timelineContainer, isDayFull && { borderColor: '#FF3B3040' }]}>
                <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
                  <Text style={styles.timelineLabel}>{isRTL ? 'توزيع ساعات اليوم الـ 24' : '24h Daily Distribution'}</Text>
                  <View style={[styles.row, { gap: 8 }]}>
                    <View style={[styles.legendItem, { backgroundColor: '#34C75940' }]} />
                    <Text style={styles.timelineInfo}>{isRTL ? 'متاح' : 'Free'}</Text>
                    <View style={[styles.legendItem, { backgroundColor: '#FF3B30' }]} />
                    <Text style={styles.timelineInfo}>{isRTL ? 'مشغول' : 'Busy'}</Text>
                  </View>
                </View>
                <View style={styles.timelineBar}>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const isOccupied = shifts?.some((s: any) => {
                      if (selectedShift && s.id === selectedShift.id) return false;
                      const sT = parseInt(s.startTime.split(':')[0]);
                      const sE = parseInt(s.endTime.split(':')[0]);

                      const isNight = sT > sE;
                      return isNight ? (i >= sT || i < sE) : (i >= sT && i < sE);
                    });

                    const nS = parseInt(shiftForm.startTime.split(':')[0]);
                    const nE = parseInt(shiftForm.endTime.split(':')[0]);

                    const isNewInNight = nS > nE;
                    const isNew = isNewInNight ? (i >= nS || i < nE) : (i >= nS && i < nE);

                    return (
                      <View
                        key={i}
                        style={[
                          styles.timelineSegment,
                          isOccupied && styles.segmentOccupied,
                          isNew && styles.segmentNew,
                          i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                          i === 23 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 }
                        ]}
                      />
                    );
                  })}
                </View>
                <View style={[styles.timelineTicks, { flexDirection }]}>
                  {[0, 6, 12, 18, 24].map((t) => (
                    <Text key={t} style={styles.timelineTick}>{t}</Text>
                  ))}
                </View>
              </View>

              <Text style={[styles.label, { textAlign, marginTop: 16 }]}>{isRTL ? 'اسم الفترة' : 'Shift Name'}</Text>
              <BottomSheetTextInput
                style={[styles.input, { textAlign }]}
                placeholder={isRTL ? 'مثلاً: الفترة الصباحية' : 'e.g. Morning Shift'}
                value={shiftForm.name}
                onChangeText={t => setShiftForm({ ...shiftForm, name: t })}
              />

              {!selectedShift && (
                <>
                  <Text style={[styles.label, { textAlign, marginTop: 16 }]}>{isRTL ? 'السعر الأساسي (لكل الأيام)' : 'Base Price (all days)'}</Text>
                  <View style={[styles.row, { position: 'relative' }]}>
                    <BottomSheetTextInput
                      style={[styles.input, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={shiftForm.price}
                      onChangeText={t => setShiftForm({ ...shiftForm, price: t })}
                    />
                    <Text style={{ position: 'absolute', right: isRTL ? undefined : 16, left: isRTL ? 16 : undefined, top: 12, color: Colors.text.muted, fontWeight: '700' }}>
                      {isRTL ? 'د.ع' : 'IQD'}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.timeSelectionCard}>
                <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                  <Text style={styles.cardTitleSmall}>{isRTL ? 'تحديد الوقت' : 'Time Selection'}</Text>
                  <View style={styles.durationBadge}>
                    <Ionicons name="hourglass-outline" size={14} color={Colors.primary} />
                    <Text style={styles.durationText}>
                      {isRTL ? `المدة: ${duration} ساعة` : `Duration: ${duration}h`}
                    </Text>
                  </View>
                </View>
                <View style={[styles.timeSelectRow, { flexDirection }]}>
                  {/* Start Time */}
                  <TouchableOpacity
                    style={[styles.timeInputCol, activePicker === 'start' && styles.activeTimeCol]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActivePicker(activePicker === 'start' ? null : 'start');
                    }}
                  >
                    <View style={[styles.row, { marginBottom: 6, justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Ionicons name="sunny" size={16} color={Colors.primary} style={{ marginHorizontal: 4 }} />
                      <Text style={styles.timeLabelText}>{isRTL ? 'وقت البدء' : 'Start Time'}</Text>
                    </View>
                    <View style={styles.customTimeDisplay}>
                      <Text style={styles.customTimeText}>{formatTime12h(shiftForm.startTime)}</Text>
                      <Ionicons name={activePicker === 'start' ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.timeSeparator}>
                    <Ionicons name="arrow-forward" size={14} color={Colors.text.muted} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
                  </View>

                  {/* End Time */}
                  <TouchableOpacity
                    style={[styles.timeInputCol, activePicker === 'end' && styles.activeTimeCol]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActivePicker(activePicker === 'end' ? null : 'end');
                    }}
                  >
                    <View style={[styles.row, { marginBottom: 6, justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Ionicons name="moon" size={16} color="#5856D6" style={{ marginHorizontal: 4 }} />
                      <Text style={styles.timeLabelText}>{isRTL ? 'وقت الانتهاء' : 'End Time'}</Text>
                    </View>
                    <View style={styles.customTimeDisplay}>
                      <Text style={[styles.customTimeText, { color: '#5856D6' }]}>{formatTime12h(shiftForm.endTime)}</Text>
                      <Ionicons name={activePicker === 'end' ? "chevron-up" : "chevron-down"} size={14} color="#5856D6" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Custom Wheel-like Picker */}
                {activePicker && (
                  <View style={styles.customPickerMain}>
                    <View style={[styles.pickerWheelsRow, { flexDirection }]}>
                      {/* Hours */}
                      <View style={styles.wheelCol}>
                        <ScrollView showsVerticalScrollIndicator={false} snapToInterval={40} contentContainerStyle={{ paddingVertical: 40 }}>
                          {hours.map(h => {
                            const parts = getInitialTimeParts(activePicker === 'start' ? shiftForm.startTime : shiftForm.endTime);
                            const selected = parts.hour === h;
                            const taken = isTimeSlotTaken(h, parts.minute, parts.period, activePicker as 'start' | 'end');

                            return (
                              <TouchableOpacity
                                key={h}
                                style={[styles.wheelItem, taken && styles.wheelItemTaken]}
                                onPress={() => handleTimeSelect(activePicker as 'start' | 'end', 'hour', h)}
                              >
                                <Text style={[styles.wheelItemText, selected && styles.wheelItemSelected, taken && styles.wheelItemTextTaken]}>{h}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Minutes */}
                      <View style={styles.wheelCol}>
                        <ScrollView showsVerticalScrollIndicator={false} snapToInterval={40} contentContainerStyle={{ paddingVertical: 40 }}>
                          {minutes.map(m => {
                            const parts = getInitialTimeParts(activePicker === 'start' ? shiftForm.startTime : shiftForm.endTime);
                            const selected = parts.minute === m;
                            const taken = isTimeSlotTaken(parts.hour, m, parts.period, activePicker as 'start' | 'end');

                            return (
                              <TouchableOpacity
                                key={m}
                                style={[styles.wheelItem, taken && styles.wheelItemTaken]}
                                onPress={() => handleTimeSelect(activePicker as 'start' | 'end', 'minute', m)}
                              >
                                <Text style={[styles.wheelItemText, selected && styles.wheelItemSelected, taken && styles.wheelItemTextTaken]}>{m}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Period */}
                      <View style={styles.wheelColCompact}>
                        {['AM', 'PM'].map(p => {
                          const parts = getInitialTimeParts(activePicker === 'start' ? shiftForm.startTime : shiftForm.endTime);
                          const selected = parts.period === p;
                          const taken = isTimeSlotTaken(parts.hour, parts.minute, p, activePicker as 'start' | 'end');
                          const arPeriod = p === 'AM' ? 'صباحاً' : 'مساءً';

                          return (
                            <TouchableOpacity
                              key={p}
                              style={[styles.periodBtn, selected && styles.periodBtnActive, taken && styles.periodBtnTaken]}
                              onPress={() => handleTimeSelect(activePicker, 'period', p)}
                            >
                              <Text style={[styles.periodBtnText, selected && styles.periodBtnTextActive, taken && styles.periodBtnTextTaken]}>{isRTL ? arPeriod : p}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.closePickerBtn} onPress={() => setActivePicker(null)}>
                      <Text style={styles.closePickerText}>{isRTL ? 'تعيين الوقت' : 'Set Time'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 24 }, (isCreatingShift || isUpdatingShift) && styles.saveBtnDisabled]}
                onPress={saveShift}
                disabled={isCreatingShift || isUpdatingShift}
              >
                {(isCreatingShift || isUpdatingShift) ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isRTL ? 'حفظ' : 'Save'}</Text>}
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        {/* Pricing Matrix Bottom Sheet */}
        <BottomSheetModal
          ref={pricingSheetRef}
          index={0}
          snapPoints={['90%']}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32, backgroundColor: '#F8F9FB' }}
        >
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.sheetHeaderCompact}>
              <View style={styles.sheetHeaderHandle} />
              <Text style={styles.modalTitleCompact}>{isRTL ? 'إعداد أسعار الأسبوع' : 'Weekly Pricing Setup'}</Text>
              {selectedShift && (
                <Text style={{ fontSize: normalize.font(13), color: Colors.text.muted, marginTop: 4, fontWeight: '600' }}>
                  {isRTL ? (selectedShift.name?.ar || selectedShift.name) : (selectedShift.name?.en || selectedShift.name)}
                </Text>
              )}
            </View>

            {pricingForm.some(item => (parseInt(String(item.price)) || 0) < 0.01) && (
              <View style={styles.matrixWarning}>
                <Ionicons name="alert-circle" size={18} color="#FF9500" />
                <Text style={styles.matrixWarningText}>
                  {isRTL ? 'يجب تحديد سعر صالح لأيام الأسبوع المتبقية' : 'A valid price must be set for all week days'}
                </Text>
              </View>
            )}

            <View style={styles.quickApplyCard}>
              <View style={[styles.quickApplyRow, { flexDirection }]}>
                <View style={styles.quickApplyIcon}>
                  <Ionicons name="flash" size={18} color={Colors.white} />
                </View>
                <View style={{ flex: 1, marginRight: isRTL ? 12 : 0, marginLeft: isRTL ? 0 : 12 }}>
                  <Text style={styles.quickApplyLabel}>{isRTL ? 'تطبيق سعر موحد للكل' : 'Apply same price to all'}</Text>
                  <View style={[styles.rowInputs, { flexDirection, marginTop: 8 }]}>
                    <BottomSheetTextInput
                      style={[styles.quickApplyInput, { textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder="0"
                      keyboardType="numeric"
                      onChangeText={applyToAllDays}
                    />
                    <Text style={styles.quickApplyCurrency}>{isRTL ? 'د.ع' : 'IQD'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <BottomSheetScrollView
              style={{ flex: 1, marginTop: 12 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {pricingForm.map((item, index) => {
                const daysOfWeek = isRTL
                  ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
                  : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const isWeekend = item.dayOfWeek === 5 || item.dayOfWeek === 6;
                const isInvalid = (parseInt(String(item.price)) || 0) < 0.01;

                return (
                  <View key={index} style={[styles.pricingRow, isWeekend && styles.pricingRowWeekend, isInvalid && styles.pricingRowInvalid]}>
                    <View style={[styles.dayInfo, { flexDirection }]}>
                      <View style={[styles.dayIndicator, isWeekend && styles.dayIndicatorWeekend]} />
                      <Text style={[styles.dayNameText, isWeekend && styles.dayNameTextWeekend]}>{daysOfWeek[item.dayOfWeek]}</Text>
                    </View>

                    <View style={[styles.priceActions, { flexDirection }]}>
                      <TouchableOpacity
                        style={[styles.adjustBtn, { backgroundColor: '#FFEEED' }]}
                        onPress={() => adjustPrice(index, -25000)}
                      >
                        <Ionicons name="remove" size={18} color="#FF4D4D" />
                      </TouchableOpacity>

                      <View style={styles.priceInputWrapper}>
                        <BottomSheetTextInput
                          style={[styles.pricingRowInput, { textAlign: 'center' }]}
                          keyboardType="numeric"
                          value={String(item.price ?? '')}
                          onChangeText={t => {
                            const newPricing = [...pricingForm];
                            newPricing[index].price = parseInt(t) || 0;
                            setPricingForm(newPricing);
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.adjustBtn, { backgroundColor: '#EBF5FF' }]}
                        onPress={() => adjustPrice(index, 25000)}
                      >
                        <Ionicons name="add" size={18} color={Colors.primary} />
                      </TouchableOpacity>

                      {item.id && (
                        <TouchableOpacity
                          style={styles.saveSingleBtn}
                          onPress={() => handleUpdateSingleDay(index)}
                        >
                          <Ionicons name="cloud-upload-outline" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </BottomSheetScrollView>

            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={styles.saveBtnLarge}
                onPress={savePricing}
                disabled={isSettingPricing}
              >
                {isSettingPricing ? <ActivityIndicator color="#fff" /> : (
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginHorizontal: 8 }} />
                    <Text style={styles.saveBtnTextLarge}>{isRTL ? 'حفظ الأسعار الجديدة' : 'Save New Pricing'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetModal>

        {/* Chalet Selection Bottom Sheet */}
        <BottomSheetModal
          ref={chaletSelectSheetRef}
          index={0}
          snapPoints={['50%', '70%']}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32 }}
        >
          <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={styles.sheetHeaderCompact}>
              <View style={styles.sheetHeaderHandle} />
              <Text style={styles.modalTitleCompact}>{isRTL ? 'اختر الشاليه' : 'Select Chalet'}</Text>
            </View>

            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={{ gap: 12 }}>
                {ownerChalets.map((item: any) => {
                  const name = isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name);
                  const active = item.id === selectedChaletId;
                  const mainImage = item.images?.[0]?.url;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.chaletSelectCard, active && { borderColor: Colors.primary, borderWidth: 1.5 }]}
                      onPress={() => {
                        setSelectedChaletId(item.id);
                        chaletSelectSheetRef.current?.dismiss();
                      }}
                    >
                      <View style={styles.chaletSelectImageWrap}>
                        {mainImage ? (
                          <Image source={{ uri: mainImage }} style={styles.chaletSelectImage} />
                        ) : (
                          <MaterialCommunityIcons name="home-city" size={24} color={Colors.primary} />
                        )}
                      </View>
                      <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <Text style={[styles.chaletSelectName, active && { color: Colors.primary }]}>{name}</Text>
                        <Text style={styles.chaletSelectLoc}>{isRTL ? item.region?.name : item.region?.enName}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BottomSheetScrollView>
          </BottomSheetView>
        </BottomSheetModal>

      </SafeAreaView>
      {/* Cancellation Policy Bottom Sheet */}
      <BottomSheetModal
        ref={policySheetRef}
        index={0}
        snapPoints={['85%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 32, backgroundColor: '#F8F9FB' }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <View style={styles.sheetHeaderCompact}>
            <View style={styles.sheetHeaderHandle} />
            <Text style={styles.modalTitleCompact}>{isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}</Text>
          </View>

          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.label, { textAlign, opacity: 0.7 }]}>
                {isRTL ? 'حدد قواعد الإلغاء ونسبة الخصم (سياسة الاسترجاع)' : 'Define cancellation rules and penalty (Refund Policy)'}
              </Text>
            </View>

            {policyForm.map((policy, index) => (
              <View key={index} style={styles.policyFormCard}>
                <View style={[styles.rowInputs, { flexDirection, justifyContent: 'space-between', marginBottom: 16 }]}>
                  <Text style={{ fontWeight: '700', color: Colors.primary }}>{isRTL ? `قاعدة رقم ${index + 1}` : `Rule #${index + 1}`}</Text>
                  {policyForm.length > 1 && (
                    <TouchableOpacity onPress={() => removePolicyTier(index)} style={styles.policyDeleteBtn}>
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={[styles.rowInputs, { flexDirection }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.policyInputLabel, { textAlign }]}>{isRTL ? 'قبل الحجز بـ (أيام)' : 'Days Before Booking'}</Text>
                    <View style={[styles.compactInput, { flexDirection }]}>
                      <BottomSheetTextInput
                        style={[styles.policyNumberInput, { textAlign }]}
                        keyboardType="numeric"
                        value={String(policy.daysBeforeBooking)}
                        onChangeText={(v) => updatePolicyTier(index, 'daysBeforeBooking', v)}
                      />
                      <Text style={{ color: Colors.text.muted, fontSize: 12 }}>{isRTL ? 'يوم' : 'Days'}</Text>
                    </View>
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.policyInputLabel, { textAlign }]}>{isRTL ? 'نسبة الخصم' : 'Penalty Percentage'}</Text>
                    <View style={[styles.compactInput, { flexDirection }]}>
                      <BottomSheetTextInput
                        style={[styles.policyNumberInput, { textAlign }]}
                        keyboardType="numeric"
                        value={String(policy.penaltyPercentage)}
                        onChangeText={(v) => updatePolicyTier(index, 'penaltyPercentage', v)}
                      />
                      <Text style={{ color: Colors.text.muted, fontSize: 14 }}>%</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addTierBtn} onPress={addPolicyTier}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addTierText}>{isRTL ? 'إضافة قاعدة جديدة' : 'Add New Rule'}</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>

          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.saveBtnLarge}
              onPress={savePolicies}
              disabled={isSavingPolicies}
            >
              {isSavingPolicies ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveBtnTextLarge}>{isRTL ? 'حفظ سياسة الاسترجاع' : 'Save Refund Policy'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  swipeLeftContainer: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActions: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  swipeAction: {
    width: 74,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  swipeActionText: {
    fontSize: normalize.font(10),
    fontWeight: '600',
  },
  swipeableContainer: {
    marginBottom: 0,
  },
  cardFlat: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    shadowColor: Colors.primary,
    shadowOpacity: 0.03,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32, // Added more space at the top
    paddingBottom: 150, // More breathing room at the bottom
  },
  section: {
    marginBottom: 32, // Increased spacing between sections
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '800', // Making it more bold for prominence
    fontSize: normalize.font(18),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  cardIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addShiftHeaderBtn: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addShiftHeaderText: {
    fontSize: normalize.font(13),
    color: Colors.primary,
    fontWeight: '700',
  },
  editCardBtn: {
    padding: 8,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    marginRight: 10,
  },
  timeBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeBadgeText: {
    fontSize: normalize.font(13),
    color: Colors.primary,
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.primary,
  },
  priceSymbol: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    marginTop: -2,
  },
  priceTag: {
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: Colors.primary,
  },
  currency: {
    fontSize: normalize.font(10),
  },
  rowActions: {
    alignItems: 'center',
    gap: 12,
  },
  detailItem: {
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: normalize.font(13),
    color: Colors.text.secondary,
  },
  expandedContent: {
    backgroundColor: '#FAFBFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
  },
  expandedHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedTitle: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  editText: {
    color: Colors.primary,
    fontSize: normalize.font(13),
    fontWeight: '600',
  },
  pricingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pricingCard: {
    width: '31%',
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    alignItems: 'center',
  },
  weekendCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFEBEB',
  },
  pricingCardDay: {
    fontSize: normalize.font(11),
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  weekendText: {
    color: Colors.error,
  },
  pricingCardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  pricingCardPrice: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  pricingCardCurrency: {
    fontSize: normalize.font(9),
    color: Colors.text.muted,
  },
  emptyPricing: {
    padding: 10,
    alignItems: 'center',
  },
  emptyPricingText: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  addShiftRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  addShiftRowText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: normalize.font(14),
  },
  policyCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  policyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
  },
  policyHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  policyDayBox: {
    alignItems: 'center',
    gap: 8,
  },
  policyDays: {
    fontSize: normalize.font(14),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  penaltyBadge: {
    backgroundColor: '#FFF1F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  policyRefund: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.error,
  },
  editPoliciesBtn: {
    margin: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F8F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editPoliciesText: {
    color: Colors.primary,
    fontSize: normalize.font(15),
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FBFCFE',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EDF0F5',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: normalize.font(13),
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  addInlineBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  addInlineText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: normalize.font(14),
  },
  sheetContent: {
    padding: 24,
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: normalize.font(18),
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  input: {
    backgroundColor: '#F3F4F6',
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: normalize.font(16),
  },
  rowInputs: {
    width: '100%',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalize.font(16),
  },
  pricingFormCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pricingFormCardWeekend: {
    borderColor: '#FFEBEB',
    backgroundColor: '#FFF9F9',
  },
  pricingFormHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayBadgeWeekend: {
    backgroundColor: '#FFEBEB',
  },
  dayBadgeText: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.primary,
  },
  dayBadgeTextWeekend: {
    color: Colors.error,
  },
  weekendLabel: {
    fontSize: normalize.font(11),
    color: Colors.error,
    fontWeight: '600',
    opacity: 0.8,
  },
  pricingFormBody: {
    alignItems: 'center',
  },
  pricingFormInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: normalize.font(16),
    fontWeight: '700',
  },
  inlineCurrency: {
    marginLeft: 12,
    backgroundColor: '#F3F4F6',
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  inlineCurrencyText: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  quickApplyContainer: {
    width: '100%',
    backgroundColor: '#F8FAFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  priceSuffix: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  priceSuffixText: {
    fontSize: normalize.font(14),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  // New Styles for Pricing Sheet
  sheetHeaderCompact: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetHeaderHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 12,
  },
  modalTitleCompact: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  policyFormCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  policyDeleteBtn: {
    padding: 8,
  },
  policyInputLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    marginBottom: 6,
  },
  policyNumberInput: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
    padding: 0,
  },
  quickApplyCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    ...Shadows.medium,
  },
  quickApplyRow: {
    alignItems: 'center',
  },
  quickApplyIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickApplyLabel: {
    fontSize: normalize.font(11),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  quickApplyInput: {
    flex: 1,
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.white,
    padding: 0,
  },
  quickApplyCurrency: {
    fontSize: normalize.font(13),
    color: Colors.white,
    fontWeight: '700',
    marginLeft: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F2F7',
  },
  pricingRowWeekend: {
    borderColor: '#FFE0E0',
    backgroundColor: '#FFF9F9',
  },
  dayInfo: {
    alignItems: 'center',
    gap: 12,
  },
  dayIndicator: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  dayIndicatorWeekend: {
    backgroundColor: '#FF4D4D',
  },
  dayNameText: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dayNameTextWeekend: {
    color: '#FF4D4D',
  },
  priceActions: {
    alignItems: 'center',
    gap: 8,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInputWrapper: {
    width: 90,
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
  },
  pricingRowInput: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: Colors.text.primary,
    padding: 0,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: 'rgba(248, 249, 251, 0.95)',
  },
  // Time Selection Styling
  timeSelectionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E9EBED',
  },
  timeSelectRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInputCol: {
    flex: 1,
  },
  timeSeparator: {
    width: 32,
    alignItems: 'center',
    paddingTop: 24,
  },
  timeLabelText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.text.muted,
  },
  iosCompactPickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E9EBED',
  },
  customTimeDisplay: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E9EBED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  customTimeText: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: Colors.primary,
  },
  activeTimeCol: {
    transform: [{ scale: 1.02 }],
  },
  customPickerMain: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9EBED',
  },
  pickerWheelsRow: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  wheelCol: {
    width: 60,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  wheelColCompact: {
    height: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  wheelItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemTaken: {
    backgroundColor: '#FDECEC',
    opacity: 0.5,
  },
  wheelItemTextTaken: {
    color: '#FF3B30',
    textDecorationLine: 'line-through',
  },
  wheelItemText: {
    fontSize: normalize.font(16),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  wheelItemSelected: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: normalize.font(18),
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9EBED',
  },
  periodBtnTaken: {
    opacity: 0.3,
    backgroundColor: '#F2F2F7',
  },
  periodBtnTextTaken: {
    textDecorationLine: 'line-through',
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodBtnText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.text.muted,
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  closePickerBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closePickerText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: normalize.font(14),
  },
  androidTimeBtn: {
    backgroundColor: '#fff',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9EBED',
  },
  androidTimeText: {
    fontSize: normalize.font(15),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  // Timeline Styling
  timelineContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFF4',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 10,
  },
  timelineLabel: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  timelineInfo: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
  },
  timelineBar: {
    flexDirection: 'row',
    height: 32,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    overflow: 'hidden',
    padding: 2,
    marginTop: 8,
  },
  timelineSegment: {
    flex: 1,
    marginHorizontal: 0.5,
    backgroundColor: '#34C75920', // Very light green for free
    borderRadius: 1,
  },
  segmentOccupied: {
    backgroundColor: '#FF3B30', // Solid red for busy
  },
  segmentNew: {
    backgroundColor: Colors.primary, // Selection color
  },
  timelineTicks: {
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  timelineTick: {
    fontSize: normalize.font(10),
    fontWeight: '600',
    color: Colors.text.muted,
  },
  legendItem: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  durationBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  durationText: {
    fontSize: normalize.font(11),
    fontWeight: '700',
    color: Colors.primary,
  },
  cardTitleSmall: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  fullDayWarning: {
    backgroundColor: '#FFF1F0',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF3B3030',
    alignItems: 'center',
    gap: 12,
  },
  fullDayTitle: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#FF3B30',
  },
  fullDayText: {
    fontSize: normalize.font(12),
    color: '#FF3B30',
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conflictWarning: {
    backgroundColor: '#FFF9F0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE5B4',
    gap: 8,
  },
  conflictWarningText: {
    fontSize: normalize.font(12),
    color: '#FF9500',
    fontWeight: '700',
  },
  saveBtnDisabled: {
    opacity: 0.6,
    backgroundColor: '#D1D1D6',
  },
  saveBtnLarge: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  saveBtnTextLarge: {
    color: Colors.white,
    fontSize: normalize.font(15),
    fontWeight: '800',
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  addTierText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: normalize.font(14),
  },
  compactInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9EBED',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chaletSelectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextLarge: {
    fontSize: normalize.font(15),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  detailLabelSmall: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
  chaletSelectImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 12,
  },
  chaletSelectImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  chaletSelectName: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  chaletSelectLoc: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
  },
  premiumCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEFF4',
    overflow: 'hidden',
    ...Shadows.medium,
  },
  policyBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  policyBadgeText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.primary,
  },
  penaltyChip: {
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  penaltyText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: '#FF3B30',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    gap: 8,
  },
  manageBtnText: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.primary,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTextLarge: {
    fontSize: normalize.font(15),
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyCardSmall: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTextSmall: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
  },
  saveSingleBtn: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  pricingRowInvalid: {
    borderColor: '#FF3B3040',
    backgroundColor: '#FFF1F0',
  },
  matrixWarning: {
    backgroundColor: '#FFF9F0',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFECC0',
  },
  matrixWarningText: {
    fontSize: normalize.font(12),
    color: '#FF9500',
    fontWeight: '700',
    marginLeft: 8,
  },
});
