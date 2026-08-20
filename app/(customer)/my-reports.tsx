import { HeaderSection } from "@/components/header-section";
import { SolarDangerCircleBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Colors, normalize } from "@/constants/theme";
import { useDirection } from "@/i18n";
import { useGetMyComplaintsQuery } from "@/store/api/customerApiSlice";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * The reporter's side of «تبليغ عن مشكلة»: every report the user sent, with the
 * follow-up status and — once support writes one — the admin's note. Without
 * this screen the note the dashboard promises to show the reporter has nowhere
 * to land.
 */

type ComplaintStatus = "open" | "in_progress" | "resolved";

// Same three states the API stores, with the dashboard's own wording.
const STATUS_STYLES: Record<ComplaintStatus, { bg: string; fg: string }> = {
  open: { bg: "#FEF3C7", fg: "#B45309" },
  in_progress: { bg: "#DBEAFE", fg: "#1D4ED8" },
  resolved: { bg: "#DCFCE7", fg: "#15803D" },
};

export default function MyReportsScreen() {
  const { t } = useTranslation();
  const { textAlign } = useDirection();
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useGetMyComplaintsQuery({
    page: 1,
    limit: 50,
  });

  const reports: any[] = data?.data || [];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const status: ComplaintStatus = STATUS_STYLES[
      item.status as ComplaintStatus
    ]
      ? item.status
      : "open";
    const palette = STATUS_STYLES[status];

    return (
      <Animated.View
        entering={FadeInDown.delay((index % 8) * 60).duration(380)}
        style={styles.card}
      >
        <View style={[styles.cardHeader, { flexDirection: "row" }]}>
          <ThemedText
            style={[styles.cardTitle, { textAlign }]}
            numberOfLines={1}
          >
            {item.title || t("reportProblem.untitled")}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: palette.bg }]}>
            <ThemedText style={[styles.badgeText, { color: palette.fg }]}>
              {t(`reportProblem.status.${status}`)}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.cardBody, { textAlign }]}>
          {item.description}
        </ThemedText>

        <ThemedText style={[styles.cardDate, { textAlign }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>

        {!!item.adminNote && (
          <View style={styles.noteBox}>
            <ThemedText style={[styles.noteLabel, { textAlign }]}>
              {t("reportProblem.adminNoteLabel")}
            </ThemedText>
            <ThemedText style={[styles.noteText, { textAlign }]}>
              {item.adminNote}
            </ThemedText>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <HeaderSection
        title={t("reportProblem.myReportsTitle")}
        showBackButton={true}
        showLogo={false}
        onBackPress={() => router.back()}
      />

      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <EmptyState
              icon={
                <SolarDangerCircleBold
                  size={normalize.width(80)}
                  color={Colors.text.muted}
                />
              }
              title={t("reportProblem.myReportsEmpty")}
              description={t("reportProblem.myReportsEmptyDesc")}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Alexandria-Medium",
  },
  cardBody: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 10,
    fontFamily: "Alexandria-Medium",
    color: "#9CA3AF",
    marginTop: 8,
  },
  noteBox: {
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  noteLabel: {
    fontSize: 11,
    fontFamily: "Alexandria-Medium",
    color: Colors.primary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    color: "#374151",
    lineHeight: 20,
  },
});
