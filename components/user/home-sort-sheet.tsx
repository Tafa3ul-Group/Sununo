import { ThemedText } from "@/components/themed-text";
import {
  SolarCheckCircleBold,
  SolarMapPointBold,
  SolarSortByTimeBold,
  SolarStarBold,
} from "@/components/icons/solar-icons";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type HomeSortKey = "newest" | "rating" | "nearest";

/** The label shown on the dropdown itself. */
export const homeSortLabel = (key: HomeSortKey, isRTL: boolean) =>
  ({
    newest: isRTL ? "الأحدث" : "Newest",
    rating: isRTL ? "الأكثر تقييماً" : "Top rated",
    nearest: isRTL ? "الأقرب لك" : "Nearest",
  })[key];

interface HomeSortSheetProps {
  value: HomeSortKey;
  onSelect: (key: HomeSortKey) => void;
}

/**
 * Sort picker for the home list.
 *
 * A dropdown rather than a row of toggles: the toggles changed width as they
 * switched between active and inactive, which nudged everything beside them on
 * every tap. Here the trigger keeps one size and only its text changes.
 */
export const HomeSortSheet = React.forwardRef<
  BottomSheetModal,
  HomeSortSheetProps
>(({ value, onSelect }, ref) => {
  const { isRTL, rowDirection } = useDirection();
  const snapPoints = useMemo(() => ["35%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const options: { key: HomeSortKey; icon: (active: boolean) => React.ReactNode }[] = [
    {
      key: "newest",
      icon: (active) => (
        <SolarSortByTimeBold
          size={18}
          color={active ? Colors.primary : "#9CA3AF"}
        />
      ),
    },
    {
      key: "rating",
      icon: (active) => (
        <SolarStarBold size={18} color={active ? Colors.primary : "#9CA3AF"} />
      ),
    },
    {
      key: "nearest",
      icon: (active) => (
        <SolarMapPointBold
          size={18}
          color={active ? Colors.primary : "#9CA3AF"}
        />
      ),
    },
  ];

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
      enablePanDownToClose
      enableDynamicSizing={false}
    >
      <BottomSheetView style={styles.content}>
        <ThemedText style={styles.title}>
          {isRTL ? "ترتيب حسب" : "Sort by"}
        </ThemedText>

        {options.map((option) => {
          const isActive = option.key === value;
          return (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.85}
              onPress={() => {
                onSelect(option.key);
                (ref as any)?.current?.dismiss();
              }}
              style={[
                styles.option,
                { flexDirection: rowDirection },
                isActive && styles.optionActive,
              ]}
            >
              {option.icon(isActive)}
              <ThemedText
                style={[styles.label, isActive && styles.labelActive]}
              >
                {homeSortLabel(option.key, isRTL)}
              </ThemedText>
              <View style={{ flex: 1 }} />
              {isActive && (
                <SolarCheckCircleBold size={18} color={Colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

HomeSortSheet.displayName = "HomeSortSheet";

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#E5E7EB",
    width: 60 },
  background: {
    borderTopLeftRadius: normalize.radius(24),
    borderTopRightRadius: normalize.radius(24) },
  content: {
    paddingHorizontal: normalize.width(20),
    paddingBottom: normalize.height(28),
    gap: normalize.height(8) },
  title: {
    fontSize: normalize.font(16),
    fontFamily: Fonts.bold,
    color: "#111827",
    marginBottom: normalize.height(6) },
  option: {
    alignItems: "center",
    gap: normalize.width(10),
    paddingHorizontal: normalize.width(14),
    paddingVertical: normalize.height(12),
    borderRadius: normalize.radius(14),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white" },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "0F" },
  label: {
    fontSize: normalize.font(13),
    fontFamily: Fonts.medium,
    color: "#6B7280" },
  labelActive: {
    color: "#111827",
    fontFamily: Fonts.bold } });
