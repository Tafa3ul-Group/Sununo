import React, { createContext, useContext, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import {
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface TabBarVisibilityValue {
  /** 0 = fully visible, 1 = fully hidden (slid down off-screen). */
  hidden: SharedValue<number>;
  /** Feed a scroll event; hides on scroll-down, shows on scroll-up / near top. */
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  show: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityValue | null>(null);

const SCROLL_THRESHOLD = 8;

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hidden = useSharedValue(0);
  const lastY = useRef(0);

  const show = () => {
    hidden.value = withTiming(0, { duration: 220 });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;

    // Always reveal near the top.
    if (y <= 4) {
      if (hidden.value !== 0) hidden.value = withTiming(0, { duration: 220 });
      lastY.current = y;
      return;
    }

    if (Math.abs(dy) < SCROLL_THRESHOLD) return;

    if (dy > 0 && hidden.value !== 1) {
      // Scrolling down → hide.
      hidden.value = withTiming(1, { duration: 220 });
    } else if (dy < 0 && hidden.value !== 0) {
      // Scrolling up → show.
      hidden.value = withTiming(0, { duration: 220 });
    }
    lastY.current = y;
  };

  return (
    <TabBarVisibilityContext.Provider value={{ hidden, onScroll, show }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility(): TabBarVisibilityValue | null {
  return useContext(TabBarVisibilityContext);
}
