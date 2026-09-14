import {
  SolarAltArrowDownLinear,
  SolarCheckCircleBoldDuotone,
  SolarMapPointBold,
} from "@/components/icons/solar-icons";
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
import React, { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
 * ── Why the districts expand in place ──────────────────────────────────────
 *
 * They used to sit in one block BELOW all eighteen governorates. That is where
 * the feature went to die: picking a governorate looked like the end of the
 * interaction, and nothing on screen suggested there was more eighteen rows
 * further down. Someone meeting the app for the first time never found it.
 *
 * Opening a governorate now reveals its أقضية directly beneath the row that was
 * just tapped — where the finger already is. A drill-down screen would also
 * solve discovery, but it would charge two taps for the common case ("just
 * البصرة"), and picking a governorate alone is what most people want. So the
 * tap still commits the governorate immediately, and the districts appear as an
 * optional refinement rather than a question that must be answered.
 *
 * The chevron is the promise that something is inside; the district count next
 * to it says how much. Districts render as chips rather than rows because
 * thirteen full-width rows are ~600pt of scrolling, while the same thirteen
 * chips fit the visible sheet without moving at all.
 */
export const HomeCitySheet = forwardRef<BottomSheetModal, HomeCitySheetProps>(
  function HomeCitySheet({ selectedCityId, selectedRegionId, onSelect }, ref) {
    const { isRTL, rowDirection, textAlign } = useDirection();

    /**
     * The sheet closes itself rather than letting the caller do it on every
     * pick. Choosing a governorate is only half an answer now — its أقضية open
     * underneath and the customer may want one — so that tap must leave the
     * sheet standing. Only a final choice (a قضاء, or «كل المحافظات») closes it.
     */
    const close = useCallback(() => (ref as any)?.current?.dismiss(), [ref]);
    const { data: citiesRaw, isLoading } = useGetCityNamesQuery(undefined);

    const cities = useMemo(
      () => (Array.isArray(citiesRaw) ? citiesRaw : []).filter(Boolean),
      [citiesRaw],
    );

    /**
     * Which governorate is open. Seeded from the current selection so a
     * returning customer sees their own قضاء straight away instead of a closed
     * list that hides the choice they already made.
     */
    const [expandedCityId, setExpandedCityId] = useState<string | null>(selectedCityId);
    const lastSeededSelection = useRef(selectedCityId);
    if (lastSeededSelection.current !== selectedCityId) {
      lastSeededSelection.current = selectedCityId;
      setExpandedCityId(selectedCityId);
    }

    // `skip` rather than a conditional hook: a closed list has nothing to fetch,
    // and «كل المحافظات» has no districts of its own.
    const { data: regionsRaw, isFetching: regionsFetching } =
      useGetRegionsByCityQuery(expandedCityId as string, { skip: !expandedCityId });

    const regions = useMemo(
      () => (Array.isArray(regionsRaw) ? regionsRaw : []).filter(Boolean),
      [regionsRaw],
    );

    // Scrolls the opened governorate up to the top of the list so its districts
    // occupy the space below it, instead of unfolding off the bottom edge.
    const scrollRef = useRef<any>(null);
    const rowOffsets = useRef<Record<string, number>>({});

    const openCity = useCallback((cityId: string | null) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedCityId(cityId);
      if (!cityId) return;
      // After the row heights settle, not before.
      requestAnimationFrame(() => {
        const y = rowOffsets.current[cityId];
        if (typeof y === "number") {
          scrollRef.current?.scrollTo?.({ y: Math.max(0, y - 8), animated: true });
        }
      });
    }, []);

    const handleCityPress = useCallback(
      (id: string | null, label: string) => {
        // Tapping the open governorate again just folds it away; it is already
        // the selection, so there is nothing to re-commit.
        if (id && id === expandedCityId) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpandedCityId(null);
          return;
        }
        // A new governorate always clears the قضاء: a district from the previous
        // one would filter every chalet away.
        onSelect({ id, name: id ? label : null }, { id: null, name: null });
        // «كل المحافظات» has nothing to refine, so it is a complete answer.
        if (!id) { close(); return; }
        openCity(id);
      },
      [expandedCityId, onSelect, openCity, close],
    );

    const cityRow = (id: string | null, label: string, key: string) => {
      const isSelected = selectedCityId === id;
      const isOpen = !!id && expandedCityId === id;
      const showCount = isOpen && regions.length > 0;

      return (
        <View
          key={key}
          onLayout={(e) => {
            if (id) rowOffsets.current[id] = e.nativeEvent.layout.y;
          }}
        >
          <TouchableOpacity
            style={[styles.row, { flexDirection: rowDirection }, isSelected && styles.rowActive]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, expanded: isOpen }}
            onPress={() => handleCityPress(id, label)}
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

            {showCount && (
              <ThemedText style={styles.rowCount}>
                {isRTL ? `${regions.length} قضاء` : `${regions.length}`}
              </ThemedText>
            )}

            {isSelected && (
              <SolarCheckCircleBoldDuotone
                size={normalize.width(20)}
                color={Colors.primary}
              />
            )}

            {/* Only governorates open; «كل المحافظات» has nothing inside. */}
            {!!id && (
              <View style={[styles.chevron, isOpen && styles.chevronOpen]}>
                <SolarAltArrowDownLinear
                  size={normalize.width(16)}
                  color={isSelected ? Colors.primary : "#94A3B8"}
                />
              </View>
            )}
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.regionsPanel}>
              {regionsFetching && regions.length === 0 ? (
                <View style={styles.regionsLoading}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                </View>
              ) : regions.length === 0 ? (
                <ThemedText style={[styles.emptyRegions, { textAlign }]}>
                  {isRTL
                    ? "ماكو أقضية مسجّلة لهذه المحافظة."
                    : "No districts recorded for this governorate."}
                </ThemedText>
              ) : (
                // Plain `row`: I18nManager already mirrors it in Arabic, so a
                // `row-reverse` here double-flips and the chips start from the
                // LEFT. Same rule as the governorate rows above.
                <View style={[styles.regionsWrap, { flexDirection: rowDirection }]}>
                  {regionChip(null, isRTL ? "كل الأقضية" : "All districts", "all-regions", label)}
                  {regions.map((region: any) =>
                    regionChip(
                      region.id,
                      pickTranslation(region, isRTL) || region.name,
                      region.id,
                      label,
                    ),
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      );
    };

    const regionChip = (
      id: string | null,
      label: string,
      key: string,
      cityLabel: string,
    ) => {
      const isSelected = (selectedRegionId ?? null) === id;
      return (
        <TouchableOpacity
          key={key}
          style={[styles.regionChip, isSelected && styles.regionChipActive]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          onPress={() => {
            onSelect(
              { id: expandedCityId, name: cityLabel },
              { id, name: id ? label : null },
            );
            close();
          }}
        >
          <ThemedText
            style={[styles.regionChipLabel, isSelected && styles.regionChipLabelActive]}
          >
            {label}
          </ThemedText>
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
              {isRTL ? "وين تريد تحجز؟" : "Where are you looking?"}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { textAlign }]}>
              {isRTL
                ? "اختر محافظة، وتنفتح لك أقضيتها حتى تضيّق أكثر."
                : "Pick a governorate — its districts open up so you can narrow it down."}
            </ThemedText>
          </View>

          <BottomSheetScrollView
            ref={scrollRef}
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
  rowCount: {
    fontSize: normalize.font(10),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#94A3B8",
  },
  // Points down when closed, up when open — the one visual promise that a row
  // has something inside it.
  chevron: { transform: [{ rotate: "0deg" }] },
  chevronOpen: { transform: [{ rotate: "180deg" }] },

  regionsPanel: {
    marginTop: 6,
    marginHorizontal: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: normalize.radius(14),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  regionsLoading: { paddingVertical: 14, alignItems: "center" },
  // Wrapped chips: thirteen districts fit the visible sheet, where thirteen
  // full-width rows would be another screen of scrolling.
  regionsWrap: { flexWrap: "wrap", gap: 8 },
  regionChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  regionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  regionChipLabel: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#475569",
  },
  regionChipLabelActive: {
    color: Colors.primary,
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  emptyRegions: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#94A3B8",
    paddingVertical: 4,
  },
});
