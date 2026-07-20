import { LoginHeaderLogo } from "@/components/icons/login-header-logo";
import { ThemedText } from "@/components/themed-text";
import { AiTranslateButton } from "@/components/ui/ai-translate-button";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { AuthToggle } from "@/components/user/auth-toggle";
import { OtpInput } from "@/components/user/otp-input";
import { PrimaryButton } from "@/components/user/primary-button";
import { normalize } from "@/constants/theme";

import {
    useLoginMutation,
    useRegisterProviderMutation,
    useVerifyPhoneMutation
} from "@/store/api/apiSlice";
import { setCredentials } from "@/store/authSlice";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS } from "@/constants/analytics-events";
import { useDirection } from "@/i18n";
import { validateQiCard, validateZainCash } from "@/utils/payment-validation";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const zainCashLogo = require("@/assets/zaincash.png");
const qiLogo = require("@/assets/qi.svg");

// Task 2.1: Removed "TYPE" from Step type
type Step = "INFO" | "BUSINESS" | "PAYMENT" | "OTP";

// Task 2.2: StepProgress component (inline)
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.dot,
            i + 1 === current && progressStyles.activeDot,
            i + 1 < current && progressStyles.doneDot,
          ]}
        />
      ))}
    </View>
  );
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { isRTL, rowDirection, textAlign } = useDirection();
  const isArabic = isRTL;
  const textStart = textAlign;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const params = useLocalSearchParams<{ type?: string }>();
  // Task 2.1: Start from "INFO" instead of "TYPE"
  const [step, setStep] = useState<Step>("INFO");
  const [accountType, setAccountType] = useState<"customer" | "owner">(
    params.type === "owner" || params.type === "provider" ? "owner" : "customer",
  );

  useEffect(() => {
    if (params.type) {
      setAccountType(
        params.type === "owner" || params.type === "provider"
          ? "owner"
          : "customer",
      );
    }
  }, [params.type]);

  // API Mutations
  const [login] = useLoginMutation();
  const [verifyPhone, { isLoading: isVerifying }] = useVerifyPhoneMutation();
  const [registerProvider, { isLoading: isRegisteringProvider }] =
    useRegisterProviderMutation();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    businessNameAr: "",
    businessNameEn: "",
    zainCash: "",
    qi: "" });

  const [payErrors, setPayErrors] = useState<{
    zainCash?: string | null;
    qi?: string | null;
    general?: string | null;
  }>({});

  const [otpCode, setOtpCode] = useState("");

  // Task 2.2: getStepInfo function
  const getStepInfo = () => {
    if (accountType === "owner") {
      const map: Record<Step, number> = { INFO: 1, BUSINESS: 2, PAYMENT: 3, OTP: 4 };
      return { current: map[step] || 1, total: 4 };
    } else {
      const map: Record<Step, number> = { INFO: 1, BUSINESS: 1, PAYMENT: 1, OTP: 2 };
      return { current: map[step] || 1, total: 2 };
    }
  };

  const nextStep = () => {
    if (step === "INFO") {
      if (!formData.name || !formData.phone) {
        Alert.alert(
          t("common.error"),
          isArabic ? "يرجى ملء الاسم ورقم الهاتف" : "Please enter name and phone",
        );
        return;
      }

      // Clean phone number
      const cleanPhone = formData.phone.trim().replace(/[\s\-\(\)]/g, "");
      
      const iraqiPhoneRegex = /^(\+?964|00964|0)?7[3-9]\d{8}$/;
      const genericPhoneRegex = /^\d{10,15}$/;
      
      if (!iraqiPhoneRegex.test(cleanPhone) && !genericPhoneRegex.test(cleanPhone)) {
        Alert.alert(
          t("common.error"), 
          isArabic 
            ? "يرجى إدخال رقم هاتف صالح يتكون من 10 أو 11 رقماً (مثال: 07701234567)" 
            : "Please enter a valid phone number with 10 or 11 digits (e.g., 07701234567)"
        );
        return;
      }

      // Update form state with the cleaned phone number
      setFormData(prev => {
        const updated = { ...prev, phone: cleanPhone };
        if (accountType === "owner") {
          setStep("BUSINESS");
        } else {
          handleCustomerRegister(cleanPhone);
        }
        return updated;
      });
    } else if (step === "BUSINESS") {
      if (!formData.businessNameAr) {
        Alert.alert(
          t("common.error"),
          isArabic ? "يرجى ملء اسم الشاليه" : "Please enter chalet name",
        );
        return;
      }
      setStep("PAYMENT");
    } else if (step === "PAYMENT") {
      const hasAny = !!formData.zainCash.trim() || !!formData.qi.trim();
      if (!hasAny) {
        setPayErrors({
          general: isArabic
            ? "أدخل وسيلة دفع واحدة على الأقل (زين كاش أو بطاقة كي)"
            : "Enter at least one payout method (Zain Cash or Qi Card)",
        });
        return;
      }
      const zErr = validateZainCash(formData.zainCash);
      const qErr = validateQiCard(formData.qi);
      if (zErr || qErr) {
        setPayErrors({ zainCash: zErr, qi: qErr, general: null });
        return;
      }
      setPayErrors({});
      handleOwnerRegister();
    }
  };

  // Task 2.1: Updated prevStep — INFO is now the first step
  const prevStep = () => {
    if (step === "INFO") router.back();
    else if (step === "BUSINESS") setStep("INFO");
    else if (step === "PAYMENT") setStep("BUSINESS");
    else if (step === "OTP") {
      if (accountType === "owner") setStep("PAYMENT");
      else setStep("INFO");
    }
  };

  const handleCustomerRegister = async (overridePhone?: string) => {
    try {
      const phoneToUse = overridePhone || formData.phone;
      // For customers, we just trigger login to get OTP
      const res = await login({ phone: phoneToUse }).unwrap();
      // Auto-fill OTP code if returned in response (dev/staging env)
      if (res?.code) {
        setOtpCode(String(res.code));
      }
      setStep("OTP");
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err?.data?.message || "Failed to send code",
      );
    }
  };

  // Task 2.3 & 2.5: Fixed payload and duplicate account error handling
  const handleOwnerRegister = async (overridePhone?: string) => {
    try {
      const phoneToUse = overridePhone || formData.phone;
      const payload: any = {
        phone: phoneToUse,
        name: formData.name,
        businessName: {
          ar: formData.businessNameAr,
          en: formData.businessNameEn || formData.businessNameAr } };
      if (formData.zainCash.trim()) {
        payload.zainCash = formData.zainCash.trim().replace(/[\s\-\(\)]/g, "");
      }
      if (formData.qi.trim()) {
        payload.qi = formData.qi.trim().replace(/[\s\-\(\)]/g, "");
      }
      const res = await registerProvider(payload).unwrap();
      // Auto-fill OTP code if returned in response (dev/staging env)
      if (res?.code) {
        setOtpCode(String(res.code));
      }
      setStep("OTP");
    } catch (err: any) {
      // Task 2.5: Translated duplicate account error
      const rawMsg = err?.data?.message || "";
      const isDuplicate =
        rawMsg.toLowerCase().includes("already exists") ||
        err?.status === 409;

      if (isDuplicate) {
        Alert.alert(
          isArabic ? "حساب موجود مسبقاً" : "Account Already Exists",
          isArabic
            ? "يوجد حساب مالك مرتبط بهذا الرقم. هل تريد تسجيل الدخول؟"
            : "An owner account already exists for this number. Would you like to log in?",
          [
            { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
            {
              text: isArabic ? "تسجيل الدخول" : "Log In",
              onPress: () => router.replace("/login") },
          ],
        );
      } else {
        Alert.alert(
          t("common.error"),
          rawMsg || "Failed to register",
        );
      }
    }
  };

  const handleVerify = async () => {
    try {
      const otpCodeNumber = Number(otpCode);
      if (!/^\d{6}$/.test(otpCode) || !Number.isInteger(otpCodeNumber)) {
        Alert.alert(t("common.error"), "Invalid code");
        return;
      }

      const result = await verifyPhone({
        phone: formData.phone,
        code: otpCodeNumber,
        name: formData.name, // Pass name to update it in DB
      }).unwrap();
      const resolvedUserType =
        result.user?.type === "provider" ? "owner" : "customer";

      if (accountType === "owner" && resolvedUserType !== "owner") {
        Alert.alert(
          t("common.error"),
          isArabic
            ? "تعذر تفعيل حساب المالك لهذا الرقم. يرجى المحاولة من جديد."
            : "Could not activate an owner account for this phone number. Please try again.",
        );
        return;
      }

      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
          userType: resolvedUserType }),
      );

      logEvent(ANALYTICS_EVENTS.SIGN_UP, {
        method: "otp",
        user_type: resolvedUserType,
      });

      router.replace(
        resolvedUserType === "owner"
          ? "/(dashboard)/onboarding"
          : "/(tabs)/(customer)",
      );
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.data?.message || "Invalid code");
    }
  };

  // The payment step can only advance once at least one payout method is filled
  // in AND passes validation.
  const isPaymentStepValid =
    (!!formData.zainCash.trim() || !!formData.qi.trim()) &&
    !validateZainCash(formData.zainCash) &&
    !validateQiCard(formData.qi);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.header,
          { flexDirection: rowDirection }
        ]}
      >
        <CircleBackButton onPress={prevStep} />
        <ThemedText style={styles.headerTitle}>
          {t("auth.registerNow")}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <LoginHeaderLogo size={normalize.width(100)} color="#0061FE" />
          </View>

          {/* Task 2.1: TYPE step removed. INFO step now includes AuthToggle at the top */}
          {step === "INFO" && (
            <View style={styles.stepContainer}>
              {/* Task 2.2: StepProgress at the top */}
              <StepProgress {...getStepInfo()} />

              {/* Task 2.1: Toggle moved into INFO step */}
              <View style={styles.toggleInInfo}>
                <AuthToggle activeType={accountType} onChange={setAccountType} />
              </View>

              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: textStart },
                ]}
              >
                {isArabic ? "المعلومات الأساسية" : "Basic Information"}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: textStart },
                  ]}
                >
                  {t("auth.fullName")} *
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: textStart },
                  ]}
                  placeholder={
                    isArabic ? "ادخل اسمك الكامل" : "Enter your full name"
                  }
                  value={formData.name}
                  onChangeText={(val) =>
                    setFormData({ ...formData, name: val })
                  }
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: textStart },
                  ]}
                >
                  {t("auth.phone")} *
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: textStart },
                  ]}
                  placeholder="077XXXXXXXX"
                  value={formData.phone}
                  onChangeText={(val) =>
                    setFormData({ ...formData, phone: val })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <PrimaryButton
                label={
                  accountType === "owner"
                    ? isArabic
                      ? "التالي"
                      : "Next"
                    : isArabic
                      ? "إرسال الرمز"
                      : "Send Code"
                }
                onPress={nextStep}
                style={styles.mainBtn}
                activeColor="#0061FE"
              />
            </View>
          )}

          {step === "BUSINESS" && (
            <View style={styles.stepContainer}>
              {/* Task 2.2: StepProgress at the top */}
              <StepProgress {...getStepInfo()} />

              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: textStart },
                ]}
              >
                {isArabic ? "معلومات الشاليه" : "Chalet Information"}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: textStart },
                  ]}
                >
                  {isArabic
                    ? "اسم الشاليه (بالعربية) *"
                    : "Chalet Name (Arabic) *"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: textStart },
                  ]}
                  placeholder={
                    isArabic ? "مثلاً: شاليه النخيل" : "e.g. Al Nakheel Chalet"
                  }
                  value={formData.businessNameAr}
                  onChangeText={(val) =>
                    setFormData({ ...formData, businessNameAr: val })
                  }
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <ThemedText
                    style={[
                      styles.label,
                      { textAlign: textStart, marginBottom: 0, flex: 1 },
                    ]}
                  >
                    {isArabic
                      ? "اسم الشاليه (بالانجليزية)"
                      : "Chalet Name (English)"}
                  </ThemedText>
                  <AiTranslateButton
                    source={formData.businessNameAr}
                    onTranslated={(en) =>
                      setFormData((prev) => ({ ...prev, businessNameEn: en }))
                    }
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: textStart },
                  ]}
                  placeholder={
                    isArabic
                      ? "مثلاً: Al Nakheel Chalet"
                      : "e.g. Al Nakheel Chalet"
                  }
                  value={formData.businessNameEn}
                  onChangeText={(val) =>
                    setFormData({ ...formData, businessNameEn: val })
                  }
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <PrimaryButton
                label={isArabic ? "التالي" : "Next"}
                onPress={nextStep}
                style={styles.mainBtn}
                activeColor="#0061FE"
              />
            </View>
          )}

          {step === "PAYMENT" && (
            <View style={styles.stepContainer}>
              <StepProgress {...getStepInfo()} />

              <ThemedText style={[styles.stepTitle, { textAlign: textStart }]}>
                {isArabic ? "معلومات الدفع" : "Payout Details"}
              </ThemedText>

              <ThemedText
                style={[styles.paymentHint, { textAlign: textStart }]}
              >
                {isArabic
                  ? "أدخل وسيلة استلام مستحقاتك. مطلوب واحدة على الأقل (زين كاش أو بطاقة كي)."
                  : "Enter where you'll receive your payouts. At least one is required (Zain Cash or Qi Card)."}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign: textStart }]}>
                  {isArabic ? "رقم زين كاش" : "Zain Cash Number"}
                </ThemedText>
                <View
                  style={[
                    styles.payWrapper,
                    { flexDirection: rowDirection },
                    payErrors.zainCash ? styles.inputError : null,
                  ]}
                >
                  <ExpoImage source={zainCashLogo} style={styles.payLogo} contentFit="contain" />
                  <TextInput
                    style={[styles.payInput, { textAlign: textStart }]}
                    placeholder="07xxxxxxxxx"
                    keyboardType="phone-pad"
                    value={formData.zainCash}
                    onChangeText={(val) => {
                      setFormData({ ...formData, zainCash: val });
                      setPayErrors((prev) => ({
                        ...prev,
                        zainCash: validateZainCash(val),
                        general: null,
                      }));
                    }}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {!!payErrors.zainCash && (
                  <ThemedText style={[styles.errorText, { textAlign: textStart }]}>
                    {payErrors.zainCash}
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign: textStart }]}>
                  {isArabic ? "رقم بطاقة كي" : "Qi Card Number"}
                </ThemedText>
                <View
                  style={[
                    styles.payWrapper,
                    { flexDirection: rowDirection },
                    payErrors.qi ? styles.inputError : null,
                  ]}
                >
                  <ExpoImage source={qiLogo} style={styles.payLogo} contentFit="contain" />
                  <TextInput
                    style={[styles.payInput, { textAlign: textStart }]}
                    placeholder={
                      isArabic ? "رقم البطاقة المكوّن من 10 أرقام" : "10-digit card number"
                    }
                    keyboardType="numeric"
                    value={formData.qi}
                    onChangeText={(val) => {
                      setFormData({ ...formData, qi: val });
                      setPayErrors((prev) => ({
                        ...prev,
                        qi: validateQiCard(val),
                        general: null,
                      }));
                    }}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {!!payErrors.qi && (
                  <ThemedText style={[styles.errorText, { textAlign: textStart }]}>
                    {payErrors.qi}
                  </ThemedText>
                )}
              </View>

              {!!payErrors.general && (
                <ThemedText style={[styles.errorText, { textAlign: textStart, marginBottom: 8 }]}>
                  {payErrors.general}
                </ThemedText>
              )}

              <PrimaryButton
                label={isArabic ? "إرسال الطلب" : "Submit & Send Code"}
                onPress={nextStep}
                style={styles.mainBtn}
                loading={isRegisteringProvider}
                disabled={!isPaymentStepValid || isRegisteringProvider}
                activeColor={isPaymentStepValid ? "#0061FE" : "#CBD5E1"}
              />
            </View>
          )}

          {step === "OTP" && (
            <View style={styles.stepContainer}>
              {/* Task 2.2: StepProgress at the top */}
              <StepProgress {...getStepInfo()} />

              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: textStart },
                ]}
              >
                {isArabic ? "التحقق من الهاتف" : "Verify Phone"}
              </ThemedText>
              <ThemedText
                style={[
                   styles.stepSubtitle,
                   { textAlign: textStart },
                ]}
              >
                {isArabic
                  ? `أدخل الرمز المرسل إلى ${formData.phone}`
                  : `Enter code sent to ${formData.phone}`}
              </ThemedText>

              <View style={{ marginVertical: 30 }}>
                <OtpInput code={otpCode} setCode={setOtpCode} length={6} />
              </View>

              <PrimaryButton
                label={isArabic ? "تحقق وتفعيل" : "Verify & Activate"}
                onPress={handleVerify}
                style={styles.mainBtn}
                loading={isVerifying}
                activeColor="#0061FE"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white" },
  header: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    minHeight: 60,
    paddingVertical: 10 },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40 },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20 },
  stepContainer: {
    width: "100%" },
  // Task 2.1: New style for toggle inside INFO step
  toggleInInfo: {
    alignItems: "center",
    marginBottom: 20 },
  // Task 2.4: stepTitle fontSize changed from 22 to 20
  stepTitle: {
    width: "100%",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: 8,
    lineHeight: 30,
    paddingTop: 6 },
  // Task 2.4: stepSubtitle marginBottom changed from 30 to 20
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    marginBottom: 20 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0" },
  typeCardActive: {
    borderColor: "#0061FE",
    backgroundColor: "#EBF3FF" },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center" },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 12 },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: 4 },
  cardDesc: {
    fontSize: 8,
    fontFamily: "Alexandria-Medium",
    color: "#64748B" },
  // Task 2.4: inputGroup marginBottom changed from normalize.height(20) to 16
  inputGroup: {
    marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: normalize.height(8) },
  label: {
    width: "100%",
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: normalize.height(8),
    lineHeight: normalize.font(22),
    paddingTop: 4 },
  input: {
    width: "100%",
    minHeight: normalize.height(52),
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: normalize.height(10),
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B" },
  inputError: {
    borderColor: "#EF4444" },
  payWrapper: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    minHeight: normalize.height(52) },
  payLogo: {
    width: 30,
    height: 30,
    borderRadius: 6,
    marginEnd: 8 },
  payInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    minHeight: normalize.height(52),
    paddingVertical: normalize.height(10) },
  errorText: {
    width: "100%",
    color: "#EF4444",
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    marginTop: 6 },
  paymentHint: {
    width: "100%",
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    lineHeight: normalize.font(20),
    marginBottom: 16 },
  // Task 2.4: mainBtn marginTop changed from normalize.height(20) to 16
  mainBtn: {
    marginTop: 16,
    width: "100%",
    minHeight: normalize.height(54),
    paddingVertical: normalize.height(12) } });

// Task 2.2: progressStyles for StepProgress component
const progressStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E2E8F0" },
  activeDot: {
    backgroundColor: "#0061FE",
    width: 12,
    height: 12,
    borderRadius: 6 },
  doneDot: {
    backgroundColor: "#93C5FD" } });
