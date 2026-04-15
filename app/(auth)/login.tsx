import { SolarAltArrowRightLinear } from "@/components/icons/solar-icons";
import { Colors, Spacing, Typography, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import { setCredentials } from "@/store/authSlice";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import {
  useLazyGetMeQuery,
  useLoginMutation,
  useVerifyPhoneMutation,
} from "@/store/api/apiSlice";

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const userType = useSelector((state: RootState) => state.auth.userType);

  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [phone, setPhone] = React.useState("7700000001");
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [needsName, setNeedsName] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyPhoneMutation, { isLoading: isVerifyLoading }] =
    useVerifyPhoneMutation();
  const [triggerGetMe] = useLazyGetMeQuery();

  const handleSendCode = async () => {
    setErrorText("");
    try {
      if (phone.length < 10 || phone.length > 11) {
        setErrorText("يرجى إدخال رقم هاتف صحيح (10-11 رقم)");
        return;
      }
      const res = await loginMutation({ phone }).unwrap();
      if (res.haveName === false) {
        setNeedsName(true);
      }
      // Auto-fill OTP if provided in the response (useful for testing)
      if (res.code) {
        setCode(res.code.toString());
      }
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      setErrorText(
        err?.data?.message?.[0] || err?.data?.message || "حدث خطأ غير متوقع",
      );
    }
  };

  const handleVerify = async () => {
    setErrorText("");
    try {
      if (!code) {
        setErrorText("يرجى إدخال رمز التحقق");
        return;
      }
      if (needsName && !name) {
        setErrorText("يرجى إدخال اسمك");
        return;
      }

      const data: any = { phone, code: Number(code) };
      if (needsName) data.name = name;

      const res = await verifyPhoneMutation(data).unwrap();

      // Store token first to authorize next request
      dispatch(
        setCredentials({
          user: res.user,
          token: res.token,
          userType: userType || "customer",
        }),
      );

      // Fetch full profile info
      try {
        const fullUser = await triggerGetMe({}).unwrap();
        dispatch(
          setCredentials({
            user: fullUser,
            token: res.token,
            userType: userType || "customer",
          }),
        );
      } catch (meErr) {
        console.error("Me fetch failed", meErr);
      }

      router.replace(
        userType === "owner" ? "/(tabs)/(dashboard)/home" : "/(tabs)",
      );
    } catch (err: any) {
      console.error(err);
      setErrorText(err?.data?.message || "رمز التحقق غير صحيح");
    }
  };

  const isOwner = userType === "owner";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === "otp") setStep("phone");
              else router.back();
            }}
            disabled={isLoginLoading || isVerifyLoading}
          >
            <SolarAltArrowRightLinear size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>تسجيل الدخول</Text>
            <Text style={styles.subtitle}>
              {step === "phone"
                ? isOwner
                  ? "أهلاً بك مجدداً، صاحب الشاليه"
                  : "أهلاً بك مجدداً، يسعدنا انضمامك"
                : "أدخل رمز التحقق المرسل إلى رقم هاتفك"}
            </Text>
          </View>

          <View style={styles.form}>
            {errorText ? (
              <Text
                style={{ color: "red", textAlign: "right", marginBottom: 10 }}
              >
                {errorText}
              </Text>
            ) : null}

            {step === "phone" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>رقم الهاتف</Text>
                <TextInput
                  style={[styles.input, { textAlign: "left" }]}
                  placeholder="770 000 0000"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  editable={!isLoginLoading}
                />
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>رمز التحقق</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: "center", letterSpacing: 5 },
                    ]}
                    placeholder="123456"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isVerifyLoading}
                  />
                </View>

                {needsName && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>اسمك الكامل</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="محمد أحمد"
                      value={name}
                      onChangeText={setName}
                      editable={!isVerifyLoading}
                    />
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: Colors.primary }]}
              onPress={step === "phone" ? handleSendCode : handleVerify}
              activeOpacity={0.8}
              disabled={isLoginLoading || isVerifyLoading}
            >
              <Text style={styles.loginButtonText}>
                {step === "phone"
                  ? isLoginLoading
                    ? "جاري الإرسال..."
                    : "المتابعة"
                  : isVerifyLoading
                    ? "جاري التحقق..."
                    : "تسجيل الدخول"}
              </Text>
            </TouchableOpacity>

            {step === "phone" && (
              <View style={styles.registerContainer}>
                <Text style={styles.noAccountText}>ليس لديك حساب؟</Text>
                <TouchableOpacity>
                  <Text style={styles.registerText}>إنشاء حساب جديد</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl * 2,
    alignItems: "flex-end",
  },
  title: {
    ...Typography.h1,
    fontSize: normalize.font(32),
    color: Colors.text.primary,
    textAlign: "right",
    marginBottom: Spacing.xs },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: "right",
    fontSize: normalize.font(16) },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    textAlign: "right",
    color: Colors.text.primary,
    fontFamily: "LamaSans-SemiBold",
    marginBottom: normalize.height(4),
  },
  input: {
    height: normalize.height(56),
    backgroundColor: Colors.surface,
    borderRadius: normalize.radius(16),
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: "right",
    fontSize: normalize.font(16),
   fontFamily: "LamaSans-Regular" },
  forgotPassword: {
    alignSelf: "flex-start",
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.primary },
  loginButton: {
    height: normalize.height(56),
    borderRadius: normalize.radius(16),
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  loginButtonText: {
    ...Typography.h2,
    color: Colors.text.onPrimary,
    fontSize: normalize.font(18) },
  registerContainer: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  noAccountText: {
    ...Typography.body,
    color: Colors.text.secondary },
  registerText: {
    ...Typography.body,
    color: Colors.primary,
    fontFamily: "LamaSans-Bold",
  },
});
