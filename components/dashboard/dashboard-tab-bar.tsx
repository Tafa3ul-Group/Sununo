import { normalize, Colors } from '@/constants/theme';
import { RootState } from '@/store';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

/**
 * DashboardTabBar - Standardized with CustomTabBar design
 */
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

  if (visibleRoutes.length === 0) return null;

  const NAV_HEIGHT = normalize.height(52);
  const PILL_WIDTH = normalize.width(170);
  const SIDE_PADDING = normalize.width(16);

  const renderIcon = (route: any, isActive: boolean, isIsolated: boolean = false) => {
    const { options } = descriptors[route.key];
    if (options.tabBarIcon) {
      return options.tabBarIcon({
        focused: isActive,
        color: isActive ? Colors.primary : 'white',
        size: normalize.width(24),
      });
    }
    return null;
  };

  const isolatedTabName = 'bookings';
  const isolatedTab = visibleRoutes.find((r: any) => r.name === isolatedTabName) || visibleRoutes[0];
  const pillTabs = visibleRoutes.filter((r: any) => r.name !== isolatedTabName);
  const isIsolatedActive = currentRouteName === isolatedTab.name;

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
        {/* Isolated Button */}
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => navigation.navigate(isolatedTab.name)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.tabIconCircle,
            isIsolatedActive && styles.activeTabIndicator
          ]}>
            {renderIcon(isolatedTab, isIsolatedActive, true)}
          </View>
        </TouchableOpacity>

        {/* Tab Capsule */}
        <View style={[
          styles.tabCapsule, 
          { flexDirection: isRTL ? 'row-reverse' : 'row' }
        ]}>
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
    width: normalize.width(110), // Reduced for a more compact and balanced look with 2 icons
    height: normalize.height(52), 
    borderRadius: normalize.height(26),
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
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
