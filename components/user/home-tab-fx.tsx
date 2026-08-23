import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Home-tab flourishes.
 *
 * 1. Tapping the home button while already on home scrolls the list back to the
 *    top (the screen registers its own scroller through `useRegisterHomeScrollToTop`).
 * 2. Hammering the home button (7 taps inside 3s) fires a Sununo sunburst out of
 *    the button — the hidden treat.
 */

/** Taps needed to unlock the sunburst, and the window they must land in. */
export const SUNBURST_TAPS = 2; // TEMP-TEST
export const SUNBURST_WINDOW_MS = 20000; // TEMP-TEST

interface HomeTabFxValue {
  /** Screens call this to expose their scroller to the tab bar. */
  registerHomeScrollToTop: (fn: () => void) => () => void;
  scrollHomeToTop: () => void;
  fireSunburst: () => void;
}

const HomeTabFxContext = createContext<HomeTabFxValue | null>(null);

export function HomeTabFxProvider({ children }: { children: React.ReactNode }) {
  const scrollFnRef = useRef<(() => void) | null>(null);
  const burstRef = useRef<SunburstHandle>(null);

  const registerHomeScrollToTop = useCallback((fn: () => void) => {
    scrollFnRef.current = fn;
    return () => {
      if (scrollFnRef.current === fn) scrollFnRef.current = null;
    };
  }, []);

  const value = useMemo<HomeTabFxValue>(
    () => ({
      registerHomeScrollToTop,
      scrollHomeToTop: () => scrollFnRef.current?.(),
      fireSunburst: () => burstRef.current?.fire(),
    }),
    [registerHomeScrollToTop],
  );

  return (
    <HomeTabFxContext.Provider value={value}>
      {children}
      <Sunburst ref={burstRef} />
    </HomeTabFxContext.Provider>
  );
}

export function useHomeTabFx(): HomeTabFxValue | null {
  return useContext(HomeTabFxContext);
}

/** Keep `fn` stable (useCallback) — it re-registers whenever the identity changes. */
export function useRegisterHomeScrollToTop(fn: () => void) {
  const fx = useContext(HomeTabFxContext);
  useEffect(() => fx?.registerHomeScrollToTop(fn), [fx, fn]);
}

/* ------------------------------------------------------------------ */
/* Sunburst                                                            */
/* ------------------------------------------------------------------ */

interface SunburstHandle {
  fire: () => void;
}

const DURATION = 6000; // TEMP-TEST
/** Square the burst is drawn inside — Android clips anything outside a parent. */
const BOX = normalize.width(320);
const RAY_COUNT = 12;
const RAY_W = normalize.width(4);
const RAY_H = normalize.height(24);
const RAY_START = normalize.height(26);
const RAY_TRAVEL = normalize.height(78);
const CORE = normalize.width(56);

const PARTICLE_CHARS = ["☀️", "✨", "🌞", "✨", "☀️", "✨"];
const PARTICLE_COUNT = 14;
const PARTICLE_SIZE = normalize.font(18);
/** Fanned upward (‑160°…‑20°) so nothing shoots into the tab bar. */
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (-160 + (140 / (PARTICLE_COUNT - 1)) * i) * (Math.PI / 180);
  const distance = normalize.height(96) + (i % 4) * normalize.height(22);
  return {
    char: PARTICLE_CHARS[i % PARTICLE_CHARS.length],
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    spin: i % 2 === 0 ? 220 : -220,
    delay: (i % 5) * 0.04,
  };
});

const RAY_COLORS = [Colors.accent, Colors.primary, Colors.secondary];

// Pre-scaled distances: worklets run on the UI runtime and can't call back into
// plain JS helpers like `normalize`, so everything they use is resolved here.
const TOAST_RISE = normalize.height(14);
const TOAST_EXIT = normalize.height(10);
const PARTICLE_FALL = normalize.height(16);
const TOAST_GAP = normalize.height(44) + normalize.height(18);

