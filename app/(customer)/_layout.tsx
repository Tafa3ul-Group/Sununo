import { Stack } from "expo-router";
import React from "react";

export default function CustomerNonTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="booking/complete" options={{ title: 'اكتمال الحجز' }} />
      <Stack.Screen name="chalet-details/[id]" options={{ title: 'تفاصيل الشاليه' }} />
    </Stack>
  );
}
