import {
    SolarFiltersBoldDuotone,
    SolarHomeSmileBoldDuotone,
    SolarMapBoldDuotone,
    SolarUserBold } from "@/components/icons/solar-icons";
import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { SearchFilterSheet } from "@/components/user/search-filter-sheet";
import { getImageSrc } from "@/hooks/useImageSrc";
import { RootState } from "@/store";
import { setFilters } from "@/store/filterSlice";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Redirect, Tabs, useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { userType, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  const filterSheetRef = useRef<BottomSheetModal>(null);

  if (userType === "owner") {
    return <Redirect href="/(tabs)/(dashboard)/home" />;
  }

  const handleFilterApply = (filters: any) => {
    dispatch(setFilters({
      cityId: filters.cityId || null,
      cityName: filters.cityName || null,
      search: filters.search || null,
      checkIn: filters.checkIn || null,
      checkOut: filters.checkOut || null,
      period: filters.period || null,
      maxGuests: filters.maxGuests || null,
      adults: filters.adults ?? 2,
      children: filters.children ?? 0,
      isActive: true }));
    router.push("/(customer)/filter-results");
  };

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <SolarHomeSmileBoldDuotone size={size} color={color} />
            ) }}
        />
        <Tabs.Screen
          name="filters"
          options={{
            tabBarIcon: ({ color, size }) => (
              <SolarFiltersBoldDuotone size={size} color={color} />
            ) }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              filterSheetRef.current?.present();
            } }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ color, size }) => (
              <SolarMapBoldDuotone size={size} color={color} />
            ) }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size, focused }) => {
              if (userType === "guest") {
                return <SolarUserBold size={size} color={color} />;
              }
              const avatarUrl =
                user?.imageUrl ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
              return (
                <View
                  style={{
                    width: size + 4,
                    height: size + 4,
                    borderRadius: (size + 4) / 2,
                    overflow: "hidden",
                    borderWidth: focused ? 2 : 1,
                    borderColor: focused ? color : "#E5E7EB",
                    backgroundColor: "#F3F4F6" }}
                >
                  <Image
                    source={getImageSrc(user?.imageUrl || avatarUrl)}
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>
              );
            } }}
          listeners={{
            tabPress: (e) => {
              if (userType === "guest") {
                e.preventDefault();
                router.push("/(auth)/login");
              }
            } }}
        />
        <Tabs.Screen name="bookings" options={{ href: null }} />
        <Tabs.Screen name="booking-success" options={{ href: null }} />
      </Tabs>
      <SearchFilterSheet ref={filterSheetRef} onApply={handleFilterApply} />
    </>
  );
}
