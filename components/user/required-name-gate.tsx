import React, { useEffect, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSegments } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import { SolarUserBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { RootState } from "@/store";
import { useGetPendingPoliciesQuery } from "@/store/api/apiSlice";
import { useUpdateUserProfileMutation } from "@/store/api/customerApiSlice";
import { updateUser } from "@/store/authSlice";

// Same bounds the API applies to a name sent with /auth/verify.
const NAME_MIN = 2;
const NAME_MAX = 50;

/**
 * App-wide "what's your name?" gate. `POST /auth/login` creates the account
 * for an unknown phone with no name at all, so a first sign-in used to land
 * straight in the app as a nameless account. Mounted once at the root (next to
 * the consent gate): any signed-in account without a name — new, or created
 * before this existed — is asked for one, and the prompt cannot be dismissed
 * until it is saved.
 */
export function RequiredNameGate() {
  const { isRTL, direction, textAlign, inputTextAlign } = useDirection();
  const dispatch = useDispatch();
  const segments = useSegments() as string[];

  const { isAuthenticated, userType, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const signedIn = isAuthenticated && userType !== "guest" && !!user;
  const missingName = signedIn && !String(user?.name ?? "").trim();

  // Wait for the splash and the auth screens to finish navigating, so the
  // prompt opens over the app rather than flashing over the sign-in flow.
  const settled = segments.length > 0 && segments[0] !== "(auth)";

  // The consent gate is a full-screen modal too, and iOS presents one modal at
  // a time — let it go first. Shares its cached query; no extra request.
  const { data: pending, isLoading: consentLoading } = useGetPendingPoliciesQuery(
    undefined,
    { skip: !signedIn },
  );
  const consentBlocking = consentLoading || (pending?.policies?.length ?? 0) > 0;

  const visible = missingName && settled && !consentBlocking;

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updateUserProfile, { isLoading }] = useUpdateUserProfileMutation();

  // A block, not a prompt — the Android back button can't leave it.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  const handleSave = async () => {
    const value = name.trim().replace(/\s+/g, " ");
    if (value.length < NAME_MIN) {
      setError(isRTL ? "يرجى إدخال اسمك (حرفان على الأقل)" : "Please enter your name (at least 2 letters)");
      return;
    }
    if (value.length > NAME_MAX) {
      setError(isRTL ? `الاسم طويل جداً (${NAME_MAX} حرفاً كحد أقصى)` : `Name is too long (max ${NAME_MAX})`);
      return;
    }

    setError(null);
    try {
      await updateUserProfile({ name: value }).unwrap();
      // The gate reads the persisted user, so this is what closes it.
      dispatch(updateUser({ name: value }));
    } catch (e: any) {
      const msg = e?.data?.message;
      setError(
        (Array.isArray(msg) ? msg.join("، ") : msg) ||
          (isRTL ? "تعذّر حفظ الاسم. تحقق من الاتصال وحاول مجدداً." : "Could not save your name. Check your connection and try again."),
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Swallowed on purpose: a name is required to continue.
      onRequestClose={() => {}}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.overlay, { direction }]}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <SolarUserBold size={normalize.width(28)} color={Colors.primary} />
          </View>

          <ThemedText style={styles.title}>
            {isRTL ? "مرحباً بك في سونونو" : "Welcome to Sununo"}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isRTL
              ? "اكتب اسمك لإكمال إنشاء حسابك. سيظهر لأصحاب الشاليهات عند الحجز."
              : "Enter your name to finish creating your account. Chalet owners see it on your bookings."}
          </ThemedText>

          <ThemedText style={[styles.label, { textAlign, alignSelf: "stretch" }]}>
            {isRTL ? "الاسم الكامل" : "Full name"}
          </ThemedText>
          <TextInput
            style={[styles.input, { textAlign: inputTextAlign }, error && styles.inputError]}
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (error) setError(null);
            }}
            placeholder={isRTL ? "مثلاً: علي حسن" : "e.g. Ali Hassan"}
            placeholderTextColor="#9CA3AF"
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={NAME_MAX + 10}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            editable={!isLoading}
          />
          {!!error && (
            <ThemedText style={[styles.error, { textAlign, alignSelf: "stretch" }]}>{error}</ThemedText>
          )}

          <PrimaryButton
            label={isRTL ? "حفظ ومتابعة" : "Save and continue"}
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !name.trim()}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 15, 30, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: normalize.width(24),
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: normalize.height(28),
    paddingBottom: normalize.height(22),
    paddingHorizontal: normalize.width(22),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: normalize.width(64),
    height: normalize.width(64),
    borderRadius: normalize.width(32),
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: normalize.height(14),
  },
  title: {
    fontSize: normalize.font(17),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#111827",
    textAlign: "center",
    marginBottom: normalize.height(6),
  },
  subtitle: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: normalize.font(21),
    marginBottom: normalize.height(20),
  },
  label: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#374151",
    marginBottom: normalize.height(8),
  },
  input: {
    alignSelf: "stretch",
    height: normalize.height(50),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: normalize.width(14),
    fontSize: normalize.font(15),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#111827",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  error: {
    fontSize: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#EF4444",
    marginTop: normalize.height(6),
  },
  button: {
    alignSelf: "stretch",
    marginTop: normalize.height(18),
  },
});
