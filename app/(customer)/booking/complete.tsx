import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { normalize, Shadows } from '@/constants/theme';
import { PrimaryButton } from '@/components/user/primary-button';
import { 
  SolarSunBold, 
  SolarMoonBold, 
  SolarAddCircleBold,
  SolarAddBold,
  SolarMinusBold
} from "@/components/icons/solar-icons";
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { MainTabs, TabType } from '@/components/user/MainTabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleBackButton } from '@/components/ui/circle-back-button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS = ['SAT', 'FRI', 'THU', 'WED', 'TUE', 'MON', 'SUN'];
const MONTH_NAME = 'MARCH 2024';

const ScribbleIcon = () => (
    <View style={styles.scribbleOverlay}>
        <Svg width="27" height="17" viewBox="0 0 27 17" fill="none">
            <Path d="M0 16.3342C2.99573 15.595 6.40062 12.1931 8.87516 10.3499C10.7539 8.95056 12.5344 7.38786 14.3058 5.85133C15.4503 4.82162 19.3351 1.01248 20.5624 0.694205L20.6631 0.77428C20.0331 2.22304 14.0786 6.36758 12.7559 7.86821C11.9412 8.79263 7.05325 13.2599 7.16689 14.3823C8.4238 14.2945 20.3323 4.32336 22.0845 3.05699C22.8235 2.52284 25.1521 0.00923939 26.0467 0C25.8574 0.789872 23.2059 2.65758 22.4706 3.29904C20.984 4.59612 19.5563 5.88203 18.1625 7.28613C15.947 9.51811 13.851 11.1722 12.8732 14.3075C17.2857 12.4915 22.1018 7.57582 25.5124 4.21528C25.6825 4.04772 26.0097 3.8791 26.2404 3.85331L26.2836 3.96158C25.6618 5.40745 23.6597 6.68258 22.4926 7.82798C20.8697 9.42081 19.4171 10.9377 17.8686 12.5976C16.584 13.9747 15.835 14.5322 14.6548 16.1655C17.1806 14.0611 19.7304 11.9904 22.3426 9.9975C23.6692 8.98521 25.5394 7.29498 27 6.61685C26.3425 7.94963 24.3386 10.0783 23.3023 11.287C22.466 12.2624 20.8583 14.7933 20.0165 15.4373C20.7405 13.701 23.3785 10.5202 24.6847 9.04787L24.3797 8.92814C22.5227 10.2836 20.7462 11.839 18.9151 13.2C17.789 14.0368 14.9222 16.7536 13.7398 17L13.6411 16.9076C14.0857 15.7752 16.6737 13.1961 17.661 12.3097L17.6004 11.9123C16.9492 12.4276 16.274 12.9107 15.5771 13.36C14.9133 13.7883 13.7034 14.5621 12.9276 14.3859C11.7642 13.343 15.6221 9.27202 16.3942 8.42632L16.5078 7.99092C16.4879 8.0041 16.468 8.017 16.4482 8.03038C14.9312 9.05922 8.00045 15.1758 6.80779 14.882C6.77373 14.8736 6.7407 14.8611 6.70711 14.8507C6.35217 14.031 8.37052 11.9017 8.9202 11.2266L8.66679 10.9995C7.57776 11.9989 1.29986 17.3668 0 16.3342Z" fill="#334155"/>
        </Svg>
    </View>
);

