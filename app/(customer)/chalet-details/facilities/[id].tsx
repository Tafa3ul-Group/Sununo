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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const JAGGED_ICON = "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z";

const FacilityCard = ({ label, subtext, color }: { label: string; subtext?: string; color: string }) => (
  <View style={styles.cardContainer}>
     <View style={styles.textSide}>
        <ThemedText style={styles.cardLabel}>{label}</ThemedText>
        {subtext && <ThemedText style={styles.cardSubtext}>{subtext}</ThemedText>}
     </View>
     <View style={styles.iconSide}>
        <Svg width={30} height={30} viewBox="0 0 60 60"><Path d={JAGGED_ICON} fill={color}/></Svg>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 20 }}>
          {/* الخدمات العامة */}
          <ThemedText style={styles.categoryTitle}>الخدمات العامة</ThemedText>
          <FacilityCard label="واي فاي" color="#FF4500" />
          <FacilityCard label="كراج مظلل" color="#FF4500" />
          <FacilityCard label="مولدة أوتوماتيكية" color="#FF4500" />

          {/* الحمام */}
          <ThemedText style={styles.categoryTitle}>الحمام</ThemedText>
          <FacilityCard label="المستلزمات الأساسية" subtext="مناشف، صابون، ورق حمام" color="#035DF9" />
          <FacilityCard label="مجفف شعر" color="#035DF9" />
          <FacilityCard label="شامبو وبلسم" color="#035DF9" />
          <FacilityCard label="صابون وجل استحمام" color="#035DF9" />
          <FacilityCard label="ماء حار" color="#035DF9" />
          <FacilityCard label="مغاسل خارجية" color="#035DF9" />

          {/* المطبخ */}
          <ThemedText style={styles.categoryTitle}>المطبخ</ThemedText>
          <FacilityCard label="مطبخ متكامل" subtext="طباخ، فرن، ثلاجة كبيرة" color="#15AB64" />
          <FacilityCard label="أدوات الطبخ" subtext="قدور، مقالي، زيت، ملح وفلفل" color="#15AB64" />
          <FacilityCard label="مائدة" subtext="أطباق، ملاعق، أكواب شاي وقهوة" color="#15AB64" />

          {/* الميزات الخارجية */}
          <ThemedText style={styles.categoryTitle}>الميزات الخارجية</ThemedText>
          <FacilityCard label="مسبح خاص" color="#EF79D7" />
          <FacilityCard label="منطقة شواء" color="#EF79D7" />
          <FacilityCard label="جلسة خارجية مظللة" color="#EF79D7" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  categoryTitle: { 
    fontSize: 16, fontWeight: '900', textAlign: 'right', 
    marginTop: 25, marginBottom: 15, color: '#374151' 
  },
  cardContainer: { 
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 15, 
    padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'flex-end'
  },
  textSide: { flex: 1, alignItems: 'flex-end', marginRight: 15 },
  cardLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' },
  iconSide: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' }
});
