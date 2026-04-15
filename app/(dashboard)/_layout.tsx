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
          />
        ),
      }}
    >
      <Stack.Screen name="profile" options={{ title: "الملف الشخصي" }} />
      <Stack.Screen
        name="edit-business"
        options={{ title: "معلومات العمل" }}
      />
    </Stack>
  );
}
