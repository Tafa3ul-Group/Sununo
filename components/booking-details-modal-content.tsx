import { Colors, normalize } from '@/constants/theme';
import { useGetProviderBookingDetailsQuery, useRejectBookingMutation, useDeleteExternalBookingMutation } from '@/store/api/apiSlice';
import { 
  SolarDangerCircleBold, 
  SolarUserBold, 
  SolarPhoneBold, 
  SolarChatLineLinear, 
  SolarHome2Bold, 
  SolarMapPointLinear, 
  SolarCalendarMinimalisticBold, 
  SolarMoonBold, 
  SolarSunBold, 
  SolarAltArrowLeftLinear, 
  SolarAltArrowRightLinear, 
  SolarNotesBoldDuotone 
} from '@/components/icons/solar-icons';
import { SecondaryButton } from '@/components/user/secondary-button';
import { ThemedText } from '@/components/themed-text';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IDENTITY_BLUE = '#035DF9';

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

interface BookingDetailsContentProps {
  id: string;
  isRTL: boolean;
  t: any;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const BookingDetailsModalContent = ({ id, isRTL, t, onRefresh, onClose }: BookingDetailsContentProps) => {
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
        <SolarDangerCircleBold size={48} color={Colors.text.muted} />
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
              <SolarUserBold size={18} color="#FFF" />
            )}
          </View>
          <View style={{ flex: 1, marginHorizontal: 10, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={styles.customerNameSheet}>{bCustomerName}</Text>
            <Text style={styles.customerPhone}>{data.customer?.phone || '--'}</Text>
          </View>
          <View style={[styles.contactActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={[styles.contactBtn, styles.contactBtnCall]} onPress={bHandleCall}>
              <SolarPhoneBold size={16} color="#16A34A" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, styles.contactBtnChat]} onPress={bHandleWhatsApp}>
              <SolarChatLineLinear size={16} color="#0284C7" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.detailCard}>
        <View style={[styles.detailCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.detailIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <SolarHome2Bold size={16} color={Colors.primary} />
          </View>
          <Text style={[styles.detailCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{bChaletName}</Text>
        </View>
        {bChaletAddress && (
          <View style={[styles.detailSubRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SolarMapPointLinear size={13} color="#94A3B8" />
            <Text style={styles.detailSubText}>{bChaletAddress}</Text>
          </View>
        )}

        <View style={styles.scheduleBlock}>
          <View style={[styles.scheduleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SolarCalendarMinimalisticBold size={16} color={Colors.primary} />
            <Text style={styles.scheduleDate}>{data.bookingDate}</Text>
            <View style={[styles.shiftChip, { backgroundColor: bIsNightShift ? '#F5F3FF' : '#FFF7ED' }]}>
              {bIsNightShift ? <SolarMoonBold size={11} color="#7C3AED" /> : <SolarSunBold size={11} color="#EA580C" />}
              <Text style={[styles.shiftChipText, { color: bIsNightShift ? "#7C3AED" : "#EA580C" }]}>{bShiftName}</Text>
            </View>
          </View>
          <View style={[styles.detailCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', padding: 12, justifyContent: 'space-around' }]}>
            <View style={[styles.timeBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.timeLabel}>{isRTL ? 'الدخول' : 'Check-in'}</Text>
              <Text style={styles.timeValue}>{format12H(data.shiftStartTime, isRTL)}</Text>
            </View>
            <View style={styles.timeArrow}>
              {isRTL ? <SolarAltArrowLeftLinear size={14} color="#CBD5E1" /> : <SolarAltArrowRightLinear size={14} color="#CBD5E1" />}
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
            <SolarNotesBoldDuotone size={16} color={IDENTITY_BLUE} />
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
            icon={<SolarDangerCircleBold size={18} color="white" />}
            style={{ width: '100%', height: 50 }}
            isLoading={isRejectLoading || isDeletingExternal}
          />
        )}
      </View>
    </BottomSheetScrollView>
  );
};

const styles = StyleSheet.create({
  sheetLoading: { padding: 50, alignItems: 'center' },
  sheetScroll: { padding: 20 },
  sheetTopRow: { marginBottom: 20 },
  sheetHeroTitle: { fontSize: normalize.font(18), fontFamily: "LamaSans-Black" },
  customerCard: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 16 },
  customerRow: { alignItems: 'center' },
  customerAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: IDENTITY_BLUE, justifyContent: 'center', alignItems: 'center' },
  customerAvatarImg: { width: 44, height: 44, borderRadius: 12 },
  customerNameSheet: { fontSize: normalize.font(15), fontFamily: "LamaSans-Bold" },
  customerPhone: { fontSize: normalize.font(13), color: '#64748B' , fontFamily: "LamaSans-Regular" },
  contactActions: { gap: 8 },
  contactBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  contactBtnCall: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  contactBtnChat: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  detailCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  detailCardHeader: { alignItems: 'center', gap: 8, marginBottom: 8 },
  detailIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailCardTitle: { fontSize: normalize.font(15), fontFamily: "LamaSans-Bold", flex: 1 },
  detailSubRow: { paddingLeft: 40, alignItems: 'center', gap: 6, marginBottom: 12 },
  detailSubText: { fontSize: normalize.font(12), color: '#64748B' , fontFamily: "LamaSans-Regular" },
  scheduleBlock: { backgroundColor: '#F8FAFC', borderRadius: 10, overflow: 'hidden' },
  scheduleRow: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', gap: 8 },
  scheduleDate: { fontSize: normalize.font(13), fontFamily: "LamaSans-Bold", flex: 1 },
  shiftChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  shiftChipText: { fontSize: normalize.font(10), fontFamily: "LamaSans-Bold" },
  timeBlock: { flex: 1 },
  timeLabel: { fontSize: normalize.font(10), color: '#94A3B8', fontFamily: "LamaSans-Bold", textTransform: 'uppercase' },
  timeValue: { fontSize: normalize.font(14), fontFamily: "LamaSans-Black" },
  timeArrow: { paddingHorizontal: 8 },
  paymentCard: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10 },
  paymentTotalRow: { justifyContent: 'space-between', alignItems: 'center' },
  paymentTotalLabel: { fontSize: normalize.font(13), fontFamily: "LamaSans-SemiBold" },
  paymentTotalValue: { fontSize: normalize.font(16), fontFamily: "LamaSans-Black", color: IDENTITY_BLUE },
  notesContainer: { padding: 12, backgroundColor: '#F8FAFC', borderRadius: 10 },
  row: { alignItems: 'center' },
  notesLabel: { fontSize: normalize.font(13), fontFamily: "LamaSans-Bold", color: Colors.text.primary },
  notesText: { fontSize: normalize.font(13), color: Colors.text.muted, lineHeight: 18 , fontFamily: "LamaSans-Regular" },
  inputLabel: { fontSize: normalize.font(14), fontFamily: "LamaSans-Bold", marginBottom: 8, color: Colors.text.primary },
  textInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, height: 100, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
});
