import { Typography } from "@/constants/theme";
import {
  I18nManager,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from "react-native";

export type ThemedTextProps = TextProps & {
  type?:
    | "title"
    | "description"
    | "subtitle"
    | "h1"
    | "h2"
    | "body"
    | "caption"
    | "price"
    | "rating"
    | "default"
    | "defaultSemiBold"
    | "link";
};

/**
 * Flattens a style array/object and injects a lineHeight if fontSize is
 * present but lineHeight is missing. Ratio 1.55 works well for Arabic fonts
 * (Alexandria / LamaSans) which have tall ascenders/descenders.
 */
function withAutoLineHeight(style: TextProps["style"]): TextStyle {
  // Flatten nested arrays into a single object
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};

  if (flat.fontSize !== undefined && flat.lineHeight === undefined) {
    return { ...flat, lineHeight: Math.ceil(flat.fontSize * 1.55) };
  }
  return flat;
}

export function ThemedText({
  style,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const getStyleByType = (): TextStyle => {
    switch (type) {
      case "h1":
        return Typography.h1 as TextStyle;
      case "title":
        return Typography.title as TextStyle;
      case "h2":
        return Typography.h2 as TextStyle;
      case "description":
        return Typography.description as TextStyle;
      case "body":
      case "default":
        return Typography.body as TextStyle;
      case "subtitle":
        return Typography.subtitle as TextStyle;
      case "caption":
        return Typography.caption as TextStyle;
      case "price":
        return Typography.price as TextStyle;
      case "rating":
        return Typography.rating as TextStyle;
      case "defaultSemiBold":
        return styles.defaultSemiBold as TextStyle;
      case "link":
        return styles.link as TextStyle;
      default:
        return Typography.body as TextStyle;
    }
  };

  return (
    <Text
      style={[styles.base, getStyleByType(), withAutoLineHeight(style)]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "Alexandria-Regular",
    includeFontPadding: false,
    textAlignVertical: "center",
    writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  defaultSemiBold: {
    fontFamily: "Alexandria-SemiBold",
  },
  link: {
    color: "#2B66FF",
    textDecorationLine: "underline",
    fontFamily: "Alexandria-Regular",
  },
});
