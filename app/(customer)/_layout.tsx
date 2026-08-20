import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDirection } from "@/i18n";

export default function CustomerNonTabLayout() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { direction, isRTL } = useDirection();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="booking/complete" 
        options={{ title: isArabic ? 'اكتمال الحجز' : 'Booking Completion' }} 
      />
      <Stack.Screen
        name="chalet-details/[id]"
        options={{ title: isArabic ? 'تفاصيل الشاليه' : 'Chalet Details' }}
      />
      <Stack.Screen
        name="chalet-map/[id]"
        options={{ title: isArabic ? 'موقع الشاليه' : 'Chalet Location' }}
      />
      <Stack.Screen
        name="report-problem"
        options={{ title: isArabic ? 'تبليغ عن مشكلة' : 'Report a Problem' }}
      />
      <Stack.Screen
        name="my-reports"
        options={{ title: isArabic ? 'سجل البلاغات' : 'My Reports' }}
      />
    </Stack>
  );
}
