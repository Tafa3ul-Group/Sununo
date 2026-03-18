import React from 'react';
import { ViewStyle } from 'react-native';
import { Iconify } from 'react-native-iconify';

export type SolarIconName = string;

interface SolarIconProps {
  name: SolarIconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * SolarIcon - A wrapper around react-native-iconify to provide easy access 
 * to Solar icons with the app's established naming convention.
 * 
 * This uses the 'solar' icon set which is already configured in babel.config.js.
 */
export const SolarIcon: React.FC<SolarIconProps> = ({
  name,
  size = 24,
  color = 'black',
  style,
}) => {
  // Ensure the name has the 'solar:' prefix
  const iconName = name.startsWith('solar:') ? name : `solar:${name}`;

  return (
    <Iconify 
      icon={iconName} 
      size={size} 
      color={color} 
      style={style} 
    />
  );
};
