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

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconLabel?: string;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isLoading?: boolean;
}

/**
 * SecondaryButton - Hybrid design for React Native.
 * Scales the original 28x29 Design correctly.
 * Original Aspect Ratio: 0.96:1 (Width: 28, Height: 29)
 * New Height: 46px -> New Width: 46 * (28/29) ≈ 44.4px
 */
export function SecondaryButton({
  label,
  onPress,
  isActive = false,
  icon,
  iconLabel,
  activeColor = "#035DF9",
  inactiveColor = "#E9EBED",
  activeTextColor = "white",
  inactiveTextColor = "#035DF9",
  style,
  textStyle,
  isLoading = false,
}: SecondaryButtonProps) {
  const bgColor = isActive ? activeColor : "transparent";
  const borderColor = isActive ? activeColor : "#E5E7EB";
  const finalContentColor = isActive ? "white" : activeColor;

  // Scale calculations: Original height 29, new height 46. Factor = 1.586
  const scaledWidth = 44.4;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style, isLoading && { opacity: 0.7 }]}
      disabled={isLoading}
    >
      {/* Icon Section (Right part in RTL) */}
      <View style={[styles.iconWrapper, { width: scaledWidth, height: 46 }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="88.5 0 28 29"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <Path
            d="M102.5 0.5H93.1172C90.5673 0.500248 88.5002 2.5673 88.5 5.11719V23.8828C88.5002 26.4327 90.5673 28.4998 93.1172 28.5H102.5C110.232 28.5 116.5 22.232 116.5 14.5C116.5 6.76801 110.232 0.5 102.5 0.5Z"
            fill={bgColor}
            stroke={borderColor}
            strokeWidth="1"
          />
        </Svg>
        {(icon || iconLabel || isLoading) && (
          <View style={styles.iconContainer}>
            {isLoading ? (
              <ActivityIndicator color={finalContentColor} size="small" />
            ) : iconLabel ? (
              <ThemedText
                style={[
                  styles.text,
                  { color: finalContentColor, fontSize: 16 },
                ]}
              >
                {iconLabel}
              </ThemedText>
            ) : icon ? (
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={finalContentColor}
              />
            ) : null}
          </View>
        )}
      </View>

      {/* Label Section (Left part in RTL) */}
      <View
        style={[
          styles.textWrapper,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            height: 46,
            flex: 1, // Allow text to fill space
          },
        ]}
      >
        <ThemedText
          style={[styles.text, { color: finalContentColor }, textStyle]}
        >
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 3, // Proportional padding
  },
  textWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12, // Reduced padding for flexibility
    borderWidth: 1.5, // Thicker border for larger size
    borderRadius: 8.7, // Proportional radius (5.5 * 1.586)
    marginRight: -1,
  },
  text: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 22,
  },
});
