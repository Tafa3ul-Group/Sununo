import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing } from '@/constants/theme';

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);

const DESIGN_WIDTH = 344;
const DESIGN_HEIGHT = 80;
const PILL_COLOR = Colors.primary; // #2B66FF
const PILL_INSET = 5; // padding inside the wavy container

export interface ChaletStep {
  id: string;
  title: string;
}

interface ChaletProgressTabsProps {
  steps: ChaletStep[];
  currentStep: number;
  onStepPress?: (index: number) => void;
  isRTL?: boolean;
}

/* ── Animated tab label ── */
const TabLabel: React.FC<{
  label: string;
  index: number;
  transition: { value: number };
}> = ({ label, index, transition }) => {
  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      transition.value,
      [index - 0.4, index, index + 0.4],
      [PILL_COLOR, '#FFFFFF', PILL_COLOR],
    );
    const scale = interpolate(
      transition.value,
      [index - 0.5, index, index + 0.5],
      [1, 1.05, 1],
      'clamp',
    );
    return { color, transform: [{ scale }] };
  });

  return (
    <AnimatedText style={[styles.tabText, textStyle]}>
      {label}
    </AnimatedText>
  );
};

/* ── Main Component ── */
export const ChaletProgressTabs: React.FC<ChaletProgressTabsProps> = ({
  steps,
  currentStep,
  onStepPress,
  isRTL = false,
}) => {
  const tabCount = steps.length;
  const [containerWidth, setContainerWidth] = useState(0);

  const transition = useSharedValue(currentStep);

  const springConfig = {
    damping: 18,
    stiffness: 120,
    mass: 1,
  };

  useEffect(() => {
    transition.value = withSpring(currentStep, springConfig);
  }, [currentStep]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // ── Pill dimensions ──
  const segmentWidth = containerWidth > 0 ? (containerWidth - PILL_INSET * 2) / tabCount : 0;
  const pillWidth = segmentWidth * 0.78; // 78% of segment — covers text without filling
  const pillHeight = DESIGN_HEIGHT - PILL_INSET * 2;
  const pillOffset = (segmentWidth - pillWidth) / 2; // center pill within each segment

  // ── Compute pill target positions ──
  const inputRange = steps.map((_, i) => i);

  const pillPositions = inputRange.map((i) => {
    const ltrPos = PILL_INSET + i * segmentWidth + pillOffset;
    if (isRTL) {
      return PILL_INSET + (tabCount - 1 - i) * segmentWidth + pillOffset;
    }
    return ltrPos;
  });

  // Animated pill style
  const pillAnimStyle = useAnimatedStyle(() => {
    if (pillWidth <= 0) return { opacity: 0 };

    const translateX = interpolate(transition.value, inputRange, pillPositions);
    const scale = interpolate(
      transition.value,
      inputRange.length === 3 ? [0, 0.5, 1, 1.5, 2] : inputRange,
      inputRange.length === 3 ? [1, 0.96, 1, 0.96, 1] : inputRange.map(() => 1),
      'clamp',
    );

    return {
      transform: [{ translateX }, { scaleX: scale }],
      opacity: 1,
    };
  });

  // RTL: reverse visual order of buttons
  const displaySteps = isRTL ? [...steps].reverse() : steps;
  const getOriginalIndex = (displayIndex: number) =>
    isRTL ? tabCount - 1 - displayIndex : displayIndex;

  const svgWidth = containerWidth || 100;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <>
          {/* SVG wavy container background */}
          <View style={StyleSheet.absoluteFill}>
            <Svg
              width={svgWidth}
              height={DESIGN_HEIGHT}
              viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
              fill="none"
            >
              <Path
                d="M38 0.5H75.0938C81.5303 0.500033 87.6957 3.0928 92.1982 7.69238C101.908 17.6111 117.848 17.6917 127.658 7.87207L127.908 7.62207C132.463 3.06236 138.645 0.5 145.09 0.5H199.722C206.109 0.5 212.211 3.1475 216.573 7.8125C225.77 17.6461 241.244 18.0251 250.91 8.65332L252.125 7.47559C256.74 3.00186 262.915 0.5 269.342 0.5H306C326.711 0.5 343.5 17.2893 343.5 38V42C343.5 62.7107 326.711 79.5 306 79.5H269.168C262.826 79.5 256.713 77.132 252.025 72.8604L250.749 71.6973C240.999 62.8117 225.98 63.1793 216.676 72.5312C212.238 76.9919 206.205 79.5 199.913 79.5H144.91C138.554 79.5 132.436 77.0747 127.807 72.7188L127.544 72.4717C117.623 63.1365 102.127 63.2151 92.3008 72.6504C87.7235 77.0457 81.6232 79.4999 75.2773 79.5H38C17.2893 79.5 0.5 62.7107 0.5 42V38C0.5 17.2893 17.2893 0.5 38 0.5Z"
                fill="white"
                stroke="#EEEEEE"
              />
            </Svg>
          </View>

          {/* Animated View-based pill */}
          <AnimatedView
            style={[
              styles.pill,
              {
                width: pillWidth,
                height: pillHeight,
                borderRadius: pillHeight / 2.5,
              },
              pillAnimStyle,
            ]}
          />

          {/* Touchable buttons layer */}
          <View style={styles.buttonsContainer}>
            {displaySteps.map((step, di) => {
              const originalIndex = getOriginalIndex(di);
              return (
                <TouchableOpacity
                  key={step.id}
                  onPress={() => onStepPress?.(originalIndex)}
                  style={styles.tabButton}
                  activeOpacity={1}
                >
                  <TabLabel
                    label={step.title}
                    index={originalIndex}
                    transition={transition}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: DESIGN_HEIGHT,
    backgroundColor: 'transparent',
    marginBottom: Spacing.lg,
  },
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    left: 0,
    backgroundColor: PILL_COLOR,
    zIndex: 10,
  },
  buttonsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 20,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    fontFamily: "LamaSans-Black",
    textAlign: 'center',
  },
});
