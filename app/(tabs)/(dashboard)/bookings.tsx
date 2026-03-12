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

// Mock data for bookings
const MOCK_BOOKINGS = [
  {
    id: '1',
    chalet: 'شاليه اللؤلؤة',
    customer: 'أحمد علي',
    date: '15 مارس - 17 مارس',
    status: 'new',
    price: '300,000 د.ع',
  },
  {
    id: '2',
    chalet: 'إستراحة اليرموك',
    customer: 'سارة خالد',
    date: '20 مارس - 21 مارس',
    status: 'confirmed',
    price: '150,000 د.ع',
  },
  {
    id: '3',
    chalet: 'شاليه اللؤلؤة',
    customer: 'حسين محمود',
    date: '10 مارس - 11 مارس',
    status: 'finished',
    price: '150,000 د.ع',
  }
];

export default function BookingsScreen() {
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('new');
  const isRTL = language === 'ar';

  const TABS = [
    { id: 'new', label: t('dashboard.bookings.new') },
    { id: 'confirmed', label: t('dashboard.bookings.confirmed') },
    { id: 'finished', label: t('dashboard.bookings.finished') },
  ];

  const filteredBookings = MOCK_BOOKINGS.filter(b => b.status === activeTab);

  const renderBookingItem = ({ item }: { item: typeof MOCK_BOOKINGS[0] }) => (
    <View style={styles.bookingCard}>
      <View style={[styles.bookingHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <ThemedText type="h2" style={styles.customerName}>{item.customer}</ThemedText>
          <ThemedText style={styles.chaletName}>{item.chalet}</ThemedText>
        </View>
        <ThemedText type="price" style={styles.priceText}>{item.price}</ThemedText>
      </View>

      <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Ionicons name="calendar-outline" size={16} color={Colors.text.muted} />
        <Text style={[styles.detailText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.date}</Text>
      </View>

      {item.status === 'new' && (
        <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={[styles.actionButton, styles.acceptButton]}>
            <Text style={styles.acceptButtonText}>{t('dashboard.bookings.accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]}>
            <Text style={styles.declineButtonText}>{t('dashboard.bookings.decline')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'confirmed' && (
        <View style={[styles.statusInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
           <MaterialCommunityIcons name="check-decagram" size={20} color="#2E7D32" />
           <Text style={[styles.statusInfoText, { color: '#2E7D32' }]}>{t('dashboard.bookings.confirmed')}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        userType={userType} 
        userName={user?.name} 
        title={t('tabs.bookings')}
        showSearch={false}
        showCategories={false}
      />
      <View style={styles.container}>
        <View style={styles.spacer} />
        
        <View style={[styles.tabBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank" size={80} color={Colors.text.muted} />
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
  tabBar: {
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(12),
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: normalize.height(10),
    alignItems: 'center',
    borderRadius: normalize.radius(8),
  },
  activeTabItem: {
    backgroundColor: Colors.white,
    ...Shadows.light,
  },
  tabLabel: {
    fontSize: normalize.font(14),
    color: Colors.text.muted,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  bookingCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: normalize.radius(16),
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookingHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  customerName: {
    fontSize: normalize.font(16),
  },
  chaletName: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
  },
  priceText: {
    fontSize: normalize.font(14),
  },
  detailRow: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailText: {
    fontSize: normalize.font(12),
    color: Colors.text.secondary,
  },
  actionRow: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: normalize.font(12),
  },
  declineButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  declineButtonText: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: normalize.font(12),
  },
  statusInfo: {
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.xs,
  },
  statusInfoText: {
    fontSize: normalize.font(12),
    fontWeight: '700',
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
