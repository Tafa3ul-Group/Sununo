import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedText = Animated.createAnimatedComponent(Text);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NAV_WIDTH = SCREEN_WIDTH;
const WHO_COLOR = "#F64200";
const WHEN_COLOR = "#15AB64";
const WHERE_COLOR = "#035DF9";

export type TabType = "WHERE" | "WHEN" | "WHO";

interface MainTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export function MainTabs({ activeTab, onChange }: MainTabsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const transition = useSharedValue(0);
  // Re-ordered to start with SHOOKET (WHEN), then MANO (WHO), then DETAILS (WHERE)
  const tabList: TabType[] = ["WHEN", "WHO", "WHERE"];

  useEffect(() => {
    let target = 0;
    if (activeTab === "WHEN") target = 0;
    else if (activeTab === "WHO") target = 1;
    else target = 2; // WHERE

    transition.value = withSpring(target, {
      damping: 18,
      stiffness: 120,
      mass: 1,
    });
  }, [activeTab]);

  // ==========================================
  // --- مصفوفات التحكم (عدل الأرقام هنا) ---
  // الترتيب: [SHOOKET, MANO, DETAILS]
  // ==========================================
  const xOffsets = isRTL ? [120, 0, -120] : [-120, 0, 120];
  const yOffsets = [0, 0, 0];
  const rtlTextOffsets = [2, 0, -2]; // إزاحة النص للعربي لتوسيط أفضل
  const ltrTextOffsets = [-2, 0, 2]; // إزاحة النص للإنجليزي لتوسيط أفضل
  const scales = [1, 1, 1];

  const currentTextOffsets = isRTL ? rtlTextOffsets : ltrTextOffsets;
  // ==========================================

  const circleGroupProps = useAnimatedProps(() => {
    const xPos = interpolate(transition.value, [0, 1, 2], xOffsets);
    const yPos = interpolate(transition.value, [0, 1, 2], yOffsets);
    const s = interpolate(transition.value, [0, 1, 2], scales);

    return {
      transform: [
        { translateX: xPos },
        { translateY: yPos },
        { translateX: 172 },
        { translateY: 40 },
        { scale: s },
        { translateX: -172 },
        { translateY: -40 },
      ],
    };
  });

  const circlePathProps = useAnimatedProps(() => {
    return {
      fill: interpolateColor(
        transition.value,
        [0, 1, 2],
        [WHEN_COLOR, WHO_COLOR, WHERE_COLOR],
      ),
    };
  });

  const tab0Style = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        transition.value,
        [0, 0.4],
        ["#FFFFFF", WHEN_COLOR],
      ),
      transform: [
        { scale: interpolate(transition.value, [0, 1], [1.05, 1]) },
        { translateX: currentTextOffsets[0] },
      ],
    };
  });

  const tab1Style = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        transition.value,
        [0.4, 1, 1.6],
        [WHO_COLOR, "#FFFFFF", WHO_COLOR],
      ),
      transform: [
        { scale: interpolate(transition.value, [0, 1, 2], [1, 1.05, 1]) },
        { translateX: currentTextOffsets[1] },
      ],
    };
  });

  const tab2Style = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        transition.value,
        [1.6, 2],
        [WHERE_COLOR, "#FFFFFF"],
      ),
      transform: [
        { scale: interpolate(transition.value, [1, 2], [1, 1.05]) },
        { translateX: currentTextOffsets[2] },
      ],
    };
  });

  const tabStyles = [tab0Style, tab1Style, tab2Style];

  return (
    <View style={styles.container}>
      <View style={{ width: 344, height: 80, alignSelf: "center" }}>
        <Svg width={344} height={80} viewBox="0 0 344 80" fill="none">
          <Path
            d="M38 0.5H75.0938C81.5303 0.500033 87.6957 3.0928 92.1982 7.69238C101.908 17.6111 117.848 17.6917 127.658 7.87207L127.908 7.62207C132.463 3.06236 138.645 0.5 145.09 0.5H199.722C206.109 0.5 212.211 3.1475 216.573 7.8125C225.77 17.6461 241.244 18.0251 250.91 8.65332L252.125 7.47559C256.74 3.00186 262.915 0.5 269.342 0.5H306C326.711 0.5 343.5 17.2893 343.5 38V42C343.5 62.7107 326.711 79.5 306 79.5H269.168C262.826 79.5 256.713 77.132 252.025 72.8604L250.749 71.6973C240.999 62.8117 225.98 63.1793 216.676 72.5312C212.238 76.9919 206.205 79.5 199.913 79.5H144.91C138.554 79.5 132.436 77.0747 127.807 72.7188L127.544 72.4717C117.623 63.1365 102.127 63.2151 92.3008 72.6504C87.7235 77.0457 81.6232 79.4999 75.2773 79.5H38C17.2893 79.5 0.5 62.7107 0.5 42V38C0.5 17.2893 17.2893 0.5 38 0.5Z"
            fill="white"
            stroke="#EEEEEE"
          />
          <AnimatedG animatedProps={circleGroupProps}>
            <AnimatedPath
              d="M182.611 4C199.804 4 214.712 15.8907 218.534 32.6534L218.679 33.2903C219.876 38.5389 219.814 43.9962 218.498 49.2164C214.678 64.3759 201.044 75 185.41 75H158.468C143.271 75 129.898 64.966 125.65 50.3744C123.916 44.4204 123.835 38.107 125.414 32.1104L125.598 31.4128C129.854 15.258 144.462 4 161.168 4L182.611 4Z"
              animatedProps={circlePathProps}
            />
          </AnimatedG>
        </Svg>
      </View>

      <View
        style={[
          styles.buttonsContainer,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        {tabList.map(function (tab, idx) {
          const textStyle = tabStyles[idx];

          let label = "";
          if (tab === "WHEN") label = t("booking.shooket");
          else if (tab === "WHO") label = t("booking.mano");
          else label = t("booking.details");

          return (
            <TouchableOpacity
              key={tab}
              onPress={function () {
                if (typeof onChange === "function") {
                  onChange(tab);
                }
              }}
              style={styles.tabButton}
              activeOpacity={1}
            >
              <AnimatedText style={[styles.tabText, textStyle]}>
                {label}
              </AnimatedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: "transparent",
  },
  buttonsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 344,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    zIndex: 20,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 17,
    fontFamily: "Alexandria-Black",
    textAlign: "center",
  },
});
