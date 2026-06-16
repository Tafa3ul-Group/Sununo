import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import LottieView from "lottie-react-native";
import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from "react-native-toast-message";

import { SolarCalendarBold, SolarClockCircleLinear, SolarLockBold, SolarPhoneBold, SolarUserBold } from "@/components/icons/solar-icons";
import { SecondaryButton } from "@/components/user/secondary-button";
import { normalize } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import {
  useCreateExternalBookingMutation,
  useUpdateShiftPricingDayMutation
} from "@/store/api/apiSlice";

interface ShiftActionSheetProps {
  selectedShiftForAction: any;
  selectedChaletId: string | undefined;
  dateString: string;
  isRTL: boolean;
  onDismiss: () => void;
  refreshAvailability: () => void;
  openBookingDetails: (id: string) => void;
  handleOpenCancelSheet: (booking: any) => void;
  format12H: (time: string | undefined | null, isRTL: boolean) => string;
}

export const ShiftActionSheet = forwardRef<BottomSheetModal, ShiftActionSheetProps>(({
  selectedShiftForAction,
  selectedChaletId,
  dateString,
  isRTL,
  onDismiss,
  refreshAvailability,
  openBookingDetails,
  handleOpenCancelSheet,
  format12H
}, ref) => {
  const [createExternalBooking, { isLoading: isCreatingExternal }] = useCreateExternalBookingMutation();
  const [updateShiftPricingDay, { isLoading: isUpdatingPricing }] = useUpdateShiftPricingDayMutation();

  const [externalNotes, setExternalNotes] = useState("");
  const [externalCustomerName, setExternalCustomerName] = useState("");
  const [externalCustomerPhone, setExternalCustomerPhone] = useState("");
  const [showExternalSuccess, setShowExternalSuccess] = useState(false);

  const textAlign = isRTL ? 'left' : 'right';
  const IDENTITY_BLUE = "#035DF9";

  const renderBackdrop = React.useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleDismiss = () => {
    setExternalNotes("");
    setExternalCustomerName("");
    setExternalCustomerPhone("");
    setShowExternalSuccess(false);
    onDismiss();
  };

  const closeSheet = () => {
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.dismiss();
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={true}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      onDismiss={handleDismiss}
    >
      <BottomSheetView style={[styles.sheetContent]}>
        {selectedShiftForAction && (
          <>
            {showExternalSuccess ? (
              <View style={styles.successAnimationContainer}>
                <LottieView
                  source={require("../../components/icons/motions/success.json")}
                  autoPlay
                  loop={false}
                  onAnimationFinish={closeSheet}
                  style={[styles.successLottie, { height: 300 }]}
                  resizeMode="contain"
                />
                <Text style={styles.successAnimationText}>
                  {isRTL
                    ? "تم تأكيد الحجز الخارجي بنجاح"
                    : "External booking confirmed successfully"}
                </Text>
              </View>
            ) : selectedShiftForAction.isAvailable ? (
              <View style={{ padding: 24 }}>
                <View
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    marginBottom: 24,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontSize: normalize.font(16),
                        fontFamily: "Alexandria-Bold",
                        color: "#1E293B",
                        textAlign,
                      }}
                    >
                      {isRTL
                        ? selectedShiftForAction.shiftName?.ar || selectedShiftForAction.shiftName
                        : selectedShiftForAction.shiftName?.en || selectedShiftForAction.shiftName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#ECFDF5",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 9999,
                        borderWidth: 1,
                        borderColor: "#A7F3D0",
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#10B981",
                          [isRTL ? "marginLeft" : "marginRight"]: 6,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: normalize.font(11),
                          fontFamily: "Alexandria-Bold",
                          color: "#059669",
                        }}
                      >
                        {isRTL ? "متاح للحجز" : "Available"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 16,
                      borderTopWidth: 1,
                      borderTopColor: "#E2E8F0",
                      paddingTop: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <SolarCalendarBold size={16} color={IDENTITY_BLUE} />
                      <Text
                        style={{
                          fontSize: normalize.font(12),
                          fontFamily: "Alexandria-SemiBold",
                          color: "#475569",
                        }}
                      >
                        {dateString}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <SolarClockCircleLinear size={16} color={IDENTITY_BLUE} />
                      <Text
                        style={{
                          fontSize: normalize.font(12),
                          fontFamily: "Alexandria-SemiBold",
                          color: "#475569",
                        }}
                      >
                        {format12H(selectedShiftForAction.startTime, isRTL)} -{" "}
                        {format12H(selectedShiftForAction.endTime, isRTL)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ width: "100%" }}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { textAlign, color: "#475569", fontFamily: "Alexandria-SemiBold" }
                    ]}
                  >
                    {isRTL ? "اسم الزبون (اختياري)" : "Customer Name (Optional)"}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: "#F8FAFC",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      height: 54,
                      paddingHorizontal: 16,
                      marginBottom: 20,
                      gap: 10,
                    }}
                  >
                    <SolarUserBold size={18} color="#94A3B8" />
                    <BottomSheetTextInput
                      style={{
                        flex: 1,
                        height: "100%",
                        fontFamily: "Alexandria-Regular",
                        fontSize: normalize.font(14),
                        color: "#1E293B",
                        textAlign,
                      }}
                      placeholder={isRTL ? "أدخل اسم الزبون..." : "Enter customer name..."}
                      placeholderTextColor="#94A3B8"
                      value={externalCustomerName}
                      onChangeText={setExternalCustomerName}
                    />
                  </View>

                  <Text
                    style={[
                      styles.inputLabel,
                      { textAlign, color: "#475569", fontFamily: "Alexandria-SemiBold" }
                    ]}
                  >
                    {isRTL ? "رقم الهاتف (اختياري)" : "Phone Number (Optional)"}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: "#F8FAFC",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      height: 54,
                      paddingHorizontal: 16,
                      marginBottom: 20,
                      gap: 10,
                    }}
                  >
                    <SolarPhoneBold size={18} color="#94A3B8" />
                    <BottomSheetTextInput
                      style={{
                        flex: 1,
                        height: "100%",
                        fontFamily: "Alexandria-Regular",
                        fontSize: normalize.font(14),
                        color: "#1E293B",
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                      placeholder={isRTL ? "07xxxxxxxx" : "07xxxxxxxx"}
                      placeholderTextColor="#94A3B8"
                      value={externalCustomerPhone}
                      onChangeText={setExternalCustomerPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <Text
                    style={[
                      styles.inputLabel,
                      { textAlign, color: "#475569", fontFamily: "Alexandria-SemiBold" }
                    ]}
                  >
                    {isRTL
                      ? "ملاحظات إضافية (اختياري)"
                      : "Additional Notes (Optional)"}
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#F8FAFC",
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      padding: 12,
                      minHeight: 100,
                      marginBottom: 24,
                    }}
                  >
                    <BottomSheetTextInput
                      style={{
                        flex: 1,
                        fontFamily: "Alexandria-Regular",
                        fontSize: normalize.font(14),
                        color: "#1E293B",
                        textAlign,
                        textAlignVertical: "top",
                      }}
                      placeholder={
                        isRTL
                          ? "أدخل أي ملاحظات أخرى (مثال: دفعة مقدمة)..."
                          : "Enter any other notes (e.g. down payment)..."
                      }
                      placeholderTextColor="#94A3B8"
                      value={externalNotes}
                      onChangeText={setExternalNotes}
                      multiline
                    />
                  </View>

                  <SecondaryButton
                    label={
                      isRTL
                        ? "تأكيد الحجز الخارجي"
                        : "Confirm External Booking"
                    }
                    onPress={async () => {
                      try {
                        const result = await createExternalBooking({
                          chaletId: selectedChaletId!,
                          shiftId:
                            selectedShiftForAction.shiftId ||
                            selectedShiftForAction.id,
                          date: dateString,
                          notes: externalNotes,
                          customerName: externalCustomerName,
                          customerPhone: externalCustomerPhone
                        }).unwrap();

                        refreshAvailability();
                        setExternalNotes("");
                        setShowExternalSuccess(true);
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success,
                        );

                        setTimeout(() => {
                          closeSheet();
                        }, 3500);
                      } catch (e: any) {
                        Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: e?.data?.message || (isRTL ? 'فشل العملية' : 'Failed'), position: 'bottom' });
                      }
                    }}
                    isActive={true}
                    activeColor={IDENTITY_BLUE}
                    isLoading={isCreatingExternal}
                    style={{ height: 50 }}
                  />
                </View>
              </View>
            ) : selectedShiftForAction.isClosed ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <View style={[styles.avatarPlaceholder, { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F1F5F9", marginBottom: 20 }]}>
                  <SolarLockBold size={40} color="#64748B" />
                </View>
                <Text style={[styles.sheetTitle, { marginBottom: 8 }]}>
                  {isRTL ? "هذه الفترة مغلقة" : "This shift is closed"}
                </Text>
                <Text style={{ textAlign: "center", color: "#64748B", fontFamily: "Alexandria-Regular", fontSize: normalize.font(14), marginBottom: 32 }}>
                  {isRTL
                    ? "لقد قمت بإغلاق هذه الفترة يدوياً. لن يتمكن الزبائن من حجزها حتى تقوم بإعادة فتحها."
                    : "You have manually closed this shift. Customers won't be able to book it until you reopen it."}
                </Text>

                <SecondaryButton
                  label={isRTL ? "إلغاء الإغلاق (إعادة الفتح)" : "Un-close (Reopen)"}
                  onPress={async () => {
                    try {
                      if (!selectedShiftForAction.pricingId) {
                        throw new Error("Pricing ID not found");
                      }
                      await updateShiftPricingDay({
                        shiftId: selectedShiftForAction.shiftId || selectedShiftForAction.id,
                        pricingId: selectedShiftForAction.pricingId,
                        price: 50000,
                      }).unwrap();

                      refreshAvailability();
                      closeSheet();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (e: any) {
                      Toast.show({ type: 'error', text1: isRTL ? 'خطأ' : 'Error', text2: e?.data?.message || (isRTL ? 'فشل إعادة الفتح' : 'Failed to reopen'), position: 'bottom' });
                    }
                  }}
                  isActive={true}
                  activeColor={IDENTITY_BLUE}
                  isLoading={isUpdatingPricing}
                  style={{ height: 56, width: "100%" }}
                />
              </View>
            ) : (
              <View style={{ padding: 24 }}>
                <View style={{ alignItems: "center", marginBottom: 28 }}>
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        width: 72,
                        height: 72,
                        borderRadius: 24,
                        marginBottom: 16,
                        elevation: 4,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8
                      },
                    ]}
                  >
                    {(() => {
                      const customer = selectedShiftForAction.booking?.customer;
                      const customerImageId =
                        typeof customer?.image === "string"
                          ? customer.image
                          : customer?.image?.url ||
                          customer?.image?.id ||
                          customer?.imageUrl;

                      return customerImageId ? (
                        <ExpoImage
                          source={getImageSrc(customerImageId)}
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : (
                        <SolarUserBold size={36} color="#FFF" />
                      );
                    })()}
                  </View>
                  <Text
                    style={[
                      styles.sheetTitle,
                      { marginBottom: 2, fontSize: normalize.font(20) },
                    ]}
                  >
                    {selectedShiftForAction.booking?.customer?.name ||
                      selectedShiftForAction.booking?.externalCustomerName ||
                      (selectedShiftForAction.booking?.status === "external"
                        ? isRTL
                          ? "حجز خارجي"
                          : "External Booking"
                        : isRTL
                          ? "زبون"
                          : "Customer")}
                  </Text>
                  {(selectedShiftForAction.booking?.customer?.phone ||
                    selectedShiftForAction.booking?.externalCustomerPhone) && (
                      <Text
                        style={[
                          styles.customerPhone,
                          { marginBottom: 8, direction: "ltr" },
                        ]}
                      >
                        {selectedShiftForAction.booking?.customer?.phone ||
                          selectedShiftForAction.booking?.externalCustomerPhone}
                      </Text>
                    )}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <Text
                      style={{
                        color: "#64748B",
                        fontFamily: "Alexandria-SemiBold",
                        fontSize: normalize.font(14),
                        letterSpacing: 0.5
                      }}
                    >
                      {selectedShiftForAction.booking?.bookingCode || "#---"}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          backgroundColor:
                            selectedShiftForAction.booking?.status ===
                              "confirmed"
                              ? "#ECFDF5"
                              : selectedShiftForAction.booking?.status ===
                                "external"
                                ? "#FEF2F2"
                                : "#F1F5F9",
                          borderColor: "transparent",
                          borderRadius: 6
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            fontSize: normalize.font(11),
                            color:
                              selectedShiftForAction.booking?.status ===
                                "confirmed"
                                ? "#10B981"
                                : selectedShiftForAction.booking?.status ===
                                  "external"
                                  ? "#EF4444"
                                  : "#64748B"
                          },
                        ]}
                      >
                        {selectedShiftForAction.booking?.status ===
                          "confirmed"
                          ? isRTL
                            ? "حجز مؤكد"
                            : "Confirmed"
                          : selectedShiftForAction.booking?.status ===
                            "external"
                            ? isRTL
                              ? "حجز خارجي"
                              : "External"
                            : selectedShiftForAction.booking?.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: "#F1F5F9",
                    marginBottom: 24
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <SecondaryButton
                    label={
                      isRTL ? "عرض تفاصيل الحجز" : "View Details"
                    }
                    onPress={() => {
                      closeSheet();
                      openBookingDetails(
                        selectedShiftForAction.booking?.id ||
                        selectedShiftForAction.bookingId,
                      );
                    }}
                    isActive={true}
                    activeColor={IDENTITY_BLUE}
                    style={{ height: 50, flex: 1 }}
                  />

                  {(selectedShiftForAction.booking?.status === "confirmed" ||
                    selectedShiftForAction.booking?.status === "external" ||
                    selectedShiftForAction.booking?.status === "pending_payment" ||
                    selectedShiftForAction.booking?.status === "pending_approval") && (
                      <SecondaryButton
                        label={isRTL ? "إلغاء الحجز" : "Cancel"}
                        onPress={() => {
                          closeSheet();
                          handleOpenCancelSheet(
                            selectedShiftForAction.booking,
                          );
                        }}
                        isActive={true}
                        activeColor="#EF4444"
                        style={{ height: 50, flex: 1 }}
                      />
                    )}
                </View>
              </View>
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetContent: { paddingBottom: normalize.height(24) },
  successAnimationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    minHeight: 300
  },
  successLottie: {
    width: "100%",
    height: 400
  },
  successAnimationText: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-SemiBold",
    color: "#035DF9",
    marginTop: 16,
    textAlign: "center"
  },
  inputLabel: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-SemiBold",
    color: "#64748B",
    marginBottom: 8
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#035DF9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  sheetTitle: {
    fontSize: normalize.font(18),
    fontFamily: "Alexandria-SemiBold",
    marginBottom: 16
  },
  customerPhone: {
    fontSize: normalize.font(13),
    color: "#64748B",
    fontFamily: "Alexandria-Regular"
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center"
  },
  statusText: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-SemiBold",
    lineHeight: normalize.font(16)
  }
});
