import { SolarPhoneBold, SolarUsersGroupRoundedBold } from "@/components/icons/solar-icons";
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, normalize, Shadows } from '@/constants/theme';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTranslation } from 'react-i18next';
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
          <ThemedText type="h2" style={[styles.customerName, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</ThemedText>
          <ThemedText style={[styles.customerPhone, { textAlign: isRTL ? 'right' : 'left' }]}>{item.phone}</ThemedText>
        </View>

        <TouchableOpacity style={styles.contactButton}>
          <SolarPhoneBold size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.stat, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.statLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t('dashboard.stats.totalBookings')}</Text>
          <Text style={[styles.statValue, { textAlign: isRTL ? 'right' : 'left' }]}>{item.totalBookings}</Text>
        </View>
        <View style={[styles.stat, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.statLabel, { textAlign: isRTL ? 'right' : 'left' }]}>آخر زيارة</Text>
          <Text style={[styles.statValue, { textAlign: isRTL ? 'right' : 'left' }]}>{item.lastVisit}</Text>
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
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    shadowOpacity: 0.03,
  },
  cardContent: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: normalize.font(18),
    color: Colors.text.primary,
    fontFamily: "Tajawal-Bold",
  },
  info: {
    flex: 1,
  },
  customerName: {
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Black",
    color: Colors.text.primary,
  },
  customerPhone: {
    fontSize: normalize.font(13),
    color: Colors.text.muted,
    marginTop: 2,
    fontFamily: "Tajawal-Regular",
  },
  contactButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: normalize.radius(10),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    marginBottom: 2,
    fontFamily: "Tajawal-SemiBold",
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: normalize.font(14),
    fontFamily: "Tajawal-Black",
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
