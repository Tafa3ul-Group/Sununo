import { Stack } from "expo-router";
import React from "react";

export default function DashboardNonTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" options={{ title: 'الملف الشخصي' }} />
      <Stack.Screen name="edit-business" options={{ title: 'معلومات العمل' }} />
    </Stack>
  );
}
