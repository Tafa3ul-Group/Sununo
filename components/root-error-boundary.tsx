import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { isRTL } from "@/i18n";

/**
 * Expo Router picks this up via the `ErrorBoundary` export in `app/_layout.tsx`
 * and renders it in place of the tree when a render throws.
 *
 * Why it exists: in a release build there is no RedBox, so an uncaught render
 * error leaves the bare Android window background and nothing else — a blank,
 * frozen screen with no way to tell what happened. Showing the message and a
 * retry turns a dead end into a bug report.
 *
 * It deliberately uses nothing but core React Native primitives: no custom
 * fonts, no theme, no hooks, no safe-area or gesture context. Whatever broke
 * the tree may well be one of those, and a fallback that throws is worse than
 * no fallback at all. The one import is `isRTL` — a plain module-level boolean,
 * and `app/_layout.tsx` already loads that module at import time, so it cannot
 * be the thing that failed here.
 */
export function RootErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => Promise<void>;
}) {
  const rtl = isRTL;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
          {rtl ? "حدث خطأ غير متوقع" : "Something went wrong"}
        </Text>

        <Text style={[styles.subtitle, { textAlign: rtl ? "right" : "left" }]}>
          {rtl
            ? "تعذّر عرض هذه الشاشة. جرّب مرة أخرى، وإن تكرر الخطأ أرسل النص أدناه للدعم."
            : "This screen failed to render. Try again — if it keeps happening, send the text below to support."}
        </Text>

        <ScrollView style={styles.detailBox} contentContainerStyle={styles.detailContent}>
          <Text style={styles.detailText} selectable>
            {String(error?.message || error)}
            {error?.stack ? `\n\n${error.stack}` : ""}
          </Text>
        </ScrollView>

        <TouchableOpacity style={styles.button} onPress={retry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{rtl ? "إعادة المحاولة" : "Try again"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Explicit, because the point of this screen is to be visible when the
    // app's own theming is what failed.
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    padding: 24,
  },
  card: { width: "100%" },
  title: { fontSize: 20, fontFamily: "IBMPlexSansArabic-Bold", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6B7280", lineHeight: 22, marginBottom: 16 },
  detailBox: {
    maxHeight: 260,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailContent: { padding: 12 },
  detailText: { fontSize: 11, color: "#B91C1C", lineHeight: 17 },
  button: {
    marginTop: 20,
    backgroundColor: "#0061FE",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontFamily: "IBMPlexSansArabic-SemiBold" },
});
