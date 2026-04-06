import { Colors, normalize, Spacing } from '@/constants/theme';
import { useLocalSearchParams, Stack } from 'expo-router';
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
  blue: "M31.177 60L31.7712 59.9376C32.8672 59.232 36.7817 53.2436 37.8737 51.728C40.3228 52.6508 43.5285 53.5787 46.0539 54.4214C46.6842 54.6319 47.1961 54.5513 47.7421 54.1911C48.543 53.009 48.4848 46.1697 48.5932 44.2386C51.3936 43.3932 54.3204 42.7398 57.1026 41.877C57.8393 41.6485 58.032 41.2674 58.291 40.674C58.2268 39.2385 54.5572 33.6731 53.5736 31.9774C55.4164 29.9328 57.2973 27.9347 59.1442 25.8993C59.8909 25.0775 60.0555 24.7649 59.9852 23.7883C59.2746 22.6217 53.0717 19.9015 51.2751 18.9984C51.6967 16.1161 52.2507 13.4061 52.7466 10.5491C52.8831 9.75984 52.8288 9.24161 52.3531 8.62877C51.0242 7.87675 44.2954 9.10223 42.288 9.36357C41.2482 6.79897 40.2926 4.18695 39.2387 1.63228C38.8232 0.627833 38.5883 0.336505 37.697 1.49012e-06C36.2838 0.167544 31.3898 4.6203 29.8581 5.88326C28.2101 5.91851 22.5873 0.0391017 20.6823 0.560774C19.6525 1.92219 17.8438 8.34534 17.2316 10.3089C15.196 10.2469 8.20426 9.36458 7.01989 10.4574C6.33938 11.9432 8.50738 18.5541 9.06143 20.5286C6.98778 21.7352 1.51158 24.7799 0 26.128C1.22652 27.8168 5.83953 32.0045 7.64017 33.6889C1.56375 45.7068 1.28272 42.6296 13.4938 45.5763C13.8109 47.6571 13.9193 54.5019 15.3245 55.5511C16.7377 55.8748 22.9165 52.9707 24.7292 52.2229C26.837 54.8499 28.9869 57.4427 31.177 60Z",
  info: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
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
          <CircleBackButton style={styles.backButton} />
          <View style={styles.paginationDots}>
            {[1, 2].map((_, i) => <View key={i} style={[styles.dot, activeImage === i && styles.activeDot]} />)}
          </View>
        </View>

        <View style={styles.infoWrapper}>
          {/* العنوان والتقييم */}
          <View style={styles.titleSection}>
              <View style={styles.ratingBoxTop}><ThemedText style={styles.ratingValTop}>4.5</ThemedText><SolarIcon name="star-bold" size={14} color="#035DF9" /></View>
              <View style={{ alignItems: 'flex-end' }}>
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
             <TouchableOpacity><ThemedText style={styles.viewAllText}>الكل</ThemedText></TouchableOpacity>
             <ThemedText style={styles.sectionTitle}>المرافق</ThemedText>
          </View>
          <View style={styles.facilitiesGrid}>
             {[
               { label: 'مسبح', icon: 'water-bold', path: SHAPES.blue, color: '#035DF9' },
               { label: 'تكييف هواء', icon: 'wind-bold', path: SHAPES.blue, color: '#F64200' },
               { label: 'واي فاي', icon: 'wi-fi-bold', path: SHAPES.blue, color: '#EF79D7' },
               { label: 'مطبخ', icon: 'home-2-bold', path: SHAPES.blue, color: '#15AB64' },
             ].map((f, i) => (
               <View key={i} style={styles.facilityCell}>
                  <View style={styles.shapeCont}>
                    <Svg height={55} width={55} viewBox="0 0 60 60"><Path d={f.path} fill={f.color}/></Svg>
                    <View style={styles.iconInShape}><SolarIcon name={f.icon as any} size={22} color="white" /></View>
                  </View>
                  <ThemedText style={styles.facilityLabelText}>{f.label}</ThemedText>
               </View>
             ))}
          </View>

          {/* نظرة عامة */}
          <ThemedText style={styles.sectionTitle}>نظرة عامة</ThemedText>
          <ThemedText style={styles.descriptionText}>
            هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم في صناعات المطابع ودور النشر.
          </ThemedText>
          <View style={styles.readMoreWrapper}><PrimaryButton label="اقرأ المزيد" onPress={() => {}} style={styles.readMoreBtn} /></View>

          {/* الموقع */}
          <ThemedText style={styles.sectionTitle}>الموقع</ThemedText>
          <View style={styles.mapCardBody}>
             <View style={styles.mapFrame}>
                <Image source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV3uDpS9mZc6jS1j75n6oA.png' }} style={styles.mapImg} />
                <View style={styles.pinCenter}><SolarIcon name="map-point-bold" size={32} color="#035DF9" /></View>
             </View>
             <View style={styles.mapLabelPart}><ThemedText style={styles.mapLineText}>البصرة - ابة الخصيب</ThemedText></View>
          </View>

          {/* المضيف */}
          <View style={styles.hostSectionStamp}>
             <Image source={require('@/assets/tabs/contact.svg')} style={styles.contactBg} resizeMode="contain" />
             <View style={styles.hostOverlay}>
                 <ThemedText style={styles.hostSmall}>المضيف</ThemedText>
                 <ThemedText style={styles.hostBold}>انيس انس</ThemedText>
             </View>
          </View>

          {/* التقييم والمراجعة */}
          <View style={styles.ctaRowFinal}>
             <View style={styles.ratingBadgePill}>
                <SolarIcon name="star-bold" size={18} color="white" />
                <ThemedText style={styles.badgeVal}>4.5</ThemedText>
             </View>
             <View style={styles.splitReviewBtn}>
                <View style={styles.revTextPortion}><ThemedText style={styles.revLabel}>مراجعة</ThemedText></View>
                <View style={styles.revCountPortion}><ThemedText style={styles.revCount}>45</ThemedText></View>
             </View>
          </View>

          {/* المراجعات */}
          <ThemedText style={styles.sectionTitle}>المراجعات</ThemedText>
          <View style={styles.reviewFullCard}>
             <View style={styles.revTopRow}>
                <View style={styles.greenStarTag}><SolarIcon name="star-bold" size={16} color="#15CB64" /><ThemedText style={styles.greenStarVal}>4</ThemedText></View>
                <View style={styles.reviewerId}><ThemedText style={styles.revName}>انسة انس</ThemedText><Image source={{ uri: 'https://i.pravatar.cc/100?u=u2' }} style={styles.revAvatar} /></View>
             </View>
             <ThemedText style={styles.revBody}>خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير</ThemedText>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.revGallerySwiper} contentContainerStyle={{ gap: 10 }}>
                {[1, 2, 3, 4].map(i => <Image key={i} source={{ uri: 'https://images.unsplash.com/photo-1502082559145?w=200' }} style={styles.revThumb} />)}
             </ScrollView>
             <ThemedText style={styles.revDateText}>2025/09/22</ThemedText>
          </View>

          <View style={styles.bottomAddReview}><PrimaryButton label="إضافة مراجعة" onPress={() => {}} style={styles.finalAddBtn} /></View>

          {/* معلومات تهمك */}
          <ThemedText style={styles.sectionTitle}>معلومات تهمك</ThemedText>
          <View style={styles.infoIconsRow}>
             {[
               { label: 'شروط الشاليه', icon: 'key-bold' },
               { label: 'سياسة الالغاء', icon: 'forbidden-bold' },
               { label: 'الامان', icon: 'shield-check-bold' },
               { label: 'وقت الدخول والخروج', icon: 'clock-circle-bold' }
             ].map((item, i) => (
                <View key={i} style={styles.infoItemCell}>
                   <View style={styles.infoShapeWrap}>
                      <Svg width={55} height={55} viewBox="0 0 60 60"><Path d={SHAPES.info} fill="#BDBDBD"/></Svg>
                      <View style={styles.infoInnerIcon}><SolarIcon name={item.icon as any} size={24} color="white"/></View>
                   </View>
                   <ThemedText style={styles.infoLabelText}>{item.label}</ThemedText>
                </View>
             ))}
          </View>

          {/* قد يعجبك ايضا - هذا الجزء هو الذي تم تعديله ليطابق الصورة 100% */}
          <ThemedText style={styles.sectionTitle}>قد يعجبك ايضا</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
             <View style={styles.finalRelatedCard}>
                <View style={styles.relLeftContent}>
                   <View style={styles.relHeartBtn}><SolarIcon name="heart-bold" size={18} color="#FF4500"/></View>
                   <ThemedText style={styles.relTitleFinal}>شالية الاروع علة الطلاق</ThemedText>
                   <ThemedText style={styles.relLocFinal}>البصرة - الجزائر</ThemedText>
                   <View style={styles.relBottomRow}>
                      <View style={styles.relRatingFinal}><SolarIcon name="star-bold" size={14} color="#15CB64"/><ThemedText style={styles.relRatingValFinal}>4.5</ThemedText></View>
                      <ThemedText style={styles.relPriceFinal}>IQD 30,000 / شفت</ThemedText>
                   </View>
                </View>
                <View style={styles.relRightImageWrap}>
                   <View style={styles.relJaggedImgBorder}>
                      <Image source={{ uri: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400' }} style={styles.relMainImg} />
                   </View>
                </View>
             </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* الفـوتر النهائي - مطابق للموجود في الصورة */}
      <View style={styles.finalFooterBar}>
          <TouchableOpacity style={styles.finalBookPill}>
             <View style={styles.finalBookMain}><ThemedText style={styles.finalBookText}>احجز الان</ThemedText></View>
             <View style={styles.finalBookAccent} />
          </TouchableOpacity>
          <View style={styles.finalFooterInfo}>
             <ThemedText style={styles.finalFooterPrice}>30,000 IQD</ThemedText>
             <ThemedText style={styles.finalFooterMeta}>شفت صباحي . 23/اكتوبر . 5 بالغين</ThemedText>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  imageHeader: { width: SCREEN_WIDTH, height: normalize.height(350) },
  headerImage: { width: SCREEN_WIDTH, height: '100%' },
  backButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  paginationDots: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#035DF9', width: 20 },
  infoWrapper: { padding: 20 },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainTitle: { fontSize: 20, fontWeight: '900' },
  locationSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  ratingBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValTop: { fontSize: 16, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginVertical: 15, textAlign: 'right' },
  specsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  specTag: { backgroundColor: '#F3F7FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  specText: { fontSize: 13, fontWeight: '700' },
  facilitiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAllText: { fontSize: 13, color: '#6B7280', fontWeight: '700' },
  facilitiesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 15 },
  facilityCell: { width: '23%', alignItems: 'center', marginBottom: 20 },
  shapeCont: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' },
  iconInShape: { position: 'absolute' },
  facilityLabelText: { fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  descriptionText: { fontSize: 14, color: '#6B7280', lineHeight: 22, textAlign: 'right' },
  readMoreWrapper: { alignItems: 'center', marginTop: 20 },
  readMoreBtn: { width: '40%', height: 40 },
  mapCardBody: { backgroundColor: 'white', borderRadius: 24, padding: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, marginBottom: 20 },
  mapFrame: { height: 180, borderRadius: 15, overflow: 'hidden' },
  mapImg: { width: '100%', height: '100%', opacity: 0.8 },
  pinCenter: { position: 'absolute', top: '40%', left: '46%' },
  mapLabelPart: { paddingVertical: 12, alignItems: 'center' },
  mapLineText: { fontSize: 16, fontWeight: '900' },
  hostSectionStamp: { marginTop: 10, width: '100%', height: 100, position: 'relative' },
  contactBg: { width: '100%', height: '100%' },
  hostOverlay: { position: 'absolute', right: 80, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-end' },
  hostSmall: { fontSize: 11, color: '#6B7280' },
  hostBold: { fontSize: 17, fontWeight: '900' },
  ctaRowFinal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  ratingBadgePill: { backgroundColor: '#035DF9', flexDirection: 'row', height: 46, paddingHorizontal: 16, borderRadius: 23, alignItems: 'center', gap: 6 },
  badgeVal: { color: 'white', fontSize: 18, fontWeight: '900' },
  splitReviewBtn: { flexDirection: 'row', height: 46 },
  revTextPortion: { backgroundColor: '#035DF9', justifyContent: 'center', paddingHorizontal: 20, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  revCountPortion: { backgroundColor: '#0055EE', justifyContent: 'center', paddingHorizontal: 15, borderTopRightRadius: 23, borderBottomRightRadius: 23, minWidth: 50, alignItems: 'center' },
  reviewFullCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginVertical: 15, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  revTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerId: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  revAvatar: { width: 50, height: 50, borderRadius: 25 },
  greenStarTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  revBody: { textAlign: 'center', fontSize: 14, color: '#6B7280', marginVertical: 15, fontWeight: '600' },
  revGallerySwiper: { marginVertical: 10 },
  revThumb: { width: SCREEN_WIDTH * 0.45, height: 110, borderRadius: 15 },
  revDateText: { fontSize: 12, color: '#9CA3AF', marginTop: 10 },
  bottomAddReview: { alignItems: 'center', marginVertical: 20 },
  finalAddBtn: { width: '80%', height: 50, borderRadius: 12 },
  infoIconsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10, marginBottom: 30 },
  infoItemCell: { width: '23%', alignItems: 'center' },
  infoShapeWrap: { width: 55, height: 55, justifyContent: 'center', alignItems: 'center' },
  infoInnerIcon: { position: 'absolute' },
  infoLabelText: { fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  // قد يعجبك ايضا المطور - مطابق للصورة
  finalRelatedCard: { 
    width: SCREEN_WIDTH * 0.85, height: 140, 
    backgroundColor: 'white', borderRadius: 24, 
    borderWidth: 1, borderColor: '#F3F4F6',
    flexDirection: 'row', padding: 12,
    elevation: 4, marginRight: 20
  },
  relLeftContent: { flex: 1, justifyContent: 'space-between' },
  relHeartBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  relTitleFinal: { fontSize: 16, fontWeight: '900', textAlign: 'right' },
  relLocFinal: { fontSize: 12, color: '#6B7280', textAlign: 'right' },
  relBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  relRatingFinal: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  relRatingValFinal: { fontSize: 14, fontWeight: '800', color: '#15CB64' },
  relPriceFinal: { fontSize: 15, fontWeight: '900' },
  relRightImageWrap: { width: 110, height: 110, marginLeft: 15 },
  relJaggedImgBorder: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#15AB64', overflow: 'hidden' },
  relMainImg: { width: '100%', height: '100%' },

  // الفوتر النهائي - مطابق للصورة
  finalFooterBar: { 
    position: 'absolute', bottom: 10, width: SCREEN_WIDTH - 40, alignSelf: 'center', height: 100, 
    backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderRadius: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
    elevation: 30, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20
  },
  finalFooterInfo: { alignItems: 'flex-end' },
  finalFooterPrice: { fontSize: 26, fontWeight: '900', color: '#111827' },
  finalFooterMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  finalBookPill: { flexDirection: 'row', height: 55, width: 140 },
  finalBookMain: { flex: 1, backgroundColor: '#035DF9', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 15, borderBottomLeftRadius: 15 },
  finalBookAccent: { width: 15, backgroundColor: '#0055EE', borderTopRightRadius: 27.5, borderBottomRightRadius: 27.5, marginLeft: -5 },
  finalBookText: { color: 'white', fontSize: 18, fontWeight: '900' }
});
