import { normalize, Colors } from '@/constants/theme';
import { RootState } from '@/store';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export const DashboardTabBar: React.FC<any> = ({ state, navigation, descriptors }) => {
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const insets = useSafeAreaInsets();

  if (userType !== 'owner') return null;

  const currentRouteIndex = state.index;
  const currentOptions = descriptors[state.routes[currentRouteIndex].key]?.options;

  if (currentOptions?.href === null) {
    return null;
  }

  const currentRouteName = state.routes[currentRouteIndex].name;
  
  // Routes to show in the tab bar
  const visibleRouteNames = ['home', 'bookings', 'revenue'];
  
  const visibleRoutes = state.routes.filter((route: any) => 
    visibleRouteNames.includes(route.name)
  );

  const NAV_HEIGHT = normalize.height(50);
  const PILL_WIDTH = normalize.width(170);
  const SIDE_PADDING = normalize.width(23);
  const ACTIVE_INDICATOR_SIZE = normalize.height(40);

  const renderIcon = (route: any, isActive: boolean) => {
    const { options } = descriptors[route.key];
    if (options.tabBarIcon) {
      return options.tabBarIcon({
        focused: isActive,
        color: isActive ? Colors.primary : 'white',
        size: normalize.width(22),
      });
    }
    return null;
  };

  const isolatedTabName = 'bookings';
  const isolatedTab = visibleRoutes.find((r: any) => r.name === isolatedTabName) || visibleRoutes[0];
  const pillTabs = visibleRoutes.filter((r: any) => r.name !== isolatedTabName);

  return (
    <View style={styles.container}>
      <View style={[
        styles.navWrapper, 
        { 
          bottom: Math.max(insets.bottom, 20),
          paddingHorizontal: SIDE_PADDING,
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }
      ]}>
        <TouchableOpacity
          style={[styles.roundButton, { width: NAV_HEIGHT, height: NAV_HEIGHT, borderRadius: NAV_HEIGHT / 2 }]}
          onPress={() => navigation.navigate(isolatedTab.name)}
          activeOpacity={0.8}
        >
          {renderIcon(isolatedTab, currentRouteName === isolatedTab.name)}
        </TouchableOpacity>

        <View style={[styles.tabCapsule, { width: PILL_WIDTH, height: NAV_HEIGHT, borderRadius: NAV_HEIGHT / 2, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {pillTabs.map((route: any) => {
            const isActive = currentRouteName === route.name;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                style={[styles.tabItem, isActive && styles.activeIndicator, isActive && { width: ACTIVE_INDICATOR_SIZE, height: ACTIVE_INDICATOR_SIZE, borderRadius: ACTIVE_INDICATOR_SIZE / 2 }]}
                activeOpacity={0.7}
              >
                {renderIcon(route, isActive)}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 },
  navWrapper: { width: '100%', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  tabCapsule: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'space-around' },
  tabItem: { justifyContent: 'center', alignItems: 'center', flex: 1, height: '100%' },
  activeIndicator: { backgroundColor: 'white' },
});
