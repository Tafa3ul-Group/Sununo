import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, ActivityIndicator, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Shadows } from '@/constants/theme';
import { useDirection } from '@/i18n';
import { 
  SolarTrashBinBold, 
  SolarDangerCircleBold, 
  SolarCheckCircleBold,
  SolarInfoCircleBold,
  SolarShieldWarningBold
} from '@/components/icons/solar-icons';
import * as Haptics from 'expo-haptics';

export type DialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationDialogContextProps {
  showConfirm: (options: ConfirmDialogOptions) => void;
  hideConfirm: () => void;
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextProps | undefined>(undefined);

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error('useConfirmationDialog must be used within a ConfirmationDialogProvider');
  }
  return context;
};

interface ConfirmationDialogProviderProps {
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Theme colors per dialog type ────────────────────────────────────────────
const DIALOG_THEMES: Record<DialogType, {
  accent: string;
  iconBg: string;
  confirmBg: string;
  confirmPressed: string;
  ringColor: string;
}> = {
  danger: {
    accent: '#EF4444',
    iconBg: '#FEF2F2',
    confirmBg: '#EF4444',
    confirmPressed: '#DC2626',
    ringColor: 'rgba(239, 68, 68, 0.12)',
  },
  warning: {
    accent: '#F59E0B',
    iconBg: '#FFFBEB',
    confirmBg: '#F59E0B',
    confirmPressed: '#D97706',
    ringColor: 'rgba(245, 158, 11, 0.12)',
  },
  success: {
    accent: Colors.secondary || '#10B981',
    iconBg: '#ECFDF5',
    confirmBg: Colors.secondary || '#10B981',
    confirmPressed: '#059669',
    ringColor: 'rgba(16, 185, 129, 0.12)',
  },
  info: {
    accent: Colors.primary,
    iconBg: '#EFF6FF',
    confirmBg: Colors.primary,
    confirmPressed: '#1D4ED8',
    ringColor: 'rgba(59, 130, 246, 0.12)',
  },
};

export const ConfirmationDialogProvider = ({ children }: ConfirmationDialogProviderProps) => {
  const { isRTL } = useDirection();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    // Reset all values
    overlayOpacity.setValue(0);
    cardScale.setValue(0.85);
    cardOpacity.setValue(0);
    iconScale.setValue(0);
    iconRotate.setValue(0);
    ringScale.setValue(0.5);
    ringOpacity.setValue(0);
    buttonSlide.setValue(20);
    buttonOpacity.setValue(0);

    Animated.parallel([
      // Overlay fade
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Card entrance
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Icon bounce with rotation
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Ring pulse
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(ringOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0.4,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      // Buttons slide up
      Animated.sequence([
        Animated.delay(250),
        Animated.parallel([
          Animated.spring(buttonSlide, {
            toValue: 0,
            friction: 8,
            tension: 65,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [overlayOpacity, cardScale, cardOpacity, iconScale, iconRotate, ringScale, ringOpacity, buttonSlide, buttonOpacity]);

  const animateOut = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
    });
  }, [overlayOpacity, cardScale, cardOpacity]);

  const showConfirm = useCallback((newOptions: ConfirmDialogOptions) => {
    setOptions(newOptions);
    setVisible(true);
    setIsLoading(false);
    // Haptic feedback on show
    const type = newOptions.type || 'info';
    if (type === 'danger') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible, animateIn]);

  const hideConfirm = useCallback(() => {
    animateOut(() => {
      setVisible(false);
      setTimeout(() => {
        setOptions(null);
        setIsLoading(false);
      }, 50);
    });
  }, [animateOut]);

  const handleConfirm = async () => {
    if (!options) return;
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = options.onConfirm();
      // Support async confirmation actions
      if (result instanceof Promise) {
        await result;
      }
      hideConfirm();
    } catch (error) {
      console.error('Error executing dialog confirmation:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (options?.onCancel) {
      options.onCancel();
    }
    hideConfirm();
  };

  // Render the appropriate icon based on dialog type
  const renderIcon = () => {
    const type = options?.type || 'info';
    const size = 30;
    const theme = DIALOG_THEMES[type];

    const iconRotation = iconRotate.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '-8deg', '0deg'],
    });

    const IconComponent = () => {
      switch (type) {
        case 'danger':
          return <SolarTrashBinBold size={size} color={theme.accent} />;
        case 'warning':
          return <SolarShieldWarningBold size={size} color={theme.accent} />;
        case 'success':
          return <SolarCheckCircleBold size={size} color={theme.accent} />;
        case 'info':
        default:
          return <SolarInfoCircleBold size={size} color={theme.accent} />;
      }
    };

    return (
      <View style={styles.iconContainer}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.iconRing,
            {
              backgroundColor: theme.ringColor,
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />
        {/* Icon wrapper */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { backgroundColor: theme.iconBg },
            {
              transform: [
                { scale: iconScale },
                { rotate: iconRotation },
              ],
            },
          ]}
        >
          <IconComponent />
        </Animated.View>
      </View>
    );
  };

  // Get confirm button styles
  const getConfirmTheme = () => {
    return DIALOG_THEMES[options?.type || 'info'];
  };

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirm, hideConfirm }}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={handleCancel}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleCancel}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    transform: [{ scale: cardScale }],
                    opacity: cardOpacity,
                  },
                ]}
              >
                {options && (
                  <>
                    {renderIcon()}

                    <ThemedText style={styles.title} type="title">
                      {options.title}
                    </ThemedText>

                    <ThemedText style={styles.message}>
                      {options.message}
                    </ThemedText>

                    <Animated.View
                      style={[
                        styles.buttonRow,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        {
                          transform: [{ translateY: buttonSlide }],
                          opacity: buttonOpacity,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.cancelButtonText}>
                          {options.cancelLabel || (isRTL ? 'إلغاء' : 'Cancel')}
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.button,
                          styles.confirmButton,
                          { backgroundColor: getConfirmTheme().confirmBg },
                        ]}
                        onPress={handleConfirm}
                        disabled={isLoading}
                        activeOpacity={0.8}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <ThemedText style={styles.confirmButtonText}>
                            {options.confirmLabel || (isRTL ? 'تأكيد' : 'Confirm')}
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  </>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </ConfirmationDialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 15, 30, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Alexandria-Medium',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    fontFamily: 'Alexandria-Medium',
    paddingHorizontal: 4,
  },
  buttonRow: {
    width: '100%',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Alexandria-Medium',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Alexandria-Medium',
  },
});
