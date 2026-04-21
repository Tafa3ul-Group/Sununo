import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, normalize } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useGetPayoutsQuery } from '@/store/api/apiSlice';
import { SolarBanknoteBold } from "@/components/icons/solar-icons";

const FILTERS = [
  { id: undefined, ar: 'الكل', en: 'All' },
  { id: 'pending', ar: 'قيد المراجعة', en: 'Pending' },
  { id: 'approved', ar: 'مقبول', en: 'Approved' },
  { id: 'paid', ar: 'تم الدفع', en: 'Paid' },
  { id: 'rejected', ar: 'مرفوض', en: 'Rejected' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);

  const { data: payoutsResponse, isLoading, refetch } = useGetPayoutsQuery({ 
    status: activeFilter, 
    limit: 50 
  });
  const payouts = payoutsResponse?.data || payoutsResponse || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#3B82F6';
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return Colors.text.muted;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'approved': return '#EFF6FF';
      case 'paid': return '#ECFDF5';
      case 'pending': return '#FFF7ED';
      case 'rejected': return '#FEF2F2';
      default: return '#F8F9FB';
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status) {
      case 'paid': return 'check-circle-outline';
      case 'approved': return 'thumb-up-outline';
      case 'pending': return 'clock-outline';
      case 'rejected': return 'close-circle-outline';
      default: return 'cash-fast';
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTransactionItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const statusBg = getStatusBg(item.status);
    
    return (
      <TouchableOpacity 
        style={[styles.transactionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.7}
      >
        <View style={[styles.transactionIcon, { backgroundColor: statusBg }]}>
          <SolarBanknoteBold size={22} color={statusColor} />
        </View>
        
        <View style={[styles.transactionInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.transactionTitle}>{isRTL ? 'طلب سحب' : 'Payout Request'}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
          <Text style={styles.transactionAmount}>
            {item.amount?.toLocaleString()} <Text style={styles.currencySmall}>{isRTL ? 'د.ع' : 'IQD'}</Text>
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        userType={userType} 
        userName={user?.name} 
        title={isRTL ? 'سجل المعاملات' : 'Transactions'}
        showSearch={false}
        showCategories={false}
        showBackButton={true}
        showExtra={false}
      />

      {/* Filter Pills - Scrollable */}
      <View style={styles.filterContainer}>
        <FlashList
          data={FILTERS}
          renderItem={({ item: filter }) => (
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === filter.id && styles.filterPillActive]}
              onPress={() => setActiveFilter(filter.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeFilter === filter.id && styles.filterTextActive]}>
                {isRTL ? filter.ar : filter.en}
              </Text>
            </TouchableOpacity>
          )}
          estimatedItemSize={80}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14 }}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          inverted={isRTL}
        />
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />
        ) : (
          <FlashList
            data={Array.isArray(payouts) ? payouts : []}
            renderItem={renderTransactionItem}
            estimatedItemSize={80}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <SolarBanknoteBold size={48} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTitle}>{isRTL ? 'لا توجد معاملات' : 'No Transactions'}</Text>
                <Text style={styles.emptySubtitle}>
                  {isRTL ? 'ستظهر طلبات السحب هنا بعد تقديمها' : 'Payout requests will appear here after submission'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  // Filters
  filterContainer: {
    height: 52,
    marginTop: 4,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: normalize.font(13),
    fontFamily: "Tajawal-SemiBold",
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.white,
   fontFamily: "Tajawal-Regular" },
  // List
  listContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  transactionItem: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: normalize.font(15),
    fontFamily: "Tajawal-Bold",
    color: Colors.text.primary,
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontFamily: "Tajawal-Medium",
  },
  transactionAmount: {
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Black",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  currencySmall: {
    fontSize: normalize.font(11),
    fontFamily: "Tajawal-SemiBold",
    color: Colors.text.muted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: normalize.font(10),
    fontFamily: "Tajawal-Bold",
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Bold",
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontFamily: "Tajawal-Medium",
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