export default function CompleteBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('SHOOKET');
  const [selectedDates, setSelectedDates] = useState<number[]>([15]);
  const [activeDateIdx, setActiveDateIdx] = useState(0);
  
  // Who tab state
  const [adultCount, setAdultCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(1);

  // Simulated booked dates
  const bookedDates = [2, 3, 4, 8, 9, 10, 11, 12, 31];
  const activeDate = selectedDates[activeDateIdx];

  // Shift selection per day
  const [dayShifts, setDayShifts] = useState<Record<number, { morning: boolean, evening: boolean }>>({
    15: { morning: true, evening: false }
  });

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === 'SHOOKET') {
        setActiveTab('MANO');
    } else if (activeTab === 'MANO') {
        setActiveTab('DETAILS');
    } else {
        router.push('/(customer)/booking/success');
    }
  };

  const toggleDayDate = (day: number) => {
    if (bookedDates.includes(day)) return;
    setSelectedDates(prev => {
        if (prev.includes(day)) return prev.filter(d => d !== day);
        return [...prev, day].sort((a, b) => a - b);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleShift = (type: 'morning' | 'evening') => {
      setDayShifts(prev => ({
          ...prev,
          [activeDate]: {
              ...(prev[activeDate] || { morning: false, evening: false }),
              [type]: !(prev[activeDate]?.[type])
          }
      }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderCalendarDay = (day: number | string) => {
    if (day === ' ') return <View key={`empty-${Math.random()}`} style={styles.dayCell} />;
    const isBooked = bookedDates.includes(day as number);
    const isSelected = selectedDates.includes(day as number);
    const isActive = activeDate === day;
    
    return (
      <TouchableOpacity 
        key={day}
        disabled={isBooked}
        style={[
          styles.dayCell,
          isActive && styles.activeDayCell,
          isSelected && !isActive && styles.selectedDayCellStroke,
        ]}
        onPress={() => {
            if (isSelected) setActiveDateIdx(selectedDates.indexOf(day as number));
            else toggleDayDate(day as number);
        }}
      >
        <ThemedText style={[styles.dayText, isActive && styles.activeDayText, isBooked && styles.bookedDayText]}>
          {day}
        </ThemedText>
        {isBooked && <ScribbleIcon />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header from Reviews Page style */}
      <View style={styles.header}>
        <View style={styles.backBtnWrapper}>
          <CircleBackButton />
        </View>
        <ThemedText style={styles.headerTitle}>اكتمال الحجز</ThemedText>
        <View style={styles.logoCircleHeader}>
           <Image source={require('@/assets/arlogo.svg')} style={styles.logoHeaderImg} resizeMode="contain" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Tabs */}
        <View style={styles.tabsContainer}>
            <MainTabs activeTab={activeTab} onChange={setActiveTab} />
        </View>

        {activeTab === 'SHOOKET' ? (
          <>
            {/* SHOOKET CONTENT (Calendar) */}
            <View style={styles.quickDatesRow}>
                {selectedDates.map((day, idx) => (
                    <TouchableOpacity 
                        key={day} 
                        onPress={() => setActiveDateIdx(idx)}
                        style={[styles.dateBadge, activeDateIdx === idx && styles.dateBadgeActive]}
                    >
                        <ThemedText style={[styles.dateBadgeText, activeDateIdx === idx && styles.dateBadgeTextActive]}>{day}</ThemedText>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addDateBtn}>
                    <SolarAddCircleBold size={24} color="#E2E8F0" />
                </TouchableOpacity>
            </View>

            <View style={styles.calendarCard}>
                <ThemedText style={styles.calendarMonthTitle}>{MONTH_NAME}</ThemedText>
                <View style={styles.daysHeader}>
                    {DAYS.map(d => <ThemedText key={d} style={styles.dayHeaderCell}>{d}</ThemedText>)}
                </View>
                <View style={styles.daysGrid}>
                    {[' ', ' ', 1, 2, 3, 4, 5, ' ', ' ', ' ', ' ', ' ', 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, ' ', ' '].map(renderCalendarDay)}
                </View>
            </View>

            <View style={styles.shiftsContainer}>
                <TouchableOpacity style={[styles.shiftCard, dayShifts[activeDate]?.morning && styles.shiftCardActive]} onPress={() => toggleShift('morning')}>
                    <View style={styles.shiftLeft}>
                        <View style={styles.shiftIconBox}><SolarSunBold size={22} color="#F59E0B" /></View>
                        <ThemedText style={styles.shiftTitle}>الفترة الصباحية</ThemedText>
                    </View>
                    <ThemedText style={styles.shiftTime}>9:00 ص - 3:00 م</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.shiftCard, dayShifts[activeDate]?.evening && styles.shiftCardActive]} onPress={() => toggleShift('evening')}>
                    <View style={styles.shiftLeft}>
                        <View style={styles.shiftIconBox}><SolarMoonBold size={20} color="#035DF9" /></View>
                        <ThemedText style={styles.shiftTitle}>الفترة المسائية</ThemedText>
                    </View>
                    <ThemedText style={styles.shiftTime}>4:00 م - 8:00 م</ThemedText>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteDayBtn} onPress={() => { setSelectedDates(prev => prev.filter((_, i) => i !== activeDateIdx)); setActiveDateIdx(0); }}>
                <ThemedText style={styles.deleteDayText}>حذف اليوم</ThemedText>
            </TouchableOpacity>
          </>
        ) : activeTab === 'MANO' ? (
          <>
            {/* MANO CONTENT (Who) */}
            <View style={styles.whoContainer}>
               <View style={styles.whoCard}>
                  <View style={styles.whoRow}>
                     <View style={styles.counterGroup}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setAdultCount(prev => prev + 1)}>
                           <SolarAddBold size={24} color="white" />
                        </TouchableOpacity>
                        <ThemedText style={styles.counterVal}>{adultCount}</ThemedText>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setAdultCount(Math.max(0, adultCount - 1))}>
                           <SolarMinusBold size={24} color="white" />
                        </TouchableOpacity>
                     </View>
                     <View style={styles.whoLabels}>
                        <ThemedText style={styles.whoMainLabel}>البالغين</ThemedText>
                        <ThemedText style={styles.whoSubLabel}>18 وأكثر</ThemedText>
                     </View>
                  </View>

                  <View style={[styles.whoRow, { borderBottomWidth: 0, marginTop: 15 }]}>
                     <View style={styles.counterGroup}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setChildrenCount(prev => prev + 1)}>
                           <SolarAddBold size={24} color="white" />
                        </TouchableOpacity>
                        <ThemedText style={styles.counterVal}>{childrenCount}</ThemedText>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setChildrenCount(Math.max(0, childrenCount - 1))}>
                           <SolarMinusBold size={24} color="white" />
                        </TouchableOpacity>
                     </View>
                     <View style={styles.whoLabels}>
                        <ThemedText style={styles.whoMainLabel}>الاطفال</ThemedText>
                        <ThemedText style={styles.whoSubLabel}>0 - 18</ThemedText>
                     </View>
                  </View>
               </View>
            </View>
          </>
        ) : (
            <View style={{ marginTop: 50, alignItems: 'center' }}><ThemedText>Details Step Placeholder</ThemedText></View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
         <PrimaryButton 
           label="التالي" 
           onPress={handleNext}
           style={[styles.nextBtn, activeTab === 'MANO' && { backgroundColor: '#F64200' }]}
         />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 150, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtnWrapper: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  logoCircleHeader: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
  },
  logoHeaderImg: { width: '70%', height: '70%' },
  tabsContainer: { marginTop: 20, alignItems: 'center' },
  quickDatesRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 30, gap: 12 },
  dateBadge: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  dateBadgeActive: { borderColor: '#035DF9', borderWidth: 1 },
  dateBadgeText: { fontSize: 18, fontWeight: '700', color: '#94A3B8' },
  dateBadgeTextActive: { color: '#035DF9', fontWeight: '800' },
  addDateBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  calendarCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, marginTop: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  calendarMonthTitle: { textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
  daysHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 5, marginBottom: 15, backgroundColor: '#F8FAFC', paddingVertical: 10, borderRadius: 12 },
  dayHeaderCell: { fontSize: 12, fontWeight: '900', color: '#1E293B', width: (SCREEN_WIDTH - 120) / 7, textAlign: 'center' },
  daysGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  dayCell: { width: (SCREEN_WIDTH - 100) / 7, height: (SCREEN_WIDTH - 100) / 7, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  activeDayCell: { backgroundColor: '#035DF9', borderRadius: 12 },
  selectedDayCellStroke: { borderWidth: 1, borderColor: '#035DF9', borderRadius: 12 },
  dayText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  activeDayText: { color: '#FFF', fontWeight: '900' },
  bookedDayText: { color: '#CBD5E1', fontWeight: '400' },
  scribbleOverlay: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 2, opacity: 0.4 },
  shiftsContainer: { marginTop: 25, gap: 12 },
  shiftCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: 'transparent' },
  shiftCardActive: { backgroundColor: '#F0F7FF', borderColor: '#035DF9' },
  shiftLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  shiftIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  shiftTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  shiftTime: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  deleteDayBtn: { alignItems: 'center', marginTop: 35, padding: 10 },
  deleteDayText: { color: '#EF4444', fontSize: 16, fontWeight: '800', textDecorationLine: 'underline' },
  whoContainer: { marginTop: 30 },
  whoCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 25, borderWidth: 1, borderColor: '#F1F5F9' },
  whoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 15 },
  counterGroup: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  counterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F64200', justifyContent: 'center', alignItems: 'center' },
  counterVal: { fontSize: 22, fontWeight: '900', color: '#1E293B', width: 30, textAlign: 'center' },
  whoLabels: { alignItems: 'flex-end' },
  whoMainLabel: { fontSize: 18, fontWeight: '900', color: '#111827' },
  whoSubLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 25, paddingTop: 15, paddingBottom: Platform.OS === 'ios' ? 40 : 25, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  nextBtn: { width: '100%', height: 64, borderRadius: normalize.radius(32) }
});
