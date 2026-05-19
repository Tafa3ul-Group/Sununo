import {
    LoginBottomBackground
} from "@/components/icons/login-design-elements";
import { LoginHeaderLogo } from "@/components/icons/login-header-logo";
import { ThemedText } from "@/components/themed-text";
import { AuthToggle } from "@/components/user/auth-toggle";
import { OtpInput } from "@/components/user/otp-input";
import { PrimaryButton } from "@/components/user/primary-button";
import { RootState } from "@/store";
import { useLoginMutation, useVerifyPhoneMutation } from "@/store/api/apiSlice";
import { setCredentials, setUserType } from "@/store/authSlice";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
    I18nManager
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
// import { normalize } from "@/constants/theme";


const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 375;
const normalize = {
  width: (size: number) => size * scale,
  height: (size: number) => size * scale, // Using uniform scaling for simplicity
  font: (size: number) => size * scale,
  radius: (size: number) => size * scale };

function translateAuthError(errorMsg: string): string {
  const msg = String(errorMsg).toLowerCase();
  
  if (msg.includes("not linked to an owner") || msg.includes("register as an owner first")) {
    return "هذا الرقم غير مرتبط بحساب مالك. يرجى التسجيل كمالك أولاً.";
  }
  if (msg.includes("invalid otp") || msg.includes("invalid code") || msg.includes("verification code is incorrect")) {
    return "رمز التحقق غير صحيح. يرجى التأكد من الرمز والمحاولة مجدداً.";
  }
  if (msg.includes("failed to send otp") || msg.includes("failed to send code")) {
    return "فشل في إرسال رمز التحقق. يرجى المحاولة مرة أخرى.";
  }
  if (msg.includes("user already exists") || msg.includes("phone number already registered")) {
    return "رقم الهاتف هذا مسجل بالفعل.";
  }
  if (msg.includes("network") || msg.includes("connection")) {
    return "فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.";
  }
  if (msg.includes("unauthorized") || msg.includes("invalid credentials")) {
    return "البيانات المدخلة غير صحيحة.";
  }
  
  return errorMsg || "حدث خطأ ما، يرجى المحاولة مرة أخرى.";
}

function validatePhoneNumber(text: string): string | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");
  
  // Check if contains non-numeric (excluding leading +)
  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return "يجب أن يحتوي رقم الهاتف على أرقام فقط";
  }

  // Check if it's a test number (10-15 digits of non-standard format)
  const isTestNumber = /^\d{10,15}$/.test(clean) && !clean.startsWith("07") && !clean.startsWith("7") && !clean.startsWith("+964") && !clean.startsWith("00964");
  if (isTestNumber) {
    return null; // Allow test numbers
  }

  // Iraqi prefixes check
  const hasIraqiPrefix = clean.startsWith("07") || 
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
    return "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+";
  }

  // Length check based on prefix
  if (clean.startsWith("07")) {
    if (clean.length < 11) return "رقم الهاتف قصير جداً (مطلوب 11 رقماً)";
    if (clean.length > 11) return "رقم الهاتف طويل جداً (مطلوب 11 رقماً)";
  } else if (clean.startsWith("7")) {
    if (clean.length < 10) return "رقم الهاتف قصير جداً (مطلوب 10 أرقام)";
    if (clean.length > 10) return "رقم الهاتف طويل جداً (مطلوب 10 أرقام)";
  } else if (clean.startsWith("+9647")) {
    if (clean.length < 13) return "رقم الهاتف قصير جداً (مطلوب 13 رقماً)";
    if (clean.length > 13) return "رقم الهاتف طويل جداً (مطلوب 13 رقماً)";
  } else if (clean.startsWith("9647")) {
    if (clean.length < 12) return "رقم الهاتف قصير جداً (مطلوب 12 رقماً)";
    if (clean.length > 12) return "رقم الهاتف طويل جداً (مطلوب 12 رقماً)";
  } else if (clean.startsWith("009647")) {
    if (clean.length < 14) return "رقم الهاتف قصير جداً (مطلوب 14 رقماً)";
    if (clean.length > 14) return "رقم الهاتف طويل جداً (مطلوب 14 رقماً)";
  }

  return null;
}

