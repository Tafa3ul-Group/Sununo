import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SOLAR_REGISTRY } from './solar-icons-list';

export type SolarIconName = string;

interface SolarIconProps {
  name: SolarIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * SolarIcon - Dynamic Component Version
 * 
 * Works in two modes:
 * 1. REGISTRY: Uses real SVG components from SOLAR_REGISTRY (e.g. pasted from Iconify snippets).
 * 2. HEURISTIC: Falls back to @expo/vector-icons mapping for unmapped names.
 */
export const SolarIcon: React.FC<SolarIconProps> = ({
  name,
  size = 24,
  color = 'black',
  style,
}) => {
  // Safety check for name
  if (!name || typeof name !== 'string') {
    return <MaterialIcons name="help-outline" size={size} color={color} style={style as any} />;
  }

  // Normalize name (remove 'solar:' prefix)
  const iconBaseName = name.replace('solar:', '');
  const SpecificIcon = SOLAR_REGISTRY[iconBaseName];

  // 1. Check Registry first (HIGH FIDELITY SVG COMPONENTS)
  if (SpecificIcon) {
    return <SpecificIcon size={size} color={color} style={style} />;
  }

  // 2. Fallback to Heuristic mapping (STABLE VECTOR ICONS)
  return <HeuristicSolarIcon name={name} size={size} color={color} style={style} />;
};

/**
 * Heuristic mapping for standard vector icons when the SVG component isn't in the list yet.
 */
const HeuristicSolarIcon: React.FC<SolarIconProps> = ({
  name,
  size = 24,
  color = 'black',
  style,
}) => {
  const cleanName = name.replace('solar:', '').toLowerCase();
  const isBold = cleanName.includes('bold') || cleanName.includes('duotone');

  // HEURISTIC MAPPING: Maps Solar names to Standard Vector Icon names
  if (cleanName.includes('star')) {
    return <Ionicons name={isBold ? "star" : "star-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('map-point') || cleanName.includes('location')) {
    return <Ionicons name={isBold ? "location" : "location-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('globus') || cleanName.includes('globe')) {
    return <Ionicons name="globe-outline" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('bell')) {
    return <Ionicons name={isBold ? "notifications" : "notifications-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('heart')) {
    return <Ionicons name={isBold ? "heart" : "heart-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('home-smile')) {
    return <MaterialCommunityIcons name="home-heart" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('home')) {
    return <Ionicons name={isBold ? "home" : "home-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('notes') || cleanName.includes('calendar') || cleanName.includes('document')) {
    return <Ionicons name={isBold ? "calendar" : "calendar-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('banknote') || cleanName.includes('wallet') || cleanName.includes('cash')) {
    return <Ionicons name={isBold ? "wallet" : "wallet-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('settings') || cleanName.includes('tuning')) {
    return <Ionicons name={isBold ? "settings" : "settings-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('user') || cleanName.includes('person')) {
    if (cleanName.includes('group') || cleanName.includes('users') || cleanName.includes('people')) {
      return <Ionicons name={isBold ? "people" : "people-outline"} size={size} color={color} style={style as any} />;
    }
    if (cleanName.includes('circle')) {
      return <Ionicons name={isBold ? "person-circle" : "person-circle-outline"} size={size} color={color} style={style as any} />;
    }
    return <Ionicons name={isBold ? "person" : "person-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('wifi')) {
    return <Ionicons name="wifi" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('add')) {
    return <Ionicons name={isBold ? "add-circle" : "add-circle-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('trash')) {
    return <Ionicons name={isBold ? "trash" : "trash-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('eye')) {
    const isClosed = cleanName.includes('closed') || cleanName.includes('off') || cleanName.includes('hide');
    return <Ionicons name={isClosed ? (isBold ? "eye-off" : "eye-off-outline") : (isBold ? "eye" : "eye-outline")} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('magnifer') || cleanName.includes('search')) {
    return <Ionicons name="search" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('filter')) {
    return <Ionicons name="filter" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('arrow')) {
    const direction = cleanName.includes('right') ? 'forward' : cleanName.includes('left') ? 'back' : cleanName.includes('up') ? 'up' : 'down';
    const isAlt = cleanName.includes('alt') || cleanName.includes('chevron');
    return <Ionicons name={`${isAlt ? 'chevron' : 'arrow'}-${direction}`} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('check')) {
    return <Ionicons name={isBold ? "checkmark-circle" : "checkmark-circle-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('sun')) {
    return <Ionicons name={isBold ? "sunny" : "sunny-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('moon')) {
    return <Ionicons name={isBold ? "moon" : "moon-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('clock') || cleanName.includes('time')) {
    return <Ionicons name={isBold ? "time" : "time-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('water')) {
    return <MaterialCommunityIcons name="water" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('snowflake')) {
    return <Ionicons name="snow" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('car')) {
    return <Ionicons name={isBold ? "car" : "car-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('leaf')) {
    return <Ionicons name={isBold ? "leaf" : "leaf-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('tv')) {
    return <Ionicons name={isBold ? "tv" : "tv-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('logout') || cleanName.includes('exit')) {
    return <Ionicons name="log-out-outline" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('login') || cleanName.includes('enter')) {
    return <Ionicons name="log-in-outline" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('info')) {
    return <Ionicons name={isBold ? "information-circle" : "information-circle-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('danger') || cleanName.includes('alert')) {
    return <Ionicons name={isBold ? "alert-circle" : "alert-circle-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('question') || cleanName.includes('help')) {
    return <Ionicons name={isBold ? "help-circle" : "help-circle-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('pen') || cleanName.includes('edit')) {
    return <Ionicons name={isBold ? "create" : "create-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('copy')) {
    return <Ionicons name={isBold ? "copy" : "copy-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('share')) {
    return <Ionicons name={isBold ? "share-social" : "share-social-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('menu')) {
    return <Ionicons name="menu" size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('close') || cleanName.includes('xmark')) {
    return <Ionicons name={isBold ? "close-circle" : "close-circle-outline"} size={size} color={color} style={style as any} />;
  }
  if (cleanName.includes('refresh') || cleanName.includes('loop')) {
    return <Ionicons name="refresh" size={size} color={color} style={style as any} />;
  }

  // Fallback icon if no match found
  return <MaterialIcons name="help-outline" size={size} color={color} style={style as any} />;
};



