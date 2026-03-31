import { normalize } from '@/constants/theme';
import { RootState } from '@/store';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getImageSrc } from '@/hooks/useImageSrc';
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

    // Other 3 tabs go in capsule (limited to 3 max to match design)
    capsuleTabs = visibleRoutes
      .filter((r: any) => r.name !== leftTab.name && (descriptors[r.key]?.options?.href !== null))
      .slice(0, 3);
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
    const isProfile = route.name === 'profile' || route.name === '(dashboard)/provider-profile';

    if (isProfile) {
      // Return the image wrapped in a white circle as per design
      return (
        <View style={[
          styles.profileBtnWrapper, 
          isActive && { borderColor: 'white', borderWidth: 2 }
        ]}>
          <Image
            source={getImageSrc("https://i.pravatar.cc/100")}
            style={styles.profileBtnImage}
          />
        </View>
      );
    }

    if (options.tabBarIcon) {
      return options.tabBarIcon({
        focused: isActive,
        color: isActive ? '#035DF9' : 'rgba(255, 255, 255, 1)',
        size: normalize.width(22),
      });
    }

    return null;
  };

  const isLeftTabActive = currentRouteName === leftTab.name;

  return (
    <View style={styles.container}>
      <View style={[
        styles.navWrapper, 
        { 
          bottom: Math.max(insets.bottom, 16),
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }
      ]}>
        {/* Separate Left Button (Explore/Map) */}
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

        {/* Combined Navigation Capsule (Right Side) */}
        <View style={[styles.tabCapsule, { height: NAV_HEIGHT, borderRadius: NAV_HEIGHT / 2 }]}>
          {capsuleTabs.map((route: any, index: number) => {
            const isActive = currentRouteName === route.name;
            const isProfile = route.name === 'profile' || route.name === '(dashboard)/provider-profile';

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => navigateTo(route.name)}
                style={[
                  styles.tabItem,
                  { width: NAV_HEIGHT - 6, height: NAV_HEIGHT - 6, borderRadius: (NAV_HEIGHT - 6) / 2 },
                  isActive && !isProfile && styles.activeTabItem,
                  index > 0 && { marginLeft: 12 }
                ]}
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
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  navWrapper: {
    marginHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roundButton: {
    backgroundColor: '#035DF9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#035DF9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  activeRoundButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  tabCapsule: {
    flexDirection: 'row',
    backgroundColor: '#035DF9',
    paddingHorizontal: 6,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#035DF9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    backgroundColor: 'white', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileBtnWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'white',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtnImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
});
