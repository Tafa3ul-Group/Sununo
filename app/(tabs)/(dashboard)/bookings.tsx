import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Linking } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, normalize } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { SecondaryButton } from '@/components/user/secondary-button';
import { SolarIcon } from '@/components/ui/solar-icon';
import { useRouter } from 'expo-router';
import { 
  useGetProviderBookingsQuery, 
  useGetProviderBookingDetailsQuery, 
  useGetOwnerChaletsQuery, 
  useGetShiftAvailabilityQuery, 
  useMarkBookingCompletedMutation, 
  useCreateExternalBookingMutation, 
  useDeleteExternalBookingMutation, 
  useCancelBookingMutation 
} from '@/store/api/apiSlice';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetModalProvider, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Status mapping from UI to API
const API_STATUS_MAP: Record<string, string> = {
  new: 'pending_payment',
  confirmed: 'confirmed',
  finished: 'completed',
};

const IDENTITY_BLUE = '#035DF9';

const formatDate = (date: Date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const format12H = (time: string | undefined | null, isRTL: boolean) => {
  if (!time) return '';
  const timePart = time.includes(' ') ? time.split(' ')[1] : time;
  const parts = timePart.split(':');
  if (parts.length < 2) return time;
  let h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM');
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m.padStart(2, '0')} ${ampm}`;
};

const BookingDetailsContent = ({ id, isRTL, t, onRefresh, onClose }: { id: string; isRTL: boolean; t: any; onRefresh?: () => void; onClose?: () => void }) => {
  const { data: bookingDetailsData, isLoading, error } = useGetProviderBookingDetailsQuery(id);
  const [cancelBooking, { isLoading: isCancelLoading }] = useCancelBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();

  if (isLoading) return <View style={styles.sheetLoading}><ActivityIndicator size="large" color={IDENTITY_BLUE} /></View>;
  
  const data = bookingDetailsData?.data || bookingDetailsData;
  
  if (error || !data || !data.id) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <SolarIcon name="danger-circle-bold" size={48} color={Colors.text.muted} />
        <ThemedText style={{ marginTop: 16, color: Colors.text.muted }}>{t('common.error')}</ThemedText>
      </View>
    );
  }

  const bIsExternal = data.bookingStatus === 'EXTERNAL';
  const bChaletName = isRTL ? (data.chalet?.name?.ar || data.chalet?.name) : (data.chalet?.name?.en || data.chalet?.name);
  const bChaletAddress = isRTL ? (data.chalet?.address?.ar || data.chalet?.address) : (data.chalet?.address?.en || data.chalet?.address);
  const bCustomerName = bIsExternal ? (isRTL ? 'حجز خارجي' : 'External Booking') : (data.customer?.name || t('common.user'));
  const bShiftName = isRTL ? (data.shift?.name?.ar || data.shift?.name) : (data.shift?.name?.en || data.shift?.name);
  const bIsNightShift = data.shift?.isOvernight || (data.shift?.name?.en?.toLowerCase().includes('evening'));
  
  const bHandleCall = () => data.customer?.phone && Linking.openURL(`tel:${data.customer.phone}`);
  const bHandleWhatsApp = () => {
    if (data.customer?.phone) {
      const phone = data.customer.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${phone}`);
    }
  };

  const handleCancelAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      isRTL ? 'تنبيه' : 'Attention',
      bIsExternal 
        ? (isRTL ? 'هل أنت متأكد من إلغاء هذا الإغلاق الخارجي؟' : 'Are you sure you want to cancel this external closing?')
        : (isRTL ? 'هل أنت متأكد من إلغاء هذا الحجز؟' : 'Are you sure you want to cancel this booking?'),
      [
        { text: isRTL ? 'تراجع' : 'Back', style: 'cancel' },
        { 
          text: isRTL ? 'نعم، إلغاء' : 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (bIsExternal) {
                 await deleteExternalBooking(data.id).unwrap();
              } else {
                 await cancelBooking(data.id).unwrap();
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onRefresh?.();
              onClose?.();
              Alert.alert(isRTL ? 'تم بنجاح' : 'Success', isRTL ? 'تم الإلغاء بنجاح.' : 'Cancelled successfully.');
            } catch (e: any) {
               Alert.alert(isRTL ? 'خطأ' : 'Error', e?.data?.message || (isRTL ? 'فشل الإلغاء' : 'Failed to cancel'));
            }
          }
        }
      ]
    );
  };

  return (
    <BottomSheetScrollView contentContainerStyle={styles.sheetScroll}>
      <View style={[styles.sheetTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.sheetHeroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'تفاصيل الحجز' : 'Booking Details'}
        </Text>
      </View>

      <View style={styles.customerCard}>
        <View style={[styles.customerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.customerAvatar}>
               {data.customer?.image ? (
                 <Image source={{ uri: data.customer.image }} style={styles.customerAvatarImg} />
               ) : (
                 <SolarIcon name="user-bold" size={18} color="#FFF" />
               )}
            </View>
            <View style={{ flex: 1, marginHorizontal: 10, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
               <Text style={styles.customerNameSheet}>{bCustomerName}</Text>
               <Text style={styles.customerPhone}>{data.customer?.phone || '--'}</Text>
            </View>
            <View style={[styles.contactActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
               <TouchableOpacity style={[styles.contactBtn, styles.contactBtnCall]} onPress={bHandleCall}>
                  <SolarIcon name="phone-bold" size={16} color="#16A34A" />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.contactBtn, styles.contactBtnChat]} onPress={bHandleWhatsApp}>
                  <SolarIcon name="chat-line-linear" size={16} color="#0284C7" />
               </TouchableOpacity>
            </View>
        </View>
      </View>

      <View style={styles.detailCard}>
        <View style={[styles.detailCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.detailIconCircle, { backgroundColor: '#EEF2FF' }]}>
             <SolarIcon name="home-2-bold" size={16} color={Colors.primary} />
          </View>
          <Text style={[styles.detailCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{bChaletName}</Text>
        </View>
        {bChaletAddress && (
          <View style={[styles.detailSubRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SolarIcon name="map-point-linear" size={13} color="#94A3B8" />
            <Text style={styles.detailSubText}>{bChaletAddress}</Text>
          </View>
        )}
        
        <View style={styles.scheduleBlock}>
          <View style={[styles.scheduleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SolarIcon name="calendar-minimalistic-bold" size={16} color={Colors.primary} />
            <Text style={styles.scheduleDate}>{data.bookingDate}</Text>
            <View style={[styles.shiftChip, { backgroundColor: bIsNightShift ? '#F5F3FF' : '#FFF7ED' }]}>
              <SolarIcon name={bIsNightShift ? "moon-bold" : "sun-bold"} size={11} color={bIsNightShift ? "#7C3AED" : "#EA580C"} />
              <Text style={[styles.shiftChipText, { color: bIsNightShift ? "#7C3AED" : "#EA580C" }]}>{bShiftName}</Text>
            </View>
          </View>
          <div className="flex flex-row gap-4 p-4 justify-around">
            <View style={[styles.timeBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.timeLabel}>{isRTL ? 'الدخول' : 'Check-in'}</Text>
              <Text style={styles.timeValue}>{format12H(data.shiftStartTime, isRTL)}</Text>
            </View>
            <View style={styles.timeArrow}>
              <SolarIcon name={isRTL ? "alt-arrow-left-linear" : "alt-arrow-right-linear"} size={14} color="#CBD5E1" />
            </View>
            <View style={[styles.timeBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.timeLabel}>{isRTL ? 'الخروج' : 'Check-out'}</Text>
              <Text style={styles.timeValue}>{format12H(data.shiftEndTime, isRTL)}</Text>
            </View>
          </div>
        </View>
      </View>

      <View style={[styles.paymentCard, { marginTop: 10 }]}>
        <View style={[styles.paymentTotalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.paymentTotalLabel}>{isRTL ? 'إجمالي السعر' : 'Total Price'}</Text>
          <Text style={styles.paymentTotalValue}>{Number(data.totalPrice).toLocaleString()} {t('common.iqd')}</Text>
        </View>
      </View>

      <View style={{ marginTop: 24, gap: 12 }}>
        {(data.status === 'confirmed' || data.status === 'pending_payment') && (
          <SecondaryButton
            label={bIsExternal ? (isRTL ? 'إلغاء الإغلاق الخارجي' : 'Cancel External') : (isRTL ? 'إلغاء الحجز' : 'Cancel Booking')}
            onPress={handleCancelAction}
            isActive={true}
            activeColor="#EF4444"
            icon="delete"
            style={{ width: '100%', height: 50 }}
            isLoading={isCancelLoading || isDeletingExternal}
          />
        )}
      </View>
    </BottomSheetScrollView>
  );
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const [activeTab, setActiveTab ] = React.useState('new');
  const isRTL = language === 'ar';

  const [markAsCompleted, { isLoading: isStatusLoading }] = useMarkBookingCompletedMutation();
  const [cancelBooking, { isLoading: isCancelLoading }] = useCancelBookingMutation();
  const [createExternalBooking, { isLoading: isCreatingExternal }] = useCreateExternalBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();

  const [externalNotes, setExternalNotes] = React.useState('');
  const [baseDate, setBaseDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isFilterByDate, setIsFilterByDate] = React.useState(true);
  const [selectedChaletId, setSelectedChaletId] = React.useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);
  const [selectedShiftForAction, setSelectedShiftForAction] = React.useState<any>(null);

  const detailsSheetRef = React.useRef<BottomSheetModal>(null);
  const shiftSheetRef = React.useRef<BottomSheetModal>(null);

  const TABS = [
    { id: 'new', label: t('dashboard.bookings.new') },
    { id: 'confirmed', label: t('dashboard.bookings.confirmed') },
    { id: 'finished', label: t('dashboard.bookings.finished') },
  ];

  const weekDays = React.useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const { data: chaletsData } = useGetOwnerChaletsQuery(undefined);
  const ownerChalets = React.useMemo(() => chaletsData?.data || [], [chaletsData]);

  const dateString = React.useMemo(() => formatDate(selectedDate), [selectedDate]);

  const { data: bookingsData, isLoading: isBookingsLoading, refetch: refetchBookings } = useGetProviderBookingsQuery({
    status: API_STATUS_MAP[activeTab],
    date: isFilterByDate ? dateString : undefined,
    chaletId: selectedChaletId || undefined,
  }, { refetchOnMountOrArgChange: true });

  const { data: availabilityData, isFetching: isAvailabilityFetching, refetch: refetchAvailabilityData } = useGetShiftAvailabilityQuery({ 
    chaletId: selectedChaletId!, 
    from: dateString, 
    to: dateString 
  }, { skip: !selectedChaletId || !isFilterByDate, refetchOnMountOrArgChange: true });

  const refreshAvailability = () => {
    refetchBookings();
    if (selectedChaletId) refetchAvailabilityData();
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + (direction === 'next' ? 7 : -7));
    setBaseDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setBaseDate(today);
    setSelectedDate(today);
    setIsFilterByDate(true);
  };

  const openBookingDetails = (id: string) => {
    setSelectedBookingId(id);
    detailsSheetRef.current?.present();
  };

  const openShiftActions = (shift: any) => {
    setSelectedShiftForAction(shift);
    shiftSheetRef.current?.present();
  };

  const renderBackdrop = React.useCallback((props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
  ), []);

  const renderShiftsGrid = () => {
    if (isAvailabilityFetching) return <ActivityIndicator color={IDENTITY_BLUE} style={{ padding: 20 }} />;
    const shifts = Array.isArray(availabilityData) ? availabilityData : [];
    if (shifts.length === 0) return <Text style={styles.noAvailabilityText}>{isRTL ? 'لا توجد شيفتات' : 'No shifts available'}</Text>;

    return (
      <View style={styles.shiftsGrid}>
        {shifts.map((shift: any, idx: number) => {
          const name = isRTL ? (shift.shiftName?.ar || shift.shiftName) : (shift.shiftName?.en || shift.shiftName);
          const isNight = shift.isOvernight;
          const isAvailable = shift.isAvailable;
          const accentColor = isNight ? '#7C3AED' : '#EA580C';
          return (
            <TouchableOpacity 
              key={shift.shiftId || idx} 
              style={[styles.shiftCard, !isAvailable && styles.shiftCardBooked]}
              onPress={() => openShiftActions(shift)}
            >
              <View style={[styles.shiftIconRow, { backgroundColor: isNight ? '#F5F3FF' : '#FFF7ED' }]}>
                <SolarIcon name={isNight ? 'moon-bold' : 'sun-bold'} size={20} color={accentColor} />
              </View>
              <Text style={[styles.shiftCardName, { color: accentColor }]}>{name}</Text>
              <Text style={styles.shiftCardTime}>{format12H(shift.startTime, isRTL)} → {format12H(shift.endTime, isRTL)}</Text>
              <View style={[styles.shiftStatusBadge, { backgroundColor: isAvailable ? '#F0FDF4' : '#FEF2F2' }]}>
                <Text style={[styles.microStatusText, { color: isAvailable ? '#16A34A' : '#EF4444' }]}>
                  {isAvailable ? (isRTL ? 'متاح' : 'Available') : (isRTL ? 'محجوز' : 'Booked')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const chaletName = isRTL ? (item.chalet?.name?.ar || item.chalet?.name) : (item.chalet?.name?.en || item.chalet?.name);
    const customerName = item.customer?.name || t('common.user');
    return (
      <TouchableOpacity style={styles.bookingCard} onPress={() => openBookingDetails(item.id)}>
        <View style={[styles.bookingHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.customerSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.avatarPlaceholder}><SolarIcon name="user-bold" size={20} color="#FFF" /></View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.chaletName}>{chaletName}</Text>
            </View>
          </View>
          <Text style={styles.priceText}>{Number(item.totalPrice).toLocaleString()} {t('common.iqd')}</Text>
        </View>
        <View style={[styles.dateHighlight, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 12 }]}>
          <SolarIcon name="calendar-minimalistic-bold" size={16} color={IDENTITY_BLUE} />
          <Text style={styles.dateHighlightText}>{item.bookingDate} - {isRTL ? (item.shift?.name?.ar || item.shift?.name) : (item.shift?.name?.en || item.shift?.name)}</Text>
        </View>
        <div className="flex flex-row justify-between items-center mt-3">
           <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#DCFCE7' : '#FEF3C7' }]}><Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#16A34A' : '#D97706' }]}>{t(`dashboard.bookings.status.${item.status}`)}</Text></View>
           <Text style={styles.codeText}>#{item.bookingCode}</Text>
        </div>
        {item.status === 'confirmed' && (
           <div className="flex flex-row gap-3 mt-4">
              <SecondaryButton
                label={t('dashboard.bookings.complete')}
                onPress={async () => {
                  try {
                    await markAsCompleted(item.id).unwrap();
                    refreshAvailability();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (e) { Alert.alert('Error', 'Update failed'); }
                }}
                isLoading={isStatusLoading}
                isActive={true}
                activeColor={Colors.primary}
                style={{ flex: 1, height: 44 }}
              />
              <SecondaryButton
                label={t('dashboard.bookings.cancel')}
                onPress={async () => {
                   Alert.alert(t('dashboard.bookings.cancel'), isRTL ? 'هل أنت متأكد؟' : 'Are you sure?', [
                     { text: isRTL ? 'تراجع' : 'Back', style: 'cancel' },
                     { text: isRTL ? 'إلغاء' : 'Cancel', style: 'destructive', onPress: async () => {
                        try {
                          await cancelBooking(item.id).unwrap();
                          refreshAvailability();
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e) { Alert.alert('Error', 'Update failed'); }
                     }}
                   ]);
                }}
                isLoading={isCancelLoading}
                isActive={true}
                activeColor="#EF4444"
                style={{ flex: 1, height: 44 }}
              />
           </div>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView style={styles.safeArea}>
          <HeaderSection title={t('dashboard.bookings.title')} showBackButton={true} />
          
          <View style={styles.tabContainer}>
            <View style={[styles.tabs, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {TABS.map((tab) => (
                <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
                  <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.filterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={styles.filterToggle} onPress={() => setIsFilterByDate(!isFilterByDate)}>
              <SolarIcon name="calendar-bold" size={20} color={isFilterByDate ? IDENTITY_BLUE : '#64748B'} />
              <Text style={[styles.filterToggleText, isFilterByDate && { color: IDENTITY_BLUE }]}>{isRTL ? 'التاريخ' : 'Date'}</Text>
            </TouchableOpacity>
            {isFilterByDate && <TouchableOpacity onPress={goToToday} style={styles.todayButton}><Text style={styles.todayButtonText}>{isRTL ? 'اليوم' : 'Today'}</Text></TouchableOpacity>}
          </View>

          {isFilterByDate && (
            <View style={styles.calendarContainer}>
              <View style={[styles.calendarHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => changeWeek('prev')}><SolarIcon name="alt-arrow-left-linear" size={20} color="#64748B" /></TouchableOpacity>
                <Text style={styles.monthLabel}>{selectedDate.toLocaleString(isRTL ? 'ar-IQ' : 'en-US', { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={() => changeWeek('next')}><SolarIcon name="alt-arrow-right-linear" size={20} color="#64748B" /></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.daysScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {weekDays.map((date, idx) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity key={idx} style={[styles.dayItem, isSelected && styles.selectedDayItem]} onPress={() => setSelectedDate(date)}>
                      <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>{date.toLocaleString(isRTL ? 'ar-IQ' : 'en-US', { weekday: 'short' }).slice(0, 2)}</Text>
                      <View style={[styles.dateCircle, isSelected && styles.selectedDateCircle]}><Text style={[styles.dateText, isSelected && styles.selectedDateText]}>{date.getDate()}</Text></View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {isFilterByDate && ownerChalets.length > 0 && (
            <View style={styles.availabilitySection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chaletChipsScroll}>
                {ownerChalets.map((chalet: any) => (
                  <TouchableOpacity key={chalet.id} style={[styles.chaletChip, selectedChaletId === chalet.id && styles.chaletChipActive]} onPress={() => setSelectedChaletId(selectedChaletId === chalet.id ? null : chalet.id)}>
                    <SolarIcon name="home-2-bold" size={14} color={selectedChaletId === chalet.id ? '#FFF' : Colors.primary} />
                    <Text style={[styles.chaletChipText, selectedChaletId === chalet.id && { color: '#FFF' }]}>{isRTL ? chalet.name?.ar : chalet.name?.en}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedChaletId && renderShiftsGrid()}
            </View>
          )}

          <FlashList
            data={bookingsData?.data || []}
            renderItem={renderBookingItem}
            estimatedItemSize={150}
            contentContainerStyle={{ padding: 16 }}
            onRefresh={refreshAvailability}
            refreshing={isBookingsLoading}
            ListEmptyComponent={<View style={{ padding: 40, alignItems: 'center' }}><SolarIcon name="calendar-linear" size={64} color="#CBD5E1" /><Text style={{ marginTop: 16, color: Colors.text.muted }}>{isRTL ? 'لا توجد حجوزات' : 'No bookings'}</Text></View>}
          />

          <BottomSheetModal ref={detailsSheetRef} snapPoints={['85%']} backdropComponent={renderBackdrop} enablePanDownToClose onDismiss={() => setSelectedBookingId(null)}>
            <BottomSheetView style={{ flex: 1 }}>
              {selectedBookingId && <BookingDetailsContent id={selectedBookingId} isRTL={isRTL} t={t} onRefresh={refreshAvailability} onClose={() => detailsSheetRef.current?.dismiss()} />}
            </BottomSheetView>
          </BottomSheetModal>

          <BottomSheetModal ref={shiftSheetRef} snapPoints={['60%']} backdropComponent={renderBackdrop} enablePanDownToClose onDismiss={() => setSelectedShiftForAction(null)}>
            <BottomSheetView style={styles.sheetContent}>
              {selectedShiftForAction && (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={[styles.sheetTitle, { textAlign: 'center', marginBottom: 24 }]}>{isRTL ? (selectedShiftForAction.shiftName?.ar || selectedShiftForAction.shiftName) : (selectedShiftForAction.shiftName?.en || selectedShiftForAction.shiftName)}</Text>
                  
                  {selectedShiftForAction.isAvailable ? (
                    <View style={{ width: '100%' }}>
                      <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'ملاحظات الحجز' : 'Booking Notes'}</Text>
                      <BottomSheetTextInput style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]} placeholder={isRTL ? 'زبون خارجي...' : 'External client...'} value={externalNotes} onChangeText={setExternalNotes} multiline />
                      <SecondaryButton label={isRTL ? 'حجز خارجي' : 'External Booking'} onPress={async () => {
                        try {
                          await createExternalBooking({ chaletId: selectedChaletId!, shiftId: selectedShiftForAction.shiftId || selectedShiftForAction.id, date: dateString, notes: externalNotes }).unwrap();
                          refreshAvailability();
                          setExternalNotes('');
                          shiftSheetRef.current?.dismiss();
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e: any) { Alert.alert('Error', e?.data?.message || 'Failed'); }
                      }} isActive={true} activeColor="#EF4444" isLoading={isCreatingExternal} style={{ height: 50 }} />
                    </View>
                  ) : (
                    <View style={{ width: '100%', gap: 12 }}>
                        <Text style={{ textAlign: 'center', color: '#64748B', marginBottom: 12 }}>{isRTL ? 'هذا الشفت محجوز حالياً' : 'This shift is currently booked'}</Text>
                        <SecondaryButton label={isRTL ? 'إلغاء الإغلاق/الحجز' : 'Cancel Closing/Booking'} onPress={async () => {
                          try {
                            const bId = selectedShiftForAction.booking?.id || selectedShiftForAction.bookingId;
                            if (!bId) throw new Error('No ID');
                            
                            if (selectedShiftForAction.booking?.status === 'external') await deleteExternalBooking(bId).unwrap();
                            else await cancelBooking(bId).unwrap();
                            
                            refreshAvailability();
                            shiftSheetRef.current?.dismiss();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          } catch (e) { Alert.alert('Error', 'Action failed'); }
                        }} isActive={true} activeColor="#EF4444" isLoading={isCancelLoading || isDeletingExternal} style={{ height: 50 }} />
                    </View>
                  )}
                </View>
              )}
            </BottomSheetView>
          </BottomSheetModal>
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  tabContainer: { paddingHorizontal: 16, marginBottom: 12 },
  tabs: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: normalize.font(14), color: '#64748B', fontWeight: '600' },
  activeTabText: { color: IDENTITY_BLUE, fontWeight: '700' },
  filterRow: { paddingHorizontal: 16, marginBottom: 16, justifyContent: 'space-between', alignItems: 'center' },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterToggleText: { fontSize: normalize.font(14), fontWeight: '600', color: '#64748B' },
  todayButton: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  todayButtonText: { color: IDENTITY_BLUE, fontWeight: '700', fontSize: normalize.font(12) },
  calendarContainer: { paddingHorizontal: 16, marginBottom: 16 },
  calendarHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthLabel: { fontSize: normalize.font(16), fontWeight: '700' },
  daysScroll: { gap: 10 },
  dayItem: { alignItems: 'center', width: 45, paddingVertical: 10, borderRadius: 12 },
  selectedDayItem: { backgroundColor: IDENTITY_BLUE },
  dayLabel: { fontSize: normalize.font(12), color: '#64748B', marginBottom: 4 },
  selectedDayLabel: { color: '#FFF' },
  dateCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  selectedDateCircle: { backgroundColor: '#FFF' },
  dateText: { fontSize: normalize.font(14), fontWeight: '700' },
  selectedDateText: { color: IDENTITY_BLUE },
  availabilitySection: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  chaletChipsScroll: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  chaletChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  chaletChipActive: { backgroundColor: IDENTITY_BLUE, borderColor: IDENTITY_BLUE },
  chaletChipText: { fontSize: normalize.font(12), fontWeight: '600' },
  shiftsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  shiftCard: { flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  shiftCardBooked: { opacity: 0.6 },
  shiftIconRow: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  shiftCardName: { fontSize: normalize.font(14), fontWeight: '700' },
  shiftCardTime: { fontSize: normalize.font(11), color: '#64748B', marginTop: 4 },
  shiftStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 8 },
  microStatusText: { fontSize: normalize.font(10), fontWeight: '700' },
  noAvailabilityText: { textAlign: 'center', padding: 20, color: '#64748B' },
  bookingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  bookingHeader: { justifyContent: 'space-between', alignItems: 'center' },
  customerSection: { gap: 10, alignItems: 'center' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 12, backgroundColor: IDENTITY_BLUE, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: normalize.font(15), fontWeight: '700' },
  chaletName: { fontSize: normalize.font(12), color: '#64748B' },
  priceText: { fontSize: normalize.font(15), fontWeight: '800', color: IDENTITY_BLUE },
  dateHighlight: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, gap: 8, alignItems: 'center' },
  dateHighlightText: { fontSize: normalize.font(13), fontWeight: '600', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: normalize.font(11), fontWeight: '700' },
  codeText: { fontSize: normalize.font(12), color: '#64748B', fontWeight: '500' },
  sheetLoading: { padding: 50, alignItems: 'center' },
  sheetScroll: { padding: 20 },
  sheetTopRow: { marginBottom: 20 },
  sheetHeroTitle: { fontSize: normalize.font(18), fontWeight: '800' },
  customerCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 },
  customerRow: { alignItems: 'center' },
  customerAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: IDENTITY_BLUE, justifyContent: 'center', alignItems: 'center' },
  customerAvatarImg: { width: 44, height: 44, borderRadius: 12 },
  customerNameSheet: { fontSize: normalize.font(15), fontWeight: '700' },
  customerPhone: { fontSize: normalize.font(13), color: '#64748B' },
  contactActions: { gap: 8 },
  contactBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  contactBtnCall: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  contactBtnChat: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  detailCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  detailCardHeader: { alignItems: 'center', gap: 8, marginBottom: 8 },
  detailIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailCardTitle: { fontSize: normalize.font(15), fontWeight: '700', flex: 1 },
  detailSubRow: { paddingLeft: 40, alignItems: 'center', gap: 6, marginBottom: 12 },
  detailSubText: { fontSize: normalize.font(12), color: '#64748B' },
  scheduleBlock: { backgroundColor: '#F8FAFC', borderRadius: 10, overflow: 'hidden' },
  scheduleRow: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', gap: 8 },
  scheduleDate: { fontSize: normalize.font(13), fontWeight: '700', flex: 1 },
  shiftChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  shiftChipText: { fontSize: normalize.font(10), fontWeight: '700' },
  timeLabel: { fontSize: normalize.font(10), color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  timeValue: { fontSize: normalize.font(14), fontWeight: '800' },
  timeArrow: { paddingHorizontal: 8 },
  paymentTotalValue: { fontSize: normalize.font(16), fontWeight: '800', color: IDENTITY_BLUE },
  paymentCard: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10 },
  paymentTotalRow: { justifyContent: 'space-between', alignItems: 'center' },
  paymentTotalLabel: { fontSize: normalize.font(13), fontWeight: '600' },
  sheetContent: { flex: 1 },
  sheetTitle: { fontSize: normalize.font(18), fontWeight: '800', marginBottom: 16 },
  textInput: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, minHeight: 80, marginBottom: 16, textAlignVertical: 'top' },
  inputLabel: { fontSize: normalize.font(14), fontWeight: '700', color: '#64748B', marginBottom: 8 },
  timeBlock: { gap: 2 },
});
