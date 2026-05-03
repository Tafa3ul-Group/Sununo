import { ThemedText } from "@/components/themed-text";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  icon?: React.ReactNode;
  iconLabel?: string;
  iconPosition?: "left" | "right";
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isLoading?: boolean;
  height?: number;
  variant?: "default" | "inverse"; // Added to let you choose the logic
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
  height = 46,
  variant = "default",
}: SecondaryButtonProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Use EXACT original logic based on variant
  const finalIconPosition =
    iconPosition ||
    (variant === "default"
      ? isRTL
        ? "right"
        : "left"
      : isRTL
        ? "left"
        : "right");

  const bgColor = isActive ? activeColor : "white";
  const borderColor = isActive ? activeColor : "#E5E7EB";
  const finalContentColor = isActive ? activeTextColor : inactiveTextColor;

  const scaledWidth = 44.4;

  const flattenedStyle = StyleSheet.flatten(style);
  const isFlex = flattenedStyle?.flex === 1 || flattenedStyle?.flexGrow === 1;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          flexDirection: finalIconPosition === "right" ? "row-reverse" : "row",
          gap: -1.5,
        },
        style,
        isLoading && { opacity: 0.7 },
      ]}
      disabled={isLoading}
    >
      {/* Icon Section - Kept EXACTLY as original */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: scaledWidth,
            height: height,
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 1.5,
            borderTopRightRadius:
              finalIconPosition === "right" ? height / 2 : 8,
            borderBottomRightRadius:
              finalIconPosition === "right" ? height / 2 : 8,
            borderTopLeftRadius: finalIconPosition === "left" ? height / 2 : 8,
            borderBottomLeftRadius:
              finalIconPosition === "left" ? height / 2 : 8,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        {!!(icon || iconLabel || isLoading) && (
          <View style={styles.iconContainerInternal}>
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
              typeof icon === "string" ? (
                <ThemedText
                  style={[
                    styles.text,
                    { color: finalContentColor, fontSize: 12 },
                  ]}
                >
                  {icon}
                </ThemedText>
              ) : (
                icon
              )
            ) : null}
          </View>
        )}
      </View>

      {/* Label Section - Kept EXACTLY as original */}
      <View
        style={[
          styles.textWrapper,
          {
            flex: isFlex ? 1 : undefined,
            backgroundColor: bgColor,
            borderColor: borderColor,
            height: height,
            paddingHorizontal: 20,
            borderTopLeftRadius: finalIconPosition === "right" ? 10 : 8,
            borderBottomLeftRadius: finalIconPosition === "right" ? 10 : 8,
            borderTopRightRadius: finalIconPosition === "left" ? 10 : 8,
            borderBottomRightRadius: finalIconPosition === "left" ? 10 : 8,
            borderWidth: 1.5,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.text,
            { color: finalContentColor, fontSize: 14 },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerInternal: {
    justifyContent: "center",
    alignItems: "center",
  },
  textWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontFamily: "Alexandria-Black",
    textAlign: "center",
    lineHeight: 22,
  },
});
