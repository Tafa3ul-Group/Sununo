import { Platform } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

/**
 * Normalization utilities to ensure consistent UI across different screen sizes and platforms.
 */
export const normalize = {
  width: (size: number) => scale(size),
  height: (size: number) => verticalScale(size),
  font: (size: number, factor?: number) => moderateScale(size, factor),
  radius: (size: number, factor?: number) => moderateScale(size, factor),
};

const tintColorLight = '#2B66FF';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#717171',
    tabIconDefault: '#717171',
    tabIconSelected: tintColorLight,
    primary: '#2B66FF',
    secondary: '#F0F2F5',
    surface: '#F8F9FB',
    border: '#EBEBEB',
    muted: '#9CA3AF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#2B66FF',
    secondary: '#2A2A2A',
    surface: '#222222',
    border: '#333333',
    muted: '#6B7280',
  },
  // Shared/Legacy support for the new design components
  primary: '#2B66FF',
  secondary: '#F0F2F5',
  background: '#FFFFFF',
  surface: '#F8F9FB',
  text: {
    primary: '#1A1A1A',
    secondary: '#717171',
    muted: '#9CA3AF',
    onPrimary: '#FFFFFF',
  },
  accent: {
    star: '#FFB800',
    heart: '#FFFFFF',
    heartActive: '#FF385C',
  },
  border: '#EBEBEB',
  shadow: '#000000',
};

export const Spacing = {
  xs: normalize.width(4),
  sm: normalize.width(8),
  md: normalize.width(16),
  lg: normalize.width(24),
  xl: normalize.width(32),
};

// Use explicit literal types for fontWeight to satisfy TypeScript
type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

interface TypeStyle {
  fontSize: number;
  fontWeight: FontWeight;
  color: string;
}

export const Typography: Record<string, TypeStyle> = {
  h1: {
    fontSize: normalize.font(28),
    fontWeight: '700' as FontWeight,
    color: Colors.light.text, // Defaulting to light text
  },
  h2: {
    fontSize: normalize.font(20),
    fontWeight: '600' as FontWeight,
    color: Colors.light.text,
  },
  body: {
    fontSize: normalize.font(14),
    fontWeight: '400' as FontWeight,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: normalize.font(13),
    fontWeight: '400' as FontWeight,
    color: Colors.light.icon,
  },
  caption: {
    fontSize: normalize.font(12),
    fontWeight: '500' as FontWeight,
    color: Colors.light.icon,
  },
  price: {
    fontSize: normalize.font(18),
    fontWeight: '700' as FontWeight,
    color: Colors.light.primary,
  },
  rating: {
    fontSize: normalize.font(14),
    fontWeight: '600' as FontWeight,
    color: Colors.light.text,
  },
};

export const Shadows = {
  light: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
