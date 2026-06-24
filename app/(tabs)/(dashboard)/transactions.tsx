import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SolarBanknoteBold } from "@/components/icons/solar-icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from "@/i18n";
import { RootState } from '@/store';
import { useGetPayoutsQuery } from '@/store/api/apiSlice';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

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
  const { isRTL, textAlign } = useDirection();
  const startAlign = isRTL ? 'flex-end' : 'flex-start';
  const endAlign = isRTL ? 'flex-start' : 'flex-end';
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  // FlashList v2 dropped `inverted`; reverse the data for RTL so the filter
  // pills still read right-to-left (e.g. "الكل" stays on the right).
  const filterData = useMemo(() => (isRTL ? [...FILTERS].reverse() : FILTERS), [isRTL]);

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
      rejected: { ar: 'مرفوض', en: 'Rejected' }
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

    // Destination account the payout is sent to (ZainCash or Qi).
    const dest = item.zainCash
      ? { label: isRTL ? 'زين كاش' : 'ZainCash', value: item.zainCash }
      : item.qi
        ? { label: isRTL ? 'Qi كارت' : 'Qi Card', value: item.qi }
        : null;

    return (
      <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
        {/* Top row: icon + title/code + amount/status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.transactionIcon, { backgroundColor: statusBg }]}>
            <SolarBanknoteBold size={22} color={statusColor} />
          </View>

          <View style={[styles.transactionInfo, { alignItems: startAlign }]}>
            <Text style={[styles.transactionTitle, { textAlign }]}>{isRTL ? 'طلب سحب' : 'Payout Request'}</Text>
            {item.requestCode ? (
              <Text style={[styles.refCode, { textAlign }]}>{item.requestCode}</Text>
            ) : null}
          </View>

          <View style={{ alignItems: endAlign }}>
            <Text style={[styles.transactionAmount, { textAlign: isRTL ? 'left' : 'right' }]}>
              {Number(item.amount)?.toLocaleString()} <Text style={styles.currencySmall}>{isRTL ? 'د.ع' : 'IQD'}</Text>
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detail block: destination, dates, and state-specific notes */}
        <View style={[styles.detailBlock, { alignItems: startAlign }]}>
          {dest ? (
            <Text style={[styles.detailText, { textAlign }]}>
              {(isRTL ? 'إلى: ' : 'To: ') + dest.label + ' • ' + dest.value}
            </Text>
          ) : null}

          <Text style={[styles.detailMuted, { textAlign }]}>
            {(isRTL ? 'تاريخ الطلب: ' : 'Requested: ') + formatDate(item.createdAt)}
          </Text>

          {item.status === 'paid' && item.paidAt ? (
            <Text style={[styles.detailPaid, { textAlign }]}>
              {(isRTL ? '✓ تم الدفع في: ' : '✓ Paid on: ') + formatDate(item.paidAt)}
            </Text>
          ) : null}

          {item.status === 'rejected' && item.rejectionReason ? (
            <Text style={[styles.detailRejected, { textAlign }]}>
              {(isRTL ? 'سبب الرفض: ' : 'Reason: ') + item.rejectionReason}
            </Text>
          ) : null}

          {item.status === 'approved' ? (
            <Text style={[styles.detailMuted, { textAlign }]}>
              {isRTL ? 'تمت الموافقة — قيد التحويل' : 'Approved — transfer in progress'}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.safeArea]}>
      <DashboardHeader
        title={isRTL ? 'سجل المعاملات' : 'Transactions'}
        showSearch={false}
        showBackButton={true}
      />

      {/* Filter Pills - Scrollable */}
      <View style={styles.filterContainer}>
        <FlashList
          data={filterData}
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
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14 }}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} size="large" />
        ) : (Array.isArray(payouts) ? payouts : []).length === 0 ? (
          // Shared EmptyState (reliable icon + centering) instead of FlashList's
          // ListEmptyComponent, which didn't render the icon consistently.
          <EmptyState
            icon={<SolarBanknoteBold size={56} color={Colors.primary} />}
            title={isRTL ? 'لا توجد معاملات' : 'No Transactions'}
            description={
              isRTL
                ? 'ستظهر طلبات السحب هنا بعد تقديمها'
                : 'Payout requests will appear here after submission'
            }
          />
        ) : (
          <FlashList
            data={Array.isArray(payouts) ? payouts : []}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white
  },
  // Filters
  filterContainer: {
    height: 52,
    marginTop: 4
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  filterText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary
  },
  filterTextActive: {
    color: Colors.white,
    fontFamily: "Alexandria-Medium"
  },
  // List
  listContainer: {
    flex: 1,
    backgroundColor: Colors.white
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 100
  },
  transactionItem: {
    paddingVertical: 16,
    gap: 10
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  transactionInfo: {
    flex: 1
  },
  transactionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginBottom: 3
  },
  transactionDate: {
    fontSize: normalize.font(8),
    color: Colors.text.muted,
    fontFamily: "Alexandria-Medium"
  },
  refCode: {
    fontSize: normalize.font(10),
    color: Colors.primary,
    fontFamily: "Alexandria-Medium"
  },
  detailBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4
  },
  detailText: {
    fontSize: normalize.font(11),
    color: Colors.text.secondary,
    fontFamily: "Alexandria-Medium"
  },
  detailMuted: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    fontFamily: "Alexandria-Medium"
  },
  detailPaid: {
    fontSize: normalize.font(11),
    color: '#10B981',
    fontFamily: "Alexandria-Medium"
  },
  detailRejected: {
    fontSize: normalize.font(11),
    color: '#EF4444',
    fontFamily: "Alexandria-Medium"
  },
  transactionAmount: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginBottom: 4
  },
  currencySmall: {
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.muted
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusBadgeText: {
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium"
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary
  },
  emptySubtitle: {
    fontSize: normalize.font(8),
    color: Colors.text.muted,
    fontFamily: "Alexandria-Medium",
    textAlign: 'center',
    paddingHorizontal: 40
  }
});
