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

interface SecondaryButtonInverseProps {
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
}

export function SecondaryButtonInverse({
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
}: SecondaryButtonInverseProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Mirror logic for inverse direction
  const finalIconPosition = iconPosition || (isRTL ? "left" : "right");

  const bgColor = isActive ? activeColor : "white";
  const borderColor = isActive ? activeColor : "#E5E7EB";
  const finalContentColor = isActive ? activeTextColor : inactiveTextColor;

  const scaledWidth = 44.4;

  // Dynamic flex check
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
      {/* Icon Section */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: scaledWidth,
            height: 46,
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 1.5,
            borderTopRightRadius: finalIconPosition === "right" ? 23 : 8,
            borderBottomRightRadius: finalIconPosition === "right" ? 23 : 8,
            borderTopLeftRadius: finalIconPosition === "left" ? 23 : 8,
            borderBottomLeftRadius: finalIconPosition === "left" ? 23 : 8,
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
                style={[styles.text, { color: finalContentColor, fontSize: 14 }]}
              >
                {iconLabel}
              </ThemedText>
            ) : icon ? (
              typeof icon === "string" ? (
                <ThemedText style={[styles.text, { color: finalContentColor, fontSize: 12 }]}>
                  {icon}
                </ThemedText>
              ) : (
                icon
              )
            ) : null}
          </View>
        )}
      </View>

      {/* Label Section */}
      <View
        style={[
          styles.textWrapper,
          {
            flex: isFlex ? 1 : undefined,
            backgroundColor: bgColor,
            borderColor: borderColor,
            height: 46,
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
          style={[styles.text, { color: finalContentColor, fontSize: 14 }, textStyle]}
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
    height: 46,
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
