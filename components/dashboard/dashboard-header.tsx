import { SolarMagnifierBold, SolarUserBold } from "@/components/icons/solar-icons";
import { Colors, normalize } from "@/constants/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../themed-text";
import { CircleBackButton } from "../ui/circle-back-button";

interface DashboardHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  marginBottom?: number;
}

export function DashboardHeader({
  title,
  showBackButton,
  showSearch = true,
  onProfilePress,
  onSearchPress,
  marginBottom = 0,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === "ar";

  return (
    <View style={[styles.container, { marginBottom, paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.topRow}>
        {/* Left Side: Profile Icon OR Back Button */}
        <View style={styles.leftGroup}>
          {showBackButton ? (
            <CircleBackButton onPress={() => router.back()} />
          ) : !title ? (
            <View style={styles.homeLeftGroup}>
              <TouchableOpacity
                onPress={onProfilePress || (() => router.push("/(dashboard)/profile"))}
                style={styles.profileCircle}
              >
                <SolarUserBold
                  size={normalize.width(22)}
                  color="#111827"
                />
              </TouchableOpacity>

              {showSearch && (
                <TouchableOpacity
                  onPress={onSearchPress}
                  style={styles.searchCircle}
                >
                  <SolarMagnifierBold
                    size={normalize.width(22)}
                    color="#111827"
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

        {/* Center: Title (if exists) */}
        {title && (
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
        )}

        {/* Right Side: Logo */}
        <View style={styles.rightGroup}>
          <View style={styles.logoContainer}>
            <Image
              source={
                isRTL
                  ? require("@/assets/arlogo.svg")
                  : require("@/assets/logo.svg")
              }
              style={styles.logoImg}
              contentFit="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize.width(10), // Reduced to almost edge
    height: normalize.height(65), // Tighter height
  },
  leftGroup: {
    width: normalize.width(80),
    alignItems: "flex-start",
    justifyContent: "center",
  },
  homeLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6, // Tighter gap
  },
  titleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: normalize.font(17),
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
  },
  rightGroup: {
    width: normalize.width(80),
    alignItems: "flex-end",
    justifyContent: "center",
  },
  profileCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  searchCircle: {
    width: normalize.width(38),
    height: normalize.width(38),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoContainer: {
    width: normalize.width(75),
    height: normalize.width(30),
    justifyContent: "center",
    alignItems: "flex-end",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
});
