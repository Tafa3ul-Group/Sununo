import React, { useEffect } from "react";
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

interface AuthToggleProps {
  activeType: "owner" | "customer";
  onChange: (type: "owner" | "customer") => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({
  activeType,
  onChange,
}) => {
  const transition = useSharedValue(activeType === "owner" ? 0 : 1);

  const springConfig = {
    damping: 18,
    stiffness: 120,
    mass: 1,
  };

  useEffect(() => {
    transition.value = withSpring(activeType === "owner" ? 0 : 1, springConfig);
  }, [activeType]);

  const circleGroupProps = useAnimatedProps(() => {
    const xOffset = interpolate(transition.value, [0, 1], [-70, 70]);
    return {
      transform: [
        { translateX: xOffset },
        { translateX: 140 },
        { translateY: 40 },
        { scale: 1 },
        { translateX: -140 },
        { translateY: -40 },
      ],
    };
  });

  const ownerTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(transition.value, [0, 0.4], ["#FFFFFF", "#F64200"]),
    fontSize: interpolate(transition.value, [0, 1], [18, 16]),
  }));

  const customerTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(transition.value, [0.6, 1], ["#F64200", "#FFFFFF"]),
    fontSize: interpolate(transition.value, [0, 1], [16, 18]),
  }));

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width={280} height={80} viewBox="0 0 280 80" fill="none">
          {/* Symmetric Dumbbell Shape for 2 Tabs */}
          <Path
            d="M38 0.5H102.094C108.53 0.500033 114.696 3.0928 119.198 7.69238C128.908 17.6111 144.848 17.6917 154.658 7.87207L154.908 7.62207C159.463 3.06236 165.645 0.5 172.09 0.5H242C262.711 0.5 279.5 17.2893 279.5 38V42C279.5 62.7107 262.711 79.5 242 79.5H172.277C165.913 79.5 159.795 77.0747 155.166 72.7188L154.903 72.4717C144.982 63.1365 129.486 63.2151 119.66 72.6504C115.083 77.0457 108.982 79.4999 102.636 79.5H38C17.2893 79.5 0.5 62.7107 0.5 42V38C0.5 17.2893 17.2893 0.5 38 0.5Z"
            fill="white"
            stroke="#F0F2F5"
            strokeWidth={1.5}
          />
          <AnimatedG animatedProps={circleGroupProps}>
            {/* Fully Rounded Capsule Pill Shape */}
            <AnimatedPath
              d="M114 8C96.3269 8 82 22.3269 82 40C82 57.6731 96.3269 72 114 72H166C183.673 72 198 57.6731 198 40C198 22.3269 183.673 8 166 8H114Z"
              fill="#F64200"
            />
          </AnimatedG>
        </Svg>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => onChange("owner")}
          style={styles.tabButton}
          activeOpacity={1}
        >
          <AnimatedText style={[styles.tabText, ownerTextStyle]}>
            صاحب شاليه
          </AnimatedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChange("customer")}
          style={styles.tabButton}
          activeOpacity={1}
        >
          <AnimatedText style={[styles.tabText, customerTextStyle]}>
            زبون
          </AnimatedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 80,
    backgroundColor: "transparent",
  },
  buttonsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    zIndex: 20,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 18,
    fontFamily: "LamaSans-Black",
    textAlign: "center",
  },
});
