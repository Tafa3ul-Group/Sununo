import {
  LoginBottomBackground,
  LoginDividerShape,
} from "@/components/icons/login-design-elements";
import { LoginHeaderLogo } from "@/components/icons/login-header-logo";
import { ThemedText } from "@/components/themed-text";
import { AuthToggle } from "@/components/user/auth-toggle";
import { PrimaryButton } from "@/components/user/primary-button";
import { RootState } from "@/store";
import { setCredentials, setUserType } from "@/store/authSlice";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LoginScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const userType =
    useSelector((state: RootState) => state.auth.userType) || "customer";
  const isOwner = userType === "owner";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("7700000001");
  const [code, setCode] = useState("123456");

  const handleTypeChange = (type: "owner" | "customer") => {
    dispatch(setUserType(type));
  };

  const handleAction = () => {
    if (step === "phone") {
      setStep("otp");
    } else {
      dispatch(
        setCredentials({
          user: { name: isOwner ? "صاحب شاليه" : "زبون", phone },
          token: "mock_token",
          userType: userType,
        }),
      );
      router.replace(isOwner ? "/(tabs)/(dashboard)/home" : "/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Logo Header - Further Reduced size */}
      <View style={styles.topLogoContainer}>
        <LoginHeaderLogo size={SCREEN_WIDTH * 1.0} color="#0061FE" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 140 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* User Type Toggle using the Scalloped AuthToggle */}
          <View style={styles.toggleWrapper}>
            <AuthToggle activeType={userType} onChange={handleTypeChange} />

            {/* Divider Shape below toggle */}
            <View style={styles.dividerShapeBox}>
              <LoginDividerShape width={SCREEN_WIDTH * 0.45} />
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.headerRow}>
              <ThemedText style={styles.title}>تسجيل الدخول</ThemedText>
              <View style={styles.subtextRow}>
                <TouchableOpacity>
                  <ThemedText style={styles.linkText}>سجل الان</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.subtitle}>
                  ليس لديك حساب ؟{" "}
                </ThemedText>
              </View>
            </View>

            {step === "phone" ? (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>رقم الهاتف</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="077XXXXXXXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>رمز التحقق</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  textAlign="center"
                  letterSpacing={5}
                />
              </View>
            )}

            <PrimaryButton
              label={step === "phone" ? "المتابعة" : "تسجيل دخول"}
              onPress={handleAction}
              style={styles.loginBtn}
              activeColor="#0061FE"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomWaveContainer}>
        <LoginBottomBackground width={SCREEN_WIDTH} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  topLogoContainer: {
    position: "absolute",
    top: -60,
    left: -SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 1.2,
    alignItems: "center",
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 150,
  },
  toggleWrapper: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  dividerShapeBox: {
    marginTop: 12,
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
  },
  headerRow: {
    alignItems: "flex-end",
    marginBottom: 20, // Reduced from 30
  },
  title: {
    fontSize: 28,
    fontFamily: "LamaSans-Black",
    color: "#1E293B",
    marginBottom: 5,
  },
  subtextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "LamaSans-Regular",
  },
  linkText: {
    fontSize: 14,
    color: "#0061FE",
    fontFamily: "LamaSans-Bold",
    marginRight: 5,
  },
  inputGroup: {
    marginBottom: 15, // Reduced from 20
  },
  label: {
    fontSize: 14,
    fontFamily: "LamaSans-Bold",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    width: "100%",
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 20,
    fontSize: 18,
    fontFamily: "LamaSans-Medium",
  },
  loginBtn: {
    marginTop: 10, // Reduced
    height: 60,
  },
  bottomWaveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});
