import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, I18nManager } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { 
  SolarCheckCircleBold, 
  SolarCloseCircleBold, 
  SolarInfoCircleBold, 
  SolarShieldWarningBold 
} from '@/components/icons/solar-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 450);

const isRTL = I18nManager.isRTL;
const layoutDirection = isRTL ? 'row-reverse' : 'row';
const textAlignment = isRTL ? 'right' : 'left';

interface CustomToastProps extends BaseToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
}

const CustomToast = ({ type, text1, text2, onPress }: CustomToastProps) => {
  // Trigger Haptic Feedback on mount
  useEffect(() => {
    try {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'info':
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    } catch (e) {
      console.warn('[Toast Config] Haptics error:', e);
    }
  }, [type]);

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          icon: <SolarCheckCircleBold size={24} color="#10B981" />,
          bgColor: '#ECFDF5',
          borderColor: '#10B981',
          textColor: '#065F46',
          mutedColor: '#047857',
        };
      case 'error':
        return {
          icon: <SolarCloseCircleBold size={24} color="#F97316" />, // Orange is used as the accent/error color in theme.ts
          bgColor: '#FEF3EC',
          borderColor: '#F97316',
          textColor: '#9A3412',
          mutedColor: '#C2410C',
        };
      case 'warning':
        return {
          icon: <SolarShieldWarningBold size={24} color="#F59E0B" />,
          bgColor: '#FFFBEB',
          borderColor: '#F59E0B',
          textColor: '#78350F',
          mutedColor: '#B45309',
        };
      case 'info':
      default:
        return {
          icon: <SolarInfoCircleBold size={24} color="#2B66FF" />,
          bgColor: '#EEF2FF',
          borderColor: '#2B66FF',
          textColor: '#1E40AF',
          mutedColor: '#3730A3',
        };
    }
  };

  const theme = getTheme();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      style={[
        styles.toastContainer,
        {
          flexDirection: layoutDirection,
          backgroundColor: theme.bgColor,
          borderColor: theme.borderColor,
        }
      ]}
    >
      <View style={styles.iconContainer}>
        {theme.icon}
      </View>
      <View style={[styles.contentContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        {text1 && (
          <Text style={[styles.title, { textAlign: textAlignment, color: theme.textColor }]}>
            {text1}
          </Text>
        )}
        {text2 && (
          <Text style={[styles.message, { textAlign: textAlignment, color: theme.mutedColor }]}>
            {text2}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const toastConfig = {
  success: (props: any) => <CustomToast {...props} type="success" />,
  error: (props: any) => <CustomToast {...props} type="error" />,
  warning: (props: any) => <CustomToast {...props} type="warning" />,
  info: (props: any) => <CustomToast {...props} type="info" />,
};

const styles = StyleSheet.create({
  toastContainer: {
    width: TOAST_WIDTH,
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginHorizontal: 16,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 8,
    gap: 2,
  },
  title: {
    fontFamily: 'Alexandria-Medium',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  message: {
    fontFamily: 'Alexandria-Medium',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
