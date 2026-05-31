import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function CustomerNonTabLayout() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="booking/complete" 
        options={{ title: isArabic ? 'اكتمال الحجز' : 'Booking Completion' }} 
      />
      <Stack.Screen 
        name="chalet-details/[id]" 
        options={{ title: isArabic ? 'تفاصيل الشاليه' : 'Chalet Details' }} 
      />
    </Stack>
  );
}
