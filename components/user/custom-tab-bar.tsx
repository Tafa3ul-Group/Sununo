import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  
  // Current active route name
  const currentRoute = state.routes[state.index].name;

  const navigateTo = (routeName: string) => {
    navigation.navigate(routeName);
  };

  // Defining the 3 tabs for the capsule
  const tabs = [
    { name: 'explore', icon: 'heart', route: 'explore' },
    { name: 'notifications', icon: 'notifications', route: '(dashboard)/notifications' },
    { name: 'home', icon: 'home', route: 'index' },
  ];

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
      {/* Left: Separate Map Button */}
      <TouchableOpacity 
        style={styles.mapButton}
        onPress={() => navigateTo('(dashboard)/home')}
        activeOpacity={0.8}
      >
        <Ionicons name="map" size={28} color="white" />
      </TouchableOpacity>

      {/* Right: Main Navigation Capsule */}
      <View style={styles.tabCapsule}>
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.route;
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigateTo(tab.route)}
              style={[
                styles.tabItem,
                isActive && styles.activeTabItem
              ]}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isActive ? (tab.icon as any) : (`${tab.icon}-outline` as any)} 
                size={26} 
                color={isActive ? '#035DF9' : 'rgba(255, 255, 255, 0.7)'} 
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
  mapButton: {
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
