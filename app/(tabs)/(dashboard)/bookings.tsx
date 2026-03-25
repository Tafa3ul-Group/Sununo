import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Linking } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { SecondaryButton } from '@/components/user/secondary-button';
import { SolarIcon } from '@/components/ui/solar-icon';
import { useRouter } from 'expo-router';
import { useGetProviderBookingsQuery, useGetProviderBookingDetailsQuery, useGetOwnerChaletsQuery, useLazyGetShiftAvailabilityQuery } from '@/store/api/apiSlice';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


// Status mapping from UI to API
const API_STATUS_MAP: Record<string, string> = {
  new: 'pending_payment',
  confirmed: 'confirmed',
  finished: 'completed',
};

const IDENTITY_BLUE = '#035DF9';

const format12H = (time: string | undefined | null, isRTL: boolean) => {
  if (!time) return '';
  // Split by ' ' to handle strings like '2024-03-25 14:00:00'
  const timePart = time.includes(' ') ? time.split(' ')[1] : time;
  const parts = timePart.split(':');
  if (parts.length < 2) return time;
  const hours = parts[0];
  const minutes = parts[1];
  let h = parseInt(hours);
  const m = minutes;
  const ampm = h >= 12 ? (isRTL ? 'م' : 'PM') : (isRTL ? 'ص' : 'AM');
  h = h % 12;
  h = h ? h : 12;
  const hDisplay = h.toString();
  const mDisplay = m.padStart(2, '0');
  return `${hDisplay}:${mDisplay} ${ampm}`;
};