const Sunburst = forwardRef<SunburstHandle>((_props, ref) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const progress = useSharedValue(0);

  const stop = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
  }, []);

  useImperativeHandle(ref, () => ({
    fire: () => {
      // Ignore extra taps while the burst is already on screen.
      if (playingRef.current) return;
      playingRef.current = true;
      setPlaying(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      progress.value = 0;
      progress.value = withTiming(
        1,
        { duration: DURATION, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(stop)();
        },
      );
    },
  }));

  // Centre of the round home button in CustomTabBar (44pt button, 23pt inset).
  const buttonHalf = normalize.height(22);
  const barBottom = Math.max(insets.bottom, 24);
  const originBottom = barBottom + buttonHalf;
  const originLeft = normalize.width(23) + buttonHalf;

  const coreStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.12, 0.6],
      [0, 0.45, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 0.6],
          [0.2, 3.4],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const toastStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.14, 0.7, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 0.25, 1],
          [TOAST_RISE, 0, -TOAST_EXIT],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  if (!playing) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.box,
          { left: originLeft - BOX / 2, bottom: originBottom - BOX / 2 },
        ]}
      >
        <Animated.View
          style={[
            styles.core,
            { left: (BOX - CORE) / 2, top: (BOX - CORE) / 2 },
            coreStyle,
          ]}
        />
        {Array.from({ length: RAY_COUNT }, (_, i) => (
          <Ray key={`ray-${i}`} index={i} progress={progress} />
        ))}
        {PARTICLES.map((p, i) => (
          <Particle key={`p-${i}`} particle={p} progress={progress} />
        ))}
      </View>

      <Animated.View
        style={[
          styles.toastWrap,
          { bottom: barBottom + TOAST_GAP },
          toastStyle,
        ]}
      >
        <View style={styles.toast}>
          <ThemedText style={styles.toastText}>
            {t("home.sunburst")}
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
});

Sunburst.displayName = "Sunburst";

function Ray({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) {
  const angle = (360 / RAY_COUNT) * index;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.1, 0.55],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      { rotate: `${angle}deg` },
      {
        translateY: -interpolate(
          progress.value,
          [0, 0.55],
          [RAY_START, RAY_START + RAY_TRAVEL],
          Extrapolation.CLAMP,
        ),
      },
      {
        scaleY: interpolate(
          progress.value,
          [0, 0.2, 0.55],
          [0.4, 1, 0.3],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.ray,
        {
          left: (BOX - RAY_W) / 2,
          top: (BOX - RAY_H) / 2,
          backgroundColor: RAY_COLORS[index % RAY_COLORS.length],
        },
        style,
      ]}
    />
  );
}

function Particle({
  particle,
  progress,
}: {
  particle: (typeof PARTICLES)[number];
  progress: SharedValue<number>;
}) {
  const { char, dx, dy, spin, delay } = particle;
  const style = useAnimatedStyle(() => {
    // Each particle runs on its own slightly delayed slice of the timeline.
    const p = interpolate(
      progress.value,
      [delay, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: interpolate(p, [0, 0.12, 0.75, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(p, [0, 1], [0, dx], Extrapolation.CLAMP) },
        // Slight arc: rises fast, then eases and drifts back down a touch.
        {
          translateY: interpolate(
            p,
            [0, 0.7, 1],
            [0, dy, dy + PARTICLE_FALL],
            Extrapolation.CLAMP,
          ),
        },
        { rotate: `${interpolate(p, [0, 1], [0, spin], Extrapolation.CLAMP)}deg` },
        {
          scale: interpolate(
            p,
            [0, 0.2, 1],
            [0.4, 1, 0.7],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          left: BOX / 2 - PARTICLE_SIZE,
          top: BOX / 2 - PARTICLE_SIZE,
        },
        style,
      ]}
    >
      {char}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    width: BOX,
    height: BOX,
  },
  core: {
    position: "absolute",
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: Colors.accent,
  },
  ray: {
    position: "absolute",
    width: RAY_W,
    height: RAY_H,
    borderRadius: RAY_W / 2,
  },
  particle: {
    position: "absolute",
    fontSize: PARTICLE_SIZE,
    width: PARTICLE_SIZE * 2,
    textAlign: "center",
  },
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toast: {
    paddingHorizontal: normalize.width(16),
    paddingVertical: normalize.height(8),
    borderRadius: normalize.height(20),
    backgroundColor: Colors.primary,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
});
