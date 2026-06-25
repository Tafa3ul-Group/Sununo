import {
  SolarShieldWarningBold,
  SolarWalletBold,
} from "@/components/icons/solar-icons";
import { normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import LottieView from "lottie-react-native";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SecondaryButton } from "./secondary-button";

import errorAnim from "../icons/motions/fail.json";
import successAnim from "../icons/motions/success.json";

const zainCashLogo = require("@/assets/zaincash.png");
const qiLogo = require("@/assets/qi.svg");

export type WithdrawMethod = "zaincash" | "qi" | "other";

// ── Payout-destination validators (mirrors the provider dashboard exactly so a
// customer's payout details are held to the same 100%-accurate standard) ──────
function validateZainCash(text: string, isRTL: boolean): string | null {
  if (!text) {
    return isRTL ? "يرجى إدخال رقم زين كاش" : "Please enter your Zain Cash number";
  }
  const clean = text.replace(/[\s\-()]/g, "");
  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return isRTL
      ? "يجب أن يحتوي رقم الهاتف على أرقام فقط"
      : "Phone number must contain digits only";
  }
  const hasIraqiPrefix =
    clean.startsWith("07") ||
    clean.startsWith("7") ||
    clean.startsWith("+9647") ||
    clean.startsWith("9647") ||
    clean.startsWith("009647");
  if (!hasIraqiPrefix) {
    return isRTL
      ? "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+"
      : "Phone number must start with 07, 7, or +9647";
  }
  if (clean.startsWith("07") && clean.length !== 11) {
    return isRTL ? "رقم الهاتف يجب أن يكون 11 رقماً" : "Phone number must be 11 digits";
  } else if (clean.startsWith("7") && clean.length !== 10) {
    return isRTL ? "رقم الهاتف يجب أن يكون 10 أرقام" : "Phone number must be 10 digits";
  } else if (clean.startsWith("+9647") && clean.length !== 13) {
    return isRTL ? "رقم الهاتف يجب أن يكون 13 رقماً" : "Phone number must be 13 digits";
  } else if (clean.startsWith("9647") && clean.length !== 12) {
    return isRTL ? "رقم الهاتف يجب أن يكون 12 رقماً" : "Phone number must be 12 digits";
  } else if (clean.startsWith("009647") && clean.length !== 14) {
    return isRTL ? "رقم الهاتف يجب أن يكون 14 رقماً" : "Phone number must be 14 digits";
  }
  return null;
}

function validateQiCard(text: string, isRTL: boolean): string | null {
  if (!text) {
    return isRTL ? "يرجى إدخال رقم بطاقة كي" : "Please enter your Qi card number";
  }
  const clean = text.replace(/[\s\-()]/g, "");
  if (!/^\d{10}$/.test(clean)) {
    return isRTL
      ? "يجب أن يتكون رقم بطاقة كي من 10 أرقام"
      : "Qi card number must be 10 digits";
  }
  return null;
}

function validateAccount(
  method: WithdrawMethod,
  text: string,
  isRTL: boolean,
): string | null {
  if (method === "zaincash") return validateZainCash(text, isRTL);
  if (method === "qi") return validateQiCard(text, isRTL);
  // "other": free text, just require something meaningful.
  if (!text || text.trim().length < 3) {
    return isRTL ? "يرجى إدخال معلومات الاستلام" : "Please enter payout details";
  }
  return null;
}

interface WithdrawSheetProps {
  onConfirm: (data: {
    amount: number;
    method: WithdrawMethod;
    account: string;
  }) => void;
  isLoading?: boolean;
}

export type WithdrawSheetRef = {
  present: (availableBalance?: number) => void;
  dismiss: () => void;
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
};

