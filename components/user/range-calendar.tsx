import { ThemedText } from "@/components/themed-text";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SolarAltArrowLeftBold, SolarAltArrowRightBold } from "@/components/icons/solar-icons";
import { normalize, Colors } from "@/constants/theme";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const ScribbleIcon = () => (
  <View style={styles.scribbleOverlay}>
    <Svg width="27" height="17" viewBox="0 0 27 17" fill="none">
      <Path
        d="M0 16.3342C2.99573 15.595 6.40062 12.1931 8.87516 10.3499C10.7539 8.95056 12.5344 7.38786 14.3058 5.85133C15.4503 4.82162 19.3351 1.01248 20.5624 0.694205L20.6631 0.77428C20.0331 2.22304 14.0786 6.36758 12.7559 7.86821C11.9412 8.79263 7.05325 13.2599 7.16689 14.3823C8.4238 14.2945 20.3323 4.32336 22.0845 3.05699C22.8235 2.52284 25.1521 0.00923939 26.0467 0C25.8574 0.789872 23.2059 2.65758 22.4706 3.29904C20.984 4.59612 19.5563 5.88203 18.1625 7.28613C15.947 9.51811 13.851 11.1722 12.8732 14.3075C17.2857 12.4915 22.1018 7.57582 25.5124 4.21528C25.6825 4.04772 26.0097 3.8791 26.2404 3.85331L26.2836 3.96158C25.6618 5.40745 23.6597 6.68258 22.4926 7.82798C20.8697 9.42081 19.4171 10.9377 17.8686 12.5976C16.584 13.9747 15.835 14.5322 14.6548 16.1655C17.1806 14.0611 19.7304 11.9904 22.3426 9.9975C23.6692 8.98521 25.5394 7.29498 27 6.61685C26.3425 7.94963 24.3386 10.0783 23.3023 11.287C22.466 12.2624 20.8583 14.7933 20.0165 15.4373C20.7405 13.701 23.3785 10.5202 24.6847 9.04787L24.3797 8.92814C22.5227 10.2836 20.7462 11.839 18.9151 13.2C17.789 14.0368 14.9222 16.7536 13.7398 17L13.6411 16.9076C14.0857 15.7752 16.6737 13.1961 17.661 12.3097L17.6004 11.9123C16.9492 12.4276 16.274 12.9107 15.5771 13.36C14.9133 13.7883 13.7034 14.5621 12.9276 14.3859C11.7642 13.343 15.6221 9.27202 16.3942 8.42632L16.5078 7.99092C16.4879 8.0041 16.468 8.017 16.4482 8.03038C14.9312 9.05922 8.00045 15.1758 6.80779 14.882C6.77373 14.8736 6.7407 14.8611 6.70711 14.8507C6.35217 14.031 8.37052 11.9017 8.9202 11.2266L8.66679 10.9995C7.57776 11.9989 1.29986 17.3668 0 16.3342Z"
        fill="#1E293B"
      />
    </Svg>
  </View>
);

interface RangeCalendarProps {
  onSelect?: (start: Date | null, end: Date | null) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  reservedDates?: string[]; // ISO strings or YYYY-MM-DD
}

export const RangeCalendar: React.FC<RangeCalendarProps> = ({ onSelect, initialStartDate, initialEndDate, reservedDates = [] }) => {
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
    // Check if reserved
    const dateStr = date.toISOString().split('T')[0];
    if (reservedDates.includes(dateStr)) return;

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
              
              const dateStr = item.date.toISOString().split('T')[0];
              const isReserved = reservedDates.includes(dateStr);

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
                    disabled={!item.isCurrent || isReserved}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        !item.isCurrent && styles.disabledDayText,
                        (isStart || isEnd) && styles.selectedDayText,
                        inRange && styles.inRangeDayText,
                        isReserved && styles.bookedDayText,
                      ]}
                    >
                      {item.day}
                    </ThemedText>
                    {isReserved && <ScribbleIcon />}
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
    fontFamily: "Alexandria-Black",
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
    fontFamily: "Alexandria-Black",
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
    fontFamily: "Alexandria-SemiBold",
    color: "#1A1A1A",
  },
  disabledDayText: {
    color: "#D1D5DB",
    opacity: 0,
    fontFamily: "Alexandria-Regular"
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
    fontFamily: "Alexandria-Bold",
  },
  inRangeDayText: {
    color: "#1A1A1A",
    fontFamily: "Alexandria-Regular"
  },
  bookedDayText: {
    color: "#9CA3AF",
    fontFamily: "Alexandria-Regular",
  },
  scribbleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
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
    fontFamily: "Alexandria-Bold",
    color: '#1A1A1A',
  },
  yearTextSelected: {
    color: 'white',
    fontFamily: "Alexandria-Regular"
  },
  closeYearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeYearText: {
    color: Colors.primary,
    fontFamily: "Alexandria-Black",
    fontSize: normalize.font(14),
  },
});
