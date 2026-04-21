/**
 * AuthToggle - User type selection component
 * Enhanced with Liquid Stretch animation while maintaining MainTabs visual style.
 */
import React, { useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 375;

const normalize = {
  width: (size: number) => size * scale,
  height: (size: number) => size * scale,
  font: (size: number) => size * scale,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedText = Animated.createAnimatedComponent(Text);

const TOGGLE_WIDTH = normalize.width(280);
const TOGGLE_HEIGHT = normalize.height(80);

interface AuthToggleProps {
  activeType: "owner" | "customer";
  onChange: (type: "owner" | "customer") => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({
  activeType,
  onChange,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // 0: owner, 1: customer
  const transition = useSharedValue(activeType === "owner" ? 0 : 1);

  useEffect(() => {
    transition.value = withSpring(activeType === "owner" ? 0 : 1, {
      damping: 20,
      stiffness: 150,
      mass: 0.8, 
    });
  }, [activeType]);

  const xOffsets = isRTL ? [70, -70] : [-70, 70];
  const rtlTextOffsets = [2, -2];
  const ltrTextOffsets = [0, 0];
  const currentTextOffsets = isRTL ? rtlTextOffsets : ltrTextOffsets;

  const circleGroupProps = useAnimatedProps(() => {
    const xPos = interpolate(transition.value, [0, 1], xOffsets);
    
    // أنميشن التمدد السائل (Liquid Stretch)
    // يتمدد الشكل في المنتصف (0.5) ثم يعود لحجمه
    const stretchX = interpolate(
      transition.value,
      [0, 0.5, 1],
      [1, 1.25, 1]
    );
    
    // تقليل الارتفاع قليلاً أثناء التمدد لتعزيز الواقعية
    const stretchY = interpolate(
      transition.value,
      [0, 0.5, 1],
      [1, 0.9, 1]
    );

    return {
      transform: [
        { translateX: xPos },
        { translateX: 140 }, // مركز الـ SVG
        { translateY: 40 },
        { scaleX: stretchX * 0.85 }, // تصغير العرض بنسبة 15%
        { scaleY: stretchY * 0.85 }, // تصغير الارتفاع بنسبة 15%
        { translateX: -140 },
        { translateY: -40 },
      ],
    };
  });

  const tab0Style = useAnimatedStyle(() => ({
    color: interpolateColor(transition.value, [0, 0.4], ["#FFFFFF", "#64748B"]),
    transform: [
      { scale: interpolate(transition.value, [0, 1], [1.1, 1]) },
      { translateX: currentTextOffsets[0] },
    ],
  }));

  const tab1Style = useAnimatedStyle(() => ({
    color: interpolateColor(transition.value, [0.6, 1], ["#64748B", "#FFFFFF"]),
    transform: [
      { scale: interpolate(transition.value, [0, 1], [1, 1.1]) },
      { translateX: currentTextOffsets[1] },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={TOGGLE_WIDTH} height={TOGGLE_HEIGHT} viewBox="0 0 280 80">
          <Path
            d="M38 0.5H102.094C108.53 0.500033 114.696 3.0928 119.198 7.69238C128.908 17.6111 144.848 17.6917 154.658 7.87207L154.908 7.62207C159.463 3.06236 165.645 0.5 172.09 0.5H242C262.711 0.5 279.5 17.2893 279.5 38V42C279.5 62.7107 262.711 79.5 242 79.5H172.277C165.913 79.5 159.795 77.0747 155.166 72.7188L154.903 72.4717C144.982 63.1365 129.486 63.2151 119.66 72.6504C115.083 77.0457 108.982 79.4999 102.636 79.5H38C17.2893 79.5 0.5 62.7107 0.5 42V38C0.5 17.2893 17.2893 0.5 38 0.5Z"
            fill="white"
            stroke="#F0F2F5"
            strokeWidth={1.5}
          />
          <AnimatedG animatedProps={circleGroupProps}>
            <AnimatedPath
              d="M100 8C82.3269 8 68 22.3269 68 40C68 57.6731 82.3269 72 100 72H180C197.673 72 212 57.6731 212 40C212 22.3269 197.673 8 180 8H100Z"
              fill="#F64200"
            />
          </AnimatedG>
        </Svg>
      </View>

      <View style={[styles.buttonsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => onChange("owner")} style={styles.tabButton} activeOpacity={1}>
          <AnimatedText style={[styles.tabText, tab0Style]}>{t('auth.owner')}</AnimatedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange("customer")} style={styles.tabButton} activeOpacity={1}>
          <AnimatedText style={[styles.tabText, tab1Style]}>{t('auth.customer')}</AnimatedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
  },
  buttonsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontFamily: "Tajawal-Black",
    fontSize: normalize.font(16),
  },
});
