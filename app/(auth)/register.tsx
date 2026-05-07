import { LoginHeaderLogo } from "@/components/icons/login-header-logo";
import { ThemedText } from "@/components/themed-text";
import { CircleBackButton } from "@/components/ui/circle-back-button";
import { AuthToggle } from "@/components/user/auth-toggle";
import { OtpInput } from "@/components/user/otp-input";
import { PrimaryButton } from "@/components/user/primary-button";
import { normalize } from "@/constants/theme";
import {
  useLoginMutation,
  useRegisterProviderMutation,
  useVerifyPhoneMutation,
} from "@/store/api/apiSlice";
import { setCredentials } from "@/store/authSlice";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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

type Step = "TYPE" | "INFO" | "BUSINESS" | "OTP";

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const params = useLocalSearchParams<{ type?: string }>();
  const [step, setStep] = useState<Step>("TYPE");
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
    commercialRegNo: "",
  });

  const [otpCode, setOtpCode] = useState("");

  const nextStep = () => {
    if (step === "TYPE") setStep("INFO");
    else if (step === "INFO") {
      if (!formData.name || !formData.phone) {
        Alert.alert(
          t("common.error"),
          isRTL ? "يرجى ملء الاسم ورقم الهاتف" : "Please enter name and phone",
        );
        return;
      }
      if (accountType === "owner") setStep("BUSINESS");
      else handleCustomerRegister();
    } else if (step === "BUSINESS") {
      if (!formData.businessNameAr) {
        Alert.alert(
          t("common.error"),
          isRTL ? "يرجى ملء اسم الشاليه" : "Please enter chalet name",
        );
        return;
      }
      handleOwnerRegister();
    }
  };

  const prevStep = () => {
    if (step === "INFO") setStep("TYPE");
    else if (step === "BUSINESS") setStep("INFO");
    else if (step === "OTP") {
      if (accountType === "owner") setStep("BUSINESS");
      else setStep("INFO");
    }
  };

  const handleCustomerRegister = async () => {
    try {
      // For customers, we just trigger login to get OTP
      await login({ phone: formData.phone }).unwrap();
      setStep("OTP");
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err?.data?.message || "Failed to send code",
      );
    }
  };

  const handleOwnerRegister = async () => {
    try {
      await registerProvider({
        phone: formData.phone,
        name: formData.name,
        businessName: {
          ar: formData.businessNameAr,
          en: formData.businessNameEn || formData.businessNameAr,
        },
        commercialRegNo: formData.commercialRegNo,
      }).unwrap();
      setStep("OTP");
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err?.data?.message || "Failed to register",
      );
    }
  };

  const handleVerify = async () => {
    try {
      const result = await verifyPhone({
        phone: formData.phone,
        code: otpCode,
        name: formData.name, // Pass name to update it in DB
      }).unwrap();

      dispatch(
        setCredentials({
          user: result.user,
          token: result.token,
          userType: accountType,
        }),
      );

      router.replace(
        accountType === "owner"
          ? "/(tabs)/(dashboard)/home"
          : "/(tabs)/(customer)",
      );
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.data?.message || "Invalid code");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <CircleBackButton
          onPress={() => (step === "TYPE" ? router.back() : prevStep())}
        />
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

          {step === "TYPE" && (
            <View style={styles.stepContainer}>
              <View style={{ alignItems: "center", marginBottom: 40 }}>
                <AuthToggle
                  activeType={accountType}
                  onChange={(type) => setAccountType(type)}
                />
              </View>

              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL ? "المعلومات الأساسية" : "Basic Information"}
              </ThemedText>
              <ThemedText
                style={[
                  styles.stepSubtitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL
                  ? "يرجى إكمال بياناتك للمتابعة"
                  : "Please complete your details to continue"}
              </ThemedText>

              <PrimaryButton
                label={isRTL ? "التالي" : "Next"}
                onPress={() => setStep("INFO")}
                style={styles.mainBtn}
              />
            </View>
          )}

          {step === "INFO" && (
            <View style={styles.stepContainer}>
              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL ? "المعلومات الأساسية" : "Basic Information"}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("auth.fullName")} *
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={
                    isRTL ? "ادخل اسمك الكامل" : "Enter your full name"
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
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("auth.phone")} *
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: isRTL ? "right" : "left" },
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
                    ? isRTL
                      ? "التالي"
                      : "Next"
                    : isRTL
                      ? "إرسال الرمز"
                      : "Send Code"
                }
                onPress={nextStep}
                style={styles.mainBtn}
              />
            </View>
          )}

          {step === "BUSINESS" && (
            <View style={styles.stepContainer}>
              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL ? "معلومات الشاليه" : "Chalet Information"}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {isRTL
                    ? "اسم الشاليه (بالعربية) *"
                    : "Chalet Name (Arabic) *"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={
                    isRTL ? "مثلاً: شاليه النخيل" : "e.g. Al Nakheel Chalet"
                  }
                  value={formData.businessNameAr}
                  onChangeText={(val) =>
                    setFormData({ ...formData, businessNameAr: val })
                  }
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {isRTL
                    ? "اسم الشاليه (بالانجليزية)"
                    : "Chalet Name (English)"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder={
                    isRTL
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

              <View style={styles.inputGroup}>
                <ThemedText
                  style={[
                    styles.label,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {isRTL
                    ? "رقم السجل التجاري (إن وجد)"
                    : "Commercial Registration (Optional)"}
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: isRTL ? "right" : "left" },
                  ]}
                  placeholder="CR-XXXXXX"
                  value={formData.commercialRegNo}
                  onChangeText={(val) =>
                    setFormData({ ...formData, commercialRegNo: val })
                  }
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <PrimaryButton
                label={isRTL ? "إرسال الطلب" : "Submit & Send Code"}
                onPress={nextStep}
                style={styles.mainBtn}
                loading={isRegisteringProvider}
              />
            </View>
          )}

          {step === "OTP" && (
            <View style={styles.stepContainer}>
              <ThemedText
                style={[
                  styles.stepTitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL ? "التحقق من الهاتف" : "Verify Phone"}
              </ThemedText>
              <ThemedText
                style={[
                  styles.stepSubtitle,
                  { textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {isRTL
                  ? `أدخل الرمز المرسل إلى ${formData.phone}`
                  : `Enter code sent to ${formData.phone}`}
              </ThemedText>

              <View style={{ marginVertical: 30 }}>
                <OtpInput code={otpCode} setCode={setOtpCode} length={6} />
              </View>

              <PrimaryButton
                label={isRTL ? "تحقق وتفعيل" : "Verify & Activate"}
                onPress={handleVerify}
                style={styles.mainBtn}
                loading={isVerifying}
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
    backgroundColor: "white",
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    minHeight: 60,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Bold",
    color: "#1E293B",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  stepContainer: {
    width: "100%",
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Alexandria-Black",
    color: "#1E293B",
    marginBottom: 8,
    lineHeight: 30,
    paddingTop: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    marginBottom: 30,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeCardActive: {
    borderColor: "#0061FE",
    backgroundColor: "#EBF3FF",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Alexandria-Bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Alexandria-Regular",
    color: "#64748B",
  },
  inputGroup: {
    marginBottom: normalize.height(20),
  },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Bold",
    color: "#1E293B",
    marginBottom: normalize.height(8),
    lineHeight: normalize.font(20),
    paddingTop: 4,
  },
  input: {
    width: "100%",
    minHeight: normalize.height(52),
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: normalize.height(10),
    fontSize: 15,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  mainBtn: {
    marginTop: normalize.height(20),
    width: "100%",
    minHeight: normalize.height(54),
    paddingVertical: normalize.height(12),
  },
});
