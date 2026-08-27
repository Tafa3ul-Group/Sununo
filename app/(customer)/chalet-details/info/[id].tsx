import {
  SolarClipboardListLineDuotone
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Colors, normalize } from "@/constants/theme";
import {
  useGetChaletRulesQuery,
  useGetChaletTermsQuery,
  useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { HeaderSection } from "@/components/header-section";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { pickTranslation, useDirection } from "@/i18n";


export default function ChaletInfoScreen() {
  const { id, type } = useLocalSearchParams<{
    id: string;
    type: "terms" | "policies";
  }>();
  const { t } = useTranslation();
  const { isRTL, rowDirection } = useDirection();
  const isArabic = isRTL;

  const router = useRouter();
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: terms, isLoading: isTermsLoading } = useGetChaletTermsQuery(
    id,
    { skip: type !== "terms" },
  );
  const { data: policiesData, isLoading: isPoliciesLoading } =
    useGetChaletRulesQuery(id, { skip: !id });

  // The guest policy is a rule the owner cannot phrase or delete, but the
  // customer reads it in the same place as the house rules. Comes from the
  // detail endpoint, which the screen the customer arrived from already
  // cached — this is a tag read, not a second round trip in practice.
  const { data: chaletData } = useGetCustomerChaletDetailsQuery(id, { skip: !id });
  const chaletDetails = chaletData?.data || chaletData;
  // An older payload without the column means "accepts everyone", so nothing
  // is shown rather than a restriction the owner never set.
  const guestPolicy = chaletDetails?.guestPolicy ?? 'both';
  const guestPolicyRule =
    guestPolicy === 'family' || guestPolicy === 'youth'
      ? {
          title: isArabic ? 'نوع الضيوف المسموح' : 'Allowed guests',
          description:
            guestPolicy === 'family'
              ? (isArabic
                  ? 'هذا الشاليه يستقبل العوائل فقط، ولا تُقبل حجوزات الشباب.'
                  : 'This chalet accepts families only; bookings from young men are not accepted.')
              : (isArabic
                  ? 'هذا الشاليه يستقبل الشباب فقط، ولا تُقبل حجوزات العوائل.'
                  : 'This chalet accepts young men only; bookings from families are not accepted.'),
        }
      : null;

  // `hasOwnerRules` keeps the trailing divider from dangling when the owner
  // wrote no rules of their own and this is the only line on the page.
  const renderGuestPolicyRule = (hasOwnerRules: boolean) =>
    guestPolicyRule ? (
      <View style={styles.ruleItem}>
        <View style={[styles.ruleHeader, { flexDirection: rowDirection }]}>
          <View style={styles.ruleBullet} />
          <ThemedText style={styles.ruleTitleText}>{guestPolicyRule.title}</ThemedText>
        </View>
        <ThemedText style={styles.ruleDescText}>{guestPolicyRule.description}</ThemedText>
        {hasOwnerRules && <View style={styles.ruleDivider} />}
      </View>
    ) : null;

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

      // Nothing at all → show the no-data message. The guest policy counts as
      // content: it is the one rule that can exist without the owner writing any.
      if (!tStr && !pStr && !cStr && rulesList.length === 0 && !guestPolicyRule) {
        return t("common.noData");
      }

      return (
        <View>
          {tStr ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                {isArabic ? "الشروط والأحكام" : "Terms & Conditions"}
              </ThemedText>
              <ThemedText style={styles.content}>
                {tStr}
              </ThemedText>
              {(pStr || cStr || rulesList.length > 0 || guestPolicyRule) && <View style={styles.divider} />}
            </View>
          ) : null}

          {(rulesList.length > 0 || guestPolicyRule) ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                {isArabic ? "قوانين الشاليه" : "Chalet Rules"}
              </ThemedText>
              {renderGuestPolicyRule(rulesList.length > 0)}
              {rulesList.map((rule: any, idx: number) => {
                const ruleTitle = pickTranslation(rule.title, isArabic);
                const ruleDesc = pickTranslation(rule.description, isArabic);
                return (
                  <View key={rule.id || idx} style={styles.ruleItem}>
                    <View style={[styles.ruleHeader, { flexDirection: rowDirection }]}>
                      <View style={styles.ruleBullet} />
                      <ThemedText style={styles.ruleTitleText}>
                        {ruleTitle}
                      </ThemedText>
                    </View>
                    {ruleDesc ? (
                      <ThemedText style={styles.ruleDescText}>{ruleDesc}</ThemedText>
                    ) : null}
                  </View>
                );
              })}
              {(pStr || cStr) && <View style={styles.divider} />}
            </View>
          ) : null}

          {pStr ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                {isArabic ? "السياسات العامة" : "General Policies"}
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
                {isArabic ? "سياسة الإلغاء" : "Cancellation Policy"}
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
        if (policiesData.length === 0 && !guestPolicyRule) {
          return (
            <ThemedText style={styles.content}>
              {t("common.noData")}
            </ThemedText>
          );
        }
        return (
          <View>
            {renderGuestPolicyRule(policiesData.length > 0)}
            {policiesData.map((rule: any, idx: number) => {
              const ruleTitle = pickTranslation(rule.title, isArabic);
              const ruleDesc = pickTranslation(rule.description, isArabic);
              
              return (
                <View key={rule.id || idx} style={styles.ruleItem}>
                  <View style={[styles.ruleHeader, { flexDirection: rowDirection }]}>
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
      // pickTranslation already unwraps {ar,en} and guarantees a string, so the
      // old typeof/`?.ar || ?.en` re-check below it is gone.
      const pStr = pickTranslation(p, isArabic);
      const cStr = pickTranslation(cp, isArabic);

      return (
        <View>
          <ThemedText style={styles.sectionTitle}>
            {isArabic ? "سياسات عامة" : "General Policies"}
          </ThemedText>
          <ThemedText style={styles.content}>
            {pStr || t("common.noData")}
          </ThemedText>

          <View style={styles.divider} />

          <ThemedText style={styles.sectionTitle}>
            {isArabic ? "سياسة الإلغاء" : "Cancellation Policy"}
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#111827" },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6" },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: Colors.primary,
    marginBottom: 12 },
  content: {
    fontSize: 14,
    lineHeight: 24,
    color: "#4B5563",
    fontFamily: "IBMPlexSansArabic-Regular" },
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
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#111827",
    flex: 1,
  },
  ruleDescText: {
    fontSize: 13,
    lineHeight: 22,
    color: "#4B5563",
    fontFamily: "IBMPlexSansArabic-Medium",
    paddingHorizontal: 24,
  },
  ruleDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginTop: 16,
  }
});
