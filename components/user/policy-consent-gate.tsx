import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import { SolarShieldBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PolicyModal } from "@/components/user/policy-modal";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { RootState } from "@/store";
import {
  Policy,
  PolicyType,
  useAcceptPoliciesMutation,
  useGetPendingPoliciesQuery,
} from "@/store/api/apiSlice";
import { logout } from "@/store/authSlice";

// An admin can publish new wording at any moment; poll so a session that is
// already open picks it up instead of only catching it on the next cold start.
// (The slice also refetches on foreground and reconnect.)
const POLL_INTERVAL_MS = 5 * 60 * 1000;

/**
 * App-wide legal-consent gate. Mounted once at the root, next to the update
 * gate — so whatever screen the user is on, an updated policy surfaces there.
 *
 * `GET /policies/me/pending` returns every document whose CURRENT version this
 * account has not agreed to (an admin edit bumped the version, or the account
 * predates the document). While that list is non-empty the app is blocked: the
 * screen cannot be dismissed, and each document has to be opened and read to
 * the end before the continue button unlocks. Signing out is the only way past
 * it — refusing the terms shouldn't strand someone inside the app.
 */
export function PolicyConsentGate() {
  const { isRTL, direction, textAlign } = useDirection();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { isAuthenticated, userType } = useSelector(
    (state: RootState) => state.auth,
  );
  // Guests have no account to attach consent to; they agree when they sign up.
  const enabled = isAuthenticated && userType !== "guest";

  const { data, refetch } = useGetPendingPoliciesQuery(undefined, {
    skip: !enabled,
    pollingInterval: POLL_INTERVAL_MS,
  });
  const [acceptPolicies, { isLoading: isSubmitting }] =
    useAcceptPoliciesMutation();

  const pending: Policy[] = useMemo(
    () => (enabled ? (data?.policies ?? []) : []),
    [enabled, data],
  );
  const visible = pending.length > 0;

  // type → the version the user agreed to in this session.
  const [agreed, setAgreed] = useState<Partial<Record<PolicyType, number>>>({});
  const [reading, setReading] = useState<PolicyType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Consent is per version: if the pending set changes under us (a fresh edit
  // landed while this screen was open), what was read no longer applies.
  const signature = pending.map((p) => `${p.type}:${p.version}`).join("|");
  useEffect(() => {
    setAgreed({});
    setError(null);
  }, [signature]);

  // The gate is a block, not a prompt — the Android back button can't leave it.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  const allAgreed =
    pending.length > 0 && pending.every((p) => agreed[p.type] === p.version);

  const handleSubmit = async () => {
    if (!allAgreed) return;
    setError(null);
    try {
      await acceptPolicies(
        pending.map((p) => ({ type: p.type, version: p.version })),
      ).unwrap();
      // The mutation invalidates "Policy", so the pending list refetches and
      // the gate closes on its own once the server agrees it's satisfied.
    } catch (e: any) {
      // The most likely failure is a version that moved between reading and
      // agreeing — the server rejects stale consent, so pull the new wording
      // and make the user read that instead.
      setError(
        e?.data?.message ||
          (isRTL
            ? "تعذّر حفظ الموافقة. تحقق من الاتصال وحاول مجدداً."
            : "Could not save your consent. Check your connection and try again."),
      );
      setAgreed({});
      refetch();
    }
  };

  const policyTitle = (policy: Policy) =>
    isRTL ? policy.title?.ar : policy.title?.en || policy.title?.ar;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      // Swallowed on purpose: consent is required to continue.
      onRequestClose={() => {}}
    >
      <View style={[styles.container, { direction, paddingTop: insets.top }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconCircle}>
            <SolarShieldBold size={normalize.width(28)} color={Colors.primary} />
          </View>

          <ThemedText style={[styles.title, { textAlign: "center" }]}>
            {isRTL ? "تم تحديث السياسات" : "Our policies have been updated"}
          </ThemedText>

          <ThemedText style={[styles.subtitle, { textAlign: "center" }]}>
            {isRTL
              ? "قمنا بتحديث المستندات التالية. يرجى قراءتها والموافقة عليها لمتابعة استخدام التطبيق."
              : "We've updated the documents below. Please read and accept them to keep using the app."}
          </ThemedText>

          <View style={styles.list}>
            {pending.map((policy) => {
              const done = agreed[policy.type] === policy.version;
              return (
                <TouchableOpacity
                  key={policy.type}
                  style={[styles.policyRow, done && styles.policyRowDone]}
                  onPress={() => setReading(policy.type)}
                  activeOpacity={0.8}
                >
                  <View style={styles.policyTexts}>
                    <ThemedText style={[styles.policyTitle, { textAlign }]}>
                      {policyTitle(policy) || (isRTL ? "السياسة" : "Policy")}
                    </ThemedText>
                    <ThemedText style={[styles.policyMeta, { textAlign }]}>
                      {done
                        ? isRTL
                          ? "تمت الموافقة"
                          : "Accepted"
                        : isRTL
                          ? `النسخة ${policy.version} — اضغط للقراءة`
                          : `Version ${policy.version} — tap to read`}
                    </ThemedText>
                  </View>

                  <View style={[styles.badge, done && styles.badgeDone]}>
                    <ThemedText
                      style={[styles.badgeText, done && styles.badgeTextDone]}
                    >
                      {done ? "✓" : isRTL ? "قراءة" : "Read"}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!error && (
            <ThemedText style={[styles.error, { textAlign: "center" }]}>
              {error}
            </ThemedText>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {!allAgreed && (
            <ThemedText style={[styles.hint, { textAlign: "center" }]}>
              {isRTL
                ? "افتح كل مستند ووافق عليه للمتابعة"
                : "Open and accept each document to continue"}
            </ThemedText>
          )}

          <PrimaryButton
            label={isRTL ? "متابعة" : "Continue"}
            onPress={handleSubmit}
            disabled={!allAgreed || isSubmitting}
            loading={isSubmitting}
            activeColor={allAgreed ? Colors.primary : "#CBD5E1"}
            style={styles.submitBtn}
          />

          <TouchableOpacity
            onPress={() => dispatch(logout())}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.logoutText}>
              {isRTL ? "تسجيل الخروج" : "Sign out"}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Nested inside the gate's own modal: presenting a second RN Modal as a
            sibling while this one is up fails on iOS. */}
        <PolicyModal
          visible={!!reading}
          type={reading}
          mode="accept"
          onClose={() => setReading(null)}
          onAccept={({ type, version }) => {
            setAgreed((prev) => ({ ...prev, [type]: version }));
            // The reader fetches the document itself, so it can hand back a
            // version newer than the one this list was built from. Pull the
            // list again — the version change resets what was read, which is
            // the honest outcome: the wording moved while they were reading.
            const listed = pending.find((p) => p.type === type);
            if (listed && listed.version !== version) refetch();
          }}
        />

        {isSubmitting && (
          <View style={styles.submittingOverlay} pointerEvents="auto">
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: normalize.width(24),
    paddingTop: normalize.height(28),
    paddingBottom: normalize.height(20),
    alignItems: "center",
  },
  iconCircle: {
    width: normalize.width(64),
    height: normalize.width(64),
    borderRadius: normalize.width(32),
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize.height(14),
  },
  title: {
    fontSize: normalize.font(17),
    fontFamily: "Alexandria-SemiBold",
    color: "#111827",
    marginBottom: normalize.height(8),
  },
  subtitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Regular",
    color: "#6B7280",
    lineHeight: normalize.font(22),
  },
  list: {
    width: "100%",
    gap: normalize.height(12),
    marginTop: normalize.height(22),
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize.width(12),
    backgroundColor: "#FFFFFF",
    borderRadius: normalize.radius(18),
    paddingVertical: normalize.height(14),
    paddingHorizontal: normalize.width(16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  policyRowDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  policyTexts: {
    flex: 1,
  },
  policyTitle: {
    fontSize: normalize.font(13.5),
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    marginBottom: 2,
  },
  policyMeta: {
    fontSize: normalize.font(11.5),
    fontFamily: "Alexandria-Regular",
    color: "#9CA3AF",
  },
  badge: {
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(6),
    borderRadius: 999,
    backgroundColor: "#EBF3FF",
  },
  badgeDone: {
    backgroundColor: "#22C55E",
  },
  badgeText: {
    fontSize: normalize.font(11.5),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  badgeTextDone: {
    color: "#FFFFFF",
  },
  error: {
    marginTop: normalize.height(16),
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Regular",
    color: "#DC2626",
    lineHeight: normalize.font(20),
  },
  footer: {
    paddingHorizontal: normalize.width(24),
    paddingTop: normalize.height(12),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    gap: normalize.height(10),
  },
  hint: {
    fontSize: normalize.font(11.5),
    fontFamily: "Alexandria-Regular",
    color: "#9CA3AF",
  },
  submitBtn: {
    width: "100%",
    minHeight: normalize.height(52),
  },
  logoutBtn: {
    alignSelf: "center",
    paddingVertical: normalize.height(8),
    paddingHorizontal: normalize.width(16),
  },
  logoutText: {
    fontSize: normalize.font(12.5),
    fontFamily: "Alexandria-Medium",
    color: "#EF4444",
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
