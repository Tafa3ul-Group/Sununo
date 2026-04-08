import { SolarIcon } from "@/components/ui/solar-icon";
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows, Spacing, Typography } from '@/constants/theme';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface NotificationItem {
  id: string;
  type: 'booking' | 'payment' | 'system';
  title: { ar: string; en: string };
  message: { ar: string; en: string };
  time: { ar: string; en: string };
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'booking',
    title: { ar: 'حجز جديد', en: 'New Booking' },
    message: { ar: 'تم حجز شاليه اللؤلؤة لتاريخ 25 مارس', en: 'Pearl Chalet has been booked for March 25' },
    time: { ar: 'منذ دقيقتين', en: '2 mins ago' },
    isRead: false,
  },
  {
    id: '2',
    type: 'payment',
    title: { ar: 'تم استلام دفعة', en: 'Payment Received' },
    message: { ar: 'تم استلام مبلغ 150,000 د.ع من أحمد علي', en: '150,000 IQD received from Ahmed Ali' },
    time: { ar: 'منذ ساعة', en: '1 hour ago' },
    isRead: false,
  },
  {
    id: '3',
    type: 'system',
    title: { ar: 'تحديث النظام', en: 'System Update' },
    message: { ar: 'نسخة جديدة متاحة من التطبيق، حدث الآن للمزيد من الميزات', en: 'New app version available, update now for more features' },
    time: { ar: 'أمس', en: 'Yesterday' },
    isRead: true,
  },
  {
    id: '4',
    type: 'booking',
    title: { ar: 'إلغاء حجز', en: 'Booking Cancelled' },
    message: { ar: 'تم إلغاء حجز إستراحة اليرموك لتاريخ 20 مارس', en: 'Yarmouk Rest House booking for March 20 cancelled' },
    time: { ar: 'منذ يومين', en: '2 days ago' },
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar-check', color: '#007AFF', bg: '#E5F1FF' };
      case 'payment':
        return { name: 'cash-multiple', color: '#34C759', bg: '#EBF9EE' };
      case 'system':
        return { name: 'information-outline', color: '#FF9500', bg: '#FFF4E5' };
      default:
        return { name: 'bell-outline', color: '#8E8E93', bg: '#F2F2F7' };
    }
  };

  const markAllAsRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const icon = getIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
          <SolarIcon name="4k-bold" size={24} color={icon.color} />
        </View>

        <View style={[styles.contentContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.notifTitle}>{isRTL ? item.title.ar : item.title.en}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.notifMessage, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? item.message.ar : item.message.en}
          </Text>
          <Text style={styles.notifTime}>{isRTL ? item.time.ar : item.time.en}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <SolarIcon name="4k-bold" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <ThemedText type="h2" style={styles.headerTitle}>
          {isRTL ? 'التنبيهات' : 'Notifications'}
        </ThemedText>

        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markReadText}>
            {isRTL ? 'تحديد كقروء' : 'Read all'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <FlashList
          data={notifications}
          renderItem={renderNotificationItem}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <SolarIcon name="4k-bold" size={80} color="#D1D1D6" />
              <Text style={styles.emptyText}>{isRTL ? 'لا توجد تنبيهات حالياً' : 'No notifications yet'}</Text>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  markReadText: {
    fontSize: normalize.font(14),
    fontWeight: '600',
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: Colors.white,
    padding: 18,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
    shadowOpacity: 0.03,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: normalize.font(15),
    fontWeight: '800',
    color: Colors.text.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifMessage: {
    fontSize: normalize.font(14),
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: normalize.font(16),
    color: Colors.text.muted,
    marginTop: 16,
  },
});
