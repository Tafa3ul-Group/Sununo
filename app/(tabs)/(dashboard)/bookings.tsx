import { HeaderSection } from '@/components/header-section';
import { ThemedText } from '@/components/themed-text';
import { SolarIcon } from '@/components/ui/solar-icon';
import { SecondaryButton } from '@/components/user/secondary-button';
import { Colors, normalize } from '@/constants/theme';
import { RootState } from '@/store';
import {
  useCancelBookingMutation,
  useCreateExternalBookingMutation,
  useDeleteExternalBookingMutation,
  useGetOwnerChaletsQuery,
  useGetProviderBookingDetailsQuery,
  useGetProviderBookingsQuery,
  useGetShiftAvailabilityQuery,
  useMarkBookingCompletedMutation,
  useRejectBookingMutation
} from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

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
  const [rejectBooking, { isLoading: isRejectLoading }] = useRejectBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();
  const [cancelNote, setCancelNote] = React.useState('');
  const [showCancelReason, setShowCancelReason] = React.useState(false);

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

  const bIsExternal = data.bookingStatus === 'EXTERNAL' || data.status === 'external';
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
    if (!showCancelReason && !bIsExternal) {
      setShowCancelReason(true);
      return;
    }

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
                await rejectBooking({ id: data.id, reason: cancelNote || (isRTL ? 'إلغاء من قبل المشغل' : 'Cancelled by provider') }).unwrap();
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
          <View style={[styles.detailCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', padding: 12, justifyContent: 'space-around' }]}>
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
          </View>
        </View>
      </View>

      <View style={[styles.paymentCard, { marginTop: 10 }]}>
        <View style={[styles.paymentTotalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.paymentTotalLabel}>{isRTL ? 'إجمالي السعر' : 'Total Price'}</Text>
          <Text style={styles.paymentTotalValue}>{Number(data.totalPrice).toLocaleString()} {t('common.iqd')}</Text>
        </View>
      </View>

      {data.notes && (
        <View style={[styles.notesContainer, { marginTop: 12, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginBottom: 4 }]}>
            <SolarIcon name="notes-bold" size={16} color={IDENTITY_BLUE} />
            <Text style={styles.notesLabel}>{isRTL ? 'ملاحظات الحجز' : 'Booking Notes'}</Text>
          </View>
          <Text style={[styles.notesText, { textAlign: isRTL ? 'right' : 'left' }]}>{data.notes}</Text>
        </View>
      )}

      {showCancelReason && (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'سبب الإلغاء' : 'Cancellation Reason'}</Text>
          <BottomSheetTextInput
            style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={isRTL ? 'مثلاً: طلب الزبون إلغاء الحجز...' : 'e.g. Customer requested cancellation...'}
            value={cancelNote}
            onChangeText={setCancelNote}
            multiline
          />
        </View>
      )}

      <View style={{ marginTop: 24, gap: 12 }}>
        {(data.status === 'confirmed' || data.status === 'pending_payment' || data.status === 'external' || bIsExternal) && (
          <SecondaryButton
            label={showCancelReason 
              ? (isRTL ? 'تأكيد الإلغاء' : 'Confirm Cancellation') 
              : bIsExternal ? (isRTL ? 'إلغاء الإغلاق الخارجي' : 'Cancel External') : (isRTL ? 'إلغاء الحجز' : 'Cancel Booking')
            }
            onPress={handleCancelAction}
            isActive={true}
            activeColor="#EF4444"
            icon="delete"
            style={{ width: '100%', height: 50 }}
            isLoading={isRejectLoading || isDeletingExternal}
          />
        )}
      </View>
    </BottomSheetScrollView>
  );
};

