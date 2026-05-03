import {
  SolarForbiddenBold,
  SolarKeyBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import {
  useGetChaletPoliciesQuery,
  useGetChaletTermsQuery,
} from "@/store/api/customerApiSlice";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { HeaderSection } from "@/components/header-section";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function ChaletInfoScreen() {
  const { id, type } = useLocalSearchParams<{
    id: string;
    type: "terms" | "policies";
  }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: terms, isLoading: isTermsLoading } = useGetChaletTermsQuery(
    id,
    { skip: type !== "terms" },
  );
  const { data: policiesData, isLoading: isPoliciesLoading } =
    useGetChaletPoliciesQuery(id, { skip: type !== "policies" });

  const isLoading = isTermsLoading || isPoliciesLoading;
  const title = type === "terms" ? t("booking.terms") : t("booking.policy");
  const Icon = type === "terms" ? SolarKeyBold : SolarForbiddenBold;

  const getContent = () => {
    if (type === "terms") {
      const val = isRTL ? terms?.ar || terms : terms?.en || terms;
      return typeof val === "string" ? val : val?.ar || val?.en || "";
    } else {
      const p = policiesData?.policies;
      const cp = policiesData?.cancellationPolicy;
      const policiesText = isRTL ? p?.ar || p : p?.en || p;
      const cancelText = isRTL ? cp?.ar || cp : cp?.en || cp;

      const pStr =
        typeof policiesText === "string"
          ? policiesText
          : policiesText?.ar || policiesText?.en || "";
      const cStr =
        typeof cancelText === "string"
          ? cancelText
          : cancelText?.ar || cancelText?.en || "";

      return (
        <View>
          <ThemedText style={styles.sectionTitle}>
            {isRTL ? "سياسات عامة" : "General Policies"}
          </ThemedText>
          <ThemedText style={styles.content}>
            {pStr || t("common.noData")}
          </ThemedText>

          <View style={styles.divider} />

          <ThemedText style={styles.sectionTitle}>
            {isRTL ? "سياسة الإلغاء" : "Cancellation Policy"}
          </ThemedText>
          <ThemedText style={styles.content}>
            {cStr || t("common.noData")}
          </ThemedText>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <HeaderSection 
        title={title} 
        showBackButton={true} 
        onBackPress={() => router.back()}
        showLogo={false} 
        userType={userType} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerIconContainer}>
          <View style={styles.iconCircle}>
            <Icon size={40} color="white" />
          </View>
          <ThemedText style={styles.pageTitle}>{title}</ThemedText>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <View style={styles.card}>
            {typeof getContent() === "string" ? (
              <ThemedText style={styles.content}>
                {getContent() || t("common.noData")}
              </ThemedText>
            ) : (
              getContent()
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  headerIconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: "Alexandria-Black",
    color: "#111827",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Black",
    color: Colors.primary,
    marginBottom: 12,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4B5563",
    fontFamily: "Alexandria-Medium",
    textAlign: "justify",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 20,
  },
});
