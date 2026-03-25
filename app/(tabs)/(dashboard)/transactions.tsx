import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

// Mock data for transactions
const MOCK_TRANSACTIONS = [
  {
    id: '1',
    title: { ar: 'حجز مؤكد', en: 'Confirmed Booking' },
    date: '2024-03-25',
    amount: 150000,
    type: 'income',
  },
  {
    id: '2',
    title: { ar: 'سحب مالي', en: 'Withdrawal' },
    date: '2024-03-22',
    amount: -500000,
    type: 'outcome',
  },
  {
    id: '3',
    title: { ar: 'حجز مؤكد', en: 'Confirmed Booking' },
    date: '2024-03-20',
    amount: 200000,
    type: 'income',
  },
  {
    id: '4',
    title: { ar: 'حجز مؤكد', en: 'Confirmed Booking' },
    date: '2024-03-18',
    amount: 175000,
    type: 'income',
  },
  {
    id: '5',
    title: { ar: 'عمولة المنصة', en: 'Platform Fee' },
    date: '2024-03-18',
    amount: -17500,
    type: 'outcome',
  },
  {
    id: '6',
    title: { ar: 'حجز مؤكد', en: 'Confirmed Booking' },
    date: '2024-03-15',
    amount: 300000,
    type: 'income',
  }
];

export default function TransactionsScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const renderTransactionItem = ({ item }: { item: typeof MOCK_TRANSACTIONS[0] }) => (
    <View style={[styles.transactionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? '#EBF9EE' : '#FFF2F2' }]}>
        <MaterialCommunityIcons 
          name={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} 
          size={20} 
          color={item.type === 'income' ? '#34C759' : '#FF3B30'} 
        />
      </View>
      
      <View style={[styles.transactionInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={styles.transactionTitle}>{isRTL ? item.title.ar : item.title.en}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>

      <Text style={[styles.transactionAmount, { color: item.type === 'income' ? '#34C759' : '#FF3B30' }]}>
        {item.type === 'income' ? '+' : ''}{item.amount.toLocaleString()} د.ع
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isRTL ? 'سجل المعاملات' : 'Transaction History'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <FlashList
          data={MOCK_TRANSACTIONS}
          renderItem={renderTransactionItem}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 100,
  },
  transactionItem: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: normalize.font(15),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
  },
  transactionAmount: {
    fontSize: normalize.font(15),
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
});
