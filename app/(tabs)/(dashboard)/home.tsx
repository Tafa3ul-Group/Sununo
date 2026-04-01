import { ThemedText } from "@/components/themed-text";
import { SolarIcon } from "@/components/ui/solar-icon";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
import {
  useGetOwnerChaletsQuery,
  useGetProviderBookingsQuery,
  useGetProviderProfileQuery,
} from "@/store/api/apiSlice";
import { formatPrice } from "@/utils/format";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

export default function HomeScreen() {
  const router = useRouter();
  const { user, userType, language } = useSelector(
    (state: RootState) => state.auth,
  );
  const { t } = useTranslation();
  const isRTL = language === "ar";
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  // API hooks
  const {
    data: chalets,
    isLoading,
    refetch,
    isFetching,
  } = useGetOwnerChaletsQuery({});
  const { data: profileResponse } = useGetProviderProfileQuery(undefined);
  const { data: bookingsResponse } = useGetProviderBookingsQuery({ limit: 5 });

  const profile = profileResponse?.data || profileResponse;
  const recentBookings = bookingsResponse?.data || bookingsResponse || [];
  const walletBalance = profile?.walletBalance ?? user?.walletBalance ?? 0;

  const handleToggleBalance = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isBalanceVisible) {
      setIsBalanceVisible(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) {
      setIsBalanceVisible(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: isRTL
        ? "تحقق من هويتك لعرض الرصيد"
        : "Verify identity to show balance",
      cancelLabel: isRTL ? "إلغاء" : "Cancel",
      fallbackLabel: isRTL ? "استخدم رمز المرور" : "Use Passcode",
    });

    if (result.success) {
      setIsBalanceVisible(true);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isRTL ? "صباح الخير" : "Good Morning";
    if (hour < 18) return isRTL ? "مساء الخير" : "Good Afternoon";
    return isRTL ? "مساء الخير" : "Good Evening";
  };

  const renderChaletCard = (item: any) => {
    const mainImageSrc = getImageSrc(item.images?.[0]?.url);
    const chaletName = isRTL
      ? item.name?.ar || item.name
      : item.name?.en || item.name;
    const chaletLocation = isRTL
      ? item.address?.ar || item.region?.name
      : item.address?.en || item.region?.enName;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.chaletCard}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: "/(tabs)/(dashboard)/chalet-details",
            params: { id: item.id },
          });
        }}
      >
        <Image source={mainImageSrc} style={styles.chaletImage} />
        <View style={styles.chaletInfo}>
          <Text style={styles.chaletName} numberOfLines={1}>
            {chaletName}
          </Text>
          <View style={styles.locationContainer}>
            <SolarIcon name="map-point-linear" size={12} color="#64748B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {chaletLocation}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.priceText}>
              {formatPrice(item.pricePerNight)}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{isRTL ? "نشط" : "Active"}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View>
              <ThemedText style={styles.greetingText}>
                {getGreeting()},
              </ThemedText>
              <ThemedText style={styles.nameText}>
                {profile?.fullName || user?.name || "..."}
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push("/(tabs)/(dashboard)/notifications")}
            >
              <SolarIcon name="bell-bing-linear" size={24} color="#1E293B" />
              <View style={styles.unreadDot} />
            </TouchableOpacity>
          </View>

          {/* Dashboard Stats Summary */}
          <View style={styles.statsGrid}>
            <View style={[styles.statsCard, { backgroundColor: "#F0F5FF" }]}>
              <View
                style={[styles.statsIconBox, { backgroundColor: "#DEE8FF" }]}
              >
                <SolarIcon name="banknote-2-linear" size={20} color="#035DF9" />
              </View>
              <ThemedText style={styles.statsLabel}>
                {t("dashboard.revenue.total")}
              </ThemedText>
              <View style={styles.balanceContainer}>
                <ThemedText style={styles.statsValue}>
                  {isBalanceVisible ? formatPrice(walletBalance) : "••••••"}
                </ThemedText>
                <TouchableOpacity
                  onPress={handleToggleBalance}
                  style={styles.eyeBtn}
                >
                  <SolarIcon
                    name={isBalanceVisible ? "eye-linear" : "eye-closed-linear"}
                    size={18}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statsCardSmall,
                  { flex: 1, backgroundColor: "#FFF7ED" },
                ]}
              >
                <View
                  style={[styles.statsIconBox, { backgroundColor: "#FFEDD5" }]}
                >
                  <SolarIcon
                    name="calendar-minimalistic-linear"
                    size={18}
                    color="#EA580C"
                  />
                </View>
                <ThemedText style={styles.statsLabelSmall}>
                  {t("tabs.bookings")}
                </ThemedText>
                <ThemedText style={styles.statsValueSmall}>
                  {recentBookings.length || 0}+
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statsCardSmall,
                  { flex: 1, backgroundColor: "#ECFDF5", marginLeft: 12 },
                ]}
              >
                <View
                  style={[styles.statsIconBox, { backgroundColor: "#D1FAE5" }]}
                >
                  <SolarIcon name="home-2-linear" size={18} color="#059669" />
                </View>
                <ThemedText style={styles.statsLabelSmall}>
                  {isRTL ? "الشاليهات" : "Chalets"}
                </ThemedText>
                <ThemedText style={styles.statsValueSmall}>
                  {chalets?.length || 0}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {isRTL ? "إجراءات سريعة" : "Quick Actions"}
              </ThemedText>
            </View>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(tabs)/(dashboard)/add-chalet")}
              >
                <View
                  style={[styles.actionIconBox, { backgroundColor: "#6366F1" }]}
                >
                  <SolarIcon name="add-circle-linear" size={24} color="white" />
                </View>
                <ThemedText style={styles.actionText}>
                  {t("tabs.addChalet")}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(tabs)/(dashboard)/revenue")}
              >
                <View
                  style={[styles.actionIconBox, { backgroundColor: "#F59E0B" }]}
                >
                  <SolarIcon name="chart-linear" size={24} color="white" />
                </View>
                <ThemedText style={styles.actionText}>
                  {t("tabs.revenue")}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(tabs)/(dashboard)/bookings")}
              >
                <View
                  style={[styles.actionIconBox, { backgroundColor: "#8B5CF6" }]}
                >
                  <SolarIcon name="calendar-linear" size={24} color="white" />
                </View>
                <ThemedText style={styles.actionText}>
                  {isRTL ? "الحجوزات" : "Bookings"}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  router.push("/(tabs)/(dashboard)/provider-profile")
                }
              >
                <View
                  style={[styles.actionIconBox, { backgroundColor: "#10B981" }]}
                >
                  <SolarIcon name="settings-linear" size={24} color="white" />
                </View>
                <ThemedText style={styles.actionText}>
                  {isRTL ? "الإعدادات" : "Settings"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* My Chalets Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {isRTL ? "شاليهاتك" : "My Chalets"}
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/(dashboard)/add-chalet")}
              >
                <ThemedText style={styles.viewAllText}>
                  {isRTL ? "+ إضافة" : "+ Add"}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator
                color={Colors.primary}
                size="large"
                style={{ margin: 20 }}
              />
            ) : chalets && chalets.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chaletsList}
              >
                {chalets.map(renderChaletCard)}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <SolarIcon name="magnifer-linear" size={48} color="#94A3B8" />
                <ThemedText style={styles.emptyStateText}>
                  {isRTL ? "لا توجد شاليهات بعد" : "No chalets added yet"}
                </ThemedText>
                <SecondaryButton
                  label={t("tabs.addChalet")}
                  onPress={() => router.push("/(tabs)/(dashboard)/add-chalet")}
                  isActive={true}
                  style={styles.addChaletBtn}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFB",
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  welcomeSection: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  greetingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "white",
  },
  statsGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statsCard: {
    padding: 20,
    borderRadius: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  statsCardSmall: {
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  statsLabelSmall: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#035DF9",
  },
  statsValueSmall: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 4,
  },
  eyeBtn: {
    padding: 8,
  },
  actionSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  viewAllText: {
    fontSize: 14,
    color: "#035DF9",
    fontWeight: "600",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionBtn: {
    width: "48%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  section: {
    marginTop: 28,
  },
  chaletsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  chaletCard: {
    width: 280,
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginRight: 16,
  },
  chaletImage: {
    width: "100%",
    height: 160,
  },
  chaletInfo: {
    padding: 16,
  },
  chaletName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#035DF9",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
  },
  emptyStateText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  addChaletBtn: {
    marginTop: 20,
    width: "100%",
    height: 48,
  },
});
