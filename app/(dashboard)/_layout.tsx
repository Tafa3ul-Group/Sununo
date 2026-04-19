import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Stack } from "expo-router";
import React from "react";

export default function DashboardNonTabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: (props) => (
          <DashboardHeader 
            title={props.options.title}
            showBackButton={props.route.name !== "home"} 
            onDeletePress={(props.options as any).onDeletePress}
          />
        ),
      }}
    >
      <Stack.Screen name="profile" options={{ title: "الملف الشخصي" }} />
      <Stack.Screen
        name="edit-business"
        options={{ title: "معلومات العمل" }}
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
        name="chalet-details"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="booking-details"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
