import { Colors, normalize, Spacing } from '@/constants/theme';
import { getImageSrc } from '@/hooks/useImageSrc';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { ThemedText } from './themed-text';
import Svg, { Path } from 'react-native-svg';
import { 
  SolarStarBold, 
  SolarHeartBold, 
  SolarMapPointBold 
} from './icons/solar-icons';

interface ChaletCardProps {
  chalet: any;
  onPress?: () => void;
  style?: ViewStyle;
}

// شكل النجمة (num4) المستخدم كخلفية للقلب
const STAR_SHAPE = "M21.5794 1.3411C23.0039 -0.447035 25.7533 -0.447035 27.1778 1.3411L30.9328 6.05437C31.5583 6.83951 32.5599 7.25435 33.5852 7.15286L39.7366 6.54401C42.068 6.31326 43.7674 8.65243 42.9234 10.8258L40.6942 16.5658C40.3228 17.5222 40.4851 18.599 41.1239 19.4168L44.958 24.3243C46.4111 26.1843 45.3611 28.9702 43.1 29.3821L37.1197 30.4716C36.1235 30.6531 35.2933 31.3323 34.9221 32.2681L32.6931 37.8876C31.8484 40.0163 28.91 40.0163 28.0654 37.8876L25.8364 32.2681C25.4652 31.3323 24.6349 30.6531 23.6387 30.4716L17.6585 29.3821C15.3973 28.9702 14.3473 26.1843 15.8005 24.3243L19.6346 19.4168C20.2733 18.599 20.4357 17.5222 20.0642 16.5658L17.8351 10.8258C16.9911 8.65243 18.6905 6.31326 21.0218 6.54401L27.1733 7.15286C28.1986 7.25435 29.2002 6.83951 29.8257 6.05437L33.5806 1.3411L21.5794 1.3411Z";

export function ChaletCard({ chalet, onPress, style }: ChaletCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = React.useState(false);

  if (!chalet) return null;

  const imageSource = getImageSrc(chalet.images?.[0]?.url || chalet.image);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress || (() => router.push(`/chalet-details/${chalet.id}`))}
      style={[styles.container, style]}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={imageSource} 
          style={styles.image} 
          contentFit="cover" 
        />
        
        {/* الطبقة العلوية للأيقونات (التقييم والقلب) */}
        <View style={styles.topActions}>
           {/* التقييم في زاوية اليمنى صريحاً وبنفس المسافة */}
           <View style={styles.ratingOverlay}>
              <ThemedText style={styles.ratingText}>{chalet.rating || '4.5'}</ThemedText>
               <SolarStarBold size={normalize.width(16)} color="#FFB801" />
            </View>

           {/* القلب في زاوية اليسرى مع خلفية الـ Svg */}
           <TouchableOpacity 
             style={styles.heartContainer} 
             onPress={() => setIsFavorite(!isFavorite)}
           >
              <View style={styles.svgBackground}>
                <Svg height="42" width="46" viewBox="14 0 32 40">
                  <Path d={STAR_SHAPE} fill="white" />
                </Svg>
              </View>
               <SolarHeartBold 
                 size={normalize.width(20)} 
                 color={isFavorite ? "#EA2129" : "#9CA3AF"} 
               />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title} numberOfLines={1}>{chalet.title}</ThemedText>
        </View>
        
        <View style={styles.locationRow}>
          <ThemedText style={styles.location} numberOfLines={1}>{chalet.location}</ThemedText>
           <SolarMapPointBold size={normalize.width(14)} color="#9CA3AF" />
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <ThemedText style={styles.price}>IQD {chalet.price}</ThemedText>
            <ThemedText style={styles.priceLabel}> / ليلة</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: normalize.radius(20),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    width: normalize.width(240),
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: "100%",
    height: normalize.height(180),
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: normalize.width(10), // المسافة الموحدة من الحواف (10 بكسل)
    paddingTop: normalize.height(10),
    width: '100%',
  },
  ratingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: normalize.width(10),
    paddingVertical: normalize.height(6),
    borderRadius: normalize.radius(10),
    gap: 4,
  },
  ratingText: {
    fontSize: normalize.font(14),
    fontFamily: "Alexandria-Black",
    color: '#111827',
  },
  heartContainer: {
    width: normalize.width(42),
    height: normalize.width(42),
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgBackground: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  infoContainer: {
    padding: normalize.width(12),
  },
  titleRow: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: "#111827",
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: normalize.font(12),
    color: "#6B7280",
   fontFamily: "Alexandria-Regular" },
  priceContainer: {
    marginTop: normalize.height(12),
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: normalize.font(16),
    fontFamily: "Alexandria-Black",
    color: "#111827",
  },
  priceLabel: {
    fontSize: normalize.font(12),
    color: "#6B7280",
   fontFamily: "Alexandria-Regular" },
});
