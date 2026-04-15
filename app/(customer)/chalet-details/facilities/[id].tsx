import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Path } from 'react-native-svg';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { SafeAreaView } from 'react-native-safe-area-context';

import { 
  SolarMagnifierBold, 
  SolarWaterBold, 
  SolarFireBold, 
  SolarHome2Bold, 
  SolarWidgetBold,
  SolarWifiBold,
  SolarWindBold,
  SolarLockBold,
  SolarSettingsBold,
  SolarKeyBold
} from '@/components/icons/solar-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPES = {
  scalloped: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
     <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
  </View>
);

const TOP_TABS = [
  { id: 'pool', label: 'المسبح', icon: <SolarWaterBold size={16} color="#035DF9" /> },
  { id: 'bbq', label: 'الشواء', icon: <SolarFireBold size={16} color="#035DF9" /> },
  { id: 'kitchen', label: 'المطبخ', icon: <SolarHome2Bold size={16} color="#035DF9" /> },
  { id: 'bath', label: 'الحمام', icon: <SolarWaterBold size={16} color="#035DF9" /> },
];

const FacilityCard = ({ label, subtext, color, Icon }: { label: string; subtext?: string; color: string; Icon?: any }) => (
  <View style={styles.cardContainer}>
     <View style={styles.textSide}>
        <ThemedText style={styles.cardLabel}>{label}</ThemedText>
        {subtext && <ThemedText style={styles.cardSubtext}>{subtext}</ThemedText>}
     </View>
     <View style={styles.iconSideScalloped}>
        <Svg height={44} width={44} viewBox="0 0 60 60">
           <Path d={SHAPES.scalloped} fill={color} />
        </Svg>
        <View style={styles.iconCentered}>
           {Icon ? <Icon size={18} color="white" /> : <View style={styles.iconDot} />}
        </View>
     </View>
  </View>
);

export default function FacilitiesScreen() {
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Normalized Header */}
      <HeaderSection title={t('headers.facilities')} showBackButton showLogo={false} userType={userType} />

       <ScrollView 
         style={{ backgroundColor: '#FFFFFF' }}
         contentContainerStyle={{ paddingBottom: 50, backgroundColor: '#FFFFFF' }}
       >
          <View style={{ paddingHorizontal: 20 }}>
              {/* الخدمات العامة */}
              <SectionHeader title={t('facilities.general')} />
              <FacilityCard label={t('facilities.wifi')} color="#FF4500" Icon={SolarWifiBold} />
              <FacilityCard label={t('facilities.garage')} color="#FF4500" Icon={SolarHome2Bold} />
              <FacilityCard label={t('facilities.generator')} color="#FF4500" Icon={SolarWindBold} />

              {/* الحمام */}
              <SectionHeader title={t('facilities.bathroom')} />
              <FacilityCard label={t('facilities.essentials')} subtext={t('facilities.essentialsDesc')} color="#035DF9" Icon={SolarLockBold} />
              <FacilityCard label={t('facilities.hairDryer')} color="#035DF9" Icon={SolarWindBold} />
              <FacilityCard label={t('facilities.shampoo')} color="#035DF9" Icon={SolarWaterBold} />
              <FacilityCard label={t('facilities.soap')} color="#035DF9" Icon={SolarWaterBold} />
              <FacilityCard label={t('facilities.hotWater')} color="#035DF9" Icon={SolarWaterBold} />
              <FacilityCard label={t('facilities.outdoorSinks')} color="#035DF9" Icon={SolarWaterBold} />

              {/* المطبخ */}
              <SectionHeader title={t('facilities.kitchen')} />
              <FacilityCard label={t('facilities.fullKitchen')} subtext={t('facilities.kitchenDesc')} color="#15AB64" Icon={SolarHome2Bold} />
              <FacilityCard label={t('facilities.cookingTools')} subtext={t('facilities.toolsDesc')} color="#15AB64" Icon={SolarSettingsBold} />
              <FacilityCard label={t('facilities.table')} subtext={t('facilities.tableDesc')} color="#15AB64" Icon={SolarWidgetBold} />

              {/* الميزات الخارجية */}
              <SectionHeader title={t('facilities.outdoorFeatures')} />
              <FacilityCard label={t('facilities.privatePool')} color="#FF69B4" Icon={SolarWaterBold} />
              <FacilityCard label={t('facilities.bbqArea')} color="#FF69B4" Icon={SolarFireBold} />
              <FacilityCard label={t('facilities.outdoorSeating')} color="#FF69B4" Icon={SolarHome2Bold} />
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: 25,
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "LamaSans-Black",
    color: '#111827',
  },
  topTabsScroll: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  tabItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  tabIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#035DF9',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTextPill: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    // Minimal shadow for white pill
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    fontFamily: "LamaSans-Black",
    color: '#035DF9',
  },
  cardContainer: { 
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 15, 
    padding: 15, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'flex-end'
  },
  textSide: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
  cardLabel: { fontSize: 16, fontFamily: "LamaSans-Black", color: '#111827' },
  cardSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' , fontFamily: "LamaSans-Regular" },
  iconSideScalloped: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCentered: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  }
});
