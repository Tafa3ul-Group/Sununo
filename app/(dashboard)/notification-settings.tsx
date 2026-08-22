import {
  ProfileShape,
  SolarBellBold,
  SolarChatLineLinear,
  SolarInfoCircleBold,
} from '@/components/icons/solar-icons';
import { Colors, normalize } from '@/constants/theme';
import { useDirection } from '@/i18n';
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from '@/store/api/customerApiSlice';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

/** Channel keys as the backend names them on `notification_settings`. */
type Channel = 'whatsapp' | 'firebase';

export default function NotificationSettingsScreen() {
  const { isRTL, textAlign } = useDirection();

  const { data, isLoading, refetch, isFetching } = useGetNotificationSettingsQuery(undefined);
  const [updateSettings] = useUpdateNotificationSettingsMutation();

  const settings = data?.data || data;

  // Mirrored locally so the switch moves the instant it's tapped instead of
  // waiting on the round trip; a failed save puts it back.
  const [local, setLocal] = useState<Record<Channel, boolean>>({
    whatsapp: true,
    firebase: true,
  });

  useEffect(() => {
    if (!settings) return;
    setLocal({
      whatsapp: settings.whatsapp !== false,
      firebase: settings.firebase !== false,
    });
  }, [settings]);

  const toggle = async (channel: Channel, next: boolean) => {
    const previous = local[channel];
    setLocal((state) => ({ ...state, [channel]: next }));

    try {
      await updateSettings({ [channel]: next }).unwrap();
    } catch (error: any) {
      setLocal((state) => ({ ...state, [channel]: previous }));
      const raw = error?.data?.message;
      const detail = Array.isArray(raw) ? raw.join('\n') : raw;
      Toast.show({
        type: 'error',
        text1: isRTL ? 'خطأ' : 'Error',
        text2: detail || (isRTL ? 'تعذّر حفظ الإعداد' : 'Could not save the setting'),
        position: 'bottom',
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderToggleRow = ({
    icon: IconComponent,
    shape,
    label,
    description,
    channel,
  }: {
    icon: any;
    shape: 'blue' | 'green' | 'pink' | 'red' | 'info';
    label: string;
    description: string;
    channel: Channel;
  }) => {
    const value = local[channel];

    return (
      <View style={styles.menuRow}>
        <ProfileShape size={normalize.width(36)} type={value ? shape : 'info'}>
          <IconComponent size={18} color="white" />
        </ProfileShape>
        <View style={[styles.menuLabelContainer, { alignItems: 'flex-start' }]}>
          <Text style={[styles.menuLabelText, { textAlign }]}>{label}</Text>
          <Text style={[styles.menuValueText, { textAlign }]}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={(next) => toggle(channel, next)}
          trackColor={{ false: '#D1D5DB', true: Colors.primary + '40' }}
          thumbColor={value ? Colors.primary : '#9CA3AF'}
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={[styles.groupTitle, { textAlign }]}>
          {isRTL ? 'قنوات الإشعارات' : 'Notification Channels'}
        </Text>

        <View style={styles.menuGroup}>
          {renderToggleRow({
            icon: SolarChatLineLinear,
            shape: 'green',
            channel: 'whatsapp',
            label: isRTL ? 'إشعارات واتساب' : 'WhatsApp Notifications',
            description: local.whatsapp
              ? isRTL
                ? 'تصلك رسائل واتساب عند وصول حجز جديد أو تأكيده أو إلغائه'
                : 'You receive WhatsApp messages for new, confirmed and cancelled bookings'
              : isRTL
                ? 'لن تصلك رسائل واتساب عن حجوزات شاليهك'
                : 'You will not receive WhatsApp messages about your chalet bookings',
          })}

          {renderToggleRow({
            icon: SolarBellBold,
            shape: 'pink',
            channel: 'firebase',
            label: isRTL ? 'إشعارات التطبيق' : 'App Notifications',
            description: local.firebase
              ? isRTL
                ? 'تصلك إشعارات فورية على هاتفك'
                : 'Push notifications are delivered to your phone'
              : isRTL
                ? 'لن تصلك إشعارات فورية على هاتفك'
                : 'Push notifications are turned off',
          })}
        </View>

        {/* What the toggle deliberately does NOT silence. Saying it here is
            cheaper than a support ticket asking why a code still arrived. */}
        <View style={[styles.noticeCard, { flexDirection: 'row' }]}>
          <SolarInfoCircleBold size={18} color="#2563EB" />
          <Text style={[styles.noticeText, { textAlign }]}>
            {isRTL
              ? 'تبقى رسائل رمز التحقق وإشعار تحويل مستحقاتك المالية تصلك دائماً حتى عند إيقاف الإشعارات، لأنها ضرورية لأمان حسابك وتوثيق أموالك.'
              : 'Verification codes and payout receipts are always delivered, even with notifications off — they are required for account security and as a record of your money.'}
          </Text>
        </View>

        <Text style={[styles.footnote, { textAlign }]}>
          {isRTL
            ? 'يمكنك دائماً متابعة كل ما يخص شاليهك من صفحة الإشعارات داخل التطبيق.'
            : 'You can always follow everything about your chalet from the in-app notifications screen.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(16),
    paddingBottom: normalize.height(40),
  },
  groupTitle: {
    fontSize: normalize.font(13),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: Colors.text.muted,
    marginBottom: normalize.height(10),
    paddingHorizontal: normalize.width(4),
  },
  menuGroup: {
    gap: normalize.height(12),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: normalize.radius(16),
    paddingVertical: normalize.height(12),
    paddingHorizontal: normalize.width(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuLabelContainer: {
    flex: 1,
    marginHorizontal: normalize.width(12),
    gap: 2,
  },
  menuLabelText: {
    fontSize: normalize.font(14),
    fontFamily: 'IBMPlexSansArabic-Bold',
    color: '#374151',
  },
  menuValueText: {
    fontSize: normalize.font(11),
    fontFamily: 'IBMPlexSansArabic-Regular',
    color: Colors.text.muted,
    lineHeight: normalize.font(17),
  },
  noticeCard: {
    alignItems: 'flex-start',
    gap: normalize.width(10),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: normalize.radius(16),
    padding: normalize.width(14),
    marginTop: normalize.height(20),
  },
  noticeText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: 'IBMPlexSansArabic-Regular',
    color: '#1D4ED8',
    lineHeight: normalize.font(18),
  },
  footnote: {
    fontSize: normalize.font(11),
    fontFamily: 'IBMPlexSansArabic-Regular',
    color: Colors.text.muted,
    lineHeight: normalize.font(18),
    marginTop: normalize.height(14),
    paddingHorizontal: normalize.width(4),
  },
});
