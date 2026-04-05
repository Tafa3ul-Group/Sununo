import { normalize } from '@/constants/theme';
import { RootState } from '@/store';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

/* 
 * CustomTabBar - Dynamic floating navigation design
 */

interface TabProps {
  state: any;
  navigation: any;
  descriptors: any;
}

export const CustomTabBar: React.FC<TabProps> = ({ state, navigation, descriptors }) => {
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isRTL = language === 'ar';
  const insets = useSafeAreaInsets();

  // Hide tab bar if no user type (logging out)
  if (!userType) return null;

  // Current active route index/name
  const activeIndex = state.index;
  const currentRouteName = state.routes[activeIndex].name;
  const currentOptions = descriptors[state.routes[activeIndex].key]?.options;

  // List of screens that should hide the tab bar
  const hiddenScreens = [
    '(dashboard)/add-chalet',
    '(dashboard)/edit-chalet',
    '(dashboard)/chalet-details',
    '(dashboard)/revenue',
    '(dashboard)/transactions',
    '(dashboard)/notifications',
    '(dashboard)/customers',
    'profile',
    '(dashboard)/provider-profile',
  ];

  // Hide tab bar if screen is a sub-screen (explicitly href: null) OR in blacklist
  if (currentOptions?.href === null || hiddenScreens.includes(currentRouteName)) {
    return null;
  }

  // Filter routes that should be visible (href !== null)
  const visibleRoutes = state.routes.filter((route: any) => {
    const options = descriptors[route.key]?.options;
    // In expo-router, href: null explicitly hides the tab. 
    // If href is undefined, it's visible by default.
    return options?.href !== null;
  });

  if (visibleRoutes.length === 0) return null;

  // Separate left button vs capsule tabs
  let leftTab: any;
  let capsuleTabs: any[];

  if (userType === 'owner') {
    // For owner, explicitly make Bookings the separate left button
    leftTab = visibleRoutes.find((r: any) => r.name === '(dashboard)/bookings');
    // If we can't find it for some reason, fallback to first visible
    if (!leftTab) leftTab = visibleRoutes[0];

    // Other tabs go in capsule (limited to 4 max to match design with new tab)
    capsuleTabs = visibleRoutes
      .filter((r: any) => r.name !== leftTab.name && (descriptors[r.key]?.options?.href !== null))
      .slice(0, 4);
  } else {
    // For regular users, fallback to first visible as main button
    leftTab = visibleRoutes[0];
    capsuleTabs = visibleRoutes.slice(1);
  }

  const navigateTo = (routeName: string) => {
    navigation.navigate(routeName);
  };

  const NAV_HEIGHT = normalize.height(54);

  const renderIcon = (route: any, isActive: boolean) => {
    const { options } = descriptors[route.key];

    if (options.tabBarIcon) {
      return options.tabBarIcon({
        focused: isActive,
        color: isActive ? '#035DF9' : 'rgba(255, 255, 255, 0.7)',
        size: normalize.width(22),
      });
    }

    // Fallback (should not be reached if all routes have icons)
    return null;
  };

  const isLeftTabActive = currentRouteName === leftTab.name;

  return (
    <View style={[
      styles.container, 
      { 
        bottom: insets.bottom + 16, 
        flexDirection: 'row',
        paddingHorizontal: 16
      }
    ]}>
      {/* Left Button */}
      <TouchableOpacity
        style={[
          styles.roundButton,
          { width: NAV_HEIGHT, height: NAV_HEIGHT, borderRadius: NAV_HEIGHT / 2 },
          isLeftTabActive && styles.activeRoundButton
        ]}
        onPress={() => navigateTo(leftTab.name)}
        activeOpacity={0.8}
      >
        {renderIcon(leftTab, isLeftTabActive)}
      </TouchableOpacity>

      {/* Main Navigation Capsule */}
      <View style={[styles.tabCapsule, { height: NAV_HEIGHT, borderRadius: NAV_HEIGHT / 2 }]}>
        {capsuleTabs.map((route: any, index: number) => {
          const isActive = currentRouteName === route.name;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigateTo(route.name)}
              style={[
                styles.tabItem,
                { width: NAV_HEIGHT - 8, height: NAV_HEIGHT - 8, borderRadius: (NAV_HEIGHT - 8) / 2 },
                isActive && styles.activeTabItem,
                index > 0 && { marginLeft: 4 }
              ]}
              activeOpacity={0.7}
            >
              {renderIcon(route, isActive)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  roundButton: {
    backgroundColor: '#035DF9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeRoundButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#035DF9',
  },
  tabCapsule: {
    flexDirection: 'row',
    backgroundColor: '#035DF9',
    paddingHorizontal: 4,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    backgroundColor: 'white',
  },
});
