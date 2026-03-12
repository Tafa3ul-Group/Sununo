import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

// Mock data for customers
const MOCK_CUSTOMERS = [
  {
    id: '1',
    name: 'أحمد علي',
    phone: '0770 123 4567',
    totalBookings: 5,
    lastVisit: 'قبل يومين',
    initial: 'أ',
  },
  {
    id: '2',
    name: 'سارة خالد',
    phone: '0780 987 6543',
    totalBookings: 3,
    lastVisit: 'قبل أسبوع',
    initial: 'س',
  },
  {
    id: '3',
    name: 'حسين محمود',
    phone: '0750 444 5555',
    totalBookings: 1,
    lastVisit: 'قبل شهر',
    initial: 'ح',
  }
];

export default function CustomersScreen() {
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const renderCustomerItem = ({ item }: { item: typeof MOCK_CUSTOMERS[0] }) => (
    <TouchableOpacity style={styles.customerCard}>
      <View style={[styles.cardContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initial}</Text>
        </View>
        
        <View style={[styles.info, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <ThemedText type="h2" style={styles.customerName}>{item.name}</ThemedText>
          <ThemedText style={styles.customerPhone}>{item.phone}</ThemedText>
        </View>

        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.stat, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.statLabel}>{t('dashboard.stats.totalBookings')}</Text>
          <Text style={styles.statValue}>{item.totalBookings}</Text>
        </View>
        <View style={[styles.stat, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.statLabel}>آخر زيارة</Text>
          <Text style={styles.statValue}>{item.lastVisit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        userType={userType} 
        userName={user?.name} 
        title={t('tabs.customers')}
        showSearch={false}
        showCategories={false}
      />
      <View style={styles.container}>
        <View style={styles.spacer} />

        <FlatList
          data={MOCK_CUSTOMERS}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-search-outline" size={80} color={Colors.text.muted} />
              <Text style={styles.emptyText}>{t('dashboard.noChalets')}</Text>
            </View>
          }
        />
      </View>
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
  listContent: {
    paddingBottom: Spacing.xl,
  },
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.light,
  },
  cardContent: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: normalize.width(50),
    height: normalize.width(50),
    borderRadius: normalize.radius(25),
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: normalize.font(20),
    color: Colors.primary,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  customerName: {
    fontSize: normalize.font(16),
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
  },
  contactButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: normalize.radius(10),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: normalize.radius(12),
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: normalize.font(12),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.text.secondary,
  },
});
