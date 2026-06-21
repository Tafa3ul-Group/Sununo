import { ThemedText } from "@/components/themed-text";
import { useAppUpdate } from "@/hooks/use-app-update";
import { useDirection } from "@/i18n";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useRef } from "react";
import {
  BackHandler,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * App-wide update gate. Mounted once at the root. When the installed version is
 * older than the store version (from GET /config), it presents a bottom sheet:
 *   • optional update → dismissible ("لاحقاً")
 *   • forced update   → non-dismissible (no backdrop tap, no pan-down, no back)
 */
export function AppUpdateGate() {
  const { isRTL } = useDirection();
  const { updateAvailable, isForced, storeUrl, latestVersion } = useAppUpdate();
  const ref = useRef<BottomSheetModal>(null);

  // Present when an update is available; dismiss when it no longer is.
  useEffect(() => {
    if (updateAvailable) ref.current?.present();
    else ref.current?.dismiss();
  }, [updateAvailable]);

  // Block the Android hardware back button while a forced update is showing.
  useEffect(() => {
    if (!updateAvailable || !isForced) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [updateAvailable, isForced]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={isForced ? 0.75 : 0.5}
        pressBehavior={isForced ? "none" : "close"}
      />
    ),
    [isForced],
  );

  const handleUpdate = () => {
    if (!storeUrl) return;
    Linking.openURL(storeUrl).catch(() => {});
  };

  const handleLater = () => ref.current?.dismiss();

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={isForced ? styles.indicatorHidden : styles.indicator}
      backgroundStyle={styles.background}
      enablePanDownToClose={!isForced}
      // When forced, swallow programmatic dismiss attempts so the gate stays up.
      onDismiss={() => {
        if (isForced && updateAvailable) ref.current?.present();
      }}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.iconCircle}>
          <ThemedText style={styles.iconGlyph}>↑</ThemedText>
        </View>

        <ThemedText style={styles.title}>
          {isRTL ? "تحديث متوفّر" : "Update available"}
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          {isForced
            ? isRTL
              ? "يجب تحديث التطبيق إلى أحدث إصدار للمتابعة."
              : "You must update to the latest version to continue."
            : isRTL
              ? "صدر إصدار جديد من التطبيق. حدّث الآن للحصول على آخر الميزات."
              : "A new version is available. Update now for the latest features."}
        </ThemedText>

        {!!latestVersion && (
          <ThemedText style={styles.version}>
            {isRTL ? `الإصدار ${latestVersion}` : `Version ${latestVersion}`}
          </ThemedText>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.updateText}>
              {isRTL ? "تحديث الآن" : "Update now"}
            </ThemedText>
          </TouchableOpacity>

          {!isForced && (
            <TouchableOpacity
              style={styles.laterBtn}
              onPress={handleLater}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.laterText}>
                {isRTL ? "لاحقاً" : "Later"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#E5E7EB",
    width: 60,
  },
  indicatorHidden: {
    backgroundColor: "transparent",
    width: 60,
  },
  background: {
    borderRadius: 36,
    backgroundColor: "white",
  },
  content: {
    padding: 24,
    paddingBottom: 32,
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconGlyph: {
    fontSize: 30,
    color: "#045CFB",
    fontFamily: "Alexandria-Medium",
  },
  title: {
    fontSize: 18,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  version: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: "#9CA3AF",
  },
  actions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  updateBtn: {
    width: "100%",
    backgroundColor: "#045CFB",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  updateText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
  laterBtn: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  laterText: {
    color: "#374151",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
});
