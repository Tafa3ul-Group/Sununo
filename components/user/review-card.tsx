import { normalize } from "@/constants/theme";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import Svg, { ClipPath, Defs, G, Path, Image as SvgImage } from "react-native-svg";
import { ThemedText } from "@/components/themed-text";
import { SolarStarBold, SolarTrashBinMinimalisticLinear } from "@/components/icons/solar-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES_CONFIG = [
  {
    viewBox: "0 0 132 114",
    width: 100,
    height: 86,
    path: "M78.7725 2C93.5962 2.00003 106.408 5.61551 115.473 12.8877C124.473 20.1084 130 31.1096 130 46.416C130 63.2797 118.126 78.4796 102.275 90.1074C86.4772 101.697 67.2293 109.354 53.5078 111.289C39.5004 113.265 27.4662 111.112 18.5918 104.994C9.7592 98.905 3.76485 88.6866 2.18652 73.9004C0.804578 60.9535 7.14433 42.9634 20.3965 28.1426C33.584 13.3941 53.4373 2 78.7725 2Z",
  },
  {
    viewBox: "0 0 114 123",
    width: 100,
    height: 108,
    path: "M9.85254 5.08691C14.303 2.08842 19.387 1.22337 25.6074 2.71387C31.9189 4.22619 39.3773 8.16551 48.3428 14.8115H48.3438C54.6721 19.5016 59.3722 22.5133 64.3926 24.5186C69.4237 26.5281 74.6565 27.4793 81.9785 28.2354C89.7218 29.0339 96.005 30.5378 100.782 32.6768C105.556 34.8141 108.71 37.5308 110.416 40.7041C113.775 46.9529 112.057 56.2142 102.497 69.0352C99.6073 72.9109 97.0067 77.4337 94.4863 82.1016C91.9384 86.8204 89.5052 91.6208 86.8477 96.2988C81.6969 105.366 76.0449 113.313 68.3633 117.591L67.6133 117.993C54.4846 124.782 38.8124 119.692 32.084 106.556L31.7705 105.924C27.2088 96.4439 25.495 86.9985 23.3047 77.1934C21.1955 67.7511 18.6595 58.0937 12.5859 48.4355L11.9873 47.501L11.2256 46.3125C7.41426 40.2506 3.62112 32.4694 2.40234 24.999C1.11592 17.1139 2.71008 9.9001 9.85254 5.08691Z",
  }
];

interface ReviewCardProps {
  review: {
    chaletTitle: string;
    chaletLocation: string;
    price: string;
    chaletImage: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    gallery: string[];
    date: string;
  };
  onDelete?: () => void;
  onPressChalet?: () => void;
}

export function ReviewCard({ review, onDelete, onPressChalet }: ReviewCardProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const config = SHAPES_CONFIG[0]; // Using first shape for simplicity or random

  return (
    <View style={styles.card}>
      {/* Top Section: Delete icon + Chalet Info + Image */}
      <View style={[styles.topSection, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <View style={styles.deleteCircle}>
               <SolarTrashBinMinimalisticLinear size={24} color="#F64200" />
            </View>
        </TouchableOpacity>

        <View style={[styles.chaletInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <ThemedText style={styles.chaletTitle} numberOfLines={1}>{review.chaletTitle}</ThemedText>
          <ThemedText style={styles.chaletLocation}>{review.chaletLocation}</ThemedText>
          <ThemedText style={styles.priceText}>
            {t('common.iqd')} {review.price} / {t('common.shift')}
          </ThemedText>
        </View>

        <TouchableOpacity onPress={onPressChalet}>
          <Svg
            width={normalize.width(100)}
            height={normalize.height(86)}
            viewBox={config.viewBox}
          >
            <Defs>
              <ClipPath id="clip">
                <Path d={config.path} />
              </ClipPath>
            </Defs>
            <G clipPath="url(#clip)">
              <SvgImage
                href={{ uri: review.chaletImage }}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid slice"
              />
            </G>
            {/* Border path - optional if you want a stroke */}
            <Path d={config.path} stroke="#035DF9" strokeWidth="2" fill="none" />
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Middle Section: User Info + Rating */}
      <View style={[styles.userSection, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
         <View style={[styles.userInfo, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <Image source={{ uri: review.userAvatar }} style={styles.avatar} />
            <ThemedText style={styles.userName}>{review.userName}</ThemedText>
         </View>
         
         <View style={[styles.ratingPill, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            <SolarStarBold size={16} color="#035DF9" />
            <ThemedText style={styles.ratingText}>{review.rating}</ThemedText>
         </View>
      </View>

      {/* Bottom Section: Comment + Gallery + Date */}
      <View style={[styles.bottomSection, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <ThemedText style={[styles.commentText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {review.comment}
        </ThemedText>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.galleryScroll}
          contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}
        >
          {review.gallery.map((img, idx) => (
            <Image key={idx} source={{ uri: img }} style={styles.galleryThumb} />
          ))}
        </ScrollView>

        <ThemedText style={styles.dateText}>{review.date}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topSection: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF5F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE4DD",
  },
  chaletInfo: {
    flex: 1,
  },
  chaletTitle: {
    fontSize: 16,
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  chaletLocation: {
    fontSize: 13,
    color: "#6B7280",
    marginVertical: 2,
    fontFamily: "LamaSans-Medium",
  },
  priceText: {
    fontSize: 14,
    fontFamily: "LamaSans-ExtraBold",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  userSection: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userInfo: {
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userName: {
    fontSize: 15,
    fontFamily: "LamaSans-Black",
    color: "#111827",
  },
  ratingPill: {
    backgroundColor: "#F0F6FE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: "LamaSans-Bold",
    color: "#035DF9",
  },
  bottomSection: {
    marginTop: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "LamaSans-Medium",
  },
  galleryScroll: {
    marginTop: 12,
    marginBottom: 12,
  },
  galleryThumb: {
    width: 90,
    height: 70,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "LamaSans-Medium",
  },
});