const BookingDetailsContent = ({ id, isRTL, t }: { id: string; isRTL: boolean; t: any }) => {
  const { data: bookingDetailsData, isLoading, error } = useGetProviderBookingDetailsQuery(id);
  
  // Debug log to see actual structure
  console.log('Booking Details ID:', id);
  console.log('API Response:', JSON.stringify(bookingDetailsData));

  if (isLoading) return <View style={styles.sheetLoading}><ActivityIndicator size="large" color={IDENTITY_BLUE} /></View>;
  
  // Support both { data: { ... } } and direct { ... } response structures
  const data = bookingDetailsData?.data || bookingDetailsData;
  
  if (error || !data || !data.id) {
    console.error('Booking details load error:', error);
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <SolarIcon name="danger-circle-bold" size={48} color={Colors.text.muted} />
        <ThemedText style={{ marginTop: 16, color: Colors.text.muted }}>{t('common.error')}</ThemedText>
        {error && <Text style={{ fontSize: 10, color: '#CCC', marginTop: 8 }}>{JSON.stringify(error)}</Text>}
      </View>
    );
  }

  const bChaletName = isRTL ? (data.chalet?.name?.ar || data.chalet?.name) : (data.chalet?.name?.en || data.chalet?.name);
  const bChaletAddress = isRTL ? (data.chalet?.address?.ar || data.chalet?.address) : (data.chalet?.address?.en || data.chalet?.address);
  const bCustomerName = data.customer?.name || t('common.user');
  const bCustomerEmail = data.customer?.email;
  const bShiftName = isRTL ? (data.shift?.name?.ar || data.shift?.name) : (data.shift?.name?.en || data.shift?.name);
  const bIsNightShift = data.shift?.isOvernight || (data.shift?.name?.en?.toLowerCase().includes('evening'));
  const bMaxGuests = data.chalet?.maxGuests;
  const bPaymentModel = data.paymentModel;
  
  const bHandleCall = () => data.customer?.phone && Linking.openURL(`tel:${data.customer.phone}`);
  const bHandleWhatsApp = () => {
    if (data.customer?.phone) {
      const phone = data.customer.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${phone}`);
    }
  };

  return (
    <BottomSheetScrollView contentContainerStyle={styles.sheetScroll}>
      {/* ── Header: Title + Status ── */}
      <View style={[styles.sheetTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.sheetHeroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'تفاصيل الحجز' : 'Booking Details'}
        </Text>
      </View>



      {/* ── Customer Card ── */}
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

      {/* ── Property & Schedule ── */}
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
          <View style={[styles.timeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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

      {/* ── Quick Info: Guests + Payment Type ── */}
      <View style={[styles.quickInfoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.quickInfoCard}>
          <SolarIcon name="users-group-two-rounded-linear" size={20} color={Colors.primary} />
          <Text style={styles.quickInfoValue}>{bMaxGuests || '--'}</Text>
          <Text style={styles.quickInfoLabel}>{t('common.guestsCount')}</Text>
        </View>
        <View style={styles.quickInfoCard}>
          <SolarIcon name="wallet-2-linear" size={20} color={Colors.primary} />
          <Text style={styles.quickInfoValue}>{bPaymentModel === 'full' ? (isRTL ? 'كامل' : 'Full') : (isRTL ? 'عربون' : 'Deposit')}</Text>
          <Text style={styles.quickInfoLabel}>{t('common.paymentMethod')}</Text>
        </View>
      </View>

      {/* ── Payment Summary ── */}
      <View style={styles.paymentCard}>
        <View style={[styles.paymentHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start' }]}>
          <Text style={styles.paymentTitle}>{isRTL ? 'ملخص الدفع' : 'Payment Summary'}</Text>
        </View>
        <View style={[styles.paymentTotalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.paymentTotalLabel}>{isRTL ? 'إجمالي السعر' : 'Total Price'}</Text>
          <Text style={styles.paymentTotalValue}>{Number(data.totalPrice).toLocaleString()} {t('common.iqd')}</Text>
        </View>
        {bPaymentModel === 'deposit' && (
          <View style={styles.paymentBreakdown}>
            <View style={[styles.paymentBreakdownRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.paymentDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.paymentBreakdownLabel}>{isRTL ? 'العربون المدفوع' : 'Deposit Paid'}</Text>
              <Text style={[styles.paymentBreakdownVal, { color: '#059669' }]}>{Number(data.depositAmount).toLocaleString()} {t('common.iqd')}</Text>
            </View>
            <View style={[styles.paymentBreakdownRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.paymentDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.paymentBreakdownLabel}>{isRTL ? 'المتبقي' : 'Remaining'}</Text>
              <Text style={[styles.paymentBreakdownVal, { color: '#D97706' }]}>{Number(data.remainingAmount).toLocaleString()} {t('common.iqd')}</Text>
            </View>
          </View>
        )}
      </View>
    </BottomSheetScrollView>
  );
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('new');
  const isRTL = language === 'ar';

  const TABS = [
    { id: 'new', label: t('dashboard.bookings.new') },
    { id: 'confirmed', label: t('dashboard.bookings.confirmed') },
    { id: 'finished', label: t('dashboard.bookings.finished') },
  ];

  const [baseDate, setBaseDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  
  // Generate week based on baseDate
  const weekDays = React.useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - baseDate.getDay()); // Start from Sunday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [baseDate]);

  const changeWeek = (direction: 'prev' | 'next') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + (direction === 'next' ? 7 : -7));
    setBaseDate(newDate);
  };

  const goToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date();
    setBaseDate(today);
    setSelectedDate(today);
    setIsFilterByDate(true);
  };

  const monthYearLabel = selectedDate.toLocaleString(isRTL ? 'ar-IQ' : 'en-US', { month: 'long', year: 'numeric' });
  const isTodaySelected = React.useMemo(() => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() && 
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  }, [selectedDate]);

  const [page, setPage] = React.useState(1);
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isFilterByDate, setIsFilterByDate] = React.useState(false);

  // Shift availability
  const { data: chaletsData } = useGetOwnerChaletsQuery(undefined);
  const [triggerAvailability] = useLazyGetShiftAvailabilityQuery();
  const [shiftAvailability, setShiftAvailability] = React.useState<any[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = React.useState(false);
  const [selectedChaletId, setSelectedChaletId] = React.useState<string | null>(null);

  // Fetch shift availability for the selected chalet + date
  React.useEffect(() => {
    const fetchAvailability = async () => {
      if (!isFilterByDate || !selectedChaletId) {
        setShiftAvailability([]);
        return;
      }
      setIsLoadingAvailability(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      try {
        const res = await triggerAvailability({ chaletId: selectedChaletId, from: dateStr, to: dateStr }).unwrap();
        if (Array.isArray(res)) {
          setShiftAvailability(res);
        } else if (res?.data && Array.isArray(res.data)) {
          setShiftAvailability(res.data);
        } else {
          setShiftAvailability([]);
        }
      } catch (e) {
        console.log('Availability fetch error:', e);
        setShiftAvailability([]);
      }
      setIsLoadingAvailability(false);
    };
    fetchAvailability();
  }, [selectedDate, isFilterByDate, selectedChaletId]);

  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);
  const detailsSheetRef = React.useRef<BottomSheetModal>(null);

  const snapPoints = React.useMemo(() => ['90%'], []);

  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  // API Call
  const { data: apiData, isLoading, isFetching, refetch } = useGetProviderBookingsQuery({
    status: API_STATUS_MAP[activeTab],
    from: isFilterByDate ? selectedDate.toISOString().split('T')[0] : undefined,
    to: isFilterByDate ? selectedDate.toISOString().split('T')[0] : undefined,
    page: page,
    limit: 10,
  });

  // Handle data appending for pagination
  React.useEffect(() => {
    if (apiData?.data) {
      if (page === 1) {
        setBookings(apiData.data);
      } else {
        setBookings(prev => [...prev, ...apiData.data]);
      }
    }
  }, [apiData, page]);

  // Reset when filters change
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, selectedDate, isFilterByDate]);

  const loadMore = () => {
    if (!isFetching && apiData?.meta && page < apiData.meta.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await refetch();
    setIsRefreshing(false);
  };

  const openBookingDetails = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedBookingId(id);
    detailsSheetRef.current?.present();
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const chaletName = isRTL ? (item.chalet?.name?.ar || item.chalet?.name) : (item.chalet?.name?.en || item.chalet?.name);
    const customerName = item.customer?.name || t('common.user');
    const shiftName = isRTL ? (item.shift?.name?.ar || item.shift?.name) : (item.shift?.name?.en || item.shift?.name);
    const isNightShift = item.shift?.isOvernight || (item.shift?.name?.en?.toLowerCase().includes('evening'));

    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => openBookingDetails(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.bookingHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.customerSection, { flexDirection: isRTL ? 'row-reverse' : 'row', flex: 1, marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }]}>
            <View style={styles.avatarWrapper}>
              {item.customer?.image ? (
                <Image source={{ uri: item.customer.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <SolarIcon name="user-bold" size={20} color="#FFF" />
                </View>
              )}
              <View style={styles.onlineBadge} />
            </View>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1 }}>
              <ThemedText style={styles.customerName} numberOfLines={1}>{customerName}</ThemedText>
              <ThemedText style={styles.chaletName} numberOfLines={1}>{chaletName}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.priceText}>
            {Number(item.totalPrice).toLocaleString()} {t('common.iqd')}
          </ThemedText>
        </View>

        <View style={styles.dateTimeContainer}>
           <View style={[styles.dateHighlight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             <SolarIcon name="calendar-minimalistic-bold" size={18} color="#035DF9" />
             <Text style={styles.dateHighlightText}>{item.bookingDate}</Text>
             <View style={styles.dateDot} />
             <View style={[styles.inlineShiftBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <SolarIcon 
                  name={isNightShift ? "moon-bold" : "sun-bold"} 
                  size={14} 
                  color={isNightShift ? "#7C3AED" : "#EA580C"} 
                />
                <Text style={[styles.inlineShiftText, { color: isNightShift ? "#7C3AED" : "#EA580C" }]}>{shiftName}</Text>
             </View>
           </View>
           
           <View style={[styles.timeSlotRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             <View style={[styles.timeDetail, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
               <Text style={styles.timeDetailLabel}>{isRTL ? 'وقت الدخول' : 'Check-in'}</Text>
               <Text style={styles.timeDetailValue}>{format12H(item.shiftStartTime, isRTL)}</Text>
             </View>
             <View style={styles.timeArrowWrapper}>
               <SolarIcon name={isRTL ? "alt-arrow-left-linear" : "alt-arrow-right-linear"} size={16} color="#CBD5E1" />
             </View>
             <View style={[styles.timeDetail, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
               <Text style={styles.timeDetailLabel}>{isRTL ? 'وقت الخروج' : 'Check-out'}</Text>
               <Text style={styles.timeDetailValue}>{format12H(item.shiftEndTime, isRTL)}</Text>
             </View>
           </View>
        </View>

      {item.status === 'pending_payment' && (
        <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <SecondaryButton
            label={t('dashboard.bookings.accept')}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(t('dashboard.bookings.accept'), 'هل أنت متأكد من قبول هذا الحجز؟');
            }}
            isActive={true}
            activeColor={IDENTITY_BLUE}
            icon="check-bold"
            style={{ flex: 1, height: 46 }}
            textStyle={{ fontSize: normalize.font(16) }}
          />
          <TouchableOpacity 
            style={styles.declineCircleButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(t('dashboard.bookings.decline'), 'هل أنت متأكد من رفض هذا الحجز؟');
            }}
          >
            <MaterialCommunityIcons name="close-thick" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

        {(item.status === 'confirmed' || item.status === 'completed') && (
        <View style={[styles.statusInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
           <SolarIcon 
            name="check-circle-bold" 
            size={20} 
            color={item.status === 'completed' ? Colors.text.muted : "#2E7D32"} 
           />
           <Text style={[styles.statusInfoText, { color: item.status === 'completed' ? Colors.text.muted : '#2E7D32' }]}>
             {item.status === 'completed' ? t('dashboard.bookings.finished') : t('dashboard.bookings.confirmed')}
           </Text>
        </View>
      )}

      <View style={[styles.viewDetailsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
         <Text style={styles.viewDetailsText}>{t('common.viewDetails')}</Text>
         <SolarIcon name={isRTL ? "alt-arrow-left-linear" : "alt-arrow-right-linear"} size={14} color={IDENTITY_BLUE} />
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <HeaderSection 
          userType={userType} 
          userName={user?.name} 
          title={t('tabs.bookings')}
          showSearch={false}
          showCategories={false}
        />
        <View style={styles.container}>
          <View style={styles.calendarContainer}>
            <View style={[styles.calendarHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.headerLabels, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.monthYearText}>{monthYearLabel}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    style={[styles.filterButton, !isFilterByDate && styles.activeFilterButton]} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setIsFilterByDate(!isFilterByDate);
                    }}
                  >
                    <Text style={[styles.filterButtonText, !isFilterByDate && styles.activeFilterButtonText]}>
                      {isRTL ? 'الكل' : 'All'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.todayButton, isTodaySelected && isFilterByDate && styles.activeFilterButton]} 
                    onPress={goToToday}
                  >
                    <Text style={[styles.todayButtonText, isTodaySelected && isFilterByDate && styles.activeFilterButtonText]}>
                      {isRTL ? 'اليوم' : 'Today'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.headerArrows, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity 
                  style={styles.arrowButton}
                  onPress={() => changeWeek('prev')}
                >
                  <SolarIcon name={isRTL ? "alt-arrow-right-linear" : "alt-arrow-left-linear"} size={22} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.arrowButton}
                  onPress={() => changeWeek('next')}
                >
                  <SolarIcon name={isRTL ? "alt-arrow-left-linear" : "alt-arrow-right-linear"} size={22} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.weekScrollContent, isRTL && { flexDirection: 'row-reverse' }]}
            >
              {weekDays.map((date, index) => {
                const dayName = date.toLocaleString(isRTL ? 'ar-IQ' : 'en-US', { weekday: 'short' }).slice(0, 2);
                const dayNumber = date.getDate();
                const isSelected = selectedDate.getDate() === date.getDate() && 
                                  selectedDate.getMonth() === date.getMonth() &&
                                  selectedDate.getFullYear() === date.getFullYear();
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dayItem, isSelected && styles.selectedDayItem]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDate(date);
                      setIsFilterByDate(true);
                    }}
                  >
                    <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>{dayName}</Text>
                    <View style={[styles.dateCircle, isSelected && styles.selectedDateCircle]}>
                      <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>{dayNumber}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Shift Availability Section */}
          {isFilterByDate && (chaletsData?.data?.length > 0) && (
            <View style={styles.availabilitySection}>
              {/* Chalet Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chaletChipsScroll}>
                {(chaletsData?.data || []).map((chalet: any) => {
                  const name = isRTL ? (chalet.name?.ar || chalet.name) : (chalet.name?.en || chalet.name);
                  const isActive = selectedChaletId === chalet.id;
                  return (
                    <TouchableOpacity
                      key={chalet.id}
                      style={[styles.chaletChip, isActive && styles.chaletChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChaletId(isActive ? null : chalet.id);
                      }}
                    >
                      <SolarIcon name="home-2-bold" size={14} color={isActive ? '#FFF' : Colors.primary} />
                      <Text style={[styles.chaletChipText, isActive && styles.chaletChipTextActive]} numberOfLines={1}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Shifts for selected chalet */}
              {selectedChaletId && (
                <View style={styles.shiftsContainer}>
                  {isLoadingAvailability ? (
                    <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 16 }} />
                  ) : shiftAvailability.length > 0 ? (
                    <View style={styles.shiftsGrid}>
                      {shiftAvailability.map((shift: any, idx: number) => {
                        const shiftName = isRTL ? (shift.shiftName?.ar || shift.shiftName) : (shift.shiftName?.en || shift.shiftName);
                        const isAvailable = shift.isAvailable;
                        const isNight = shift.isOvernight;
                        const iconName = isNight ? 'moon-bold' : (shift.startTime < '12:00:00' ? 'sun-bold' : 'sun-bold');
                        const accentColor = isNight ? '#7C3AED' : '#EA580C';
                        const bgColor = isNight ? '#F5F3FF' : '#FFF7ED';

                        return (
                          <View key={shift.shiftId || idx} style={[styles.shiftCard, !isAvailable && styles.shiftCardBooked]}>
                            <View style={[styles.shiftIconRow, { backgroundColor: bgColor }]}>
                              <SolarIcon name={iconName} size={20} color={accentColor} />
                            </View>
                            <Text style={[styles.shiftCardName, { color: accentColor }]}>{shiftName}</Text>
                            <Text style={styles.shiftCardTime}>
                              {format12H(shift.startTime, isRTL)} → {format12H(shift.endTime, isRTL)}
                            </Text>
                            {shift.price != null && (
                              <Text style={styles.shiftCardPrice}>{Number(shift.price).toLocaleString()} {t('common.iqd')}</Text>
                            )}
                            <View style={[styles.shiftStatusBadge, { backgroundColor: isAvailable ? '#F0FDF4' : '#FEF2F2' }]}>
                              <View style={[styles.shiftStatusDot, { backgroundColor: isAvailable ? '#22C55E' : '#EF4444' }]} />
                              <Text style={[styles.microStatusText, { color: isAvailable ? '#16A34A' : '#EF4444' }]}>
                                {isAvailable ? (isRTL ? 'متاح' : 'Available') : (isRTL ? 'محجوز' : 'Booked')}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noAvailabilityText}>
                      {isRTL ? 'لا توجد شيفتات في هذا اليوم' : 'No shifts for this day'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.tabSection}>
            <View style={[styles.tabBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {TABS.map(tab => (
                <TouchableOpacity 
                  key={tab.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.id);
                  }}
                  style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
                >
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <FlashList<any>
            data={bookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBookingItem}
            estimatedItemSize={180}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            ListFooterComponent={() => (
              isFetching && page > 1 ? (
                <ActivityIndicator size="small" color={IDENTITY_BLUE} style={{ marginVertical: 20 }} />
              ) : null
            )}
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.loadingListContainer}>
                  <ActivityIndicator size="large" color={IDENTITY_BLUE} />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <SolarIcon name="calendar-minimalistic-bold" size={80} color={Colors.text.muted + '40'} />
                  <Text style={styles.emptyText}>{t('dashboard.noChalets')}</Text>
                </View>
              )
            }
          />
        </View>
      </SafeAreaView>

      <BottomSheetModal
        ref={detailsSheetRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 40, backgroundColor: Colors.white }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {selectedBookingId && (
            <BookingDetailsContent 
              id={selectedBookingId} 
              isRTL={isRTL} 
              t={t} 
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl, // Increase top space
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  calendarHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLabels: {
    alignItems: 'center',
    gap: 12,
  },
  monthYearText: {
    fontSize: normalize.font(20),
    fontWeight: '800',
    color: '#000000',
  },
  headerArrows: {
    gap: 16,
  },
  arrowButton: {
    padding: 4,
  },
  weekScrollContent: {
    paddingRight: Spacing.md,
    gap: 12,
    paddingBottom: 4,
  },
  dayItem: {
    alignItems: 'center',
    width: 44,
    paddingVertical: 8,
    borderRadius: 22,
  },
  selectedDayItem: {
    backgroundColor: '#035DF9',
  },
  dayLabel: {
    fontSize: normalize.font(14),
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  selectedDayLabel: {
    color: '#FFFFFF',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateCircle: {
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: '#000000',
  },
  selectedDateText: {
    color: '#035DF9',
  },
  tabSection: {
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  tabBar: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 2,
    flexDirection: 'row',
    gap: 2,
    marginTop: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: Colors.white,
  },
  tabLabel: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  todayButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activeFilterButton: {
    backgroundColor: '#035DF9',
  },
  filterButtonText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: '#8E8E93',
  },
  activeFilterButtonText: {
    color: '#FFF',
  },
  todayButtonText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: '#035DF9',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border + '30',
    marginBottom: Spacing.md,
  },
  bookingHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  customerSection: {
    gap: 12,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#035DF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  customerName: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: '#1A1A1A',
  },
  chaletName: {
    fontSize: normalize.font(13),
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  priceText: {
    fontSize: normalize.font(16),
    fontWeight: '900',
    color: '#035DF9',
  },
  dateTimeContainer: {
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  dateHighlight: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    gap: 8,
  },
  dateHighlightText: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#035DF9',
  },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  inlineShiftBadge: {
    alignItems: 'center',
    gap: 4,
  },
  inlineShiftText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
  },
  timeSlotRow: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDetail: {
    flex: 1,
  },
  timeDetailLabel: {
    fontSize: normalize.font(10),
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeDetailValue: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: '#1A1A1A',
  },
  timeArrowWrapper: {
    paddingHorizontal: 12,
  },
  actionRow: {
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  declineCircleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusInfoText: {
    fontSize: normalize.font(13),
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: normalize.font(15),
    color: Colors.text.muted,
    marginTop: 12,
    fontWeight: '500',
  },
  loadingListContainer: {
    padding: 40,
    alignItems: 'center',
  },
  sheetLoading: {
    padding: 40,
    alignItems: 'center',
  },
  sheetScroll: {
    padding: 20,
    paddingBottom: 48,
  },
  // ── Header ──
  sheetTopRow: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetHeroTitle: {
    fontSize: normalize.font(20),
    fontWeight: '800',
    color: Colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: normalize.font(11),
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  cancelReasonBanner: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelReasonText: {
    color: '#DC2626',
    fontSize: normalize.font(12),
    fontWeight: '600',
    flex: 1,
  },
  // ── Customer ──
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerRow: {
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  customerNameSheet: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  customerPhone: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
    marginTop: 1,
  },
  contactActions: {
    gap: 8,
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  contactBtnCall: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  contactBtnChat: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  // ── Detail Card ──
  // Removed duplicate bookingCard style
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailCardHeader: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  detailIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCardTitle: {
    fontSize: normalize.font(15),
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  detailSubRow: {
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
    paddingLeft: 40,
  },
  detailSubText: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
    flex: 1,
  },
  scheduleBlock: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scheduleDate: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  shiftChipText: {
    fontSize: normalize.font(10),
    fontWeight: '700',
  },
  timeRow: {
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  timeBlock: {
    gap: 2,
  },
  timeLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  timeArrow: {
    paddingHorizontal: 8,
  },
  // ── Quick Info ──
  quickInfoRow: {
    gap: 12,
    marginBottom: 16,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickInfoValue: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  quickInfoLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // ── Payment ──
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  paymentTitle: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  paymentTotalRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  paymentTotalLabel: {
    fontSize: normalize.font(13),
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  paymentTotalValue: {
    fontSize: normalize.font(18),
    fontWeight: '900',
    color: Colors.primary,
  },
  paymentBreakdown: {
    marginTop: 12,
    gap: 8,
  },
  paymentBreakdownRow: {
    alignItems: 'center',
    gap: 8,
  },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paymentBreakdownLabel: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontWeight: '500',
    flex: 1,
  },
  paymentBreakdownVal: {
    fontSize: normalize.font(13),
    fontWeight: '700',
  },
  // ── Legacy ──
  sheetStatusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetSection: {
    marginBottom: 24,
  },
  sheetSectionTitle: {
    fontSize: normalize.font(14),
    fontWeight: '900',
    color: Colors.text.primary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  viewDetailsRow: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitleRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Shift Availability ──
  availabilitySection: {
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chaletChipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chaletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chaletChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chaletChipText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.text.primary,
    maxWidth: 120,
  },
  chaletChipTextActive: {
    color: '#FFF',
  },
  shiftsContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  shiftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shiftCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 6,
  },
  shiftCardBooked: {
    opacity: 0.5,
  },
  shiftIconRow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  shiftCardHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  shiftCardName: {
    fontSize: normalize.font(13),
    fontWeight: '800',
    textAlign: 'center',
  },
  shiftCardChalet: {
    fontSize: normalize.font(11),
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  shiftCardTime: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  shiftCardPrice: {
    fontSize: normalize.font(13),
    fontWeight: '800',
    color: Colors.primary,
  },
  shiftStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  shiftStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  shiftStatusText: {
    fontSize: normalize.font(9),
    fontWeight: '700',
  },
  noAvailabilityText: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '500',
  },
  clockWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  selectedShiftDetail: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detailAccentBar: {
    width: 6,
  },
  detailTextContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  detailHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailShiftName: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  microStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  microStatusText: {
    fontSize: normalize.font(10),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailTime: {
    fontSize: normalize.font(13),
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  detailPrice: {
    fontSize: normalize.font(14),
    fontWeight: '900',
    color: Colors.primary,
  },
});
