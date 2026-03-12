import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, normalize } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);
  
  const isOwner = userType === 'owner';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: normalize.height(1),
          borderTopColor: Colors.border,
          backgroundColor: Colors.background,
          height: normalize.height(65),
          paddingBottom: normalize.height(10),
          paddingTop: normalize.height(5),
        },
        tabBarLabelStyle: {
          fontFamily: 'System', 
          fontWeight: '600',
          fontSize: normalize.font(10),
        }
      }}>
      
      {/* Customer Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          href: !isOwner ? '/(tabs)' : null, // Hide for owners
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={normalize.width(28)} name="home-variant" color={color} />,
        }}
      />
      
      {/* Owner Dashboard / My Chalets */}
      <Tabs.Screen
        name="(dashboard)/my-chalets"
        options={{
          title: t('tabs.myChalets'),
          href: isOwner ? '/(tabs)/(dashboard)/my-chalets' : null, // Hide for customers
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={normalize.width(28)} name="view-grid" color={color} />,
        }}
      />

      {/* Owner Bookings Screen */}
      <Tabs.Screen
        name="(dashboard)/bookings"
        options={{
          title: t('tabs.bookings'),
          href: isOwner ? '/(tabs)/(dashboard)/bookings' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={normalize.width(28)} name="calendar-month-outline" color={color} />,
        }}
      />

      {/* Owner Customers Screen */}
      <Tabs.Screen
        name="(dashboard)/customers"
        options={{
          title: t('tabs.customers'),
          href: isOwner ? '/(tabs)/(dashboard)/customers' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={normalize.width(28)} name="account-group-outline" color={color} />,
        }}
      />

      {/* Owner Revenue Screen */}
      <Tabs.Screen
        name="(dashboard)/revenue"
        options={{
          title: t('tabs.revenue'),
          href: isOwner ? '/(tabs)/(dashboard)/revenue' : null,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={normalize.width(28)} name="wallet-outline" color={color} />,
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen
        name="(dashboard)/add-chalet"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Always hide the default explore tab
        }}
      />
      
      {/* Shared Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={normalize.width(28)} name="account-circle-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
