import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { useDirection } from "@/i18n";
import { normalize } from "@/constants/theme";
import { PolicyType, useGetPolicyQuery } from "@/store/api/apiSlice";

export interface PolicyModalProps {
  visible: boolean;
  /** Which document to show. `null` renders nothing (nothing is fetched). */
  type: PolicyType | null;
  /**
   * "read" — plain viewer with a close button.
   * "accept" — the reader must scroll to the end before "I agree" enables.
   */
  mode?: "read" | "accept";
  onClose: () => void;
  onAccept?: (accepted: { type: PolicyType; version: number }) => void;
}

// A few pixels of slack: on Android the final onScroll often lands a fraction
// short of the exact bottom, and demanding an exact match strands the button.
const BOTTOM_SLACK = 24;

const isAtBottom = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
  return (
    layoutMeasurement.height + contentOffset.y >= contentSize.height - BOTTOM_SLACK
  );
};

/**
 * Full-screen reader for a legal policy fetched from the backend.
 *
 * In "accept" mode the agree button stays disabled until the document has been
 * scrolled to its end — the consent recorded server-side claims the user read
 * it, so the UI has to make that at least true in the mechanical sense.
 */
export function PolicyModal({
  visible,
  type,
  mode = "read",
  onClose,
  onAccept,
}: PolicyModalProps) {
  const { isRTL, direction, textAlign } = useDirection();
  const insets = useSafeAreaInsets();

  const {
    data: policy,
    isLoading,
    isError,
    refetch,
  } = useGetPolicyQuery(type as PolicyType, { skip: !visible || !type });

  const [reachedEnd, setReachedEnd] = useState(false);
  // Content shorter than the viewport can never fire a bottom scroll — measure
  // both and unlock immediately when there is nothing to scroll.
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);

  const unlockIfFits = useCallback(() => {
    if (
      viewportHeight.current > 0 &&
      contentHeight.current > 0 &&
      contentHeight.current <= viewportHeight.current + BOTTOM_SLACK
    ) {
      setReachedEnd(true);
    }
  }, []);

  // Every open starts a fresh read — including reopening the same document.
  useEffect(() => {
    if (visible) {
      setReachedEnd(false);
      contentHeight.current = 0;
      viewportHeight.current = 0;
    }
  }, [visible, type]);

  const title = isRTL
    ? policy?.title?.ar
    : policy?.title?.en || policy?.title?.ar;
  const content = isRTL
    ? policy?.content?.ar
    : policy?.content?.en || policy?.content?.ar;

  const handleAccept = () => {
    if (!policy) return;
    onAccept?.({ type: policy.type, version: policy.version });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { direction, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText
              numberOfLines={2}
              style={[styles.headerTitle, { textAlign }]}
            >
              {title || (isRTL ? "السياسة" : "Policy")}
            </ThemedText>
            {!!policy?.version && (
              <ThemedText style={[styles.version, { textAlign }]}>
                {isRTL
                  ? `النسخة ${policy.version}`
                  : `Version ${policy.version}`}
              </ThemedText>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityLabel={isRTL ? "إغلاق" : "Close"}
          >
            <ThemedText style={styles.closeIcon}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator color="#0061FE" />
          </View>
        )}

        {!isLoading && isError && (
          <View style={styles.centered}>
            <ThemedText style={[styles.errorText, { textAlign: "center" }]}>
              {isRTL
                ? "تعذّر تحميل السياسة. تحقق من الاتصال وحاول مجدداً."
                : "Could not load the policy. Check your connection and try again."}
            </ThemedText>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <ThemedText style={styles.retryText}>
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            scrollEventThrottle={64}
            onScroll={(e) => {
              if (isAtBottom(e)) setReachedEnd(true);
            }}
            onLayout={(e) => {
              viewportHeight.current = e.nativeEvent.layout.height;
              unlockIfFits();
            }}
            onContentSizeChange={(_w, h) => {
              contentHeight.current = h;
              unlockIfFits();
            }}
          >
            <ThemedText style={[styles.body, { textAlign }]}>
              {content}
            </ThemedText>
          </ScrollView>
        )}

        {/* Footer */}
        {mode === "accept" && !isLoading && !isError && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            {!reachedEnd && (
              <ThemedText style={[styles.scrollHint, { textAlign: "center" }]}>
                {isRTL
                  ? "مرّر للأسفل لقراءة السياسة كاملة"
                  : "Scroll to the end to read the full policy"}
              </ThemedText>
            )}
            <PrimaryButton
              label={isRTL ? "قرأت وأوافق" : "I have read and agree"}
              onPress={handleAccept}
              disabled={!reachedEnd || !policy}
              activeColor={reachedEnd && policy ? "#0061FE" : "#CBD5E1"}
              style={styles.acceptBtn}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Alexandria-SemiBold",
    color: "#1E293B",
    lineHeight: 24,
  },
  version: {
    fontSize: 11,
    fontFamily: "Alexandria-Regular",
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Alexandria-Medium",
    color: "#64748B",
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#EBF3FF",
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Alexandria-Medium",
    color: "#0061FE",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 32,
  },
  body: {
    fontSize: 13,
    fontFamily: "Alexandria-Regular",
    color: "#334155",
    lineHeight: normalize.font(24),
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  scrollHint: {
    fontSize: 11.5,
    fontFamily: "Alexandria-Regular",
    color: "#94A3B8",
  },
  acceptBtn: {
    width: "100%",
    minHeight: normalize.height(52),
  },
});
