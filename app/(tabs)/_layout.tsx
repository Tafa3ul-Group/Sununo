import { Tabs } from 'expo-router';
import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);
  
  const isOwner = userType === 'owner';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2B66FF', // Using theme's primary color
        tabBarInactiveTintColor: '#717171',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: normalize.font(10),
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 0 : normalize.height(8),
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: Platform.OS === 'ios' ? normalize.height(88) : normalize.height(64),
          borderTopWidth: 1,
          borderTopColor: '#EBEBEB',
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          href: !isOwner ? '/(tabs)' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              size={normalize.width(24)} 
              name={focused ? "view-grid" : "view-grid-outline"} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="(dashboard)/my-chalets"
        options={{
          title: t('tabs.myChalets'),
          href: isOwner ? '/(tabs)/(dashboard)/my-chalets' : null,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              size={normalize.width(24)} 
              name={focused ? "view-grid" : "view-grid-outline"} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/bookings"
        options={{
          title: t('tabs.bookings'),
          href: isOwner ? '/(tabs)/(dashboard)/bookings' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={normalize.width(24)} 
              name={focused ? "calendar" : "calendar-outline"} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/customers"
        options={{
          title: t('tabs.customers'),
          href: isOwner ? '/(tabs)/(dashboard)/customers' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={normalize.width(24)} 
              name={focused ? "people" : "people-outline"} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/revenue"
        options={{
          title: t('tabs.revenue'),
          href: isOwner ? '/(tabs)/(dashboard)/revenue' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={normalize.width(24)} 
              name={focused ? "wallet" : "wallet-outline"} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="(dashboard)/add-chalet"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.profileIconContainer, 
              focused && styles.focusedProfile
            ]}>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/100' }} 
                style={styles.profileImage} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  profileIconContainer: {
    width: normalize.width(24),
    height: normalize.width(24),
    borderRadius: normalize.radius(12),
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
  },
  focusedProfile: {
    borderColor: '#2B66FF',
    borderWidth: 1.5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
});





