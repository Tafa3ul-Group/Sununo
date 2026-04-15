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
  iconPosition?: 'left' | 'right';
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isLoading?: boolean;
  height?: number;
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
}: SecondaryButtonProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Use provided iconPosition or default to RTL-aware default
  const finalIconPosition = iconPosition || (isRTL ? 'right' : 'left');

  const bgColor = isActive ? activeColor : "white";
  const borderColor = isActive ? activeColor : "#E5E7EB";
  const finalContentColor = isActive ? activeTextColor : inactiveTextColor;

  const scaledWidth = 44.4;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          flexDirection: finalIconPosition === 'right' ? 'row-reverse' : 'row',
          gap: -1.5
        },
        style,
        isLoading && { opacity: 0.7 }
      ]}
      disabled={isLoading}
    >
      {/* Label Section */}
      <View
        style={[
          styles.textWrapper,
          {
            flex: 1,
            backgroundColor: bgColor,
            borderColor: borderColor,
            height: height,
            paddingHorizontal: 20,
            borderTopLeftRadius: finalIconPosition === 'right' ? 8 : height / 2,
            borderBottomLeftRadius: finalIconPosition === 'right' ? 8 : height / 2,
            borderTopRightRadius: finalIconPosition === 'left' ? 8 : height / 2,
            borderBottomRightRadius: finalIconPosition === 'left' ? 8 : height / 2,
            borderWidth: 1.5,
          },
        ]}
      >
        <ThemedText
          style={[styles.text, { color: finalContentColor, fontSize: 18 }, textStyle]}
        >
          {label}
        </ThemedText>
      </View>

      {/* Icon Section */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: scaledWidth,
            height: height,
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: 1.5,
            borderTopRightRadius: finalIconPosition === 'right' ? height / 2 : 8,
            borderBottomRightRadius: finalIconPosition === 'right' ? height / 2 : 8,
            borderTopLeftRadius: finalIconPosition === 'left' ? height / 2 : 8,
            borderBottomLeftRadius: finalIconPosition === 'left' ? height / 2 : 8,
            justifyContent: 'center',
            alignItems: 'center'
          }
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
    fontFamily: "LamaSans-Black",
    textAlign: "center",
    lineHeight: 22,
  },
});
