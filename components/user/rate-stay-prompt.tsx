import { SolarStarBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { pickTranslation, useDirection } from "@/i18n";
import { RootState } from "@/store";
import {
  useCheckCanReviewQuery,
  useGetCustomerBookingsQuery,
} from "@/store/api/customerApiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

// Booking ids the popup already offered a rating for — each completed booking
// prompts at most once, ever, no matter how it was answered.
const PROMPTED_BOOKINGS_KEY = "rate_stay_prompted_bookings_v1";

/**
 * One-shot «قيّم إقامتك» popup on the customer home: when a completed booking
 * has no review yet (same derivation as the pending tab in
 * app/(customer)/reviews.tsx) and the server confirms eligibility, invite the
 * user to rate that chalet. Tapping through opens the chalet page with
 * `openReview=1`, which auto-opens the existing review sheet.
 *
 * Self-contained (queries + storage + sheet) so the home screen only renders
 * `<RateStayPrompt />`. Gorhom bottom sheet — the project standard; never a
 * native Modal (a gorhom sheet renders BEHIND those).
 */
export function RateStayPrompt() {
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const router = useRouter();
  const isFocused = useIsFocused();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { userType } = useSelector((state: RootState) => state.auth);
  const skip = userType !== "customer";

  // null until storage has been read — never prompt before knowing history.
  const [promptedIds, setPromptedIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (skip) return;
    AsyncStorage.getItem(PROMPTED_BOOKINGS_KEY)
      .then((raw) => setPromptedIds(raw ? JSON.parse(raw) : []))
      .catch(() => setPromptedIds([]));
  }, [skip]);

  // Same cache entry as the reviews screen's "pending" tab (page is stripped
  // from the cache key), so this adds no extra request when both are mounted.
  const { data: completedBookings } = useGetCustomerBookingsQuery(
    { status: "completed", page: 1, limit: 50 },
    { skip },
  );

  // The most recent completed booking that was never prompted before. There is
  // no review flag on this payload — the server decides eligibility below, so
  // only one booking is ever probed at a time.
  const candidate = useMemo(() => {
    if (!promptedIds) return undefined;
    const completed: any[] = completedBookings?.data || [];
    return [...completed]
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .find((b: any) => b.chalet?.id && !promptedIds.includes(b.id));
  }, [completedBookings, promptedIds]);

  // `currentData`, not `data`: while the query moves to the next candidate's
  // chalet, `data` still holds the previous chalet's verdict — acting on that
  // would consume a booking based on the wrong chalet's eligibility.
  const { currentData: canReviewData } = useCheckCanReviewQuery(
    candidate?.chalet?.id,
    { skip: skip || !candidate },
  );

  const markPrompted = useCallback((bookingId: string) => {
    setPromptedIds((prev) => {
      const next = [...(prev || []), bookingId];
      AsyncStorage.setItem(PROMPTED_BOOKINGS_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  }, []);

  // Frozen at present-time so the sheet keeps its chalet while `candidate`
  // advances underneath it.
  const [promptedChalet, setPromptedChalet] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const hasPresentedRef = useRef(false);
  const presentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // The home screen stays mounted under whatever the user navigated to, so
    // without this the sheet could surface over an unrelated screen — or fight
    // the review sheet that a "rate your stay" push just auto-opened on the
    // chalet page (one gorhom provider: the newer sheet minimizes the older).
    if (!isFocused) return;
    if (skip || !candidate || !canReviewData || hasPresentedRef.current) return;
    if (!canReviewData.canReview) {
      // Ineligible (e.g. the chalet was already reviewed through another
      // booking) — consume this candidate so the next one gets its turn.
      markPrompted(candidate.id);
      return;
    }
    hasPresentedRef.current = true;
    markPrompted(candidate.id);
    setPromptedChalet({
      id: candidate.chalet.id,
      name:
        pickTranslation(candidate.chalet, isRTL) ||
        t("ratePrompt.fallbackChalet"),
    });
    // Small delay so the popup never fights the home screen's entry work.
    // Timer lives in a ref (cleared on unmount below) because this effect's
    // deps change right after markPrompted — a normal cleanup would cancel it.
    presentTimerRef.current = setTimeout(
      () => sheetRef.current?.present(),
      700,
    );
  }, [skip, candidate, canReviewData, isRTL, markPrompted, t, isFocused]);

  useEffect(
    () => () => {
      if (presentTimerRef.current) clearTimeout(presentTimerRef.current);
    },
    [],
  );

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

  const handleRateNow = () => {
    sheetRef.current?.dismiss();
    if (promptedChalet) {
      router.push(`/chalet-details/${promptedChalet.id}?openReview=1`);
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing={true}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.iconWrap}>
          <SolarStarBold size={34} color="#FFB800" />
        </View>

        <ThemedText style={styles.title}>{t("ratePrompt.title")}</ThemedText>

        <ThemedText style={styles.subtitle}>
          {t("ratePrompt.message", {
            chalet: promptedChalet?.name || t("ratePrompt.fallbackChalet"),
          })}
        </ThemedText>

        <View style={styles.actions}>
          {/* Rate now */}
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={handleRateNow}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.rateText}>
              {t("ratePrompt.rateNow")}
            </ThemedText>
          </TouchableOpacity>

          {/* Later */}
          <TouchableOpacity
            style={styles.laterBtn}
            onPress={() => sheetRef.current?.dismiss()}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.laterText}>
              {t("ratePrompt.later")}
            </ThemedText>
          </TouchableOpacity>
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
  background: {
    borderRadius: 36,
    backgroundColor: "white",
  },
  content: {
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFF7E0",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  rateBtn: {
    width: "100%",
    backgroundColor: "#15AB64",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  rateText: {
    color: "white",
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-Medium",
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
    fontFamily: "IBMPlexSansArabic-Medium",
  },
});
