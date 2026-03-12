import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

// Mock data for transactions
const MOCK_TRANSACTIONS = [
  {
    id: '1',
    title: 'حجز - شاليه اللؤلؤة',
    date: '12 مارس 2024',
    amount: '+150,000 د.ع',
    type: 'income',
  },
  {
    id: '2',
    title: 'حجز - إستراحة اليرموك',
    date: '10 مارس 2024',
    amount: '+100,000 د.ع',
    type: 'income',
  },
  {
    id: '3',
    title: 'سحب رصيد',
    date: '5 مارس 2024',
    amount: '-500,000 د.ع',
    type: 'withdrawal',
  }
];

export default function RevenueScreen() {
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const renderTransactionItem = ({ item }: { item: typeof MOCK_TRANSACTIONS[0] }) => (
    <View style={[styles.transactionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? '#E8F5E9' : '#FFF3E0' }]}>
        <MaterialCommunityIcons 
          name={item.type === 'income' ? 'arrow-bottom-left' : 'arrow-top-right'} 
          size={20} 
          color={item.type === 'income' ? '#2E7D32' : '#F57C00'} 
        />
      </View>
      
      <View style={[styles.transactionInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>

      <Text style={[styles.transactionAmount, { color: item.type === 'income' ? '#2E7D32' : '#FF3B30' }]}>
        {item.amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        userType={userType} 
        userName={user?.name} 
        title={t('tabs.revenue')}
        showSearch={false}
        showCategories={false}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.spacer} />

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('dashboard.revenue.balance')}</Text>
          <Text style={styles.balanceValue}>2,100,000 د.ع</Text>
          
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>{t('dashboard.revenue.withdraw')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
           <View style={styles.statBox}>
              <Text style={styles.quickStatLabel}>حجوزات الشهر</Text>
              <Text style={styles.quickStatValue}>14</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.quickStatLabel}>دخل الشهر</Text>
              <Text style={styles.quickStatValue}>900,000 د.ع</Text>
           </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.historyHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ThemedText type="h2" style={styles.historyTitle}>{t('dashboard.revenue.history')}</ThemedText>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyList}>
          {MOCK_TRANSACTIONS.map(item => (
            <View key={item.id}>
              {renderTransactionItem({ item })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  spacer: {
    height: Spacing.md,
  },
  pageTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: normalize.radius(24),
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.medium,
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    color: Colors.white + '90',
    fontSize: normalize.font(14),
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    color: Colors.white,
    fontSize: normalize.font(32),
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  withdrawButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: normalize.height(12),
    borderRadius: normalize.radius(12),
  },
  withdrawButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: normalize.font(14),
  },
  statsRow: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: normalize.radius(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: normalize.font(16),
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  historyHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontSize: normalize.font(18),
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: normalize.font(12),
    fontWeight: '600',
  },
  historyList: {
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    padding: Spacing.sm,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionItem: {
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  transactionIcon: {
    width: normalize.width(40),
    height: normalize.width(40),
    borderRadius: normalize.radius(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: normalize.font(14),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
  },
  transactionAmount: {
    fontSize: normalize.font(14),
    fontWeight: 'bold',
  },
});
