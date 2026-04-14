import { ThemedText } from "@/components/themed-text";
import { Colors, normalize } from "@/constants/theme";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const BACK_ICON_PATH = "M16.9467 0L16.984 0.0319551C16.9918 0.563434 17.0077 1.11929 16.9957 1.64861C16.695 2.1116 15.6337 3.01428 15.2014 3.39902C13.6558 4.77432 11.2704 6.6148 10.1626 8.37453C9.66288 9.15572 9.33791 10.0399 9.21086 10.9642C8.96436 12.8514 9.38009 14.7291 10.5583 16.2312C11.0052 16.801 11.7141 17.4728 12.2449 17.9938L14.9532 20.6073C15.3814 21.0236 16.1485 21.753 16.4858 22.2046C16.5279 22.8117 16.5161 23.3931 16.4911 24C15.9468 23.8061 14.9671 23.3157 14.3994 23.0547L10.252 21.1529C8.50688 20.321 6.06286 19.4531 4.65913 18.0823C3.62117 17.0688 2.90487 15.0354 2.91724 13.5511C2.50593 13.4266 1.45728 12.5735 1.04287 12.2832C0.657269 12.013 0.433131 11.8682 0 11.6452C0.660173 11.1658 1.36011 10.727 2.0402 10.2775C2.31689 10.0946 2.85074 9.80927 3.07692 9.61241C3.09687 8.79841 3.17037 8.21858 3.46665 7.45396C3.85861 6.44889 4.52293 5.57892 5.38162 4.94608C6.58946 4.04845 8.20426 3.58706 9.56851 3.00721C10.8307 2.46863 12.0383 1.92053 13.319 1.40781C14.0582 1.1135 14.799 0.823459 15.5414 0.537748C16.0014 0.363519 16.5003 0.198389 16.9467 0Z";

interface DashboardCalendarProps {
  onSelect?: (start: Date | null, end: Date | null) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ onSelect, initialStartDate, initialEndDate }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [viewDate, setViewDate] = useState(initialStartDate || new Date());
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
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      d.setHours(0, 0, 0, 0);
      days.push({ day: daysInPrevMonth - i, isCurrent: false, date: d });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      days.push({ day: i, isCurrent: true, date: d });
    }
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
      if (pressedDate.getTime() === start.getTime()) return;

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
      {/* Month Navigation Header - Space Between for spacing arrows to ends */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Svg width={12} height={16} viewBox="0 0 17 24" fill="none" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
            <Path d={BACK_ICON_PATH} fill={Colors.primary} />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowYearPicker(!showYearPicker)} style={styles.titleWrapper}>
          <ThemedText style={styles.monthTitle}>
            {MONTHS_NAMES[month]} {year}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Svg width={12} height={16} viewBox="0 0 17 24" fill="none" style={{ transform: [{ scaleX: isRTL ? 1 : -1 }] }}>
            <Path d={BACK_ICON_PATH} fill={Colors.primary} />
          </Svg>
        </TouchableOpacity>
      </View>

      {showYearPicker ? (
        <View style={styles.yearPicker}>
          <View style={styles.yearGrid}>
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
          <View style={styles.daysHeader}>
            {DAYS.map((day) => (
              <ThemedText key={day} style={styles.dayHeaderText}>
                {day}
              </ThemedText>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((item, index) => {
              const time = item.date.getTime();
              const isStart = !!startDate && time === startDate.getTime();
              const isEnd = !!endDate && time === endDate.getTime();
              const inRange = isInRange(item.date);

              return (
                <View key={`${item.day}-${index}`} style={styles.dayCellContainer}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
  },
  monthTitle: {
    fontSize: normalize.font(16),
    fontWeight: "900", fontFamily: "LamaSans-Black",
    color: "#1A1A1A",
    textTransform: 'uppercase',
  },
  daysHeader: {
    flexDirection: "row",
    backgroundColor: "#F7FCF9",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: normalize.font(12),
    fontWeight: "800", fontFamily: "LamaSans-Black",
    color: "#15AB64",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellContainer: {
    width: `${100 / 7}%`,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    fontWeight: "600", fontFamily: "LamaSans-SemiBold",
    color: "#1A1A1A",
  },
  disabledDayText: {
    color: "#D1D5DB",
    opacity: 0,
   fontFamily: "LamaSans-Regular" },
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
    fontWeight: "700", fontFamily: "LamaSans-Bold",
  },
  inRangeDayText: {
    color: "#1A1A1A",
   fontFamily: "LamaSans-Regular" },
  yearPicker: {
    padding: 10,
    alignItems: 'center',
  },
  yearGrid: {
    flexDirection: 'row',
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
    fontWeight: '700', fontFamily: "LamaSans-Bold",
    color: '#1A1A1A',
  },
  yearTextSelected: {
    color: 'white',
   fontFamily: "LamaSans-Regular" },
  closeYearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeYearText: {
    color: Colors.primary,
    fontWeight: '800', fontFamily: "LamaSans-Black",
    fontSize: normalize.font(14),
  },
});
