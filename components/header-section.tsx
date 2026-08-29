import {
  SolarDangerCircleBold,
  SolarGalleryBold,
  SolarAltArrowDownLinear,
  SolarMagnifierBold,
  SolarMapPointBold,
  SolarStarBold,
  SolarBellBingBoldDuotone } from "@/components/icons/solar-icons";
import { Colors, Fonts, normalize, Spacing } from "@/constants/theme";
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
  View } from "react-native";
import { useSelector } from "react-redux";
import { ThemedText } from "./themed-text";
import { CircleBackButton } from "./ui/circle-back-button";
import { ltrScrollContent, ltrScroller, useDirection, useRtlListOrder } from "@/i18n";
import { useGetNotificationsQuery } from "@/store/api/customerApiSlice";
import { activeSection } from "@/utils/notification-section";


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
  /**
   * Home only. The header's search pill was replaced by a governorate picker,
   * so the label and the tap handler come from the home screen, which owns the
   * selection and the sheet.
   */
  cityLabel?: string;
  onCityPress?: () => void;
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
  cityLabel,
  onCityPress }: HeaderSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, direction, textAlign, inputTextAlign } = useDirection();
  const { userType: stateUserType, language } = useSelector(
    (state: RootState) => state.auth,
  );
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // Unread notifications count for the bell badge. Only fetch for signed-in
  // users (guests have no notifications). Shares the cache key with the
  // notifications screen, so marking-as-read updates the badge automatically;
  // polling keeps it fresh while the user sits on the home screen.
  const showBell = isHome && stateUserType !== "guest";
  const { data: notificationsResponse } = useGetNotificationsQuery(
    { page: 1, limit: 50, role: activeSection(stateUserType) },
    { skip: !showBell, pollingInterval: 60000 },
  );
  const unreadCount = React.useMemo(() => {
    const items: any[] = notificationsResponse?.data ?? [];
    return items.reduce(
      (count, item) => (item?.readAt || item?.isRead ? count : count + 1),
      0,
    );
  }, [notificationsResponse]);
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

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
  // Chip strip content is forced physical-LTR; reverse the chips in Arabic so
  // "All" keeps the leading (right) edge and stays visible at mount.
  const orderedCategories = useRtlListOrder(CATEGORIES);

  return (
    <View style={[styles.container]}>
      <StatusBar style="dark" />

      {/* Absolute Standard Header Section */}
      <View
        style={[
          styles.topRow,
          {
            marginBottom,
            flexDirection: "row"
          },
        ]}
      >
        {/* START SIDE — logo on home; back/search actions elsewhere.
            (Children are in natural logical order: with plain 'row' the
            container direction mirrors them, so the logo keeps the physical
            right edge in Arabic and the left edge in English — identical to
            the old row-reverse layout.) */}
        <View style={[styles.headerSide, { alignItems: "flex-start" }]}>
          {isHome ? (
            <TouchableOpacity
              onPress={handleLogoPress}
              style={{ justifyContent: "center", alignItems: "center", paddingVertical: 4 }}
              activeOpacity={0.8}
            >
              <Image
                source={currentLogoAr ? require("@/assets/arlogo.svg") : require("@/assets/enlogo.svg")}
                style={{ width: 75, height: 25, tintColor: currentLogoColor }}
                contentFit="contain"
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.homeLeftGroup, { flexDirection: "row" }]}>
              {showBackButton && <CircleBackButton onPress={onBackPress} />}
              {/* Search opens the map: results live in a sheet there that
                  follows whatever area is on screen. */}
              {extraIcon === "search" && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/(customer)/explore")}
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

        {/* Center Title — absolutely centered across the full header width so it
            stays in the true screen center regardless of the side buttons'
            widths. pointerEvents none keeps the back button tappable. */}
        {!isHome && (
          <View style={styles.titleWrapper} pointerEvents="none">
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {title}
            </ThemedText>
          </View>
        )}

        {/* END SIDE — search pill + bell on home; empty elsewhere */}
        <View style={[styles.headerSide, { alignItems: "flex-start" }]}>
          {isHome && (
            <View style={[styles.homeLeftGroup, { flexDirection: "row" }]}>
              {/* Governorate picker, in the slot the search pill used to hold.
                  Home is browsed by محافظة now, and this is the only place that
                  says which one — so it states the name rather than hiding the
                  choice in a filter sheet. Search did not move: the Explore tab
                  and the middle tab's search sheet are unchanged. */}
              <TouchableOpacity
                onPress={onCityPress}
                disabled={!onCityPress}
                style={[styles.searchTextPill, { flexDirection: "row" }]}
                activeOpacity={0.85}
              >
                <SolarMapPointBold
                  size={normalize.width(18)}
                  color={Colors.primary}
                />
                <ThemedText
                  style={[styles.cityPillText, { textAlign }]}
                  numberOfLines={1}
                >
                  {cityLabel || (isArabic ? "كل المحافظات" : "All governorates")}
                </ThemedText>
                <SolarAltArrowDownLinear
                  size={normalize.width(14)}
                  color="#64748B"
                />
              </TouchableOpacity>
              {stateUserType !== "guest" && (
                <TouchableOpacity
                  onPress={() => router.push("/(customer)/notifications")}
                  style={styles.bellButtonHome}
                >
                  <SolarBellBingBoldDuotone
                    size={normalize.width(18)}
                    color={Colors.primary}
                  />
                  {unreadCount > 0 && (
                    <View
                      style={[
                        styles.notificationBadge,
                        { end: -4 },
                      ]}
                      pointerEvents="none"
                    >
                      <ThemedText style={styles.notificationBadgeText}>
                        {badgeLabel}
                      </ThemedText>
                    </View>
                  )}
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
              { flexDirection: "row" },
            ]}
          >
            <SolarMagnifierBold
              size={normalize.width(20)}
              color={Colors.text.muted}
            />
            <TextInput
              placeholder={t("home.searchPlaceholder")}
              placeholderTextColor={Colors.text.muted}
              style={[styles.searchInput, { textAlign: inputTextAlign }]}
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
            { flexDirection: "row" },
            ltrScrollContent,
          ]}
          style={[styles.categoriesScroll, ltrScroller]}
        >
          {orderedCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryItem,
                { flexDirection: "row", direction },
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
    paddingHorizontal: normalize.width(10),
    minHeight: normalize.height(24),
    paddingVertical: normalize.height(10),
    justifyContent: "space-between" },
  headerSide: {
    justifyContent: "center",
    alignItems: "center" },
  titleWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    // Keep the title clear of the side buttons so long titles don't overlap.
    paddingHorizontal: normalize.width(64) },
  headerTitle: {
    fontSize: normalize.font(14),
    fontFamily: "IBMPlexSansArabic-SemiBold",
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
    gap: 6,
    alignItems: "center" },
  bellButtonHome: {
    // Same height as searchTextPill so the two sit level in the row.
    width: normalize.width(34),
    height: normalize.width(34),
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    // Transition and cursor are handled by TouchableOpacity/React Native
  },
  notificationBadge: {
    position: "absolute",
    top: -3,
    minWidth: normalize.width(17),
    height: normalize.width(17),
    paddingHorizontal: 3,
    borderRadius: 999,
    backgroundColor: "#FF4500",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF" },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: normalize.font(9),
    lineHeight: normalize.font(12),
    fontFamily: "IBMPlexSansArabic-Bold",
    textAlign: "center" },
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
    width: normalize.width(40),
    height: normalize.width(40),
    borderRadius: normalize.radius(14),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary + "14" },
  searchTextPill: {
    height: normalize.width(34),
    minWidth: normalize.width(150),
    borderRadius: 999,
    paddingHorizontal: normalize.width(14),
    alignItems: "center",
    gap: normalize.width(8),
    backgroundColor: "#F3F4F6" },
  cityPillText: {
    flex: 1,
    fontSize: normalize.font(11),
    fontFamily: "IBMPlexSansArabic-SemiBold",
    color: "#334155",
  },
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
    fontFamily: "IBMPlexSansArabic-Regular" },
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
    fontFamily: "IBMPlexSansArabic-Medium",
    color: Colors.text.primary,
    lineHeight: normalize.font(14),
    paddingVertical: normalize.height(1) },
  categoryLabelActive: {
    color: Colors.background,
    fontFamily: "IBMPlexSansArabic-Medium" } });
