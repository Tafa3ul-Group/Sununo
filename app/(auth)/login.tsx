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
import { useLoginMutation, useVerifyPhoneMutation } from "@/store/api/apiSlice";
import { ActivityIndicator, Alert } from "react-native";
// import { normalize } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 375;
const normalize = {
  width: (size: number) => size * scale,
  height: (size: number) => size * scale, // Using uniform scaling for simplicity
  font: (size: number) => size * scale,
  radius: (size: number) => size * scale,
};

export function LoginScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const dispatch = useDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyPhone, { isLoading: isVerifyLoading }] = useVerifyPhoneMutation();

  const userType = useSelector((state: RootState) => state.auth.userType) || "customer";
  const isOwner = userType === "owner";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("7700000001");
  const [code, setCode] = useState("123456");

  function handleTypeChange(type: "owner" | "customer") {
    dispatch(setUserType(type));
  }

  async function handleAction() {
    if (step === "phone") {
      try {
        const res = await login({ phone }).unwrap();
        if (res?.code) {
          setCode(String(res.code));
        }
        setStep("otp");
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || "Failed to send OTP");
        Alert.alert(t('common.error'), String(displayMsg));
      }
    } else {
      try {
        const result = await verifyPhone({ phone, code }).unwrap();
        dispatch(
          setCredentials({
            user: result.user,
            token: result.token,
            userType: userType,
          }),
        );
        router.replace(isOwner ? "/(tabs)/(dashboard)/home" : "/(tabs)");
      } catch (err: any) {
        const msg = err?.data?.message;
        const displayMsg = Array.isArray(msg) ? msg.join(', ') : (msg || "Invalid OTP");
        Alert.alert(t('common.error'), String(displayMsg));
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Background Logo Header */}
      <View style={styles.topLogoContainer}>
        <LoginHeaderLogo size={normalize.width(SCREEN_WIDTH)} color="#0061FE" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: normalize.height(140) }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* User Type Toggle */}
          <View style={styles.toggleWrapper}>
            <AuthToggle activeType={userType} onChange={handleTypeChange} />

            {/* Divider Shape below toggle */}
            <View style={styles.dividerShapeBox}>
              <LoginDividerShape width={normalize.width(SCREEN_WIDTH * 0.45)} />
            </View>
          </View>

          {/* Login Form */}
          <View style={[styles.formContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.headerRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <ThemedText style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.login')}</ThemedText>
              <View style={[styles.subtextRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity>
                  <ThemedText style={styles.linkText}>{t('auth.registerNow')}</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.subtitle}>
                  {t('auth.dontHaveAccount')}
                </ThemedText>
              </View>
            </View>

            {step === "phone" ? (
              <View style={[styles.inputGroup, { width: '100%' }]}>
                <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.phone')}</ThemedText>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t('auth.phonePlaceholder')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <View style={[styles.inputGroup, { width: '100%' }]}>
                <ThemedText style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.verificationCode')}</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  textAlign="center"
                  letterSpacing={normalize.width(5)}
                />
              </View>
            )}

            <PrimaryButton
              label={step === "phone" ? t('auth.continue') : t('auth.verify')}
              onPress={handleAction}
              style={styles.loginBtn}
              activeColor="#0061FE"
              icon={(isLoginLoading || isVerifyLoading) ? <ActivityIndicator color="white" /> : undefined}
            />

            {/* Browse as Guest Option */}
            <TouchableOpacity 
              style={styles.guestLink}
              onPress={() => {
                dispatch(setUserType('guest'));
                router.replace("/(tabs)");
              }}
            >
              <ThemedText style={styles.guestLinkText}>
                {t('auth.browseAsGuest')}
              </ThemedText>
            </TouchableOpacity>
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
    top: normalize.height(-60),
    left: normalize.width(-SCREEN_WIDTH * 0.1),
    width: normalize.width(SCREEN_WIDTH * 1.2),
    alignItems: "center",
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: normalize.width(30),
    paddingBottom: normalize.height(150),
  },
  toggleWrapper: {
    alignItems: "center",
    marginBottom: normalize.height(20),
    marginTop: normalize.height(10),
  },
  dividerShapeBox: {
    marginTop: normalize.height(12),
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
  },
  headerRow: {
    alignItems: "flex-end",
    marginBottom: normalize.height(20),
  },
  title: {
    fontSize: normalize.font(28),
    fontFamily: "LamaSans-Black",
    color: "#1E293B",
    marginBottom: normalize.height(5),
  },
  subtextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: normalize.font(14),
    color: "#64748B",
    fontFamily: "LamaSans-Regular",
  },
  linkText: {
    fontSize: normalize.font(14),
    color: "#0061FE",
    fontFamily: "LamaSans-Bold",
    marginRight: normalize.width(5),
  },
  inputGroup: {
    marginBottom: normalize.height(15),
  },
  label: {
    fontSize: normalize.font(14),
    fontFamily: "LamaSans-Bold",
    color: "#1E293B",
    marginBottom: normalize.height(8),
  },
  input: {
    width: "100%",
    height: normalize.height(56),
    backgroundColor: "#FFFFFF",
    borderRadius: normalize.radius(16),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: normalize.width(20),
    fontSize: normalize.font(18),
    fontFamily: "LamaSans-Medium",
  },
  loginBtn: {
    marginTop: normalize.height(10),
    height: normalize.height(60),
  },
  guestLink: {
    marginTop: normalize.height(20),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  guestLinkText: {
    fontSize: normalize.font(14),
    color: "#64748B",
    fontFamily: "LamaSans-Bold",
    textDecorationLine: "underline",
  },
  bottomWaveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});
// Default export for Expo Router
export default LoginScreen;
