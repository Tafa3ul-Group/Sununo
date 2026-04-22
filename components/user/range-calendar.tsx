import { ThemedText } from "@/components/themed-text";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SolarAltArrowLeftBold, SolarAltArrowRightBold } from "@/components/icons/solar-icons";
import { normalize, Colors } from "@/constants/theme";
import { useTranslation } from "react-i18next";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

interface RangeCalendarProps {
  onSelect?: (start: Date | null, end: Date | null) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export const RangeCalendar: React.FC<RangeCalendarProps> = ({ onSelect, initialStartDate, initialEndDate }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [viewDate, setViewDate] = useState(initialStartDate || new Date()); // The month currently being viewed
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        result.push(i);
    }
    return result;
  }, []);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      d.setHours(0, 0, 0, 0);
      days.push({ day: daysInPrevMonth - i, isCurrent: false, date: d });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      days.push({ day: i, isCurrent: true, date: d });
    }

    // Next month padding
    const remainingSlots = 42 - days.length; 
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      d.setHours(0, 0, 0, 0);
      days.push({ day: i, isCurrent: false, date: d });
    }

    return days;
  }, [year, month]);

  const handleDayPress = (date: Date) => {
    const pressedDate = new Date(date);
    pressedDate.setHours(0, 0, 0, 0);

    if (!startDate || (startDate && endDate)) {
      setStartDate(pressedDate);
      setEndDate(null);
    } else {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      if (pressedDate.getTime() === start.getTime()) {
         return;
      }

      if (pressedDate < start) {
        setStartDate(pressedDate);
        setEndDate(null);
      } else {
        setEndDate(pressedDate);
        onSelect?.(start, pressedDate);
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    const time = date.getTime();
    return time > startDate.getTime() && time < endDate.getTime();
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const selectYear = (y: number) => {
    setViewDate(new Date(y, month, 1));
    setShowYearPicker(false);
  };

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          {isRTL ? <SolarAltArrowRightBold size={20} color={Colors.text.primary} /> : <SolarAltArrowLeftBold size={20} color={Colors.text.primary} />}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setShowYearPicker(!showYearPicker)} style={styles.titleWrapper}>
          <ThemedText style={styles.monthTitle}>
            {MONTHS_NAMES[month]} {year}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          {isRTL ? <SolarAltArrowLeftBold size={20} color={Colors.text.primary} /> : <SolarAltArrowRightBold size={20} color={Colors.text.primary} />}
        </TouchableOpacity>
      </View>

      {showYearPicker ? (
        <View style={styles.yearPicker}>
            <View style={[styles.yearGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {years.map(y => (
                    <TouchableOpacity 
                        key={y} 
                        style={[styles.yearItem, y === year && styles.yearItemSelected]}
                        onPress={() => selectYear(y)}
                    >
                        <ThemedText style={[styles.yearText, y === year && styles.yearTextSelected]}>
                            {y}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity onPress={() => setShowYearPicker(false)} style={styles.closeYearBtn}>
                <ThemedText style={styles.closeYearText}>{isRTL ? 'إغلاق' : 'Close'}</ThemedText>
            </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.daysHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {DAYS.map((day) => (
              <ThemedText key={day} style={styles.dayHeaderText}>
                {day}
              </ThemedText>
            ))}
          </View>

          <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {calendarDays.map((item, index) => {
              const time = item.date.getTime();
              const isStart = !!startDate && time === startDate.getTime();
              const isEnd = !!endDate && time === endDate.getTime();
              const inRange = isInRange(item.date);

              return (
                <View key={`${item.day}-${index}`} style={styles.dayCellContainer}>
                  {/* ONLY render highlight for days strictly in range */}
                  {endDate && inRange && (
                    <View style={[styles.rangeHighlight, styles.rangeHighlightMiddle]} />
                  )}

                  <TouchableOpacity
                    onPress={() => handleDayPress(item.date)}
                    style={[
                      styles.dayCell,
                      (isStart || isEnd) && (isStart ? styles.startDaySelected : styles.endDaySelected),
                    ]}
                    disabled={!item.isCurrent}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        !item.isCurrent && styles.disabledDayText,
                        (isStart || isEnd) && styles.selectedDayText,
                        inRange && styles.inRangeDayText,
                      ]}
                    >
                      {item.day}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    width: "100%",
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Black",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  daysHeader: {
    backgroundColor: "#F7FCF9",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: normalize.font(12),
    fontFamily: "Tajawal-Black",
    color: "#15AB64",
  },
  grid: {
    flexWrap: "wrap",
  },
  dayCellContainer: {
    width: `${100 / 7}%`,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 1,
  },
  dayCell: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  rangeHighlight: {
    position: 'absolute',
    height: 32,
    backgroundColor: "#EFF9F5",
    zIndex: 1,
  },
  rangeHighlightMiddle: {
    width: '100%',
  },
  dayText: {
    fontSize: normalize.font(14),
    fontFamily: "Tajawal-SemiBold",
    color: "#1A1A1A",
  },
  disabledDayText: {
    color: "#D1D5DB",
    opacity: 0,
    fontFamily: "Tajawal-Regular"
  },
  startDaySelected: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  endDaySelected: {
    backgroundColor: "#15AB64",
    borderRadius: 12,
  },
  selectedDayText: {
    color: "white",
    fontFamily: "Tajawal-Bold",
  },
  inRangeDayText: {
    color: "#1A1A1A",
    fontFamily: "Tajawal-Regular"
  },
  titleWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  yearPicker: {
    padding: 10,
    alignItems: 'center',
  },
  yearGrid: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  yearItem: {
    width: '30%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  yearItemSelected: {
    backgroundColor: Colors.primary,
  },
  yearText: {
    fontSize: normalize.font(16),
    fontFamily: "Tajawal-Bold",
    color: '#1A1A1A',
  },
  yearTextSelected: {
    color: 'white',
    fontFamily: "Tajawal-Regular"
  },
  closeYearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeYearText: {
    color: Colors.primary,
    fontFamily: "Tajawal-Black",
    fontSize: normalize.font(14),
  },
});

