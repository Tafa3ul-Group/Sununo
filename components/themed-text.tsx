import { Typography } from "@/constants/theme";
import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
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
      case "title":
        return Typography.h1 as TextStyle;
      case "h2":
        return Typography.h2 as TextStyle;
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
    fontFamily: "Tajawal-Regular",
    includeFontPadding: false,
    textAlignVertical: "center",
    paddingVertical: 2,
  },
  defaultSemiBold: {
    fontFamily: "Tajawal-SemiBold",
  },
  link: {
    color: "#2B66FF",
    textDecorationLine: "underline",
    fontFamily: "Tajawal-Regular",
  },
});
