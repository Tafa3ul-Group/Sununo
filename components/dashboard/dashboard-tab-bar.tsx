import {
  SolarHome2Bold
} from '@/components/icons/solar-icons';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import { useGetOwnerChaletsQuery } from '@/store/api/apiSlice';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

/**
 * DashboardTabBar - Standardized with CustomTabBar design
 */
export const DashboardTabBar: React.FC<any> = ({ state, navigation, descriptors }) => {
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';
  const insets = useSafeAreaInsets();

  const [showPopover, setShowPopover] = useState(false);

  // Animation values
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(5);

  // Fetch chalets
  const { data: chaletsResponse } = useGetOwnerChaletsQuery({}, { skip: userType !== 'owner' });
  const chalets = chaletsResponse?.data || chaletsResponse || [];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    };
  });

  const togglePopover = () => {
    if (showPopover) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withTiming(0.95, { duration: 100 });
      opacity.value = withTiming(0, { duration: 100 }, () => {
        runOnJS(setShowPopover)(false);
      });
      translateY.value = withTiming(5, { duration: 100 });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowPopover(true);
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withTiming(0, { duration: 150 });
    }
  };

  const closePopover = () => {
    if (showPopover) togglePopover();
  };

  if (userType !== 'owner') return null;

  const currentRouteIndex = state.index;
  const currentOptions = descriptors[state.routes[currentRouteIndex].key]?.options;

  if (currentOptions?.href === null) return null;

  const currentRouteName = state.routes[currentRouteIndex].name;
  const visibleRouteNames = ['home', 'bookings', 'revenue'];
  const visibleRoutes = state.routes.filter((route: any) => visibleRouteNames.includes(route.name));

  if (visibleRoutes.length === 0) return null;

  const renderIcon = (route: any, isActive: boolean) => {
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
  const pillTabs = visibleRoutes.filter((r: any) => r.name !== isolatedTabName);

  return (
    <View style={styles.container}>
      <View style={[
        styles.navWrapper,
        {
          bottom: Math.max(insets.bottom, 24),
          paddingHorizontal: normalize.width(16),
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }
      ]}>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={togglePopover}
          activeOpacity={0.8}
        >
          <View style={styles.tabIconCircle}>
            <SolarHome2Bold size={normalize.width(28)} color="white" />
          </View>
        </TouchableOpacity>

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

      <Modal
        visible={showPopover}
        transparent={true}
        animationType="none"
        onRequestClose={closePopover}
      >
        <TouchableWithoutFeedback onPress={closePopover}>
          <View style={styles.popoverOverlay}>
            <Animated.View
              style={[
                styles.popoverContainer,
                animatedStyle,
                {
                  bottom: Math.max(insets.bottom, 24) + normalize.height(58),
                  [isRTL ? 'right' : 'left']: normalize.width(16)
                }
              ]}
            >
              <View style={styles.popoverContent}>
                <View style={[styles.popoverHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <SolarHome2Bold size={20} color={Colors.primary} />
                  <Text style={styles.popoverTitle}>{t('tabs.myChalets', 'شاليهاتي')}</Text>
                </View>

                <ScrollView style={styles.popoverList}>
                  {chalets.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.chaletItem}
                      onPress={() => {
                        closePopover();
                        navigation.navigate('chalet-details', { id: item.id });
                      }}
                    >
                      <Image source={getImageSrc(item.images?.[0]?.url)} style={styles.chaletThumb} />
                      <View style={[styles.chaletItemInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.chaletItemName} numberOfLines={1}>
                          {isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.addNewChaletBtn}
                  onPress={() => { closePopover(); navigation.navigate('add-chalet'); }}
                >
                  <Text style={styles.addNewChaletText}>{t('dashboard.addChalet', 'إضافة شاليه جديد')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1000 },
  navWrapper: { width: '100%', alignItems: 'center', justifyContent: 'space-between' },
  roundButton: {
    width: normalize.height(52), height: normalize.height(52), borderRadius: 26,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center'
  },
  tabCapsule: {
    width: normalize.width(110), height: normalize.height(52), borderRadius: 26,
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingHorizontal: 8
  },
  tabItemContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconCircle: {
    width: normalize.height(40), height: normalize.height(40), borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  activeTabIndicator: { backgroundColor: 'white' },
  popoverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  popoverContainer: { position: 'absolute', width: normalize.width(240), zIndex: 2000 },
  popoverContent: {
    backgroundColor: 'white', borderRadius: 24, shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15,
    shadowRadius: 16, elevation: 10, overflow: 'hidden', paddingBottom: 8,
  },
  popoverHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center', gap: 8 },
  popoverTitle: { fontSize: 14, fontWeight: '800', color: Colors.text.primary, flex: 1 },
  popoverList: { maxHeight: 260 },
  chaletItem: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 12 },
  chaletThumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F5F7' },
  chaletItemInfo: { flex: 1 },
  chaletItemName: { fontSize: 13, fontWeight: '700', color: '#333' },
  addNewChaletBtn: {
    padding: 12, marginHorizontal: 12, marginTop: 4, borderRadius: 12,
    backgroundColor: '#F8F9FB', alignItems: 'center',
  },
  addNewChaletText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});
