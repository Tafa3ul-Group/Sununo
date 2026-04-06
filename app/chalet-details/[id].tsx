import { Colors, normalize, Spacing } from '@/constants/theme';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SolarIcon } from '@/components/ui/solar-icon';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { PrimaryButton } from '@/components/user/primary-button';
import { CircleBackButton } from '@/components/ui/circle-back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHAPES = {
  blue: "M31.177 60L31.7712 59.9376C32.8672 59.232 36.7817 53.2436 37.8737 51.728C40.3228 52.6508 43.5285 53.5787 46.0539 54.4214C46.6842 54.6319 47.1961 54.5513 47.7421 54.1911C48.543 53.009 48.4848 46.1697 48.5932 44.2386C51.3936 43.3932 54.3204 42.7398 57.1026 41.877C57.8393 41.6485 58.032 41.2674 58.291 40.674C58.2268 39.2385 54.5572 33.6731 53.5736 31.9774C55.4164 29.9328 57.2973 27.9347 59.1442 25.8993C59.8909 25.0775 60.0555 24.7649 59.9852 23.7883C59.2746 22.6217 53.0717 19.9015 51.2751 18.9984C51.6967 16.1161 52.2507 13.4061 52.7466 10.5491C52.8831 9.75984 52.8288 9.24161 52.3531 8.62877C51.0242 7.87675 44.2954 9.10223 42.288 9.36357C41.2482 6.79897 40.2926 4.18695 39.2387 1.63228C38.8232 0.627833 38.5883 0.336505 37.697 1.49012e-06C36.2838 0.167544 31.3898 4.6203 29.8581 5.88326C28.2101 5.91851 22.5873 0.0391017 20.6823 0.560774C19.6525 1.92219 17.8438 8.34534 17.2316 10.3089C15.196 10.2469 8.20426 9.36458 7.01989 10.4574C6.33938 11.9432 8.50738 18.5541 9.06143 20.5286C6.98778 21.7352 1.51158 24.7799 0 26.128C1.22652 27.8168 5.83953 32.0045 7.64017 33.6889C1.56375 45.7068 1.28272 42.6296 13.4938 45.5763C13.8109 47.6571 13.9193 54.5019 15.3245 55.5511C16.7377 55.8748 22.9165 52.9707 24.7292 52.2229C26.837 54.8499 28.9869 57.4427 31.177 60Z",
  red: "M26.0603 60C29.9658 59.4325 29.8391 57.154 32.7123 55.3719C34.9225 54.1301 37.5529 56.9614 39.3811 57.3718C44.9058 58.6116 45.0155 53.8851 45.7481 50.2915C46.6896 46.8466 51.9145 48.769 54.0192 47.2906C58.6446 44.0383 54.2219 40.5348 54.091 37.1548C54.015 35.1591 59.4109 33.2953 59.8817 30.686C60.7641 25.7794 56.4955 25.9343 54.2493 22.9543C53.2593 21.2225 55.2331 18.2886 55.4822 16.8143C56.5335 10.6114 50.9476 11.4512 47.0992 11.0554C44.5891 10.7957 44.7707 5.60846 43.789 4.02109C42.7863 2.40231 41.7835 2.19288 40.0292 1.73217C37.2468 2.50491 35.7226 3.96454 33.0732 4.97811C29.9193 4.0148 28.8406 -0.579781 24.7388 0.0610315C21.5701 0.0359016 20.8671 5.11424 19.5751 6.16131C15.2897 9.63133 12.864 2.85464 8.01704 8.83346C7.91359 10.2303 8.34847 15.4992 7.88615 16.2991C6.25008 19.1388 -0.948651 18.253 0.10477 23.4151C0.647314 26.0705 2.92303 27.662 4.08201 30.02L4.18968 30.2441C3.20803 32.4388 0.824638 34.7235 0.389759 36.803C-0.691106 41.9798 5.48587 41.5358 7.9347 43.7054C9.67633 45.2467 7.4935 50.3062 9.13168 52.2118C11.3251 55.9604 16.8983 52.3584 18.8236 53.1061C22.3723 54.4819 20.7087 58.6535 26.0603 60Z",
  green: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
  pink: "M24.91 0C27.0701 0.496535 28.2561 2.03453 30.0498 3.51362C35.1705 -1.23292 35.9096 -1.06671 38.9761 5.08738C41.9346 4.27946 45.7444 1.47486 46.5131 6.62746C46.6677 7.66051 46.799 8.70829 46.9346 9.74344C48.7537 9.89914 52.4237 9.16486 53.3598 11.1426C53.9993 12.4912 53.04 15.3484 52.6631 16.7854C59.6389 19.5437 59.605 18.6621 55.8672 25.4811C61.2844 29.75 61.4707 30.2655 55.8651 34.5681C56.5555 35.8641 57.4534 37.0634 58.04 38.372C59.5097 41.6521 55.0243 42.4011 52.6673 43.2175C53.0972 44.7807 53.9633 47.5769 53.3365 49.159C52.4153 51.4797 48.9528 49.422 47.4915 50.2594C45.9053 51.3156 46.6508 54.0634 46.1806 55.3868C45.3272 57.7895 40.4479 55.4457 39.0375 54.8923C37.805 57.0342 37.6165 58.3597 35.6533 59.9987C33.1777 60.0576 32.0214 58.1703 29.9545 56.5334C24.3764 61.0275 24.6644 61.6187 20.9223 54.8587C13.1904 57.5559 14.6326 57.5833 12.985 50.1185C5.51574 50.5645 5.97528 49.9606 7.20145 43.127C0.683039 40.8252 0.0943126 40.8926 4.1625 34.6059C1.87533 32.5483 -2.41311 30.68 1.74191 27.341C2.54877 26.693 3.37257 26.0513 4.17731 25.399C0.168422 19.2702 0.651283 19.1881 7.18452 16.8422C6.26754 10.2295 5.00113 9.57512 13.0909 9.76237C14.2154 2.29752 14.046 2.80668 21.007 5.08316C22.3052 3.02339 22.3666 0.969926 24.91 0Z"
};

