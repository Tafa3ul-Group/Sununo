import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { SolarUserBold, SolarCloseBold } from '@/components/icons/solar-icons';
import { PrimaryButton } from './primary-button';
import { SecondaryButton } from './secondary-button';
import { useTranslation } from 'react-i18next';

interface LoginPromptModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ isVisible, onClose, onLogin }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <SolarCloseBold size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <SolarUserBold size={40} color={Colors.primary} />
            </View>
            
            <ThemedText style={styles.title}>
              {isRTL ? 'تسجيل الدخول مطلوب' : 'Login Required'}
            </ThemedText>
            
            <ThemedText style={styles.description}>
              {isRTL 
                ? 'يجب عليك تسجيل الدخول للمتابعة وعمل الحجوزات. هل تريد الذهاب لصفحة التسجيل؟' 
                : 'You need to login to continue and make bookings. Do you want to go to the login page?'}
            </ThemedText>
          </View>

          <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SecondaryButton 
              label={isRTL ? 'إلغاء' : 'Cancel'} 
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <PrimaryButton 
              label={isRTL ? 'تسجيل الدخول' : 'Login'} 
              onPress={onLogin}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LoginPromptModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    ...Shadows.large,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Alexandria-Black',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Alexandria-Medium',
  },
  footer: {
    gap: 12,
  },
});
