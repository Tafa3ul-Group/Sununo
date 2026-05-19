import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import {
  SolarAddCircleBold,
  SolarAltArrowDownBold,
  SolarAltArrowUpBold,
  SolarBanknoteBold,
  SolarCalendarBold,
  SolarCheckCircleBold,
  SolarClockCircleBold,
  SolarCloseBold,
  SolarInfoCircleBold,
  SolarLightbulbBold,
  SolarMoonBold,
  SolarPenBold,
  SolarShieldBold,
  SolarSunBold,
  SolarTrashBinBold
} from '@/components/icons/solar-icons';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, Shadows } from '@/constants/theme';
import i18n from "@/i18n";
import { RootState } from '@/store';
import {
  useCreateShiftMutation,
  useDeleteShiftMutation,
  useGetChaletShiftsQuery,
  useGetOwnerChaletDetailsQuery,
  useGetOwnerChaletsQuery,
  useGetShiftPricingQuery,
  useSetShiftPricingMutation,
  useUpdateShiftMutation,
  useUpdateShiftPricingDayMutation
} from '@/store/api/apiSlice';
import { formatPrice } from '@/utils/format';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Keyboard,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';

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

  const flexDirection = 'row';

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

      <View style={[styles.pricingGrid, { flexDirection: 'row' }]}>
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



const getShiftIcon = (shift: any, shiftName: string) => {
  const type = (shift?.type || "").toUpperCase();
  if (type === "MORNING") {
    return require("../../../assets/shifts/sun.svg");
  }
  if (type === "EVENING" || type === "NIGHT") {
    return require("../../../assets/shifts/night.svg");
  }
  if (type === "OVERNIGHT") {
    return require("../../../assets/shifts/sleep.svg");
  }
  if (type === "CUSTOM" || type === "CUSTEM") {
    return require("../../../assets/shifts/sun.svg");
  }

  // Fallback to name checking
  const nameAr = (shiftName || "").toLowerCase();
  const nameEn = (shiftName || "").toLowerCase();
  if (nameAr.includes("صباح") || nameEn.includes("morning")) {
    return require("../../../assets/shifts/sun.svg");
  }
  if (nameAr.includes("مساء") || nameAr.includes("ليل") || nameEn.includes("evening") || nameEn.includes("night") || nameEn.includes("eveningshift")) {
    return require("../../../assets/shifts/night.svg");
  }
  if (nameAr.includes("مبيت") || nameEn.includes("overnight")) {
    return require("../../../assets/shifts/sleep.svg");
  }

  // Fallback to time-based detection
  const startTime = shift?.startTime || "";
  if (startTime) {
    const hour = parseInt(startTime.split(":")[0]);
    if (!isNaN(hour)) {
      if (hour >= 5 && hour < 14) {
        return require("../../../assets/shifts/sun.svg");
      } else if (hour >= 14 && hour < 20) {
        return require("../../../assets/shifts/night.svg");
      } else {
        return require("../../../assets/shifts/sleep.svg");
      }
    }
  }

  // Default fallback
  return require("../../../assets/shifts/sun.svg");
};

const shiftTime = (timeStr: string, minutesToShift: number): string => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;

  let totalMinutes = h * 60 + m + minutesToShift;

  // Wrap around for 24-hour clock
  totalMinutes = (totalMinutes % 1440 + 1440) % 1440;

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;

  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
};

