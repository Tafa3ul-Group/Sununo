import { ThemedText } from "@/components/themed-text";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface RangeCalendarProps {
  onSelect?: (start: Date | null, end: Date | null) => void;
}

export const RangeCalendar: React.FC<RangeCalendarProps> = ({ onSelect }) => {
  const [startDate, setStartDate] = useState<number | null>(18);
  const [endDate, setEndDate] = useState<number | null>(15);

  const month = "MARCH 2024";

  const calendarDays = useMemo(() => {
    const prevMonth = [27, 28];
    const currentMonth = Array.from({ length: 31 }, (_, i) => i + 1);
    const nextMonth = [1, 2];

    return [
      ...prevMonth.map((d) => ({ day: d, isCurrent: false })),
      ...currentMonth.map((d) => ({ day: d, isCurrent: true })),
      ...nextMonth.map((d) => ({ day: d, isCurrent: false })),
    ];
  }, []);

  const handleDayPress = (day: number, isCurrent: boolean) => {
    if (!isCurrent) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else {
      setEndDate(day);
    }
  };

  const isBetween = (day: number) => {
    if (!startDate || !endDate) return false;
    const min = Math.min(startDate, endDate);
    const max = Math.max(startDate, endDate);
    return day > min && day < max;
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <ThemedText style={styles.monthTitle}>{month}</ThemedText>

      {/* Days Header */}
      <View style={styles.daysHeader}>
        {DAYS.map((day) => (
          <ThemedText key={day} style={styles.dayHeaderText}>
            {day}
          </ThemedText>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {calendarDays.map((item, index) => {
          const isSelectedStart = item.isCurrent && startDate === item.day;
          const isSelectedEnd = item.isCurrent && endDate === item.day;
          const isInRange = item.isCurrent && isBetween(item.day);

          return (
            <TouchableOpacity
              key={`${item.day}-${index}`}
              onPress={() => handleDayPress(item.day, item.isCurrent)}
              style={[
                styles.dayCell,
                isSelectedStart && styles.startDaySelected,
                isSelectedEnd && styles.endDaySelected,
                isInRange && styles.dayInRange,
              ]}
              disabled={!item.isCurrent}
            >
              <ThemedText
                style={[
                  styles.dayText,
                  !item.isCurrent && styles.disabledDayText,
                  (isSelectedStart || isSelectedEnd) && styles.selectedDayText,
                  isInRange && styles.inRangeDayText,
                ]}
              >
                {item.day}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingTop: 10,
    width: "100%",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 24,
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  daysHeader: {
    flexDirection: "row",
    backgroundColor: "#F7FCF9",
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 0,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  disabledDayText: {
    color: "#D1D5DB",
  },
  startDaySelected: {
    backgroundColor: "#035DF9",
    borderRadius: 12,
  },
  endDaySelected: {
    backgroundColor: "#15AB64",
    borderRadius: 12,
  },
  selectedDayText: {
    color: "white",
    fontWeight: "700",
  },
  dayInRange: {
    backgroundColor: "#EFF9F5",
  },
  inRangeDayText: {
    color: "#1A1A1A",
  },
});
