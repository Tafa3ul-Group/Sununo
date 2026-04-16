import { HeaderSection } from "@/components/header-section";
import { ReviewCard } from "@/components/user/review-card";
import { SecondaryButton } from "@/components/user/secondary-button";
import { SecondaryButtonInverse } from "@/components/user/secondary-button-inverse";
import { normalize } from "@/constants/theme";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  View,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MOCK_REVIEWS = [
  {
    id: "1",
    chaletId: "1",
    chaletTitle: { ar: "شالية الاروع علة الطلاق", en: "Most Amazing Chalet" },
    chaletLocation: { ar: "البصرة - الجزائر", en: "Basra - Algeria" },
    price: "30,000",
    chaletImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
    userName: "آنسة آنس",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    rating: 4,
    comment: { 
        ar: "خوش مكان ونظيف يستاهل، الهواء نقي بسبب التشجير", 
        en: "Nice and clean place, worth it. Fresh air due to the trees." 
    },
    gallery: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=200",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200",
    ],
    date: "2025/09/22",
    status: "pending"
  },
  {
    id: "2",
    chaletId: "2",
    chaletTitle: { ar: "شالية منتجع النخيل", en: "Palm Resort Chalet" },
    chaletLocation: { ar: "البصرة - شط العرب", en: "Basra - Shatt al-Arab" },
    price: "45,000",
    chaletImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    userName: "علي محمد",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    rating: 5,
    comment: { 
        ar: "تجربة رائعة جداً، الخدمات متكاملة والمسبح نظيف جداً.", 
        en: "Very wonderful experience, complete services and the pool is very clean." 
    },
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200",
    ],
    date: "2025/10/05",
    status: "reviewed"
  }
];

export default function ReviewsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");

  const filteredReviews = MOCK_REVIEWS.filter(r => r.status === activeTab);

  const renderReviewItem = ({ item }: { item: typeof MOCK_REVIEWS[0] }) => {
    const title = isRTL ? item.chaletTitle.ar : item.chaletTitle.en;
    const location = isRTL ? item.chaletLocation.ar : item.chaletLocation.en;
    const comment = isRTL ? item.comment.ar : item.comment.en;

    return (
      <ReviewCard 
        review={{
          ...item,
          chaletTitle: title,
          chaletLocation: location,
          comment: comment
        }} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderSection 
        title={t('headers.reviews')} 
        showBackButton 
        showLogo={false} 
      />

      {/* Tabs matching the design using the same buttons as review drawer */}
      <View style={[styles.tabsWrapper, { flexDirection: isRTL ? 'row' : 'row' }]}>
        {isRTL ? (
          <>
            <View style={styles.tabItem}>
              {activeTab === 'pending' ? (
                <SecondaryButtonInverse
                  label={t('reviews.pending')}
                  onPress={() => setActiveTab('pending')}
                  isActive={true}
                  style={{ width: '100%' }}
                />
              ) : (
                <SecondaryButton
                  label={t('reviews.pending')}
                  onPress={() => setActiveTab('pending')}
                  isActive={false}
                  style={{ width: '100%' }}
                />
              )}
            </View>
            <View style={styles.tabItem}>
              {activeTab === 'reviewed' ? (
                <SecondaryButtonInverse
                  label={t('reviews.reviewed')}
                  onPress={() => setActiveTab('reviewed')}
                  isActive={true}
                  style={{ width: '100%' }}
                />
              ) : (
                <SecondaryButton
                  label={t('reviews.reviewed')}
                  onPress={() => setActiveTab('reviewed')}
                  isActive={false}
                  style={{ width: '100%' }}
                />
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.tabItem}>
              {activeTab === 'pending' ? (
                <SecondaryButtonInverse
                  label={t('reviews.pending')}
                  onPress={() => setActiveTab('pending')}
                  isActive={true}
                  style={{ width: '100%' }}
                />
              ) : (
                <SecondaryButton
                  label={t('reviews.pending')}
                  onPress={() => setActiveTab('pending')}
                  isActive={false}
                  style={{ width: '100%' }}
                />
              )}
            </View>
            <View style={styles.tabItem}>
              {activeTab === 'reviewed' ? (
                <SecondaryButtonInverse
                  label={t('reviews.reviewed')}
                  onPress={() => setActiveTab('reviewed')}
                  isActive={true}
                  style={{ width: '100%' }}
                />
              ) : (
                <SecondaryButton
                  label={t('reviews.reviewed')}
                  onPress={() => setActiveTab('reviewed')}
                  isActive={false}
                  style={{ width: '100%' }}
                />
              )}
            </View>
          </>
        )}
      </View>

      <FlatList
        data={filteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabItem: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
});
