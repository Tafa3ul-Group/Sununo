import { HeaderSection } from "@/components/header-section";
import { SectionIcon } from "@/components/icons/section-icon";
import {
  SolarCloseCircleBold,
  SolarFireBold,
  SolarHome2Bold,
  SolarWaterBold,
  SolarWidgetBold,
  SolarAltArrowLeftBold,
  SolarAltArrowRightBold
} from "@/components/icons/solar-icons";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "@/components/user/secondary-button";
import { Colors, normalize } from "@/constants/theme";
import { RootState } from "@/store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { Image as ExpoImage } from "expo-image";
import { useDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

import { getImageSrc } from "@/hooks/useImageSrc";

import { useGetCustomerChaletDetailsQuery } from "@/store/api/customerApiSlice";

// Categories mapping helper
const CATEGORY_ICONS: Record<string, any> = {
  pool: (isActive: boolean) => (
    <SolarWaterBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  bbq: (isActive: boolean) => (
    <SolarFireBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  kitchen: (isActive: boolean) => (
    <SolarHome2Bold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  bath: (isActive: boolean) => (
    <SolarWaterBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
  default: (isActive: boolean) => (
    <SolarWidgetBold size={18} color={isActive ? "white" : "#035DF9"} />
  ),
};

const CATEGORY_COLORS: Record<string, string> = {
  pool: "#035DF9",
  bbq: "#F64200",
  kitchen: "#15AB64",
  bath: "#035DF9",
  default: Colors.primary,
};

const WavyHeader = ({ title, color }: { title: string; color: string }) => (
  <View style={styles.wavyHeaderContainer}>
    <SectionIcon
      color={color}
      title={title}
      width={SCREEN_WIDTH - 32}
      height={50}
    />
  </View>
);

export default function GalleryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chaletId = id as string;
  const { t } = useTranslation();
  const { userType } = useSelector((state: RootState) => state.auth);
  const { isRTL, rowDirection } = useDirection();
  const isArabic = isRTL;

  const [activeFilter, setActiveFilter] = useState("all");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState("");

  const { data: chaletData, isLoading } =
    useGetCustomerChaletDetailsQuery(chaletId);
  const chalet = chaletData?.data || chaletData || {};

  const gallerySections = useMemo(() => {
    if (!chalet.images) return [];

    const grouped: Record<string, any> = {};

    // Group images by category
    chalet.images.forEach((img: any) => {
      const categoryId = img.amenityCategory?.id || "general";
      const categoryName = isArabic
        ? img.amenityCategory?.name?.ar ||
          img.amenityCategory?.name ||
          t("gallery.categories.general")
        : img.amenityCategory?.name?.en ||
          img.amenityCategory?.name ||
          t("gallery.categories.general");

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          category: categoryName,
          color: CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default,
          images: [],
          iconKey: categoryId,
        };
      }
      grouped[categoryId].images.push(getImageSrc(img.url));
    });

    return Object.values(grouped);
  }, [chalet.images, isArabic, t]);

  const CATEGORIES = useMemo(() => {
    const cats = [
      {
        id: "all",
        label: t("gallery.categories.all"),
        icon: (isActive: boolean) => (
          <SolarWidgetBold
            size={18}
            color={isActive ? "white" : Colors.primary}
          />
        ),
        activeColor: Colors.primary,
      },
    ];

    gallerySections.forEach((section) => {
      cats.push({
        id: section.id,
        label: section.category,
        icon: (isActive: boolean) => {
          const IconGen =
            CATEGORY_ICONS[section.iconKey] || CATEGORY_ICONS.default;
          return IconGen(isActive);
        },
        activeColor: section.color,
      });
    });

    return cats;
  }, [gallerySections, t]);

  const openViewer = (url: any) => {
    if (typeof url === "string") {
      setViewerImage(url);
    } else if (url && url.uri) {
      setViewerImage(url.uri);
    } else {
      setViewerImage(Image.resolveAssetSource(url).uri);
    }
    setViewerVisible(true);
  };

  const filteredData =
    activeFilter === "all"
      ? gallerySections
      : gallerySections.filter((section) => section.id === activeFilter);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Photo Viewer Modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setViewerVisible(false)}
          >
            <SolarCloseCircleBold size={32} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: viewerImage }}
            style={styles.modalImg}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <HeaderSection
        title={t("headers.gallery")}
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Categories Filter (Matching Image) */}
      <View style={styles.catArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          <View style={{ flexDirection: rowDirection, gap: 10 }}>
            {CATEGORIES.map((filter) => (
              <SecondaryButton
                key={filter.id}
                label={filter.label}
                isActive={activeFilter === filter.id}
                activeColor={filter.activeColor}
                icon={filter.icon(activeFilter === filter.id)}
                onPress={() => setActiveFilter(filter.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredData.map((section, idx) => (
          <View key={idx} style={styles.sectionWrap}>
            <WavyHeader title={section.category} color={section.color} />

            {/* Big Image */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openViewer(section.images[0])}
              style={styles.imageCard}
            >
              <ExpoImage
                source={section.images[0]}
                style={styles.bigImage}
                contentFit="cover"
              />
            </TouchableOpacity>

            {/* Small Grid */}
            <View style={[styles.smallGrid, { flexDirection: rowDirection }]}>
              {section.images.slice(1, 4).map((img, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.smallImageCard}
                  activeOpacity={0.9}
                  onPress={() => openViewer(img)}
                >
                  <ExpoImage 
                    source={img} 
                    style={styles.smallImage}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        {filteredData.length === 0 && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ThemedText style={{ color: "#9CA3AF" }}>
              {t("gallery.empty")}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 60,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
  },
  headerSide: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Medium",
    color: "#1E293B",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catArea: {
    paddingVertical: 15,
  },
  catList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
    gap: 10,
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#035DF9",
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 35,
  },
  wavyHeaderContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  imageCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    marginBottom: 15,
  },
  bigImage: {
    width: "100%",
    height: 240,
  },
  smallGrid: {
    justifyContent: "space-between",
    gap: 12,
  },
  smallImageCard: {
    flex: 1,
    height: 110,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  smallImage: {
    width: "100%",
    height: "100%",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalImg: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
});
