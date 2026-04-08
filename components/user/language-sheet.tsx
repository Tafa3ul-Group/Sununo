import React, { useMemo, useCallback } from "react";
import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";
import { Colors, normalize, Spacing } from "@/constants/theme";
import { SolarCheckCircleBold } from "@/components/icons/solar-icons";

interface LanguageSheetProps {
  onSelect?: (lang: string) => void;
}

export const LanguageSheet = React.forwardRef<BottomSheetModal, LanguageSheetProps>(
  ({ onSelect }, ref) => {
    const { i18n, t } = useTranslation();
    const currentLang = i18n.language;

    const snapPoints = useMemo(() => ["35%"], []);

    const languages = [
      {
        id: "ar",
        label: "العربية",
        flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1ee-1f1f6.png", // Iraq Flag
      },
      {
        id: "en",
        label: "English",
        flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1fa-1f1f8.png", // US Flag
      },
    ];

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    const handleSelect = (lang: string) => {
      i18n.changeLanguage(lang);
      if (onSelect) onSelect(lang);
      // @ts-ignore
      ref.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetView style={styles.content}>
          <ThemedText style={styles.title}>اختيار اللغة</ThemedText>
          <View style={styles.list}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.item,
                  currentLang === lang.id && styles.activeItem,
                ]}
                onPress={() => handleSelect(lang.id)}
              >
                {currentLang === lang.id ? (
                  <View style={styles.checkCircleActive}>
                    <SolarCheckCircleBold size={12} color="white" />
                  </View>
                ) : (
                  <View style={styles.checkCircle} />
                )}
                
                <View style={styles.langInfo}>
                   <ThemedText style={[
                     styles.label,
                     currentLang === lang.id && styles.activeLabel
                   ]}>
                     {lang.label}
                   </ThemedText>
                   <Image source={{ uri: lang.flag }} style={styles.flag} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#E5E7EB",
    width: 60,
  },
  background: {
    borderRadius: 36,
    backgroundColor: "white",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 24,
  },
  list: {
    width: "100%",
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  activeItem: {
    borderColor: "#035DF9",
    backgroundColor: "#F3F7FF",
  },
  langInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B5563",
  },
  activeLabel: {
    color: "#035DF9",
  },
  flag: {
    width: 28,
    height: 28,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  checkCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#15AB64", // Green check for selection
    justifyContent: "center",
    alignItems: "center",
  },
});
