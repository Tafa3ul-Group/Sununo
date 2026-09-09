import { SolarCheckCircleBoldDuotone, SolarMapPointBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { pickTranslation, useDirection } from "@/i18n";
import {
  useGetCityNamesQuery,
  useGetRegionsByCityQuery,
} from "@/store/api/customerApiSlice";
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
  /** null === "كل الأقضية" within the chosen governorate. */
  selectedRegionId: string | null;
  onSelect: (
    city: { id: string | null; name: string | null },
    region: { id: string | null; name: string | null },
  ) => void;
}

/**
 * The governorate → قضاء picker behind the home header.
 *
 * It replaced the header's search pill, so this is now the customer's only
 * statement of "where I am browsing" — the featured strip and the recommended
 * list both follow it. Search itself did not move: the Explore tab and the
 * middle tab's search sheet are unchanged.
 *
 * The قضاء list appears under the governorate once one is chosen, rather than
 * on a second screen: it is a short list, and the pair reads as one answer to
 * "where". A governorate on its own means "the whole governorate", which is
 * why picking a city commits immediately and only the district row needs a
 * second tap.
 */
export const HomeCitySheet = forwardRef<BottomSheetModal, HomeCitySheetProps>(
  function HomeCitySheet({ selectedCityId, selectedRegionId, onSelect }, ref) {
    const { isRTL, rowDirection, textAlign } = useDirection();
    const { data: citiesRaw, isLoading } = useGetCityNamesQuery(undefined);

    const cities = useMemo(
      () => (Array.isArray(citiesRaw) ? citiesRaw : []).filter(Boolean),
      [citiesRaw],
    );

    // `skip` rather than a conditional hook: with no governorate chosen there
    // is no قضاء list to fetch, and «كل المحافظات» has no districts of its own.
    const { data: regionsRaw, isFetching: regionsFetching } =
      useGetRegionsByCityQuery(selectedCityId as string, { skip: !selectedCityId });

    const regions = useMemo(
      () => (Array.isArray(regionsRaw) ? regionsRaw : []).filter(Boolean),
      [regionsRaw],
    );

    const selectedCityName = useMemo(() => {
      const match = cities.find((c: any) => c?.id === selectedCityId);
      return match ? pickTranslation(match, isRTL) || match.name : null;
    }, [cities, selectedCityId, isRTL]);

    // Choosing a governorate always resets the قضاء: a district from the
    // previous one would filter every chalet away.
    const cityRow = (
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
          onPress={() =>
            onSelect({ id, name: id ? label : null }, { id: null, name: null })
          }
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

    const regionRow = (id: string | null, label: string, key: string) => {
      const isSelected = (selectedRegionId ?? null) === id;
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.row,
            styles.regionRow,
            { flexDirection: rowDirection },
            isSelected && styles.rowActive,
          ]}
          activeOpacity={0.8}
          onPress={() =>
            onSelect(
              { id: selectedCityId, name: selectedCityName },
              { id, name: id ? label : null },
            )
          }
        >
          <ThemedText
            style={[styles.rowLabel, isSelected && styles.rowLabelActive, { textAlign }]}
          >
            {label}
          </ThemedText>
          {isSelected && (
            <SolarCheckCircleBoldDuotone
              size={normalize.width(18)}
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
                ? "الشاليهات المميّزة والمقترحة تتبع المحافظة المختارة، وتكدر تضيّقها على قضاء."
                : "Featured and recommended chalets follow the governorate you pick — narrow it to a district if you like."}
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
                {cityRow(null, isRTL ? "كل المحافظات" : "All governorates", "all")}
                {cities.map((city: any) =>
                  cityRow(city.id, pickTranslation(city, isRTL) || city.name, city.id),
                )}

                {selectedCityId ? (
                  <View style={styles.regionsBlock}>
                    <ThemedText style={[styles.sectionLabel, { textAlign }]}>
                      {isRTL
                        ? `أقضية ${selectedCityName ?? ""}`.trim()
                        : `Districts of ${selectedCityName ?? ""}`.trim()}
                    </ThemedText>

                    {regionsFetching && regions.length === 0 ? (
                      <View style={styles.loading}>
                        <ActivityIndicator color={Colors.primary} />
                      </View>
                    ) : regions.length === 0 ? (
                      <ThemedText style={[styles.emptyRegions, { textAlign }]}>
                        {isRTL
                          ? "ماكو أقضية مسجّلة لهذه المحافظة."
                          : "No districts recorded for this governorate."}
                      </ThemedText>
                    ) : (
                      <>
                        {regionRow(null, isRTL ? "كل الأقضية" : "All districts", "all-regions")}
                        {regions.map((region: any) =>
                          regionRow(
                            region.id,
                            pickTranslation(region, isRTL) || region.name,
                            region.id,
                          ),
                        )}
                      </>
                    )}
                  </View>
                ) : null}
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
  regionsBlock: { marginTop: 10, gap: 6 },
  sectionLabel: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Bold",
    color: "#64748B",
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  // Inset and lighter than a governorate row, so the two levels stay legible
  // in one scroll.
  regionRow: {
    marginHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },
  emptyRegions: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#94A3B8",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
