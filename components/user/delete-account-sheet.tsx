import { ThemedText } from "@/components/themed-text";
import { isRTL } from "@/i18n";
import { useDeleteCustomerAccountMutation } from "@/store/api/customerApiSlice";
import { logout } from "@/store/authSlice";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";

interface DeleteAccountSheetProps {
  onDeleted?: () => void;
}

export const DeleteAccountSheet = React.forwardRef<BottomSheetModal, DeleteAccountSheetProps>(
  ({ onDeleted }, ref) => {
    const dispatch = useDispatch();
    const [deleteAccount] = useDeleteCustomerAccountMutation();
    const [isDeleting, setIsDeleting] = useState(false);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        await deleteAccount(undefined).unwrap();
        Alert.alert(
          isRTL ? "تم الحذف" : "Deleted",
          isRTL
            ? "تم حذف حسابك بنجاح."
            : "Your account has been successfully deleted."
        );
        dispatch(logout());
        if (onDeleted) onDeleted();
      } catch (err: any) {
        console.error("Delete Account Error:", err);
        Alert.alert(
          isRTL ? "خطأ" : "Error",
          isRTL
            ? "فشل في حذف الحساب. يرجى المحاولة لاحقاً."
            : "Failed to delete account. Please try again later."
        );
      } finally {
        setIsDeleting(false);
      }
    };

    const handleDismiss = () => {
      // @ts-ignore
      ref.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.content}>
          {/* Warning Icon */}
          <View style={styles.warningIcon}>
            <ThemedText style={styles.warningEmoji}>⚠️</ThemedText>
          </View>

          <ThemedText style={styles.title}>
            {isRTL ? "حذف الحساب" : "Delete Account"}
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            {isRTL
              ? "هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي إلى حذف جميع بياناتك."
              : "Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your data."}
          </ThemedText>

          <View style={styles.actions}>
            {/* Delete */}
            <TouchableOpacity
              style={[styles.deleteBtn, isDeleting && { opacity: 0.6 }]}
              onPress={handleDelete}
              activeOpacity={0.8}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.deleteText}>
                  {isRTL ? "حذف الحساب" : "Delete Account"}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleDismiss}
              activeOpacity={0.8}
              disabled={isDeleting}
            >
              <ThemedText style={styles.cancelText}>
                {isRTL ? "إلغاء" : "Cancel"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

DeleteAccountSheet.displayName = "DeleteAccountSheet";

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#E5E7EB",
    width: 60,
  },
  background: {
    borderRadius: 36,
    backgroundColor: "white",
  },
  content: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  warningIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  warningEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 16,
    fontFamily: "Alexandria-Medium",
    color: "#DC2626",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    width: "100%",
    backgroundColor: "#DC2626",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
  cancelBtn: {
    width: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cancelText: {
    color: "#374151",
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
  },
});
