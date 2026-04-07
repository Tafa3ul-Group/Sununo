import { Colors, normalize, Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SolarIcon } from '@/components/ui/solar-icon';
import Svg, { Path } from 'react-native-svg';
import { PrimaryButton } from '@/components/user/primary-button';
import { CircleBackButton } from '@/components/ui/circle-back-button';
import { HorizontalCard } from '@/components/user/horizontal-card';
import { HorizontalSwiper } from '@/components/user/horizontal-swiper';
import { SecondaryButton } from '@/components/user/secondary-button';
import { SolarStarBold, SolarMapBoldDuotone } from '@/components/icons/solar-icons';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPES = {
  blue: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeImage, setActiveImage] = useState(0);

  const FACILITIES = [
    { label: t('home.amenities.pool'), icon: 'water-bold', color: '#035DF9' }, 
    { label: t('home.amenities.wifi'), icon: 'wi-fi-bold', color: '#EF79D7' }, 
    { label: t('home.amenities.ac'), icon: 'wind-bold', color: '#F64200' }, 
    { label: t('home.amenities.kitchen'), icon: 'home-2-bold', color: '#15AB64' },
    { label: t('home.amenities.ac'), icon: 'wind-bold', color: '#F64200' }, 
    { label: t('home.amenities.kitchen'), icon: 'home-2-bold', color: '#15AB64' },
    { label: t('home.amenities.pool'), icon: 'water-bold', color: '#035DF9' }, 
    { label: t('home.amenities.wifi'), icon: 'wi-fi-bold', color: '#EF79D7' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* صور الشاليه */}
        <View style={styles.imageHeader}>
          <ScrollView horizontal pagingEnabled onScroll={(e) => setActiveImage(Math.ceil(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800' }} style={styles.headerImage} />
            <Image source={{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' }} style={styles.headerImage} />
          </ScrollView>
          <CircleBackButton style={styles.backBtnOriginal} />
          <View style={styles.paginationDots}>
            {[1, 2, 3, 4, 5].map((_, i) => <View key={i} style={[styles.dot, activeImage === i && styles.activeDot]} />)}
          </View>
        </View>

        <View style={styles.infoWrapper}>
          {/* العنوان (النجمة يساراً) */}
          <View style={[styles.titleSection, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.ratingGroupLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                  <SolarStarBold size={14} color="#035DF9" />
                  <ThemedText style={styles.ratingVal}>4.5</ThemedText>
              </View>
              <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start', flex: 1 }}>
                 <ThemedText style={styles.mainTitle}>شالية الاروع علة الطلاق</ThemedText>
                 <ThemedText style={styles.locationSub}>البصرة - الجزائر</ThemedText>
              </View>
          </View>

          {/* المواصفات الأساسية */}
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.mainSpecs')}</ThemedText>
          <View style={[styles.specsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             {(isRTL ? ['بستان مع بيت', '300 م', '1 حمام', '3 غرف'] : ['Garden & House', '300m', '1 Bath', '3 Rooms']).map((d, i) => (
                <View key={i} style={styles.specTag}><ThemedText style={styles.specText}>{d}</ThemedText></View>
             ))}
          </View>

          {/* المرافق */}
          <View style={[styles.facilitiesHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
             <TouchableOpacity onPress={() => router.push(`/chalet-details/facilities/${id}` as any)}>
               <ThemedText style={styles.viewAllText}>{t('home.seeAll')}</ThemedText>
             </TouchableOpacity>
             <ThemedText style={styles.sectionTitle}>{t('home.facilities')}</ThemedText>
          </View>
          <View style={[styles.facilitiesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
             {FACILITIES.map((f, i) => (
               <View key={i} style={styles.facilityCell}>
                  <View style={styles.shapeCont}>
                    <Svg height={55} width={55} viewBox="0 0 60 60"><Path d={SHAPES.blue} fill={f.color}/></Svg>
                    <View style={styles.iconInShape}><SolarIcon name={f.icon as any} size={22} color="white" /></View>
                  </View>
                  <ThemedText style={styles.facilityLabelText}>{f.label}</ThemedText>
               </View>
             ))}
          </View>

          {/* نظرة عامة */}
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.overview')}</ThemedText>
          <ThemedText style={[styles.descriptionText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? "هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم في صناعات المطابع ودور النشر. كان لوريم إيبسوم ولايزال المعيار للنص الشكلي منذ القرن الخامس عشر عندما قامت مطبعة مجهولة برص مجموعة من الأحرف بشكل عشوائي أخذتها من نص، لتكوّن كتيّب بمثابة دليل أو مرجع شكلي...." : "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."}
          </ThemedText>
          <View style={styles.readMoreWrapper}>
            <PrimaryButton label={t('home.readMore')} onPress={() => {}} style={styles.readMoreComp} />
          </View>

          {/* الموقع */}
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('common.location')}</ThemedText>
          <View style={styles.mapCardFlat}>
             <View style={styles.mapInner}>
                <Image source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png' }} style={styles.mapImg} />
                <View style={styles.pinCenter}><SolarMapBoldDuotone size={32} color="#035DF9" /></View>
             </View>
             <View style={[styles.mapLocLabel, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}><ThemedText style={styles.mapLocText}>البصرة - ابة الخصيب</ThemedText></View>
          </View>

          {/* المضيف (استخدام صورة الكونتاكت) */}
          <View style={styles.hostStampArea}>
             <Image 
                source={require('@/assets/tabs/contact.svg')} 
                style={styles.contactBanner} 
                resizeMode="contain" 
             />
          </View>

          {/* التقييم والمراجعات */}
          <View style={[styles.ctaRowReview, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
             <TouchableOpacity 
                style={styles.customRatingPill} 
                onPress={() => router.push(`/chalet-details/reviews/${id}` as any)}
             >
                <SolarStarBold size={20} color="white" />
                <ThemedText style={styles.customRatingText}>4.5</ThemedText>
             </TouchableOpacity>

             <SecondaryButton 
                label={t('home.review')}
                iconLabel="45"
                iconPosition={isRTL ? "right" : "left"}
                isActive={true}
                onPress={() => router.push(`/chalet-details/reviews/${id}` as any)}
                style={{ width: 140 }}
              />
          </View>

          {/* المراجعات */}
          <ThemedText style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('home.reviewsLabel')}</ThemedText>
          {[1, 2].map((_, i) => (
             <View key={i} style={styles.revComplexCardFlat}>
                <View style={[styles.revHeaderRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                   <View style={[styles.revRatingCorner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}><SolarStarBold size={16} color="#15CB64" /><ThemedText style={styles.revRateNum}>4</ThemedText></View>
                   <View style={[styles.reviewerMeta, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}><ThemedText style={styles.reviewerName}>انسة انس</ThemedText><Image source={require('@/assets/profile.svg')} style={styles.revAvatarSmall} /></View>
                </View>
                <ThemedText style={[styles.revComment, { textAlign: isRTL ? 'right' : 'left' }]}>هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.</ThemedText>
             </View>
          ))}
        </View>

        {/* RELATED CHALETS */}
        <View style={styles.sectionHeader}>
            <TouchableOpacity><ThemedText style={styles.seeAll}>{t('home.seeAll')}</ThemedText></TouchableOpacity>
            <ThemedText style={styles.sectionTitle}>{t('home.lastBookings')}</ThemedText>
        </View>
        <HorizontalSwiper data={[]} />

      </ScrollView>

      {/* حجز الآن (Fixed Footer) */}
      <View style={[styles.footerFlat, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
         <View style={[styles.priceBoxFooter, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <ThemedText style={styles.priceFootVal}>{t('common.iqdShort')} 25,000</ThemedText>
            <ThemedText style={styles.priceFootLab}>{t('common.perShift')}</ThemedText>
         </View>
         <PrimaryButton 
            label={t('common.bookNow') || "حجز الآن"} 
            onPress={() => router.push(`/booking-flow/${id}` as any)} 
            style={styles.footerFlatBtn} 
         />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageHeader: {
    width: SCREEN_WIDTH,
    height: normalize.height(350),
    position: 'relative',
  },
  headerImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  backBtnOriginal: {
    position: 'absolute',
    top: normalize.height(50),
    left: normalize.width(20),
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowOpacity: 0,
    elevation: 0,
  },
  paginationDots: {
    position: 'absolute',
    bottom: normalize.height(20),
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  infoWrapper: {
    borderTopLeftRadius: normalize.radius(32),
    borderTopRightRadius: normalize.radius(32),
    marginTop: normalize.height(-30),
    backgroundColor: 'white',
    paddingHorizontal: normalize.width(20),
    paddingTop: normalize.height(25),
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: normalize.height(22),
  },
  ratingGroupLeft: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingVal: {
    fontSize: normalize.font(14),
    fontWeight: '800',
    color: '#1F2937',
  },
  mainTitle: {
    fontSize: normalize.font(20),
    fontWeight: '900',
    color: '#1F2937',
  },
  locationSub: {
    fontSize: normalize.font(14),
    color: '#6B7280',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: normalize.font(18),
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: normalize.height(15),
  },
  specsRow: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: normalize.height(25),
  },
  specTag: {
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  specText: {
    fontSize: normalize.font(13),
    fontWeight: '700',
    color: '#4B5563',
  },
  facilitiesHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize.height(5),
  },
  viewAllText: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: Colors.primary,
  },
  facilitiesGrid: {
    flexWrap: 'wrap',
    gap: normalize.width(15),
    marginBottom: normalize.height(25),
  },
  facilityCell: {
    width: (SCREEN_WIDTH - 80) / 4,
    alignItems: 'center',
    gap: 8,
  },
  shapeCont: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInShape: {
    position: 'absolute',
  },
  facilityLabelText: {
    fontSize: normalize.font(11),
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: normalize.font(14),
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: normalize.height(15),
  },
  readMoreWrapper: {
    alignItems: 'center',
    marginBottom: normalize.height(25),
  },
  readMoreComp: {
    width: 140,
    height: 48,
    borderRadius: 24,
  },
  mapCardFlat: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    marginBottom: normalize.height(25),
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  mapInner: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  mapImg: {
    width: '100%',
    height: '100%',
  },
  pinCenter: {
    position: 'absolute',
    top: '40%',
    left: '46%',
  },
  mapLocLabel: {
    padding: 15,
  },
  mapLocText: {
    fontSize: normalize.font(14),
    fontWeight: '700',
    color: '#1F2937',
  },
  hostStampArea: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
  },
  contactBanner: {
    width: '100%',
    height: 120,
  },
  ctaRowReview: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize.height(15),
  },
  customRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  customRatingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  revComplexCardFlat: {
    backgroundColor: '#F8F9FB',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  revHeaderRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  revRatingCorner: {
    alignItems: 'center',
    gap: 4,
  },
  revRateNum: {
    fontWeight: '800',
    fontSize: 14,
    color: '#111827',
  },
  reviewerMeta: {
    alignItems: 'center',
    gap: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  revAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  revComment: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerFlat: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: normalize.width(20),
    paddingBottom: Platform.OS === 'ios' ? normalize.height(35) : normalize.height(20),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBoxFooter: {
    gap: 2,
  },
  priceFootVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  priceFootLab: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  footerFlatBtn: {
    width: SCREEN_WIDTH * 0.55,
    height: 56,
    borderRadius: 28,
  },
});
