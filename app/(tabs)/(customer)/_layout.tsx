import { Tabs, Redirect } from "expo-router";
import React, { useRef } from "react";
import { CustomTabBar } from "@/components/user/custom-tab-bar";
import { SolarHomeSmileBoldDuotone, SolarMapBoldDuotone, SolarFiltersBoldDuotone, SolarUserBold } from "@/components/icons/solar-icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { SearchFilterSheet } from "@/components/user/search-filter-sheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { TouchableOpacity, Image, View } from "react-native";
import { getImageSrc } from "@/hooks/useImageSrc";

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { userType, user } = useSelector((state: RootState) => state.auth);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  if (userType === 'owner') {
    return <Redirect href="/(tabs)/(dashboard)/home" />;
  }

  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => (
              <SolarHomeSmileBoldDuotone size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="filters"
          options={{
            tabBarIcon: ({ color, size }) => (
              <SolarFiltersBoldDuotone size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              filterSheetRef.current?.present();
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size, focused }) => {
              const avatarUrl = user?.imageUrl || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
              return (
                <View style={{ 
                  width: size + 4, 
                  height: size + 4, 
                  borderRadius: (size + 4) / 2, 
                  overflow: 'hidden', 
                  borderWidth: focused ? 2 : 1, 
                  borderColor: focused ? color : '#E5E7EB',
                  backgroundColor: '#F3F4F6'
                }}>
                  <Image 
                    source={getImageSrc(user?.imageUrl || avatarUrl)} 
                    style={{ width: '100%', height: '100%' }} 
                  />
                </View>
              );
            },
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ color, size }) => (
              <SolarMapBoldDuotone size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <SearchFilterSheet ref={filterSheetRef} />
    </>
  );
}
