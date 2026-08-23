import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, normalize } from "@/constants/theme";
import React, { useCallback, useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const THUMB = 24;

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step: number;
  /** [low, high] in currency units. */
  value: [number, number];
  /** Fired when a thumb is released, not on every frame. */
  onChange: (value: [number, number]) => void;
  /** Shown when the high thumb is at the far end ("200,000+"). */
  maxIsOpenEnded?: boolean;
  currencyLabel: string;
}

/**
 * Two-thumb price range.
 *
 * Hand-rolled on gesture-handler + reanimated rather than a slider package:
 * every RN slider library is a native module, and adding one would force a new
 * dev build on everyone for a control this small.
 */
export function PriceRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  maxIsOpenEnded = true,
  currencyLabel }: PriceRangeSliderProps) {
  const [width, setWidth] = useState(0);
  const [display, setDisplay] = useState<[number, number]>(value);

  const usable = Math.max(width - THUMB, 1);
  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);

  const toValue = useCallback(
    (x: number) => {
      "worklet";
      const raw = min + (x / usable) * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step, usable],
  );

  // Re-seed the thumbs whenever the track is measured or the applied range
  // changes from outside (e.g. the sheet reopening on a cleared filter).
  useEffect(() => {
    if (!width) return;
    lowX.value = ((value[0] - min) / (max - min)) * usable;
    highX.value = ((value[1] - min) / (max - min)) * usable;
    setDisplay(value);
  }, [width, value, min, max, usable, lowX, highX]);

  // Live labels while dragging: only fires when the snapped value changes, so
  // it is not a per-frame re-render.
  useAnimatedReaction(
    () => [toValue(lowX.value), toValue(highX.value)] as [number, number],
    (current, previous) => {
      if (!previous || current[0] !== previous[0] || current[1] !== previous[1]) {
        runOnJS(setDisplay)(current);
      }
    },
    [toValue],
  );

  const commit = useCallback(() => {
    onChange([
      Math.min(display[0], display[1]),
      Math.max(display[0], display[1]),
    ]);
  }, [display, onChange]);

  const lowGesture = Gesture.Pan()
    .hitSlop({ horizontal: 14, vertical: 14 })
    .onChange((e) => {
      lowX.value = Math.min(Math.max(lowX.value + e.changeX, 0), highX.value);
    })
    .onEnd(() => runOnJS(commit)());

  const highGesture = Gesture.Pan()
    .hitSlop({ horizontal: 14, vertical: 14 })
    .onChange((e) => {
      highX.value = Math.min(Math.max(highX.value + e.changeX, lowX.value), usable);
    })
    .onEnd(() => runOnJS(commit)());

  const lowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowX.value }],
  }));
  const highStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highX.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    // Physical `left`, not the logical `start`: the track is pinned to LTR
    // below so the cheap end is always on the left, in Arabic too — that is how
    // every price slider reads, and it keeps the drag maths direction-free.
    left: lowX.value + THUMB / 2,
    width: Math.max(highX.value - lowX.value, 0),
  }));

  const fmt = (n: number) => Math.round(n).toLocaleString();
  const highLabel =
    maxIsOpenEnded && display[1] >= max ? `${fmt(max)}+` : fmt(display[1]);

  return (
    <View>
      <View style={[styles.labels, { flexDirection: "row" }]}>
        <View style={styles.pill}>
          <ThemedText style={styles.value}>{fmt(display[0])}</ThemedText>
        </View>
        <ThemedText style={styles.dash}>—</ThemedText>
        <View style={styles.pill}>
          <ThemedText style={styles.value}>
            {highLabel} {currencyLabel}
          </ThemedText>
        </View>
      </View>

      <View
        style={styles.track}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        <View style={styles.rail} />
        <Animated.View style={[styles.fill, fillStyle]} />

        <GestureDetector gesture={lowGesture}>
          <Animated.View style={[styles.thumb, lowStyle]} />
        </GestureDetector>
        <GestureDetector gesture={highGesture}>
          <Animated.View style={[styles.thumb, highStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    alignItems: "center",
    justifyContent: "center",
    gap: normalize.width(8),
    marginBottom: normalize.height(12) },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: normalize.height(8),
    borderRadius: normalize.radius(10),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB" },
  dash: {
    fontSize: normalize.font(12),
    color: "#9CA3AF" },
  value: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.bold,
    color: "#111827" },
  track: {
    height: THUMB,
    justifyContent: "center",
    direction: "ltr" },
  rail: {
    height: 4,
    borderRadius: 999,
    marginHorizontal: THUMB / 2,
    backgroundColor: "#E5E7EB" },
  fill: {
    position: "absolute",
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.primary },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: Colors.primary,
    // Keeps the thumb visible against the rail on both themes.
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2 } });
