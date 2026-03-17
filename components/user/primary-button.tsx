import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * PrimaryButton - Hybrid design for React Native.
 * Scales the original 91x29 design correctly.
 * Original Aspect Ratio: 3.13:1 (Width: 91, Height: 29)
 * New Height: 46px -> New Width (approx): 144px
 * Scaling factor: 46 / 29 ≈ 1.586
 */
export function PrimaryButton({
  label,
  onPress,
  isActive = true,
  loading = false,
  disabled = false,
  activeColor = "#035DF9",
  inactiveColor = "#E5E7EB",
  activeTextColor = "white",
  inactiveTextColor,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const color = isActive ? activeColor : inactiveColor;
  const determinedInactiveTextColor = inactiveTextColor || activeColor;
  const textColor = isActive ? activeTextColor : determinedInactiveTextColor;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color={activeColor} />
      </View>
    );
  }

  // Original width of the curves was 29. 29 * 1.586 ≈ 46
  const scaledPartWidth = 46;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.hybridContainer, style]}
    >
      {/* Right Curve SVG (Scaled consistently) */}
      <View style={[styles.svgPart, { width: scaledPartWidth, height: 46 }]}>
        <Svg width="100%" height="100%" viewBox="62 0 29 29" fill="none" preserveAspectRatio="xMidYMid meet">
          <Path 
            d="M91 14.5C91 6.49187 84.5081 0 76.5 0H67.1176C64.2912 0 62 2.29125 62 5.11765V23.8824C62 26.7088 64.2912 29 67.1176 29H76.5C84.5081 29 91 22.5081 91 14.5Z" 
            fill={color}
          />
        </Svg>
      </View>

      {/* Flexible Middle Section */}
      <View style={[styles.middleSection, { backgroundColor: color, height: 46 }]}>
        <ThemedText style={[styles.primaryText, { color: textColor }, textStyle]}>
          {label}
        </ThemedText>
      </View>

      {/* Left Curve SVG (Scaled consistently) */}
      <View style={[styles.svgPart, { width: scaledPartWidth, height: 46 }]}>
        <Svg width="100%" height="100%" viewBox="0 0 29 29" fill="none" preserveAspectRatio="xMidYMid meet">
           <Path 
            d="M0 14.5C0 6.49187 6.49187 0 14.5 0H23.8824C26.7088 0 29 2.29125 29 5.11765V23.8824C29 26.7088 26.7088 29 23.8824 29H14.5C6.49187 29 0 22.5081 0 14.5Z" 
            fill={color}
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  hybridContainer: {
    flexDirection: 'row-reverse',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgPart: {
    // Width and Height set dynamically above
  },
  middleSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 10,
  },
  primaryText: {
    fontSize: 18, // Slightly larger font for 46px height
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
  },
});
