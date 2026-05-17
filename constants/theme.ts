import { I18nManager, Platform } from "react-native";
import { moderateScale, scale, verticalScale } from "react-native-size-matters";

export const isRTL = I18nManager.isRTL;

/**
 * Normalization utilities to ensure consistent UI across different screen sizes and platforms.
 */
const scaleFunction = (size: number) => scale(size);

export const normalize = Object.assign(scaleFunction, {
  width: (size: number) => scale(size),
  height: (size: number) => verticalScale(size),
  font: (size: number, factor: number = 0.5) => moderateScale(size, factor),
  radius: (size: number, factor: number = 0.5) => moderateScale(size, factor),
});

const BrandColors = {
  blue: "#2B66FF",
  green: "#22C55E",
  orange: "#F97316",
  white: "#FFFFFF",
  black: "#111827",
};

export const Colors = {
  light: {
    text: "#111827",
    background: "#FFFFFF",
    tint: BrandColors.blue,
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: BrandColors.blue,
    primary: BrandColors.blue,
    secondary: BrandColors.green,
    accent: BrandColors.orange,
    surface: "#F9FAFB",
    border: "#E5E7EB",
    muted: "#9CA3AF",
  },
  dark: {
    text: "#F9FAFB",
    background: "#111827",
    tint: "#FFFFFF",
    icon: "#9CA3AF",
    tabIconDefault: "#4B5563",
    tabIconSelected: "#FFFFFF",
    primary: BrandColors.blue,
    secondary: BrandColors.green,
    accent: BrandColors.orange,
    surface: "#1F2937",
    border: "#374151",
    muted: "#6B7280",
  },
  // Shared
  primary: BrandColors.blue,
  secondary: BrandColors.green,
  accent: BrandColors.orange,
  background: "#FFFFFF",
  surface: "#F9FAFB",
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    onPrimary: "#FFFFFF",
  },
  status: {
    star: "#FFB000",
    heart: BrandColors.blue,
    heartActive: BrandColors.blue,
  },
  border: "#E5E7EB",
  white: "#FFFFFF",
  black: "#000000",
  error: BrandColors.orange, // Replaced Red with Orange
};

export const Spacing = {
  xs: normalize.width(4),
  sm: normalize.width(8),
  md: normalize.width(16),
  lg: normalize.width(24),
  xl: normalize.width(32),
};

type FontWeight = "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";

interface TypeStyle {
  fontSize: number;
  fontFamily?: string;
  color: string;
  lineHeight?: number;
}

export const Typography: Record<string, TypeStyle> = {
  h1: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.text,
    lineHeight: normalize.font(24),
  },
  h2: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.text,
    lineHeight: normalize.font(24),
  },
  body: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.text,
    lineHeight: normalize.font(16),
  },
  subtitle: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.icon,
    lineHeight: normalize.font(16),
  },
  caption: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.icon,
    lineHeight: normalize.font(14),
  },
  price: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.primary,
    lineHeight: normalize.font(24),
  },
  rating: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.text,
    lineHeight: normalize.font(16),
  },
  title: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.text,
    lineHeight: normalize.font(24),
  },
  description: {
    fontSize: normalize.font(10),
    fontFamily: "Alexandria-Medium",
    color: Colors.light.text,
    lineHeight: normalize.font(16),
  },
};

export const Shadows = {
  small: Platform.select({
    web: { boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  medium: Platform.select({
    web: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
  }),
  large: Platform.select({
    web: { boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 10,
    },
  }),
};

export const Fonts = {
  bold: "Alexandria-Medium" as const,
  regular: "Alexandria-Medium" as const,
  medium: "Alexandria-Medium" as const,
  semiBold: "Alexandria-Medium" as const,
  black: "Alexandria-Medium" as const,
};
