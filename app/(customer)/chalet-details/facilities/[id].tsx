import { HeaderSection } from "@/components/header-section";
import { SolarWidgetBold } from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { getImageSrc } from "@/hooks/useImageSrc";
import { isRTL, getFlexDirection } from "@/i18n";
import { RootState } from "@/store";
import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    View,
    I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useSelector } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SHAPES = {
  scalloped:
    "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

// Cycle through these colors for category headers
const CATEGORY_COLORS = [
  "#035DF9",
  "#15AB64",
  "#F64300",
  "#EF79D7",
  "#A855F7",
  "#06B6D4",
];

const SectionHeader = ({ title, isArabic }: { title: string; isArabic: boolean }) => {
  const needsCounter = isArabic !== I18nManager.isRTL;
  const alignStart = needsCounter ? "flex-end" : "flex-start";
  return (
    <View style={[styles.sectionHeader, { alignItems: alignStart }]}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
};

const FacilityCard = ({
  label,
  subtext,
  color,
  iconId,
  isArabic,
}: {
  label: string;
  subtext?: string;
  color: string;
  iconId?: string | null;
  isArabic: boolean;
}) => {
  // iconId from API is a UUID → load as image from server
  const imageSource = iconId ? getImageSrc(iconId) : null;
  const needsCounter = isArabic !== I18nManager.isRTL;
  const alignStart = needsCounter ? "flex-end" : "flex-start";

  return (
    <View style={[styles.cardContainer, { flexDirection: getFlexDirection(isArabic), gap: 15 }]}>
      <View
        style={[
          styles.textSide,
          {
            alignItems: alignStart,
          },
        ]}
      >
        <ThemedText style={styles.cardLabel}>{label}</ThemedText>
        {subtext && (
          <ThemedText
            style={[
              styles.cardSubtext,
              { textAlign: isArabic ? "right" : "left" },
            ]}
          >
            {subtext}
          </ThemedText>
        )}
      </View>
      <View style={styles.iconSideScalloped}>
        <Svg height={44} width={44} viewBox="0 0 60 60">
          <Path d={SHAPES.scalloped} fill={color} />
        </Svg>
        <View style={styles.iconCentered}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={{ width: 20, height: 20, tintColor: "white" }}
              resizeMode="contain"
            />
          ) : (
            <SolarWidgetBold size={18} color="white" />
          )}
        </View>
      </View>
    </View>
  );
};

export default function FacilitiesScreen() {
  const { id } = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { userType } = useSelector((state: RootState) => state.auth);

  const { data: response, isLoading } = useGetCustomerChaletDetailsQuery(id);
  const chaletData = response?.data || response;

  const categories = useMemo(() => {
    if (!chaletData?.chaletFeatures) return [];

    const grouped: Record<
      string,
      { name: string; colorIndex: number; features: any[] }
    > = {};
    let colorIdx = 0;

    chaletData.chaletFeatures.forEach((item: any) => {
      const feature = item.feature;
      if (!feature) return;

      const category = feature.category;
      const categoryId = category?.id || "other";

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          name: isArabic
            ? category?.name?.ar || category?.name
            : category?.name?.en || category?.name,
          colorIndex: colorIdx++,
          features: [],
        };
      }

      grouped[categoryId].features.push({
        id: feature.id,
        name: isArabic
          ? feature.name?.ar || feature.name
          : feature.name?.en || feature.name,
        // icon field from API is a UUID pointing to an image on the server
        iconId: feature.icon || null,
        value: item.value,
      });
    });

    return Object.values(grouped);
  }, [chaletData, isArabic]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <HeaderSection
        title={t("headers.facilities")}
        showBackButton
        showLogo={false}
        userType={userType}
      />

      <ScrollView
        style={{ backgroundColor: "#FFFFFF" }}
        contentContainerStyle={{
          paddingBottom: 50,
          backgroundColor: "#FFFFFF",
        }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          {categories.map((cat, idx) => (
            <View key={idx}>
              <SectionHeader title={cat.name} isArabic={isArabic} />
              {cat.features.map((feat, featIdx) => {
                const color =
                  CATEGORY_COLORS[cat.colorIndex % CATEGORY_COLORS.length];

                return (
                  <FacilityCard
                    key={feat.id}
                    label={feat.name}
                    subtext={feat.value}
                    color={color}
                    iconId={feat.iconId}
                    isArabic={isArabic}
                  />
                );
              })}
            </View>
          ))}

          {categories.length === 0 && (
            <View style={{ marginTop: 100, alignItems: "center" }}>
              <ThemedText style={{ color: "#9CA3AF" }}>
                {isArabic ? "لا توجد مرافق متاحة" : "No facilities available"}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  sectionHeader: {
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
  },
  textSide: { flex: 1 },
  cardLabel: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#111827",
  },
  cardSubtext: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 4,
    fontFamily: "Alexandria-Medium",
  },
  iconSideScalloped: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCentered: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});
