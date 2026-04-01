import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { normalize } from "@/constants/theme";

interface SununoBookButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * SununoBookButton - A custom button with a "triple bubble" design 
 * as requested in the user's reference screenshot.
 */
export function SununoBookButton({ onPress, style }: SununoBookButtonProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      style={[styles.container, style]}
    >
      {/* Side Bubble Left */}
      <View style={[styles.bubble, styles.bubbleLeft]} />
      
      {/* Side Bubble Right */}
      <View style={[styles.bubble, styles.bubbleRight]} />
      
      {/* Main Button Body */}
      <View style={styles.mainBody}>
        <Text style={styles.text}>احجز الان</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: normalize.width(180),
    height: normalize.height(54),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  mainBody: {
    width: normalize.width(140),
    height: "100%",
    backgroundColor: "#035DF9",
    borderRadius: normalize.radius(27),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    shadowColor: "#035DF9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bubble: {
    position: "absolute",
    width: normalize.height(48),
    height: normalize.height(48),
    borderRadius: normalize.radius(24),
    backgroundColor: "#035DF9",
    zIndex: 1,
    opacity: 0.95,
  },
  bubbleLeft: {
    left: normalize.width(10),
  },
  bubbleRight: {
    right: normalize.width(10),
  },
  text: {
    color: "white",
    fontSize: normalize.font(18),
    fontWeight: "900",
    textAlign: "center",
  },
});
