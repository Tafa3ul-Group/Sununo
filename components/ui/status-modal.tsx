import React from 'react';
import { StyleSheet, View, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MotionIcon, MotionName } from '@/components/icons/motion-icons';
import { PrimaryButton } from '@/components/user/primary-button';

interface StatusModalProps {
  visible: boolean;
  type: 'loading' | 'success' | 'failed' | 'error404';
  title?: string;
  message?: string;
  onClose?: () => void;
  buttonLabel?: string;
}

export const StatusModal = ({ 
  visible, 
  type, 
  title, 
  message, 
  onClose,
  buttonLabel = "حسناً"
}: StatusModalProps) => {
  const motionName: MotionName = type === 'loading' ? 'loading' : type === 'success' ? 'success' : type === 'error404' ? 'error404' : 'failed';

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          <MotionIcon 
            name={motionName} 
            size={motionName === 'loading' ? 120 : 180} 
            loop={motionName === 'loading'}
            style={styles.animation}
          />
          
          {title && <ThemedText style={styles.title}>{title}</ThemedText>}
          {message && <ThemedText style={styles.message}>{message}</ThemedText>}
          
          {type !== 'loading' && onClose && (
            <PrimaryButton 
              label={buttonLabel}
              onPress={onClose}
              style={styles.button}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10 },
  animation: {
    marginBottom: 10 },
  title: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10 },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: "Alexandria-Medium",
    marginBottom: 25 },
  button: {
    width: '100%',
    height: 52 }
});
