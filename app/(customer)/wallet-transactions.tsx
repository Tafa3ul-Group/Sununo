import { HeaderSection } from "@/components/header-section";
import { SolarBanknoteBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import {
  useGetCustomerTransactionsQuery,
  useGetCustomerWalletQuery,
} from "@/store/api/customerApiSlice";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WalletTransactionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, textAlign } = useDirection();
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
        ? isRTL
          ? "إيداع في المحفظة"
          : "Wallet Credit"
        : isRTL
          ? "خصم من المحفظة"
          : "Wallet Debit");

    return (
      <View style={[styles.txItem, { flexDirection: "row" }]}>
        <View style={[styles.txIcon, { backgroundColor: bg }]}>
          <SolarBanknoteBold size={22} color={color} />
        </View>

        <View style={[styles.txInfo, { alignItems: startAlign }]}>
          <Text style={[styles.txTitle, { textAlign }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.txDate, { textAlign }]}>
            {formatDate(item.createdAt || item.date)}
          </Text>
        </View>

        <View style={{ alignItems: endAlign }}>
          <Text style={[styles.txAmount, { color }]}>
            {isCredit ? "+" : "-"}
            {Math.abs(amountNum).toLocaleString()}{" "}
            <Text style={styles.currencySmall}>{t("common.iqd")}</Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderSection
        title={t("profile.wallet.transactions")}
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Balance summary */}
      <View style={styles.balanceCard}>
        <ThemedText style={styles.balanceLabel}>
          {t("profile.wallet.balance")}
        </ThemedText>
        <ThemedText style={styles.balanceValue}>
          {balance} {t("common.iqd")}
        </ThemedText>
      </View>

      {isLoading ? (
        <ActivityIndicator
          color={Colors.primary}
          style={{ marginTop: 60 }}
          size="large"
        />
      ) : (
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <SolarBanknoteBold size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>
                {isRTL ? "لا توجد معاملات" : "No Transactions"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isRTL
                  ? "ستظهر حركات محفظتك هنا"
                  : "Your wallet activity will appear here"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  balanceLabel: {
    fontSize: normalize.font(8),
    color: Colors.text.muted,
    fontFamily: "Alexandria-Medium",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: normalize.font(16),
    color: Colors.text.primary,
    fontFamily: "Alexandria-Medium",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  txItem: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 12,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    height: 1,
    backgroundColor: "#F5F5F5",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#F8F9FB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: normalize.font(8),
    color: Colors.text.muted,
    fontFamily: "Alexandria-Medium",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