interface FacilityItemProps {
  label: string;
  icon: string;
  path: string;
  color: string;
}

const FacilityItem = ({ label, icon, path, color }: FacilityItemProps) => (
  <View style={styles.facilityItem}>
    <View style={styles.shapeContainer}>
      <Svg height={normalize.width(55)} width={normalize.width(55)} viewBox="0 0 60 60">
        <Path d={path} fill={color} />
      </Svg>
      <View style={styles.iconOverlay}>
        <SolarIcon name={icon as any} size={normalize.width(24)} color="white" />
      </View>
    </View>
    <ThemedText style={styles.facilityLabel}>{label}</ThemedText>
  </View>
);

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const chalet = {
    id: '1',
    title: 'شالية الورد والياسمين',
    location: 'البصرة - الجزائر',
    price: '350,000',
    rating: 4.5,
    description: 'هو ببساطة نص شكلي (بمعنى أن الغاية هي الشكل وليس المحتوى) ويُستخدم في صناعات المطابع ودور النشر. كان لوريم إيبسوم ولايزال المعيار للنص الشكلي منذ القرن الخامس عشر عندما قامت مطبعة مجهولة برص مجموعة من الأحرف بشكل عشوائي أخذتها من نص، لتكوين كتيب بمثابة دليل أو مرجع شكلي...',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    ],
    details: [
      { id: 1, label: 'بستان مع بيت', icon: 'home-linear' },
      { id: 2, label: '300 م', icon: 'ruler-linear' },
      { id: 3, label: '1 حمام', icon: 'bath-linear' },
      { id: 4, label: '3 غرف', icon: 'bed-linear' },
    ],
    facilities: [
      { id: 1, label: 'مسبح', icon: 'water-bold', path: SHAPES.blue, color: '#035DF9' },
      { id: 2, label: 'تكييف هواء', icon: 'wind-bold', path: SHAPES.red, color: '#F64200' },
      { id: 3, label: 'واي فاي', icon: 'wi-fi-bold', path: SHAPES.pink, color: '#EF79D7' },
      { id: 4, label: 'مطبخ', icon: 'home-2-bold', path: SHAPES.green, color: '#15AB64' },
    ]
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== activeImage) {
      setActiveImage(slide);
    }
  };

  return (
    <View style={styles.container}>
      {/* سوايبر الصور المتحرك */}
      <View style={styles.imageHeader}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.swiper}
        >
          {chalet.images.map((img, index) => (
            <Image key={index} source={{ uri: img }} style={styles.headerImage} />
          ))}
        </ScrollView>
        
        {/* زر الرجوع والمفضلة بتصميمه الجديد */}
        <CircleBackButton style={styles.backButton} />
        
        <TouchableOpacity 
          style={[styles.favoriteButton, isFavorite && styles.favoriteActive]} 
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <SolarIcon name={isFavorite ? "heart-bold" : "heart-linear"} size={22} color={isFavorite ? "white" : "#9CA3AF"} />
        </TouchableOpacity>

        {/* نقاط السوايبر */}
        <View style={styles.paginationDots}>
          {chalet.images.map((_, i) => (
            <View key={i} style={[styles.dot, activeImage === i && styles.activeDot]} />
          ))}
        </View>
      </View>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* إلغاء الراوندد هنا - infoWrapper أصبح مسطحاً */}
        <View style={styles.infoWrapper}>
           <View style={styles.titleSection}>
              <View style={styles.ratingRow}>
                 <ThemedText style={styles.ratingValue}>{chalet.rating}</ThemedText>
                 <SolarIcon name="star-bold" size={normalize.width(18)} color="#035DF9" />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                 <ThemedText style={styles.mainTitle}>{chalet.title}</ThemedText>
                 <ThemedText style={styles.locationSub}>{chalet.location}</ThemedText>
              </View>
           </View>

           <ThemedText style={styles.sectionTitle}>المواصفات الاساسية</ThemedText>
           <View style={styles.specsRow}>
              {chalet.details.map((item) => (
                <View key={item.id} style={styles.specTag}>
                   <ThemedText style={styles.specLabel}>{item.label}</ThemedText>
                </View>
              ))}
           </View>

           <View style={styles.facilitiesHeader}>
              <TouchableOpacity><ThemedText style={styles.viewAll}>الكل</ThemedText></TouchableOpacity>
              <ThemedText style={styles.sectionTitle}>المرافق</ThemedText>
           </View>
           
           <View style={styles.facilitiesGrid}>
              {chalet.facilities.map((item) => (
                <FacilityItem 
                   key={item.id} label={item.label} icon={item.icon} path={item.path} color={item.color} 
                />
              ))}
           </View>

           <ThemedText style={styles.sectionTitle}>نظرة عامة</ThemedText>
           <ThemedText style={styles.description}>{chalet.description}</ThemedText>

           <View style={styles.buttonWrapper}>
              <PrimaryButton 
                label="اقرأ المزيد" 
                onPress={() => {}} 
                style={{ width: '100%' }}
              />
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  imageHeader: { width: SCREEN_WIDTH, height: normalize.height(350), position: 'relative' },
  swiper: { flex: 1 },
  headerImage: { width: SCREEN_WIDTH, height: '100%' },
  
  // زر الرجوع والمفضلة
  backButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  favoriteButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    width: normalize.width(42),
    height: normalize.width(42),
    borderRadius: normalize.width(21),
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  favoriteActive: { backgroundColor: '#EA2129' },
  
  paginationDots: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#035DF9', width: 25 },
  
  infoWrapper: { 
    padding: 20, 
    backgroundColor: 'white', 
    // تم إلغاء الراوندد هنا
    borderTopLeftRadius: 0, 
    borderTopRightRadius: 0, 
    marginTop: 0 
  },
  
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainTitle: { fontSize: normalize.font(20), fontWeight: '900', color: '#000' },
  locationSub: { fontSize: normalize.font(14), color: '#6B7280', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 },
  ratingValue: { fontSize: normalize.font(16), fontWeight: '800', color: '#000' },
  sectionTitle: { fontSize: normalize.font(18), fontWeight: '900', marginBottom: 15, marginTop: 10, color: '#111827' },
  specsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  specTag: { backgroundColor: '#F3F7FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: normalize.width(80), alignItems: 'center' },
  specLabel: { fontSize: normalize.font(14), color: '#111827', fontWeight: '700' },
  facilitiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  viewAll: { fontSize: normalize.font(14), color: '#6B7280', fontWeight: '700' },
  facilitiesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 15 },
  facilityItem: { width: '23%', alignItems: 'center', marginBottom: 20 },
  shapeContainer: { width: normalize.width(55), height: normalize.width(55), justifyContent: 'center', alignItems: 'center' },
  iconOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  facilityLabel: { fontSize: normalize.font(13), fontWeight: '700', color: '#111827', marginTop: 5, textAlign: 'center' },
  description: { fontSize: normalize.font(15), color: '#6B7280', lineHeight: 22, textAlign: 'right' },
  buttonWrapper: { marginTop: 20, marginBottom: 40, width: '100%' },
});
