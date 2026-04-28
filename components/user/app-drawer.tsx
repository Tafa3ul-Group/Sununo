import React, { forwardRef, useImperativeHandle, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Alert,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { RootState } from "@/store";
import { logout } from "@/store/authSlice";
import { useLogoutUserMutation } from "@/store/api/customerApiSlice";
import { Colors, normalize, Shadows } from "@/constants/theme";
import { ThemedText } from "../themed-text";
import { 
  SolarUserBold, 
  SolarLogoutBold, 
  SolarSettingsBold, 
  SolarBellBingBoldDuotone,
  SolarHeartBold,
  SolarCalendarBold,
  SolarCloseBold
} from "@/components/icons/solar-icons";
import { getImageSrc } from "@/hooks/useImageSrc";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

export interface AppDrawerRef {
  open: () => void;
  close: () => void;
}

export const AppDrawer = forwardRef<AppDrawerRef>((props, ref) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [logoutApi] = useLogoutUserMutation();

  const isOpen = useSharedValue(0); // 0 = closed, 1 = open

  useImperativeHandle(ref, () => ({
    open: () => {
      isOpen.value = withSpring(1, { damping: 20, stiffness: 100 });
    },
    close: () => {
      isOpen.value = withTiming(0, { duration: 250 });
    },
  }));

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        { 
          text: t('profile.exit'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logoutApi(undefined).unwrap();
            } catch (e) {}
            dispatch(logout());
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const menuItems = [
    { id: 'profile', label: t('headers.profile'), icon: <SolarUserBold size={22} />, route: '/(tabs)/(customer)/profile' },
    { id: 'bookings', label: t('headers.bookings'), icon: <SolarCalendarBold size={22} />, route: '/(tabs)/(customer)/bookings' },
    { id: 'favorites', label: t('headers.favorites'), icon: <SolarHeartBold size={22} />, route: '/favorites' },
    { id: 'notifications', label: t('headers.notifications'), icon: <SolarBellBingBoldDuotone size={22} />, route: '/(customer)/notifications' },
    { id: 'settings', label: t('profile.language'), icon: <SolarSettingsBold size={22} />, route: '/(tabs)/(customer)/profile' },
  ];

  const drawerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      isOpen.value,
      [0, 1],
      [isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH, 0]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(isOpen.value, [0, 1], [0, 1]);
    return {
      opacity,
      pointerEvents: isOpen.value > 0.5 ? "auto" : "none",
    };
  });

  const close = () => {
    isOpen.value = withTiming(0, { duration: 250 });
  };

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={close} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[
        styles.drawer, 
        drawerStyle, 
        isRTL ? { right: 0 } : { left: 0 },
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
      ]}>
        {/* Header with Close Button */}
        <View style={[styles.drawerHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
           <TouchableOpacity onPress={close} style={styles.closeBtn}>
              <SolarCloseBold size={24} color="#64748B" />
           </TouchableOpacity>
           <View style={styles.logoContainer}>
              <Image 
                source={isRTL ? require("@/assets/arlogo.svg") : require("@/assets/logo.svg")} 
                style={styles.logo}
                resizeMode="contain"
              />
           </View>
        </View>

        {/* User Info */}
        <TouchableOpacity 
          style={[styles.userSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => { close(); router.push('/(tabs)/(customer)/profile'); }}
        >
          <Image source={getImageSrc(user?.imageUrl)} style={styles.avatar} />
          <View style={[styles.userInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <ThemedText style={styles.userName}>{user?.name || t('common.user')}</ThemedText>
            <ThemedText style={styles.userPhone}>{user?.phone || ''}</ThemedText>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => { close(); router.push(item.route as any); }}
            >
              <View style={[styles.iconWrapper, { backgroundColor: Colors.surface }]}>
                {React.cloneElement(item.icon as React.ReactElement, { color: Colors.primary })}
              </View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer with Logout */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={handleLogout}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
              <SolarLogoutBold size={22} color="#EF4444" />
            </View>
            <ThemedText style={styles.logoutText}>{t('profile.logout')}</ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  drawer: {
    position: "absolute",
    top: 0,
    width: DRAWER_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
    ...Shadows.large,
    paddingHorizontal: 20,
  },
  drawerHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 40,
  },
  userSection: {
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Alexandria-Black",
    color: '#1E293B',
  },
  userPhone: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: "Alexandria-Medium",
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 15,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: "Alexandria-Bold",
    color: '#334155',
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    alignItems: 'center',
    gap: 15,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Alexandria-Black",
    color: '#EF4444',
  },
});
