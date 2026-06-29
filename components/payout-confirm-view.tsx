import { HeaderSection } from "@/components/header-section";
import {
  SolarCheckCircleBold,
  SolarCloseCircleBold,
  SolarInfoCircleBold,
  SolarShieldWarningBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, I18nManager, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  payout: any;
  isLoading: boolean;
  isConfirming: boolean;
  isDeclining: boolean;
  onConfirm: () => Promise<void> | void;
  onDecline: () => Promise<void> | void;
  onBack: () => void;
}

/**
 * Shared in-app payout confirmation UI (نعم/لا) used by both the customer and the
 * provider (chalet owner). Follows the app's standard detail-screen design system
 * (flat white cards, hairline borders, blue section titles, alert cards).
 */
export function PayoutConfirmView({
  payout,
  isLoading,
  isConfirming,
  isDeclining,
  onConfirm,
  onDecline,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const { isRTL, rowDirection } = useDirection();
  const textStart: "left" | "right" = isRTL === I18nManager.isRTL ? "left" : "right";
  const textEnd: "left" | "right" = isRTL === I18nManager.isRTL ? "right" : "left";
  const writingDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";

  const status: string = payout?.status;

  const destination = (() => {
    if (payout?.zainCash) return { label: t("payoutConfirm.zaincash"), value: payout.zainCash };
    if (payout?.qi) return { label: t("payoutConfirm.qi"), value: payout.qi };
    if (payout?.otherMethod) return { label: t("payoutConfirm.other"), value: payout.otherMethod };
    return { label: "—", value: "—" };
  })();

  const confirmDecline = useCallback(() => {
    Alert.alert(
      t("payoutConfirm.declineConfirmTitle"),
      t("payoutConfirm.declineConfirmBody"),
      [
        { text: t("payoutConfirm.back"), style: "cancel" },
        { text: t("payoutConfirm.declineYes"), style: "destructive", onPress: () => onDecline() },
      ],
    );
  }, [onDecline, t]);

  const renderInfoRow = (label: string, value: React.ReactNode, index = 0) => (
    <Animated.View
      entering={FadeInDown.delay((index % 8) * 60).duration(380)}
      style={[styles.infoRow, { flexDirection: rowDirection }]}
    >
      <ThemedText style={[styles.infoLabel, { textAlign: textStart, writingDirection: writingDir }]}>
        {label}
      </ThemedText>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        {typeof value === "string" ? (
          <ThemedText style={[styles.infoValue, { textAlign: textEnd, writingDirection: writingDir }]}>{value}</ThemedText>
        ) : (
          value
        )}
      </View>
    </Animated.View>
  );

  const result = (() => {
    if (status === "confirmed") return { variant: "success" as const, icon: "#16A34A", color: "#15803D", title: t("payoutConfirm.confirmedTitle"), body: t("payoutConfirm.confirmedBody") };
    if (status === "paid") return { variant: "success" as const, icon: "#16A34A", color: "#15803D", title: t("payoutConfirm.paidTitle"), body: t("payoutConfirm.paidBody") };
    if (status === "declined" || status === "rejected") return { variant: "danger" as const, icon: "#DC2626", color: "#B91C1C", title: t("payoutConfirm.declinedTitle"), body: t("payoutConfirm.declinedBody") };
    if (status === "pending") return { variant: "warning" as const, icon: "#D97706", color: "#B45309", title: t("payoutConfirm.pendingTitle"), body: t("payoutConfirm.pendingBody") };
    return null;
  })();

  const amount = Number(payout?.amount || 0).toLocaleString();

  if (isLoading || !payout) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={["top"]}>
        <HeaderSection title={t("payoutConfirm.title")} showBackButton showLogo={false} onBackPress={onBack} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderSection title={t("payoutConfirm.title")} showBackButton showLogo={false} onBackPress={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <Animated.View entering={FadeInDown.duration(380)} style={styles.amountCard}>
          <ThemedText style={styles.amountLabel}>{t("payoutConfirm.amountLabel")}</ThemedText>
          <View style={[styles.amountRow, { flexDirection: rowDirection }]}>
            <ThemedText style={styles.amountValue}>{amount}</ThemedText>
            <ThemedText style={styles.amountCurrency}>{t("common.iqd")}</ThemedText>
          </View>
          {!!payout?.requestCode && <ThemedText style={styles.amountCode}>{payout.requestCode}</ThemedText>}
        </Animated.View>

        {/* Transfer details */}
        <View style={styles.infoSectionCard}>
          <ThemedText style={[styles.sectionTitle, { textAlign: textStart }]}>{t("payoutConfirm.detailsTitle")}</ThemedText>
          <View style={styles.divider} />
          {renderInfoRow(t("payoutConfirm.methodLabel"), destination.label, 0)}
          {renderInfoRow(
            t("payoutConfirm.accountLabel"),
            <ThemedText style={[styles.infoValue, { direction: "ltr", textAlign: textEnd }]}>{destination.value}</ThemedText>,
            1,
          )}
        </View>

        {status === "approved" ? (
          <>
            {/* Security note */}
            <View style={[styles.alertCard, { flexDirection: rowDirection }]}>
              <SolarShieldWarningBold size={22} color="#D97706" />
              <ThemedText style={[styles.alertText, { textAlign: textStart, writingDirection: writingDir }]}>
                {t("payoutConfirm.securityNote")}
              </ThemedText>
            </View>

            {/* Prompt + actions */}
            <ThemedText style={styles.prompt}>{t("payoutConfirm.prompt")}</ThemedText>
            <PrimaryButton
              label={t("payoutConfirm.confirmYes")}
              onPress={() => onConfirm()}
              loading={isConfirming}
              icon={<SolarCheckCircleBold size={18} color="#FFFFFF" />}
              style={styles.confirmBtn}
            />
            <TouchableOpacity
              style={[styles.declineBtn, { flexDirection: rowDirection }]}
              activeOpacity={0.7}
              onPress={confirmDecline}
              disabled={isDeclining}
            >
              {isDeclining ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <SolarCloseCircleBold size={18} color="#DC2626" />
                  <ThemedText style={styles.declineBtnText}>{t("payoutConfirm.declineNo")}</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : result ? (
          <View
            style={[
              styles.alertCard,
              result.variant === "success" && styles.alertCardSuccess,
              result.variant === "danger" && styles.alertCardDanger,
              { flexDirection: rowDirection },
            ]}
          >
            {result.variant === "danger" ? (
              <SolarCloseCircleBold size={24} color={result.icon} />
            ) : result.variant === "success" ? (
              <SolarCheckCircleBold size={24} color={result.icon} />
            ) : (
              <SolarInfoCircleBold size={24} color={result.icon} />
            )}
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.resultTitle, { color: result.color, textAlign: textStart, writingDirection: writingDir }]}>
                {result.title}
              </ThemedText>
              <ThemedText style={[styles.alertText, { color: result.color, textAlign: textStart, writingDirection: writingDir }]}>
                {result.body}
              </ThemedText>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Amount card
  amountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  amountRow: { alignItems: "baseline", gap: 6, marginTop: 8 },
  amountValue: {
    fontSize: normalize.font(30),
    fontFamily: "Alexandria-Bold",
    color: Colors.primary,
  },
  amountCurrency: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  amountCode: {
    marginTop: 10,
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Medium",
    color: "#94A3B8",
    writingDirection: "ltr",
  },

  // Details section (matches booking-success.infoSectionCard)
  infoSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  infoRow: { justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  infoLabel: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: "#1E293B" },
  infoValue: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: "#64748B" },

  // Alert card (matches booking-success.alertCard)
  alertCard: {
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  alertCardSuccess: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  alertCardDanger: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  alertText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Medium",
    color: "#B45309",
    lineHeight: 18,
  },
  resultTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    marginBottom: 4,
  },

  // Actions
  prompt: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmBtn: { marginBottom: 12 },
  declineBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  declineBtnText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: "#DC2626",
  },
});
