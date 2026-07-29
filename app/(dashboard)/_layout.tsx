import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useDirection } from "@/i18n";
import { RootState } from "@/store";
import { Stack } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function DashboardNonTabLayout() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { direction, isRTL } = useDirection();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { direction, backgroundColor: "#FFFFFF" },
        animation: isRTL ? "slide_from_left" : "slide_from_right",
        fullScreenGestureEnabled: true,
        header: (props) => (
          <DashboardHeader 
            title={props.options.title}
            showBackButton={props.route.name !== "home"} 
            onDeletePress={(props.options as any).onDeletePress}
          />
        ) }}
    >
      <Stack.Screen
        name="onboarding"
        options={{ title: isArabic ? "إعداد الحساب" : "Account Setup" }}
      />
      <Stack.Screen
        name="edit-business"
        options={{ title: isArabic ? "معلومات المصرف" : "Bank Details" }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ title: isArabic ? "المعلومات الشخصية" : "Personal Information" }}
      />
      <Stack.Screen
        name="add-chalet"
        options={{ title: isArabic ? "إضافة شاليه" : "Add Chalet" }}
      />
      <Stack.Screen
        name="chalet-details"
        options={{ title: isArabic ? 'إعدادات الشاليه' : 'Chalet Settings' }}
      />
      <Stack.Screen
        name="shifts"
        options={{ title: isArabic ? 'إدارة الفترات' : 'Manage Shifts' }}
      />
      <Stack.Screen
        name="booking-details"
        options={{ title: isArabic ? 'تفاصيل الحجز' : 'Booking Details' }}
      />
    </Stack>
  );
}
