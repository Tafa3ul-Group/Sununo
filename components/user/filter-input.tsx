import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Spacing } from '@/constants/theme';
import React from 'react';
import { I18nManager, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { isRTL } from "@/i18n";

interface FilterInputProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

/**
 * FilterInput - A custom selectable input/chip component.
 * Features a label, a vertical divider, and an icon.
 * Design matches the "يحتوي مسبح" image provided.
 */
export function FilterInput({
  label,
  icon,
  selected = false,
  onPress,
  style,
  labelStyle
}: FilterInputProps) {

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        { flexDirection: 'row' },
        selected && styles.selectedContainer,
        style
      ]}
    >
      <ThemedText
        style={[
          styles.label,
          selected && styles.selectedText,
          labelStyle
        ]}
      >
        {label}
      </ThemedText>

      <View style={styles.divider} />

      <View style={styles.iconContainer}>
        {icon}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5, // slightly thicker for premium feel
    borderColor: Colors.border,
    borderRadius: normalize.radius(20),
    paddingStart: Spacing.md,
    height: normalize.height(56),
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2 },
  selectedContainer: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F4FF', // Light blue tint when selected
  },
  label: {
    flex: 1,
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary, // The text in the image is blue
    textAlign: 'center' },
  selectedText: {
    fontFamily: "Alexandria-Medium" },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border },
  iconContainer: {
    width: normalize.width(50),
    alignItems: 'center',
    justifyContent: 'center' } });
