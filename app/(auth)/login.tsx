import { LoginBottomBackground } from "@/components/icons/login-design-elements";
import { LoginHeaderLogo } from "@/components/icons/login-header-logo";
import { ThemedText } from "@/components/themed-text";
import { AuthToggle } from "@/components/user/auth-toggle";
import { OtpInput, OtpInputHandle } from "@/components/user/otp-input";
import { PolicyModal } from "@/components/user/policy-modal";
import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { RootState } from "@/store";
import {
  AcceptedPolicy,
  PolicyType,
  useGetPoliciesQuery,
  useLoginMutation,
  useVerifyPhoneMutation,
} from "@/store/api/apiSlice";
import { setCredentials, setUserType } from "@/store/authSlice";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS } from "@/constants/analytics-events";
import { useDirection } from "@/i18n";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
// import { normalize } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 375;
const normalize = {
  width: (size: number) => size * scale,
  height: (size: number) => size * scale, // Using uniform scaling for simplicity
  font: (size: number) => size * scale,
  radius: (size: number) => size * scale,
};

// Signing in on an unknown number creates the account, so this screen carries
// the same app-wide consent as the register screen.
const APP_POLICIES: PolicyType[] = ["terms_of_use", "privacy"];

// How long the user has to wait before another code can be requested. The auth
// controller throttles at 10 requests/minute, so this keeps a user well clear of
// hitting it by mashing the button.
const RESEND_COOLDOWN_SECONDS = 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// A message the screen shows in the user's own language: an i18n key plus the
// values it interpolates. Resolved with `t()` at render/alert time so switching
// language never leaves a stale Arabic-only string on screen.
type LocalizedMessage = { key: string; params?: Record<string, number> };

// Maps a backend auth error (always English, coming straight off the API) onto
// an i18n key. `null` means "no mapping" — the caller then shows the server's
// own wording, so a brand-new server-side error still reaches the user instead
// of being flattened into a generic failure.
function authErrorKey(errorMsg: string): string | null {
  const msg = String(errorMsg).toLowerCase();

  if (
    msg.includes("not linked to an owner") ||
    msg.includes("register as an owner first")
  ) {
    return "auth.errors.notOwner";
  }
  if (
    msg.includes("invalid otp") ||
    msg.includes("invalid code") ||
    msg.includes("verification code is incorrect")
  ) {
    return "auth.errors.invalidOtp";
  }
  if (
    msg.includes("failed to send otp") ||
    msg.includes("failed to send code")
  ) {
    return "auth.errors.sendFailed";
  }
  if (
    msg.includes("user already exists") ||
    msg.includes("phone number already registered")
  ) {
    return "auth.errors.alreadyRegistered";
  }
  if (msg.includes("network") || msg.includes("connection")) {
    return "auth.errors.network";
  }
  if (msg.includes("unauthorized") || msg.includes("invalid credentials")) {
    return "auth.errors.unauthorized";
  }

  return null;
}

function validatePhoneNumber(text: string): LocalizedMessage | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");

  // Check if contains non-numeric (excluding leading +)
  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return { key: "auth.errors.phoneDigitsOnly" };
  }

  // Check if it's a test number (10-15 digits of non-standard format)
  const isTestNumber =
    /^\d{10,15}$/.test(clean) &&
    !clean.startsWith("07") &&
    !clean.startsWith("7") &&
    !clean.startsWith("+964") &&
    !clean.startsWith("00964");
  if (isTestNumber) {
    return null; // Allow test numbers
  }

  // Iraqi prefixes check
  const hasIraqiPrefix =
    clean.startsWith("07") ||
    clean.startsWith("7") ||
    clean.startsWith("+9647") ||
    clean.startsWith("9647") ||
    clean.startsWith("009647") ||
    // typing progress prefixes:
    clean === "+" ||
    clean === "+9" ||
    clean === "+96" ||
    clean === "+964" ||
    clean === "0" ||
    clean === "00" ||
    clean === "009" ||
    clean === "0096" ||
    clean === "00964";

  if (!hasIraqiPrefix) {
    return { key: "auth.errors.phonePrefix" };
  }

  // Length check based on prefix. The expected digit count is interpolated
  // rather than baked into the sentence — deliberately named `digits` and not
  // `count`, so i18next does not try to pluralize the key.
  const expectedLength = clean.startsWith("009647")
    ? 14
    : clean.startsWith("+9647")
      ? 13
      : clean.startsWith("9647")
        ? 12
        : clean.startsWith("07")
          ? 11
          : clean.startsWith("7")
            ? 10
            : null;

  if (expectedLength !== null) {
    if (clean.length < expectedLength) {
      return {
        key: "auth.errors.phoneTooShort",
        params: { digits: expectedLength },
      };
    }
    if (clean.length > expectedLength) {
      return {
        key: "auth.errors.phoneTooLong",
        params: { digits: expectedLength },
      };
    }
  }

  return null;
}

