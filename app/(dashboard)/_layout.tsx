import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RootState } from "@/store";
import { Stack } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function DashboardNonTabLayout() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { direction: isArabic ? "rtl" : "ltr", backgroundColor: "#FFFFFF" },
        header: (props) => (
          <DashboardHeader 
            title={props.options.title}
            showBackButton={props.route.name !== "home"} 
            onDeletePress={(props.options as any).onDeletePress}
          />
        ) }}
    >
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
        name="edit-chalet"
        options={{ title: isArabic ? "تعديل الشاليه" : "Edit Chalet" }}
      />
      <Stack.Screen
        name="edit-details/[id]"
        options={{ title: isArabic ? "تفاصيل الشاليه" : "Chalet Details" }}
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
