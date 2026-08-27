import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { SolarCloseBold, SolarUserBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, Fonts, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { useModeSwitch } from "@/hooks/use-mode-switch";
import { RootState } from "@/store";
import { selectAccountType } from "@/store/authSlice";

/** Dismissed once, stays dismissed — the profile switcher is still there. */
const DISMISSED_KEY = "sununo:ownerBannerDismissed";

/**
 * A chalet owner running the tenant app used to have exactly one way back: a row
 * at the bottom of the customer profile menu, which nobody found — the reason
 * "التطبيق يفتح مستخدم عادي" read as a bug with no way out rather than a wrong
 * default. This puts the way back on the first screen they see.
 *
 * Only ever shown to an account the server says is a provider, and only while it
 * is actually running as a tenant.
 */
export function OwnerModeBanner() {
  const { t } = useTranslation();
  const { rowDirection, textAlign } = useDirection();
  const accountType = useSelector(selectAccountType);
  const userType = useSelector((state: RootState) => state.auth.userType);
  const { switchTo } = useModeSwitch();

  // null until storage answers, so the banner never flashes in and back out.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => {
        if (!cancelled) setDismissed(!!value);
      })
      .catch(() => {
        // Storage unreachable — showing it is the safer failure.
        if (!cancelled) setDismissed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, "1").catch(() => {});
  }, []);

  if (accountType !== "provider" || userType !== "customer") return null;
  if (dismissed !== false) return null;

  return (
    <View style={[styles.container, { flexDirection: rowDirection }]}>
      <SolarUserBold size={18} color={Colors.primary} />
      <View style={styles.body}>
        <ThemedText style={[styles.title, { textAlign }]} numberOfLines={1}>
          {t("home.ownerBanner.title")}
        </ThemedText>
        <TouchableOpacity
          onPress={() => switchTo("owner")}
          activeOpacity={0.7}
          accessibilityRole="button"
          hitSlop={6}
        >
          <ThemedText style={[styles.action, { textAlign }]} numberOfLines={1}>
            {t("home.ownerBanner.action")}
          </ThemedText>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handleDismiss}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t("home.ownerBanner.dismiss")}
        hitSlop={10}
      >
        <SolarCloseBold size={14} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: normalize.width(8),
    marginHorizontal: normalize.width(16),
    marginTop: normalize.height(12),
    paddingHorizontal: normalize.width(12),
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(12),
    backgroundColor: "#EEF3FF" },
  body: {
    flex: 1 },
  title: {
    fontSize: normalize.font(12),
    fontFamily: Fonts.medium,
    color: "#1F2937" },
  action: {
    fontSize: normalize.font(13),
    fontFamily: Fonts.semiBold,
    color: Colors.primary } });
