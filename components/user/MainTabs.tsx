import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NAV_WIDTH = SCREEN_WIDTH - 32; // This ensures 16px margin on each side

export type TabType = "WHO" | "WHEN" | "WHERE";

interface MainTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export const MainTabs: React.FC<MainTabsProps> = ({ activeTab, onChange }) => {
  // ألوان التبويبات بناءً على التصميم
  const colors = {
    WHO: "#F64200", // منو (برتقالي)
    WHEN: "#15AB64", // شوكت (أخضر)
    WHERE: "#035DF9", // وين (أزرق)
  };

  // مسار الدائرة المتموجة (مأخوذ من الـ SVG الأصلي لـ "شوكت")
  const circlePath =
    "M182.611 4C199.804 4 214.712 15.8907 218.534 32.6534L218.679 33.2903C219.876 38.5389 219.814 43.9962 218.498 49.2164C214.678 64.3759 201.044 75 185.41 75H158.468C143.271 75 129.898 64.966 125.65 50.3744C123.916 44.4204 123.835 38.107 125.414 32.1104L125.598 31.4128C129.854 15.258 144.462 4 161.168 4L182.611 4Z";

  // تحديد التحويل (Transform) بناءً على التبويب النشط
  const getTranslateX = () => {
    switch (activeTab) {
      case "WHO":
        return -112; 
      case "WHEN":
        return 0;
      case "WHERE":
        return 112;
      default:
        return 0;
    }
  };

  return (
    <View style={[styles.container, { width: NAV_WIDTH }]}>
      {/* الـ SVG الأساسي كخلفية */}
      <View style={StyleSheet.absoluteFill}>
        <Svg
          width={NAV_WIDTH}
          height={80}
          viewBox="0 0 344 80"
          fill="none"
        >
          {/* المسار الخارجي الأبيض */}
          <Path
            d="M38 0.5H75.0938C81.5303 0.500033 87.6957 3.0928 92.1982 7.69238C101.908 17.6111 117.848 17.6917 127.658 7.87207L127.908 7.62207C132.463 3.06236 138.645 0.5 145.09 0.5H199.722C206.109 0.5 212.211 3.1475 216.573 7.8125C225.77 17.6461 241.244 18.0251 250.91 8.65332L252.125 7.47559C256.74 3.00186 262.915 0.5 269.342 0.5H306C326.711 0.5 343.5 17.2893 343.5 38V42C343.5 62.7107 326.711 79.5 306 79.5H269.168C262.826 79.5 256.713 77.132 252.025 72.8604L250.749 71.6973C240.999 62.8117 225.98 63.1793 216.676 72.5312C212.238 76.9919 206.205 79.5 199.913 79.5H144.91C138.554 79.5 132.436 77.0747 127.807 72.7188L127.544 72.4717C117.623 63.1365 102.127 63.2151 92.3008 72.6504C87.7235 77.0457 81.6232 79.4999 75.2773 79.5H38C17.2893 79.5 0.5 62.7107 0.5 42V38C0.5 17.2893 17.2893 0.5 38 0.5Z"
            fill="white"
            stroke="#EEEEEE"
          />

          {/* خلفية التبويب النشط (الدائرة المتحركة) */}
          <Path
            d={circlePath}
            fill={colors[activeTab]}
            transform={`translate(${getTranslateX()}, 0)`}
          />
        </Svg>
      </View>

      {/* أزرار التفاعل والنصوص */}
      <View style={styles.buttonsContainer}>
        {/* تبويب: منو (يسار) */}
        <TouchableOpacity
          onPress={() => onChange("WHO")}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "WHO" ? "white" : "#F64200" },
              activeTab === "WHO" && styles.activeTabText
            ]}
          >
            منو
          </Text>
        </TouchableOpacity>

        {/* تبويب: شوكت (وسط) */}
        <TouchableOpacity
          onPress={() => onChange("WHEN")}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "WHEN" ? "white" : "#15AB64" },
              activeTab === "WHEN" && styles.activeTabText
            ]}
          >
            شوكت
          </Text>
        </TouchableOpacity>

        {/* تبويب: وين (يمين) */}
        <TouchableOpacity
          onPress={() => onChange("WHERE")}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "WHERE" ? "white" : "#035DF9" },
              activeTab === "WHERE" && styles.activeTabText
            ]}
          >
            وين
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    alignSelf: 'center',
  },
  buttonsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 20,
    fontWeight: '900',
  },
  activeTabText: {
    transform: [{ scale: 1.1 }],
  },
});
