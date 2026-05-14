import { ThemedText } from "@/components/themed-text";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "white";
  isActive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  border?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  height?: number;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  isActive = true,
  loading = false,
  disabled = false,
  activeColor,
  inactiveColor = "#ffffff",
  activeTextColor,
  inactiveTextColor,
  border = "#E5E7EB",
  style,
  textStyle,
  height = 52,
}: PrimaryButtonProps) {
  const isWhite = variant === "white";
  const defaultActiveColor = isWhite ? "white" : "#035DF9";
  const defaultActiveTextColor = isWhite ? "#6B7280" : "white";

  const bgColor = isActive ? (activeColor || defaultActiveColor) : inactiveColor;
  const determinedInactiveTextColor = inactiveTextColor || activeColor || defaultActiveColor;
  const textColor = isActive
    ? (activeTextColor || defaultActiveTextColor)
    : determinedInactiveTextColor;

  const borderColor = isActive ? "transparent" : border;
  const borderWidth = isActive ? 0 : 1;

  if (loading) {
    return (
      <View
        style={[
          styles.btn,
          { height, backgroundColor: bgColor, borderRadius: height / 2 },
          style,
        ]}
      >
        <ActivityIndicator color={activeTextColor || defaultActiveTextColor} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        {
          height,
          backgroundColor: bgColor,
          borderRadius: height / 2,
          borderColor,
          borderWidth,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <ThemedText style={[styles.label, { color: textColor }, textStyle]}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontFamily: "Alexandria-Bold",
    textAlign: "center",
    includeFontPadding: false,
  },
});
