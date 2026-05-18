import {
  SolarForbiddenBold,
  SolarKeyBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import {
  useGetChaletRulesQuery,
  useGetChaletTermsQuery } from "@/store/api/customerApiSlice";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { HeaderSection } from "@/components/header-section";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { isRTL } from "@/i18n";

export default function ChaletInfoScreen() {
  const { id, type } = useLocalSearchParams<{
    id: string;
    type: "terms" | "policies";
  }>();
  const { t, i18n } = useTranslation();
    const router = useRouter();
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: terms, isLoading: isTermsLoading } = useGetChaletTermsQuery(
    id,
    { skip: type !== "terms" },
  );
  const { data: policiesData, isLoading: isPoliciesLoading } =
    useGetChaletRulesQuery(id, { skip: type !== "policies" });

  const isLoading = isTermsLoading || isPoliciesLoading;
  const title = type === "terms" 
    ? (isRTL ? "شروط وقوانين الشاليه" : "Chalet Terms & Conditions") 
    : (isRTL ? "شروط وقوانين الشاليه" : "Chalet Rules");
  const Icon = type === "terms" ? SolarKeyBold : SolarForbiddenBold;

  const getContent = () => {
    if (type === "terms") {
      const termsText = isRTL ? terms?.ar || terms : terms?.en || terms;
      const tStr = typeof termsText === "string" ? termsText : termsText?.ar || termsText?.en || "";
      
      const policiesText = isRTL ? terms?.policiesAr : terms?.policiesEn || terms?.policiesAr;
      const pStr = typeof policiesText === "string" ? policiesText : "";
      
      const cancellationText = isRTL ? terms?.cancellationAr : terms?.cancellationEn || terms?.cancellationAr;
      const cStr = typeof cancellationText === "string" ? cancellationText : "";

      if (!pStr && !cStr) {
        return tStr || t("common.noData");
      }

      return (
        <View>
          {tStr ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                {isRTL ? "الشروط والأحكام" : "Terms & Conditions"}
              </ThemedText>
              <ThemedText style={styles.content}>
                {tStr}
              </ThemedText>
              {(pStr || cStr) && <View style={styles.divider} />}
            </View>
          ) : null}

          {pStr ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                {isRTL ? "السياسات العامة" : "General Policies"}
              </ThemedText>
              <ThemedText style={styles.content}>
                {pStr}
              </ThemedText>
              {cStr && <View style={styles.divider} />}
            </View>
          ) : null}

          {cStr ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                {isRTL ? "سياسة الإلغاء" : "Cancellation Policy"}
              </ThemedText>
              <ThemedText style={styles.content}>
                {cStr}
              </ThemedText>
            </View>
          ) : null}
        </View>
      );
    } else {
      if (Array.isArray(policiesData)) {
        if (policiesData.length === 0) {
          return (
            <ThemedText style={styles.content}>
              {t("common.noData")}
            </ThemedText>
          );
        }
        return (
          <View>
            {policiesData.map((rule: any, idx: number) => {
              const ruleTitle = isRTL
                ? rule.title?.ar || rule.title || ""
                : rule.title?.en || rule.title || "";
              const ruleDesc = isRTL
                ? rule.description?.ar || rule.description || ""
                : rule.description?.en || rule.description || "";

              return (
                <View key={idx} style={styles.ruleItem}>
                  <View style={[styles.ruleHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.ruleBullet} />
                    <ThemedText style={styles.ruleTitleText}>
                      {ruleTitle}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.ruleDescText}>
                    {ruleDesc}
                  </ThemedText>
                  {idx < policiesData.length - 1 && <View style={styles.ruleDivider} />}
                </View>
              );
            })}
          </View>
        );
      }

      // Fallback if policiesData is not an array (e.g. old structure)
      const p = (policiesData as any)?.policies;
      const cp = (policiesData as any)?.cancellationPolicy;
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
    backgroundColor: "white" },
  scrollContent: {
    padding: 20,
    paddingTop: 40 },
  headerIconContainer: {
    alignItems: "center",
    marginBottom: 30 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15 },
  pageTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827" },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6" },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
    marginBottom: 12 },
  content: {
    fontSize: 14,
    lineHeight: 24,
    color: "#4B5563",
    fontFamily: "Alexandria-Medium",
    textAlign: "justify" },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 20 },
  ruleItem: {
    marginBottom: 16,
  },
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ruleBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 8,
  },
  ruleTitleText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    flex: 1,
    textAlign: "left",
  },
  ruleDescText: {
    fontSize: 13,
    lineHeight: 22,
    color: "#4B5563",
    fontFamily: "Alexandria-Medium",
    paddingHorizontal: 24,
    textAlign: "justify",
  },
  ruleDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginTop: 16,
  }
});
