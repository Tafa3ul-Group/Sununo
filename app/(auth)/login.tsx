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
    View
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
// import { normalize } from "@/constants/theme";
import { isRTL } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 375;
const normalize = {
  width: (size: number) => size * scale,
  height: (size: number) => size * scale, // Using uniform scaling for simplicity
  font: (size: number) => size * scale,
  radius: (size: number) => size * scale };

export function LoginScreen() {
  const { t, i18n } = useTranslation();
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
  const [code, setCode] = useState("");
  const [devAutoFilled, setDevAutoFilled] = useState(false);

  function handleTypeChange(type: "owner" | "customer") {
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
        Alert.alert(t('common.error'), isRTL ? "يرجى إدخال رقم الهاتف" : "Please enter your phone number");
        return;
      }

      try {
        const res = await login({ phone: trimmedPhone }).unwrap();
        setPhone(trimmedPhone);
        if (res?.code) {
          setCode(String(res.code));
          setDevAutoFilled(true);
        }
        setStep("otp");
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || "Failed to send OTP");
        Alert.alert(t('common.error'), String(displayMsg));
      }
    } else {
      try {
        const otpCode = Number(code);
        if (!/^\d{6}$/.test(code) || !Number.isInteger(otpCode)) {
          Alert.alert(t('common.error'), "Invalid OTP");
          return;
        }

        const result = await verifyPhone({ phone, code: otpCode }).unwrap();
        const resolvedUserType = result.user?.type === "provider" ? "owner" : "customer";

        if (isOwner && resolvedUserType !== "owner") {
          Alert.alert(
            t('common.error'),
            isRTL
              ? "هذا الرقم غير مرتبط بحساب مالك. يرجى التسجيل كمالك أولاً."
              : "This phone number is not linked to an owner account. Please register as an owner first.",
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
            />
            {isOwner && (
              <View style={[styles.ownerHintRow, { flexDirection: 'row' }]}>
                <ThemedText style={styles.ownerHintText}>
                  {isRTL ? "مالك جديد؟" : "New owner?"}
                </ThemedText>
                <TouchableOpacity onPress={() => router.push(`/register?type=owner`)}>
                  <ThemedText style={[styles.ownerHintLink, { marginStart: 6 }]}>
                    {isRTL ? "سجّل شاليهك" : "Register your chalet"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={[styles.headerRow, { alignItems: 'flex-start' }]}>
              <ThemedText style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.login')}</ThemedText>
              {!isOwner && (
                <View style={[styles.subtextRow, { flexDirection: 'row' }]}>
                  <ThemedText style={styles.subtitle}>
                    {t('auth.dontHaveAccount')}
                  </ThemedText>
                  <TouchableOpacity onPress={() => router.push(`/register?type=${localUserType}`)}>
                    <ThemedText style={[styles.linkText, { marginStart: normalize.width(6) }]}>
                      {t('auth.registerNow')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {step === "phone" ? (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.phone')}</ThemedText>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t('auth.phonePlaceholder')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                  multiline={false}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.verificationCode')}</ThemedText>
                <OtpInput 
                  code={code} 
                  setCode={setCode} 
                  length={6} 
                />
                {devAutoFilled && (
                  <ThemedText style={styles.devHint}>
                    {isRTL ? "تم ملء الكود تلقائياً للاختبار" : "Code auto-filled for testing"}
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
    fontSize: 20,
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
    marginBottom: normalize.height(4),
    lineHeight: normalize.font(32),
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
    fontFamily: "Alexandria-Bold" },
  inputGroup: {
    marginBottom: normalize.height(25) },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
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
    fontSize: normalize.font(15),
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
    fontSize: normalize.font(15),
    color: "#94A3B8",
    fontFamily: "Alexandria-Bold" },
  bottomWaveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1 },
  devHint: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: "Alexandria-Regular",
    textAlign: "center",
    marginTop: 8 },
  ownerHintRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 4 },
  ownerHintText: {
    fontSize: 13,
    color: "#64748B",
    fontFamily: "Alexandria-Medium" },
  ownerHintLink: {
    fontSize: 13,
    color: "#0061FE",
    fontFamily: "Alexandria-Bold" } });
// Default export for Expo Router
export default LoginScreen;
