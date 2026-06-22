import { HeaderSection } from "@/components/header-section";
import { EmptyState } from "@/components/ui/empty-state";
import { WalletCard } from "@/components/user/wallet-card";
import { BookingCardSkeleton } from "@/components/ui/skeleton-loader";
import { SolarBanknoteBold, SolarWalletBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { SUPPORT_WHATSAPP } from "@/constants/links";
import { useDirection } from "@/i18n";
import {
  useGetCustomerTransactionsQuery,
  useGetCustomerWalletQuery,
} from "@/store/api/customerApiSlice";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WalletTransactionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, textAlign } = useDirection();
  const insets = useSafeAreaInsets();
  const startAlign = isRTL ? "flex-end" : "flex-start";
  const endAlign = isRTL ? "flex-start" : "flex-end";

  const {
    data: txResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCustomerTransactionsQuery({ page: 1, limit: 50 });
  const { data: walletData } = useGetCustomerWalletQuery(undefined);

  const transactions = txResponse?.data || txResponse || [];
  const balance = walletData?.balance
    ? Number(walletData.balance).toLocaleString()
    : "0";

  const openWithdraw = useCallback(() => {
    const msg = encodeURIComponent(
      isRTL
        ? "مرحباً، أرغب بسحب رصيدي."
        : "Hello, I would like to withdraw my balance.",
    );
    Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`).catch(() => {
      Linking.openURL(`tel:+${SUPPORT_WHATSAPP}`).catch(() => {});
    });
  }, [isRTL]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(isRTL ? "ar-IQ" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const amountNum = Number(item.amount) || 0;
    const typeStr = String(item.type || item.direction || "").toLowerCase();
    const explicitDebit = /(debit|payment|withdraw|deduct|out)/.test(typeStr);
    const explicitCredit = /(credit|refund|deposit|topup|cashback|in)/.test(
      typeStr,
    );
    const isCredit = explicitCredit || (!explicitDebit && amountNum >= 0);
    const color = isCredit ? "#10B981" : "#EF4444";
    const bg = isCredit ? "#ECFDF5" : "#FEF2F2";

    const title =
      item.description ||
      item.reason ||
      item.note ||
      (isCredit
        ? t("profile.wallet.walletCredit")
        : t("profile.wallet.walletDebit"));

    return (
      <View
        style={[
          styles.txItem,
          { flexDirection: "row", direction: isRTL ? "rtl" : "ltr" },
        ]}
      >
        <View style={[styles.txIcon, { backgroundColor: bg }]}>
          <SolarBanknoteBold size={22} color={color} />
        </View>

        <View style={[styles.txInfo, { alignItems: startAlign }]}>
          <ThemedText style={[styles.txTitle, { textAlign }]} numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.txDate, { textAlign }]}>
            {formatDate(item.createdAt || item.date)}
          </ThemedText>
        </View>

        <View style={{ alignItems: endAlign }}>
          <ThemedText style={[styles.txAmount, { color }]}>
            {isCredit ? "+" : "-"}
            {Math.abs(amountNum).toLocaleString()}{" "}
            <ThemedText style={styles.currencySmall}>
              {t("common.iqd")}
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderSection
        title={t("profile.wallet.transactions")}
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Branded balance card (same as profile) */}
      <WalletCard balance={balance} onWithdraw={openWithdraw} />

      {isLoading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </View>
      ) : (Array.isArray(transactions) ? transactions : []).length === 0 ? (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon={<SolarWalletBold size={56} color={Colors.primary} />}
            title={t("profile.wallet.noTransactions")}
            description={t("profile.wallet.noTransactionsDesc")}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={Array.isArray(transactions) ? transactions : []}
            renderItem={renderItem}
            keyExtractor={(item: any, index) => String(item?.id ?? index)}
            estimatedItemSize={80}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          />
        </View>
      )}
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
    paddingBottom: 100,
  },
  txItem: {
    backgroundColor: "white",
    borderRadius: normalize.radius(16),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 12,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    marginBottom: 3,
  },
  txDate: {
    fontSize: normalize.font(8),
    color: Colors.text.muted,
    fontFamily: "Alexandria-Medium",
  },
  txAmount: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
  },
  currencySmall: {
    fontSize: normalize.font(8),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.muted,
  },
  separator: {
    height: 10,
  },
});
