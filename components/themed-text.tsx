import { Typography } from "@/constants/theme";
import { StyleSheet, Text, type TextProps, type TextStyle, Platform } from "react-native";

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
    | "defaultSemiBold"
    | "link";
};

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

  return <Text style={[styles.base, getStyleByType(), style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "Alexandria-Regular",
    includeFontPadding: false,
    textAlignVertical: "center",
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
