import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

interface GuestCounterProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  style?: ViewStyle;
}

/**
 * Custom Guest Counter component with unique SVG shapes for buttons
 * as requested by the user.
 */
export const GuestCounter: React.FC<GuestCounterProps> = ({
  value,
  onIncrement,
  onDecrement,
  style,
}) => {
  // SVG Path provided by the user for the side buttons
  const leftPath =
    "M0 14.5C0 6.49187 6.49187 0 14.5 0H25.375C27.377 0 29 1.62297 29 3.625V25.375C29 27.377 27.377 29 25.375 29H14.5C6.49187 29 0 22.5081 0 14.5Z";

  return (
    <View style={[styles.container, style]}>
      {/* Plus Button (Left side in UI image) */}
      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.8}
        style={styles.buttonWrapper}
      >
        <Svg width={52} height={52} viewBox="0 0 29 29" fill="none">
          <Path d={leftPath} fill="#F64200" />
        </Svg>
        <View style={styles.iconOverlay}>
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={18} color="white" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Value Block (Square in the middle) */}
      <View style={styles.valueBlock}>
        <ThemedText style={styles.valueText}>{value}</ThemedText>
      </View>

      {/* Minus Button (Right side in UI image) */}
      <TouchableOpacity
        onPress={onDecrement}
        activeOpacity={0.8}
        style={[styles.buttonWrapper, styles.mirror]}
      >
        <Svg width={52} height={52} viewBox="0 0 29 29" fill="none">
          <Path d={leftPath} fill="#F64200" />
        </Svg>
        <View style={styles.iconOverlay}>
          <View style={styles.iconCircle}>
            <Ionicons name="remove" size={18} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  buttonWrapper: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  mirror: {
    transform: [{ scaleX: -1 }],
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  valueBlock: {
    backgroundColor: "#F64200",
    width: 60,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  valueText: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
  },
});
