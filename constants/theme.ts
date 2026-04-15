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
  fontWeight: FontWeight;
  color: string;
}

export const Typography: Record<string, TypeStyle> = {
  h1: {
    fontSize: normalize.font(28),
    fontFamily: "LamaSans-Bold",
    color: Colors.light.text,
  },
  h2: {
    fontSize: normalize.font(20),
    fontFamily: "LamaSans-SemiBold",
    color: Colors.light.text,
  },
  body: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Regular",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: normalize.font(13),
    fontFamily: "LamaSans-Regular",
    color: Colors.light.icon,
  },
  caption: {
    fontSize: normalize.font(12),
    fontFamily: "LamaSans-Medium",
    color: Colors.light.icon,
  },
  price: {
    fontSize: normalize.font(18),
    fontFamily: "LamaSans-Bold",
    color: Colors.light.primary,
  },
  rating: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-SemiBold",
    color: Colors.light.text,
  },
};

export const Shadows = {
  small: Platform.select({
    web: { boxShadow: "none" },
    default: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }),
  medium: Platform.select({
    web: { boxShadow: "none" },
    default: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }),
};

export const Fonts = {
  bold: "LamaSans-Bold" as const,
  regular: "LamaSans-Regular" as const,
  medium: "LamaSans-Medium" as const,
  semiBold: "LamaSans-SemiBold" as const,
  black: "LamaSans-Black" as const,
};
