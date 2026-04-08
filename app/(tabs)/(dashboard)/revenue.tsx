import { SolarIcon } from "@/components/ui/solar-icon";
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, normalize } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { useGetPayoutsQuery, useRequestPayoutMutation } from '@/store/api/apiSlice';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { PrimaryButton } from '@/components/user/primary-button';
import Toast from 'react-native-toast-message';

const PERIODS = [
  { id: 'week', ar: 'أسبوع', en: 'Week' },
  { id: 'month', ar: 'شهر', en: 'Month' },
  { id: 'year', ar: 'سنة', en: 'Year' },
];

export default function RevenueScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // API hooks
  const { data: payoutsResponse, isLoading: isLoadingPayouts } = useGetPayoutsQuery({ limit: 5 });
  const [requestPayout, { isLoading: isRequesting }] = useRequestPayoutMutation();

  const payouts = payoutsResponse?.data || payoutsResponse || [];

  // Bottom sheet
  const withdrawSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['45%'], []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    try {
      await requestPayout({ amount }).unwrap();
      withdrawSheetRef.current?.dismiss();
      setWithdrawAmount('');
      Toast.show({
        type: 'success',
        text1: isRTL ? 'تم بنجاح' : 'Success',
        text2: isRTL ? 'تم تقديم طلب السحب بنجاح' : 'Payout request submitted successfully',
        position: 'bottom',
      });
    } catch (error: any) {
      const msg = error?.data?.message || (isRTL ? 'فشل طلب السحب' : 'Payout request failed');
      Alert.alert(isRTL ? 'خطأ' : 'Error', typeof msg === 'string' ? msg : msg[0]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return Colors.text.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      pending: { ar: 'قيد المراجعة', en: 'Pending' },
      approved: { ar: 'مقبول', en: 'Approved' },
      paid: { ar: 'تم الدفع', en: 'Paid' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
    };
    return isRTL ? labels[status]?.ar || status : labels[status]?.en || status;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        userType={userType} 
        userName={user?.name} 
        title={isRTL ? 'الأرباح' : 'Revenue'}
        showSearch={false}
        showCategories={false}
        showBackButton={true}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
            
            <Text style={styles.balanceLabel}>{isRTL ? 'إجمالي الرصيد' : 'Total Balance'}</Text>
            <Text style={styles.balanceValue}>{user?.walletBalance?.toLocaleString() || '0'}</Text>
            <Text style={styles.balanceCurrency}>{isRTL ? 'دينار عراقي' : 'IQD'}</Text>
            
            <TouchableOpacity 
              style={styles.withdrawButton} 
              activeOpacity={0.85}
              onPress={() => withdrawSheetRef.current?.present()}
            >
              <SolarIcon name="wallet-bold" size={18} color={Colors.primary} />
              <Text style={styles.withdrawButtonText}>{isRTL ? 'سحب الأرباح' : 'Withdraw'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Filter */}
        <View style={[styles.periodRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[styles.periodPill, selectedPeriod === period.id && styles.periodPillActive]}
              onPress={() => setSelectedPeriod(period.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodText, selectedPeriod === period.id && styles.periodTextActive]}>
                {isRTL ? period.ar : period.en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>  
              <SolarIcon name="calendar-bold" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>14</Text>
            <Text style={styles.statLabel}>{isRTL ? 'حجوزات الشهر' : "Month's Bookings"}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <SolarIcon name="banknote-bold" size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>900,000</Text>
            <Text style={styles.statLabel}>{isRTL ? 'دخل الشهر' : "Month's Income"}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <SolarIcon name="users-group-bold" size={20} color="#F97316" />
            </View>
            <Text style={styles.statValue}>92%</Text>
            <Text style={styles.statLabel}>{isRTL ? 'نسبة الإشغال' : 'Occupancy'}</Text>
          </View>
        </View>

        {/* Recent Payouts */}
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.sectionTitle}>{isRTL ? 'طلبات السحب' : 'Payout Requests'}</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/(dashboard)/transactions')}
            style={styles.viewAllBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>{isRTL ? 'عرض الكل' : 'View All'}</Text>
            <SolarIcon name="alt-arrow-right-linear" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsCard}>
          {isLoadingPayouts ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 30 }} />
          ) : Array.isArray(payouts) && payouts.length > 0 ? (
            payouts.map((item: any, index: number) => (
              <View key={item.id}>
                <View style={[styles.transactionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[
                    styles.transactionIcon, 
                    { backgroundColor: item.status === 'paid' ? '#ECFDF5' : item.status === 'rejected' ? '#FEF2F2' : '#FFF7ED' }
                  ]}>
                    <SolarIcon 
                      name="banknote-bold" 
                      size={20} 
                      color={getStatusColor(item.status)} 
                    />
                  </View>
                  
                  <View style={[styles.transactionInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={styles.transactionTitle}>{isRTL ? 'طلب سحب' : 'Payout Request'}</Text>
                    <Text style={styles.transactionDate}>
                      {new Date(item.createdAt).toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>

                  <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={styles.transactionAmount}>
                      {item.amount?.toLocaleString()} <Text style={styles.currencySmall}>{isRTL ? 'د.ع' : 'IQD'}</Text>
                    </Text>
                    <View style={[styles.typeBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                      <Text style={[styles.typeBadgeText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                {index < payouts.length - 1 && <View style={styles.separator} />}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <SolarIcon name="banknote-linear" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>{isRTL ? 'لا توجد طلبات سحب بعد' : 'No payout requests yet'}</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Withdraw Bottom Sheet */}
      <BottomSheetModal
        ref={withdrawSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 24 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{isRTL ? 'طلب سحب أرباح' : 'Request Payout'}</Text>
          <Text style={styles.sheetSubtitle}>
            {isRTL ? 'أدخل المبلغ المراد سحبه' : 'Enter the amount to withdraw'}
          </Text>

          <View style={styles.amountInputWrap}>
            <BottomSheetTextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#D1D5DB"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
            <Text style={styles.amountCurrency}>{isRTL ? 'د.ع' : 'IQD'}</Text>
          </View>

          <PrimaryButton
            label={isRTL ? 'تأكيد السحب' : 'Confirm Withdrawal'}
            onPress={handleWithdraw}
            loading={isRequesting}
            style={{ marginTop: 16 }}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 100,
  },
  // Balance Card
  balanceCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  balanceCardInner: {
    backgroundColor: Colors.primary,
    padding: 28,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle1: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  decorCircle2: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -20,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize.font(13),
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    color: Colors.white,
    fontSize: normalize.font(36),
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceCurrency: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize.font(14),
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 2,
  },
  withdrawButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withdrawButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: normalize.font(14),
  },
  // Period Filter
  periodRow: {
    gap: 8,
    marginBottom: 20,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  periodPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    fontSize: normalize.font(13),
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  periodTextActive: {
    color: Colors.white,
  },
  // Stats
  statsRow: {
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: normalize.font(16),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  // Section Header
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: normalize.font(13),
    fontWeight: '600',
  },
  // Transactions
  transactionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  transactionItem: {
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  currencySmall: {
    fontSize: normalize.font(11),
    fontWeight: '600',
    color: Colors.text.muted,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: normalize.font(9),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  // Withdraw Sheet
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: normalize.font(20),
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 20,
    height: 60,
  },
  amountInput: {
    flex: 1,
    fontSize: normalize.font(24),
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  amountCurrency: {
    fontSize: normalize.font(16),
    fontWeight: '700',
    color: Colors.text.muted,
  },
});
