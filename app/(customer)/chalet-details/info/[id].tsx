import {
  SolarClipboardListLineDuotone
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Colors, normalize } from "@/constants/theme";
import {
  useGetChaletRulesQuery,
  useGetChaletTermsQuery } from "@/store/api/customerApiSlice";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, I18nManager, ScrollView, StyleSheet, View } from "react-native";
import { HeaderSection } from "@/components/header-section";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useDirection } from "@/i18n";


export default function ChaletInfoScreen() {
  const { id, type } = useLocalSearchParams<{
    id: string;
    type: "terms" | "policies";
  }>();
  const { t } = useTranslation();
  const { isRTL, rowDirection } = useDirection();
  const isArabic = isRTL;

  // Manager-aware RTL: under forced RTL the OS swaps left/right, so the visual
  // "start" needs "left" when content-RTL matches the layout manager. Always set
  // writingDirection so Arabic paragraphs flow correctly.
  const writingDir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";
  const startAlign: "left" | "right" = isRTL === I18nManager.isRTL ? "left" : "right";
  const rtlTitle: { textAlign: "left" | "right"; writingDirection: "rtl" | "ltr" } = {
    textAlign: startAlign,
    writingDirection: writingDir,
  };
  const rtlBody: { textAlign: "justify"; writingDirection: "rtl" | "ltr" } = {
    textAlign: "justify",
    writingDirection: writingDir,
  };
    const router = useRouter();
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: terms, isLoading: isTermsLoading } = useGetChaletTermsQuery(
    id,
    { skip: type !== "terms" },
  );
  const { data: policiesData, isLoading: isPoliciesLoading } =
    useGetChaletRulesQuery(id, { skip: !id });

  const isLoading = isTermsLoading || isPoliciesLoading;
  const title = type === "terms" 
    ? (isArabic ? "شروط وقوانين الشاليه" : "Chalet Terms & Conditions") 
    : (isArabic ? "شروط وقوانين الشاليه" : "Chalet Rules");

  const getContent = () => {
    if (type === "terms") {
      // `terms` may arrive as an object {ar,en}, a JSON string, or a plain string.
      // Parse defensively so the terms always render correctly.
      let parsed: any = terms;
      if (typeof parsed === "string") {
        try {
          const p = JSON.parse(parsed);
          if (p && typeof p === "object") parsed = p;
        } catch {
          /* keep as plain string */
        }
      }

      const tStr =
        typeof parsed === "string"
          ? parsed
          : (isArabic
              ? parsed?.ar || parsed?.en
              : parsed?.en || parsed?.ar) || "";

      const policiesText = isArabic ? parsed?.policiesAr : parsed?.policiesEn || parsed?.policiesAr;
      const pStr = typeof policiesText === "string" ? policiesText : "";

      const cancellationText = isArabic ? parsed?.cancellationAr : parsed?.cancellationEn || parsed?.cancellationAr;
      const cStr = typeof cancellationText === "string" ? cancellationText : "";

      // The owner's structured rules list also belongs on the terms page —
      // it's often where the real "شروط/قوانين الشاليه" content lives.
      const rulesList = Array.isArray(policiesData) ? policiesData : [];

      // Nothing at all → show the no-data message.
      if (!tStr && !pStr && !cStr && rulesList.length === 0) {
        return t("common.noData");
      }

      return (
        <View>
          {tStr ? (
            <View>
              <ThemedText style={[styles.sectionTitle, rtlTitle]}>
                {isArabic ? "الشروط والأحكام" : "Terms & Conditions"}
              </ThemedText>
              <ThemedText style={[styles.content, rtlBody]}>
                {tStr}
              </ThemedText>
              {(pStr || cStr || rulesList.length > 0) && <View style={styles.divider} />}
            </View>
          ) : null}

          {rulesList.length > 0 ? (
            <View>
              <ThemedText style={[styles.sectionTitle, rtlTitle]}>
                {isArabic ? "قوانين الشاليه" : "Chalet Rules"}
              </ThemedText>
              {rulesList.map((rule: any, idx: number) => {
                const ruleTitle = isArabic ? rule.title?.ar || rule.title : rule.title?.en || rule.title;
                const ruleDesc = isArabic ? rule.description?.ar || rule.description : rule.description?.en || rule.description;
                return (
                  <View key={rule.id || idx} style={styles.ruleItem}>
                    <View style={[styles.ruleHeader, { flexDirection: rowDirection }]}>
                      <View style={styles.ruleBullet} />
                      <ThemedText style={[styles.ruleTitleText, rtlTitle]}>
                        {ruleTitle}
                      </ThemedText>
                    </View>
                    {ruleDesc ? (
                      <ThemedText style={[styles.ruleDescText, rtlBody]}>{ruleDesc}</ThemedText>
                    ) : null}
                  </View>
                );
              })}
              {(pStr || cStr) && <View style={styles.divider} />}
            </View>
          ) : null}

          {pStr ? (
            <View>
              <ThemedText style={[styles.sectionTitle, rtlTitle]}>
                {isArabic ? "السياسات العامة" : "General Policies"}
              </ThemedText>
              <ThemedText style={[styles.content, rtlBody]}>
                {pStr}
              </ThemedText>
              {cStr && <View style={styles.divider} />}
            </View>
          ) : null}

          {cStr ? (
            <View>
              <ThemedText style={[styles.sectionTitle, rtlTitle]}>
                {isArabic ? "سياسة الإلغاء" : "Cancellation Policy"}
              </ThemedText>
              <ThemedText style={[styles.content, rtlBody]}>
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
            <ThemedText style={[styles.content, rtlBody]}>
              {t("common.noData")}
            </ThemedText>
          );
        }
        return (
          <View>
            {policiesData.map((rule: any, idx: number) => {
              const ruleTitle = isArabic ? rule.title?.ar || rule.title : rule.title?.en || rule.title;
              const ruleDesc = isArabic ? rule.description?.ar || rule.description : rule.description?.en || rule.description;
              
              return (
                <View key={rule.id || idx} style={styles.ruleItem}>
                  <View style={[styles.ruleHeader, { flexDirection: rowDirection }]}>
                    <View style={styles.ruleBullet} />
                    <ThemedText style={[styles.ruleTitleText, rtlTitle]}>
                      {ruleTitle}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.ruleDescText, rtlBody]}>
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
      const policiesText = isArabic ? p?.ar || p : p?.en || p;
      const cancelText = isArabic ? cp?.ar || cp : cp?.en || cp;

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
          <ThemedText style={[styles.sectionTitle, rtlTitle]}>
            {isArabic ? "سياسات عامة" : "General Policies"}
          </ThemedText>
          <ThemedText style={[styles.content, rtlBody]}>
            {pStr || t("common.noData")}
          </ThemedText>

          <View style={styles.divider} />

          <ThemedText style={[styles.sectionTitle, rtlTitle]}>
            {isArabic ? "سياسة الإلغاء" : "Cancellation Policy"}
          </ThemedText>
          <ThemedText style={[styles.content, rtlBody]}>
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

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 50 }}
        />
      ) : typeof getContent() === "string" ? (
        // No data → shared EmptyState, consistent with bookings/wallet pages.
        <EmptyState
          icon={<SolarClipboardListLineDuotone size={normalize.width(56)} color={Colors.primary} />}
          title={
            type === "terms"
              ? (isArabic ? "لا توجد شروط لهذا الشاليه" : "No terms for this chalet")
              : (isArabic ? "لا توجد سياسات" : "No policies available")
          }
          description={
            isArabic
              ? "لم يقم المالك بإضافة هذه المعلومات بعد."
              : "The owner hasn't added this information yet."
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>{getContent()}</View>
        </ScrollView>
      )}
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
