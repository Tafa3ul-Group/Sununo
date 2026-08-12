import { LoginHeaderLogo } from "@/components/icons/login-header-logo";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { AuthToggle } from "@/components/user/auth-toggle";
import { OtpInput } from "@/components/user/otp-input";
import { PolicyModal } from "@/components/user/policy-modal";
import { PrimaryButton } from "@/components/user/primary-button";
import { normalize } from "@/constants/theme";

import {
    AcceptedPolicy,
    PolicyType,
    useGetPoliciesQuery,
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
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const zainCashLogo = require("@/assets/zaincash.png");
const qiLogo = require("@/assets/qi.svg");

// Registration never asks for chalet details: the account is created first and
// the owner adds their chalet afterwards from the onboarding hub (add-chalet),
// which is also where the chalet is submitted for approval.
type Step = "INFO" | "PAYMENT" | "OTP";

// Everyone agrees to these two before an account is created. They are shown as
// a checkbox with tappable titles — the full text opens in a reader.
const APP_POLICIES: PolicyType[] = ["terms_of_use", "privacy"];
// Owners additionally must READ (scroll to the end of) the chalet agreement
// before the owner registration form is even reachable.
const OWNER_POLICY: PolicyType = "provider_agreement";

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
  const { isRTL, textAlign, inputTextAlign } = useDirection();
  const isArabic = isRTL;

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

  // Only the payout methods the server can actually store: `POST
  // /auth/register-provider` accepts `zainCash` and `qi` and nothing else (see
  // RegisterProviderDto — the API runs a whitelisting ValidationPipe, so any
  // extra field is stripped before the controller sees it), and
  // `POST /provider/payouts` refuses a withdrawal unless one of those two is on
  // the account. Collecting bank details here would create owners who cannot be
  // paid, so the form does not ask for them.
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    zainCash: "",
    qi: "" });

  const [payErrors, setPayErrors] = useState<{
    zainCash?: string | null;
    qi?: string | null;
    general?: string | null;
  }>({});

  const [otpCode, setOtpCode] = useState("");

  // ── Legal consent ────────────────────────────────────────────────────────
  // Policies (and their versions) come from the backend. The accepted version is
  // echoed back on registration, and the server rejects consent to wording that
  // is no longer live — so an accepted entry is only valid while it matches.
  const {
    data: policies = [],
    isLoading: policiesLoading,
    isError: policiesError,
    refetch: refetchPolicies,
  } = useGetPoliciesQuery();

  const policyByType = useMemo(
    () => new Map(policies.map((p) => [p.type, p])),
    [policies],
  );

  // type → the version the user agreed to.
  const [accepted, setAccepted] = useState<Partial<Record<PolicyType, number>>>({});
  const [policyModal, setPolicyModal] = useState<{
    type: PolicyType;
    mode: "read" | "accept";
  } | null>(null);

  const isAccepted = (type: PolicyType) => {
    const policy = policyByType.get(type);
    return !!policy && accepted[type] === policy.version;
  };

  const policyTitle = (type: PolicyType) => {
    const policy = policyByType.get(type);
    if (!policy) return "";
    return isArabic ? policy.title?.ar : policy.title?.en || policy.title?.ar;
  };

  const appPoliciesReady = APP_POLICIES.every((type) => policyByType.has(type));
  const appPoliciesAccepted = APP_POLICIES.every(isAccepted);
  const ownerPolicyAccepted = isAccepted(OWNER_POLICY);

  const toggleAppPolicies = () => {
    if (appPoliciesAccepted) {
      setAccepted((prev) => {
        const next = { ...prev };
        APP_POLICIES.forEach((type) => delete next[type]);
        return next;
      });
      return;
    }
    // Never let the box be ticked for documents we could not load — the consent
    // would be unverifiable and the server would reject it anyway.
    if (!appPoliciesReady) return;
    setAccepted((prev) => {
      const next = { ...prev };
      APP_POLICIES.forEach((type) => {
        next[type] = policyByType.get(type)!.version;
      });
      return next;
    });
  };

  // Payload for the registration request — only the types this account needs.
  const acceptedPayload = (types: PolicyType[]): AcceptedPolicy[] =>
    types
      .filter((type) => accepted[type] !== undefined)
      .map((type) => ({ type, version: accepted[type]! }));

  // Task 2.2: getStepInfo function
  const getStepInfo = () => {
    if (accountType === "owner") {
      const map: Record<Step, number> = { INFO: 1, PAYMENT: 2, OTP: 3 };
      return { current: map[step] || 1, total: 3 };
    } else {
      const map: Record<Step, number> = { INFO: 1, PAYMENT: 1, OTP: 2 };
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

      if (!appPoliciesAccepted) {
        Alert.alert(
          t("common.error"),
          isArabic
            ? "يجب الموافقة على سياسة استخدام التطبيق وسياسة الخصوصية قبل إنشاء الحساب"
            : "You must agree to the Terms of Use and the Privacy Policy before creating an account",
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
          setStep("PAYMENT");
        } else {
          handleCustomerRegister(cleanPhone);
        }
        return updated;
      });
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
    else if (step === "PAYMENT") setStep("INFO");
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
        err?.data?.message || t("auth.errors.sendFailed"),
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
        // Owners consent to all three documents; the server rejects the
        // registration outright if any of them is missing or out of date.
        acceptedPolicies: acceptedPayload([...APP_POLICIES, OWNER_POLICY]) };
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
      // Task 2.5: Translated duplicate account error.
      // NestJS validation errors return `message` as a string[], so normalize
      // to a string before calling string methods (guards against a crash).
      const rawData = err?.data?.message;
      const rawMsg = Array.isArray(rawData)
        ? rawData.join("\n")
        : typeof rawData === "string"
          ? rawData
          : "";
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
          rawMsg || t("auth.errors.registerFailed"),
        );
      }
    }
  };

  const handleVerify = async () => {
    try {
      const otpCodeNumber = Number(otpCode);
      if (!/^\d{6}$/.test(otpCode) || !Number.isInteger(otpCodeNumber)) {
        Alert.alert(t("common.error"), t("auth.errors.invalidOtpFormat"));
        return;
      }

      const result = await verifyPhone({
        phone: formData.phone,
        code: otpCodeNumber,
        name: formData.name, // Pass name to update it in DB
        // A customer account only comes into being here, so this is where its
        // consent is recorded. Owners already sent theirs with register-provider
        // — resending would just duplicate the audit rows.
        ...(accountType === "customer"
          ? { acceptedPolicies: acceptedPayload(APP_POLICIES) }
          : {}),
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

      // The toggle decides where they land, not the account type — same rule as
      // the login screen. Someone who signed up with "مستأجر" selected wants to
      // browse and book, even when the phone already belongs to a provider
      // account, so they get the tenant side; `accountType` still records what
      // the account really is, which is what gates the mode switcher later.
      const mode = accountType === "owner" ? "owner" : "customer";

      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
          userType: mode,
          accountType:
            result.user?.type === "provider" ? "provider" : "customer" }),
      );

      logEvent(ANALYTICS_EVENTS.SIGN_UP, {
        method: "otp",
        user_type: mode,
      });

      router.replace(
        mode === "owner" ? "/(dashboard)/onboarding" : "/(tabs)/(customer)",
      );
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err?.data?.message || t("auth.errors.invalidOtp"),
      );
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
        style={styles.header}
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

              {/* Owner gate: the chalet agreement has to be read and accepted
                  before the owner registration form is reachable at all. */}
              {accountType === "owner" && !ownerPolicyAccepted ? (
                <View style={styles.gateCard}>
                  <ThemedText style={[styles.gateTitle, { textAlign }]}>
                    {policyTitle(OWNER_POLICY) ||
                      (isArabic
                        ? "سياسة الشاليهات مع المنصة"
                        : "Chalet Owner Agreement")}
                  </ThemedText>
                  <ThemedText style={[styles.gateBody, { textAlign }]}>
                    {isArabic
                      ? "قبل إنشاء حساب مالك، يجب قراءة سياسة الشاليهات مع المنصة والموافقة عليها. تشرح السياسة العمولة وآلية استلام المستحقات والتزاماتك تجاه الضيوف."
                      : "Before creating an owner account you must read and accept the chalet owner agreement. It covers the commission, how payouts reach you, and your obligations to guests."}
                  </ThemedText>

                  {policiesError ? (
                    <>
                      <ThemedText
                        style={[styles.errorText, { textAlign }]}
                      >
                        {isArabic
                          ? "تعذّر تحميل السياسة. تحقق من الاتصال."
                          : "Could not load the policy. Check your connection."}
                      </ThemedText>
                      <PrimaryButton
                        label={isArabic ? "إعادة المحاولة" : "Retry"}
                        onPress={() => refetchPolicies()}
                        style={styles.mainBtn}
                        activeColor="#0061FE"
                      />
                    </>
                  ) : (
                    <PrimaryButton
                      label={
                        isArabic
                          ? "قراءة السياسة والموافقة"
                          : "Read the agreement & accept"
                      }
                      onPress={() =>
                        setPolicyModal({ type: OWNER_POLICY, mode: "accept" })
                      }
                      style={styles.mainBtn}
                      loading={policiesLoading}
                      disabled={!policyByType.has(OWNER_POLICY)}
                      activeColor={
                        policyByType.has(OWNER_POLICY) ? "#0061FE" : "#CBD5E1"
                      }
                    />
                  )}
                </View>
              ) : (
                <>
                  {accountType === "owner" && (
                    <View style={styles.acceptedBanner}>
                      <ThemedText style={[styles.acceptedText, { textAlign }]}>
                        {isArabic
                          ? "✓ تمت الموافقة على سياسة الشاليهات مع المنصة"
                          : "✓ Chalet owner agreement accepted"}
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() =>
                          setPolicyModal({ type: OWNER_POLICY, mode: "read" })
                        }
                      >
                        <ThemedText style={styles.linkText}>
                          {isArabic ? "عرض" : "View"}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  <ThemedText
                    style={[
                      styles.stepTitle,
                      { textAlign },
                    ]}
                  >
                    {isArabic ? "المعلومات الأساسية" : "Basic Information"}
                  </ThemedText>

                  <View style={styles.inputGroup}>
                    <ThemedText
                      style={[
                        styles.label,
                        { textAlign },
                      ]}
                    >
                      {t("auth.fullName")} *
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { textAlign: inputTextAlign },
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
                        { textAlign },
                      ]}
                    >
                      {t("auth.phone")} *
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { textAlign: inputTextAlign },
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

                  {/* Consent to the app-wide policies — required before the account
                      is created. Titles open the full text in a reader. */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={toggleAppPolicies}
                    disabled={!appPoliciesReady}
                    style={styles.consentRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        appPoliciesAccepted && styles.checkboxChecked,
                      ]}
                    >
                      {appPoliciesAccepted && (
                        <ThemedText style={styles.checkboxTick}>✓</ThemedText>
                      )}
                    </View>
                    <ThemedText style={[styles.consentText, { textAlign }]}>
                      {isArabic ? "أوافق على " : "I agree to the "}
                      <ThemedText
                        style={styles.linkText}
                        onPress={() =>
                          setPolicyModal({ type: "terms_of_use", mode: "read" })
                        }
                      >
                        {policyTitle("terms_of_use") ||
                          (isArabic ? "سياسة استخدام التطبيق" : "Terms of Use")}
                      </ThemedText>
                      {isArabic ? " و" : " and the "}
                      <ThemedText
                        style={styles.linkText}
                        onPress={() =>
                          setPolicyModal({ type: "privacy", mode: "read" })
                        }
                      >
                        {policyTitle("privacy") ||
                          (isArabic ? "سياسة الخصوصية" : "Privacy Policy")}
                      </ThemedText>
                    </ThemedText>
                  </TouchableOpacity>

                  {policiesError && (
                    <TouchableOpacity onPress={() => refetchPolicies()}>
                      <ThemedText style={[styles.errorText, { textAlign }]}>
                        {isArabic
                          ? "تعذّر تحميل السياسات. اضغط لإعادة المحاولة."
                          : "Could not load the policies. Tap to retry."}
                      </ThemedText>
                    </TouchableOpacity>
                  )}

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
                    disabled={!appPoliciesAccepted}
                    activeColor={appPoliciesAccepted ? "#0061FE" : "#CBD5E1"}
                  />
                </>
              )}
            </View>
          )}

          {step === "PAYMENT" && (
            <View style={styles.stepContainer}>
              <StepProgress {...getStepInfo()} />

              <ThemedText style={[styles.stepTitle, { textAlign }]}>
                {isArabic ? "معلومات الدفع" : "Payout Details"}
              </ThemedText>

              <ThemedText
                style={[styles.paymentHint, { textAlign }]}
              >
                {isArabic
                  ? "أدخل وسيلة استلام مستحقاتك. مطلوب واحدة على الأقل (زين كاش أو بطاقة كي)."
                  : "Enter where you'll receive your payouts. At least one is required (Zain Cash or Qi Card)."}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign }]}>
                  {isArabic ? "رقم زين كاش" : "Zain Cash Number"}
                </ThemedText>
                <View
                  style={[
                    styles.payWrapper,
                    { flexDirection: 'row' },
                    payErrors.zainCash ? styles.inputError : null,
                  ]}
                >
                  <ExpoImage source={zainCashLogo} style={styles.payLogo} contentFit="contain" />
                  <TextInput
                    style={[styles.payInput, { textAlign: inputTextAlign }]}
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
                  <ThemedText style={[styles.errorText, { textAlign }]}>
                    {payErrors.zainCash}
                  </ThemedText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign }]}>
                  {isArabic ? "رقم بطاقة كي" : "Qi Card Number"}
                </ThemedText>
                <View
                  style={[
                    styles.payWrapper,
                    { flexDirection: 'row' },
                    payErrors.qi ? styles.inputError : null,
                  ]}
                >
                  <ExpoImage source={qiLogo} style={styles.payLogo} contentFit="contain" />
                  <TextInput
                    style={[styles.payInput, { textAlign: inputTextAlign }]}
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
                  <ThemedText style={[styles.errorText, { textAlign }]}>
                    {payErrors.qi}
                  </ThemedText>
                )}
              </View>

              {/* Bank transfer used to be offered here, but the API has nowhere
                  to put it: RegisterProviderDto accepts only zainCash/qi and the
                  whitelisting ValidationPipe drops everything else, so an owner
                  who filled in a bank account only ended up with no payout
                  method at all and was blocked at withdrawal time. Restore these
                  fields once the backend stores bank details AND
                  POST /provider/payouts accepts them. */}

              {!!payErrors.general && (
                <ThemedText style={[styles.errorText, { textAlign, marginBottom: 8 }]}>
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
                  { textAlign },
                ]}
              >
                {isArabic ? "التحقق من الهاتف" : "Verify Phone"}
              </ThemedText>
              <ThemedText
                style={[
                   styles.stepSubtitle,
                   { textAlign },
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

      <PolicyModal
        visible={!!policyModal}
        type={policyModal?.type ?? null}
        mode={policyModal?.mode}
        onClose={() => setPolicyModal(null)}
        onAccept={({ type, version }) =>
          setAccepted((prev) => ({ ...prev, [type]: version }))
        }
      />
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
  // ── Legal consent ───────────────────────────────────────────────────────
  gateCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16 },
  gateTitle: {
    width: "100%",
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: "#1E293B",
    lineHeight: normalize.font(24),
    marginBottom: 6 },
  gateBody: {
    width: "100%",
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Regular",
    color: "#64748B",
    lineHeight: normalize.font(22) },
  acceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16 },
  acceptedText: {
    flex: 1,
    fontSize: normalize.font(11.5),
    fontFamily: "Alexandria-Medium",
    color: "#15803D",
    lineHeight: normalize.font(20) },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
    marginBottom: 4 },
  checkbox: {
    marginTop: 2,
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E1" },
  checkboxChecked: {
    backgroundColor: "#0061FE",
    borderColor: "#0061FE" },
  checkboxTick: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Alexandria-Bold",
    lineHeight: 18 },
  consentText: {
    flex: 1,
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Regular",
    color: "#475569",
    lineHeight: normalize.font(22) },
  linkText: {
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-SemiBold",
    color: "#0061FE",
    textDecorationLine: "underline" },
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
