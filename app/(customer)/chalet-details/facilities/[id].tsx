import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Svg, { Path } from 'react-native-svg';
import { HeaderSection } from '@/components/header-section';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetCustomerChaletDetailsQuery } from '@/store/api/customerApiSlice';
import { Colors } from '@/constants/theme';

import { 
  SolarWaterBold, 
  SolarFireBold, 
  SolarHome2Bold, 
  SolarWidgetBold,
  SolarWifiBold,
  SolarWindBold,
  SolarLockBold,
  SolarSettingsBold,
} from '@/components/icons/solar-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPES = {
  scalloped: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

const FEATURE_ICON_MAP: Record<string, any> = {
  'bbq': SolarFireBold,
  'heater': SolarWindBold,
  'toilet-western': SolarWaterBold,
  'wifi': SolarWifiBold,
  'fridge': SolarHome2Bold,
  'tv': SolarWidgetBold,
  'kitchen': SolarHome2Bold,
  'bathroom': SolarWaterBold,
  'entertainment': SolarWidgetBold,
  'services': SolarSettingsBold,
  'default': SolarWidgetBold
};

const CATEGORY_COLORS: Record<string, string> = {
  'entertainment': '#F64300',
  'bathroom': '#035DF9',
  'kitchen': '#15AB64',
  'services': '#EF79D7',
  'default': '#6B7280'
};

const SectionHeader = ({ title, isRTL }: { title: string; isRTL: boolean }) => (
  <View style={[styles.sectionHeader, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
     <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
  </View>
);

const FacilityCard = ({ label, subtext, color, Icon, isRTL }: { label: string; subtext?: string; color: string; Icon?: any; isRTL: boolean }) => (
  <View style={[styles.cardContainer, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
     <View style={[styles.textSide, { alignItems: isRTL ? 'flex-end' : 'flex-start', [isRTL ? 'marginRight' : 'marginLeft']: 15 }]}>
        <ThemedText style={styles.cardLabel}>{label}</ThemedText>
        {subtext && <ThemedText style={[styles.cardSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>{subtext}</ThemedText>}
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
  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: chaletData, isLoading } = useGetCustomerChaletDetailsQuery(chaletId);

  const categories = useMemo(() => {
    if (!chaletData?.chaletFeatures) return [];
    
    const grouped: Record<string, { name: string; icon: string; features: any[] }> = {};
    
    chaletData.chaletFeatures.forEach((item: any) => {
        const feature = item.feature;
        if (!feature) return;
        
        const category = feature.category;
        const categoryId = category?.id || 'other';
        
        if (!grouped[categoryId]) {
            grouped[categoryId] = {
                name: isRTL ? (category?.name?.ar || category?.name) : (category?.name?.en || category?.name),
                icon: category?.icon || 'default',
                features: []
            };
        }
        
        grouped[categoryId].features.push({
            id: feature.id,
            name: isRTL ? (feature.name?.ar || feature.name) : (feature.name?.en || feature.name),
            icon: feature.icon,
            value: item.value
        });
    });
    
    return Object.values(grouped);
  }, [chaletData, isRTL]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <HeaderSection title={t('headers.facilities')} showBackButton showLogo={false} userType={userType} />

       <ScrollView 
         style={{ backgroundColor: '#FFFFFF' }}
         contentContainerStyle={{ paddingBottom: 50, backgroundColor: '#FFFFFF' }}
       >
          <View style={{ paddingHorizontal: 20 }}>
              {categories.map((cat, idx) => (
                  <View key={idx}>
                    <SectionHeader title={cat.name} isRTL={isRTL} />
                    {cat.features.map((feat) => {
                        const IconComp = FEATURE_ICON_MAP[feat.icon] || FEATURE_ICON_MAP.default;
                        const color = CATEGORY_COLORS[cat.icon] || CATEGORY_COLORS.default;
                        
                        return (
                            <FacilityCard 
                                key={feat.id}
                                label={feat.name}
                                subtext={feat.value}
                                color={color}
                                Icon={IconComp}
                                isRTL={isRTL}
                            />
                        );
                    })}
                  </View>
              ))}

              {categories.length === 0 && (
                  <View style={{ marginTop: 100, alignItems: 'center' }}>
                      <ThemedText style={{ color: '#9CA3AF' }}>
                          {isRTL ? 'لا توجد مرافق متاحة' : 'No facilities available'}
                      </ThemedText>
                  </View>
              )}
          </View>
       </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  sectionHeader: {
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Black",
    color: '#111827',
  },
  cardContainer: { 
    backgroundColor: '#FFFFFF', borderRadius: 15, 
    padding: 15, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  textSide: { flex: 1 },
  cardLabel: { fontSize: 16, fontFamily: "Alexandria-Black", color: '#111827' },
  cardSubtext: { fontSize: 12, color: '#6B7280', marginTop: 4, fontFamily: "Alexandria-Regular" },
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
