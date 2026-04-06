import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SolarIcon } from '@/components/ui/solar-icon';
import { CircleBackButton } from '@/components/ui/circle-back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const reviews = [
    { name: 'انسة انس', rating: 4, body: 'خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير', date: '2025/09/22' },
    { name: 'انسة انس', rating: 5, body: 'خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير', date: '2025/09/22' },
    { name: 'انسة انس', rating: 3, body: 'خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير', date: '2025/09/22' },
    { name: 'انسة انس', rating: 2, body: 'خوش مكان ونضيف يستاهل، الهواء نقي بسبب التشجير', date: '2025/09/22' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* هيدر الصفحة الموحد */}
      <View style={styles.header}>
          <View style={styles.backBtnWrapper}>
            <CircleBackButton />
          </View>
          <ThemedText style={styles.headerTitle}>المراجعات</ThemedText>
          <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          {/* ملخص التقييم العلوي - استخدام نجوم SolarIcon */}
          <View style={styles.summaryArea}>
             <ThemedText style={styles.bigRatingText}>4.6</ThemedText>
             <View style={styles.starsRow}>
                {[1, 2, 3].map(i => (
                  <SolarIcon key={i} name="star-bold" size={30} color="#15AB64" />
                ))}
                {[4, 5].map(i => (
                  <SolarIcon key={i} name="star-outline" size={30} color="#E5E7EB" />
                ))}
             </View>
          </View>

          {/* فلتر الترتيب */}
          <View style={styles.filterRow}>
             <View style={styles.filterBox}>
                <SolarIcon name="alt-arrow-down-outline" size={18} color="#035DF9" />
                <ThemedText style={styles.filterText}>اخر التقييمات</ThemedText>
             </View>
          </View>

          {/* قائمة المراجعات */}
          <View style={{ paddingHorizontal: 20 }}>
             {reviews.map((rev, idx) => (
                <View key={idx} style={styles.revCardFlat}>
                   <View style={styles.revHeader}>
                      {/* نجوم المراجعات الفردية بالفولدر المطلوب */}
                      <View style={styles.ratingAtLeft}>
                         <SolarIcon name="star-bold" size={16} color="#035DF9" />
                         <ThemedText style={styles.rateNum}>{rev.rating}</ThemedText>
                      </View>
                      <View style={styles.userMeta}>
                         <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                            <ThemedText style={styles.userName}>{rev.name}</ThemedText>
                            <ThemedText style={styles.revTextDesc}>{rev.body}</ThemedText>
                         </View>
                         <Image source={require('@/assets/profile.svg')} style={styles.userAvatar} />
                      </View>
                   </View>
                   {idx === 0 && (
                     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imgGallery}>
                        {[1, 2, 3, 4].map(im => <Image key={im} source={{ uri: 'https://images.unsplash.com/photo-1502082559145?w=200' }} style={styles.thumb} />)}
                     </ScrollView>
                   )}
                   <ThemedText style={styles.dateText}>{rev.date}</ThemedText>
                </View>
             ))}
          </View>
      </ScrollView>

      {/* الفوتر المطور - ملتصق بالأسفل تماماً */}
      <View style={styles.footerArea}>
          <Image source={require('@/assets/rating.svg')} style={styles.ratingBg} resizeMode="stretch" />
          <View style={styles.footerOverlay}>
             <View style={styles.whiteInputPill}>
                <ThemedText style={styles.questionText}>شكد تقيم تجربتك؟</ThemedText>
                <View style={styles.inputStars}>
                   {[1, 2, 3, 4, 5].map(i => (
                     <SolarIcon key={i} name="star-outline" size={28} color="#15AB64" />
                   ))}
                </View>
             </View>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, 
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6' 
  },
  backBtnWrapper: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  
  summaryArea: { alignItems: 'center', marginVertical: 30 },
  bigRatingText: { fontSize: 48, fontWeight: '900', marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 6 },
  
  filterRow: { paddingHorizontal: 20, alignItems: 'flex-end', marginBottom: 20 },
  filterBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  filterText: { fontSize: 13, fontWeight: '700' },
  
  revCardFlat: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#F3F4F6' },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingAtLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rateNum: { fontSize: 18, fontWeight: '900' },
  userMeta: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  userName: { fontSize: 16, fontWeight: '900' },
  revTextDesc: { fontSize: 12, color: '#6B7280', marginTop: 4, width: '90%', textAlign: 'right' },
  userAvatar: { width: 50, height: 50, borderRadius: 25 },
  imgGallery: { flexDirection: 'row', marginTop: 15 },
  thumb: { width: 110, height: 85, borderRadius: 10, marginRight: 10 },
  dateText: { fontSize: 11, color: '#9CA3AF', marginTop: 10, textAlign: 'left' },
  
  footerArea: { 
    position: 'absolute', bottom: 0, 
    width: SCREEN_WIDTH, height: 160,
    backgroundColor: 'transparent' // لضمان عدم وجود أي خلفية بيضاء تحت الصورة
  },
  ratingBg: { width: '100%', height: '100%' },
  footerOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', paddingBottom: 0 },
  whiteInputPill: { backgroundColor: 'white', width: '92%', height: 100, borderRadius: 50, padding: 15, alignItems: 'center', justifyContent: 'center' },
  questionText: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 10 },
  inputStars: { flexDirection: 'row', gap: 8 }
});
