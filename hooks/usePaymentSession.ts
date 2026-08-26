import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLazyGetPaymentStatusQuery } from "@/store/api/customerApiSlice";

/** Deep link the gateway returns to when the customer finishes at its page. */
const PAYMENT_RETURN_URL = "sununo://payment-callback";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // 20 × 3s = one minute

/**
 * iOS keeps the auth session's browser on screen after the gateway redirects
 * back, so a payment we already resolved would otherwise sit behind a web view
 * the customer has to dismiss by hand. Android closes it on its own.
 */
const dismissBrowser = () => {
  if (Platform.OS === "ios") {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      /* already closed */
    }
  }
};

export type PaymentStatus = "pending" | "success" | "failed" | "timeout";

type Options = {
  /** Called once, when the gateway confirms. Receives the transaction id. */
  onSuccess: (transactionId: string) => void;
  /** Called once, when the gateway rejects. */
  onFailure?: () => void;
  /** Called when a session opens, before the browser does. */
  onSessionOpen?: () => void;
};

/**
 * Owns one payment attempt: the gateway's page, the polling that follows it, and
 * the reconciliation that has to happen when the OS interrupts both.
 *
 * The gateway confirms out-of-band via a webhook, so the app is never the thing
 * that decides a payment succeeded — it only asks. That means every exit from
 * this screen (browser closed, app backgrounded, process killed) needs a way
 * back to the answer, which is why the status is polled AND re-checked on
 * foreground rather than simply awaited.
 */
export function usePaymentSession({ onSuccess, onFailure, onSessionOpen }: Options) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkPaymentStatus] = useLazyGetPaymentStatusQuery();
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handlers are read through a ref so the polling loop and the AppState
  // listener never need them as dependencies — without this, a caller that
  // rebuilds `onSuccess` each render would tear down and restart the poll.
  const handlersRef = useRef({ onSuccess, onFailure, onSessionOpen });
  handlersRef.current = { onSuccess, onFailure, onSessionOpen };

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Otherwise the interval keeps firing for up to a minute after the screen is
  // gone, setting state on an unmounted component.
  useEffect(() => stopPolling, [stopPolling]);

  const settle = useCallback(
    (result: PaymentStatus, txnId: string) => {
      stopPolling();
      setStatus(result);
      dismissBrowser();
      if (result === "success") handlersRef.current.onSuccess(txnId);
      else if (result === "failed") handlersRef.current.onFailure?.();
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (txnId: string) => {
      let attempts = 0;
      stopPolling();

      pollingIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const result = await checkPaymentStatus(txnId).unwrap();
          if (result?.status === "success") {
            settle("success", txnId);
            // Terminal — must NOT fall through to the attempt-count check
            // below, which on the final attempt overwrote this success with
            // "timeout" in the same tick and told the customer their completed
            // payment had failed to verify.
            return;
          }
          if (result?.status === "failed") {
            settle("failed", txnId);
            return;
          }
        } catch (e) {
          // Only real network errors are worth logging; a closed WebBrowser
          // rejects here too and means nothing.
          if (e && typeof e === "object" && "status" in e) {
            console.error("Payment polling error", e);
          }
        }

        if (attempts >= MAX_POLL_ATTEMPTS) {
          stopPolling();
          setStatus("timeout");
          dismissBrowser();
        }
      }, POLL_INTERVAL_MS);
    },
    [checkPaymentStatus, settle, stopPolling],
  );

  /**
   * Opens (or RE-opens) the gateway page and watches the result. Used both for a
   * freshly created booking and to resume one an abandoned payment left pending,
   * so the two paths cannot drift apart.
   */
  const open = useCallback(
    async (url: string, txnId: string) => {
      setStatus("pending");
      setTransactionId(txnId);
      handlersRef.current.onSessionOpen?.();

      try {
        await WebBrowser.openAuthSessionAsync(url, PAYMENT_RETURN_URL);
        // Poll regardless of the browser's own result: the gateway may confirm
        // after the customer closes the page.
        startPolling(txnId);
      } catch (e) {
        console.error("Payment browser error", e);
        setStatus("failed");
      }
    },
    [startPolling],
  );

  /**
   * Re-check on every return to the foreground.
   *
   * Polling only ever starts after `openAuthSessionAsync` resolves, so a payment
   * interrupted by the OS — backgrounded at the gateway, the bank's app taking
   * over, the process killed — left the customer with a booking the webhook had
   * already confirmed and a screen that never said so.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      if (!transactionId) return;
      // Terminal results stand — re-checking a settled payment would reopen a
      // sheet the customer already dismissed.
      if (status === "success" || status === "failed") return;
      // A live poller is already on it.
      if (pollingIntervalRef.current) return;

      void (async () => {
        try {
          const result = await checkPaymentStatus(transactionId).unwrap();
          if (result?.status === "success") settle("success", transactionId);
          else if (result?.status === "failed") settle("failed", transactionId);
          else startPolling(transactionId); // still settling at the gateway
        } catch {
          /* offline or transient — the next foreground tries again */
        }
      })();
    });

    return () => subscription.remove();
  }, [transactionId, status, checkPaymentStatus, settle, startPolling]);

  /**
   * Ask the gateway again after a timeout. The webhook may simply have been slow,
   * so a timeout is "we stopped watching", never "the payment failed".
   */
  const recheck = useCallback(() => {
    if (!transactionId) return;
    setStatus("pending");
    startPolling(transactionId);
  }, [transactionId, startPolling]);

  return { status, transactionId, open, recheck, setTransactionId };
}
