import { Stack } from "expo-router";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

/**
 * Root Layout for (tabs) - Separated Dashboard and Customer layouts.
 * Dashboard layout: app/(tabs)/(dashboard)/_layout.tsx
 * Customer layout: app/(tabs)/(customer)/_layout.tsx
 */
export default function TabLayout() {
  const { userType } = useSelector((state: RootState) => state.auth);

  return (
    <Stack screenOptions={{ headerShown: false }}>
       <Stack.Screen name="(customer)" options={{ headerShown: false }} />
       <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
    </Stack>
  );
}
