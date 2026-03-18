import { RootState } from '@/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

/* 
 * CustomTabBar - New floating navigation design
 * Left: Map button (circle)
 * Right: Main tabs (capsule)
 */

interface TabProps {
  state: any;
  navigation: any;
}

export const CustomTabBar: React.FC<TabProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const isOwner = userType === 'owner';

  // Current active route name
  const currentRoute = state.routes[state.index].name;

  // Hade the tab bar if we are on screens that need full space
  const hiddenScreens = [
    '(dashboard)/add-chalet',
    '(dashboard)/edit-chalet',
    '(dashboard)/chalet-details'
  ];

  if (hiddenScreens.includes(currentRoute)) {
    return null;
  }

  const navigateTo = (routeName: string) => {
    navigation.navigate(routeName);
  };

  // Dynamic Navigation Configuration
  const activeBlue = '#035DF9';

  const leftAction = isOwner
    ? { icon: 'calendar-month', route: '(dashboard)/bookings' as const }
    : { icon: 'map', route: 'index' as const };

  const capsuleTabs = isOwner
    ? [
      { name: 'home', icon: 'view-grid', route: '(dashboard)/home' },
      { name: 'revenue', icon: 'wallet', route: '(dashboard)/revenue' },
      { name: 'profile', icon: 'account', route: 'profile' },
    ]
    : [
      { name: 'explore', icon: 'heart', route: 'explore' },
      { name: 'notifications', icon: 'bell', route: '(dashboard)/notifications' },
      { name: 'home', icon: 'home', route: 'index' },
      { name: 'profile', icon: 'account', route: 'profile' },
    ];

  const bgColor = activeBlue;
  const iconInactiveColor = 'rgba(255, 255, 255, 0.6)';

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
      {/* Left: Action Button (Bookings for Owner, Map for User) */}
      <TouchableOpacity
        style={[styles.circleButton, { backgroundColor: activeBlue }]}
        onPress={() => navigateTo(leftAction.route)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name={leftAction.icon as any} size={32} color="white" />
      </TouchableOpacity>

      {/* Right: Navigation Capsule */}
      <View style={styles.tabCapsule}>
        {capsuleTabs.map((tab) => {
          const isActive = currentRoute === tab.route;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigateTo(tab.route)}
              style={[
                styles.tabItem,
                isActive && styles.activeTabItem,
                { width: 50 }
              ]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isActive ? (tab.icon as any) : (`${tab.icon}-outline` as any)}
                size={26}
                color={isActive ? activeBlue : iconInactiveColor}
              />
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
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#035DF9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabCapsule: {
    flexDirection: 'row',
    backgroundColor: '#035DF9',
    borderRadius: 40,
    height: 64,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabItem: {
    backgroundColor: 'white',
  },
});
