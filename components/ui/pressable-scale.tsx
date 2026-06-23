import React from "react";
import {
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PressableScaleProps extends TouchableOpacityProps {
  /** Target scale while pressed. Subtle by design (0.94–0.98). */
  scaleTo?: number;
}

/**
 * A pressable that scales down on press and springs back on release — the same
 * "feels alive" recipe used across the app (HorizontalCard, primary/secondary
 * buttons) so every tappable surface responds with one cohesive motion:
 *   press  → fast ease-out shrink (90ms)
 *   release→ spring back (no fixed duration, settles naturally)
 *
 * Press feedback is the one animation worth adding everywhere: it confirms the
 * UI heard the tap. Keep the scale subtle — the user should feel it, not watch it.
 */
export function PressableScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withTiming(scaleTo, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 180 });
        onPressOut?.(e);
      }}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedTouchable>
  );
}
