import { SolarCloseBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { GuestCounter } from "@/components/user/guest-counter";
import { PriceRangeSlider } from "@/components/user/price-range-slider";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Widest range the slider spans, in IQD. */
export const PRICE_MIN = 0;
export const PRICE_MAX = 500_000;
export const PRICE_STEP = 25_000;

/**
 * NOTE: there is deliberately no `cityId` here. The governorate moved to the
 * home header's picker, which is visible on the screen and persisted — two
 * controls for the same thing meant one of them was always silently ignored.
 */
export interface HomeFilters {
  /** Amenity/category keys, prefixed the way the home query expects. */
  amenities: string[];
  minPrice: number | null;
  maxPrice: number | null;
  guests: number | null;
  minRating: number | null;
  minBedrooms: number | null;
}

export const EMPTY_HOME_FILTERS: HomeFilters = {
  amenities: [],
  minPrice: null,
  maxPrice: null,
  guests: null,
  minRating: null,
  minBedrooms: null,
};

/** How many of the filters are actually narrowing the list right now. */
export const countHomeFilters = (f: HomeFilters) =>
  f.amenities.length +
  (f.minPrice != null || f.maxPrice != null ? 1 : 0) +
  (f.guests ? 1 : 0) +
  (f.minRating ? 1 : 0) +
  (f.minBedrooms ? 1 : 0);

export interface HomeFilterOption {
  id: string;
  label: string;
  icon: (isActive: boolean) => React.ReactNode;
  activeColor?: string;
}

interface HomeFiltersSheetProps {
  options: HomeFilterOption[];
  /** Currently applied filters — the sheet opens showing these. */
  value: HomeFilters;
  onApply: (next: HomeFilters) => void;
}

const RATING_STEPS = [3, 4, 4.5];
const BEDROOM_STEPS = [1, 2, 3, 4];

/**
 * The home list's filters, as a sheet.
 *
 * Laid out as labelled sections, each showing its current value beside the
 * heading so the whole state is readable without touching a control. The apply
 * button is pinned below the scroll rather than living at the end of it — on a
 * list this long it would otherwise be somewhere off-screen most of the time.
 * Picks are committed on apply, so the list refetches once instead of per tap.
 */
export const HomeFiltersSheet = React.forwardRef<
  BottomSheetModal,
  HomeFiltersSheetProps
>(({ options, value, onApply }, ref) => {
  const { isRTL, rowDirection } = useDirection();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<HomeFilters>(value);

  const snapPoints = useMemo(() => ["88%"], []);

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

  const set = <K extends keyof HomeFilters>(key: K, next: HomeFilters[K]) =>
    setDraft((prev) => ({ ...prev, [key]: next }));

  const toggleAmenity = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((k) => k !== id)
        : [...prev.amenities, id],
    }));

  const close = () => (ref as any)?.current?.dismiss();

  const activeCount = countHomeFilters(draft);
  const any = isRTL ? "الكل" : "Any";
  const fmt = (n: number) => n.toLocaleString();

  // The min-then-max source order is left alone on purpose: bidi reorders it to
  // "max — min" in Arabic, which is exactly how the mirrored slider below now
  // reads. The one thing bidi gets wrong is the trailing "+" — a lone neutral
  // after a number run, so it lands on the number's LEFT ("+500,000"). An LTR
  // isolate fixes just that token; unlike pinning the whole string it does not
  // disturb the max/min order around it.
  const openEndedMax = `\u2066${fmt(PRICE_MAX)}+\u2069`;

  const priceSummary =
    draft.minPrice == null && draft.maxPrice == null
      ? any
      : `${fmt(draft.minPrice ?? PRICE_MIN)} - ${
          draft.maxPrice == null ? openEndedMax : fmt(draft.maxPrice)
        }`;

  const Section = ({
    title,
    summary,
    children,
  }: {
    title: string;
    summary: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <View style={[styles.sectionHead, { flexDirection: rowDirection }]}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <ThemedText style={styles.sectionSummary} numberOfLines={1}>
          {summary}
        </ThemedText>
      </View>
      {children}
    </View>
  );

  const Chip = ({
    label,
    active,
    onPress,
    children,
    activeColor,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    children?: React.ReactNode;
    activeColor?: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        { flexDirection: rowDirection },
        active && {
          backgroundColor: activeColor || Colors.primary,
          borderColor: activeColor || Colors.primary },
      ]}
    >
      {children}
      <ThemedText
        style={[styles.chipLabel, active && styles.chipLabelActive]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
      enablePanDownToClose
      // v5 measures the content and sizes the sheet to it by default, which
      // collapses the flex layout below and leaves the list unscrollable.
      enableDynamicSizing={false}
      // The sheet mirrors what is applied every time it opens, so dismissing it
      // without applying discards the draft instead of leaking into next time.
      onChange={(index) => {
        if (index >= 0) setDraft(value);
      }}
    >
      <View style={styles.sheet}>
        {/* Header */}
        <View style={[styles.header, { flexDirection: rowDirection }]}>
          <TouchableOpacity
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={isRTL ? "إغلاق" : "Close"}
            style={styles.closeButton}
          >
            <SolarCloseBold size={18} color="#6B7280" />
          </TouchableOpacity>

          <ThemedText style={styles.title}>
            {isRTL ? "فلترة" : "Filter"}
          </ThemedText>

          <TouchableOpacity
            onPress={() => setDraft(EMPTY_HOME_FILTERS)}
            disabled={activeCount === 0}
            hitSlop={8}
            accessibilityRole="button"
          >
            <ThemedText
              style={[styles.clear, activeCount === 0 && styles.clearDisabled]}
            >
              {isRTL ? "مسح الكل" : "Clear all"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <Section title={isRTL ? "السعر" : "Price"} summary={priceSummary}>
            <PriceRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={[draft.minPrice ?? PRICE_MIN, draft.maxPrice ?? PRICE_MAX]}
              currencyLabel={isRTL ? "د.ع" : "IQD"}
              onChange={([low, high]) =>
                setDraft((prev) => ({
                  ...prev,
                  // The ends of the slider mean "no bound", so they are stored
                  // as null and never sent — an unset filter must not exclude a
                  // chalet priced outside the slider's range.
                  minPrice: low <= PRICE_MIN ? null : low,
                  maxPrice: high >= PRICE_MAX ? null : high,
                }))
              }
            />
          </Section>

          <Section
            title={isRTL ? "عدد الضيوف" : "Guests"}
            summary={draft.guests ? `${draft.guests}+` : any}
          >
            <View style={[styles.guestsRow, { flexDirection: rowDirection }]}>
              <ThemedText style={styles.hint}>
                {isRTL ? "تتسع لهذا العدد فأكثر" : "Fits this many or more"}
              </ThemedText>
              <GuestCounter
                value={draft.guests ?? 0}
                onIncrement={() => set("guests", (draft.guests ?? 0) + 1)}
                onDecrement={() => {
                  const next = (draft.guests ?? 0) - 1;
                  set("guests", next > 0 ? next : null);
                }}
              />
            </View>
          </Section>

          <Section
            title={isRTL ? "التقييم" : "Rating"}
            summary={draft.minRating ? `${draft.minRating}+ ★` : any}
          >
            <View style={styles.wrap}>
              {RATING_STEPS.map((step) => (
                <Chip
                  key={step}
                  label={isRTL ? `${step} فأكثر ★` : `${step}+ ★`}
                  active={draft.minRating === step}
                  onPress={() =>
                    set("minRating", draft.minRating === step ? null : step)
                  }
                />
              ))}
            </View>
          </Section>

          <Section
            title={isRTL ? "غرف النوم" : "Bedrooms"}
            summary={draft.minBedrooms ? `${draft.minBedrooms}+` : any}
          >
            <View style={styles.wrap}>
              {BEDROOM_STEPS.map((step) => (
                <Chip
                  key={step}
                  label={isRTL ? `${step}+ غرفة` : `${step}+`}
                  active={draft.minBedrooms === step}
                  onPress={() =>
                    set("minBedrooms", draft.minBedrooms === step ? null : step)
                  }
                />
              ))}
            </View>
          </Section>

          {options.length > 0 && (
            <Section
              title={isRTL ? "المرافق" : "Amenities"}
              summary={
                draft.amenities.length ? `${draft.amenities.length}` : any
              }
            >
              <View style={styles.wrap}>
                {options.map((option) => {
                  const isActive = draft.amenities.includes(option.id);
                  return (
                    <Chip
                      key={option.id}
                      label={option.label}
                      active={isActive}
                      activeColor={option.activeColor}
                      onPress={() => toggleAmenity(option.id)}
                    >
                      {option.icon(isActive)}
                    </Chip>
                  );
                })}
              </View>
            </Section>
          )}
        </BottomSheetScrollView>

        {/* Pinned so the primary action is always one tap away. */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, normalize.height(16)) },
          ]}
        >
          <PrimaryButton
            label={
              activeCount > 0
                ? `${isRTL ? "تطبيق" : "Apply"} (${activeCount})`
                : isRTL
                  ? "تطبيق"
                  : "Apply"
            }
            onPress={() => {
              onApply(draft);
              close();
            }}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
});

