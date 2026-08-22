import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";

interface PressableScaleProps extends TouchableOpacityProps {
  /**
   * Kept so the existing call sites still type-check. The press-scale motion it
   * used to drive was removed app-wide — the opacity dip is the tap feedback now.
   */
  scaleTo?: number;
}

/**
 * A plain pressable. It used to shrink and spring back on every press; that
 * motion read as the whole UI twitching, so the component now only dips its
 * opacity, which is feedback enough that the tap registered.
 */
export function PressableScale({
  scaleTo: _scaleTo,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} {...rest} style={style}>
      {children}
    </TouchableOpacity>
  );
}
