import { HeaderSection } from "@/components/header-section";
import {
  SolarBanknoteBold,
  SolarCardBold,
  SolarCheckCircleBold,
  SolarCloseCircleBold,
  SolarPhoneBold,
  SolarShieldWarningBold,
  SolarWalletBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
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
 * provider (chalet owner). The screen wrappers wire the matching API hooks.
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
  const { isRTL, textAlign } = useDirection();

  const status: string = payout?.status;

  const destination = (() => {
    if (payout?.zainCash) return { label: t("payoutConfirm.zaincash"), value: payout.zainCash, Icon: SolarPhoneBold };
    if (payout?.qi) return { label: t("payoutConfirm.qi"), value: payout.qi, Icon: SolarCardBold };
    if (payout?.otherMethod) return { label: t("payoutConfirm.other"), value: payout.otherMethod, Icon: SolarWalletBold };
    return { label: "—", value: "—", Icon: SolarWalletBold };
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

  const resultState = (() => {
    if (status === "confirmed")
      return { Icon: SolarCheckCircleBold, color: "#10B981", title: t("payoutConfirm.confirmedTitle"), body: t("payoutConfirm.confirmedBody") };
    if (status === "paid")
      return { Icon: SolarCheckCircleBold, color: "#10B981", title: t("payoutConfirm.paidTitle"), body: t("payoutConfirm.paidBody") };
    if (status === "declined" || status === "rejected")
      return { Icon: SolarCloseCircleBold, color: "#EF4444", title: t("payoutConfirm.declinedTitle"), body: t("payoutConfirm.declinedBody") };
    if (status === "pending")
      return { Icon: SolarShieldWarningBold, color: "#F59E0B", title: t("payoutConfirm.pendingTitle"), body: t("payoutConfirm.pendingBody") };
    return null;
  })();

  const amount = Number(payout?.amount || 0).toLocaleString();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <HeaderSection title={t("payoutConfirm.title")} showBackButton showLogo={false} onBackPress={onBack} />

      {isLoading || !payout ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <SolarBanknoteBold size={30} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.heroLabel}>{t("payoutConfirm.amountLabel")}</ThemedText>
            <View style={styles.heroAmountRow}>
              <ThemedText style={styles.heroAmount}>{amount}</ThemedText>
              <ThemedText style={styles.heroCurrency}>{t("common.iqd")}</ThemedText>
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText style={[styles.cardTitle, { textAlign }]}>{t("payoutConfirm.detailsTitle")}</ThemedText>
            <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.detailLeft, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <destination.Icon size={18} color={Colors.text.muted} />
                <ThemedText style={styles.detailLabel}>{t("payoutConfirm.methodLabel")}</ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>{destination.label}</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={[styles.detailRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <ThemedText style={styles.detailLabel}>{t("payoutConfirm.accountLabel")}</ThemedText>
              <ThemedText style={[styles.detailValue, { writingDirection: "ltr" }]}>{destination.value}</ThemedText>
            </View>
          </View>

          <View style={[styles.note, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <SolarShieldWarningBold size={18} color="#B45309" />
            <ThemedText style={[styles.noteText, { textAlign }]}>{t("payoutConfirm.securityNote")}</ThemedText>
          </View>

          {status === "approved" ? (
            <View style={styles.actions}>
              <ThemedText style={[styles.prompt, { textAlign: "center" }]}>{t("payoutConfirm.prompt")}</ThemedText>
              <SecondaryButton
                label={t("payoutConfirm.confirmYes")}
                onPress={() => onConfirm()}
                isActive
                activeColor="#10B981"
                isLoading={isConfirming}
                style={{ height: 56 }}
              />
              <SecondaryButton
                label={t("payoutConfirm.declineNo")}
                onPress={confirmDecline}
                isActive={false}
                variant="outline"
                inactiveTextColor="#EF4444"
                isLoading={isDeclining}
                style={{ height: 56, borderColor: "#FECACA" }}
              />
            </View>
          ) : resultState ? (
            <View style={styles.resultPanel}>
              <resultState.Icon size={54} color={resultState.color} />
              <ThemedText style={[styles.resultTitle, { color: resultState.color }]}>{resultState.title}</ThemedText>
              <ThemedText style={styles.resultBody}>{resultState.body}</ThemedText>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingBottom: 48 },
  hero: { alignItems: "center", paddingVertical: 24, backgroundColor: "#EFF5FF", borderRadius: 24, marginBottom: 16 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#035DF9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroLabel: { fontSize: normalize.font(12), fontFamily: "Alexandria-Medium", color: Colors.text.muted },
  heroAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 },
  heroAmount: { fontSize: normalize.font(30), fontFamily: "Alexandria-Bold", color: "#035DF9" },
  heroCurrency: { fontSize: normalize.font(14), fontFamily: "Alexandria-Medium", color: Colors.text.muted },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#F1F5F9", padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: normalize.font(13), fontFamily: "Alexandria-Bold", color: Colors.text.primary, marginBottom: 12 },
  detailRow: { alignItems: "center", justifyContent: "space-between" },
  detailLeft: { alignItems: "center", gap: 8 },
  detailLabel: { fontSize: normalize.font(12), fontFamily: "Alexandria-Medium", color: Colors.text.muted },
  detailValue: { fontSize: normalize.font(13), fontFamily: "Alexandria-Medium", color: Colors.text.primary },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  note: { alignItems: "flex-start", gap: 8, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 16, padding: 14, marginBottom: 20 },
  noteText: { flex: 1, fontSize: normalize.font(11), fontFamily: "Alexandria-Medium", color: "#B45309", lineHeight: 18 },
  actions: { gap: 12 },
  prompt: { fontSize: normalize.font(13), fontFamily: "Alexandria-Bold", color: Colors.text.primary, marginBottom: 4 },
  resultPanel: { alignItems: "center", paddingVertical: 24, gap: 12 },
  resultTitle: { fontSize: normalize.font(16), fontFamily: "Alexandria-Bold", textAlign: "center" },
  resultBody: { fontSize: normalize.font(12), fontFamily: "Alexandria-Medium", color: Colors.text.muted, textAlign: "center", lineHeight: 18, paddingHorizontal: 12 },
});
