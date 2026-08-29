import { SolarClipboardListLineDuotone } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  useGetChaletRulesQuery,
  useGetChaletTermsQuery,
} from "@/store/api/customerApiSlice";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import type { CancellationTier } from "./cancellation-policy-card";

const renderBackdrop = (props: any) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
);

// Module constant: a new array each render re-triggers gorhom's detent maths.
const SNAP_POINTS = ["85%"];

export interface ChaletTermsSheetProps {
  chaletId?: string;
  /** Already sorted most-generous-window-first by the caller. */
  cancellationTiers: CancellationTier[];
  isLoadingCancellation?: boolean;
  /** `chalet.guestPolicy` — the one rule an owner can neither write nor delete. */
  guestPolicy?: "family" | "youth" | "both";
  /**
   * "إرسال الطلب" for an approval-required chalet, "الدفع" for an instant one —
   * the button has to promise what actually happens next.
   */
  isRequest?: boolean;
  /** The customer agreed. The caller runs the submit it was holding back. */
  onAgree: () => void;
  /** The "رجوع" button. Swiping the sheet closed is the same thing, silently. */
  onDecline: () => void;
}

/** `{ ar, en }`, a JSON string of the same, or plain text — all three occur. */
const readLang = (value: any, isRTL: boolean): string => {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      const p = JSON.parse(parsed);
      if (p && typeof p === "object") parsed = p;
    } catch {
      return parsed.trim();
    }
  }
  if (!parsed || typeof parsed !== "object") return "";
  const picked = isRTL ? parsed.ar || parsed.en : parsed.en || parsed.ar;
  return typeof picked === "string" ? picked.trim() : "";
};

/**
 * The chalet's terms, shown as a gate rather than a link.
 *
 * Checkout used to carry a sentence saying the customer "acknowledges" the
 * terms, with the terms themselves one navigation away and nothing stopping a
 * booking that never opened them — and a delayed (approval-required) chalet
 * showed not even that. This puts the actual text in front of the customer at
 * the moment they commit, on both paths, and the booking only proceeds once
 * they tap موافق.
 *
 * Everything it shows is read-only text the owner or the platform already
 * publishes; nothing is recorded server-side, because there is no acceptance
 * column on `booking` and no version on `chalet.terms` to record against.
 */
