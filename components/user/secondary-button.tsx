import { ThemedText } from "@/components/themed-text";
import React from "react";
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useDirection } from "@/i18n";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  icon?: React.ReactNode;
  iconLabel?: string;
  iconPosition?: "left" | "right";
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  isLoading?: boolean;
  height?: number;
  variant?: "default" | "inverse" | "outline"; // Added to let you choose the logic
}

export function SecondaryButton({
  label,
  onPress,
  isActive = false,
  icon,
  iconLabel,
  iconPosition,
  activeColor = "#035DF9",
  inactiveColor = "#E9EBED",
  activeTextColor = "white",
  inactiveTextColor = "#035DF9",
  style,
  textStyle,
  isLoading = false,
  height = 46,
  variant = "default" }: SecondaryButtonProps) {
  const { isRTL } = useDirection();

  // Use logical start/end concept to let React Native automatically handle RTL layout
  const isIconOnStart =
    iconPosition
      ? (isRTL ? iconPosition === "right" : iconPosition === "left")
      : (variant === "default");

  const bgColor = isActive ? activeColor : "white";
  const borderColor = isActive ? activeColor : "#E5E7EB";
  const finalContentColor = isActive ? activeTextColor : inactiveTextColor;

  const scaledWidth = 44.4;

  const flattenedStyle = StyleSheet.flatten(style);
  const isFlex = flattenedStyle?.flex === 1 || flattenedStyle?.flexGrow === 1;

  // Press feedback: subtle shrink on press-in, spring back on release. Same
  // recipe as the cards so every tappable surface feels consistent.
  const scale = useSharedValue(1);

  // State-indication pop: when this chip *becomes* active (user selected it),
  // a quick spring pop confirms the change. Skipped on first mount so the
  // default-active chip ("All") doesn't pop on every screen render.
  const activePop = useSharedValue(1);
  const didMount = React.useRef(false);
  React.useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (isActive) {
      activePop.value = withSequence(
        withTiming(1.06, {
          duration: 120,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
        }),
        withSpring(1, { damping: 10, stiffness: 220 }),
      );
    }
  }, [isActive, activePop]);

  const pressAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * activePop.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 180 });
      }}
      style={[
        styles.container,
        {
          flexDirection: isIconOnStart ? "row" : "row-reverse",
          gap: -1.5 },
        style,
        isLoading && { opacity: 0.7 },
        pressAnim,
      ]}
      disabled={isLoading}
    >
      {/* Icon Section */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: scaledWidth,
            height: height,
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 1.5,
            borderTopStartRadius: isIconOnStart ? height / 2 : 8,
            borderBottomStartRadius: isIconOnStart ? height / 2 : 8,
            borderTopEndRadius: isIconOnStart ? 8 : height / 2,
            borderBottomEndRadius: isIconOnStart ? 8 : height / 2,
            justifyContent: "center",
            alignItems: "center" },
        ]}
      >
        {!!(icon || iconLabel || isLoading) && (
          <View style={styles.iconContainerInternal}>
            {isLoading ? (
              <ActivityIndicator color={finalContentColor} size="small" />
            ) : iconLabel ? (
              <ThemedText
                style={[
                  styles.text,
                  { color: finalContentColor, fontSize: 14 },
                ]}
              >
                {iconLabel}
              </ThemedText>
            ) : icon ? (
              typeof icon === "string" ? (
                <ThemedText
                  style={[
                    styles.text,
                    { color: finalContentColor, fontSize: 8 },
                  ]}
                >
                  {icon}
                </ThemedText>
              ) : (
                icon
              )
            ) : null}
          </View>
        )}
      </View>

      {/* Label Section */}
      <View
        style={[
          styles.textWrapper,
          {
            flex: isFlex ? 1 : undefined,
            backgroundColor: bgColor,
            borderColor: borderColor,
            height: height,
            paddingHorizontal: 20,
            borderTopStartRadius: isIconOnStart ? 8 : 10,
            borderBottomStartRadius: isIconOnStart ? 8 : 10,
            borderTopEndRadius: isIconOnStart ? 10 : 8,
            borderBottomEndRadius: isIconOnStart ? 10 : 8,
            borderWidth: 1.5 },
        ]}
      >
        <ThemedText
          style={[
            styles.text,
            { color: finalContentColor, fontSize: 14 },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center" },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center" },
  iconContainerInternal: {
    justifyContent: "center",
    alignItems: "center" },
  textWrapper: {
    justifyContent: "center",
    alignItems: "center" },
  text: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    textAlign: "center",
    lineHeight: 28 } });
