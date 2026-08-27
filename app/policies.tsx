import { HeaderSection } from "@/components/header-section";
import {
  SolarAltArrowLeftLinear,
  SolarAltArrowRightLinear,
  SolarShieldBold,
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PolicyModal } from "@/components/user/policy-modal";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { Policy, PolicyType, useGetPoliciesQuery } from "@/store/api/apiSlice";
import { selectAccountType } from "@/store/authSlice";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

/**
 * Sununo's own legal documents, read inside the app instead of a browser.
 *
 * The list endpoint is public (policies-public.controller has no guard) so this
 * screen works for guests too — same reason the register screen can show a
 * policy before an account exists.
 */
export default function PoliciesScreen() {
  const router = useRouter();
  const { isRTL, textAlign } = useDirection();
  const insets = useSafeAreaInsets();
  const accountType = useSelector(selectAccountType);

  const { data: policies, isLoading, isError, refetch } = useGetPoliciesQuery();

  const [openType, setOpenType] = useState<PolicyType | null>(null);

  // An owner browsing in customer mode still has accountType 'provider', so the
  // provider agreement shows up on the customer tab as well — intended: it is
  // their agreement either way.
  const visibleTypes: PolicyType[] =
    accountType === "provider"
      ? ["terms_of_use", "privacy", "provider_agreement"]
      : ["terms_of_use", "privacy"];

  // `findAllPublic` filters isActive:true while `findByType` does not, so the
  // list can legitimately come back with fewer rows than `visibleTypes` — build
  // the cards from what the server actually returned, never from the wishlist.
  const documents = (policies ?? []).filter((p: Policy) =>
    visibleTypes.includes(p.type),
  );

  const Chevron = isRTL ? SolarAltArrowLeftLinear : SolarAltArrowRightLinear;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderSection
        title={isRTL ? "سياسات التطبيق" : "App Policies"}
        showBackButton
        onBackPress={() => router.back()}
      />

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}

      {!isLoading && isError && (
        <View style={styles.centered}>
          <ThemedText style={[styles.stateText, { textAlign: "center" }]}>
            {isRTL
              ? "تعذّر تحميل السياسات. تحقق من الاتصال وحاول مجدداً."
              : "Could not load the policies. Check your connection and try again."}
          </ThemedText>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <ThemedText style={styles.retryText}>
              {isRTL ? "إعادة المحاولة" : "Retry"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <View style={styles.centered}>
          <ThemedText style={[styles.stateText, { textAlign: "center" }]}>
            {isRTL
              ? "لا توجد سياسات منشورة حالياً."
              : "No policies are published right now."}
          </ThemedText>
        </View>
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {documents.map((policy) => {
            // Same en→ar fallback as the reader: English wording is optional in
            // the portal, Arabic is the one that always exists.
            const title = isRTL
              ? policy.title?.ar
              : policy.title?.en || policy.title?.ar;

            return (
              <TouchableOpacity
                key={policy.id}
                style={[styles.card, { flexDirection: "row" }]}
                onPress={() => setOpenType(policy.type)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={title}
              >
                <View style={styles.iconCircle}>
                  <SolarShieldBold size={18} color={Colors.primary} />
                </View>

                <View style={styles.cardBody}>
                  <ThemedText
                    style={[styles.cardTitle, { textAlign }]}
                    numberOfLines={2}
                  >
                    {title}
                  </ThemedText>
                  <ThemedText style={[styles.cardVersion, { textAlign }]}>
                    {isRTL
                      ? `النسخة ${policy.version}`
                      : `Version ${policy.version}`}
                  </ThemedText>
                </View>

                <Chevron size={18} color="#C7C7CC" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* The reader fetches the full text itself (GET /policies/:type). */}
      <PolicyModal
        visible={openType !== null}
        type={openType}
        mode="read"
        onClose={() => setOpenType(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: normalize.radius(14),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconCircle: {
    width: normalize.width(34),
    height: normalize.width(34),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary + "14",
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: Colors.text.primary,
  },
  cardVersion: {
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-Regular",
    color: "#94A3B8",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  stateText: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: "#64748B",
    lineHeight: normalize.font(22),
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#EBF3FF",
  },
  retryText: {
    fontSize: normalize.font(13),
    fontFamily: "IBMPlexSansArabic-Medium",
    color: Colors.primary,
  },
});
