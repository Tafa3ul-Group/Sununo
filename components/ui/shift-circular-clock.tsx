import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText, Line } from 'react-native-svg';
import { normalize, Colors } from '@/constants/theme';
import { SolarIcon } from './solar-icon';

interface ShiftItem {
  shiftId: string;
  shiftName: { ar: string; en: string } | string;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  isAvailable: boolean;
  isOvernight: boolean;
  price?: number;
  status?: 'pending' | 'personal' | string;
}

interface CircularShiftClockProps {
  shifts: ShiftItem[];
  isRTL?: boolean;
  onShiftPress?: (id: string) => void;
  selectedId?: string | null;
}

const SIZE = Dimensions.get('window').width * 0.85;
const RADIUS = (SIZE - 60) / 2;
const CENTER = SIZE / 2;
const STROKE_WIDTH = 28;

// Convert HH:mm:ss to fraction of 24h day (0 to 1)
const timeToFraction = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h + m / 60) / 24;
};

// Convert fraction to degrees (where 0 fraction = top center = -90 deg in SVG land)
const fractionToDegrees = (fraction: number) => {
  return (fraction * 360) - 90;
};

// SVG arc math
const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  
  // if endAngle - startAngle > 180, set largeArcFlag to 1
  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;
  const largeArcFlag = diff <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

export const CircularShiftClock: React.FC<CircularShiftClockProps> = ({ 
  shifts, 
  isRTL, 
  onShiftPress,
  selectedId 
}) => {
  
  const getStatusColor = (shift: ShiftItem) => {
    if (shift.status === 'pending') return '#F59E0B'; // Yellow
    if (shift.status === 'personal') return '#0EA5E9'; // Blue
    return shift.isAvailable ? '#22C55E' : '#EF4444'; // Green : Red
  };

  const renderHoursLabels = () => {
    const labels = [];
    for (let i = 0; i < 24; i += 3) {
      const angle = (i * 15) - 90;
      const { x, y } = polarToCartesian(CENTER, CENTER, RADIUS + 25, angle);
      labels.push(
        <SvgText
          key={`h-${i}`}
          x={x}
          y={y + 5}
          fill="#64748B"
          fontSize="10"
          fontWeight="bold"
          fontFamily="LamaSans-Bold"
          textAnchor="middle"
        >
          {`${i === 12 ? '12h' : i === 0 ? '00h' : i + 'h'}`}
        </SvgText>
      );
    }
    return labels;
  };

  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i * 15) - 90;
      const inner = i % 6 === 0 ? RADIUS - 12 : RADIUS - 6;
      const p1 = polarToCartesian(CENTER, CENTER, inner, angle);
      const p2 = polarToCartesian(CENTER, CENTER, RADIUS - 2, angle);
      ticks.push(
        <Line
          key={`t-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={i % 6 === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}
          strokeWidth={i % 6 === 0 ? 2 : 1}
        />
      );
    }
    return ticks;
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.clockBody}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background Track */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          {/* Hour Markers & Ticks */}
          {renderTicks()}
          {renderHoursLabels()}

          {/* Shift Arcs */}
          {shifts.map((shift, index) => {
            const startFraction = timeToFraction(shift.startTime);
            const endFraction = timeToFraction(shift.endTime);
            
            let startDeg = fractionToDegrees(startFraction);
            let endDeg = fractionToDegrees(endFraction);
            
            if (endDeg < startDeg) endDeg += 360;

            const isSelected = selectedId === shift.shiftId;
            const color = getStatusColor(shift);

            return (
              <G key={shift.shiftId || index}>
                <Path
                  d={describeArc(CENTER, CENTER, RADIUS, startDeg, endDeg)}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? STROKE_WIDTH + 6 : STROKE_WIDTH}
                  strokeLinecap="round"
                  onPress={() => onShiftPress?.(shift.shiftId)}
                />
              </G>
            );
          })}

          {/* Center Info */}
          <G x={CENTER} y={CENTER}>
            <Circle r={RADIUS - 35} fill="rgba(255,255,255,0.03)" />
            <SvgText
              y={-5}
              fill="#FFF"
              fontSize="14"
              fontWeight="900"
              fontFamily="LamaSans-Black"
              textAnchor="middle"
            >
              {isRTL ? 'توزيع الأوقات' : 'Schedule Grid'}
            </SvgText>
            <SvgText
              y={15}
              fill="#94A3B8"
              fontSize="10"
              fontWeight="bold"
              fontFamily="LamaSans-Bold"
              textAnchor="middle"
            >
              {shifts.length} {isRTL ? 'شيفتات' : 'Total Slots'}
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* Legend / Info Bar below clock */}
      <View style={[styles.legend, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <LegendItem color="#22C55E" label={isRTL ? 'متاح' : 'Available'} />
        <LegendItem color="#EF4444" label={isRTL ? 'محجوز' : 'Booked'} />
        <LegendItem color="#F59E0B" label={isRTL ? 'انتظار' : 'Pending'} />
        <LegendItem color="#0EA5E9" label={isRTL ? 'شخصي' : 'Block'} />
      </View>
    </View>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#0F172A', // Dark Theme as requested
    borderRadius: 30,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  clockBody: {
    marginTop: 10,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingBottom: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: "LamaSans-Bold",
    textTransform: 'uppercase',
  },
});
