import { PrimaryButton } from "@/components/user/primary-button";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize, Typography, Spacing, Shadows } from "@/constants/theme";
import { HorizontalCard } from "@/components/user/horizontal-card";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Animated,
} from "react-native";
import { SolarIcon } from "@/components/ui/solar-icon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPER_HEIGHT = normalize.height(400);

// --- MOCK DATA SECTION ---
const MOCK_CHALET = {
  id: "mock-1",
  title: "شالية الؤلؤة البصرية",
  location: "البصرة - شط العرب",
  price: "45,000",
  rating: "4.9",
  description: "يتميز شاليه الؤلؤة البصرية بموقعه الساحر المطل على شط العرب، يوفر خصوصية تامة للعائلات مع تصميم عصري يجمع بين الرفاهية والراحة. يحتوي على مسبح كبير مزود بنظام تعقيم متطور وحدائق غناء مثالية للاسترخاء.",
  images: [
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=1000",
  ],
  specs: ["300 متر مربـع", "3 غرف نوم", "2 حمام حديث", "صالة ملكية"],
  amenities: [
    { label: "مسبح خارجي", icon: "water-bold", color: Colors.primary },
    { label: "واي فاي سريع", icon: "wifi-bold", color: Colors.secondary },
    { label: "تكييف مركزي", icon: "snowflake-bold", color: Colors.secondary },
    { label: "شاشة 65 بوصة", icon: "tv-bold", color: Colors.accent },
    { label: "موقف سيارات", icon: "car-bold", color: Colors.primary },
    { label: "حديقة جلسات", icon: "leaf-bold", color: Colors.secondary },
  ]
};

const SUGGESTED_CHALETS = [
  { id: 's1', title: 'شالية الياقوت', location: 'البصرة - القبلة', price: '35,000', rating: 4.7, image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400" },
  { id: 's2', title: 'منتجع السلطان', location: 'البصرة - الجزائر', price: '60,000', rating: 4.9, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400" }
];

export default function ChaletDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const navigateBack = () => router.back();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        
        {/* 1. Header Swiper */}
        <View style={styles.swiperContainer}>
          <FlatList
            data={MOCK_CHALET.images}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={({viewableItems}) => viewableItems.length > 0 && setActiveIndex(viewableItems[0].index)}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.swiperImage} contentFit="cover" />
            )}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          />
          
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
             <SolarIcon name="alt-arrow-left-linear" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.pagination}>
            {MOCK_CHALET.images.map((_, i) => {
              const width = scrollX.interpolate({
                inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
                outputRange: [8, 20, 8],
                extrapolate: "clamp",
              });
              return <Animated.View key={i} style={[styles.dot, { backgroundColor: i === activeIndex ? "white" : "rgba(255,255,255,0.4)", width }]} />;
            })}
          </View>
        </View>

        {/* 2. Content Info */}
        <View style={styles.contentWrapper}>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.chaletTitle}>{MOCK_CHALET.title}</Text>
              <View style={styles.ratingBox}>
                <SolarIcon name="star-bold" color={Colors.accent} size={20} />
                <Text style={styles.ratingText}>{MOCK_CHALET.rating}</Text>
              </View>
            </View>
            <Text style={styles.locationText}>{MOCK_CHALET.location}</Text>
          </View>

          {/* Specs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المواصفات الاساسية</Text>
            <View style={styles.specsRow}>
              {MOCK_CHALET.specs.map((spec, i) => (
                <View key={i} style={styles.specItem}>
                  <Text style={styles.specText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Amenities Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>الميزات المتاحة</Text>
               <TouchableOpacity><Text style={styles.seeAll}>عرض الكل</Text></TouchableOpacity>
            </View>
            <View style={styles.amenitiesGrid}>
              {MOCK_CHALET.amenities.map((item, idx) => (
                <View key={idx} style={styles.amenityBox}>
                   <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                      <SolarIcon name={item.icon as any} size={24} color={item.color} />
                   </View>
                   <Text style={styles.amenityLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Overview */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>نظرة عامة</Text>
             <Text style={styles.description}>{MOCK_CHALET.description}</Text>
          </View>

          {/* Suggested List */}
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>شاليهات مقترحة</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingVertical: 10 }}>
                {SUGGESTED_CHALETS.map(item => (
                  <HorizontalCard key={item.id} chalet={item} onPress={() => router.push(`/chalet-details/${item.id}`)} />
                ))}
             </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* 3. Footer Booking */}
      <View style={styles.footer}>
         <View style={styles.priceContainer}>
            <Text style={styles.footerPrice}>{MOCK_CHALET.price} د.ع</Text>
            <Text style={styles.footerPriceSub}>/ شفت (صباحي ومسائي)</Text>
         </View>
         <PrimaryButton label="احجز الان" onPress={() => {}} style={{ width: 140 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  swiperContainer: { height: SWIPER_HEIGHT, position: 'relative' },
  swiperImage: { width: SCREEN_WIDTH, height: SWIPER_HEIGHT },
  backButton: { position: "absolute", top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: "white", justifyContent: "center", alignItems: "center" },
  pagination: { position: "absolute", bottom: 25, alignSelf: "center", flexDirection: "row", gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  contentWrapper: { padding: 20, marginTop: -20, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  headerInfo: { marginBottom: 25, alignItems: 'flex-end' },
  titleRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  chaletTitle: { fontSize: 24, fontWeight: "900", color: "#111827", textAlign: 'right' },
  ratingBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  locationText: { fontSize: 14, color: "#6B7280", marginTop: 5, textAlign: 'right' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", textAlign: 'right', marginBottom: 15 },
  specsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  specItem: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#F0F7FF', borderRadius: 12 },
  specText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  amenitiesGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  amenityBox: { width: '31%', alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  amenityLabel: { fontSize: 12, fontWeight: '700', color: '#4B5563', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 24, color: '#4B5563', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 95, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row-reverse', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  priceContainer: { alignItems: 'flex-end' },
  footerPrice: { fontSize: 22, fontWeight: '900', color: Colors.primary },
  footerPriceSub: { fontSize: 12, color: '#9CA3AF' },
});
