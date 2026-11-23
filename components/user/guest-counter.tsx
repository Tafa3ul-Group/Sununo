import { SolarAddBold, SolarMinusBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { normalize } from "../../constants/theme";
import { useDirection } from "@/i18n";

interface GuestCounterProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /**
   * Opt-in: when given, the number itself becomes a field the user can type
   * into, for counts too large to reach comfortably with the +/- buttons.
   */
  onChangeValue?: (value: number) => void;
  /** Lowest value a typed number is clamped to (default 1). */
  min?: number;
  /** Highest value a typed number is clamped to; unbounded when omitted. */
  max?: number;
  /** Called with the typed number when it had to be clamped down to `max`. */
  onExceedMax?: (typed: number) => void;
  /**
   * The text field to render. Inside a @gorhom bottom sheet pass
   * BottomSheetTextInput, or the sheet won't move out of the keyboard's way.
   */
  InputComponent?: React.ComponentType<TextInputProps>;
  style?: ViewStyle;
}

// An Arabic keyboard types ٠-٩ (and a Persian one ۰-۹); Number() reads neither.
const toLatinDigits = (text: string) =>
  text.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));

export const GuestCounter: React.FC<GuestCounterProps> = ({
  value,
  onIncrement,
  onDecrement,
  onChangeValue,
  min = 1,
  max,
  onExceedMax,
  InputComponent = TextInput,
  style,
}) => {
  const { isRTL: isArabic, rowDirection: flexDir } = useDirection();
  const btnSize = 38;

  // What the field shows while it has focus. It is free to be empty or out of
  // range mid-typing; it only becomes `value` once committed.
  const [draft, setDraft] = useState(String(value));
  const [isEditing, setIsEditing] = useState(false);
  const valueAtFocus = useRef(value);

  // Follow `value` unless the field is focused and already showing it (or was
  // just cleared to type a fresh number) — so a +/- tap mid-edit still shows.
  useEffect(() => {
    setDraft((d) => (isEditing && (d === "" || Number(d) === value) ? d : String(value)));
  }, [value, isEditing]);

  const handleChangeText = (text: string) => {
    const digits = toLatinDigits(text).replace(/\D/g, "");
    setDraft(digits);
    // Push in-range numbers through as they are typed, so a tap on a button
    // outside the field (which may not blur it first) still reads the new
    // count. Out-of-range numbers wait for the blur to be clamped.
    const n = Number(digits);
    if (digits && n >= min && (max == null || n <= max)) onChangeValue?.(n);
  };

  const handleFocus = () => {
    valueAtFocus.current = value;
    setIsEditing(true);
  };

  const handleEndEditing = () => {
    setIsEditing(false);
    // Emptied and left. Deleting "15" one digit at a time passes through "1",
    // which was pushed live, so put back what the field held before editing.
    if (!draft) {
      onChangeValue?.(valueAtFocus.current);
      return;
    }
    const typed = Number(draft);
    const next = Math.max(min, max != null ? Math.min(typed, max) : typed);
    if (max != null && typed > max) onExceedMax?.(typed);
    onChangeValue?.(next);
  };

  // The button artwork is a one-sided shape, so the trailing button is mirrored.
  const minusMirrorStyle = isArabic ? styles.mirrored : undefined;
  const plusMirrorStyle = isArabic ? undefined : styles.mirrored;

  return (
    <View style={[styles.container, { flexDirection: flexDir }, style]}>
      {/* Minus Button (Logical Left) */}
      <TouchableOpacity
        onPress={onDecrement}
        activeOpacity={0.8}
        onPressIn={() => {
          // Haptics is best-effort: swallow the rejection so a device with no
          // taptic engine (or an Android throttle) never red-boxes the screen.
          Haptics.selectionAsync().catch(() => {});
        }}
        style={[
          styles.buttonWrapper,
          minusMirrorStyle,
          { width: btnSize, height: btnSize },
        ]}
      >
        <Svg width={btnSize} height={btnSize} viewBox="0 0 29 29" fill="none">
          <Path
            d="M0 14.5C0 6.49187 6.49187 0 14.5 0H25.375C27.377 0 29 1.62297 29 3.625V25.375C29 27.377 27.377 29 25.375 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
            fill="#F64200"
          />
        </Svg>
        <View style={styles.iconOverlay}>
          <View style={styles.iconCircle}>
            <SolarMinusBold size={14} color="white" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Value Block */}
      <View style={[styles.valueBlock, { height: btnSize }]}>
        {onChangeValue ? (
          <InputComponent
            value={draft}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onEndEditing={handleEndEditing}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            selectTextOnFocus
            style={[styles.valueText, styles.valueInput]}
            selectionColor="white"
            accessibilityLabel={isArabic ? "العدد" : "Count"}
          />
        ) : (
          <ThemedText style={styles.valueText}>{value}</ThemedText>
        )}
      </View>

      {/* Plus Button (Logical Right) */}
      <TouchableOpacity
        onPress={onIncrement}
        activeOpacity={0.8}
        onPressIn={() => {
          Haptics.selectionAsync().catch(() => {});
        }}
        style={[
          styles.buttonWrapper,
          plusMirrorStyle,
          { width: btnSize, height: btnSize },
        ]}
      >
        <Svg width={btnSize} height={btnSize} viewBox="0 0 29 29" fill="none">
          <Path
            d="M0 14.5C0 6.49187 6.49187 0 14.5 0H25.375C27.377 0 29 1.62297 29 3.625V25.375C29 27.377 27.377 29 25.375 29H14.5C6.49187 29 0 22.5081 0 14.5Z"
            fill="#F64200"
          />
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
  mirrored: {
    transform: [{ scaleX: -1 }] },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "white",
  },
  valueInput: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    padding: 0,
  },
});
