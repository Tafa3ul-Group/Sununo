import React from 'react';
import { TouchableOpacity, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FilterInputProps {
  label: string;
  iconName: string;
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
  iconName, 
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
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={normalize.width(22)} 
          color={Colors.primary} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // We use a row for the design [Text | Icon]
    // The image shows Text on the left, Icon on the right.
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5, // slightly thicker for premium feel
    borderColor: Colors.border,
    borderRadius: normalize.radius(20),
    paddingLeft: Spacing.md,
    height: normalize.height(56),
    overflow: 'hidden',
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedContainer: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F4FF', // Light blue tint when selected
  },
  label: {
    flex: 1,
    fontSize: normalize.font(16),
    fontWeight: '500',
    color: Colors.primary, // The text in the image is blue
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border,
  },
  iconContainer: {
    width: normalize.width(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
