import React from 'react';
import { ViewStyle } from 'react-native';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5, 
  FontAwesome6,
  MaterialIcons 
} from '@expo/vector-icons';

export type SolarIconName = string;

interface SolarIconProps {
  name: SolarIconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * SolarIcon - Standard Stable Version
 * Abandoning react-native-iconify due to persistent build/babel issues.
 * This version uses @expo/vector-icons, which is built-in and 100% stable in Expo.
 * We map common Solar icon names to their closest equivalents in standard icon sets.
 */
export const SolarIcon: React.FC<SolarIconProps> = ({
  name,
  size = 24,
  color = 'black',
  style,
}) => {
  // Normalize the name by removing 'solar:' prefix if it exists
  const cleanName = name.replace('solar:', '').toLowerCase();

  // HEURISTIC MAPPING: Maps Solar names to Standard Vector Icon names
  if (cleanName.includes('star')) {
    return <Ionicons name={cleanName.includes('bold') ? "star" : "star-outline"} size={size} color={color} style={style} />;
  }
  if (cleanName.includes('globus') || cleanName.includes('globe')) {
    return <Ionicons name="globe-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('bell')) {
    return <Ionicons name={cleanName.includes('bold') ? "notifications" : "notifications-outline"} size={size} color={color} style={style} />;
  }
  if (cleanName.includes('heart')) {
    return <Ionicons name={cleanName.includes('bold') ? "heart" : "heart-outline"} size={size} color={color} style={style} />;
  }
  if (cleanName.includes('home-smile')) {
    return <MaterialCommunityIcons name="home-heart" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('home')) {
    return <Ionicons name="home-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('notes') || cleanName.includes('calendar')) {
    return <Ionicons name="calendar-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('banknote') || cleanName.includes('wallet')) {
    return <Ionicons name="wallet-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('settings')) {
    return <Ionicons name="settings-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('user')) {
    return <Ionicons name="person-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('wifi')) {
    return <Ionicons name="wifi" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('add')) {
    return <Ionicons name="add-circle-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('trash')) {
    return <Ionicons name="trash-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('eye')) {
    return <Ionicons name={cleanName.includes('closed') ? "eye-off-outline" : "eye-outline"} size={size} color={color} style={style} />;
  }
  if (cleanName.includes('magnifer') || cleanName.includes('search')) {
    return <Ionicons name="search" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('filter')) {
    return <Ionicons name="filter" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('arrow')) {
    const direction = cleanName.includes('right') ? 'forward' : 'back';
    return <Ionicons name={`chevron-${direction}`} size={size} color={color} style={style} />;
  }
  if (cleanName.includes('check')) {
    return <Ionicons name="checkmark-circle-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('sun')) {
    return <Ionicons name="sunny" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('moon')) {
    return <Ionicons name="moon" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('clock')) {
    return <Ionicons name="time-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('water')) {
     return <MaterialCommunityIcons name="water" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('snowflake')) {
     return <Ionicons name="snow" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('car')) {
     return <Ionicons name="car-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('leaf')) {
     return <Ionicons name="leaf-outline" size={size} color={color} style={style} />;
  }
  if (cleanName.includes('tv')) {
     return <Ionicons name="tv-outline" size={size} color={color} style={style} />;
  }

  // Fallback icon if no match found
  return <MaterialIcons name="help-outline" size={size} color={color} style={style} />;
};
