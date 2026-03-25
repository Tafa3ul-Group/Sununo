import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  isActive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * AppButton - Hybrid design for React Native.
 * Primary: Uses a three-part SVG system (Right Curve - Flexible Middle - Left Curve).
 * Secondary: Rounded border design with a divider and an icon.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  isActive = true,
  loading = false,
  disabled = false,
  icon,
  activeColor = "#035DF9",
  inactiveColor = "#E5E7EB",
  activeTextColor = "white",
  inactiveTextColor,
  style,
  textStyle,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const color = isActive ? activeColor : inactiveColor;
  const determinedInactiveTextColor = inactiveTextColor || activeColor;
  const textColor = isActive ? activeTextColor : determinedInactiveTextColor;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  // Primary Variant: Hybrid SVG Design
  if (isPrimary) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled}
        style={[styles.hybridContainer, style]}
      >
        {/* Right Curve SVG (ViewBox matches the right part of the original SVG) */}
        <View style={[styles.svgPart, { height: '100%', width: undefined, aspectRatio: 1 }]}>
          <Svg width="100%" height="100%" viewBox="62 0 29 29" fill="none">
            <Path
              d="M91 14.5C91 6.49187 84.5081 0 76.5 0H67.1176C64.2912 0 62 2.29125 62 5.11765V23.8824C62 26.7088 64.2912 29 67.1176 29H76.5C84.5081 29 91 22.5081 91 14.5Z"
              fill={color}
            />
          </Svg>
        </View>

        {/* Flexible Middle Section */}
        <View style={[styles.middleSection, { backgroundColor: color }]}>
          <View style={[styles.contentRow, { flexDirection: 'row' }]}>
            {icon && (
              <MaterialCommunityIcons 
                name={icon as any} 
                size={18} 
                color={textColor} 
                style={{ marginRight: 6 }} 
              />
            )}
            <ThemedText style={[styles.primaryText, { color: textColor }, textStyle]}>
              {label}
            </ThemedText>
          </View>
        </View>

        {/* Left Curve SVG (ViewBox matches the left part of the original SVG) */}
        <View style={[styles.svgPart, { height: '100%', width: undefined, aspectRatio: 1 }]}>
          <Svg width="100%" height="100%" viewBox="0 0 29 29" fill="none">
            <Path
              d="M0 14.5C0 6.49187 6.49187 0 14.5 0H23.8824C26.7088 0 29 2.29125 29 5.11765V23.8824C29 26.7088 26.7088 29 23.8824 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
              fill={color}
            />
          </Svg>
        </View>
      </TouchableOpacity>
    );
  }

  // Secondary Variant: Rounded with Divider and Icon
  const secondaryActiveColor = "#0066FF";
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.secondaryContainer,
        { borderColor: isActive ? secondaryActiveColor : '#E5E7EB' },
        isActive && styles.secondaryActiveShadow,
        style
      ]}
    >
      {/* Icon Section */}
      {icon && (
        <View style={[styles.iconPart, { backgroundColor: isActive ? 'rgba(0,102,255,0.05)' : 'transparent' }]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={isActive ? secondaryActiveColor : '#9CA3AF'}
          />
        </View>
      )}

      {/* Vertical Divider */}
      <View style={[styles.divider, { backgroundColor: isActive ? 'rgba(0,102,255,0.2)' : '#E5E7EB' }]} />

      {/* Label Section */}
      <View style={styles.labelPart}>
        <ThemedText style={[
          styles.secondaryText,
          { color: isActive ? secondaryActiveColor : '#4B5563' }
        ]}>
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  hybridContainer: {
    flexDirection: 'row-reverse',
    height: 32, // Default height
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgPart: {
    width: 29,
    height: 29,
  },
  middleSection: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    minWidth: 10,
  },
  contentRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryContainer: {
    flexDirection: 'row-reverse',
    height: 42,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  secondaryActiveShadow: {
    // Shadows removed per user request
  },
  iconPart: {
    height: '100%',
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '60%',
  },
  labelPart: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
