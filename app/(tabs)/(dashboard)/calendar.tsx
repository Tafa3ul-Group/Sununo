import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { StatusBar } from 'expo-status-bar';
import { 
  useGetChaletShiftsQuery, 
  useGetChaletCancellationPoliciesQuery,
  useGetOwnerChaletDetailsQuery,
  useGetShiftPricingQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useSetShiftPricingMutation
} from '@/store/api/apiSlice';
import { HeaderSection } from '@/components/header-section';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { formatPrice } from '@/utils/format';

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
                <View style={styles.pricingCardValue}>
                  <Text style={[styles.pricingCardPrice, isWeekend && styles.weekendText]}>{formatPrice(item.price)}</Text>
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

export default function CalendarScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';

  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  
  // Picker States
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Sheet Refs
  const shiftSheetRef = useRef<BottomSheetModal>(null);
  const pricingSheetRef = useRef<BottomSheetModal>(null);

  // Form States
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '08:00', endTime: '23:00', price: '' });
  const [pricingForm, setPricingForm] = useState<any[]>([]);

  const { data: chaletResponse } = useGetOwnerChaletDetailsQuery(id);
  const chalet = chaletResponse?.data || chaletResponse;

  const { data: shiftsResponse, isLoading: isLoadingShifts, refetch: refetchShifts } = useGetChaletShiftsQuery(id);
  const shifts = shiftsResponse?.data || shiftsResponse;

  const { data: policiesResponse, isLoading: isLoadingPolicies } = useGetChaletCancellationPoliciesQuery(id);
  const policies = policiesResponse?.data || policiesResponse;

  const [createShift, { isLoading: isCreatingShift }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdatingShift }] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();
  const [setShiftPricing, { isLoading: isSettingPricing }] = useSetShiftPricingMutation();

  const textAlign = isRTL ? 'right' : 'left';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const handleAddShift = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedShift(null);
    setShiftForm({ name: '', startTime: '08:00', endTime: '23:00', price: '' });
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
      price: '' // Price is not part of shift entity
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

  const saveShift = async () => {
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
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
        endTime
      };

      if (selectedShift) {
        await updateShift({ chaletId: id, shiftId: selectedShift.id, data }).unwrap();
      } else {
        await createShift({ chaletId: id, data }).unwrap();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: isRTL ? 'تم بنجاح' : 'Success' });
      shiftSheetRef.current?.dismiss();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(e);
      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error' });
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
      try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          
          // Clean the pricing form to only include required fields
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
      } catch (e) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          console.error('Save Pricing Error:', e);
          Toast.show({ 
              type: 'error', 
              text1: isRTL ? 'خطأ' : 'Error',
              text2: isRTL ? 'فشل في حفظ الأسعار، يرجى المحاولة لاحقاً' : 'Failed to save pricing, please try again'
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
        { text: isRTL ? 'حذف' : 'Delete', style: 'destructive', onPress: async () => {
            try {
                await deleteShift({ chaletId: id, shiftId }).unwrap();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        }}
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <HeaderSection 
        title={chaletName}
        showBackButton={true}
        showSearch={false}
        showCategories={false}
        extraIcon={<Ionicons name="refresh" size={normalize.width(18)} color={Colors.primary} />}
        onExtraIconPress={() => refetchShifts()}
      />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Shifts & Pricing Section */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <MaterialCommunityIcons name="calendar-clock" size={22} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { textAlign }]}>{isRTL ? 'الفترات والأسعار' : 'Shifts & Pricing'}</Text>
            </View>
            
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
                            <Text style={styles.timeBadgeText}>{shift.startTime} - {shift.endTime}</Text>
                          </View>
                        </View>
                        
                        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }}>
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
                <Ionicons name="calendar-outline" size={40} color={Colors.text.muted} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>{isRTL ? 'لا توجد فترات مضافة لهذا الشاليه' : 'No shifts added for this chalet'}</Text>
                <TouchableOpacity style={styles.addInlineBtn} onPress={handleAddShift}>
                   <Text style={styles.addInlineText}>{isRTL ? 'إضافة فترة جديدة' : 'Add New Shift'}</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {shifts && shifts.length > 0 && (
                <TouchableOpacity 
                    style={[styles.addShiftRow, { flexDirection }]}
                    onPress={handleAddShift}
                >
                    <Ionicons name="add-circle" size={20} color={Colors.primary} />
                    <Text style={styles.addShiftRowText}>{isRTL ? 'إضافة فترة (Shift) إضافية' : 'Add another shift'}</Text>
                </TouchableOpacity>
            )}
          </View>

          {/* Cancellation Policies Section */}
          <View style={[styles.section, { marginTop: Spacing.md }]}>
            <View style={[styles.sectionHeader, { flexDirection }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { textAlign }]}>{isRTL ? 'سياسات الإلغاء' : 'Cancellation Policies'}</Text>
            </View>
            
            <View style={styles.policyCard}>
              {policies && policies.length > 0 ? (
                policies.map((policy: any, index: number) => (
                  <View key={index} style={[styles.policyItem, index === policies.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[styles.policyHeader, { flexDirection }]}>
                          <View style={[styles.policyDayBox, { flexDirection }]}>
                             <Ionicons name="calendar" size={16} color={Colors.primary} />
                             <Text style={styles.policyDays}>
                                 {isRTL ? `قبل ${policy.daysBeforeBooking} يوم` : `${policy.daysBeforeBooking} days before`}
                             </Text>
                          </View>
                          <View style={styles.penaltyBadge}>
                             <Text style={styles.policyRefund}>
                                 {policy.penaltyPercentage}% {isRTL ? 'خصم' : 'Penalty'}
                             </Text>
                          </View>
                      </View>
                  </View>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                   <Text style={styles.emptyText}>{isRTL ? 'لم يتم تحديد سياسات إلغاء' : 'No cancellation policies defined'}</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.editPoliciesBtn} onPress={() => console.log('Edit Policies')}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <Text style={styles.editPoliciesText}>{isRTL ? 'إدارة السياسات' : 'Manage Policies'}</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={[styles.label, { textAlign }]}>{isRTL ? 'اسم الفترة' : 'Shift Name'}</Text>
            <TextInput 
                style={[styles.input, { textAlign }]} 
                placeholder={isRTL ? 'مثلاً: الفترة الصباحية' : 'e.g. Morning Shift'}
                value={shiftForm.name}
                onChangeText={t => setShiftForm({ ...shiftForm, name: t })}
            />
            
            <View style={[styles.rowInputs, { flexDirection, marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وقت البدء' : 'Start Time'}</Text>
                    <TouchableOpacity 
                        style={[styles.timePickerBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} 
                        onPress={() => setShowStartTimePicker(true)}
                    >
                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                        <Text style={styles.timePickerBtnText}>{shiftForm.startTime}</Text>
                    </TouchableOpacity>
                    {showStartTimePicker && (
                        <DateTimePicker
                            value={getTimeDate(shiftForm.startTime)}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            accentColor={Colors.primary}
                            onChange={(e, d) => onTimeChange(e, d, 'start')}
                            style={{ alignSelf: 'center', marginTop: 10 }}
                        />
                    )}
                </View>
                <View style={{ width: 16 }} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { textAlign }]}>{isRTL ? 'وقت الانتهاء' : 'End Time'}</Text>
                    <TouchableOpacity 
                        style={[styles.timePickerBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} 
                        onPress={() => setShowEndTimePicker(true)}
                    >
                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                        <Text style={styles.timePickerBtnText}>{shiftForm.endTime}</Text>
                    </TouchableOpacity>
                    {showEndTimePicker && (
                        <DateTimePicker
                            value={getTimeDate(shiftForm.endTime)}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            accentColor={Colors.primary}
                            onChange={(e, d) => onTimeChange(e, d, 'end')}
                            style={{ alignSelf: 'center', marginTop: 10 }}
                        />
                    )}
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.saveBtn, { marginTop: 32 }]}
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
          </View>
          
          <View style={styles.quickApplyCard}>
              <View style={[styles.quickApplyRow, { flexDirection }]}>
                <View style={styles.quickApplyIcon}>
                    <Ionicons name="flash" size={18} color={Colors.white} />
                </View>
                <View style={{ flex: 1, marginRight: isRTL ? 12 : 0, marginLeft: isRTL ? 0 : 12 }}>
                    <Text style={styles.quickApplyLabel}>{isRTL ? 'تطبيق سعر موحد للكل' : 'Apply same price to all'}</Text>
                    <View style={[styles.rowInputs, { flexDirection, marginTop: 8 }]}>
                        <TextInput 
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

                return (
                    <View key={index} style={[styles.pricingRow, isWeekend && styles.pricingRowWeekend]}>
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
                                <TextInput 
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

    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    overflow: 'hidden',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: normalize.font(16),
    color: Colors.text.primary,
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
  timeBadge: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeBadgeText: {
    fontSize: normalize.font(12),
    color: Colors.text.primary,
    fontWeight: '600',
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
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E7EAF0',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: normalize.font(14),
    textAlign: 'center',
    lineHeight: 20,
  },
  addInlineBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
  },
  addInlineText: {
    color: Colors.white,
    fontWeight: '700',
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
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
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
  timePickerBtn: {
    backgroundColor: '#F3F4F6',
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  timePickerBtnText: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.primary,
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
  }
});
