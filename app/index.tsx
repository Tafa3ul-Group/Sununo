import { MotionIcon } from "@/components/icons/motion-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { AppDispatch, RootState } from "@/store";
import { apiSlice } from "@/store/api/apiSlice";
import { selectLandingSection, updateUser } from "@/store/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

const { width, height } = Dimensions.get("window");

/** Written once the splash animation has played; it never plays again after. */
const SPLASH_SEEN_KEY = "sununo:splashSeen";

// How long to wait before each retry of the boot reconciliation. No per-request
// timeout on top of these: a slow reply is still a correct one, and cutting it
// short is how we'd end up guessing the section again.
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

// Total budget for the whole reconciliation. An owner on a bad connection gets a
// stale-but-persisted section rather than an endless splash screen.
const RECONCILE_BUDGET_MS = 7000;

// Long enough that a normal reconciliation finishes without ever showing it.
const HOLD_INDICATOR_DELAY_MS = 1200;

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isRTL } = useDirection();
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  // null while the flag is still being read — nothing renders until we know
  // whether this is the very first launch.
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean | null>(null);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const landing = useSelector(selectLandingSection);
  // Is there anything at all to fall back on if the server can't be reached?
  const hasPersistedSection = useSelector(
    (state: RootState) =>
      state.auth.userType != null || state.auth.accountType != null,
  );

  // ── Boot reconciliation ───────────────────────────────────────────────────
  // The active section is a CLIENT value, and until it is checked against the
  // server's account type it is only a guess — a chalet owner whose session was
  // signed in with the tenant toggle untouched, or moved by a notification tap,
  // is one such wrong guess. So ask `GET /auth/me` before routing anywhere.
  const [reconciled, setReconciled] = useState(false);
  const [reconcileFailed, setReconcileFailed] = useState(false);
  const [showHoldIndicator, setShowHoldIndicator] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    // Nobody signed in — there is no account to reconcile against.
    if (!isAuthenticated) {
      setReconciled(true);
      return;
    }

    setReconciled(false);
    setReconcileFailed(false);

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + RECONCILE_BUDGET_MS;

    const attempt = async (index: number) => {
      const request = dispatch(
        apiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true }),
      );
      try {
        const me = await request.unwrap();
        if (cancelled) return;
        // Same unwrap as hooks/useSyncAuthUser — some responses arrive inside a
        // `data` envelope, and merging that envelope would leave `type` unread.
        dispatch(updateUser((me as any)?.data ?? me));
        setReconciled(true);
      } catch {
        // A dead token already signed itself out inside the api slice, which
        // flips `isAuthenticated` and re-runs this effect; everything else is a
        // network problem worth retrying.
        if (cancelled) return;
        const delay = RETRY_BACKOFF_MS[index];
        if (delay == null || Date.now() + delay >= deadline) {
          setReconcileFailed(true);
          return;
        }
        retryTimer = setTimeout(() => {
          if (!cancelled) attempt(index + 1);
        }, delay);
      } finally {
        request.unsubscribe();
      }
    };

    attempt(0);
    // Backstop for a request that neither resolves nor rejects in time.
    const budgetTimer = setTimeout(() => {
      if (!cancelled) setReconcileFailed(true);
    }, RECONCILE_BUDGET_MS);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearTimeout(budgetTimer);
    };
  }, [isAuthenticated, dispatch, retryNonce]);

  // Only surface a spinner if the hold is long enough to look like a freeze.
  useEffect(() => {
    if (reconciled || !isAuthenticated) {
      setShowHoldIndicator(false);
      return;
    }
    const timer = setTimeout(
      () => setShowHoldIndicator(true),
      HOLD_INDICATOR_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [reconciled, isAuthenticated, retryNonce]);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(SPLASH_SEEN_KEY)
      .then((seen) => {
        if (cancelled) return;
        setHasSeenSplash(!!seen);
        // Seen before: skip straight past the splash into the app.
        if (seen) setIsAnimationDone(true);
      })
      .catch(() => {
        // Storage unreachable — fall back to playing it.
        if (!cancelled) setHasSeenSplash(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // With nothing reconciled AND nothing persisted, the only section left to pick
  // is a guess — and the guess would be "customer", which is the bug this exists
  // to stop. Hold, and let them retry.
  const isStranded =
    isAuthenticated && !reconciled && reconcileFailed && !hasPersistedSection;

  useEffect(() => {
    if (!isAnimationDone) return;
    // Hold the splash until the server has had its say (or run out of time).
    if (isAuthenticated && !reconciled && !reconcileFailed) return;
    if (isStranded) return;

    let targetPath: any;

    if (!isAuthenticated && landing !== "guest") {
      targetPath = "/(auth)/login";
    } else if (landing === "owner") {
      targetPath = "/(tabs)/(dashboard)/home";
    } else {
      targetPath = "/(tabs)/(customer)";
    }

    const navTimer = setTimeout(() => {
      router.replace(targetPath);
    }, 100);

    return () => clearTimeout(navTimer);
  }, [
    isAnimationDone,
    isAuthenticated,
    landing,
    reconciled,
    reconcileFailed,
    isStranded,
  ]);

  const handleRetry = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  return (
    <View style={styles.container}>
      {hasSeenSplash === false && (
        <MotionIcon
          name="splash"
          size={Math.max(width, height)}
          loop={false}
          autoPlay={true}
          resizeMode="cover"
          onAnimationFinish={() => {
            setIsAnimationDone(true);
            AsyncStorage.setItem(SPLASH_SEEN_KEY, "1").catch(() => {});
          }}
          style={styles.lottie}
        />
      )}

      {isStranded ? (
        <View style={styles.holdBox}>
          <ThemedText style={styles.holdText}>
            {isRTL
              ? "تعذّر الاتصال بالخادم. تحقّق من الإنترنت وحاول مرة أخرى."
              : "Couldn't reach the server. Check your connection and try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.retryButton}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <ThemedText style={styles.retryLabel}>
              {isRTL ? "إعادة المحاولة" : "Try again"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : showHoldIndicator ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center" },
  lottie: {
    width: width,
    height: height },
  holdBox: {
    position: "absolute",
    paddingHorizontal: normalize.width(32),
    alignItems: "center",
    gap: normalize.height(16) },
  holdText: {
    fontSize: normalize.font(14),
    fontFamily: Fonts.regular,
    color: "#4B5563",
    textAlign: "center" },
  retryButton: {
    paddingHorizontal: normalize.width(24),
    paddingVertical: normalize.height(10),
    borderRadius: normalize.width(10),
    backgroundColor: Colors.primary },
  retryLabel: {
    fontSize: normalize.font(14),
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF" } });
