import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RootState } from "@/store";
import { Stack } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";
import { isRTL } from "@/i18n";

export default function DashboardNonTabLayout() {
  const { language } = useSelector((state: RootState) => state.auth);
  
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        contentStyle: { direction: isRTL ? "rtl" : "ltr", backgroundColor: "#FFFFFF" },
        header: (props) => (
          <DashboardHeader 
            title={props.options.title}
            showBackButton={props.route.name !== "home"} 
            onDeletePress={(props.options as any).onDeletePress}
          />
        ) }}
    >
      <Stack.Screen name="profile" options={{ title: "الملف الشخصي" }} />
      <Stack.Screen
        name="edit-business"
        options={{ title: "معلومات المصرف" }}
      />
      <Stack.Screen
        name="add-chalet"
        options={{ title: "إضافة شاليه" }}
      />
      <Stack.Screen
        name="edit-chalet"
        options={{ title: "تعديل الشاليه" }}
      />
      <Stack.Screen
        name="edit-details/[id]"
        options={{ title: "تفاصيل الشاليه" }}
      />
      <Stack.Screen
        name="chalet-details"
        options={{ title: isRTL ? 'إعدادات الشاليه' : 'Chalet Settings' }}
      />
      <Stack.Screen
        name="booking-details"
        options={{ title: isRTL ? 'تفاصيل الحجز' : 'Booking Details' }}
      />
    </Stack>
  );
}