HomeFiltersSheet.displayName = "HomeFiltersSheet";

const GUTTER = 20;

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#E5E7EB",
    width: 60 },
  background: {
    borderTopLeftRadius: normalize.radius(24),
    borderTopRightRadius: normalize.radius(24) },
  sheet: {
    flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize.width(GUTTER),
    paddingBottom: normalize.height(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6" },
  closeButton: {
    width: normalize.width(32),
    height: normalize.width(32),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB" },
  title: {
    fontSize: normalize.font(16),
    fontFamily: Fonts.bold,
    color: "#111827" },
  clear: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.medium,
    color: Colors.primary },
  clearDisabled: {
    color: "#D1D5DB" },
  scroll: {
    flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: normalize.width(GUTTER),
    paddingTop: normalize.height(8),
    paddingBottom: normalize.height(16) },
  section: {
    paddingVertical: normalize.height(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6" },
  sectionHead: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: normalize.height(12),
    gap: normalize.width(12) },
  sectionTitle: {
    fontSize: normalize.font(13),
    fontFamily: Fonts.bold,
    color: "#111827" },
  sectionSummary: {
    flexShrink: 1,
    fontSize: normalize.font(12),
    fontFamily: Fonts.medium,
    color: "#6B7280" },
  guestsRow: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: normalize.width(12) },
  hint: {
    flexShrink: 1,
    fontSize: normalize.font(11),
    fontFamily: Fonts.regular,
    color: "#6B7280" },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize.width(8) },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    gap: normalize.width(6),
    minHeight: normalize.height(40),
    paddingHorizontal: normalize.width(14),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white" },
  chipLabel: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.medium,
    color: "#111827" },
  chipLabelActive: {
    color: "white" },
  footer: {
    paddingHorizontal: normalize.width(GUTTER),
    paddingTop: normalize.height(12),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "white" } });
