import {
  SolarDangerCircleBold,
  SolarGalleryBold,
  SolarMagnifierBold,
  SolarMapPointBold,
  SolarStarBold,
  SolarUserBold,
  SolarBellBingBoldDuotone,
  SolarWidgetBold,
} from "@/components/icons/solar-icons";
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
} from "react-native";
import { useSelector } from "react-redux";
import { ThemedText } from "./themed-text";
import { CircleBackButton } from "./ui/circle-back-button";

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
  isHome = false,
}: HeaderSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { userType: stateUserType, language } = useSelector(
    (state: RootState) => state.auth,
  );
  const isRTL = language === "ar";
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const finalUserType = userType || stateUserType;

  const CATEGORIES = [
    {
      id: "all",
      label: t("home.categories.all"),
      icon: <SolarGalleryBold size={normalize.width(18)} />,
    },
    {
      id: "popular",
      label: t("home.categories.popular"),
      icon: <SolarDangerCircleBold size={normalize.width(18)} />,
    },
    {
      id: "nearby",
      label: t("home.categories.nearby"),
      icon: <SolarMapPointBold size={normalize.width(18)} />,
    },
    {
      id: "luxury",
      label: t("home.categories.luxury"),
      icon: <SolarStarBold size={normalize.width(18)} />,
    },
  ];

  const textAlign = isRTL ? "right" : "left";

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Absolute Standard Header Section */}
      <View
        style={[
          styles.topRow,
          {
            marginBottom,
            flexDirection: isHome
              ? isRTL
                ? "row"
                : "row-reverse"
              : isRTL
                ? "row-reverse"
                : "row",
          },
        ]}
      >
        {/* START SIDE (Left in LTR Standard, Right in RTL Standard) - Avatar/Back + Search */}
        <View
          style={[
            styles.headerSide,
            {
              alignItems: isHome
                ? isRTL
                  ? "flex-start"
                  : "flex-end"
                : isRTL
                  ? "flex-end"
                  : "flex-start",
            },
          ]}
        >
          {isHome ? (
            <View
              style={[
                styles.homeLeftGroup,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
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
            <View
              style={[
                styles.homeLeftGroup,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
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

        {/* Center Title - only when no logo shown */}
        {!isHome && !showLogo && (
          <View style={styles.titleWrapper}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
        )}

        {/* END SIDE (Right in LTR Standard, Right in RTL Standard) - Logo */}
        <View
          style={[
            styles.headerSide,
            {
              alignItems: isHome
                ? isRTL
                  ? "flex-end"
                  : "flex-start"
                : isRTL
                  ? "flex-start"
                  : "flex-end",
            },
          ]}
        >
          {showLogo && (
            <View style={isHome ? styles.logoCircleHome : styles.logoCircle}>
              <Image
                source={
                  isRTL
                    ? require("@/assets/arlogo.svg")
                    : require("@/assets/logo.svg")
                }
                style={isHome ? styles.logoImgHome : styles.logoImg}
                contentFit="contain"
              />
            </View>
          )}

          {/* Supporting extra actions for non-home pages */}
          {!isHome && !showLogo && (showProfile || showExtra) && (
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                gap: 8,
                position: "absolute",
                [isRTL ? "left" : "right"]: 0,
              }}
            >
              {showProfile && stateUserType !== "guest" && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push("/(customer)/notifications")}
                >
                  <SolarBellBingBoldDuotone
                    size={normalize.width(28)}
                    color={Colors.text.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Optional Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { flexDirection: isRTL ? "row-reverse" : "row" },
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
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
          style={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryItem,
                { flexDirection: isRTL ? "row-reverse" : "row" },
                selectedCategory === cat.id && styles.categoryItemActive,
              ]}
            >
              {React.cloneElement(cat.icon as React.ReactElement, {
                color:
                  selectedCategory === cat.id
                    ? Colors.background
                    : Colors.text.primary,
              })}
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
    backgroundColor: Colors.background,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: normalize.width(20),
    height: normalize.height(60),
    justifyContent: "space-between",
  },
  headerSide: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-Black",
    color: Colors.text.primary,
    lineHeight: normalize.font(24),
    paddingVertical: normalize.height(2),
  },
  logoCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: normalize.width(21),
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    overflow: "hidden",
  },
  logoImg: {
    width: "89%",
    height: "89%",
  },
  actionButton: {
    backgroundColor: Colors.white,
    padding: normalize.width(8),
    borderRadius: normalize.radius(50),
    borderWidth: 1,
    borderColor: "#E5E7EB", // Slightly darker for matching screenshot
  },
  homeLeftGroup: {
    width: "auto",
    gap: 12,
    alignItems: "center",
  },
  avatarContainerHome: {
    width: normalize.width(48),
    height: normalize.width(48),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    // Transition and cursor are handled by TouchableOpacity/React Native
  },
  avatarCircleHome: {
    width: "82%",
    height: "82%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#FAFCFF",
  },
  avatarImgHome: {
    width: "100%",
    height: "100%",
  },
  searchPillHome: {
    width: normalize.width(48),
    height: normalize.width(48),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoCircleHome: {
    width: normalize.width(54),
    height: normalize.width(54),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoImgHome: {
    width: "65%",
    height: "65%",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: normalize.height(52),
  },
  searchInput: {
    flex: 1,
    marginHorizontal: Spacing.sm,
    fontSize: normalize.font(16),
    color: Colors.text.primary,
    fontFamily: "Alexandria-Regular",
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryItem: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: normalize.height(10),
    borderRadius: normalize.radius(10),
    gap: normalize.width(8),
  },
  categoryItemActive: {
    backgroundColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    lineHeight: normalize.font(20),
    paddingVertical: normalize.height(1),
  },
  categoryLabelActive: {
    color: Colors.background,
    fontFamily: "Alexandria-Regular",
  },
});
