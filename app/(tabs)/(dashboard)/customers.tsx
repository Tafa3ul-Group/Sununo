import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { SolarPhoneBold, SolarUsersGroupRoundedBold } from "@/components/icons/solar-icons";
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import { useDirection } from "@/i18n";
import { RootState } from '@/store';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

// Mock data for customers
const MOCK_CUSTOMERS = [
  {
    id: '1',
    name: 'أحمد علي',
    phone: '0770 123 4567',
    totalBookings: 5,
    lastVisit: 'قبل يومين',
    initial: 'أ'
  },
  {
    id: '2',
    name: 'سارة خالد',
    phone: '0780 987 6543',
    totalBookings: 3,
    lastVisit: 'قبل أسبوع',
    initial: 'س'
  },
  {
    id: '3',
    name: 'حسين محمود',
    phone: '0750 444 5555',
    totalBookings: 1,
    lastVisit: 'قبل شهر',
    initial: 'ح'
  }
];

export default function CustomersScreen() {
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const { textAlign } = useDirection();

  const renderCustomerItem = ({ item }: { item: typeof MOCK_CUSTOMERS[0] }) => (
    <TouchableOpacity style={styles.customerCard}>
      <View style={[styles.cardContent, { flexDirection: 'row' }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initial}</Text>
        </View>

        <View style={[styles.info, { alignItems: 'flex-start' }]}>
          <ThemedText type="h2" style={[styles.customerName, { textAlign }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.customerPhone, { textAlign }]}>{item.phone}</ThemedText>
        </View>

        <TouchableOpacity style={styles.contactButton}>
          <SolarPhoneBold size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, { flexDirection: 'row' }]}>
        <View style={[styles.stat, { alignItems: 'flex-start' }]}>
          <Text style={[styles.statLabel, { textAlign }]}>{t('dashboard.stats.totalBookings')}</Text>
          <Text style={[styles.statValue, { textAlign }]}>{item.totalBookings}</Text>
        </View>
        <View style={[styles.stat, { alignItems: 'flex-start' }]}>
          <Text style={[styles.statLabel, { textAlign }]}>آخر زيارة</Text>
          <Text style={[styles.statValue, { textAlign }]}>{item.lastVisit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safeArea]}>
      <DashboardHeader
        title={t('tabs.customers')}
        showSearch={false}
        showBackButton={true}
      />
      <View style={styles.container}>
        <FlashList
          data={MOCK_CUSTOMERS}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerItem}
          estimatedItemSize={140}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SolarUsersGroupRoundedBold size={80} color={Colors.text.muted} />
              <Text style={styles.emptyText}>{t('dashboard.noChalets')}</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 100
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    shadowOpacity: 0.03
  },
  cardContent: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    fontFamily: "Alexandria-Medium"
  },
  info: {
    flex: 1
  },
  customerName: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary
  },
  customerPhone: {
    fontSize: normalize.font(14),
    color: Colors.text.muted,
    marginTop: 2,
    fontFamily: "Alexandria-Medium"
  },
  contactButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: normalize.radius(10),
    borderWidth: 1,
    borderColor: Colors.border
  },
  statsRow: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  stat: {
    flex: 1
  },
  statLabel: {
    fontSize: normalize.font(8),
    color: Colors.text.muted,
    marginBottom: 2,
    fontFamily: "Alexandria-Medium",
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    opacity: 0.5
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.text.secondary
  }
});
