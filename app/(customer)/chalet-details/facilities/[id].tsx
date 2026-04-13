import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Path } from 'react-native-svg';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

import { SolarMagnifierBold, SolarWaterBold, SolarFireBold, SolarChefHatBold, SolarBathBold, SolarWidgetBold } from '@/components/icons/solar-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scalloped / Wavy Border Background for Headers
const ScallopedHeader = ({ title, color }: { title: string; color: string }) => (
  <View style={styles.scallopedWrapper}>
     <View style={[styles.scallopedContainer, { backgroundColor: color }]}>
        <View style={styles.scallopedInnerPill}>
           <ThemedText style={styles.scallopedTitle}>{title}</ThemedText>
        </View>
     </View>
  </View>
);

const TOP_TABS = [
  { id: 'pool', label: 'المسبح', icon: <SolarWaterBold size={16} color="#035DF9" /> },
  { id: 'bbq', label: 'الشواء', icon: <SolarFireBold size={16} color="#035DF9" /> },
  { id: 'kitchen', label: 'المطبخ', icon: <SolarChefHatBold size={16} color="#035DF9" /> },
  { id: 'bath', label: 'الحمام', icon: <SolarBathBold size={16} color="#035DF9" /> },
];

const FacilityCard = ({ label, subtext, color }: { label: string; subtext?: string; color: string }) => (
  <View style={styles.cardContainer}>
     <View style={styles.textSide}>
        <ThemedText style={styles.cardLabel}>{label}</ThemedText>
        {subtext && <ThemedText style={styles.cardSubtext}>{subtext}</ThemedText>}
     </View>
     <View style={[styles.iconBullet, { borderColor: color }]}>
        <View style={[styles.iconInner, { backgroundColor: color }]} />
     </View>
  </View>
);

export default function FacilitiesScreen() {
  const router = useRouter();
  const { userType } = useSelector((state: RootState) => state.auth);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Normalized Header */}
      <HeaderSection title="المرافق" showBackButton showLogo userType={userType} />

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
          {/* Top Horizontal Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.topTabsScroll}
          >
            <View style={{ flexDirection: 'row-reverse', gap: 15 }}>
              {TOP_TABS.map((tab) => (
                <TouchableOpacity key={tab.id} style={styles.tabItem}>
                   <View style={styles.tabIconCircle}>
                      {tab.icon}
                   </View>
                   <View style={styles.tabTextPill}>
                      <ThemedText style={styles.tabText}>{tab.label}</ThemedText>
                   </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 20 }}>
              {/* الخدمات العامة */}
              <ScallopedHeader title="الخدمات العامة" color="#15AB64" />
              <FacilityCard label="واي فاي" color="#15AB64" />
              <FacilityCard label="كراج مظلل" color="#15AB64" />
              <FacilityCard label="مولدة أوتوماتيكية" color="#15AB64" />

              {/* الحمام */}
              <ScallopedHeader title="الحمام" color="#035DF9" />
              <FacilityCard label="المستلزمات الأساسية" subtext="مناشف، صابون، ورق حمام" color="#035DF9" />
              <FacilityCard label="مجفف شعر" color="#035DF9" />
              <FacilityCard label="شامبو وبلسم" color="#035DF9" />
              <FacilityCard label="صابون وجل استحمام" color="#035DF9" />
              <FacilityCard label="ماء حار" color="#035DF9" />
              <FacilityCard label="مغاسل خارجية" color="#035DF9" />

              {/* المطبخ */}
              <ScallopedHeader title="المطبخ" color="#15AB64" />
              <FacilityCard label="مطبخ متكامل" subtext="طباخ، فرن، ثلاجة كبيرة" color="#15AB64" />
              <FacilityCard label="أدوات الطبخ" subtext="قدور، مقالي، زيت، ملح وفلفل" color="#15AB64" />
              <FacilityCard label="مائدة" subtext="أطباق، ملاعق، أكواب شاي وقهوة" color="#15AB64" />

              {/* الميزات الخارجية */}
              <ScallopedHeader title="الميزات الخارجية" color="#035DF9" />
              <FacilityCard label="مسبح خاص" color="#035DF9" />
              <FacilityCard label="منطقة شواء" color="#035DF9" />
              <FacilityCard label="جلسة خارجية مظللة" color="#035DF9" />
          </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scallopedWrapper: {
    marginVertical: 25,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  scallopedContainer: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    // Emulating scalloped with border radius and padding (high-fidelity look)
    borderWidth: 4,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scallopedInnerPill: {
    backgroundColor: '#F9FAFB',
    width: '95%',
    height: '100%',
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scallopedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#374151',
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
    fontWeight: '900',
    color: '#035DF9',
  },
  cardContainer: { 
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 15, 
    padding: 15, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'flex-end'
  },
  textSide: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
  cardLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' },
  iconBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});
