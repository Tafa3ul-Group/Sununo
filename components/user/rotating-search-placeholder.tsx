import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, normalize } from "@/constants/theme";
import React, { useEffect, useState } from "react";
import { TextStyle, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

interface Props {
  phrases: string[];
  textAlign?: TextStyle["textAlign"];
  intervalMs?: number;
}

/**
 * Cycles through search hint phrases. Each new phrase fades + slides up in while
 * the previous one fades up out — a gentle vertical crossfade. Uses a keyed
 * remount so every phrase reliably animates (not just the first).
 */
export function RotatingSearchPlaceholder({
  phrases,
  textAlign,
  intervalMs = 2800,
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [phrases.length, intervalMs]);

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Animated.View
        key={index}
        entering={FadeInDown.duration(300).withInitialValues({
          opacity: 0,
          transform: [{ translateY: normalize.height(7) }],
        })}
        exiting={FadeOutUp.duration(300).withInitialValues({
          opacity: 1,
          transform: [{ translateY: 0 }],
        })}
        style={{ position: "absolute", left: 0, right: 0 }}
      >
        <ThemedText
          numberOfLines={1}
          style={{
            fontSize: normalize.font(12),
            color: Colors.text.muted,
            fontFamily: Fonts.regular,
            textAlign,
          }}
        >
          {phrases[index]}
        </ThemedText>
      </Animated.View>
    </View>
  );
}
