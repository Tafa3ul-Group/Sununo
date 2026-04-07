import { ThemedText } from "@/components/themed-text";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconLabel?: string;
  iconPosition?: 'left' | 'right';
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isLoading?: boolean;
}

export function SecondaryButton({
  label,
  onPress,
  isActive = false,
  icon,
  iconLabel,
  iconPosition,
  activeColor = "#035DF9",
  inactiveColor = "#E9EBED",
  activeTextColor = "white",
  inactiveTextColor = "#035DF9",
  style,
  textStyle,
  isLoading = false,
}: SecondaryButtonProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Use provided iconPosition or default to RTL-aware default
  const finalIconPosition = iconPosition || (isRTL ? 'right' : 'left');

  const bgColor = isActive ? activeColor : "transparent";
  const borderColor = isActive ? activeColor : "#E5E7EB";
  const finalContentColor = isActive ? "white" : activeColor;

  const scaledWidth = 44.4;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container, 
        { flexDirection: finalIconPosition === 'right' ? 'row-reverse' : 'row' },
        style, 
        isLoading && { opacity: 0.7 }
      ]}
      disabled={isLoading}
    >
      {/* Icon Section */}
      <View style={[styles.iconWrapper, { width: scaledWidth, height: 46 }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="88.5 0 28 29"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          style={{ transform: [{ scaleX: finalIconPosition === 'right' ? 1 : -1 }] }}
        >
          <Path
            d="M102.5 0.5H93.1172C90.5673 0.500248 88.5002 2.5673 88.5 5.11719V23.8828C88.5002 26.4327 90.5673 28.4998 93.1172 28.5H102.5C110.232 28.5 116.5 22.232 116.5 14.5C116.5 6.76801 110.232 0.5 102.5 0.5Z"
            fill={bgColor}
            stroke={borderColor}
            strokeWidth="1"
          />
        </Svg>
        {(icon || iconLabel || isLoading) && (
          <View style={styles.iconContainer}>
            {isLoading ? (
              <ActivityIndicator color={finalContentColor} size="small" />
            ) : iconLabel ? (
              <ThemedText
                style={[
                  styles.text,
                  { color: finalContentColor, fontSize: 16 },
                ]}
              >
                {iconLabel}
              </ThemedText>
            ) : icon ? (
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={finalContentColor}
              />
            ) : null}
          </View>
        )}
      </View>

      {/* Label Section */}
      <View
        style={[
          styles.textWrapper,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            height: 46,
            flex: 1,
            // Match the SVG curves orientation
            borderTopLeftRadius: finalIconPosition === 'right' ? 8.7 : 0,
            borderBottomLeftRadius: finalIconPosition === 'right' ? 8.7 : 0,
            borderTopRightRadius: finalIconPosition === 'left' ? 8.7 : 0,
            borderBottomRightRadius: finalIconPosition === 'left' ? 8.7 : 0,
            marginLeft: finalIconPosition === 'left' ? -1 : 0,
            marginRight: finalIconPosition === 'right' ? -1 : 0,
          },
        ]}
      >
        <ThemedText
          style={[styles.text, { color: finalContentColor }, textStyle]}
        >
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  textWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  text: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 22,
  },
});
