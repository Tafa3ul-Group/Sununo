import {
  SolarDangerCircleBold,
  SolarGalleryBold,
  SolarMagnifierBold,
  SolarMapPointBold,
  SolarStarBold,
  SolarBellBingBoldDuotone } from "@/components/icons/solar-icons";
import { Colors, normalize, Spacing } from "@/constants/theme";
import { RootState } from "@/store";
import { UserType } from "@/store/authSlice";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  I18nManager } from "react-native";
import { useSelector } from "react-redux";
import { ThemedText } from "./themed-text";
import { CircleBackButton } from "./ui/circle-back-button";
import { useDirection, resolveRowDirection } from "@/i18n";


interface HeaderSectionProps {
  userType?: UserType;
  userName?: string;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  extraIcon?: string | any;
  onExtraIconPress?: () => void;
  showProfile?: boolean;
  onProfilePress?: () => void;
  onMenuPress?: () => void;
  onDeletePress?: () => void;
  showLogo?: boolean;
  showExtra?: boolean;
  marginBottom?: number;
  isHome?: boolean;
}

export function HeaderSection({
  userType,
  userName,
  title,
  subtitle,
  showSearch = false,
  showCategories = false,
  showBackButton = false,
  onBackPress,
  extraIcon,
  onExtraIconPress,
  showProfile = false,
  onProfilePress,
  onMenuPress,
  onDeletePress,
  showLogo = true,
  showExtra = false,
  marginBottom = 0,
  isHome = false }: HeaderSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, textAlign, rowDirection } = useDirection();
  const { userType: stateUserType, language } = useSelector(
    (state: RootState) => state.auth,
  );
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const isArabic = isRTL;

  const [logoStateIndex, setLogoStateIndex] = React.useState(0);
  const logoColors = [Colors.primary, "#EF4444", "#15AB64"];
  const [currentLogoAr, setCurrentLogoAr] = React.useState(isArabic);

  React.useEffect(() => {
    setCurrentLogoAr(isArabic);
    setLogoStateIndex(0);
  }, [isArabic]);

  const handleLogoPress = () => {
    setCurrentLogoAr((prev) => !prev);
    setLogoStateIndex((prev) => (prev + 1) % logoColors.length);
  };

  const currentLogoColor = logoColors[logoStateIndex];

  const CATEGORIES = [
    {
      id: "all",
      label: t("home.categories.all"),
      icon: <SolarGalleryBold size={normalize.width(18)} /> },
    {
      id: "popular",
      label: t("home.categories.popular"),
      icon: <SolarDangerCircleBold size={normalize.width(18)} /> },
    {
      id: "nearby",
      label: t("home.categories.nearby"),
      icon: <SolarMapPointBold size={normalize.width(18)} /> },
    {
      id: "luxury",
      label: t("home.categories.luxury"),
      icon: <SolarStarBold size={normalize.width(18)} /> },
  ];

  // RN auto-mirrors flex-start/flex-end when I18nManager.isRTL=true
  // So when language matches native RTL, use natural values
  const needsCounter = isRTL !== I18nManager.isRTL;
  const startAlign: "flex-start" | "flex-end" = needsCounter ? "flex-end" : "flex-start";
  const endAlign: "flex-start" | "flex-end" = needsCounter ? "flex-start" : "flex-end";
  const rowDir: "row" | "row-reverse" = rowDirection;
  const homeRowDir: "row" | "row-reverse" = resolveRowDirection(!isRTL, I18nManager.isRTL);

  return (
    <View style={[styles.container]}>
      <StatusBar style="dark" />

      {/* Absolute Standard Header Section */}
      <View
        style={[
          styles.topRow,
          {
            marginBottom,
            flexDirection: isHome ? homeRowDir : rowDir
          },
        ]}
      >
        {/* LEFT SIDE (Start side) */}
        <View style={[styles.headerSide, { alignItems: isHome ? endAlign : startAlign }]}>
          {isHome ? (
            <View style={[styles.homeLeftGroup, { flexDirection: rowDir }]}>
              {stateUserType !== "guest" && (
                <TouchableOpacity
                  onPress={() => router.push("/(customer)/notifications")}
                  style={styles.avatarContainerHome}
                >
                  <SolarBellBingBoldDuotone
                    size={normalize.width(28)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push("/(customer)/search")}
                style={styles.searchPillHome}
              >
                <SolarMagnifierBold
                  size={normalize.width(24)}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.homeLeftGroup, { flexDirection: rowDir }]}>
              {showBackButton && <CircleBackButton onPress={onBackPress} />}
              {extraIcon === "search" && (
                <TouchableOpacity
                  onPress={() => router.push("/(customer)/search")}
                  style={styles.searchPillHome}
                >
                  <SolarMagnifierBold
                    size={normalize.width(24)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Center Title */}
        {!isHome && (
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.headerTitle}>
              {title}
            </ThemedText>
          </View>
        )}

        {/* RIGHT SIDE (End side) */}
        <View style={[styles.headerSide, { alignItems: isHome ? startAlign : endAlign }]}>
          {isHome && (
            <TouchableOpacity
              onPress={handleLogoPress}
              style={{ justifyContent: "center", alignItems: "center", paddingVertical: 4 }}
              activeOpacity={0.8}
            >
              <Image
                source={currentLogoAr ? require("@/assets/arlogo.svg") : require("@/assets/logo.svg")}
                style={{ width: 75, height: 25, tintColor: currentLogoColor }}
                contentFit="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Optional Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { flexDirection: rowDir },
            ]}
          >
            <SolarMagnifierBold
              size={normalize.width(20)}
              color={Colors.text.muted}
            />
            <TextInput
              placeholder={t("home.searchPlaceholder")}
              placeholderTextColor={Colors.text.muted}
              style={[styles.searchInput, { textAlign }]}
            />
          </View>
        </View>
      )}

      {/* Optional Categories */}
      {showCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.categoriesContent,
            { flexDirection: rowDir },
          ]}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryItem,
                { flexDirection: rowDir },
                selectedCategory === cat.id && styles.categoryItemActive,
              ]}
            >
              {React.cloneElement(cat.icon as React.ReactElement<any>, {
                color:
                  selectedCategory === cat.id
                    ? Colors.background
                    : Colors.text.primary })}
              <ThemedText
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize.width(20),
    minHeight: normalize.height(60),
    paddingVertical: normalize.height(10),
    justifyContent: "space-between" },
  headerSide: {
    justifyContent: "center",
    alignItems: "center" },
  titleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: normalize.width(10) },
  headerTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: 'center' },
  logoCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: normalize.width(21),
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    overflow: "hidden" },
  logoImg: {
    width: "89%",
    height: "89%" },
  actionButton: {
    backgroundColor: Colors.white,
    padding: normalize.width(8),
    borderRadius: normalize.radius(50),
    borderWidth: 1,
    borderColor: "#E5E7EB", // Slightly darker for matching screenshot
  },
  homeLeftGroup: {
    flexDirection: "row",
    width: "auto",
    gap: 12,
    alignItems: "center" },
  avatarContainerHome: {
    width: normalize.width(48),
    height: normalize.width(48),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    // Transition and cursor are handled by TouchableOpacity/React Native
  },
  avatarCircleHome: {
    width: "82%",
    height: "82%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#FAFCFF" },
  avatarImgHome: {
    width: "100%",
    height: "100%" },
  searchPillHome: {
    width: normalize.width(48),
    height: normalize.width(48),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF" },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md },
  searchBar: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: normalize.height(52) },
  searchInput: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    fontSize: normalize.font(14),
    color: Colors.text.primary,
    fontFamily: "Alexandria-Medium" },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md },
  categoriesContent: {
    gap: Spacing.sm,
    paddingEnd: Spacing.lg },
  categoryItem: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(10),
    gap: normalize.width(8) },
  categoryItemActive: {
    backgroundColor: Colors.primary },
  categoryLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    lineHeight: normalize.font(14),
    paddingVertical: normalize.height(1) },
  categoryLabelActive: {
    color: Colors.background,
    fontFamily: "Alexandria-Medium" } });