export function LoginScreen() {
  const { t } = useTranslation();
  const { isRTL, textAlign, inputTextAlign } = useDirection();
  const isArabic = isRTL;

  const linkMargin = { marginStart: normalize.width(6) };

  const dispatch = useDispatch();
  const router = useRouter();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyPhone, { isLoading: isVerifyLoading }] =
    useVerifyPhoneMutation();

  const reduxUserType = useSelector((state: RootState) => state.auth.userType);
  const [localUserType, setLocalUserType] = useState<"owner" | "customer">(
    reduxUserType === "owner" ? "owner" : "customer",
  );
  const isOwner = localUserType === "owner";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<LocalizedMessage | null>(null);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [justResent, setJustResent] = useState(false);
  const otpRef = useRef<OtpInputHandle>(null);

  // Countdown for the resend link — one timeout per tick, cleared on unmount and
  // whenever the step resets it to 0.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // ── Legal consent ────────────────────────────────────────────────────────
  // This screen doubles as signup: `POST /auth/login` creates the account when
  // the phone is new. So the app-wide policies are surfaced here as a
  // "by continuing you agree" notice and sent with the verify call — the server
  // requires them for a customer's first verification, and ignores a repeat
  // acceptance of a version already on file, so returning users cost nothing.
  const { data: policies = [] } = useGetPoliciesQuery();
  const policyByType = useMemo(
    () => new Map(policies.map((p) => [p.type, p])),
    [policies],
  );
  const [policyModal, setPolicyModal] = useState<PolicyType | null>(null);

  const policyTitle = (type: PolicyType, fallback: string) => {
    const policy = policyByType.get(type);
    if (!policy) return fallback;
    return (isArabic ? policy.title?.ar : policy.title?.en) || fallback;
  };

  const acceptedPolicies: AcceptedPolicy[] = APP_POLICIES.filter((type) =>
    policyByType.has(type),
  ).map((type) => ({ type, version: policyByType.get(type)!.version }));

  // Backend auth errors are English; show the translated wording when we
  // recognise the error and the server's own text when we don't.
  const localizeAuthError = (errorMsg: string) => {
    const key = authErrorKey(errorMsg);
    if (key) return t(key);
    return errorMsg || t("auth.errors.generic");
  };

  function handleTypeChange(type: "owner" | "customer") {
    if (step === "otp") return;
    setLocalUserType(type);
    // `auth.userType` doubles as the persisted guest marker — a guest is exactly
    // { isAuthenticated: false, userType: 'guest' }, and both route guards
    // (app/_layout.tsx and app/index.tsx) bounce anything else that isn't signed
    // in. Remembering which side of the toggle to show must never cost someone
    // their guest session, so the preference is written only when there is no
    // guest session to clobber. A successful verify sets the real userType.
    if (reduxUserType !== "guest") dispatch(setUserType(type));
  }

  function backToPhoneStep() {
    setStep("phone");
    setCode("");
    setResendIn(0);
    setJustResent(false);
  }

  useEffect(() => {
    const onBackPress = () => {
      if (step === "otp") {
        backToPhoneStep();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [step]);

  // `submittedCode` lets the OTP input hand us the freshly-completed code
  // directly — reading `code` here would still see the pre-update state.
  async function handleAction(submittedCode?: string) {
    if (step === "phone") {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setPhoneError({ key: "auth.errors.phoneRequired" });
        return;
      }

      const err = validatePhoneNumber(trimmedPhone);
      if (err) {
        setPhoneError(err);
        return;
      }

      // Phone validation: remove any spaces, dashes, or parentheses
      const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, "");

      try {
        const res = await login({ phone: cleanPhone }).unwrap();
        setPhone(cleanPhone);
        if (res?.code) {
          setCode(String(res.code));
        }
        setStep("otp");
        setJustResent(false);
        setResendIn(RESEND_COOLDOWN_SECONDS);
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Failed to send OTP";
        Alert.alert(t("common.error"), localizeAuthError(displayMsg));
      }
    } else {
      if (isVerifyLoading) return;
      try {
        const value = submittedCode ?? code;
        const otpCode = Number(value);
        if (!/^\d{6}$/.test(value) || !Number.isInteger(otpCode)) {
          Alert.alert(t("common.error"), t("auth.errors.invalidOtpFormat"));
          return;
        }

        const result = await verifyPhone({
          phone,
          code: otpCode,
          acceptedPolicies,
        }).unwrap();
        const accountType =
          result.user?.type === "provider" ? "provider" : "customer";

        // Owner mode needs an actual provider account behind it.
        if (isOwner && accountType !== "provider") {
          Alert.alert(t("common.error"), t("auth.errors.notOwner"));
          return;
        }

        // The toggle decides where they land, not the account type — a chalet
        // owner who picked "مستأجر" wants to browse and book, so send them to the
        // tenant side. The customer API accepts a provider's token (every
        // `customer/*` controller guards on JWT alone), and the switcher in
        // either profile screen moves them back.
        const mode = isOwner ? "owner" : "customer";

        dispatch(
          setCredentials({
            user: result.user,
            token: result.token,
            userType: mode,
            accountType,
          }),
        );
        logEvent(ANALYTICS_EVENTS.LOGIN, {
          method: "otp",
          user_type: mode,
          account_type: accountType,
        });
        router.replace(
          mode === "owner"
            ? "/(tabs)/(dashboard)/home"
            : "/(tabs)/(customer)",
        );
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Invalid OTP";
        // A rejected code — auto-submitted or not — leaves six filled boxes the
        // user would have to backspace through, so wipe it and reopen the
        // keyboard for a straight retype.
        setCode("");
        otpRef.current?.focus();
        Alert.alert(t("common.error"), localizeAuthError(String(displayMsg)));
      }
    }
  }

  // Re-requesting the code is the same `POST /auth/login` call that sent the
  // first one — the server just issues a new OTP for the number.
  async function handleResend() {
    if (resendIn > 0 || isLoginLoading) return;
    try {
      const res = await login({ phone }).unwrap();
      setCode(res?.code ? String(res.code) : "");
      setJustResent(true);
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      const msg = err?.data?.message;
      const displayMsg = Array.isArray(msg)
        ? msg.join(", ")
        : msg || "Failed to send OTP";
      Alert.alert(t("common.error"), localizeAuthError(displayMsg));
    }
  }

  return (
    <View style={[styles.container]}>
      {/* Top Logo */}
      <View style={styles.topLogoContainer}>
        <LoginHeaderLogo size={normalize.width(200)} color="#0061FE" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* User Type Toggle */}
          <View style={styles.toggleWrapper}>
            <AuthToggle
              activeType={localUserType}
              onChange={handleTypeChange}
              disabled={step === "otp"}
            />
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={[styles.headerRow, { alignItems: 'flex-start' }]}>
              <ThemedText style={[styles.title, { textAlign }]}>
                {t("auth.login")}
              </ThemedText>
            </View>

            {step === "phone" ? (
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { alignSelf: 'flex-start', textAlign },
                  ]}
                >
                  {t("auth.phone")}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    // Phone is always LTR digits, but aligned to the start side.
                    { textAlign: inputTextAlign, writingDirection: "ltr" },
                    phoneError ? { borderColor: "#EF4444" } : null,
                  ]}
                  placeholder={t("auth.phonePlaceholder")}
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    setPhoneError(validatePhoneNumber(val));
                  }}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                  multiline={false}
                />
                {phoneError && (
                  <ThemedText
                    style={[styles.errorText, { textAlign }]}
                  >
                    {t(phoneError.key, phoneError.params)}
                  </ThemedText>
                )}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { alignSelf: 'flex-start', textAlign },
                  ]}
                >
                  {t("auth.verificationCode")}
                </ThemedText>
                <ThemedText style={[styles.otpHint, { textAlign }]}>
                  {t("auth.otpSent")}
                  {"  "}
                  <ThemedText style={styles.otpHintPhone}>{phone}</ThemedText>
                </ThemedText>

                {/* The last digit submits on its own — the buttons below stay
                    for anyone who pastes or edits the code by hand. */}
                <OtpInput
                  ref={otpRef}
                  code={code}
                  setCode={setCode}
                  length={6}
                  autoFocus
                  onComplete={(value) => handleAction(value)}
                />

                <View style={styles.resendRow}>
                  {justResent && resendIn > 0 ? (
                    <ThemedText style={styles.resendSuccess}>
                      {isArabic
                        ? "تم إرسال رمز جديد"
                        : "A new code has been sent"}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.resendPrompt}>
                      {isArabic
                        ? "لم يصلك الرمز؟"
                        : "Didn't receive the code?"}
                    </ThemedText>
                  )}
                  {resendIn > 0 ? (
                    <ThemedText style={styles.resendTimer}>
                      {isArabic
                        ? `إعادة الإرسال خلال ${formatCountdown(resendIn)}`
                        : `Resend in ${formatCountdown(resendIn)}`}
                    </ThemedText>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={isLoginLoading}
                    >
                      <ThemedText
                        style={[
                          styles.resendLink,
                          isLoginLoading && styles.resendLinkDisabled,
                        ]}
                      >
                        {isLoginLoading
                          ? isArabic
                            ? "جارٍ الإرسال..."
                            : "Sending..."
                          : isArabic
                            ? "إعادة إرسال الرمز"
                            : "Resend code"}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Sign-up prompt sits under the form fields, right above the
                primary action — not competing with the screen title. */}
            <View style={[styles.subtextRow, { flexDirection: 'row' }]}>
              <ThemedText style={styles.subtitle}>
                {isOwner
                  ? isArabic
                    ? "مالك جديد؟"
                    : "New owner?"
                  : t("auth.dontHaveAccount")}
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push(`/register?type=${localUserType}`)}
              >
                <ThemedText style={[styles.linkText, linkMargin]}>
                  {isOwner
                    ? isArabic
                      ? "سجّل شاليهك"
                      : "Register your chalet"
                    : t("auth.registerNow")}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {step === "phone" ? (
              <PrimaryButton
                label={t("auth.login")}
                onPress={() => handleAction()}
                style={styles.loginBtn}
                activeColor="#0061FE"
                loading={isLoginLoading}
              />
            ) : (
              <View style={styles.actionsRow}>
                <SecondaryButton
                  label={isArabic ? "تعديل الرقم" : "Edit Number"}
                  onPress={backToPhoneStep}
                  isActive={false}
                  style={{ flex: 1 }}
                />
                <SecondaryButton
                  label={t("auth.verify")}
                  onPress={() => handleAction()}
                  isActive={true}
                  isLoading={isVerifyLoading}
                  style={{ flex: 1 }}
                  variant="inverse"
                />
              </View>
            )}

            {/* Signing in on a new number creates the account, so the policies
                that account is bound by are surfaced right here. */}
            <ThemedText style={[styles.consentNotice, { textAlign }]}>
              {isArabic
                ? "بالمتابعة، أنت توافق على "
                : "By continuing, you agree to the "}
              <ThemedText
                style={styles.consentLink}
                onPress={() => setPolicyModal("terms_of_use")}
              >
                {policyTitle(
                  "terms_of_use",
                  isArabic ? "سياسة استخدام التطبيق" : "Terms of Use",
                )}
              </ThemedText>
              {isArabic ? " و" : " and the "}
              <ThemedText
                style={styles.consentLink}
                onPress={() => setPolicyModal("privacy")}
              >
                {policyTitle(
                  "privacy",
                  isArabic ? "سياسة الخصوصية" : "Privacy Policy",
                )}
              </ThemedText>
            </ThemedText>

            {!isOwner && (
              <TouchableOpacity
                style={styles.guestLink}
                onPress={() => {
                  dispatch(setUserType("guest"));
                  router.replace("/(tabs)/(customer)");
                }}
              >
                <ThemedText style={styles.guestLinkText}>
                  {t("auth.browseAsGuest")}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Wave */}
      <View style={styles.bottomWaveContainer}>
        <LoginBottomBackground width={SCREEN_WIDTH} />
      </View>

      <PolicyModal
        visible={!!policyModal}
        type={policyModal}
        mode="read"
        onClose={() => setPolicyModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize.height(60),
    marginBottom: normalize.height(30),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: normalize.width(24),
    paddingBottom: normalize.height(100),
  },
  toggleWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  formContainer: {
    width: "100%",
  },
  headerRow: {
    marginBottom: 28,
  },
  title: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
    marginBottom: normalize.height(4),
    lineHeight: normalize.font(14),
    paddingTop: normalize.height(8),
  },
  subtextRow: {
    alignItems: "center",
    justifyContent: "center",
    // The group above already carries its own bottom margin.
    marginTop: 0,
  },
  subtitle: {
    fontSize: normalize.font(14),
    color: "#64748B",
    fontFamily: "IBMPlexSansArabic-Regular",
  },
  linkText: {
    fontSize: normalize.font(14),
    color: "#0061FE",
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  inputGroup: {
    marginBottom: normalize.height(25),
  },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#1E293B",
    marginBottom: normalize.height(10),
  },
  input: {
    width: "100%",
    minHeight: normalize.height(52),
    backgroundColor: "#FFFFFF",
    borderRadius: normalize.radius(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: normalize.width(18),
    paddingVertical: normalize.height(10),
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#1E293B",
  },
  otpHint: {
    fontSize: normalize.font(12.5),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#64748B",
    marginBottom: normalize.height(4),
  },
  otpHintPhone: {
    fontSize: normalize.font(12.5),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#1E293B",
    writingDirection: "ltr",
  },
  resendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: normalize.height(4),
  },
  resendPrompt: {
    fontSize: normalize.font(12.5),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#94A3B8",
  },
  resendSuccess: {
    fontSize: normalize.font(12.5),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#16A34A",
  },
  resendTimer: {
    fontSize: normalize.font(12.5),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
  },
  resendLink: {
    fontSize: normalize.font(12.5),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#0061FE",
  },
  resendLinkDisabled: {
    color: "#94A3B8",
  },
  loginBtn: {
    marginTop: 16,
    minHeight: normalize.height(52),
    width: "100%",
    paddingVertical: normalize.height(12),
    shadowOpacity: 0,
    elevation: 0,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  consentNotice: {
    marginTop: 18,
    width: "100%",
    fontSize: normalize.font(11.5),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#94A3B8",
    lineHeight: normalize.font(20),
  },
  consentLink: {
    fontSize: normalize.font(11.5),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#0061FE",
    textDecorationLine: "underline",
  },
  guestLink: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  guestLinkText: {
    fontSize: normalize.font(14),
    color: "#94A3B8",
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  errorText: {
    color: "#EF4444",
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Medium",
    marginTop: 6,
  },
  bottomWaveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  ownerHintRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4,
  },
  ownerHintText: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "IBMPlexSansArabic-Regular",
  },
  ownerHintLink: {
    fontSize: 14,
    color: "#0061FE",
    fontFamily: "IBMPlexSansArabic-Regular",
  },
});
// Default export for Expo Router
export default LoginScreen;
