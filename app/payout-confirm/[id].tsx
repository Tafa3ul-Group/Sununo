import { PayoutConfirmView } from "@/components/payout-confirm-view";
import { RootState } from "@/store";
import {
  useConfirmPayoutMutation,
  useDeclinePayoutMutation,
  useGetPayoutQuery,
} from "@/store/api/apiSlice";
import {
  useConfirmCustomerPayoutMutation,
  useDeclineCustomerPayoutMutation,
  useGetCustomerPayoutQuery,
} from "@/store/api/customerApiSlice";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { useSelector } from "react-redux";

// Single in-app payout confirmation screen shared by customers and chalet owners.
// The owner hits /provider/payouts/* endpoints; the customer hits /customer/payouts/*.
export default function PayoutConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const isOwner = useSelector((s: RootState) => s.auth.userType) === "owner";

  const customerQ = useGetCustomerPayoutQuery(id, { skip: !id || isOwner });
  const providerQ = useGetPayoutQuery(id, { skip: !id || !isOwner });

  const [confirmCustomer, { isLoading: cc }] = useConfirmCustomerPayoutMutation();
  const [declineCustomer, { isLoading: dc }] = useDeclineCustomerPayoutMutation();
  const [confirmProvider, { isLoading: cp }] = useConfirmPayoutMutation();
  const [declineProvider, { isLoading: dp }] = useDeclinePayoutMutation();

  const query = isOwner ? providerQ : customerQ;
  const payout: any = (query.data as any)?.data ?? query.data;

  const runConfirm = isOwner ? confirmProvider : confirmCustomer;
  const runDecline = isOwner ? declineProvider : declineCustomer;

  const onConfirm = useCallback(async () => {
    try {
      await runConfirm(id).unwrap();
      query.refetch();
    } catch (e: any) {
      Alert.alert(t("payoutConfirm.errorTitle"), e?.data?.message || t("payoutConfirm.errorBody"));
    }
  }, [runConfirm, id, query, t]);

  const onDecline = useCallback(async () => {
    try {
      await runDecline(id).unwrap();
      query.refetch();
    } catch (e: any) {
      Alert.alert(t("payoutConfirm.errorTitle"), e?.data?.message || t("payoutConfirm.errorBody"));
    }
  }, [runDecline, id, query, t]);

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <PayoutConfirmView
      payout={payout}
      isLoading={query.isLoading}
      isConfirming={isOwner ? cp : cc}
      isDeclining={isOwner ? dp : dc}
      onConfirm={onConfirm}
      onDecline={onDecline}
      onBack={() => router.back()}
    />
    </>
  );
}
