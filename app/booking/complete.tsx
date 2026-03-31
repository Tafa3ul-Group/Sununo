import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize, Shadows } from '@/constants/theme';
import { PrimaryButton } from '@/components/user/primary-button';
import { SolarIcon } from '@/components/ui/solar-icon';
import { ExIcon } from '@/components/ui/ex-icon';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS = ['SAT', 'FRI', 'THU', 'WED', 'TUE', 'MON', 'SUN'];
const MONTH_NAME = 'MARCH 2024';

export default function CompleteBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState(15);
  const [selectedShift, setSelectedShift] = useState<'morning' | 'evening' | null>('morning');

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to next step
  };

  const renderCalendarDay = (day: number | string, isCurrentMonth = true, isDisabled = false, isSelected = false) => {
    if (day === '') return <View key={Math.random()} style={styles.dayCell} />;
    
    return (
      <TouchableOpacity 
        key={day}
        disabled={isDisabled}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDayCell,
          isDisabled && styles.disabledDayCell
        ]}
        onPress={() => {
          if (!isDisabled) {
            setSelectedDate(day as number);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <ThemedText style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          isDisabled && styles.disabledDayText
        ]}>
          {day}
        </ThemedText>
        {isDisabled && (
           <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
             <ExIcon color="#94A3B8" />
           </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: 'اكتمال الحجز',
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-forward" size={24} color="#111827" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.logoContainer}>
             <SolarIcon name="globus-linear" size={28} color="#035DF9" />
          </View>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Steps Indicator */}
        <View style={styles.stepsContainer}>
           <View style={styles.peanutTabsContainer}>
              <View style={[styles.peanutCircle, styles.peanutActive, { zIndex: 3 }]}>
                <ThemedText style={styles.activeStepText}>شوكت</ThemedText>
              </View>
              <View style={[styles.peanutCircle, { zIndex: 2, marginLeft: -20 }]}>
                <ThemedText style={[styles.inactiveStepText, { color: '#059669' }]}>منو</ThemedText>
              </View>
              <View style={[styles.peanutCircle, { zIndex: 1, marginLeft: -20 }]}>
                <ThemedText style={[styles.inactiveStepText, { color: '#EA580C' }]}>التفصيل</ThemedText>
              </View>
           </View>
        </View>

        {/* 2. Date Quick Selection */}
        <View style={styles.quickDatesRow}>
            <View style={styles.dateBadgeActive}>
               <ThemedText style={styles.dateBadgeTextActive}>15</ThemedText>
            </View>
            <View style={styles.dateBadge}>
               <ThemedText style={styles.dateBadgeText}>18</ThemedText>
            </View>
            <TouchableOpacity style={styles.addDateBtn}>
               <Ionicons name="add" size={20} color="#94A3B8" />
            </TouchableOpacity>
        </View>

        {/* 3. Calendar View */}
        <View style={styles.calendarCard}>
           <ThemedText style={styles.calendarMonthTitle}>{MONTH_NAME}</ThemedText>
           
           <View style={styles.daysHeader}>
              {DAYS.map(d => (
                <ThemedText key={d} style={styles.dayHeaderCell}>{d}</ThemedText>
              ))}
           </View>

           <View style={styles.daysGrid}>
              {[
                { d: ' ', disabled: true }, { d: ' ', disabled: true }, 1, 2, 3, 4, 5,
                { d: ' ', disabled: true }, { d: ' ', disabled: true }, { d: ' ', disabled: true }, { d: ' ', disabled: true }, { d: ' ', disabled: true }, 11, 12,
                13, 14, 15, 16, 17, 18, 19,
                20, 21, 22, 23, 24, 25, 26,
                27, 28, 29, 30, { d: 31, disabled: true }, 1, 2
              ].map((item, idx) => {
                const day = typeof item === 'object' ? item.d : item;
                const disabled = typeof item === 'object' ? item.disabled : false;
                const isSelected = day === selectedDate && !disabled;
                return renderCalendarDay(day, true, disabled, isSelected);
              })}
           </View>
        </View>

        {/* 4. Shift Selection */}
        <View style={styles.shiftsContainer}>
           <TouchableOpacity 
             style={[styles.shiftCard, selectedShift === 'morning' && styles.shiftCardActive]}
             onPress={() => setSelectedShift('morning')}
           >
              <View style={styles.shiftLeft}>
                <View style={[styles.shiftIconBox, { backgroundColor: '#FEF9C3' }]}>
                  <SolarIcon name="sun-bold" size={22} color="#F59E0B" />
                </View>
                <ThemedText style={styles.shiftTitle}>الفترة الصباحية</ThemedText>
              </View>
              <ThemedText style={styles.shiftTime}>9:00 ص - 3:00 م</ThemedText>
           </TouchableOpacity>

           <TouchableOpacity 
             style={[styles.shiftCard, selectedShift === 'evening' && styles.shiftCardActive]}
             onPress={() => setSelectedShift('evening')}
           >
              <View style={styles.shiftLeft}>
                <View style={[styles.shiftIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <SolarIcon name="moon-bold" size={20} color="#035DF9" />
                </View>
                <ThemedText style={styles.shiftTitle}>الفترة المسائية</ThemedText>
              </View>
              <ThemedText style={styles.shiftTime}>4:00 م - 8:00 م</ThemedText>
           </TouchableOpacity>
        </View>

        {/* 5. Delete Day Link */}
        <TouchableOpacity style={styles.deleteDayBtn}>
          <ThemedText style={styles.deleteDayText}>حذف اليوم</ThemedText>
        </TouchableOpacity>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
         <PrimaryButton 
           label="التالي" 
           onPress={handleNext}
           style={styles.nextBtn}
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
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  backBtn: {
    paddingLeft: 10,
  },
  logoContainer: {
    paddingRight: 15,
  },
  stepsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  peanutTabsContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peanutCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.small,
  },
  peanutActive: {
    backgroundColor: '#035DF9',
    borderColor: '#035DF9',
  },
  activeStepText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  inactiveStepText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickDatesRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 25,
    gap: 12,
  },
  dateBadgeActive: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#035DF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadgeTextActive: {
    fontSize: 18,
    fontWeight: '800',
    color: '#035DF9',
  },
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
  },
  addDateBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.small,
  },
  calendarMonthTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 20,
    letterSpacing: 1,
  },
  daysHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dayHeaderCell: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    width: (SCREEN_WIDTH - 120) / 7,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 100) / 7,
    height: (SCREEN_WIDTH - 100) / 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  selectedDayCell: {
    backgroundColor: '#035DF9',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '800',
  },
  disabledDayText: {
    color: '#CBD5E1',
    fontWeight: '400',
  },
  disabledDayCell: {
    opacity: 0.6,
  },
  shiftsContainer: {
    marginTop: 25,
    gap: 12,
  },
  shiftCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  shiftCardActive: {
    backgroundColor: '#F0F5FF',
    borderColor: '#035DF9',
  },
  shiftLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  shiftIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  shiftTime: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  deleteDayBtn: {
    alignItems: 'center',
    marginTop: 30,
    padding: 10,
  },
  deleteDayText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  nextBtn: {
    width: '100%',
    height: 58,
  }
});
