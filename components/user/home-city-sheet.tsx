import { SolarCheckCircleBoldDuotone, SolarMapPointBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { pickTranslation, useDirection } from "@/i18n";
import { useGetCityNamesQuery } from "@/store/api/customerApiSlice";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
);

// Module constant: a fresh array each render re-triggers gorhom's detent maths.
const SNAP_POINTS = ["70%"];

export interface HomeCitySheetProps {
  /** null === "كل المحافظات". */
  selectedCityId: string | null;
  onSelect: (city: { id: string | null; name: string | null }) => void;
}

/**
 * The governorate picker behind the home header.
 *
 * It replaced the header's search pill, so this is now the customer's only
 * statement of "where I am browsing" — the featured strip and the recommended
 * list both follow it. Search itself did not move: the Explore tab and the
 * middle tab's search sheet are unchanged.
 */
export const HomeCitySheet = forwardRef<BottomSheetModal, HomeCitySheetProps>(
  function HomeCitySheet({ selectedCityId, onSelect }, ref) {
    const { isRTL, rowDirection, textAlign } = useDirection();
    const { data: citiesRaw, isLoading } = useGetCityNamesQuery(undefined);

    const cities = useMemo(
      () => (Array.isArray(citiesRaw) ? citiesRaw : []).filter(Boolean),
      [citiesRaw],
    );

    const row = (
      id: string | null,
      label: string,
      key: string,
    ) => {
      const isSelected = selectedCityId === id;
      return (
        <TouchableOpacity
          key={key}
          style={[styles.row, { flexDirection: rowDirection }, isSelected && styles.rowActive]}
          activeOpacity={0.8}
          onPress={() => onSelect({ id, name: id ? label : null })}
        >
          <View style={[styles.rowIcon, isSelected && styles.rowIconActive]}>
            <SolarMapPointBold
              size={normalize.width(16)}
              color={isSelected ? "#FFFFFF" : "#64748B"}
            />
          </View>
          <ThemedText
            style={[styles.rowLabel, isSelected && styles.rowLabelActive, { textAlign }]}
          >
            {label}
          </ThemedText>
          {isSelected && (
            <SolarCheckCircleBoldDuotone
              size={normalize.width(20)}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={SNAP_POINTS}
        // gorhom v5 defaults this to true, which sizes the sheet to its content
        // and collapses a `flex: 1` body to nothing.
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText style={[styles.title, { textAlign }]}>
              {isRTL ? "اختر المحافظة" : "Choose a governorate"}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { textAlign }]}>
              {isRTL
                ? "الشاليهات المميّزة والمقترحة تتبع المحافظة المختارة."
                : "Featured and recommended chalets follow the governorate you pick."}
            </ThemedText>
          </View>

          <BottomSheetScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && cities.length === 0 ? (
              <View style={styles.loading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : (
              <>
                {row(null, isRTL ? "كل المحافظات" : "All governorates", "all")}
                {cities.map((city: any) =>
                  row(city.id, pickTranslation(city, isRTL) || city.name, city.id),
                )}
              </>
            )}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 2,
  },
  title: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Bold",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 6, paddingBottom: 32 },
  loading: { paddingVertical: 40, alignItems: "center" },
  row: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: normalize.radius(14),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  rowActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  rowIcon: {
    width: normalize.width(30),
    height: normalize.width(30),
    borderRadius: normalize.radius(10),
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconActive: { backgroundColor: Colors.primary },
  rowLabel: {
    flex: 1,
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#334155",
  },
  rowLabelActive: { color: Colors.primary },
});
