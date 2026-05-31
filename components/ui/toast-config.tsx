import {
  SolarCheckCircleBold,
  SolarCloseCircleBold,
  SolarInfoCircleBold,
  SolarShieldWarningBold,
} from '@/components/icons/solar-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  I18nManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = Math.min(SCREEN_WIDTH - 32, 450);

const isRTL = I18nManager.isRTL;

interface CustomToastProps extends BaseToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
}

// ── Theme palettes ──────────────────────────────────────────────────────────
const TOAST_THEMES = {
  success: {
    accent: '#22C55E',          // BrandColors.green
    bgColor: '#F0FDF4',
    iconBg: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
    titleColor: '#15803D',
    messageColor: '#166534',
  },
  error: {
    accent: '#F97316',          // BrandColors.orange (= Colors.error)
    bgColor: '#FFF7ED',
    iconBg: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
    titleColor: '#C2410C',
    messageColor: '#9A3412',
  },
  warning: {
    accent: '#F59E0B',
    bgColor: '#FFFBEB',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    titleColor: '#B45309',
    messageColor: '#92400E',
  },
  info: {
    accent: '#2B66FF',          // BrandColors.blue (= Colors.primary)
    bgColor: '#EEF2FF',
    iconBg: 'rgba(43, 102, 255, 0.15)',
    borderColor: 'rgba(43, 102, 255, 0.25)',
    titleColor: '#1D4ED8',
    messageColor: '#1E40AF',
  },
};

const ICONS = {
  success: (color: string) => <SolarCheckCircleBold size={22} color={color} />,
  error: (color: string) => <SolarCloseCircleBold size={22} color={color} />,
  warning: (color: string) => <SolarShieldWarningBold size={22} color={color} />,
  info: (color: string) => <SolarInfoCircleBold size={22} color={color} />,
};

// ── Component ───────────────────────────────────────────────────────────────
const CustomToast = ({ type, text1, text2, onPress, hide }: CustomToastProps) => {
  const theme = TOAST_THEMES[type];
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Haptic feedback
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (e) {
      console.warn('[Toast] Haptics error:', e);
    }

    // Icon entrance animation (scale from small to normal with bounce)
    Animated.spring(pulseAnim, {
      toValue: 1,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();

    // Accent bar subtle shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Progress bar countdown (4 seconds default toast visibility)
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 4000,
      useNativeDriver: false,
    }).start();
  }, [type]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });

  return (
    <View style={styles.outerWrapper}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress || hide}
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.bgColor,
            borderColor: theme.borderColor,
            shadowColor: theme.accent,
          },
        ]}
      >
        {/* Accent strip on the side */}
        <Animated.View
          style={[
            styles.accentStrip,
            {
              backgroundColor: theme.accent,
              opacity: shimmerOpacity,
              [isRTL ? 'right' : 'left']: 0,
            },
          ]}
        />

        <View
          style={[
            styles.contentRow,
            { flexDirection: isRTL ? 'row' : 'row-reverse' },
          ]}
        >
          {/* Icon with rounded badge */}
          <Animated.View
            style={[
              styles.iconBadge,
              {
                backgroundColor: theme.iconBg,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {ICONS[type](theme.accent)}
          </Animated.View>

          {/* Text content */}
          <View
            style={[
              styles.textContainer,
              {
                alignItems: isRTL ? 'flex-start' : 'flex-end',
                [isRTL ? 'marginLeft' : 'marginRight']: 14,
              },
            ]}
          >
            {text1 ? (
              <Text
                style={[
                  styles.title,
                  {
                    textAlign: isRTL ? 'right' : 'left',
                    color: theme.titleColor,
                  },
                ]}
                numberOfLines={2}
              >
                {text1}
              </Text>
            ) : null}
            {text2 ? (
              <Text
                style={[
                  styles.message,
                  {
                    textAlign: isRTL ? 'left' : 'right',
                    color: theme.messageColor,
                  },
                ]}
                numberOfLines={3}
              >
                {text2}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Progress bar at the bottom */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.accent,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ── Exported config ─────────────────────────────────────────────────────────
export const toastConfig = {
  success: (props: any) => <CustomToast {...props} type="success" />,
  error: (props: any) => <CustomToast {...props} type="error" />,
  warning: (props: any) => <CustomToast {...props} type="warning" />,
  info: (props: any) => <CustomToast {...props} type="info" />,
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrapper: {
    width: TOAST_WIDTH,
    alignSelf: 'center',
  },
  toastCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    // Shadow — the color is set inline per-type
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  accentStrip: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 4,
  },
  contentRow: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  title: {
    fontFamily: 'Alexandria-Medium',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  message: {
    fontFamily: 'Alexandria-Medium',
    fontSize: 12.5,
    lineHeight: 18,
    opacity: 0.8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
