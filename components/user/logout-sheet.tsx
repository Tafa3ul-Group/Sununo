import { ThemedText } from "@/components/themed-text";
import { isRTL } from "@/i18n";
import { useLogoutUserMutation } from "@/store/api/customerApiSlice";
import { logout } from "@/store/authSlice";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch } from "react-redux";

interface LogoutSheetProps {
  onLoggedOut?: () => void;
}

export const LogoutSheet = React.forwardRef<BottomSheetModal, LogoutSheetProps>(
  ({ onLoggedOut }, ref) => {
    const dispatch = useDispatch();
    const [logoutApi] = useLogoutUserMutation();

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

    const handleLogout = async () => {
      try {
        await logoutApi(undefined).unwrap();
      } catch {
        // ignore server error
      }
      dispatch(logout());
      if (onLoggedOut) onLoggedOut();
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
          <ThemedText style={styles.title}>
            {isRTL ? "تسجيل الخروج" : "Logout"}
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            {isRTL
              ? "هل أنت متأكد من تسجيل الخروج؟"
              : "Are you sure you want to logout?"}
          </ThemedText>

          <View style={styles.actions}>
            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.logoutText}>
                {isRTL ? "خروج" : "Logout"}
              </ThemedText>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleDismiss}
              activeOpacity={0.8}
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

LogoutSheet.displayName = "LogoutSheet";

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
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  logoutBtn: {
    width: "100%",
    backgroundColor: "#EF4444",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
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