export default function BookingsScreen() {
  const router = useRouter();
  const { language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const [activeTab] = React.useState('new');
  const isRTL = language === 'ar';

  const [markAsCompleted, { isLoading: isStatusLoading }] = useMarkBookingCompletedMutation();
  const [cancelBooking, { isLoading: isCancelLoading }] = useCancelBookingMutation();
  const [createExternalBooking, { isLoading: isCreatingExternal }] = useCreateExternalBookingMutation();
  const [deleteExternalBooking, { isLoading: isDeletingExternal }] = useDeleteExternalBookingMutation();

  const [externalNotes, setExternalNotes] = React.useState('');
  const [baseDate, setBaseDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isFilterByDate] = React.useState(true);
  const [selectedChaletId, setSelectedChaletId] = React.useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);
  const [selectedShiftForAction, setSelectedShiftForAction] = React.useState<any>(null);

  const detailsSheetRef = React.useRef<BottomSheetModal>(null);
  const shiftSheetRef = React.useRef<BottomSheetModal>(null);
  const monthSheetRef = React.useRef<BottomSheetModal>(null);

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  }, []);

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(2000, i, 1);
      return {
        id: i,
        name: d.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US', { month: 'long' })
      };
    });
  }, [language]);

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

  React.useEffect(() => {
    if (!selectedChaletId && ownerChalets.length > 0) {
      setSelectedChaletId(ownerChalets[0].id);
    }
  }, [ownerChalets, selectedChaletId]);

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

  const selectMonthYear = (month: number, year: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    newDate.setMonth(month);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (newDate.getDate() > daysInMonth) {
      newDate.setDate(daysInMonth);
    }

    setSelectedDate(newDate);
    setBaseDate(newDate);
    monthSheetRef.current?.dismiss();
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
    if (shifts.length === 0) return null;

    return (
      <View style={styles.shiftsGridContainer}>
        {shifts.map((shift: any, idx: number) => {
          const name = isRTL ? (shift.shiftName?.ar || shift.shiftName) : (shift.shiftName?.en || shift.shiftName);
          const isNight = shift.isOvernight;
          const isAvailable = shift.isAvailable;
          const accentColor = isNight ? '#7C3AED' : '#035DF9'; 
          const bgColor = isNight ? '#F5F3FF' : '#EFF6FF';
          
          return (
            <TouchableOpacity
              key={shift.shiftId || idx}
              style={[styles.shiftTile, !isAvailable && styles.shiftTileBooked, { borderLeftColor: accentColor }]}
              onPress={() => openShiftActions(shift)}
              activeOpacity={0.7}
            >
              <View style={[styles.shiftTileContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.shiftTileCore, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.shiftNameGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.shiftTileName, { color: accentColor }]}>{name}</Text>
                    <View style={[styles.shiftTimeGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <SolarIcon name="clock-circle-linear" size={14} color="#94A3B8" />
                      <Text style={styles.shiftTileTime}>{format12H(shift.startTime, isRTL)} - {format12H(shift.endTime, isRTL)}</Text>
                    </View>
                    {!isAvailable && shift.booking && (
                      <View style={[styles.bookingMiniInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.bookingMiniId, { color: accentColor }]}>#{shift.booking.bookingCode?.split('-').slice(-1)[0] || '---'}</Text>
                        <View style={[styles.bookingTypeBadge, { backgroundColor: shift.booking.status === 'external' ? '#FEE2E2' : '#DBEAFE' }]}>
                           <Text style={[styles.bookingTypeBadgeText, { color: shift.booking.status === 'external' ? '#EF4444' : IDENTITY_BLUE }]}>
                             {shift.booking.status === 'external' ? (isRTL ? 'خارجي' : 'External') : (isRTL ? 'تطبيق' : 'App')}
                           </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.shiftStatusColumn, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                  <View style={[styles.statusGlassBadge, { 
                    backgroundColor: isAvailable ? '#DCFCE7' : '#F1F5F9',
                    borderColor: isAvailable ? '#BBF7D0' : '#E2E8F0'
                  }]}>
                    <Text style={[styles.statusBadgeText, { color: isAvailable ? '#16A34A' : '#64748B' }]}>
                      {isAvailable ? (isRTL ? 'متاح' : 'Available') : (isRTL ? 'محجوز' : 'Booked')}
                    </Text>
                    <SolarIcon 
                      name={isAvailable ? "add-circle-bold" : "lock-bold"} 
                      size={14} 
                      color={isAvailable ? '#16A34A' : '#64748B'} 
                      style={{ marginLeft: 6 }} 
                    />
                  </View>
                </View>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#DCFCE7' : '#FEF3C7' }]}><Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#16A34A' : '#D97706' }]}>{t(`dashboard.bookings.status.${item.status}`)}</Text></View>
          <Text style={styles.codeText}>#{item.bookingCode}</Text>
        </View>
        {item.status === 'confirmed' && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
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
                  {
                    text: isRTL ? 'إلغاء' : 'Cancel', style: 'destructive', onPress: async () => {
                      try {
                        await cancelBooking(item.id).unwrap();
                        refreshAvailability();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch (e) { Alert.alert('Error', 'Update failed'); }
                    }
                  }
                ]);
              }}
              isLoading={isCancelLoading}
              isActive={true}
              activeColor="#EF4444"
              style={{ flex: 1, height: 44 }}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection
        title={isRTL ? 'الحجوزات' : 'Bookings'}
        showBackButton={true}
        showSearch={false}
        showCategories={false}
        showExtra={false}
      />

      <View style={styles.calendarContainer}>
        <View style={[styles.calendarHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => changeWeek(isRTL ? 'prev' : 'next')}>
            <SolarIcon name={isRTL ? "alt-arrow-right-linear" : "alt-arrow-left-linear"} size={20} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => monthSheetRef.current?.present()}
            style={styles.monthSelector}
          >
            <Text style={styles.monthLabel}>
              {baseDate.toLocaleString(isRTL ? 'ar-IQ' : 'en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <SolarIcon name="alt-arrow-down-linear" size={14} color={IDENTITY_BLUE} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => changeWeek(isRTL ? 'next' : 'prev')}>
            <SolarIcon name={isRTL ? "alt-arrow-left-linear" : "alt-arrow-right-linear"} size={20} color="#64748B" />
          </TouchableOpacity>
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

      {ownerChalets.length > 0 && selectedChaletId && (
        <View style={styles.availabilitySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chaletChipsScroll}>
            {ownerChalets.map((chalet: any) => (
              <TouchableOpacity key={chalet.id} style={[styles.chaletChip, selectedChaletId === chalet.id && styles.chaletChipActive]} onPress={() => setSelectedChaletId(selectedChaletId === chalet.id ? null : chalet.id)}>
                <SolarIcon name="home-2-bold" size={14} color={selectedChaletId === chalet.id ? '#FFF' : Colors.primary} />
                <Text style={[styles.chaletChipText, selectedChaletId === chalet.id && { color: '#FFF' }]}>{isRTL ? chalet.name?.ar : chalet.name?.en}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {renderShiftsGrid()}
        </View>
      )}

      <FlashList
        data={bookingsData?.data || []}
        renderItem={renderBookingItem}
        estimatedItemSize={150}
        contentContainerStyle={{ padding: 16 }}
        onRefresh={refreshAvailability}
        refreshing={isBookingsLoading}
      />

      {/* Overlays */}
      <BottomSheetModal ref={detailsSheetRef} snapPoints={['85%']} backdropComponent={renderBackdrop} enablePanDownToClose onDismiss={() => setSelectedBookingId(null)}>
        <BottomSheetView style={{ flex: 1 }}>
          {selectedBookingId && <BookingDetailsContent id={selectedBookingId} isRTL={isRTL} t={t} onRefresh={refreshAvailability} onClose={() => detailsSheetRef.current?.dismiss()} />}
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal ref={shiftSheetRef} snapPoints={selectedShiftForAction?.isAvailable ? ['60%'] : ['85%']} backdropComponent={renderBackdrop} enablePanDownToClose onDismiss={() => { setSelectedShiftForAction(null); setExternalNotes(''); }}>
        <BottomSheetView style={styles.sheetContent}>
          {selectedShiftForAction && (
            <>
              {selectedShiftForAction.isAvailable ? (
                <View style={{ padding: 24 }}>
                  <Text style={[styles.sheetTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 24 }]}>
                    {isRTL ? (selectedShiftForAction.shiftName?.ar || selectedShiftForAction.shiftName) : (selectedShiftForAction.shiftName?.en || selectedShiftForAction.shiftName)}
                  </Text>
                  <View style={{ width: '100%' }}>
                    <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'ملاحظات الحجز الخارجي' : 'External Booking Notes'}</Text>
                    <BottomSheetTextInput 
                      style={[styles.textInput, { textAlign: isRTL ? 'right' : 'left' }]} 
                      placeholder={isRTL ? 'اسم الزبون، ملاحظات إضافية...' : 'Customer name, notes...'} 
                      value={externalNotes} 
                      onChangeText={setExternalNotes} 
                      multiline 
                    />
                    <SecondaryButton 
                      label={isRTL ? 'تأكيد الإغلاق الخارجي' : 'Confirm External Closing'} 
                      onPress={async () => {
                        try {
                          await createExternalBooking({ 
                            chaletId: selectedChaletId!, 
                            shiftId: selectedShiftForAction.shiftId || selectedShiftForAction.id, 
                            date: dateString, 
                            notes: externalNotes 
                          }).unwrap();
                          refreshAvailability();
                          setExternalNotes('');
                          shiftSheetRef.current?.dismiss();
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (e: any) { Alert.alert('Error', e?.data?.message || 'Failed'); }
                      }} 
                      isActive={true} 
                      activeColor={IDENTITY_BLUE} 
                      isLoading={isCreatingExternal} 
                      style={{ height: 50 }} 
                    />
                  </View>
                </View>
              ) : (
                <BookingDetailsContent 
                  id={selectedShiftForAction.booking?.id || selectedShiftForAction.bookingId} 
                  isRTL={isRTL} 
                  t={t} 
                  onRefresh={refreshAvailability} 
                  onClose={() => shiftSheetRef.current?.dismiss()} 
                />
              )}
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal ref={monthSheetRef} snapPoints={['50%']} backdropComponent={renderBackdrop} enablePanDownToClose>
        <BottomSheetView style={styles.sheetContent}>
          <View style={{ padding: 24 }}>
            <View style={[styles.sheetHeaderLabelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.modalIconCircle}>
                <SolarIcon name="calendar-bold" size={20} color={IDENTITY_BLUE} />
              </View>
              <Text style={[styles.sheetTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}>
                {isRTL ? 'تحديد الفترة' : 'Select Period'}
              </Text>
            </View>
            
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', height: 300, gap: 16, marginTop: 24 }}>
              {/* Month Selection */}
              <View style={{ flex: 1.5 }}>
                <Text style={[styles.pickerColLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الشهر' : 'Month'}</Text>
                <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {months.map((m) => {
                    const isSelected = selectedDate.getMonth() === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => selectMonthYear(m.id, selectedDate.getFullYear())}
                        style={[styles.pickerItemNew, isSelected && styles.pickerItemActiveNew]}
                      >
                        <Text style={[styles.pickerItemTextNew, isSelected && styles.pickerItemTextActiveNew]}>{m.name}</Text>
                        {isSelected && <View style={styles.activeDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </BottomSheetScrollView>
              </View>

              {/* Year Selection */}
              <View style={{ flex: 1, borderLeftWidth: isRTL ? 0 : 1, borderRightWidth: isRTL ? 1 : 0, borderColor: '#F1F5F9', paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 }}>
                <Text style={[styles.pickerColLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'السنة' : 'Year'}</Text>
                <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  {years.map((y) => {
                    const isSelected = selectedDate.getFullYear() === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        onPress={() => selectMonthYear(selectedDate.getMonth(), y)}
                        style={[styles.pickerItemNew, isSelected && styles.pickerItemActiveNew]}
                      >
                        <Text style={[styles.pickerItemTextNew, isSelected && styles.pickerItemTextActiveNew]}>{y}</Text>
                        {isSelected && <View style={styles.activeDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </BottomSheetScrollView>
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
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
  monthLabel: { fontSize: normalize.font(16), fontWeight: '700', color: IDENTITY_BLUE },
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
  
  shiftsGridContainer: { paddingHorizontal: 16, gap: 12 },
  shiftTile: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    borderLeftWidth: 4, // Accent border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden'
  },
  shiftTileBooked: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  shiftTileContent: { padding: 12, justifyContent: 'space-between', alignItems: 'center' },
  shiftTileCore: { gap: 12, alignItems: 'center', flex: 1 },
  shiftIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  shiftNameGroup: { gap: 2, flex: 1 },
  shiftTileName: { fontSize: normalize.font(16), fontWeight: '800' },
  shiftTimeGroup: { alignItems: 'center', gap: 4 },
  shiftTileTime: { fontSize: normalize.font(12), color: '#94A3B8', fontWeight: '600' },
  shiftStatusColumn: { paddingLeft: 12 },
  statusGlassBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 10, 
    borderWidth: 1 
  },
  statusBadgeText: { fontSize: normalize.font(12), fontWeight: '700' },
  
  bookingMiniInfo: { marginTop: 6, alignItems: 'center', gap: 6 },
  bookingMiniId: { fontSize: normalize.font(11), fontWeight: '700', letterSpacing: 0.5 },
  bookingTypeBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  bookingTypeBadgeText: { fontSize: normalize.font(9), fontWeight: '800', textTransform: 'uppercase' },

  noAvailabilityText: { textAlign: 'center', color: '#64748B', fontWeight: '600' },
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
  monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: '#DBEAFE' },
  sheetHeaderLabelRow: { alignItems: 'center', gap: 8 },
  pickerColLabel: { fontSize: normalize.font(12), color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  pickerItemNew: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  pickerItemActiveNew: { backgroundColor: '#F0F9FF' },
  pickerItemTextNew: { fontSize: normalize.font(15), color: '#64748B', fontWeight: '600' },
  pickerItemTextActiveNew: { color: IDENTITY_BLUE, fontWeight: '800' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: IDENTITY_BLUE },
  modalIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  notesContainer: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notesLabel: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: IDENTITY_BLUE,
  },
  notesText: {
    fontSize: normalize.font(13),
    color: '#475569',
    lineHeight: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
