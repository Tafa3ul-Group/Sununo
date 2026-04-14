import React from 'react';
import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { MotionIcon } from '@/components/icons/motion-icons';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay = ({ visible, message }: LoadingOverlayProps) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          <MotionIcon 
            name="loading" 
            size={120} 
            style={styles.animation}
          />
          {message && (
            <ThemedText style={styles.message}>{message}</ThemedText>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  animation: {
    marginBottom: 0,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700', fontFamily: "LamaSans-Bold",
    color: '#1E293B',
    textAlign: 'center',
  },
});
