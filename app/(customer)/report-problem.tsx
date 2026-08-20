import { HeaderSection } from "@/components/header-section";
import { SolarDangerCircleBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { Colors, Shadows } from "@/constants/theme";

import { useCreateComplaintMutation } from "@/store/api/customerApiSlice";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDirection } from "@/i18n";

export default function ReportProblemScreen() {
  const { t } = useTranslation();
  const { inputTextAlign } = useDirection();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createComplaint, { isLoading }] = useCreateComplaintMutation();

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert(t("common.error"), t("reportProblem.descriptionRequired"));
      return;
    }

    try {
      await createComplaint({
        title: title.trim() || undefined,
        description: description.trim(),
      }).unwrap();

      // Land on the report log rather than back on the profile: the follow-up
      // note support writes shows up there, so the user learns where to look.
      Alert.alert(
        t("reportProblem.successTitle"),
        t("reportProblem.successMessage"),
        // `as any`: typed routes come from .expo/types/router.d.ts, which only
        // `expo start` regenerates — same cast the other new routes use.
        [{ text: "OK", onPress: () => router.replace("/my-reports" as any) }],
      );
    } catch (err: any) {
      // Surface the server's reason when it sends one (validation message).
      const serverMessage = err?.data?.message;
      Alert.alert(
        t("common.error"),
        (typeof serverMessage === "string"
          ? serverMessage
          : Array.isArray(serverMessage)
            ? serverMessage[0]
            : undefined) || t("reportProblem.errorMessage"),
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <HeaderSection
        title={t("reportProblem.title")}
        showBackButton={true}
        showLogo={false}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerArea}>
          <View style={styles.iconWrap}>
            <SolarDangerCircleBold size={36} color={Colors.primary} />
          </View>
          <ThemedText style={styles.subtitle}>
            {t("reportProblem.intro")}
          </ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>
              {t("reportProblem.subjectLabel")}
            </ThemedText>
            <TextInput
              style={[styles.textInput, { textAlign: inputTextAlign }]}
              placeholder={t("reportProblem.subjectPlaceholder")}
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={150}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>
              {t("reportProblem.descriptionLabel")}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { textAlign: inputTextAlign },
              ]}
              placeholder={t("reportProblem.descriptionPlaceholder")}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
              maxLength={4000}
            />
          </View>

          <PrimaryButton
            label={t("reportProblem.submit")}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitBtn}
            height={56}
          />

          <TouchableOpacity
            style={styles.logLink}
            onPress={() => router.push("/my-reports" as any)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={styles.logLinkText}>
              {t("reportProblem.myReportsLink")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  headerArea: {
    marginBottom: 24,
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#374151",
    marginBottom: 10,
    marginHorizontal: 4,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 18,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: 4,
  },
  logLink: {
    marginTop: 16,
    alignSelf: "center",
  },
  logLinkText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
  },
});
