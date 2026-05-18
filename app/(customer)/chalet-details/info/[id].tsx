import {
  SolarForbiddenBold,
  SolarKeyBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import {
  useGetChaletPoliciesQuery,
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
    useGetChaletPoliciesQuery(id, { skip: type !== "policies" });

  const isLoading = isTermsLoading || isPoliciesLoading;
  const title = type === "terms" ? t("booking.terms") : t("booking.policy");
  const Icon = type === "terms" ? SolarKeyBold : SolarForbiddenBold;

  const getContent = () => {
    if (type === "terms") {
      const val = isRTL ? terms?.ar || terms : terms?.en || terms;
      return typeof val === "string" ? val : val?.ar || val?.en || "";
    } else {
      const rawRules = Array.isArray(policiesData) ? policiesData : [];

      return (
        <View>
          {rawRules.length > 0 ? (
            <View style={styles.rulesList}>
              {rawRules.map((rule: any, index: number) => {
                const rTitle = isRTL ? rule.title?.ar || rule.title : rule.title?.en || rule.title;
                const rDesc = isRTL ? rule.description?.ar || rule.description : rule.description?.en || rule.description;
                
                const titleStr = typeof rTitle === 'string' ? rTitle : rTitle?.ar || rTitle?.en || '';
                const descStr = typeof rDesc === 'string' ? rDesc : rDesc?.ar || rDesc?.en || '';
                
                if (!titleStr && !descStr) return null;
                
                return (
                  <View key={index} style={styles.ruleCard}>
                    <View style={[styles.ruleHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.ruleNumberCircle}>
                        <ThemedText style={styles.ruleNumberText}>{index + 1}</ThemedText>
                      </View>
                      <ThemedText style={[styles.ruleTitleText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {titleStr}
                      </ThemedText>
                    </View>
                    {descStr ? (
                      <ThemedText style={[styles.ruleDescText, { textAlign: isRTL ? 'right' : 'left', paddingStart: isRTL ? 0 : 34, paddingEnd: isRTL ? 34 : 0 }]}>
                        {descStr}
                      </ThemedText>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <ThemedText style={styles.content}>
              {t("common.noData")}
            </ThemedText>
          )}
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
        <View style={styles.card}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            typeof getContent() === "string" ? (
              <ThemedText style={styles.content}>
                {getContent() as string || t("common.noData")}
              </ThemedText>
            ) : (
              getContent() as React.ReactNode
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB" },
  scrollContent: {
    padding: 20 },
  header: {
    backgroundColor: "white",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 15,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15 },
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
    borderColor: "#F3F4F6" },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4B5563",
    fontFamily: "Alexandria-Medium",
    textAlign: "justify" },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 20 },
  rulesList: {
    gap: 12,
    marginTop: 8,
    marginBottom: 8 },
  ruleCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0" },
  ruleHeaderRow: {
    alignItems: "center",
    gap: 10,
    marginBottom: 6 },
  ruleNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFEBEA",
    justifyContent: "center",
    alignItems: "center" },
  ruleNumberText: {
    fontSize: 12,
    fontFamily: "Alexandria-Bold",
    color: "#EF4444" },
  ruleTitleText: {
    fontSize: 14,
    fontFamily: "Alexandria-Bold",
    color: "#1F2937",
    flex: 1 },
  ruleDescText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: "#4B5563",
    lineHeight: 18 } });
