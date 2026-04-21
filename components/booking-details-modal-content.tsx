import { Colors, normalize } from '@/constants/theme';
import { useGetProviderBookingDetailsQuery } from '@/store/api/apiSlice';
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
  SolarNotesBoldDuotone,
  SolarMenuDotsBold,
  SolarStarBold
} from '@/components/icons/solar-icons';
import { PrimaryButton } from '@/components/user/primary-button';
import { ThemedText } from '@/components/themed-text';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const IDENTITY_BLUE = '#035DF9';

interface BookingDetailsContentProps {
  id: string;
  isRTL: boolean;
  t: any;
  onRefresh?: () => void;
  onClose?: () => void;
  onOpenCancelSheet?: (data: any) => void;
  isCancelLoading?: boolean;
}

export const BookingDetailsModalContent = ({ id, isRTL, t, onClose, onOpenCancelSheet, isCancelLoading }: BookingDetailsContentProps) => {
  const { data: bookingDetailsData, isLoading, error } = useGetProviderBookingDetailsQuery(id);

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

  const remainingAmount = data.totalPrice - (data.paidAmount || 0);

  return (
    <View style={styles.mainContainer}>
      {/* Custom Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
          {isRTL ? <SolarAltArrowRightLinear size={24} color={Colors.text.primary} /> : <SolarAltArrowLeftLinear size={24} color={Colors.text.primary} />}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRTL ? 'تفاصيل الحجز' : 'Booking Details'}</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <SolarMenuDotsBold size={24} color={Colors.text.muted} />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chalet Card */}
        <View style={styles.sectionCard}>
          <View style={[styles.chaletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.chaletInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.chaletName, { textAlign: isRTL ? 'right' : 'left' }]}>{bChaletName}</Text>
              <Text style={[styles.chaletLocation, { textAlign: isRTL ? 'right' : 'left' }]}>{bChaletAddress || (isRTL ? 'البصرة - الجزائر' : 'Basra - Algeria')}</Text>
              
              <View style={[styles.ratingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <SolarStarBold size={14} color="#EF4444" />
                <Text style={styles.ratingText}>4.5</Text>
              </View>

              <Text style={[styles.priceTag, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? `IQD ${Number(data.totalPrice).toLocaleString()} / شفت` : `IQD ${Number(data.totalPrice).toLocaleString()} / Shift`}
              </Text>
            </View>
            
            <View style={styles.organicImageContainer}>
              <Image 
                source={{ uri: data.chalet?.image || data.chalet?.images?.[0] || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2050&auto=format&fit=crop' }} 
                style={styles.organicImage} 
              />
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'معلومات الزبون' : 'Customer Information'}
          </Text>
          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الاسم' : 'Name'}</Text>
            <Text style={[styles.value, { textAlign: isRTL ? 'left' : 'right' }]}>{bCustomerName}</Text>
          </View>

          {!bIsExternal && (
            <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'رقم الهاتف' : 'Phone'}</Text>
              <Text style={[styles.value, { textAlign: isRTL ? 'left' : 'right' }]}>{data.customer?.phone || '--'}</Text>
            </View>
          )}
        </View>

        {/* Booking Information */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'معلومات الحجز' : 'Booking Information'}
          </Text>
          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'التاريخ' : 'Date'}</Text>
            <Text style={[styles.value, { textAlign: isRTL ? 'left' : 'right' }]}>{data.bookingDate}</Text>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الفترة' : 'Period'}</Text>
            <Text style={[styles.value, { textAlign: isRTL ? 'left' : 'right' }]}>{bShiftName}</Text>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الاشخاص' : 'Persons'}</Text>
            <Text style={[styles.value, { textAlign: isRTL ? 'left' : 'right' }]}>
              {isRTL ? `${data.adults || 2} بالغين، ${data.children || 2} اطفال` : `${data.adults || 2} Adults, ${data.children || 2} Children`}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'معلومات الدفع' : 'Payment Information'}
          </Text>
          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المبلغ المدفوع' : 'Amount Paid'}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.value, { color: Colors.text.muted }]}>{Number(data.paidAmount || 0).toLocaleString()}</Text>
              <Text style={[styles.currency, { color: Colors.text.muted }]}>{isRTL ? 'د.ع' : 'IQD'}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المبلغ المتبقي' : 'Remaining Amount'}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.value, { color: IDENTITY_BLUE }]}>{Number(remainingAmount).toLocaleString()}</Text>
              <Text style={[styles.currency, { color: IDENTITY_BLUE }]}>{isRTL ? 'د.ع' : 'IQD'}</Text>
            </View>
          </View>
        </View>

        {data.notes && (
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'ملاحظات' : 'Notes'}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.notesText, { textAlign: isRTL ? 'right' : 'left' }]}>{data.notes}</Text>
          </View>
        )}

        {/* Cancellation for providers */}
        <View style={{ marginVertical: 20 }}>
          <TouchableOpacity 
            style={styles.cancelLink} 
            onPress={() => onOpenCancelSheet?.(data)}
            disabled={isCancelLoading}
          >
            <Text style={styles.cancelLinkText}>
              {bIsExternal ? (isRTL ? 'إلغاء الإغلاق الخارجي' : 'Cancel External') : (isRTL ? 'إلغاء هذا الحجز' : 'Cancel this booking')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </BottomSheetScrollView>

      {/* Bottom Payment Button */}
      <View style={styles.bottomActions}>
         <PrimaryButton 
          label={isRTL ? `تسديد المبلغ المتبقي ( ${Number(remainingAmount).toLocaleString()} د.ع )` : `Pay Remaining Balance ( ${Number(remainingAmount).toLocaleString()} IQD )`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Action for payment
          }}
          style={styles.payButton}
         />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    height: normalize.height(60),
    paddingHorizontal: normalize.width(16),
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FB',
  },
  headerBtn: {
    width: normalize.width(40),
    height: normalize.width(40),
    borderRadius: normalize.radius(20),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Tajawal-Bold",
    color: Colors.text.primary,
  },
  scrollContent: {
    padding: normalize.width(16),
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: normalize.radius(20),
    padding: normalize.width(16),
    marginBottom: normalize.height(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  chaletRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chaletInfo: {
    flex: 1,
  },
  chaletName: {
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Black",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  chaletLocation: {
    fontSize: normalize.font(13),
    fontFamily: "Tajawal-Medium",
    color: Colors.text.muted,
    marginBottom: 8,
  },
  ratingRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: normalize.font(12),
    fontFamily: "Tajawal-Bold",
    color: Colors.text.primary,
    paddingTop: 2,
  },
  priceTag: {
    fontSize: normalize.font(14),
    fontFamily: "Tajawal-Bold",
    color: Colors.text.primary,
  },
  organicImageContainer: {
    width: normalize.width(100),
    height: normalize.width(100),
    borderRadius: normalize.radius(30),
    overflow: 'hidden',
    marginLeft: normalize.width(12),
  },
  organicImage: {
    width: '100%',
    height: '100%',
    borderRadius: normalize.radius(30), // Can be made more organic with complex radii
    borderTopLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Tajawal-Bold",
    color: IDENTITY_BLUE,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginBottom: 16,
  },
  detailRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Tajawal-Medium",
    color: Colors.text.primary,
    flex: 1,
  },
  value: {
    fontSize: normalize.font(15),
    fontFamily: "Tajawal-Bold",
    color: Colors.text.primary,
    flex: 2,
  },
  currency: {
    fontSize: normalize.font(13),
    fontFamily: "Tajawal-Bold",
  },
  notesText: {
    fontSize: normalize.font(14),
    fontFamily: "Tajawal-Regular",
    color: Colors.text.muted,
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: normalize.width(16),
    paddingTop: normalize.height(12),
    paddingBottom: normalize.height(30),
    borderTopLeftRadius: normalize.radius(24),
    borderTopRightRadius: normalize.radius(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  payButton: {
    height: normalize.height(56),
    borderRadius: normalize.radius(28),
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelLinkText: {
    color: '#EF4444',
    fontFamily: "Tajawal-SemiBold",
    fontSize: normalize.font(14),
    textDecorationLine: 'underline',
  },
  sheetLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
