import { ThemedText } from "@/components/themed-text";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
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
}

/**
 * PrimaryButton - Hybrid design for React Native.
 * Scales the original 91x29 design correctly.
 */
export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  isActive = true,
  loading = false,
  disabled = false,
  activeColor,
  inactiveColor = "#ffffffff",
  activeTextColor,
  inactiveTextColor,
  border = "#E5E7EB",
  style,
  textStyle,
}: PrimaryButtonProps) {
  const isWhite = variant === "white";
  const defaultActiveColor = isWhite ? "white" : "#035DF9";
  const defaultActiveTextColor = isWhite ? "#6B7280" : "white";

  const color = isActive ? activeColor || defaultActiveColor : inactiveColor;
  const determinedInactiveTextColor =
    inactiveTextColor || activeColor || defaultActiveColor;
  const textColor = isActive
    ? activeTextColor || defaultActiveTextColor
    : determinedInactiveTextColor;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color={activeColor} />
      </View>
    );
  }

  const scaledPartHeight = 46;
  const scaledPartWidth = (29 / 29) * scaledPartHeight; // Maintain aspect ratio of the 29x29 design

  const currentBorderColor = isActive ? "transparent" : border;
  const currentBorderWidth = isActive ? 0 : 1;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.hybridContainer, style]}
    >
      {/* Right Curve SVG */}
      <View style={{ width: scaledPartWidth, height: scaledPartHeight }}>
        <Svg
          width="100%"
          height="100%"
          viewBox="62 0 29 29"
          fill="none"
        >
          <Path
            d="M91 14.5C91 6.49187 84.5081 0 76.5 0H67.1176C64.2912 0 62 2.29125 62 5.11765V23.8824C62 26.7088 64.2912 29 67.1176 29H76.5C84.5081 29 91 22.5081 91 14.5Z"
            fill={color}
            stroke={currentBorderColor}
          />
        </Svg>
      </View>

      {/* Flexible Middle Section */}
      <View
        style={[
          styles.middleSection,
          {
            borderColor: currentBorderColor,
            borderWidth: currentBorderWidth,
            backgroundColor: color,
            height: scaledPartHeight,
            flex: 1,
            marginHorizontal: -2, // Slight overlap to fix pixel gaps
          },
        ]}
      >
        <View style={styles.textWithIcon}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={textColor}
              style={{ marginLeft: 8 }}
            />
          )}
          <ThemedText
            style={[styles.primaryText, { color: textColor }, textStyle]}
          >
            {label}
          </ThemedText>
        </View>
      </View>

      {/* Left Curve SVG */}
      <View style={{ width: scaledPartWidth, height: scaledPartHeight }}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 29 29"
          fill="none"
        >
          <Path
            d="M0 14.5C0 6.49187 6.49187 0 14.5 0H23.8824C26.7088 0 29 2.29125 29 5.11765V23.8824C29 26.7088 26.7088 29 23.8824 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
            fill={color}
            stroke={currentBorderColor}
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 46,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  hybridContainer: {
    flexDirection: "row-reverse",
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  svgPart: {},
  middleSection: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  textWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
