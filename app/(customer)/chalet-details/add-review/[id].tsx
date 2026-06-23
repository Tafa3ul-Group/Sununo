import { HeaderSection } from "@/components/header-section";
import { SolarStarBold, SolarStarLinear } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/components/user/primary-button";
import { Shadows } from "@/constants/theme";

import { useCreateReviewMutation } from "@/store/api/customerApiSlice";
import { logEvent } from "@/services/analytics";
import { ANALYTICS_EVENTS } from "@/constants/analytics-events";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useDirection } from "@/i18n";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface StarButtonProps {
  index: number;
  filled: boolean;
  onSelect: (index: number) => void;
}

const StarButton = React.memo(function StarButton({
  index,
  filled,
  onSelect,
}: StarButtonProps) {
  // Subtle press-scale feedback (no design change).
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 110 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 220 });
      }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onSelect(index);
      }}
      style={[styles.starTouch, pressStyle]}
    >
      {filled ? (
        <Animated.View key="filled" entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <SolarStarBold size={40} color="#FFB800" />
        </Animated.View>
      ) : (
        <Animated.View key="empty" entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <SolarStarLinear size={40} color="#E5E7EB" />
        </Animated.View>
      )}
    </AnimatedTouchable>
  );
});

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AddReviewScreen() {
  const { id: chaletId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { isRTL, textAlign } = useDirection();
  const isArabic = isRTL;
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const handleSelectRating = useCallback((value: number) => {
    setRating(value);
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        t("common.error"),
        isArabic ? "يرجى اختيار التقييم أولاً" : "Please select a rating first",
      );
      return;
    }

    try {
      await createReview({
        chaletId,
        rating,
        comment,
      }).unwrap();

      logEvent(ANALYTICS_EVENTS.SUBMIT_REVIEW, {
        item_id: String(chaletId),
        rating,
        review_length: comment?.length || 0,
      });

      Alert.alert(t("common.success"), t("profile.review.success"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      // For the demo purposes, we'll go back anyway if it's just a seed/demo environment issue
      Alert.alert(
        t("common.error"),
        isArabic ? "حدث خطأ أثناء إرسال المراجعة" : "Error sending review",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <HeaderSection
        title={t("chalet.details.addReview")}
        showBackButton={true}
        showLogo={false}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerArea}>
          <ThemedText style={styles.title}>
            {isArabic ? "كيف كانت تجربتك؟" : "How was your experience?"}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("profile.review.question")}
          </ThemedText>
        </View>

        <View style={styles.card}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <StarButton
                key={i}
                index={i}
                filled={i <= rating}
                onSelect={handleSelectRating}
              />
            ))}
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>
              {isArabic ? "تعليقك (اختياري)" : "Your comment (optional)"}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { textAlign },
              ]}
              placeholder={t("profile.review.placeholder")}
              multiline
              numberOfLines={6}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <PrimaryButton
            label={t("profile.review.send")}
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.submitBtn}
            height={56}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  headerArea: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
    gap: 10,
  },
  starTouch: {
    padding: 5,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#374151",
    marginBottom: 10,
    marginHorizontal: 4,
  },
  textInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 18,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
    minHeight: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  submitBtn: {
    marginTop: 10,
  },
});
