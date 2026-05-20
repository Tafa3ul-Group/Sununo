import { CircleBackButton } from "@/components/ui/circle-back-button";
import { SolarMagnifierBold, SolarTrashBinBold, SolarUserBold } from "@/components/icons/solar-icons";
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, Text, I18nManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { isRTL } from "@/i18n";
import { Image } from "expo-image";

interface DashboardHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  showLogo?: boolean;
  onProfilePress?: () => void;
  onSearchPress?: () => void;
  onDeletePress?: () => void;
  customRightComponent?: React.ReactNode;
  marginBottom?: number;
}

export function DashboardHeader({
  title,
  showBackButton,
  showSearch = true,
  showLogo = false,
  onProfilePress,
  onSearchPress,
  onDeletePress,
  customRightComponent,
  marginBottom = 0
}: DashboardHeaderProps) {
  const router = useRouter();
  const [logoLang, setLogoLang] = useState<'ar' | 'en'>(isRTL ? 'ar' : 'en');
  const flexRow = isRTL ? (I18nManager.isRTL ? 'row' : 'row-reverse') : (I18nManager.isRTL ? 'row-reverse' : 'row');

  const toggleLogo = () => {
    setLogoLang(prev => prev === 'ar' ? 'en' : 'ar');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.flatHeader, { marginBottom }]}>
      <StatusBar style="dark" />
      <View style={[styles.flatHeaderContent, { flexDirection: flexRow }]}>
        {/* Left Side: Back button, Logo, or placeholder */}
        {showBackButton ? (
          <CircleBackButton
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        ) : showLogo ? (
          <TouchableOpacity onPress={toggleLogo} style={styles.logoCircle} activeOpacity={0.7}>
            <Image
              source={logoLang === 'ar' ? require("@/assets/arlogo.svg") : require("@/assets/logo.svg")}
              style={styles.logoImg}
              contentFit="contain"
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        {/* Center: Title */}
        {title ? (
          <View style={styles.titleContainer}>
            <Text style={styles.flatHeaderTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Right Side: Delete, Custom, or Home Group */}
        {onDeletePress ? (
          <TouchableOpacity onPress={onDeletePress} style={styles.flatDeleteButton}>
            <SolarTrashBinBold
              size={normalize.width(21)}
              color={Colors.error}
            />
          </TouchableOpacity>
        ) : customRightComponent ? (
          customRightComponent
        ) : showBackButton ? (
          /* Placeholder to keep title perfectly centered */
          <View style={{ width: 40 }} />
        ) : (
          /* Home Group (Search & Profile) */
          <View style={[styles.homeRightGroup, { flexDirection: flexRow }]}>
            {showSearch && (
              <TouchableOpacity
                onPress={onSearchPress}
                style={styles.searchCircle}
              >
                <SolarMagnifierBold
                  size={normalize.width(22)}
                  color="#111827"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onProfilePress || (() => router.push("/(dashboard)/profile"))}
              style={styles.profileCircle}
            >
              <SolarUserBold
                size={normalize.width(22)}
                color="#111827"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flatHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  flatHeaderContent: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  flatHeaderTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Bold",
    color: Colors.text.primary,
  },
  titleContainer: {
    position: 'absolute',
    left: 80,
    right: 80,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  flatDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5'
  },
  homeRightGroup: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  profileCircle: {
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF"
  },
  searchCircle: {
    width: normalize.width(38),
    height: normalize.width(38),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF"
  },
  logoCircle: {
    width: normalize.width(46),
    height: normalize.width(46),
    borderRadius: normalize.width(23),
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0,
    overflow: "hidden"
  },
  logoImg: {
    width: "95%",
    height: "95%"
  }
});
