import React from 'react';
import { View, StyleSheet, Text, Linking, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';
import { Colors, normalize } from '@/constants/theme';
import { PrimaryButton } from '@/components/user/primary-button';
import { SolarClockCircleBold } from '@/components/icons/solar-icons';

export function PendingApprovalScreen({ onRefresh }: { onRefresh?: () => void }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
      }
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SolarClockCircleBold size={80} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>
          {isRTL ? 'حسابك قيد المراجعة' : 'Account Under Review'}
        </Text>
        
        <Text style={styles.description}>
          {isRTL 
            ? 'شكراً لانضمامك إلينا! يتم حالياً مراجعة طلبك من قبل فريقنا. سنقوم بتفعيل حسابك خلال 24 ساعة.'
            : 'Thank you for joining us! Your request is being reviewed by our team. We will activate your account within 24 hours.'}
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {isRTL 
              ? 'يمكنك التواصل مع الدعم الفني لتسريع العملية'
              : 'You can contact support to speed up the process'}
          </Text>
        </View>

        <PrimaryButton
          label={isRTL ? 'تواصل مع الدعم' : 'Contact Support'}
          onPress={() => Linking.openURL('https://wa.me/9647712684012')}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 30,
    backgroundColor: '#F0F7FF',
    padding: 30,
    borderRadius: 50,
  },
  title: {
    fontSize: normalize.font(24),
    fontFamily: 'Alexandria-Black',
    color: '#1E293B',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: normalize.font(14),
    fontFamily: 'Alexandria-Medium',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    marginBottom: 30,
  },
  infoText: {
    fontSize: normalize.font(12),
    fontFamily: 'Alexandria-Bold',
    color: '#475569',
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
