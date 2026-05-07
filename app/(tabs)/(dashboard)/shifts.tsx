import { HeaderSection } from '@/components/header-section';
import {
  SolarAddCircleBold,
  SolarAltArrowDownBold,
  SolarAltArrowRightBold,
  SolarAltArrowRightLowBold,
  SolarAltArrowUpBold,
  SolarBanknoteBold,
  SolarCalendarBold,
  SolarCheckCircleBold,
  SolarClockCircleBold,
  SolarCloseBold,
  SolarCloseCircleBold,
  SolarHomeBold,
  SolarHourglassBold,
  SolarInfoCircleBold,
  SolarLightbulbBold,
  SolarMoonBold,
  SolarPenBold,
  SolarRefreshBold,
  SolarShieldBold,
  SolarSunBold,
  SolarTrashBinBold
} from '@/components/icons/solar-icons';
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
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Keyboard
} from 'react-native';
import { Swipeable, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { formatPrice } from '@/utils/format';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';

function ShiftPricingView({ shift, isRTL, onEdit }: { shift: any; isRTL: boolean; onEdit: (data?: any[]) => void }) {
  const { data: pricingResponse, isLoading } = useGetShiftPricingQuery(shift.id);
  const pricing = pricingResponse?.data || pricingResponse || [];

  const fullPricing = Array.from({ length: 7 }, (_, i) => {
    const existing = pricing.find((p: any) => p.dayOfWeek === i);
    return existing || { dayOfWeek: i, price: 1 };
  });

  const daysShort = isRTL
    ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) return (
    <View style={{ padding: 20, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );

  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={styles.pricingSectionContainer}>
      <View style={[styles.expandedHeader, { flexDirection, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={[styles.row, { flexDirection, alignItems: 'center' }]}>
          <SolarBanknoteBold size={18} color={Colors.primary} style={{ marginHorizontal: 6 }} />
          <Text style={styles.expandedTitle}>{isRTL ? 'تخصيص أسعار الأيام' : 'Daily Pricing'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onEdit(pricing)}
          style={styles.editBadge}
        >
          <SolarPenBold size={12} color={Colors.primary} style={{ marginHorizontal: 4 }} />
          <Text style={styles.editBadgeText}>{isRTL ? 'تعديل الأسعار' : 'Edit Prices'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.pricingGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {fullPricing.map((item) => {
          const isWeekend = item.dayOfWeek === 5 || item.dayOfWeek === 6;
          const isClosed = item.price <= 1;

          return (
            <TouchableOpacity
              key={`mini-day-${item.dayOfWeek}`}
              style={[
                styles.pricingMiniCard,
                isWeekend && styles.weekendMiniCard,
                isClosed && styles.closedMiniCard
              ]}
              onPress={() => onEdit(pricing)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.miniCardDay,
                isWeekend && { color: Colors.error },
                isClosed && { color: '#999' }
              ]}>
                {daysShort[item.dayOfWeek]}
              </Text>

              {isClosed ? (
                <View style={styles.closedBadgeMini}>
                  <Text style={styles.closedBadgeTextMini}>{isRTL ? 'مغلق' : 'OFF'}</Text>
                </View>
              ) : (
                <View style={styles.miniCardPriceRow}>
                  <Text style={[
                    styles.miniCardPrice,
                    isWeekend && { color: Colors.error }
                  ]}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
  const renderRow = (hourIndices: number[], icon: 'sun' | 'moon', iconColor: string) => {
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
          {icon === 'sun' ? (
            <SolarSunBold size={24} color={iconColor} />
          ) : (
            <SolarMoonBold size={24} color={iconColor} />
          )}
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
                  <Text style={[styles.hourText, slot.isCurrent && { color: Colors.primary, fontFamily: "Alexandria-Black" }]}>
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
        {renderRow([6, 7, 8, 9, 10, 11], "sun", "#FFCC00")}
        <View style={{ height: 8 }} />
        {renderRow([12, 13, 14, 15, 16, 17], "sun", "#FF9500")}
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

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const shiftSheetRef = useRef<BottomSheetModal>(null);
  const pricingSheetRef = useRef<BottomSheetModal>(null);
  const policySheetRef = useRef<BottomSheetModal>(null);
  const chaletSelectSheetRef = useRef<BottomSheetModal>(null);

  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '08:00', endTime: '23:00', price: '', isActive: true });
  const [pricingForm, setPricingForm] = useState<any[]>([]);
  const [policyForm, setPolicyForm] = useState<any[]>([]);
  const [modalActiveStatus, setModalActiveStatus] = useState(true);
  const [bulkPrice, setBulkPrice] = useState('');

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

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);

    let diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    if (diff <= 0) diff += 24 * 60;
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
    let defaultStart = '08:00';
    let defaultEnd = '13:00';
    if (shifts && shifts.length > 0) {
      const sortedShifts = [...shifts].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      const lastShift = sortedShifts[sortedShifts.length - 1];
      const [h, m] = lastShift.endTime.split(':').map(Number);
      if (h < 21) {
        defaultStart = `${(h + 1).toString().padStart(2, '0')}:00`;
        defaultEnd = `${(h + 4).toString().padStart(2, '0')}:00`;
      }
    }
    setShiftForm({ name: '', startTime: defaultStart, endTime: defaultEnd, price: '', isActive: true });
    shiftSheetRef.current?.present();
  };

  const handleAddShiftAtHour = (h: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(null);
    const startStr = `${h.toString().padStart(2, '0')}:00`;
    let endH = (h + 4) % 24;
    const endStr = `${endH.toString().padStart(2, '0')}:00`;
    setShiftForm({ name: '', startTime: startStr, endTime: endStr, price: '', isActive: true });
    shiftSheetRef.current?.present();
  };

  const handleEditShift = (shift: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(shift);
    const normalizeTime = (t: string) => t ? t.substring(0, 5) : '';
    setShiftForm({
      name: isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name),
      startTime: normalizeTime(shift.startTime) || '08:00',
      endTime: normalizeTime(shift.endTime) || '23:00',
      price: '',
      isActive: shift.isActive ?? true
    });
    shiftSheetRef.current?.present();
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
      const startTime = shiftForm.startTime.substring(0, 5);
      const endTime = shiftForm.endTime.substring(0, 5);
      const data = {
        name: { ar: shiftForm.name, en: shiftForm.name },
        startTime,
        endTime,
        isActive: shiftForm.isActive
      };
      if (selectedShift) {
        await updateShift({ chaletId: selectedChaletId, shiftId: selectedShift.id, data }).unwrap();
        if (shiftForm.price) {
          const p = parseInt(shiftForm.price);
          if (!isNaN(p)) {
            const initialPricing = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, price: p }));
            await setShiftPricing({ shiftId: selectedShift.id, data: { pricing: initialPricing } }).unwrap();
          }
        }
      } else {
        const result = await createShift({ chaletId: selectedChaletId, data }).unwrap();
        const newShiftId = result?.data?.id || result?.id;
        if (newShiftId && shiftForm.price) {
          const p = parseInt(shiftForm.price);
          if (!isNaN(p)) {
            const initialPricing = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, price: p }));
            await setShiftPricing({ shiftId: newShiftId, data: { pricing: initialPricing } }).unwrap();
          }
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم بنجاح' : 'Success' });
      shiftSheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let displayMsg = e.data?.message || (isRTL ? 'خطأ في الحفظ' : 'Error saving');
      Toast.show({ type: 'error', text1: isRTL ? 'فشل الحفظ' : 'Save Failed', text2: Array.isArray(displayMsg) ? displayMsg[0] : displayMsg });
    }
  };

  const handlePricing = (shift: any, existingPricing?: any[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(shift);
    setModalActiveStatus(shift.isActive);
    const fullWeek = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, price: shift.price ?? 0 }));
    const pricingToUse = existingPricing || shift.pricing || [];
    const finalPricing = fullWeek.map(defaultDay => {
      const existingDay = pricingToUse.find((p: any) => p.dayOfWeek === defaultDay.dayOfWeek);
      if (existingDay) return { ...existingDay, price: existingDay.price ?? shift.price ?? 0 };
      return defaultDay;
    });
    setPricingForm(finalPricing);
    pricingSheetRef.current?.present();
  };

  const applyToAllDays = (price: string) => {
    const p = parseInt(price) || 0;
    setPricingForm(pricingForm.map(item => ({ ...item, price: p })));
  };

  const handleEnableAllDays = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const cleanPricing = pricingForm.map(item => ({
        dayOfWeek: item.dayOfWeek,
        price: item.price > 1 ? item.price : 50000
      }));
      // Update local state
      setPricingForm(pricingForm.map(item => ({
        ...item,
        price: item.price > 1 ? item.price : 50000
      })));
      await setShiftPricing({ shiftId: selectedShift.id, data: { pricing: cleanPricing } }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDisableAllDays = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const cleanPricing = pricingForm.map(item => ({
        dayOfWeek: item.dayOfWeek,
        price: 1
      }));
      // Update local state
      setPricingForm(pricingForm.map(item => ({
        ...item,
        lastPrice: item.price > 1 ? item.price : 50000,
        price: 1
      })));
      await setShiftPricing({ shiftId: selectedShift.id, data: { pricing: cleanPricing } }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleApplyBulkPrice = async () => {
    const p = parseInt(bulkPrice) || 0;
    if (p > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const cleanPricing = pricingForm.map(item => ({
          dayOfWeek: item.dayOfWeek,
          price: p
        }));
        // Update local state
        setPricingForm(pricingForm.map(item => ({ ...item, price: p })));
        await setShiftPricing({ shiftId: selectedShift.id, data: { pricing: cleanPricing } }).unwrap();
        setBulkPrice('');
        Keyboard.dismiss();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleToggleDay = async (index: number, val: boolean) => {
    const item = pricingForm[index];
    const newPrice = val ? (item.lastPrice || 50000) : 1;
    
    // Update local state immediately
    const newP = [...pricingForm];
    newP[index] = { ...newP[index] }; // Create new object reference
    if (!val) newP[index].lastPrice = item.price > 1 ? item.price : 50000;
    newP[index].price = newPrice;
    setPricingForm(newP);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateShiftPricingDay({
        shiftId: selectedShift.id,
        pricingId: item.id,
        price: newPrice
      }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Rollback on error
      const rollbackP = [...pricingForm];
      rollbackP[index].price = item.price;
      setPricingForm(rollbackP);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleUpdateSinglePrice = async (index: number) => {
    const item = pricingForm[index];
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateShiftPricingDay({
        shiftId: selectedShift.id,
        pricingId: item.id,
        price: item.price
      }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleToggleShiftModal = async (val: boolean) => {
    setModalActiveStatus(val);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = {
        name: selectedShift.name,
        startTime: selectedShift.startTime?.substring(0, 5),
        endTime: selectedShift.endTime?.substring(0, 5),
        isActive: val
      };
      await updateShift({ chaletId: selectedChaletId, shiftId: selectedShift.id, data }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setModalActiveStatus(!val);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
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
      // Ensure prices are valid numbers and handle the "stopped" state (price <= 1)
      const cleanPricing = pricingForm.map(item => ({
        dayOfWeek: item.dayOfWeek,
        price: Math.max(0, parseInt(String(item.price)) || 0)
      }));

      await setShiftPricing({ shiftId: selectedShift.id, data: { pricing: cleanPricing } }).unwrap();

      // Also update the global isActive status if changed
      if (selectedShift.isActive !== modalActiveStatus) {
        await updateShift({
          chaletId: selectedChaletId,
          shiftId: selectedShift.id,
          data: {
            name: selectedShift.name,
            startTime: selectedShift.startTime?.substring(0, 5),
            endTime: selectedShift.endTime?.substring(0, 5),
            isActive: modalActiveStatus
          }
        }).unwrap();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم تحديث الأسعار' : 'Pricing updated' });
      pricingSheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let errorMsg = e.data?.message || (isRTL ? 'فشل الحفظ' : 'Update Failed');
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg
      });
    }
  };

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
      try {
        await deleteChaletPolicy({ chaletId: selectedChaletId, policyId: policy.id }).unwrap();
        Toast.show({ type: 'success', text1: isRTL ? 'تم الحذف' : 'Deleted' });
      } catch (e) {
        Toast.show({ type: 'error', text1: isRTL ? 'خطأ في الحذف' : 'Delete failed' });
        return;
      }
    }
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
      const cleanPolicies = policyForm.map(p => ({ daysBeforeBooking: p.daysBeforeBooking, penaltyPercentage: p.penaltyPercentage }));
      await setChaletPolicies({ chaletId: selectedChaletId, data: { policies: cleanPolicies } }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم التحديث' : 'Refund policy updated' });
      policySheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error' });
    }
  };

  const toggleShiftStatus = async (shift: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = {
        name: shift.name,
        startTime: shift.startTime?.substring(0, 5),
        endTime: shift.endTime?.substring(0, 5),
        isActive: !shift.isActive
      };
      await updateShift({ chaletId: selectedChaletId, shiftId: shift.id, data }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
            } catch (e) { }
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
        <TouchableOpacity style={[styles.swipeAction, { backgroundColor: '#F0F7FF' }]} onPress={() => handleEditShift(shift)}>
          <SolarPenBold size={22} color={Colors.primary} />
          <Text style={[styles.swipeActionText, { color: Colors.primary }]}>{isRTL ? 'تعديل' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.swipeAction, { backgroundColor: '#FFEEED' }]} onPress={() => confirmDeleteShift(shift.id)}>
          <SolarTrashBinBold size={22} color="#FF3B30" />
          <Text style={[styles.swipeActionText, { color: '#FF3B30' }]}>{isRTL ? 'حذف' : 'Delete'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <HeaderSection
        title={chaletName || (isRTL ? 'اختر الشاليه' : 'Select Chalet')}
        subtitle={isRTL ? 'إدارة الفترات والأسعار' : 'Manage shifts & prices'}
        showBackButton={true}
        showSearch={false}
        onExtraIconPress={() => ownerChalets.length > 1 ? chaletSelectSheetRef.current?.present() : refetchShifts()}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <SolarCalendarBold size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { textAlign, marginLeft: 8, marginRight: 8 }]}>{isRTL ? 'الفترات والأسعار' : 'Shifts & Pricing'}</Text>
            </View>

            {shifts?.map((shift: any, index: number) => {
              const isExpanded = expandedShift === shift.id;
              const shiftName = isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name);
              return (
                <Swipeable
                  key={shift.id}
                  ref={index === 0 ? firstShiftRef : undefined}
                  renderRightActions={!isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                  renderLeftActions={isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                  containerStyle={styles.swipeableContainer}
                >
                  <View style={[styles.cardFlat, !shift.isActive && styles.cardInactive]}>
                    <View style={[styles.row, { padding: 16, borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: '#F0F2F7', justifyContent: 'space-between' }, isRTL && { flexDirection: 'row-reverse' }]}>
                      <TouchableOpacity 
                        style={{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }} 
                        onPress={() => setExpandedShift(isExpanded ? null : shift.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={[styles.row, { flexDirection }]}>
                            <Text style={[styles.cardTitle, !shift.isActive && { color: '#9CA3AF' }]}>{shiftName}</Text>
                          </View>
                          <Text style={[styles.timeBadgeText, !shift.isActive && { color: '#9CA3AF' }]}>{formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}</Text>
                        </View>
                        {isExpanded ? <SolarAltArrowUpBold size={20} color={Colors.border} /> : <SolarAltArrowDownBold size={20} color={Colors.border} />}
                      </TouchableOpacity>

                      <View style={[styles.row, { marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0 }, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={{ alignItems: 'flex-end', marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                          <Text style={{ fontSize: 8, fontFamily: 'Alexandria-Bold', color: shift.isActive ? Colors.primary : '#9CA3AF' }}>
                            {isRTL ? (shift.isActive ? 'نشطة' : 'متوقفة') : (shift.isActive ? 'Active' : 'Inactive')}
                          </Text>
                        </View>
                        <Switch 
                          value={shift.isActive} 
                          onValueChange={() => toggleShiftStatus(shift)}
                          trackColor={{ false: '#D1D5DB', true: Colors.primary + '40' }}
                          thumbColor={shift.isActive ? Colors.primary : '#9CA3AF'}
                          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={styles.expandedContent}>
                        <ShiftPricingView shift={shift} isRTL={isRTL} onEdit={(data) => handlePricing(shift, data)} />
                      </View>
                    )}
                  </View>
                </Swipeable>
              );
            })}

            <SecondaryButton
              label={isRTL ? 'إضافة فترة (Shift) إضافية' : 'Add another shift'}
              onPress={handleAddShift}
              icon={<SolarAddCircleBold size={20} color={Colors.primary} />}
              style={{ marginTop: 12 }}
            />
          </View>

          <View style={[styles.section, { marginTop: 32 }]}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <SolarBanknoteBold size={22} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { textAlign, marginLeft: 8, marginRight: 8 }]}>{isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}</Text>
            </View>
            <TouchableOpacity style={styles.cardFlat} onPress={handleEditPolicies}>
              <View style={{ padding: 20 }}>
                {policies?.map((p: any, i: number) => (
                  <View key={i} style={[styles.row, { marginBottom: 12 }]}>
                    <Text style={styles.detailTextLarge}>{isRTL ? `قبل ${p.daysBeforeBooking} أيام: ${p.penaltyPercentage}%` : `${p.daysBeforeBooking} days: ${p.penaltyPercentage}%`}</Text>
                  </View>
                ))}
                <Text style={{ color: Colors.primary, fontFamily: "Alexandria-Bold", textAlign: 'center' }}>{isRTL ? 'تعديل سياسة الاسترجاع' : 'Edit Refund Policy'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Add Shift Modal */}
      <BottomSheetModal ref={shiftSheetRef} index={0} snapPoints={['60%', '90%']} backdropComponent={renderBackdrop}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitle}>{isRTL ? 'إعداد الفترة' : 'Shift Setup'}</Text>
          <DayVisualizer shifts={shifts} isRTL={isRTL} onEditShift={handleEditShift} onAddShift={handleAddShiftAtHour} currentShiftForm={shiftForm} selectedId={selectedShift?.id} />

          <View style={[styles.row, { justifyContent: 'space-between', marginVertical: 20 }, isRTL && { flexDirection: 'row-reverse' }]}>
            <View>
              <Text style={styles.label}>{isRTL ? 'حالة الفترة' : 'Shift Status'}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>{isRTL ? 'تفعيل أو إيقاف هذه الفترة تماماً' : 'Enable or disable this shift globally'}</Text>
            </View>
            <Switch
              value={shiftForm.isActive}
              onValueChange={v => setShiftForm({ ...shiftForm, isActive: v })}
              trackColor={{ false: '#D1D1D6', true: Colors.primary }}
            />
          </View>

          <Text style={styles.label}>{isRTL ? 'الاسم' : 'Name'}</Text>
          <BottomSheetTextInput style={styles.input} value={shiftForm.name} onChangeText={t => setShiftForm({ ...shiftForm, name: t })} />
          <TouchableOpacity style={styles.saveBtn} onPress={saveShift}>
            <Text style={styles.saveBtnText}>{isRTL ? 'حفظ' : 'Save'}</Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Pricing Modal */}
      <BottomSheetModal
        ref={pricingSheetRef}
        index={0}
        snapPoints={['90%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 32, backgroundColor: '#F8F9FA' }}
      >
        <BottomSheetFlatList
          data={pricingForm}
          keyExtractor={(item) => `day-${item.dayOfWeek}`}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={
            <View style={{ padding: 20 }}>
              <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }, isRTL && { flexDirection: 'row-reverse' }]}>
                <View>
                  <Text style={styles.modalTitleCompact}>{isRTL ? 'إعداد أسعار الأسبوع' : 'Weekly Pricing'}</Text>
                  {selectedShift && (
                    <Text style={{ fontSize: 12, color: Colors.primary, fontFamily: 'Alexandria-Bold', marginTop: 2 }}>
                      {isRTL ? (selectedShift.name?.ar || selectedShift.name) : (selectedShift.name?.en || selectedShift.name)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => pricingSheetRef.current?.dismiss()} style={{ backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 }}>
                  <SolarCloseBold size={20} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={[styles.shiftStatusHighlight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.row, { flex: 1 }, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.statusIconCircle, { backgroundColor: modalActiveStatus ? Colors.primary + '15' : '#F3F4F6' }]}>
                    <SolarShieldBold size={20} color={modalActiveStatus ? Colors.primary : '#9CA3AF'} />
                  </View>
                  <View style={{ marginHorizontal: 12 }}>
                    <Text style={styles.statusLabelLarge}>{isRTL ? 'حالة الفترة الحالية' : 'Shift Status'}</Text>
                    <Text style={[styles.statusValueLarge, { color: modalActiveStatus ? Colors.primary : '#9CA3AF' }]}>
                      {isRTL ? (modalActiveStatus ? 'هذه الفترة نشطة الآن' : 'هذه الفترة متوقفة حالياً') : (modalActiveStatus ? 'Shift is currently active' : 'Shift is currently inactive')}
                    </Text>
                  </View>
                </View>
                <Switch 
                  value={modalActiveStatus} 
                  onValueChange={handleToggleShiftModal}
                  trackColor={{ false: '#D1D5DB', true: Colors.primary + '40' }}
                  thumbColor={modalActiveStatus ? Colors.primary : '#9CA3AF'}
                />
              </View>

              <View style={styles.quickActionCardNew}>
                <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
                    <SolarLightbulbBold size={16} color="#FFF" style={{ marginHorizontal: 4 }} />
                    <Text style={styles.quickLabelNew}>{isRTL ? 'إجراءات سريعة لجميع الأيام' : 'Quick Batch Actions'}</Text>
                  </View>
                  <View style={[styles.row, { gap: 8 }, isRTL && { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity onPress={handleEnableAllDays} style={styles.miniQuickBtn}>
                      <Text style={styles.miniQuickBtnText}>{isRTL ? 'تفعيل الكل' : 'Enable All'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDisableAllDays} style={[styles.miniQuickBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={styles.miniQuickBtnText}>{isRTL ? 'إيقاف الكل' : 'Disable All'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.row, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4 }, isRTL && { flexDirection: 'row-reverse' }]}>
                  <BottomSheetTextInput
                    style={[styles.quickInputNew, { flex: 1, height: 44, paddingHorizontal: 12, textAlign: isRTL ? 'right' : 'left' }]}
                    keyboardType="numeric"
                    placeholder={isRTL ? "أدخل السعر الموحد..." : "Enter uniform price..."}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={bulkPrice}
                    onChangeText={setBulkPrice}
                  />
                  <TouchableOpacity
                    onPress={handleApplyBulkPrice}
                    style={{ backgroundColor: '#FFF', paddingHorizontal: 16, height: 36, borderRadius: 8, justifyContent: 'center', marginHorizontal: 4 }}
                  >
                    <Text style={{ color: Colors.primary, fontFamily: 'Alexandria-Bold', fontSize: 12 }}>{isRTL ? 'تطبيق السعر' : 'Apply Price'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          }
          renderItem={({ item, index }) => {
            const isStopped = item.price <= 1;
            const dayName = isRTL
              ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][item.dayOfWeek]
              : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.dayOfWeek];

            return (
              <View style={[
                styles.pricingRowModern,
                isStopped && styles.pricingRowStopped,
                { marginHorizontal: 20, flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.row, { justifyContent: 'space-between', marginBottom: item.price > 1 ? 12 : 0 }, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={[
                        styles.dayIndicator,
                        (item.dayOfWeek === 5 || item.dayOfWeek === 6) && { backgroundColor: '#FEE4E2' }
                      ]}>
                        <Text style={[
                          styles.dayIndicatorText,
                          (item.dayOfWeek === 5 || item.dayOfWeek === 6) && { color: Colors.error }
                        ]}>
                          {dayName.substring(0, 1)}
                        </Text>
                      </View>
                      <Text style={[styles.dayFullName, { marginHorizontal: 12 }]}>{dayName}</Text>
                    </View>

                    <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
                      <Text style={{ fontSize: 12, color: isStopped ? '#999' : Colors.primary, fontFamily: 'Alexandria-Bold', marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>
                        {isStopped ? (isRTL ? 'متوقف' : 'Stopped') : (isRTL ? 'نشط' : 'Active')}
                      </Text>
                      <Switch
                        value={!isStopped}
                        trackColor={{ false: '#D1D1D6', true: Colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? undefined : '#FFF'}
                        onValueChange={(val) => handleToggleDay(index, val)}
                      />
                    </View>
                  </View>

                  {!isStopped && (
                    <View style={[styles.priceControlWrapper, isRTL && { flexDirection: 'row-reverse' }]}>
                      <SolarBanknoteBold size={20} color={Colors.primary} style={{ marginHorizontal: 8 }} />
                      <BottomSheetTextInput
                        style={[styles.pricingInputModern, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                        keyboardType="numeric"
                        value={String(item.price)}
                        placeholder="0"
                        onChangeText={t => {
                          const newP = [...pricingForm];
                          newP[index].price = parseInt(t) || 0;
                          setPricingForm(newP);
                        }}
                      />
                      <TouchableOpacity 
                        onPress={() => handleUpdateSinglePrice(index)}
                        style={{ backgroundColor: Colors.primary, padding: 8, borderRadius: 8, marginLeft: 8 }}
                      >
                        <SolarCheckCircleBold size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      </BottomSheetModal>

      {/* Policy Modal */}
      <BottomSheetModal ref={policySheetRef} index={0} snapPoints={['70%']} backdropComponent={renderBackdrop}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalTitleCompact}>{isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}</Text>
          {policyForm.map((p, i) => (
            <View key={i} style={styles.policyFormCard}>
              <BottomSheetTextInput keyboardType="numeric" value={String(p.daysBeforeBooking)} onChangeText={v => updatePolicyTier(i, 'daysBeforeBooking', v)} />
              <BottomSheetTextInput keyboardType="numeric" value={String(p.penaltyPercentage)} onChangeText={v => updatePolicyTier(i, 'penaltyPercentage', v)} />
            </View>
          ))}
          <TouchableOpacity style={styles.saveBtn} onPress={savePolicies}><Text style={styles.saveBtnText}>{isRTL ? 'حفظ' : 'Save'}</Text></TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Chalet Select Modal */}
      <BottomSheetModal ref={chaletSelectSheetRef} index={0} snapPoints={['50%']} backdropComponent={renderBackdrop}>
        <BottomSheetView style={{ padding: 20 }}>
          {ownerChalets.map((c: any) => (
            <TouchableOpacity key={c.id} style={styles.chaletSelectCard} onPress={() => { setSelectedChaletId(c.id); chaletSelectSheetRef.current?.dismiss(); }}>
              <Text>{isRTL ? c.name?.ar : c.name?.en}</Text>
            </TouchableOpacity>
          ))}
        </BottomSheetView>
      </BottomSheetModal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Alexandria-Black", color: '#000' },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardFlat: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F0F2F7', overflow: 'hidden', ...Shadows.small },
  cardHeader: { padding: 16 },
  cardTitle: { fontSize: 16, fontFamily: "Alexandria-Black" },
  timeBadgeText: { color: Colors.primary, fontSize: 12, fontFamily: "Alexandria-Bold" },
  expandedContent: { padding: 16, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#F0F2F7' },
  pricingSectionContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  expandedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expandedTitle: { fontSize: 14, fontFamily: "Alexandria-Bold" },
  editBadge: { backgroundColor: Colors.primary + '10', padding: 6, borderRadius: 8 },
  editBadgeText: { fontSize: 10, color: Colors.primary, fontFamily: "Alexandria-Bold" },
  emptyPricingCard: { padding: 20, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#DDD', borderRadius: 12 },
  emptyPricingText: { fontSize: 12, color: '#999', marginTop: 8 },
  setPriceBtn: { backgroundColor: Colors.primary, padding: 8, borderRadius: 8, marginTop: 10 },
  setPriceBtnText: { color: '#fff', fontSize: 11 },
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pricingMiniCard: { width: '23%', aspectRatio: 1, backgroundColor: '#F9FAFB', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weekendMiniCard: { backgroundColor: '#FFF5F5' },
  closedMiniCard: { opacity: 0.5 },
  miniCardDay: { fontSize: 10, color: '#666' },
  miniCardPriceRow: { alignItems: 'center' },
  miniCardPrice: { fontSize: 11, fontFamily: "Alexandria-Black" },
  miniCardCurrency: { fontSize: 8, color: '#999' },
  closedBadgeMini: { backgroundColor: '#FEE4E2', padding: 2, borderRadius: 4 },
  closedBadgeTextMini: { fontSize: 8, color: '#D92D20' },
  hoursGridContainer: { marginVertical: 16, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16 },
  gridHeader: { alignItems: 'center', marginBottom: 12 },
  gridTitleLarge: { fontSize: 16, fontFamily: "Alexandria-Black" },
  legendText: { fontSize: 10, color: '#666' },
  gridContent: { gap: 6 },
  hourGridRow: { flexDirection: 'row', alignItems: 'center', height: 40 },
  rowIconOuter: { width: 30 },
  hourSquare: { flex: 1, height: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
  hourSquareMerged: { height: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  hourText: { fontSize: 12, color: '#999' },
  shiftOverlayText: { fontSize: 10, color: '#fff', fontFamily: "Alexandria-Bold" },
  swipeableContainer: { borderRadius: 20 },
  swipeActions: { flexDirection: 'row', height: '100%' },
  swipeAction: { width: 70, justifyContent: 'center', alignItems: 'center' },
  swipeActionText: { fontSize: 10, fontFamily: "Alexandria-Bold" },
  modalTitle: { fontSize: 20, fontFamily: "Alexandria-Black", marginBottom: 20 },
  modalTitleCompact: { fontSize: 18, fontFamily: "Alexandria-Black" },
  label: { fontSize: 14, fontFamily: "Alexandria-Bold", marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
  saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: "Alexandria-Black" },
  quickActionCardNew: { backgroundColor: Colors.primary, padding: 16, borderRadius: 16, marginTop: 12 },
  quickLabelNew: { color: '#fff', fontSize: 12, marginBottom: 4 },
  quickInputNew: { color: '#fff', fontSize: 18, fontFamily: "Alexandria-Black" },
  pricingRowModern: { padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  pricingRowStopped: { backgroundColor: '#F9FAFB', opacity: 0.7 },
  dayFullName: { fontSize: 14, fontFamily: "Alexandria-Bold" },
  priceControlWrapper: { marginTop: 12, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 8 },
  pricingInputModern: { fontSize: 16, fontFamily: "Alexandria-Black", textAlign: 'center' },
  pricingFloatingFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#fff' },
  applyBtnLargeModern: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  applyBtnTextLarge: { color: '#fff', fontFamily: "Alexandria-Black" },
  inactiveBadge: { backgroundColor: '#F2F4F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, justifyContent: 'center' },
  inactiveBadgeText: { fontSize: 10, color: '#667085', fontFamily: 'Alexandria-Bold' },
  policyFormCard: { padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 12 },
  chaletSelectCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  dayIndicator: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  dayIndicatorText: { fontSize: 14, fontFamily: 'Alexandria-Black', color: Colors.primary },
  cardInactive: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  shiftStatusHighlight: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F0F2F7', alignItems: 'center', ...Shadows.small },
  statusIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statusLabelLarge: { fontSize: 14, fontFamily: 'Alexandria-Bold', color: '#1F2937' },
  statusValueLarge: { fontSize: 11, fontFamily: 'Alexandria-Medium', marginTop: 2 },
  miniQuickBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniQuickBtnText: { color: '#fff', fontSize: 10, fontFamily: 'Alexandria-Bold' },
});