export function LoginScreen() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language ? i18n.language.startsWith("ar") : true;
  const textStart: "left" | "right" = isArabic === I18nManager.isRTL ? "left" : "right";
  const textEnd: "left" | "right" = isArabic === I18nManager.isRTL ? "right" : "left";
  const alignStart: "flex-start" | "flex-end" = isArabic === I18nManager.isRTL ? "flex-start" : "flex-end";
  const rowDir: "row" | "row-reverse" = isArabic === I18nManager.isRTL ? "row" : "row-reverse";

  const linkMargin = isArabic === I18nManager.isRTL
    ? { marginLeft: normalize.width(6) }
    : { marginRight: normalize.width(6) };

  const hintMargin = isArabic === I18nManager.isRTL
    ? { marginLeft: 6 }
    : { marginRight: 6 };

  const dispatch = useDispatch();
  const router = useRouter();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyPhone, { isLoading: isVerifyLoading }] = useVerifyPhoneMutation();

  const reduxUserType = useSelector((state: RootState) => state.auth.userType);
  const [localUserType, setLocalUserType] = useState<"owner" | "customer">(
    reduxUserType === "owner" ? "owner" : "customer"
  );
  const isOwner = localUserType === "owner";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [devAutoFilled, setDevAutoFilled] = useState(false);

  function handleTypeChange(type: "owner" | "customer") {
    if (step === "otp") return;
    setLocalUserType(type);
    dispatch(setUserType(type));
  }

  useEffect(() => {
    const onBackPress = () => {
      if (step === "otp") {
        setStep("phone");
        setDevAutoFilled(false);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [step]);

  async function handleAction() {
    if (step === "phone") {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setPhoneError("يرجى إدخال رقم الهاتف");
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
          setDevAutoFilled(true);
        }
        setStep("otp");
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || "Failed to send OTP");
        Alert.alert(t('common.error'), translateAuthError(displayMsg));
      }
    } else {
      try {
        const otpCode = Number(code);
        if (!/^\d{6}$/.test(code) || !Number.isInteger(otpCode)) {
          Alert.alert(t('common.error'), "رمز التحقق غير صالح");
          return;
        }

        const result = await verifyPhone({ phone, code: otpCode }).unwrap();
        const resolvedUserType = result.user?.type === "provider" ? "owner" : "customer";

        if (isOwner && resolvedUserType !== "owner") {
          Alert.alert(
            t('common.error'),
            "هذا الرقم غير مرتبط بحساب مالك. يرجى التسجيل كمالك أولاً.",
          );
          return;
        }

        dispatch(
          setCredentials({
            user: result.user,
            token: result.token,
            userType: resolvedUserType }),
        );
        router.replace(resolvedUserType === "owner" ? "/(tabs)/(dashboard)/home" : "/(tabs)/(customer)");
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || "Invalid OTP");
        Alert.alert(t('common.error'), String(displayMsg));
      }
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
            <View style={[styles.headerRow, { alignItems: alignStart }]}>
              <ThemedText style={[styles.title, { textAlign: textStart }]}>{t('auth.login')}</ThemedText>
              <View style={[styles.subtextRow, { flexDirection: rowDir }]}>
                <ThemedText style={styles.subtitle}>
                  {isOwner
                    ? (isArabic ? "مالك جديد؟" : "New owner?")
                    : t('auth.dontHaveAccount')}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push(`/register?type=${localUserType}`)}>
                  <ThemedText style={[styles.linkText, linkMargin]}>
                    {isOwner
                      ? (isArabic ? "سجّل شاليهك" : "Register your chalet")
                      : t('auth.registerNow')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {step === "phone" ? (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign: textStart }]}>{t('auth.phone')}</ThemedText>
                <TextInput
                  style={[
                    styles.input, 
                    { textAlign: textStart },
                    phoneError ? { borderColor: "#EF4444" } : null
                  ]}
                  placeholder={t('auth.phonePlaceholder')}
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
                  <ThemedText style={[styles.errorText, { textAlign: textStart }]}>
                    {phoneError}
                  </ThemedText>
                )}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign: textStart }]}>{t('auth.verificationCode')}</ThemedText>
                <OtpInput 
                  code={code} 
                  setCode={setCode} 
                  length={6} 
                />
                {devAutoFilled && (
                  <ThemedText style={styles.devHint}>
                    {isArabic ? "تم ملء الكود تلقائياً للاختبار" : "Code auto-filled for testing"}
                  </ThemedText>
                )}
              </View>
            )}

            <PrimaryButton
              label={step === "phone" ? t('auth.login') : t('auth.verify')}
              onPress={handleAction}
              style={styles.loginBtn}
              activeColor="#0061FE"
              loading={isLoginLoading || isVerifyLoading}
            />

            {!isOwner && (
              <TouchableOpacity 
                style={styles.guestLink}
                onPress={() => {
                  dispatch(setUserType('guest'));
                  router.replace("/(tabs)/(customer)");
                }}
              >
                <ThemedText style={styles.guestLinkText}>
                  {t('auth.browseAsGuest')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white" },
  topLogoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize.height(60),
    marginBottom: normalize.height(30) },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: normalize.width(24),
    paddingBottom: normalize.height(100) },
  toggleWrapper: {
    alignItems: "center",
    marginBottom: 24 },
  formContainer: {
    width: "100%" },
  headerRow: {
    marginBottom: 28 },
  title: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: normalize.height(4),
    lineHeight: normalize.font(14),
    paddingTop: normalize.height(8) },
  subtextRow: {
    alignItems: "center" },
  subtitle: {
    fontSize: normalize.font(14),
    color: "#64748B",
    fontFamily: "Alexandria-Medium" },
  linkText: {
    fontSize: normalize.font(14),
    color: "#0061FE",
    fontFamily: "Alexandria-Medium" },
  inputGroup: {
    marginBottom: normalize.height(25) },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
    marginBottom: normalize.height(10) },
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
    fontFamily: "Alexandria-Medium",
    color: "#1E293B" },
  loginBtn: {
    marginTop: 16,
    minHeight: normalize.height(52),
    width: "100%",
    paddingVertical: normalize.height(12),
    shadowOpacity: 0,
    elevation: 0 },
  guestLink: {
    marginTop: 24,
    width: "100%",
    alignItems: "center" },
  guestLinkText: {
    fontSize: normalize.font(14),
    color: "#94A3B8",
    fontFamily: "Alexandria-Medium" },
  errorText: {
    color: "#EF4444",
    fontSize: normalize.font(12),
    fontFamily: "Alexandria-Medium",
    marginTop: 6,
    textAlign: "right" },
  bottomWaveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1 },
  devHint: {
    fontSize: 8,
    color: "#94A3B8",
    fontFamily: "Alexandria-Medium",
    textAlign: "center",
    marginTop: 8 },
  ownerHintRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4 },
  ownerHintText: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "Alexandria-Medium" },
  ownerHintLink: {
    fontSize: 14,
    color: "#0061FE",
    fontFamily: "Alexandria-Medium" } });
// Default export for Expo Router
export default LoginScreen;