const getShiftIntervals = (startTime: string, endTime: string): { start: number; end: number }[] => {
  if (!startTime || !endTime) return [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const s = (isNaN(sh) ? 0 : sh) * 60 + (isNaN(sm) ? 0 : sm);
  const e = (isNaN(eh) ? 0 : eh) * 60 + (isNaN(em) ? 0 : em);

  if (s === e) {
    return [{ start: 0, end: 1440 }];
  }
  if (s > e) {
    return [
      { start: s, end: 1440 },
      { start: 0, end: e }
    ];
  }
  return [{ start: s, end: e }];
};

const checkShiftOverlaps = (shiftsList: any[]): { hasOverlap: boolean; overlappingIds: string[]; conflictMsg?: { ar: string; en: string } } => {
  const overlappingIds: string[] = [];
  let conflictMsg: { ar: string; en: string } | undefined = undefined;

  for (let i = 0; i < shiftsList.length; i++) {
    for (let j = i + 1; j < shiftsList.length; j++) {
      const s1 = shiftsList[i];
      const s2 = shiftsList[j];

      const intervals1 = getShiftIntervals(s1.startTime, s1.endTime);
      const intervals2 = getShiftIntervals(s2.startTime, s2.endTime);

      let isOverlapping = false;
      for (const int1 of intervals1) {
        for (const int2 of intervals2) {
          if (Math.max(int1.start, int2.start) < Math.min(int1.end, int2.end)) {
            isOverlapping = true;
            break;
          }
        }
        if (isOverlapping) break;
      }

      if (isOverlapping) {
        if (!overlappingIds.includes(s1.id)) overlappingIds.push(s1.id);
        if (!overlappingIds.includes(s2.id)) overlappingIds.push(s2.id);

        const name1Ar = s1.name?.ar || s1.name;
        const name1En = s1.name?.en || s1.name;
        const name2Ar = s2.name?.ar || s2.name;
        const name2En = s2.name?.en || s2.name;

        conflictMsg = {
          ar: `تداخل بين (${name1Ar}) و (${name2Ar})`,
          en: `Overlap between (${name1En}) and (${name2En})`
        };
      }
    }
  }

  return {
    hasOverlap: overlappingIds.length > 0,
    overlappingIds,
    conflictMsg
  };
};

const areAllHoursCovered = (shiftsList: any[]) => {
  if (!shiftsList || shiftsList.length === 0) return false;

  const hoursCovered = new Array(24).fill(false);

  shiftsList.forEach((s: any) => {
    if (!s.startTime || !s.endTime) return;
    const sT = parseInt(s.startTime.split(':')[0]);
    const sE = parseInt(s.endTime.split(':')[0]);
    if (isNaN(sT) || isNaN(sE)) return;

    for (let h = 0; h < 24; h++) {
      const isNight = sT > sE;
      const is24Hours = sT === sE;
      const isCovered = is24Hours
        ? true
        : isNight
          ? (h >= sT || h < sE)
          : (h >= sT && h < sE);

      if (isCovered) {
        hoursCovered[h] = true;
      }
    }
  });

  return hoursCovered.every(covered => covered === true);
};

export default function ShiftsAndPricesScreen() {
  const router = useRouter();
  const { id: initialId } = useLocalSearchParams();
  const [selectedChaletId, setSelectedChaletId] = useState<string | null>(initialId as string || null);
  const { t } = useTranslation();
  const { language, selectedChalet } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? (isRTL ? 'مساءً' : 'PM') : (isRTL ? 'صباحاً' : 'AM');
    const hours12 = h % 12 || 12;
    return `${hours12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const adjustShiftFormTime = (field: 'startTime' | 'endTime', amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShiftForm(prev => {
      const originalTime = prev[field];
      const newTime = shiftTime(originalTime, amount);
      return { ...prev, [field]: newTime };
    });
  };

  const { data: ownerChaletsResponse, isLoading: isLoadingOwnerChalets } = useGetOwnerChaletsQuery({});
  const ownerChalets = ownerChaletsResponse?.data || [];

  const { data: shiftsResponse, isLoading: isLoadingShifts, refetch: refetchShifts } = useGetChaletShiftsQuery(selectedChaletId, { skip: !selectedChaletId });
  const shifts = shiftsResponse?.data || shiftsResponse;

  React.useEffect(() => {
    if (selectedChalet?.id && selectedChalet.id !== 'all') {
      setSelectedChaletId(selectedChalet.id);
    } else if (!selectedChaletId && ownerChalets.length > 0) {
      setSelectedChaletId(ownerChalets[0].id);
    }
  }, [ownerChalets, selectedChaletId, selectedChalet?.id]);

  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const shiftSheetRef = useRef<BottomSheetModal>(null);
  const pricingSheetRef = useRef<BottomSheetModal>(null);
  const chaletSelectSheetRef = useRef<BottomSheetModal>(null);

  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '08:00', endTime: '23:00', price: '', isActive: true });
  const [pricingForm, setPricingForm] = useState<any[]>([]);
  const [modalActiveStatus, setModalActiveStatus] = useState(true);
  const [bulkPrice, setBulkPrice] = useState('');

  const getMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getIntervals = (startStr: string, endStr: string): Array<[number, number]> => {
    const start = getMinutes(startStr);
    const end = getMinutes(endStr);
    if (end < start) {
      return [[start, 1440], [0, end]];
    } else if (end === start) {
      return [[0, 1440]];
    } else {
      return [[start, end]];
    }
  };

  const shiftsOverlap = (s1Start: string, s1End: string, s2Start: string, s2End: string): boolean => {
    const start1 = getMinutes(s1Start);
    const end1 = getMinutes(s1End);
    const start2 = getMinutes(s2Start);
    const end2 = getMinutes(s2End);

    const getIntervalsFromMin = (start: number, end: number): Array<[number, number]> => {
      if (end < start) {
        return [[start, 1440], [0, end]];
      } else if (end === start) {
        return [[0, 1440]];
      } else {
        return [[start, end]];
      }
    };

    const int1 = getIntervalsFromMin(start1, end1);
    const int2 = getIntervalsFromMin(start2, end2);

    for (const [s1, e1] of int1) {
      for (const [s2, e2] of int2) {
        if (s1 < e2 && s2 < e1) {
          return true;
        }
      }
    }
    return false;
  };

  const getAvailableIntervals = (shiftsList: any[], currentShiftId?: string | null): string => {
    const busy = new Array(1440).fill(false);
    
    const otherShifts = (shiftsList || []).filter(s => {
      if (currentShiftId && String(s.id) === String(currentShiftId)) return false;
      return s.isActive;
    });

    if (otherShifts.length === 0) {
      return isRTL ? 'متاح طوال اليوم (24 ساعة)' : 'Available all day (24 hours)';
    }

    for (const s of otherShifts) {
      const startMin = getMinutes(s.startTime);
      const endMin = getMinutes(s.endTime);
      if (endMin < startMin) {
        for (let m = startMin; m < 1440; m++) busy[m] = true;
        for (let m = 0; m < endMin; m++) busy[m] = true;
      } else if (endMin === startMin) {
        for (let m = 0; m < 1440; m++) busy[m] = true;
      } else {
        for (let m = startMin; m < endMin; m++) busy[m] = true;
      }
    }

    const freeSegments: Array<[number, number]> = [];
    let inFree = false;
    let freeStart = 0;

    for (let m = 0; m < 1440; m++) {
      if (!busy[m]) {
        if (!inFree) {
          inFree = true;
          freeStart = m;
        }
      } else {
        if (inFree) {
          inFree = false;
          freeSegments.push([freeStart, m]);
        }
      }
    }
    if (inFree) {
      freeSegments.push([freeStart, 1440]);
    }

    if (freeSegments.length > 1 && freeSegments[0][0] === 0 && freeSegments[freeSegments.length - 1][1] === 1440) {
      const last = freeSegments.pop()!;
      freeSegments[0][0] = last[0];
    }

    if (freeSegments.length === 0) {
      return isRTL ? 'لا يوجد وقت متاح' : 'No available time';
    }

    const formatMinToTime = (min: number) => {
      const wrapped = min % 1440;
      const h = Math.floor(wrapped / 60);
      const m = wrapped % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const formattedSegments = freeSegments.map(([start, end]) => {
      const startStr = formatTime12h(formatMinToTime(start));
      const endStr = formatTime12h(formatMinToTime(end));
      return `${startStr} - ${endStr}`;
    });

    return formattedSegments.join(', ');
  };

  const availableTimesText = useMemo(() => {
    return getAvailableIntervals(shifts, selectedShift?.id);
  }, [shifts, selectedShift]);



  const combinedShiftsForOverlapCheck = useMemo(() => {
    if (!shifts) return [];
    
    const list = shifts.map((s: any) => {
      if (selectedShift && String(s.id) === String(selectedShift.id)) {
        return {
          id: String(s.id),
          name: s.name,
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          isActive: shiftForm.isActive
        };
      }
      return {
        id: String(s.id),
        name: s.name,
        startTime: s.startTime?.substring(0, 5),
        endTime: s.endTime?.substring(0, 5),
        isActive: s.isActive
      };
    });

    if (!selectedShift) {
      list.push({
        id: 'new-shift',
        name: isRTL ? 'فترة جديدة' : 'New Shift',
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        isActive: shiftForm.isActive
      });
    }

    return list;
  }, [shifts, shiftForm, selectedShift, isRTL]);

  const singleShiftOverlapInfo = useMemo(() => {
    return checkShiftOverlaps(combinedShiftsForOverlapCheck);
  }, [combinedShiftsForOverlapCheck]);

  const isCurrentShiftOverlapping = useMemo(() => {
    const idToCheck = selectedShift ? String(selectedShift.id) : 'new-shift';
    return singleShiftOverlapInfo.overlappingIds.includes(idToCheck);
  }, [singleShiftOverlapInfo, selectedShift]);

  const { data: chaletResponse } = useGetOwnerChaletDetailsQuery(selectedChaletId, { skip: !selectedChaletId });
  const chalet = chaletResponse?.data || chaletResponse;



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



  React.useEffect(() => {
    setSelectedShift(null);
    setExpandedShift(null);
  }, [selectedChaletId]);

  const [createShift, { isLoading: isCreatingShift }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdatingShift }] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();
  const [setShiftPricing, { isLoading: isSettingPricing }] = useSetShiftPricingMutation();
  const [updateShiftPricingDay] = useUpdateShiftPricingDayMutation();

  const editTimesSheetRef = useRef<BottomSheetModal>(null);
  const [tempShifts, setTempShifts] = useState<{ id: string; name: any; startTime: string; endTime: string; isActive: boolean }[]>([]);
  const [isSavingAllTimes, setIsSavingAllTimes] = useState(false);

  const overlapInfo = useMemo(() => {
    return checkShiftOverlaps(tempShifts);
  }, [tempShifts]);

  const handleOpenEditTimes = () => {
    if (!shifts || shifts.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const copies = shifts.map((s: any) => ({
      id: s.id,
      name: s.name,
      startTime: s.startTime?.substring(0, 5),
      endTime: s.endTime?.substring(0, 5),
      isActive: s.isActive
    }));
    setTempShifts(copies);
    editTimesSheetRef.current?.present();
  };

  const adjustTempShiftTime = (shiftId: string, field: 'startTime' | 'endTime', amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      const originalTime = s[field];
      const newTime = shiftTime(originalTime, amount);
      return { ...s, [field]: newTime };
    }));
  };

  const handleSaveAllTimes = async () => {
    setIsSavingAllTimes(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const changedShifts = tempShifts.filter(temp => {
        const original = shifts.find((s: any) => s.id === temp.id);
        if (!original) return false;
        return original.startTime?.substring(0, 5) !== temp.startTime ||
          original.endTime?.substring(0, 5) !== temp.endTime;
      });

      if (changedShifts.length > 0) {
        await Promise.all(
          changedShifts.map(s => {
            const data = {
              name: s.name,
              startTime: s.startTime,
              endTime: s.endTime,
              isActive: s.isActive
            };
            return updateShift({ chaletId: selectedChaletId, shiftId: s.id, data }).unwrap();
          })
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: isRTL ? 'تم بنجاح' : 'Success',
        text2: isRTL ? 'تم تحديث الأوقات بنجاح' : 'Shift times updated successfully'
      });
      editTimesSheetRef.current?.dismiss();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let displayMsg = e.data?.message || (isRTL ? 'فشل حفظ التعديلات' : 'Failed to save edits');
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: Array.isArray(displayMsg) ? displayMsg[0] : displayMsg
      });
    } finally {
      setIsSavingAllTimes(false);
    }
  };

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

  const textAlign = 'left';
  const flexDirection = 'row';

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



  const saveShift = async () => {
    const isNew = !selectedShift;
    const isMissingRequired = !shiftForm.name || !shiftForm.startTime || !shiftForm.endTime || (isNew && !shiftForm.price);
    if (isMissingRequired) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: isRTL ? 'يرجى ملء كافة الحقول' : 'Please fill all fields' });
      return;
    }

    if (singleShiftOverlapInfo.hasOverlap) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = isRTL ? singleShiftOverlapInfo.conflictMsg?.ar : singleShiftOverlapInfo.conflictMsg?.en;
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ تداخل الأوقات' : 'Time Overlap Conflict',
        text2: msg
      });
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
      Toast.show({
        type: 'success',
        text1: isRTL ? 'نجاح' : 'Success',
        text2: isRTL ? 'تم تحديث حالة الفترة بنجاح' : 'Shift status updated successfully'
      });
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = e?.data?.message || (isRTL ? 'حدث خطأ أثناء تحديث حالة الفترة' : 'An error occurred while updating shift status');
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
            } catch (e) { }
          }
        }
      ]
    );
  };

  if (isLoadingShifts) {
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
    <View style={styles.container}>
      <StatusBar style="dark" />
      <DashboardHeader
        title={chaletName || (isRTL ? 'اختر الشاليه' : 'Select Chalet')}
        showSearch={false}
        showBackButton={true}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <SolarCalendarBold size={24} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { textAlign, marginLeft: 8, marginRight: 8 }]}>{isRTL ? 'الفترات والأسعار' : 'Shifts & Pricing'}</Text>
            </View>

            {shifts && shifts.length > 0 && (
              <View style={styles.bulkTimeAdjustCard}>
                <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', flexDirection }]}>
                  <View style={[styles.row, { gap: 8, flexDirection }]}>
                    <SolarClockCircleBold size={20} color={Colors.primary} />
                    <Text style={styles.bulkTimeAdjustTitle}>
                      {isRTL ? 'تعديل كل الأوقات' : 'Adjust All Times'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleOpenEditTimes}
                    style={styles.adjustTimeBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.adjustTimeBtnText}>
                      {isRTL ? 'تعديل الأوقات' : 'Edit Times'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {shifts?.map((shift: any, index: number) => {
              const isExpanded = expandedShift === shift.id;
              const shiftName = isRTL ? (shift.name?.ar || shift.name) : (shift.name?.en || shift.name);
              const sT = parseInt(shift.startTime?.split(':')[0] || '0');
              const sE = parseInt(shift.endTime?.split(':')[0] || '0');
              const type = (shift?.type || "").toUpperCase();
              const nameLower = shiftName.toLowerCase();

              const isMorning = type === 'MORNING' ||
                nameLower.includes('morning') ||
                nameLower.includes('صباح') ||
                nameLower.includes('يوم') ||
                (type !== 'EVENING' && type !== 'NIGHT' && type !== 'OVERNIGHT' &&
                  !nameLower.includes('evening') && !nameLower.includes('مساء') &&
                  !nameLower.includes('night') && !nameLower.includes('ليل') &&
                  !nameLower.includes('overnight') && !nameLower.includes('مبيت') &&
                  sT >= 5 && sT < 15);

              const isNight = !isMorning;
              const accentColor = isNight ? "#7C3AED" : "#035DF9";

              return (
                <Swipeable
                  key={shift.id}
                  ref={index === 0 ? firstShiftRef : undefined}
                  renderRightActions={!isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                  renderLeftActions={isRTL ? () => renderShiftActions(shift, shiftName) : undefined}
                  containerStyle={styles.swipeableContainer}
                >
                  <View
                    style={[
                      styles.cardFlat,
                      !shift.isActive && styles.cardInactive,
                      {
                        borderStartWidth: 4,
                        borderEndWidth: 1,
                        borderStartColor: shift.isActive ? accentColor : '#9CA3AF',
                        borderEndColor: '#F1F5F9',
                      }
                    ]}
                  >
                    <View style={[styles.row, { padding: 12, borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: '#F0F2F7', justifyContent: 'space-between', flexDirection }]}>
                      <TouchableOpacity
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                        onPress={() => setExpandedShift(isExpanded ? null : shift.id)}
                      >
                        <ExpoImage
                          source={getShiftIcon(shift, shiftName)}
                          style={{
                            width: 28,
                            height: 28,
                            opacity: shift.isActive ? 1 : 0.5,
                          }}
                          contentFit="contain"
                        />

                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[
                            styles.cardTitle,
                            {
                              color: shift.isActive ? accentColor : '#9CA3AF',
                              fontFamily: 'Alexandria-SemiBold',
                              fontSize: 15,
                              textAlign: 'left'
                            }
                          ]}>
                            {shiftName}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <SolarClockCircleBold size={12} color="#94A3B8" />
                            <Text style={{
                              fontSize: 11,
                              color: "#94A3B8",
                              fontFamily: "Alexandria-Medium"
                            }}>
                              {formatTime12h(shift.startTime)} - {formatTime12h(shift.endTime)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginStart: 12, gap: 8 }}>
                        <Switch
                          value={shift.isActive}
                          onValueChange={() => toggleShiftStatus(shift)}
                          trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                          thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                          ios_backgroundColor="#E2E8F0"
                          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                        />
                        <TouchableOpacity
                          onPress={() => setExpandedShift(isExpanded ? null : shift.id)}
                          style={{ padding: 4 }}
                        >
                          {isExpanded ? (
                            <SolarAltArrowUpBold size={18} color="#94A3B8" />
                          ) : (
                            <SolarAltArrowDownBold size={18} color="#94A3B8" />
                          )}
                        </TouchableOpacity>
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
        </ScrollView>
      </View>

      {/* Add Shift Modal */}
      <BottomSheetModal ref={shiftSheetRef} index={0} snapPoints={['75%', '90%']} backdropComponent={renderBackdrop}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 20, flexDirection }]}>
            <View>
              <Text style={styles.modalTitle}>{isRTL ? 'إعداد الفترة' : 'Shift Setup'}</Text>
            </View>
            <TouchableOpacity onPress={() => shiftSheetRef.current?.dismiss()} style={{ backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 }}>
              <SolarCloseBold size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={[styles.row, { justifyContent: 'space-between', marginVertical: 12, flexDirection }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'حالة الفترة' : 'Shift Status'}</Text>
              <Text style={{ fontSize: 11, color: '#64748B', fontFamily: 'Alexandria-Medium', textAlign: 'left' }}>
                {isRTL ? 'تفعيل أو إيقاف هذه الفترة تماماً' : 'Enable or disable this shift globally'}
              </Text>
            </View>
            <Switch
              value={shiftForm.isActive}
              onValueChange={v => setShiftForm({ ...shiftForm, isActive: v })}
              trackColor={{ false: '#D1D1D6', true: Colors.primary }}
            />
          </View>

          {/* Name Label */}
          <Text style={[styles.label, { textAlign: 'left' }]}>{isRTL ? 'الاسم' : 'Name'}</Text>
          <BottomSheetTextInput 
            style={[styles.input, { fontFamily: 'Alexandria-Medium' }]} 
            placeholder={isRTL ? 'مثال: الفترة الصباحية' : 'e.g. Morning Shift'}
            value={shiftForm.name} 
            onChangeText={t => setShiftForm({ ...shiftForm, name: t })} 
          />

          <View style={[
            styles.editTimeRowCard, 
            { marginBottom: 20, marginTop: 10 },
            isCurrentShiftOverlapping && { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }
          ]}>
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexDirection }]}>
              <Text style={[styles.timeLabelText, { fontSize: 13, fontFamily: 'Alexandria-Bold', color: '#475569' }, isCurrentShiftOverlapping && { color: '#991B1B' }]}>
                {isRTL ? 'أوقات الفترة' : 'Shift Times'}
              </Text>
              {isCurrentShiftOverlapping && (
                <View style={{ backgroundColor: '#FEE4E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, color: '#D92D20', fontFamily: 'Alexandria-Bold' }}>
                    {isRTL ? 'تداخل' : 'Overlap'}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.row, { justifyContent: 'space-between', flexDirection }]}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.timeLabelText}>{isRTL ? 'وقت البدء' : 'Start Time'}</Text>
                <View style={{ alignItems: 'center', marginTop: 6 }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <TouchableOpacity onPress={() => adjustShiftFormTime('startTime', -30)} style={styles.adjustTimeBtnSmall}>
                      <Text style={styles.adjustTimeBtnTextSmall}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeValueText, isCurrentShiftOverlapping && { color: '#D92D20' }]}>{formatTime12h(shiftForm.startTime)}</Text>
                    <TouchableOpacity onPress={() => adjustShiftFormTime('startTime', 30)} style={styles.adjustTimeBtnSmall}>
                      <Text style={styles.adjustTimeBtnTextSmall}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={{ width: 1, height: '80%', backgroundColor: '#E2E8F0', alignSelf: 'center' }} />

              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.timeLabelText}>{isRTL ? 'وقت الانتهاء' : 'End Time'}</Text>
                <View style={{ alignItems: 'center', marginTop: 6 }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <TouchableOpacity onPress={() => adjustShiftFormTime('endTime', -30)} style={styles.adjustTimeBtnSmall}>
                      <Text style={styles.adjustTimeBtnTextSmall}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeValueText, isCurrentShiftOverlapping && { color: '#D92D20' }]}>{formatTime12h(shiftForm.endTime)}</Text>
                    <TouchableOpacity onPress={() => adjustShiftFormTime('endTime', 30)} style={styles.adjustTimeBtnSmall}>
                      <Text style={styles.adjustTimeBtnTextSmall}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Available free times */}
            <View style={{
              borderTopWidth: 1,
              borderTopColor: isCurrentShiftOverlapping ? '#FCA5A5' : '#E2E8F0',
              paddingTop: 10,
              marginTop: 12
            }}>
              <Text style={{
                fontSize: 10,
                color: isCurrentShiftOverlapping ? '#991B1B' : '#64748B',
                fontFamily: 'Alexandria-Medium',
                textAlign: 'left',
                marginBottom: 4
              }}>
                {isRTL ? 'الأوقات الشاغرة المتاحة للاختيار:' : 'Available free times for selection:'}
              </Text>
              <Text style={{
                fontSize: 11,
                color: isCurrentShiftOverlapping ? '#B91C1C' : '#0284C7',
                fontFamily: 'Alexandria-Bold',
                textAlign: 'left'
              }}>
                {availableTimesText}
              </Text>
            </View>

            {/* Overlap Warning message */}
            {isCurrentShiftOverlapping && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FEE4E2',
                borderRadius: 8,
                padding: 10,
                marginTop: 10,
                gap: 6
              }}>
                <SolarInfoCircleBold size={16} color="#D92D20" />
                <Text style={{
                  color: '#D92D20',
                  fontSize: 11,
                  fontFamily: 'Alexandria-Medium',
                  flex: 1,
                  textAlign: 'left'
                }}>
                  {isRTL 
                    ? `تنبيه: ${singleShiftOverlapInfo.conflictMsg?.ar}. يجب تغيير الوقت.`
                    : `Warning: ${singleShiftOverlapInfo.conflictMsg?.en}. Please change the time.`}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.label, { textAlign: 'left' }]}>
            {!selectedShift ? (isRTL ? 'السعر الأساسي اليومي' : 'Base Daily Price') : (isRTL ? 'تحديث السعر لجميع الأيام (اختياري)' : 'Update price for all days (Optional)')}
          </Text>
          <BottomSheetTextInput 
            style={[styles.input, { fontFamily: 'Alexandria-Medium' }]} 
            keyboardType="numeric"
            placeholder={isRTL ? 'مثال: 50000' : 'e.g. 50000'}
            value={shiftForm.price} 
            onChangeText={t => setShiftForm({ ...shiftForm, price: t })} 
          />

          <TouchableOpacity 
            style={[styles.saveBtn, singleShiftOverlapInfo.hasOverlap && { opacity: 0.5 }]} 
            onPress={saveShift}
            disabled={singleShiftOverlapInfo.hasOverlap}
          >
            <Text style={styles.saveBtnText}>{isRTL ? 'حفظ الفترة' : 'Save Shift'}</Text>
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
              <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
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

              <View style={[styles.shiftStatusHighlight, { flexDirection: 'row' }]}>
                <View style={[styles.row, { flex: 1 }]}>
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
                <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                  <View style={[styles.row]}>
                    <SolarLightbulbBold size={16} color="#FFF" style={{ marginHorizontal: 4 }} />
                    <Text style={styles.quickLabelNew}>{isRTL ? 'إجراءات سريعة لجميع الأيام' : 'Quick Batch Actions'}</Text>
                  </View>
                  <View style={[styles.row, { gap: 8 }]}>
                    <TouchableOpacity onPress={handleEnableAllDays} style={styles.miniQuickBtn}>
                      <Text style={styles.miniQuickBtnText}>{isRTL ? 'تفعيل الكل' : 'Enable All'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDisableAllDays} style={[styles.miniQuickBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={styles.miniQuickBtnText}>{isRTL ? 'إيقاف الكل' : 'Disable All'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.row, { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4 }]}>
                  <BottomSheetTextInput
                    style={[styles.quickInputNew, { flex: 1, height: 44, paddingHorizontal: 12 }]}
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
                { marginHorizontal: 20, flexDirection: 'row' }
              ]}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.row, { justifyContent: 'space-between', marginBottom: item.price > 1 ? 12 : 0 }]}>
                    <View style={[styles.row]}>
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

                    <View style={[styles.row]}>
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
                    <View style={[styles.priceControlWrapper]}>
                      <SolarBanknoteBold size={20} color={Colors.primary} style={{ marginHorizontal: 8 }} />
                      <BottomSheetTextInput
                        style={[styles.pricingInputModern, { flex: 1 }]}
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

      {/* Edit All Times Modal */}
      <BottomSheetModal
        ref={editTimesSheetRef}
        index={0}
        snapPoints={['75%', '90%']}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 32, backgroundColor: '#F8F9FA' }}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={{ padding: 20 }}>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
              <View>
                <Text style={styles.modalTitleCompact}>{isRTL ? 'تعديل أوقات الفترات' : 'Edit Shift Times'}</Text>
                <Text style={{ fontSize: 11, color: '#64748B', fontFamily: 'Alexandria-Medium', marginTop: 2 }}>
                  {isRTL ? 'تعديل وقت البدء والانتهاء لكل فترة بمقدار نصف ساعة' : 'Adjust start and end times by half an hour'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => editTimesSheetRef.current?.dismiss()} style={{ backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 }}>
                <SolarCloseBold size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Overlap Warning Banner */}
          {overlapInfo.hasOverlap && (
            <View style={styles.overlapWarningCard}>
              <SolarInfoCircleBold size={18} color="#D92D20" />
              <Text style={styles.overlapWarningText}>
                {isRTL ? 'تنبيه: يوجد تداخل في الأوقات!' : 'Warning: Shift times overlap!'}{' '}
                {isRTL ? overlapInfo.conflictMsg?.ar : overlapInfo.conflictMsg?.en}
              </Text>
            </View>
          )}

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {tempShifts.map((item) => {
              const shiftName = isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name);
              const isOverlapping = overlapInfo.overlappingIds.includes(item.id);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.editTimeRowCard,
                    isOverlapping && { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }
                  ]}
                >
                  <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                    <Text style={[styles.editTimeCardTitle, isOverlapping && { color: '#991B1B' }]}>{shiftName}</Text>
                    {isOverlapping && (
                      <View style={{ backgroundColor: '#FEE4E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, color: '#D92D20', fontFamily: 'Alexandria-Bold' }}>
                          {isRTL ? 'تداخل' : 'Overlap'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.row, { justifyContent: 'space-between', marginTop: 12, flexDirection }]}>
                    {/* Start Time Section */}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.timeLabelText}>{isRTL ? 'وقت البدء' : 'Start Time'}</Text>
                      <View style={[styles.row, { marginTop: 6, gap: 8 }]}>
                        <TouchableOpacity
                          onPress={() => adjustTempShiftTime(item.id, 'startTime', -30)}
                          style={styles.adjustTimeBtnSmall}
                        >
                          <Text style={styles.adjustTimeBtnTextSmall}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeValueText}>{formatTime12h(item.startTime)}</Text>
                        <TouchableOpacity
                          onPress={() => adjustTempShiftTime(item.id, 'startTime', 30)}
                          style={styles.adjustTimeBtnSmall}
                        >
                          <Text style={styles.adjustTimeBtnTextSmall}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={{ width: 1, height: '80%', backgroundColor: isOverlapping ? '#FCA5A5' : '#E2E8F0', alignSelf: 'center' }} />

                    {/* End Time Section */}
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={styles.timeLabelText}>{isRTL ? 'وقت الانتهاء' : 'End Time'}</Text>
                      <View style={[styles.row, { marginTop: 6, gap: 8 }]}>
                        <TouchableOpacity
                          onPress={() => adjustTempShiftTime(item.id, 'endTime', -30)}
                          style={styles.adjustTimeBtnSmall}
                        >
                          <Text style={styles.adjustTimeBtnTextSmall}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeValueText}>{formatTime12h(item.endTime)}</Text>
                        <TouchableOpacity
                          onPress={() => adjustTempShiftTime(item.id, 'endTime', 30)}
                          style={styles.adjustTimeBtnSmall}
                        >
                          <Text style={styles.adjustTimeBtnTextSmall}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ padding: 20, marginTop: 20 }}>
            <TouchableOpacity
              onPress={handleSaveAllTimes}
              style={[
                styles.saveAllBtn,
                (isSavingAllTimes || overlapInfo.hasOverlap) && { backgroundColor: '#CBD5E1', opacity: 0.8 }
              ]}
              disabled={isSavingAllTimes || overlapInfo.hasOverlap}
            >
              {isSavingAllTimes ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveAllBtnText}>
                  {overlapInfo.hasOverlap
                    ? (isRTL ? 'يرجى حل تداخل الأوقات أولاً' : 'Please resolve overlap first')
                    : (isRTL ? 'حفظ التغييرات' : 'Save Changes')
                  }
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Alexandria-Bold", color: '#0F172A' },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardFlat: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: { padding: 16 },
  cardTitle: { fontSize: 14, fontFamily: "Alexandria-SemiBold", color: '#1E293B' },
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
  miniCardPrice: { fontSize: 11, fontFamily: "Alexandria-SemiBold", color: '#1E293B' },
  miniCardCurrency: { fontSize: 8, color: '#999' },
  closedBadgeMini: { backgroundColor: '#FEE4E2', padding: 2, borderRadius: 4 },
  closedBadgeTextMini: { fontSize: 8, color: '#D92D20' },
  hoursGridContainer: { marginVertical: 16, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16 },
  gridHeader: { alignItems: 'center', marginBottom: 12 },
  gridTitleLarge: { fontSize: 14, fontFamily: "Alexandria-Bold", color: '#0F172A' },
  legendText: { fontSize: 10, color: '#666' },
  legendItem: {},
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
  modalTitle: { fontSize: 18, fontFamily: "Alexandria-Bold", color: '#0F172A', marginBottom: 20 },
  modalTitleCompact: { fontSize: 16, fontFamily: "Alexandria-Bold", color: '#0F172A' },
  label: { fontSize: 14, fontFamily: "Alexandria-Bold", marginBottom: 8, width: '100%' },
  input: { backgroundColor: '#F3F4F6', height: 50, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: "Alexandria-Bold" },
  quickActionCardNew: { backgroundColor: Colors.primary, padding: 16, borderRadius: 16, marginTop: 12 },
  quickLabelNew: { color: '#fff', fontSize: 12, marginBottom: 4 },
  quickInputNew: { color: '#fff', fontSize: 16, fontFamily: "Alexandria-Bold", textAlign: I18nManager.isRTL ? 'right' : 'left' },
  pricingRowModern: { padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  pricingRowStopped: { backgroundColor: '#F9FAFB', opacity: 0.7 },
  dayFullName: { fontSize: 14, fontFamily: "Alexandria-Bold" },
  priceControlWrapper: { marginTop: 12, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 8 },
  pricingInputModern: { fontSize: 16, fontFamily: "Alexandria-Bold", textAlign: I18nManager.isRTL ? 'right' : 'left' },
  pricingFloatingFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#fff' },
  applyBtnLargeModern: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  applyBtnTextLarge: { color: '#fff', fontFamily: "Alexandria-Bold" },
  inactiveBadge: { backgroundColor: '#F2F4F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, justifyContent: 'center' },
  inactiveBadgeText: { fontSize: 10, color: '#667085', fontFamily: 'Alexandria-Bold' },
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
  bulkTimeAdjustCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bulkTimeAdjustTitle: {
    fontSize: 13,
    fontFamily: 'Alexandria-SemiBold',
    color: '#334155',
  },
  adjustTimeBtn: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  adjustTimeBtnText: {
    fontSize: 12,
    fontFamily: 'Alexandria-Bold',
    color: Colors.primary,
  },
  editTimeRowCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  editTimeCardTitle: {
    fontSize: 14,
    fontFamily: 'Alexandria-Bold',
    color: '#1E293B',
    textAlign: 'auto',
  },
  timeLabelText: {
    fontSize: 11,
    fontFamily: 'Alexandria-Medium',
    color: '#64748B',
  },
  timeValueText: {
    fontSize: 13,
    fontFamily: 'Alexandria-Bold',
    color: '#0F172A',
    minWidth: 70,
    textAlign: 'center',
  },
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
  saveAllBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAllBtnText: {
    color: '#fff',
    fontFamily: 'Alexandria-Bold',
    fontSize: 15,
  },
  overlapWarningCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overlapWarningText: {
    fontSize: 12,
    fontFamily: 'Alexandria-Medium',
    color: '#92400E',
    flex: 1,
    textAlign: 'auto',
  }
});
