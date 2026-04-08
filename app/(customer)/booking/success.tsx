import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/user/primary-button';
import { MotionIcon } from '@/components/icons/motion-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BookingSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    router.replace('/(customer)/profile');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        <MotionIcon 
          name="success" 
          size={250} 
          loop={false}
          style={styles.animation}
        />
        
        <ThemedText style={styles.title}>تم الحجز بنجاح!</ThemedText>
        <ThemedText style={styles.subtitle}>
          لقد تم تأكيد حجزك بنجاح. يمكنك مراجعة تفاصيل الحجز من خلال ملفك الشخصي.
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          label="تم" 
          onPress={handleDone}
          style={styles.doneBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  animation: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  doneBtn: {
    width: '100%',
    height: 58,
  }
});
