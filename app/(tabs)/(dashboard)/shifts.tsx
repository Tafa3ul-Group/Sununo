import { HeaderSection } from '@/components/header-section';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize, Shadows, Spacing } from '@/constants/theme';
import { RootState } from '@/store';
import {
  useCreateChaletPolicyMutation,
  useCreateShiftMutation,
  useDeleteChaletPolicyMutation,
  useDeleteShiftMutation,
  useGetChaletCancellationPoliciesQuery,
  useGetChaletShiftsQuery,
  useGetOwnerChaletDetailsQuery,
  useGetOwnerChaletsQuery,
  useGetShiftPricingQuery,
  useSetChaletPoliciesMutation,
  useSetShiftPricingMutation,
  useUpdateShiftMutation,
  useUpdateShiftPricingDayMutation
} from '@/store/api/apiSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
  Switch,
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

function DayVisualizer({
  shifts,
  isRTL,
  onEditShift,
  onAddShift,
  currentShiftForm,
  selectedId
}: {
  shifts: any[];
  isRTL: boolean;
  onEditShift: (shift: any) => void;
  onAddShift: (h: number) => void;
  currentShiftForm?: any;
  selectedId?: string;
}) {
  const renderRow = (hourIndices: number[], icon: string, iconColor: string) => {
    const slots: any[] = [];
    let i = 0;
    while (i < hourIndices.length) {
      const h = hourIndices[i];

      const shift = shifts?.find((s: any) => {
        if (selectedId && s.id === selectedId) return false;
        const sT = parseInt(s.startTime.split(':')[0]);
        const sE = parseInt(s.endTime.split(':')[0]);
        const isNight = sT > sE;
        return isNight ? (h >= sT || h < sE) : (h >= sT && h < sE);
      });

      if (shift) {
        const shiftIndex = shifts?.findIndex((s: any) => s.id === shift.id);
        const palette = ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#34C759', '#00C7BE', '#FF3B30'];
        const shiftColor = palette[shiftIndex % palette.length] || palette[0];

        let span = 1;
        while (i + span < hourIndices.length) {
          const nextH = hourIndices[i + span];
          const nextShift = shifts?.find((s: any) => {
            if (selectedId && s.id === selectedId) return false;
            const sT = parseInt(s.startTime.split(':')[0]);
            const sE = parseInt(s.endTime.split(':')[0]);
            const isNight = sT > sE;
            return isNight ? (nextH >= sT || nextH < sE) : (nextH >= sT && nextH < sE);
          });
          if (nextShift?.id === shift.id) {
            span++;
          } else {
            break;
          }
        }
        slots.push({ type: 'shift', shift, span, hStart: h, color: shiftColor });
        i += span;
      } else {
        let isCurrent = false;
        if (currentShiftForm) {
          const cS = parseInt(currentShiftForm.startTime.split(':')[0]);
          const cE = parseInt(currentShiftForm.endTime.split(':')[0]);
          const cIsNight = cS > cE;
          isCurrent = cIsNight ? (h >= cS || h < cE) : (h >= cS && h < cE);
        }
        slots.push({ type: 'empty', h, isCurrent });
        i++;
      }
    }

    return (
      <View style={[styles.hourGridRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.rowIconOuter, { marginLeft: isRTL ? 12 : 0, marginRight: isRTL ? 0 : 12 }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', gap: 4 }}>
          {slots.map((slot, index) => {
            if (slot.type === 'shift') {
              const name = isRTL ? (slot.shift.name?.ar || slot.shift.name) : (slot.shift.name?.en || slot.shift.name);
              return (
                <TouchableOpacity
                  key={`shift-${slot.shift.id}-${index}`}
                  style={[styles.hourSquareMerged, { flex: slot.span, backgroundColor: slot.color, borderColor: slot.color }]}
                  onPress={() => onEditShift(slot.shift)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shiftOverlayText} numberOfLines={1}>{name}</Text>
                </TouchableOpacity>
              );
            } else {
              return (
                <TouchableOpacity
                  key={`empty-${slot.h}`}
                  style={[
                    styles.hourSquare,
                    slot.isCurrent && {
                      backgroundColor: Colors.primary + '15',
                      borderColor: Colors.primary,
                      borderWidth: 1.5
                    }
                  ]}
                  onPress={() => onAddShift(slot.h)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.hourText, slot.isCurrent && { color: Colors.primary, fontWeight: '900' }]}>
                    {slot.h % 12 || 12}
                  </Text>
                </TouchableOpacity>
              );
            }
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.hoursGridContainer}>
      <View style={styles.gridHeader}>
        <Text style={styles.gridTitleLarge}>{isRTL ? 'مخطط توزيع ساعات اليوم' : 'Daily Hours Chart'}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.legendItem, { backgroundColor: Colors.primary, width: 10, height: 10, borderRadius: 5, marginRight: 6 }]} />
            <Text style={styles.legendText}>{isRTL ? 'فترة محجوزة' : 'Shift'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.legendItem, { backgroundColor: Colors.primary + '20', width: 10, height: 10, borderRadius: 5, marginRight: 6 }]} />
            <Text style={styles.legendText}>{isRTL ? 'الفترة المختارة' : 'Selected'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.gridContent}>
        {renderRow([0, 1, 2, 3, 4, 5], "moon", "#323232")}
        <View style={{ height: 8 }} />
        {renderRow([6, 7, 8, 9, 10, 11], "sunny", "#FFCC00")}
        <View style={{ height: 8 }} />
        {renderRow([12, 13, 14, 15, 16, 17], "sunny", "#FF9500")}
        <View style={{ height: 8 }} />
        {renderRow([18, 19, 20, 21, 22, 23], "moon", "#5856D6")}
      </View>
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

  const firstShiftRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      let timer: any;
      if (shifts && shifts.length > 0 && firstShiftRef.current) {
        timer = setTimeout(() => {
          if (firstShiftRef.current) {
            if (isRTL) {
              firstShiftRef.current.openLeft();
            } else {
              firstShiftRef.current.openRight();
            }
            setTimeout(() => {
              firstShiftRef.current?.close();
            }, 800);
          }
        }, 700);
      }
      return () => clearTimeout(timer);
    }, [shifts, isRTL])
  );

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

  const handleAddShiftAtHour = (h: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(null);
    const startStr = `${h.toString().padStart(2, '0')}:00`;
    let endH = (h + 4) % 24;
    const endStr = `${endH.toString().padStart(2, '0')}:00`;

    setShiftForm({ name: '', startTime: startStr, endTime: endStr, price: '' });
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

    // 1. Create a full week skeleton (0-6)
    const fullWeek = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      price: shift.price ?? 0
    }));

    // 2. Merge existing pricing from backend/prop
    const pricingToUse = existingPricing || shift.pricing || [];

    // Create a form where we fill the skeleton with actual data where it exists
    const finalPricing = fullWeek.map(defaultDay => {
      const existingDay = pricingToUse.find((p: any) => p.dayOfWeek === defaultDay.dayOfWeek);
      if (existingDay) {
        return {
          ...existingDay,
          price: existingDay.price ?? shift.price ?? 0
        };
      }
      return defaultDay;
    });

    setPricingForm(finalPricing);
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
      // Note: We no longer block price < 0.01 because 0 now means "Day Off"
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
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#F0F7FF' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleEditShift(shift);
          }}
        >
          <Ionicons name="create" size={22} color={Colors.primary} />
          <Text style={[styles.swipeActionText, { color: Colors.primary }]}>{isRTL ? 'تعديل' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#FFEEED' }]}
          onPress={() => confirmDeleteShift(shift.id)}
        >
          <Ionicons name="trash" size={22} color="#FF3B30" />
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
                shifts.map((shift: any, index: number) => {
                  const isExpanded = expandedShift === shift.id;
                  const shiftName = isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name);

                  return (
                    <Swipeable
                      key={shift.id}
                      ref={index === 0 ? firstShiftRef : undefined}
                      renderRightActions={!isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                      renderLeftActions={isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                      onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      friction={2}
                      containerStyle={styles.swipeableContainer}
                    >
                      <View style={styles.cardFlat}>
                        <TouchableOpacity
                          style={styles.cardHeader}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setExpandedShift(isExpanded ? null : shift.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.row, { flexDirection, justifyContent: 'space-between', width: '100%' }]}>
                            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                              <Text style={styles.cardTitle}>{shiftName}</Text>
                              <View style={[styles.timeBadge, { flexDirection, marginTop: 6, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                                <Ionicons name="time-outline" size={14} color={Colors.primary} style={{ marginHorizontal: 3 }} />
                                <Text style={styles.timeBadgeText}>
                                  {formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.row, { gap: 10, alignItems: 'center' }]}>
                              <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={Colors.border}
                              />
                            </View>
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
          snapPoints={['55%', '90%']}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 24 }}
        >
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            style={{ width: '100%' }}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
          >
            <View style={{ paddingVertical: 10, alignItems: 'center' }}>
              <Text style={styles.modalTitle}>{selectedShift ? (isRTL ? 'تعديل الفترة' : 'Edit Shift') : (isRTL ? 'إضافة فترة جديدة' : 'Add New Shift')}</Text>
            </View>
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

              {/* Enhanced 24h Grid Visualizer */}
              <DayVisualizer
                shifts={shifts}
                isRTL={isRTL}
                onEditShift={handleEditShift}
                onAddShift={handleAddShiftAtHour}
                currentShiftForm={shiftForm}
                selectedId={selectedShift?.id}
              />

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
                      {isRTL ? `المدة: ${parseFloat(Number(duration).toFixed(2))} ساعة` : `Duration: ${parseFloat(Number(duration).toFixed(2))}h`}
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

              {selectedShift && (
                <TouchableOpacity
                  style={[styles.deleteTextBtn, { marginTop: 12, alignSelf: 'center' }]}
                  onPress={() => {
                    shiftSheetRef.current?.dismiss();
                    setTimeout(() => confirmDeleteShift(selectedShift.id), 300);
                  }}
                >
                  <Text style={styles.deleteTextBtnLabel}>{isRTL ? 'حذف هذه الفترة نهائياً' : 'Delete this shift permanently'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>

        {/* Pricing Matrix Bottom Sheet */}
        <BottomSheetModal
          ref={pricingSheetRef}
          index={0}
          snapPoints={['90%']}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 32, backgroundColor: '#F8F9FA' }}
        >
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {/* 1. Header & Quick Apply Section */}
            <View style={styles.pricingHeaderNew}>
              <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }]}>
                <View>
                  <Text style={styles.modalTitleCompact}>{isRTL ? 'إعداد أسعار الأسبوع' : 'Weekly Pricing'}</Text>
                  {selectedShift && (
                    <View style={styles.shiftLabelBadge}>
                      <Text style={styles.shiftLabelBadgeText}>
                        {isRTL ? (selectedShift.name?.ar || selectedShift.name) : (selectedShift.name?.en || selectedShift.name)}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => pricingSheetRef.current?.dismiss()} style={styles.closeBtnCircle}>
                  <Ionicons name="close" size={20} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.quickActionCardNew}>
                <View style={[styles.row, { alignItems: 'center', marginBottom: 12 }]}>
                  <View style={styles.quickIconCircle}>
                    <Ionicons name="flash-outline" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickLabelNew}>{isRTL ? 'تطبيق سعر موحد للكل' : 'Apply to all days'}</Text>
                </View>
                <View style={[styles.row, { alignItems: 'center' }]}>
                  <BottomSheetTextInput
                    style={[styles.quickInputNew, { textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder="0"
                    keyboardType="numeric"
                    onChangeText={(t) => {
                      const rawValue = t.replace(/[^0-9]/g, '');
                      applyToAllDays(rawValue);
                    }}
                  />
                  <Text style={styles.quickCurrencyNew}>{isRTL ? 'د.ع' : 'IQD'}</Text>
                </View>
              </View>
            </View>

            {/* 2. Main Pricing List */}
            <BottomSheetScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 240 }}
            >
              <View style={{ paddingVertical: 12 }}>
                {pricingForm.map((item, index) => {
                  const daysOfWeek = isRTL
                    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
                    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const isWeekend = item.dayOfWeek === 5 || item.dayOfWeek === 6;
                  // If the price is 1 IQD, we consider it "Manually Blocked/Stopped" by the provider
                  const isStopped = (parseInt(String(item.price)) || 0) <= 1;

                  return (
                    <View key={index} style={[styles.pricingRowModern, isStopped && styles.pricingRowStopped, { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, justifyContent: 'space-between' }]}>
                      {/* 1. Day Info */}
                      <View style={{ flex: 1, marginHorizontal: 2, justifyContent: 'center' }}>
                        <Text style={[styles.dayFullName, { fontSize: 14, color: isWeekend ? Colors.primary : Colors.text.primary, marginBottom: 2 }]}>
                          {daysOfWeek[item.dayOfWeek]}
                        </Text>
                        <View style={[styles.row, { alignItems: 'center' }]}>
                          <View style={[styles.statusDot, { width: 6, height: 6, backgroundColor: isStopped ? '#FF3B30' : '#34C759' }]} />
                          <Text style={[styles.statusTextSmall, { fontSize: 10, color: isStopped ? '#FF3B30' : '#34C759' }]}>
                            {isStopped ? (isRTL ? 'مغلق' : 'Closed') : (isRTL ? 'متاح' : 'Active')}
                          </Text>
                        </View>
                      </View>

                      {/* 2. Price Control (Only if Active) */}
                      {!isStopped && (
                        <View style={[styles.priceAdjustmentSection, { width: '45%', height: 44, padding: 4, marginHorizontal: 12 }]}>
                          <TouchableOpacity
                            style={[styles.stepBtnModern, { width: 32, height: 32, borderRadius: 8 }]}
                            onPress={() => adjustPrice(index, -25000)}
                          >
                            <Ionicons name="remove" size={16} color={Colors.text.primary} />
                          </TouchableOpacity>

                          <View style={styles.priceInputWrapperModern}>
                            <BottomSheetTextInput
                              style={[styles.pricingInputModern, { fontSize: 14, textAlign: 'center' }]}
                              keyboardType="numeric"
                              value={formatPrice(item.price)}
                              onChangeText={t => {
                                const newPricing = [...pricingForm];
                                const rawValue = t.replace(/[^0-9]/g, '');
                                newPricing[index].price = parseInt(rawValue) || 0;
                                setPricingForm(newPricing);
                              }}
                            />
                            <Text style={[styles.innerCurrency, { fontSize: 8 }]}>{isRTL ? 'د.ع' : 'IQD'}</Text>
                          </View>

                          <TouchableOpacity
                            style={[styles.stepBtnModern, { width: 32, height: 32, borderRadius: 8 }]}
                            onPress={() => adjustPrice(index, 25000)}
                          >
                            <Ionicons name="add" size={16} color={Colors.text.primary} />
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* 3. Switch */}
                      <View style={{ width: 44, alignItems: 'center', marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }}>
                        <Switch
                          value={!isStopped}
                          onValueChange={(val) => {
                            const newPricing = [...pricingForm];
                            if (!val) {
                              newPricing[index].price = 1;
                            } else {
                              newPricing[index].price = parseInt(shiftForm.price) || 50000;
                            }
                            setPricingForm(newPricing);
                          }}
                          trackColor={{ true: Colors.primary, false: '#E9E9EB' }}
                          thumbColor={Platform.OS === 'ios' ? '#fff' : (!isStopped ? Colors.primary : '#fff')}
                          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </BottomSheetScrollView>

            <View style={styles.pricingFloatingFooter}>
              <TouchableOpacity
                style={styles.applyBtnLargeModern}
                onPress={savePricing}
                disabled={isSettingPricing}
              >
                {isSettingPricing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={[styles.row, { alignItems: 'center' }]}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8, marginLeft: 8 }} />
                    <Text style={styles.applyBtnTextLarge}>{isRTL ? 'حفظ التعديلات' : 'Save Changes'}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFlat: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: '#F0F2F7',
    padding: 0,
    overflow: 'hidden',
    ...Shadows.small,
  },
  cardHeader: {
    padding: 14,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: '#000',
  },
  timeBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeText: {
    color: Colors.primary,
    fontSize: normalize.font(12),
    fontWeight: '800',
  },
  expandedContent: {
    padding: 14,
    backgroundColor: '#FAFBFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hoursGridContainer: {
    marginVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
    borderWidth: 1.2,
    borderColor: '#F0F2F7',
  },
  gridHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  gridTitleLarge: {
    fontSize: normalize.font(18),
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
  },
  legendText: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontWeight: '700',
  },
  gridContent: {
    width: '100%',
  },
  hourGridRow: {
    height: 62,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  rowIconOuter: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourSquare: {
    flex: 1,
    height: 52,
    borderRadius: 0,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8EAED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourSquareMerged: {
    height: 52,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  hourText: {
    fontSize: normalize.font(15),
    color: '#475467',
    fontWeight: '900',
    textAlign: 'center',
  },
  hourTextMerged: {
    fontSize: normalize.font(10),
    color: 'rgba(255,255,255,0.7)',
    position: 'absolute',
    bottom: 2,
    fontWeight: '900',
    textAlign: 'center',
  },
  shiftOverlayText: {
    fontSize: normalize.font(14),
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },
  expandedTitle: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#000',
  },
  editText: {
    fontSize: normalize.font(12),
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  emptyPricing: {
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
    borderStyle: 'dashed',
  },
  emptyPricingText: {
    fontSize: normalize.font(12),
    color: '#666',
    textAlign: 'center',
  },
  pricingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pricingCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDF0F5',
    alignItems: 'center',
  },
  weekendCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE0E0',
  },
  weekendText: {
    color: Colors.error,
  },
  pricingCardDay: {
    fontSize: normalize.font(10),
    fontWeight: '700',
    color: '#666',
    marginBottom: 2,
  },
  pricingCardValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingCardPrice: {
    fontSize: normalize.font(12),
    fontWeight: '800',
    color: '#000',
  },
  pricingCardCurrency: {
    fontSize: normalize.font(8),
    color: '#666',
    marginLeft: 2,
    fontWeight: '700',
  },
  swipeableContainer: {
    marginBottom: 12,
    borderRadius: 18,
  },
  swipeActions: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  swipeAction: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  swipeActionText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: '#fff',
  },
  emptyCard: {
    padding: 40,
    backgroundColor: '#F8F9FB',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E1E4EB',
    marginTop: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: normalize.font(14),
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },
  addInlineText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: normalize.font(15),
  },
  modalTitle: {
    fontSize: normalize.font(20),
    fontWeight: '800',
    color: '#000',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: '#F3F4F6',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: normalize.font(15),
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeSelectionCard: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
    marginTop: 20,
  },
  cardTitleSmall: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: '#000',
  },
  durationBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  durationText: {
    fontSize: normalize.font(12),
    fontWeight: '800',
    color: Colors.primary,
  },
  timeSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  timeInputCol: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
  },
  activeTimeCol: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  timeLabelText: {
    fontSize: normalize.font(12),
    color: '#999',
    fontWeight: '700',
  },
  customTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  customTimeText: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: '#000',
  },
  timeSeparator: {
    paddingHorizontal: 14,
  },
  customPickerMain: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
  },
  pickerWheelsRow: {
    flexDirection: 'row',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  wheelCol: {
    width: 70,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
    overflow: 'hidden',
  },
  wheelItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: normalize.font(16),
    color: '#AAA',
    fontWeight: '600',
  },
  wheelItemSelected: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: normalize.font(20),
  },
  wheelItemTaken: {
    backgroundColor: '#FFF5F5',
    opacity: 0.5,
  },
  wheelItemTextTaken: {
    color: '#FF3B30',
    textDecorationLine: 'line-through',
  },
  wheelColCompact: {
    width: 90,
    justifyContent: 'center',
    gap: 10,
  },
  periodBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodBtnTaken: {
    opacity: 0.3,
  },
  periodBtnText: {
    fontSize: normalize.font(13),
    fontWeight: '800',
    color: '#333',
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  periodBtnTextTaken: {
    textDecorationLine: 'line-through',
  },
  closePickerBtn: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  closePickerText: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: normalize.font(15),
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: normalize.font(17),
  },
  saveBtnDisabled: {
    opacity: 0.6,
    backgroundColor: '#BDBDBD',
  },
  deleteTextBtn: {
    padding: 16,
    alignItems: 'center',
  },
  deleteTextBtnLabel: {
    color: Colors.error,
    fontWeight: '800',
    fontSize: normalize.font(15),
    textDecorationLine: 'underline',
  },
  pricingHeaderNew: {
    paddingBottom: 20,
    paddingTop: 12,
  },
  sheetHeaderHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E0E3E8',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitleCompact: {
    fontSize: normalize.font(19),
    fontWeight: '800',
    color: '#000',
  },
  shiftLabelBadge: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  shiftLabelBadgeText: {
    fontSize: normalize.font(11),
    color: Colors.primary,
    fontWeight: '800',
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionCardNew: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 20,
    marginTop: 20,
  },
  quickIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  quickLabelNew: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#fff',
  },
  quickInputNew: {
    flex: 1,
    fontSize: normalize.font(20),
    fontWeight: '900',
    color: '#fff',
  },
  quickCurrencyNew: {
    fontSize: normalize.font(13),
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontWeight: '700',
  },
  pricingRowModern: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F0F2F7',
  },
  pricingRowStopped: {
    backgroundColor: '#FFF9F9',
    borderColor: '#FFE0E0',
  },
  dayControlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInitial: {
    fontSize: normalize.font(13),
    fontWeight: '800',
    color: '#666',
  },
  dayFullName: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: '#000',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTextSmall: {
    fontSize: normalize.font(12),
    fontWeight: '700',
  },
  priceAdjustmentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#EDF0F5',
  },
  stepBtnModern: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInputWrapperModern: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingInputModern: {
    fontSize: normalize.font(18),
    fontWeight: '900',
    color: '#000',
  },
  innerCurrency: {
    fontSize: normalize.font(11),
    color: '#999',
    fontWeight: '700',
  },
  stoppedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#FFF1F0',
    padding: 10,
    borderRadius: 12,
  },
  stoppedMessageText: {
    fontSize: normalize.font(12),
    color: Colors.error,
    fontWeight: '700',
  },
  pricingFloatingFooter: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F7',
    marginHorizontal: -20, // To span full width of the modal content container
  },
  applyBtnLargeModern: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    ...Shadows.medium,
  },
  applyBtnTextLarge: {
    color: '#fff',
    fontSize: normalize.font(16),
    fontWeight: '800',
  },
  sheetHeaderCompact: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
    marginBottom: 16,
  },
  policyFormCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F0F2F7',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    width: '100%',
  },
  policyDeleteBtn: {
    padding: 8,
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
  },
  policyInputLabel: {
    fontSize: normalize.font(12),
    color: '#888',
    fontWeight: '800',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  compactInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
  },
  policyNumberInput: {
    flex: 1,
    fontSize: normalize.font(16),
    fontWeight: '900',
    color: Colors.text.primary,
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 20,
    marginTop: 8,
    gap: 10,
  },
  addTierText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: normalize.font(15),
  },
  footerContainer: {
    paddingVertical: 16,
  },
  saveBtnLarge: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  saveBtnTextLarge: {
    color: Colors.white,
    fontSize: normalize.font(16),
    fontWeight: '900',
  },
  chaletSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F0F2F7',
    marginBottom: 10,
  },
  chaletSelectImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chaletSelectImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  chaletSelectName: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  chaletSelectLoc: {
    fontSize: normalize.font(13),
    color: '#888',
    fontWeight: '600',
    marginTop: 2,
  },
  fullDayWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F0',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFE0E0',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  fullDayTitle: {
    fontSize: normalize.font(15),
    fontWeight: '900',
    color: Colors.error,
  },
  fullDayText: {
    fontSize: normalize.font(13),
    color: '#666',
    lineHeight: 18,
  },
  timelineContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EDF0F5',
  },
  timelineLabel: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#333',
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  timelineInfo: {
    fontSize: normalize.font(12),
    color: '#888',
    fontWeight: '700',
  },
  timelineBar: {
    flexDirection: 'row',
    height: 28,
    backgroundColor: '#E9ECF0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
    padding: 3,
  },
  timelineSegment: {
    flex: 1,
    borderRadius: 4,
    marginHorizontal: 0.5,
  },
  segmentOccupied: {
    backgroundColor: Colors.error,
  },
  segmentNew: {
    backgroundColor: Colors.primary,
  },
  timelineTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  timelineTick: {
    fontSize: normalize.font(10),
    color: '#BBB',
    fontWeight: '800',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextLarge: {
    fontSize: normalize.font(18),
    color: '#888',
    marginTop: 16,
    fontWeight: '800',
  },
  iconCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextLarge: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: '#000',
  },
  detailLabelSmall: {
    fontSize: normalize.font(12),
    color: '#888',
    fontWeight: '700',
    marginTop: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F2F7',
    marginVertical: 12,
  },
});
