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

// Mock data for owner's chalets
const OWNER_CHALETS = [
  {
    id: '1',
    title: 'شاليه اللؤلؤة',
    location: 'البصرة، القبلة',
    revenue: '1,250,000 د.ع',
    bookings: 12,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400',
  },
  {
    id: '2',
    title: 'إستراحة اليرموك',
    location: 'بغداد، اليرموك',
    revenue: '850,000 د.ع',
    bookings: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400',
  }
];

import { useRouter } from 'expo-router';

export default function MyChaletsScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const renderChaletItem = ({ item }: { item: typeof OWNER_CHALETS[0] }) => (
    <TouchableOpacity 
      style={styles.chaletCard}
      onPress={() => console.log('View Chalet Details', item.id)}
    >
      <Image source={{ uri: item.image }} style={styles.chaletImage} />
      <View style={styles.chaletInfo}>
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ThemedText type="h2" style={styles.chaletTitle}>{item.title}</ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={[styles.statusText, { color: item.status === 'active' ? '#2E7D32' : '#C62828' }]}>
              {t(`dashboard.${item.status}`)}
            </Text>
          </View>
        </View>
        
        <ThemedText style={[styles.locationText, { textAlign: isRTL ? 'right' : 'left' }]}>
          <Ionicons name="location-outline" size={12} /> {item.location}
        </ThemedText>

        <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.stat}>
            <ThemedText style={styles.statLabel}>{t('dashboard.stats.totalRevenue')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>{item.revenue}</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText style={styles.statLabel}>{t('dashboard.stats.totalBookings')}</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>{item.bookings}</ThemedText>
          </View>
        </View>

        <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => console.log('Edit Chalet', item.id)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.primary} />
            <Text style={styles.editButtonText}>{t('dashboard.editChalet')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/(dashboard)/revenue')}
          >
             <MaterialCommunityIcons name="chart-box-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection 
        userType={userType} 
        userName={user?.name} 
        title={t('tabs.myChalets')}
        showSearch={false}
        showCategories={false}
      />
      <View style={styles.container}>
        <View style={[styles.listHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View />
          <TouchableOpacity 
            style={[styles.addButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push('/(tabs)/(dashboard)/add-chalet')}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
            <Text style={styles.addButtonText}>{t('dashboard.addChalet')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={OWNER_CHALETS}
          keyExtractor={(item) => item.id}
          renderItem={renderChaletItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="home-alert-outline" size={80} color={Colors.text.muted} />
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
  listHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(8),
    borderRadius: normalize.radius(10),
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: normalize.font(14),
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  chaletCard: {
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.light,
  },
  chaletImage: {
    width: '100%',
    height: normalize.height(150),
  },
  chaletInfo: {
    padding: Spacing.md,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chaletTitle: {
    fontSize: normalize.font(18),
  },
  statusBadge: {
    paddingHorizontal: normalize.width(8),
    paddingVertical: normalize.height(4),
    borderRadius: normalize.radius(6),
  },
  statusText: {
    fontSize: normalize.font(10),
    fontWeight: '700',
  },
  locationText: {
    color: Colors.text.secondary,
    fontSize: normalize.font(12),
    marginBottom: Spacing.md,
  },
  statsRow: {
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: normalize.radius(8),
    marginBottom: Spacing.md,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: normalize.font(10),
    color: Colors.text.muted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: normalize.font(12),
    color: Colors.text.primary,
  },
  actionRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: normalize.radius(8),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.8,
    justifyContent: 'center',
    gap: Spacing.xs,
    borderColor: Colors.primary + '40',
  },
  editButtonText: {
    color: Colors.primary,
    fontSize: normalize.font(12),
    fontWeight: '600',
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
