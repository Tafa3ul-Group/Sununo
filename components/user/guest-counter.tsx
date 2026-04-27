import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SolarAddBold, SolarMinusBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { useTranslation } from "react-i18next";
import { normalize } from "../../constants/theme";

interface GuestCounterProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  style?: ViewStyle;
}

export const GuestCounter: React.FC<GuestCounterProps> = ({
  value,
  onIncrement,
  onDecrement,
  style,
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const btnSize = 38;

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }, style]}>
      {/* First Button (Right in RTL, Left in LTR) - Now Minus for RTL */}
      <TouchableOpacity
        onPress={onDecrement}
        activeOpacity={0.8}
        style={[styles.buttonWrapper, isRTL && styles.mirror, { width: btnSize, height: btnSize }]}
      >
        <Svg width={btnSize} height={btnSize} viewBox="0 0 29 29" fill="none">
          <Path d="M0 14.5C0 6.49187 6.49187 0 14.5 0H25.375C27.377 0 29 1.62297 29 3.625V25.375C29 27.377 27.377 29 25.375 29H14.5C6.49187 29 0 22.5081 0 14.5Z" fill="#F64200" />
        </Svg>
        <View style={styles.iconOverlay}>
            <View style={styles.iconCircle}>
                <SolarMinusBold size={14} color="white" />
            </View>
        </View>
      </TouchableOpacity>

      {/* Value Block */}
      <View style={[styles.valueBlock, { height: btnSize }]}>
        <ThemedText style={styles.valueText}>{value}</ThemedText>
      </View>

      {/* Last Button (Left in RTL, Right in LTR) - Now Plus for RTL */}
      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.8}
        style={[styles.buttonWrapper, !isRTL && styles.mirror, { width: btnSize, height: btnSize }]}
      >
        <Svg width={btnSize} height={btnSize} viewBox="0 0 29 29" fill="none">
          <Path d="M0 14.5C0 6.49187 6.49187 0 14.5 0H25.375C27.377 0 29 1.62297 29 3.625V25.375C29 27.377 27.377 29 25.375 29H14.5C6.49187 29 0 22.5081 0 14.5Z" fill="#F64200" />
        </Svg>
        <View style={styles.iconOverlay}>
            <View style={styles.iconCircle}>
                <SolarAddBold size={14} color="white" />
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  valueBlock: {
    backgroundColor: "#F64200",
    width: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  valueText: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: "white",
  },
});
