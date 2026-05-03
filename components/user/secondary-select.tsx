import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "./secondary-button";
import { SolarAltArrowDownLinear } from "@/components/icons/solar-icons";
import { normalize } from "@/constants/theme";

export interface SelectOption {
  label: string;
  value: string;
}

interface SecondarySelectProps {
  options: SelectOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function SecondarySelect({
  options,
  value,
  onSelect,
  placeholder = "اختر...",
  style,
}: SecondarySelectProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const currentLabel = selectedOption ? selectedOption.label : placeholder;

  const handlePress = () => {
    bottomSheetRef.current?.present();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
  );

  return (
    <>
      <SecondaryButton
        label={currentLabel}
        icon={<SolarAltArrowDownLinear size={18} color="#035DF9" />}
        iconPosition="right"
        isActive={false}
        onPress={handlePress}
        style={style}
        variant={!isRTL ? "inverse" : "default"}
      />

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["35%"]}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.sheetContent}>
          <ThemedText style={styles.sheetTitle}>اختر</ThemedText>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionRow,
                  isSelected && styles.optionRowSelected,
                ]}
                onPress={() => {
                  onSelect(opt.value);
                  bottomSheetRef.current?.dismiss();
                }}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </ThemedText>
                {isSelected && (
                  <View style={styles.dotSelection} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  indicator: {
    width: 40,
    backgroundColor: "#E5E7EB",
  },
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Alexandria-Black",
    textAlign: "right",
    marginBottom: 20,
    color: "#111827",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionRowSelected: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderBottomWidth: 0,
    paddingHorizontal: 15,
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    textAlign: "right",
  },
  optionTextSelected: {
    color: "#035DF9",
    fontFamily: "Alexandria-Bold",
    marginRight: 10,
  },
  dotSelection: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#035DF9",
  },
});
