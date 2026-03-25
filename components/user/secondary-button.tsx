import { ThemedText } from "@/components/themed-text";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  iconOnly?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * SecondaryButton - Hybrid design for React Native.
 * Scales the original 28x29 Design correctly.
 * Original Aspect Ratio: 0.96:1 (Width: 28, Height: 29)
 * New Height: 46px -> New Width: 46 * (28/29) ≈ 44.4px
 */
export function SecondaryButton({
  label,
  onPress,
  isActive = false,
  icon,
  activeColor = "#035DF9",
  inactiveColor = "#E9EBED",
  activeTextColor = "white",
  inactiveTextColor = "#035DF9",
  iconOnly = false,
  style,
  textStyle,
}: SecondaryButtonProps) {
  const bgColor = isActive ? activeColor : "transparent";
  const borderColor = isActive ? activeColor : inactiveColor;
  const finalContentColor = isActive ? activeTextColor : (inactiveTextColor || activeColor);

  const buttonHeight = (style as ViewStyle)?.height || 46;
  const scaledWidth = Number(buttonHeight) * (28 / 29);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Icon Section */}
      <View style={[styles.iconWrapper, { width: scaledWidth, height: '100%' }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="88.5 0 28 29"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <Path
            d="M102.5 0.5H93.1172C90.5673 0.500248 88.5002 2.5673 88.5 5.11719V23.8828C88.5002 26.4327 90.5673 28.4998 93.1172 28.5H102.5C110.232 28.5 116.5 22.232 116.5 14.5C116.5 6.76801 110.232 0.5 102.5 0.5Z"
            fill={bgColor}
            stroke={borderColor}
            strokeWidth="1"
          />
        </Svg>
        {icon && (
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon as any}
              size={Number(buttonHeight) * 0.48}
              color={finalContentColor}
            />
          </View>
        )}
      </View>

      {/* Label Section */}
      {!iconOnly && (
        <View
          style={[
            styles.textWrapper,
            {
              backgroundColor: bgColor,
              borderColor: borderColor,
              height: '100%',
              minWidth: 40,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.text, 
              { 
                color: finalContentColor, 
                fontSize: Number(buttonHeight) * 0.38,
                lineHeight: Number(buttonHeight) * 0.45 
              }, 
              textStyle
            ]}
          >
            {label}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    height: 46,
    alignItems: "stretch",
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
    paddingLeft: 3, 
  },
  textWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12, 
    borderWidth: 1.5, 
    borderRadius: 8.7, 
    marginRight: -1,
  },
  text: {
    fontWeight: "800",
    textAlign: "center",
  },
});
