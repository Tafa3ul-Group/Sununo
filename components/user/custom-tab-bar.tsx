import { normalize, Shadows, Colors } from '@/constants/theme';
import { RootState } from '@/store';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

/**
 * CustomTabBar - Refined Active Indicator 40x40
 */
export const CustomTabBar: React.FC<any> = ({ state, navigation, descriptors }) => {
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const insets = useSafeAreaInsets();

  if (!userType) return null;

  const currentRouteIndex = state.index;
  const currentRouteName = state.routes[currentRouteIndex].name;
  const currentOptions = descriptors[state.routes[currentRouteIndex].key]?.options;

  const hiddenScreens = [
    '(dashboard)/add-chalet', '(dashboard)/edit-chalet', '(dashboard)/chalet-details',
    '(dashboard)/revenue', '(dashboard)/transactions', '(dashboard)/notifications',
    '(dashboard)/customers', 'profile', '(dashboard)/provider-profile', 'explore',
  ];

  if (currentOptions?.href === null || hiddenScreens.includes(currentRouteName)) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route: any) => {
    const options = descriptors[route.key]?.options;
    return options?.href !== null;
  });

  if (visibleRoutes.length === 0) return null;

  let isolatedTab: any;
  let pillTabs: any[];

  if (userType === 'owner') {
    isolatedTab = visibleRoutes.find((r: any) => r.name === '(dashboard)/bookings') || visibleRoutes[0];
    pillTabs = visibleRoutes.filter((r: any) => r.name !== isolatedTab.name).slice(0, 3);
  } else {
    isolatedTab = visibleRoutes.find((r: any) => r.name === 'index') || visibleRoutes[0];
    pillTabs = visibleRoutes.filter((r: any) => r.name !== isolatedTab.name).slice(0, 3);
  }

  const NAV_HEIGHT = normalize.height(50);
  const PILL_WIDTH = normalize.width(170);
  const SIDE_PADDING = normalize.width(23);
  const ACTIVE_INDICATOR_SIZE = normalize.height(40); // 40x40 EXACT

  const renderIcon = (route: any, isActive: boolean, isIsolated: boolean = false) => {
    const { options } = descriptors[route.key];
    if (options.tabBarIcon) {
      return options.tabBarIcon({
        focused: isActive,
        color: isIsolated ? 'white' : (isActive ? Colors.primary : 'white'),
        size: normalize.width(24),
      });
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.navWrapper, 
        { 
          bottom: Math.max(insets.bottom, 24),
          paddingHorizontal: SIDE_PADDING,
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }
      ]}>
        {/* Isolated Button (Map for Customer) */}
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => navigation.navigate(isolatedTab.name)}
          activeOpacity={0.8}
        >
          {renderIcon(isolatedTab, currentRouteName === isolatedTab.name, true)}
        </TouchableOpacity>

        {/* Tab Capsule */}
        <View style={styles.tabCapsule}>
          {pillTabs.map((route: any) => {
            const isActive = currentRouteName === route.name;
            return (
              <View key={route.key} style={styles.tabItemContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(route.name)}
                  style={[
                    styles.tabIconCircle,
                    isActive && styles.activeTabIndicator
                  ]}
                  activeOpacity={0.7}
                >
                  {renderIcon(route, isActive)}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 },
  navWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: { 
    width: normalize.height(52), 
    height: normalize.height(52), 
    borderRadius: normalize.height(26),
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tabCapsule: { 
    width: normalize.width(180), 
    height: normalize.height(52), 
    borderRadius: normalize.height(26),
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'space-around',
    flexDirection: 'row',
    paddingHorizontal: 8
  },
  tabItemContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  tabIconCircle: {
    width: normalize.height(40),
    height: normalize.height(40),
    borderRadius: normalize.height(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabIndicator: { 
    backgroundColor: 'white',
  },
});