export const WithdrawSheet = forwardRef<WithdrawSheetRef, WithdrawSheetProps>(
  ({ onConfirm, isLoading = false }, ref) => {
    const { t } = useTranslation();
    const { isRTL } = useDirection();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const lottieRef = useRef<LottieView>(null);

    const [balance, setBalance] = useState(0);
    const [method, setMethod] = useState<WithdrawMethod>("zaincash");
    const [amount, setAmount] = useState("");
    const [account, setAccount] = useState("");
    const [amountError, setAmountError] = useState("");
    const [accountError, setAccountError] = useState("");
    const [internalStatus, setInternalStatus] = useState<
      "idle" | "success" | "error"
    >("idle");
    const [feedbackMessage, setFeedbackMessage] = useState("");

    const textAlign = isRTL ? "right" : "left";
    const amountNum = Number(amount) || 0;

    const reset = () => {
      setMethod("zaincash");
      setAmount("");
      setAccount("");
      setAmountError("");
      setAccountError("");
      setInternalStatus("idle");
    };

    useImperativeHandle(ref, () => ({
      present: (availableBalance = 0) => {
        reset();
        setBalance(Number(availableBalance) || 0);
        bottomSheetModalRef.current?.present();
      },
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
      showSuccess: (message) => {
        setInternalStatus("success");
        setFeedbackMessage(message || "");
        setTimeout(() => lottieRef.current?.play(), 100);
        setTimeout(() => bottomSheetModalRef.current?.dismiss(), 2600);
      },
      showError: (message) => {
        setInternalStatus("error");
        setFeedbackMessage(message || "");
        setTimeout(() => lottieRef.current?.play(), 100);
      },
    }));

    const methods = useMemo(
      () =>
        [
          {
            id: "zaincash" as const,
            label: t("profile.wallet.withdrawSheet.zaincash"),
            logo: zainCashLogo,
          },
          {
            id: "qi" as const,
            label: t("profile.wallet.withdrawSheet.qi"),
            logo: qiLogo,
          },
          { id: "other" as const, label: t("profile.wallet.withdrawSheet.other"), logo: null },
        ],
      [t],
    );

    const accountPlaceholder =
      method === "zaincash"
        ? "07xxxxxxxxx"
        : method === "qi"
          ? t("profile.wallet.withdrawSheet.qiHint")
          : t("profile.wallet.withdrawSheet.otherHint");

    const onChangeMethod = (m: WithdrawMethod) => {
      setMethod(m);
      // Re-validate the already-typed account against the newly selected method.
      setAccountError(account ? validateAccount(m, account, isRTL) || "" : "");
    };

    const onChangeAmount = (v: string) => {
      // Digits only; never allow the typed value to exceed the wallet balance.
      let clean = v.replace(/[^0-9]/g, "");
      if (clean) {
        let n = Number(clean);
        if (balance > 0 && n > balance) {
          n = Math.floor(balance);
          clean = String(n);
        }
        setAmount(clean);
      } else {
        setAmount("");
      }
      setAmountError("");
    };

    const setMaxAmount = () => {
      setAmount(String(Math.floor(balance)));
      setAmountError("");
    };

    const onChangeAccount = (v: string) => {
      setAccount(v);
      setAccountError(v ? validateAccount(method, v, isRTL) || "" : "");
    };

    const handleConfirm = () => {
      const acc = account.trim();
      let valid = true;
      if (!amountNum || amountNum <= 0) {
        setAmountError(t("profile.wallet.withdrawSheet.errAmount"));
        valid = false;
      } else if (balance > 0 && amountNum > balance) {
        setAmountError(t("profile.wallet.withdrawSheet.errBalance"));
        valid = false;
      }
      const accErr = validateAccount(method, acc, isRTL);
      if (accErr) {
        setAccountError(accErr);
        valid = false;
      }
      if (!valid) return;
      onConfirm({ amount: amountNum, method, account: acc });
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    const renderFeedback = () => (
      <View style={styles.feedbackContainer}>
        <LottieView
          ref={lottieRef}
          source={internalStatus === "success" ? successAnim : errorAnim}
          autoPlay={false}
          loop={false}
          style={styles.lottie}
          resizeMode="contain"
        />
        <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        {internalStatus === "error" && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setInternalStatus("idle")}
          >
            <Text style={styles.retryButtonText}>
              {t("profile.wallet.withdrawSheet.retry")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );

    const renderForm = () => (
      <>
        <Text style={styles.title}>
          {t("profile.wallet.withdrawSheet.title")}
        </Text>

        {/* Amount — prominent display with live max constraint */}
        <View style={styles.amountCard}>
          <View style={styles.amountInputRow}>
            <BottomSheetTextInput
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              value={amount}
              onChangeText={onChangeAmount}
              textAlign="center"
            />
            <Text style={styles.amountCurrency}>{t("common.iqd")}</Text>
          </View>
          <View style={styles.amountMetaRow}>
            <Text style={styles.amountAvailable}>
              {t("profile.wallet.withdrawSheet.available")}:{" "}
              <Text style={styles.amountAvailableValue}>
                {balance.toLocaleString()} {t("common.iqd")}
              </Text>
            </Text>
            <TouchableOpacity
              style={styles.maxButton}
              onPress={setMaxAmount}
              activeOpacity={0.8}
            >
              <Text style={styles.maxButtonText}>
                {t("profile.wallet.withdrawSheet.max")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {amountError ? (
          <Text style={[styles.errorText, { textAlign }]}>{amountError}</Text>
        ) : null}

        {/* Method selector */}
        <Text style={[styles.label, { textAlign }]}>
          {t("profile.wallet.withdrawSheet.method")}
        </Text>
        <View style={styles.methodRow}>
          {methods.map((m) => {
            const active = method === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodChip, active && styles.methodChipActive]}
                onPress={() => onChangeMethod(m.id)}
                activeOpacity={0.8}
              >
                {m.logo ? (
                  <Image source={m.logo} style={styles.methodLogo} />
                ) : (
                  <SolarWalletBold size={26} color={active ? "#035DF9" : "#94A3B8"} />
                )}
                <Text
                  style={[styles.methodLabel, active && styles.methodLabelActive]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Account / destination */}
        <Text style={[styles.label, { textAlign }]}>
          {method === "zaincash"
            ? t("profile.wallet.withdrawSheet.zaincashLabel")
            : method === "qi"
              ? t("profile.wallet.withdrawSheet.qiLabel")
              : t("profile.wallet.withdrawSheet.account")}
        </Text>
        <View
          style={[
            styles.accountWrapper,
            accountError ? { borderColor: "#EF4444" } : null,
            method === "other" && styles.accountWrapperMultiline,
          ]}
        >
          {method !== "other" && (
            <Image
              source={method === "zaincash" ? zainCashLogo : qiLogo}
              style={styles.accountLogo}
            />
          )}
          <BottomSheetTextInput
            style={[styles.accountInput, { textAlign }]}
            multiline={method === "other"}
            keyboardType={
              method === "zaincash"
                ? "phone-pad"
                : method === "qi"
                  ? "numeric"
                  : "default"
            }
            placeholder={accountPlaceholder}
            placeholderTextColor="#94A3B8"
            value={account}
            onChangeText={onChangeAccount}
          />
        </View>
        {accountError ? (
          <Text style={[styles.errorText, { textAlign }]}>{accountError}</Text>
        ) : null}

        {/* Sensitive-info warning */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <SolarShieldWarningBold size={18} color="#B45309" />
            <Text style={styles.warningTitle}>
              {t("profile.wallet.withdrawSheet.warningTitle")}
            </Text>
          </View>
          <Text style={[styles.warningText, { textAlign }]}>
            {t("profile.wallet.withdrawSheet.warningText")}
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <View style={{ flex: 1.2 }}>
            <SecondaryButton
              label={t("profile.wallet.withdrawSheet.submit")}
              onPress={handleConfirm}
              isActive={true}
              activeColor="#035DF9"
              isLoading={isLoading}
              style={{ height: 56 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label={t("profile.wallet.withdrawSheet.cancel")}
              onPress={() => bottomSheetModalRef.current?.dismiss()}
              inactiveTextColor="#1C1C1C"
              isActive={false}
              variant="outline"
              style={{ height: 56, borderColor: "#E2E8F0" }}
            />
          </View>
        </View>
      </>
    );

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={internalStatus !== "success"}
        keyboardBehavior="fillParent"
        handleIndicatorStyle={{ backgroundColor: "#E2E8F0", width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          {internalStatus === "idle" ? renderForm() : renderFeedback()}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

WithdrawSheet.displayName = "WithdrawSheet";

const styles = StyleSheet.create({
  modalContent: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    paddingBottom: 40,
  },
  title: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: "#1C1C1C",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  // Amount
  amountCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  amountInput: {
    minWidth: 120,
    fontSize: normalize.font(32),
    fontFamily: "Alexandria-Bold",
    color: "#035DF9",
    padding: 0,
  },
  amountCurrency: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  amountMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  amountAvailable: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
  },
  amountAvailableValue: {
    color: "#1C1C1C",
    fontFamily: "Alexandria-Bold",
  },
  maxButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#EFF5FF",
  },
  maxButtonText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Bold",
    color: "#035DF9",
  },
  // Labels / errors
  label: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Medium",
    color: "#1C1C1C",
    marginTop: 18,
    marginBottom: 10,
  },
  errorText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: "#EF4444",
    marginTop: 8,
  },
  // Method chips
  methodRow: {
    flexDirection: "row",
    gap: 10,
  },
  methodChip: {
    flex: 1,
    height: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  methodChipActive: {
    borderColor: "#035DF9",
    backgroundColor: "#EFF5FF",
  },
  methodLogo: {
    width: 30,
    height: 30,
    borderRadius: 6,
    resizeMode: "contain",
  },
  methodLabel: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Medium",
    color: "#94A3B8",
  },
  methodLabelActive: {
    color: "#035DF9",
  },
  // Account input
  accountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  accountWrapperMultiline: {
    minHeight: 90,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  accountLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    resizeMode: "contain",
    marginEnd: 10,
  },
  accountInput: {
    flex: 1,
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1C1C1C",
    paddingVertical: 14,
  },
  // Warning
  warningCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    gap: 8,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningTitle: {
    fontSize: normalize.font(13),
    fontFamily: "Alexandria-Bold",
    color: "#B45309",
  },
  warningText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: "#D97706",
    lineHeight: 18,
  },
  // Buttons
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginTop: 24,
  },
  // Feedback
  feedbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 30,
  },
  lottie: {
    width: "100%",
    height: 260,
  },
  feedbackText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1C1C1C",
    textAlign: "center",
    marginTop: 10,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  retryButtonText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#035DF9",
  },
});