export const ChaletTermsSheet = forwardRef<BottomSheetModal, ChaletTermsSheetProps>(
  function ChaletTermsSheet(
    {
      chaletId,
      cancellationTiers,
      isLoadingCancellation = false,
      guestPolicy = "both",
      isRequest = false,
      onAgree,
      onDecline,
    },
    ref,
  ) {
    const { isRTL, rowDirection, textAlign } = useDirection();

    // `skip` is the real guard; the hooks type their argument as a plain string.
    const { data: termsData, isLoading: isTermsLoading } = useGetChaletTermsQuery(
      chaletId as string,
      { skip: !chaletId },
    );
    const { data: rulesData, isLoading: isRulesLoading } = useGetChaletRulesQuery(
      chaletId as string,
      { skip: !chaletId },
    );

    const termsText = useMemo(() => readLang(termsData, isRTL), [termsData, isRTL]);

    const rules = useMemo(
      () =>
        (Array.isArray(rulesData) ? rulesData : [])
          .map((rule: any) => ({
            title: readLang(rule?.title, isRTL),
            description: readLang(rule?.description, isRTL),
          }))
          .filter((rule) => rule.title || rule.description),
      [rulesData, isRTL],
    );

    // An older chalet with no column means "accepts everyone", so nothing is
    // shown rather than a restriction the owner never set.
    const guestPolicyText = useMemo(() => {
      if (guestPolicy === "family")
        return isRTL
          ? "هذا الشاليه يستقبل العوائل فقط، ولا تُقبل حجوزات الشباب."
          : "This chalet accepts families only; bookings from young men are not accepted.";
      if (guestPolicy === "youth")
        return isRTL
          ? "هذا الشاليه يستقبل الشباب فقط، ولا تُقبل حجوزات العوائل."
          : "This chalet accepts young men only; bookings from families are not accepted.";
      return "";
    }, [guestPolicy, isRTL]);

    const isLoading = isTermsLoading || isRulesLoading || isLoadingCancellation;
    const hasOwnerContent = !!termsText || rules.length > 0 || !!guestPolicyText;

    const section = useCallback(
      (title: string, body: React.ReactNode) => (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { textAlign }]}>{title}</ThemedText>
          {body}
        </View>
      ),
      [textAlign],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={SNAP_POINTS}
        // gorhom v5 defaults `enableDynamicSizing` to TRUE, which sizes the
        // sheet to its content and adds that as an extra detent. A body that
        // fills the sheet (`flex: 1`) has no height to fill under those rules,
        // so the terms collapsed to nothing. Fixed detents are what a long,
        // scrollable document wants.
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#CBD5E1", width: 40 }}
      >
        {/* A plain View, not BottomSheetView — the latter exists to report its
            content height for dynamic sizing, which is off here. */}
        <View style={styles.container}>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <View style={styles.headerIcon}>
              <SolarClipboardListLineDuotone size={normalize.width(22)} color="#035DF9" />
            </View>
            <View style={styles.headerText}>
              <ThemedText style={[styles.title, { textAlign }]}>
                {isRTL ? "شروط وقوانين الشاليه" : "Chalet Terms & Rules"}
              </ThemedText>
              <ThemedText style={[styles.subtitle, { textAlign }]}>
                {isRTL
                  ? "اقرأ الشروط قبل المتابعة — بالموافقة تلتزم بها."
                  : "Read these before continuing — agreeing binds you to them."}
              </ThemedText>
            </View>
          </View>

          <BottomSheetScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator color="#035DF9" />
              </View>
            ) : (
              <>
                {!hasOwnerContent &&
                  section(
                    isRTL ? "شروط الشاليه" : "Chalet terms",
                    <ThemedText style={[styles.body, { textAlign }]}>
                      {isRTL
                        ? "لم ينشر صاحب هذا الشاليه شروطاً خاصة. تبقى سياسة الإلغاء أدناه وشروط المنصة سارية."
                        : "This chalet's owner published no specific terms. The cancellation policy below and the platform terms still apply."}
                    </ThemedText>,
                  )}

                {!!termsText &&
                  section(
                    isRTL ? "شروط الشاليه" : "Chalet terms",
                    <ThemedText style={[styles.body, { textAlign }]}>{termsText}</ThemedText>,
                  )}

                {rules.length > 0 &&
                  section(
                    isRTL ? "قوانين الشاليه" : "House rules",
                    <View style={styles.rules}>
                      {rules.map((rule, index) => (
                        <View key={`${rule.title}-${index}`} style={styles.ruleItem}>
                          {!!rule.title && (
                            <View style={[styles.ruleHeader, { flexDirection: rowDirection }]}>
                              <View style={styles.ruleBullet} />
                              <ThemedText style={[styles.ruleTitle, { textAlign }]}>
                                {rule.title}
                              </ThemedText>
                            </View>
                          )}
                          {!!rule.description && (
                            <ThemedText style={[styles.body, { textAlign }]}>
                              {rule.description}
                            </ThemedText>
                          )}
                        </View>
                      ))}
                    </View>,
                  )}

                {!!guestPolicyText &&
                  section(
                    isRTL ? "نوع الضيوف المسموح" : "Allowed guests",
                    <ThemedText style={[styles.body, { textAlign }]}>{guestPolicyText}</ThemedText>,
                  )}

                {/* Not the owner's text but the rule the customer is actually
                    agreeing to spend money under, so it belongs on this page. */}
                {section(
                  isRTL ? "سياسة الإلغاء" : "Cancellation policy",
                  cancellationTiers.length > 0 ? (
                    <>
                      {cancellationTiers.map((tier) => (
                        <ThemedText
                          key={tier.id ?? tier.daysBeforeBooking}
                          style={[styles.body, { textAlign }]}
                        >
                          {isRTL
                            ? `• الإلغاء قبل ${tier.daysBeforeBooking} يوم أو أكثر: تُخصم ${Number(tier.penaltyPercentage)}%`
                            : `• Cancel ${tier.daysBeforeBooking}+ days ahead: ${Number(tier.penaltyPercentage)}% fee`}
                        </ThemedText>
                      ))}
                      <ThemedText style={[styles.body, { textAlign }]}>
                        {isRTL
                          ? "• الإلغاء بعد ذلك: لا يُسترد شيء."
                          : "• Cancelling later than that refunds nothing."}
                      </ThemedText>
                    </>
                  ) : (
                    // An empty tier list is the HARSHEST outcome, not a lenient
                    // one — the server falls back to a 100% penalty.
                    <ThemedText style={[styles.body, styles.bodyStrict, { textAlign }]}>
                      {isRTL
                        ? "هذا الشاليه لم ينشر سياسة إلغاء، لذلك لا يُسترد أي مبلغ عند الإلغاء."
                        : "This chalet publishes no cancellation policy, so cancelling refunds nothing."}
                    </ThemedText>
                  ),
                )}
              </>
            )}
          </BottomSheetScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={
                isRequest
                  ? isRTL ? "موافق، أرسل الطلب" : "Agree & send request"
                  : isRTL ? "موافق، تابع الدفع" : "Agree & continue to payment"
              }
              onPress={onAgree}
              disabled={isLoading}
              activeColor="#15AB64"
            />
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <ThemedText style={styles.declineText}>
                {isRTL ? "رجوع" : "Back"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  // snapPoints gives the sheet a fixed height; flex:1 lets the scroll area take
  // whatever the header and footer leave, so the button never scrolls away.
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerIcon: {
    width: normalize.width(40),
    height: normalize.width(40),
    borderRadius: normalize.radius(12),
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, gap: 16 },
  loading: { paddingVertical: 40, alignItems: "center" },
  section: { gap: 6 },
  sectionTitle: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Bold",
    color: "#1E293B",
  },
  body: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#475569",
    lineHeight: 20,
  },
  bodyStrict: { fontFamily: "IBMPlexSansArabic-SemiBold", color: "#92400E" },
  rules: { gap: 10 },
  ruleItem: { gap: 4 },
  ruleHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#035DF9",
  },
  ruleTitle: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 4,
  },
  declineBtn: { alignSelf: "center", paddingVertical: 10 },
  declineText: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#64748B",
  },
});
