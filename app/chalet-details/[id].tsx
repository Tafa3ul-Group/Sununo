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
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SolarIcon } from '@/components/ui/solar-icon';
import Svg, { Path } from 'react-native-svg';
import { PrimaryButton } from '@/components/user/primary-button';
import { CircleBackButton } from '@/components/ui/circle-back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPES = {
  blue: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);

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
          <View style={styles.titleSection}>
              <View style={styles.ratingGroupLeft}>
                  <SolarIcon name="star-bold" size={14} color="#035DF9" />
                  <ThemedText style={styles.ratingVal}>4.5</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                 <ThemedText style={styles.mainTitle}>شالية الاروع علة الطلاق</ThemedText>
                 <ThemedText style={styles.locationSub}>البصرة - الجزائر</ThemedText>
              </View>
          </View>

          {/* المواصفات الأساسية */}
          <ThemedText style={styles.sectionTitle}>المواصفات الاساسية</ThemedText>
          <View style={styles.specsRow}>
             {['بستان مع بيت', '300 م', '1 حمام', '3 غرف'].map((d, i) => (
                <View key={i} style={styles.specTag}><ThemedText style={styles.specText}>{d}</ThemedText></View>
             ))}
          </View>

          {/* المرافق */}
          <View style={styles.facilitiesHeader}>
             <TouchableOpacity onPress={() => router.push(`/chalet-details/facilities/${id}`)}>
               <ThemedText style={styles.viewAllText}>الكل</ThemedText>
             </TouchableOpacity>
             <ThemedText style={styles.sectionTitle}>المرافق</ThemedText>
          </View>
          <View style={styles.facilitiesGrid}>
             {[
               { label: 'مسبح', icon: 'water-bold', color: '#035DF9' }, { label: 'واي فاي', icon: 'wi-fi-bold', color: '#EF79D7' }, 
               { label: 'تكييف هواء', icon: 'wind-bold', color: '#F64200' }, { label: 'مطبخ', icon: 'home-2-bold', color: '#15AB64' },
               { label: 'تكييف هواء', icon: 'wind-bold', color: '#F64200' }, { label: 'مطبخ', icon: 'home-2-bold', color: '#15AB64' },
               { label: 'مسبح', icon: 'water-bold', color: '#035DF9' }, { label: 'واي فاي', icon: 'wi-fi-bold', color: '#EF79D7' },
             ].map((f, i) => (
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
          <ThemedText style={styles.sectionTitle}>نظرة عامة</ThemedText>
          <ThemedText style={styles.descriptionText}>هو ببساطة نص شكلي ويُستخدم في صناعات المطابع ودور النشر.</ThemedText>
          <View style={styles.readMoreWrapper}><PrimaryButton label="اقرأ المزيد" onPress={() => {}} style={styles.readMoreComp} /></View>

          {/* الموقع */}
          <ThemedText style={styles.sectionTitle}>الموقع</ThemedText>
          <View style={styles.mapCardFlat}>
             <View style={styles.mapInner}>
                <Image source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png' }} style={styles.mapImg} />
                <View style={styles.pinCenter}><SolarIcon name="map-point-bold" size={32} color="#035DF9" /></View>
             </View>
             <View style={styles.mapLocLabel}><ThemedText style={styles.mapLocText}>البصرة - ابة الخصيب</ThemedText></View>
          </View>

          {/* المضيف */}
          <View style={styles.hostStampArea}>
             <View style={styles.hostGreenJagged}>
                <View style={styles.hostContentBox}>
                   <View style={styles.hostAvatarComp}>
                      <View style={styles.avatarOrangeFrame}>
                         <Image source={require('@/assets/profile.svg')} style={styles.hostImgMain} resizeMode="contain" />
                      </View>
                   </View>
                   <View style={styles.hostInfoText}>
                      <ThemedText style={styles.hostLabelAlt}>المضيف</ThemedText>
                      <ThemedText style={styles.hostNameAlt}>انيس انس</ThemedText>
                   </View>
                </View>
             </View>
          </View>

          {/* أزرار التقييم والمراجعات مع الربط بالصفحة الجديدة */}
          <View style={styles.ctaRowReview}>
             <TouchableOpacity style={styles.pillBackRating} onPress={() => router.push(`/chalet-details/reviews/${id}`)}>
                <SolarIcon name="star-bold" size={18} color="white" />
                <ThemedText style={styles.pillRateText}>4.5</ThemedText>
             </TouchableOpacity>
             <TouchableOpacity style={styles.revSplitButton} onPress={() => router.push(`/chalet-details/reviews/${id}`)}>
                <View style={styles.revLabelSide}><ThemedText style={styles.revLabelText}>مراجعة</ThemedText></View>
                <View style={styles.revNumSide}><ThemedText style={styles.revNumText}>45</ThemedText></View>
             </TouchableOpacity>
          </View>

          {/* المراجعات */}
          <ThemedText style={styles.sectionTitle}>المراجعات</ThemedText>
          {[1, 2].map((_, i) => (
             <View key={i} style={styles.revComplexCardFlat}>
                <View style={styles.revHeaderRow}>
                   <View style={styles.revRatingCorner}><SolarIcon name="star-bold" size={16} color="#15CB64" /><ThemedText style={styles.revRateNum}>4</ThemedText></View>
                   <View style={styles.reviewerMeta}><ThemedText style={styles.reviewerName}>انسة انس</ThemedText><Image source={require('@/assets/profile.svg')} style={styles.revAvatarSmall} /></View>
                </View>
                <ThemedText style={styles.revMessage}>خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.revImgSwiper}>
                   {[1, 2, 3, 4].map(im => <Image key={im} source={{ uri: 'https://images.unsplash.com/photo-1502082559145?w=200' }} style={styles.revPhotoThumb} />)}
                </ScrollView>
                <ThemedText style={styles.revTimeText}>2025/09/22</ThemedText>
             </View>
          ))}

          <View style={styles.addReviewAction}><PrimaryButton label="إضافة مراجعة" onPress={() => {}} style={styles.addBtnFinal} /></View>

          {/* معلومات تهمك */}
          <ThemedText style={styles.sectionTitle}>معلومات تهمك</ThemedText>
          <View style={styles.infoIconsGrid}>
             {[ { label: 'شروط الشاليه', icon: 'key-bold' }, { label: 'سياسة الالغاء', icon: 'forbidden-bold' }, { label: 'الامان', icon: 'shield-check-bold' }, { label: 'وقت الدخول والخروج', icon: 'clock-circle-bold' } ].map((item, i) => (
                <View key={i} style={styles.infoIconCell}>
                   <View style={styles.infoGearWrap}><Svg width={55} height={55} viewBox="0 0 60 60"><Path d={SHAPES.blue} fill="#BDBDBD"/></Svg><View style={styles.infoGearIcon}><SolarIcon name={item.icon as any} size={24} color="white"/></View></View>
                   <ThemedText style={styles.infoLabelText}>{item.label}</ThemedText>
                </View>
             ))}
          </View>

          {/* قد يعجبك ايضا */}
          <ThemedText style={styles.sectionTitle}>قد يعجبك ايضا</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedRow}>
             <View style={styles.relatedCardFlatFinal}>
                <View style={styles.relInfoLeft}>
                   <View style={styles.relFavBtn}><SolarIcon name="heart-bold" size={17} color="#FF4500"/></View>
                   <ThemedText style={styles.relChaletTitle}>شالية الاروع علة الطلاق</ThemedText>
                   <ThemedText style={styles.relChaletLoc}>البصرة - الجزائر</ThemedText>
                   <View style={styles.relBottomMeta}>
                      <View style={styles.relRatingBox}><SolarIcon name="star-bold" size={14} color="#15CB64"/><ThemedText style={styles.relRatingNum}>4.5</ThemedText></View>
                      <ThemedText style={styles.relChaletPrice}>IQD 30,000 / شفت</ThemedText>
                   </View>
                </View>
                <View style={styles.relImgRight}><View style={styles.relImgBorder}><Image source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400' }} style={styles.relImgMain} /></View></View>
             </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* الفوتر Flat */}
      <View style={styles.flatUltimateFooter}>
          <View style={styles.footerBtnSide}>
             <PrimaryButton label="احجز الان" onPress={() => {}} style={styles.footerFlatBtn} />
          </View>
          <View style={styles.footerTextSide}>
             <ThemedText style={styles.footerPriceBig}>30,000 IQD</ThemedText>
             <ThemedText style={styles.footerMetaSmall}>شفت صباحي . 23/اكتوبر . 5 بالغين</ThemedText>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  imageHeader: { width: SCREEN_WIDTH, height: 350, position: 'relative' },
  headerImage: { width: SCREEN_WIDTH, height: '100%' },
  backBtnOriginal: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  paginationDots: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  activeDot: { backgroundColor: '#035DF9', width: 20 },
  infoWrapper: { padding: 20 },
  titleSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ratingGroupLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 15 },
  ratingVal: { fontSize: 18, fontWeight: '800' },
  mainTitle: { fontSize: 22, fontWeight: '900', textAlign: 'right' },
  locationSub: { fontSize: 13, color: '#6B7280', textAlign: 'right' },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginVertical: 15, textAlign: 'right' },
  specsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  specTag: { backgroundColor: '#F3F7FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  specText: { fontSize: 13, fontWeight: '700' },
  viewAllText: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  facilitiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  facilitiesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 15 },
  facilityCell: { width: '23%', alignItems: 'center', marginBottom: 20 },
  shapeCont: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' },
  iconInShape: { position: 'absolute' },
  facilityLabelText: { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  descriptionText: { fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'right' },
  readMoreWrapper: { alignItems: 'center', marginTop: 15 },
  readMoreComp: { width: '40%', height: 40, borderRadius: 20 },
  
  mapCardFlat: { backgroundColor: '#F9FAFB', borderRadius: 24, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  mapInner: { height: 180, borderRadius: 15, overflow: 'hidden' },
  mapImg: { width: '100%', height: '100%' },
  pinCenter: { position: 'absolute', top: '40%', left: '46%' },
  mapLocLabel: { paddingVertical: 10, alignItems: 'center' },
  mapLocText: { fontSize: 15, fontWeight: '800' },

  hostStampArea: { marginVertical: 20, alignItems: 'center' },
  hostGreenJagged: { backgroundColor: '#15AB64', padding: 15, borderRadius: 25, width: '95%' },
  hostContentBox: { backgroundColor: 'white', borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center' },
  hostAvatarComp: { width: 60, height: 60 },
  avatarOrangeFrame: { backgroundColor: '#F64200', borderRadius: 15, width: '100%', height: '100%', padding: 5 },
  hostImgMain: { width: '100%', height: '100%', borderRadius: 10 },
  hostInfoText: { flex: 1, alignItems: 'flex-end', paddingRight: 15 },
  hostLabelAlt: { fontSize: 11, color: '#6B7280' },
  hostNameAlt: { fontSize: 18, fontWeight: '900' },

  ctaRowReview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 25 },
  pillBackRating: { backgroundColor: '#035DF9', flexDirection: 'row', height: 46, paddingHorizontal: 18, borderRadius: 23, alignItems: 'center', gap: 8 },
  pillRateText: { color: 'white', fontSize: 18, fontWeight: '900' },
  revSplitButton: { flexDirection: 'row', height: 46 },
  revLabelSide: { backgroundColor: '#035DF9', justifyContent: 'center', paddingHorizontal: 20, borderTopLeftRadius: 15, borderBottomLeftRadius: 15 },
  revNumSide: { backgroundColor: '#0055EE', justifyContent: 'center', paddingHorizontal: 15, borderTopRightRadius: 23, borderBottomRightRadius: 23, minWidth: 50, alignItems: 'center' },
  revLabelText: { color: 'white', fontSize: 16, fontWeight: '800' },
  revNumText: { color: 'white', fontSize: 16, fontWeight: '900' },

  revComplexCardFlat: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginVertical: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  revHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewerName: { fontSize: 16, fontWeight: '900' },
  revAvatarSmall: { width: 50, height: 50, borderRadius: 25 },
  revRatingCorner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revRateNum: { fontSize: 18, fontWeight: '900' },
  revMessage: { fontSize: 14, color: '#6B7280', marginVertical: 15, fontWeight: '600', textAlign: 'right' },
  revImgSwiper: { gap: 10 },
  revPhotoThumb: { width: 130, height: 90, borderRadius: 12, marginRight: 10 },
  revTimeText: { fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'left' },

  addReviewAction: { alignItems: 'center', marginVertical: 20 },
  addBtnFinal: { width: '80%', height: 48, borderRadius: 24 },
  infoIconsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  infoIconCell: { width: '23%', alignItems: 'center' },
  infoGearWrap: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' },
  infoGearIcon: { position: 'absolute' },
  infoLabelText: { fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  relatedRow: { marginTop: 10 },
  relatedCardFlatFinal: { width: SCREEN_WIDTH * 0.82, height: 140, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', padding: 12, marginRight: 20 },
  relInfoLeft: { flex: 1, justifyContent: 'space-between' },
  relFavBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  relChaletTitle: { fontSize: 16, fontWeight: '900', textAlign: 'right' },
  relChaletLoc: { fontSize: 12, color: '#6B7280', textAlign: 'right' },
  relBottomMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  relRatingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  relRatingNum: { fontSize: 14, fontWeight: '800', color: '#15CB64' },
  relChaletPrice: { fontSize: 13, fontWeight: '900' },
  relImgRight: { width: 100, height: 100, marginLeft: 10 },
  relImgBorder: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#15AB64', overflow: 'hidden' },
  relImgMain: { width: '100%', height: '100%' },

  flatUltimateFooter: { 
    position: 'absolute', bottom: 0, width: '100%', height: 100, 
    backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25,
    borderTopWidth: 1, borderTopColor: '#F3F4F6'
  },
  footerTextSide: { alignItems: 'flex-end' },
  footerPriceBig: { fontSize: 26, fontWeight: '900' },
  footerMetaSmall: { fontSize: 12, color: '#9CA3AF' },
  footerBtnSide: { width: 150 },
  footerFlatBtn: { height: 50, borderRadius: 25 }
});
