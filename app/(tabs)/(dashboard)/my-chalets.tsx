import { HeaderSection } from '@/components/header-section';
import { Colors, normalize } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { RootState } from '@/store';
import { useGetOwnerChaletsQuery } from '@/store/api/apiSlice';
import { formatPrice } from '@/utils/format';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SolarMapPointBold,
  SolarBanknoteBold,
  SolarStarBold,
  SolarPenBold,
  SolarAddSquareBold,
  SolarHome2Bold
} from "@/components/icons/solar-icons";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function MyChaletsScreen() {
  const router = useRouter();
  const { userType, language } = useSelector((state: RootState) => state.auth);
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const { data: chaletsResponse, isLoading, refetch, isFetching } = useGetOwnerChaletsQuery({});
  const chalets = chaletsResponse?.data || chaletsResponse || [];

  const renderChaletCard = (item: any) => {
    const mainImageSrc = getImageSrc(item.images?.[0]?.url);
    const chaletName = isRTL ? (item.name?.ar || item.name) : (item.name?.en || item.name);
    const chaletLocation = isRTL ? (item.address?.ar || item.region?.name) : (item.address?.en || item.region?.enName);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.chaletCard}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/(tabs)/(dashboard)/chalet-details',
            params: { id: item.id }
          });
        }}
      >
        <View style={[styles.chaletCardInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Image */}
          <View style={styles.chaletImageWrap}>
            <Image source={mainImageSrc} style={styles.chaletImage} />
            {/* Status indicator */}
            <View style={[styles.statusIndicator, { backgroundColor: item.isApproved ? '#10B981' : '#F59E0B' }]} />
          </View>

          {/* Info */}
          <View style={[styles.chaletInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.chaletName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {chaletName}
            </Text>
            <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <SolarMapPointBold size={12} color={Colors.primary} />
              <Text style={styles.locationLabel} numberOfLines={1}>{chaletLocation}</Text>
            </View>

            {/* Stat chips row */}
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.statChip, { backgroundColor: '#ECFDF5' }]}>
                <SolarBanknoteBold size={12} color="#10B981" />
                <Text style={[styles.statChipText, { color: '#10B981' }]}>{formatPrice(item.price)}</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: '#EFF6FF' }]}>
                <SolarStarBold size={12} color={Colors.primary} />
                <Text style={[styles.statChipText, { color: Colors.primary }]}>{item.reviewCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/(tabs)/(dashboard)/edit-chalet', params: { id: item.id } });
            }}
          >
            <SolarPenBold size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSection
        userType={userType}
        title={t('tabs.myChalets')}
        showSearch={false}
        showCategories={false}
        showProfile={true}
        showLogo={false}
        marginBottom={4}
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        <View style={styles.chaletSectionHeader}>
            <View style={[styles.sectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.sectionTitle}>{isRTL ? 'قائمة الشاليهات' : 'Chalets List'}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{chalets.length}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addChaletBtn}
              onPress={() => router.push('/(tabs)/(dashboard)/add-chalet')}
            >
              <SolarAddSquareBold size={24} color={Colors.white} />
            </TouchableOpacity>
        </View>

        <View style={styles.chaletsList}>
          {isLoading && !isFetching ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : chalets.length > 0 ? (
            chalets.map(renderChaletCard)
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                 <SolarHome2Bold size={40} color={Colors.text.muted} />
              </View>
              <Text style={styles.emptyTitle}>{isRTL ? 'لا توجد شاليهات' : 'No Chalets Found'}</Text>
              <Text style={styles.emptySubtitle}>
                {isRTL ? 'ابدأ بإضافة شاليهك الأول لاستقبال الحجوزات' : 'Start by adding your first chalet to receive bookings'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  chaletSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontFamily: "LamaSans-Black",
    color: Colors.text.primary,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: Colors.white,
    fontSize: normalize.font(11),
    fontFamily: "LamaSans-Black",
  },
  addChaletBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chaletsList: {
    // Removed gap for compatibility
  },
  chaletCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    marginBottom: 12, // Increased from 4
  },
  chaletCardInner: {
    padding: 12,
    alignItems: 'center',
    gap: 14,
  },
  chaletImageWrap: {
    position: 'relative',
  },
  chaletImage: {
    width: normalize.width(80),
    height: normalize.width(80),
    borderRadius: 14,
    backgroundColor: '#F5F5F7',
  },
  statusIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  chaletInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  chaletName: {
    fontSize: normalize.font(15),
    fontFamily: "LamaSans-Bold",
    color: Colors.text.primary,
  },
  locationRow: {
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    fontSize: normalize.font(11),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
  },
  chipRow: {
    gap: 6,
    marginTop: 2,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statChipText: {
    fontSize: normalize.font(11),
    fontFamily: "LamaSans-Bold",
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: normalize.font(16),
    fontFamily: "LamaSans-Bold",
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: normalize.font(12),
    color: Colors.text.muted,
    fontFamily: "LamaSans-Medium",
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
