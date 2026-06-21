import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { SecondaryButton } from "./secondary-button";
import { SolarAltArrowDownLinear } from "@/components/icons/solar-icons";
import { useDirection } from "@/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const { isRTL, textAlign } = useDirection();
  const triggerRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  // Anchor rect of the trigger in window coordinates.
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const selectedOption = options.find((opt) => opt.value === value);
  const currentLabel = selectedOption ? selectedOption.label : placeholder;

  const handlePress = () => {
    // Measure the trigger so the menu drops down right beneath it.
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const MENU_WIDTH = Math.max(anchor.width, 180);
  // Align the menu under the trigger; in RTL pin its right edge to the
  // trigger's right edge, in LTR pin the left edges.
  const menuPosition: ViewStyle = isRTL
    ? { right: Math.max(8, SCREEN_WIDTH - (anchor.x + anchor.width)) }
    : { left: Math.max(8, anchor.x) };

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <SecondaryButton
          label={currentLabel}
          icon={<SolarAltArrowDownLinear size={18} color="#035DF9" />}
          iconPosition="right"
          isActive={false}
          onPress={handlePress}
          style={style}
          variant={!isRTL ? "inverse" : "default"}
        />
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              { width: MENU_WIDTH, top: anchor.y + anchor.height + 6 },
              menuPosition,
            ]}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  style={[
                    styles.optionRow,
                    {
                      flexDirection: "row",
                      direction: isRTL ? "rtl" : "ltr",
                    },
                    idx < options.length - 1 && styles.optionDivider,
                    isSelected && styles.optionRowSelected,
                  ]}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      { textAlign },
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                  {isSelected && <View style={styles.dotSelection} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menu: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  optionRow: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    borderRadius: 0,
  },
  optionRowSelected: {
    backgroundColor: "#F0F7FF",
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#6B7280",
    flexShrink: 1,
  },
  optionTextSelected: {
    color: "#035DF9",
    fontFamily: "Alexandria-Medium",
  },
  dotSelection: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#035DF9",
    marginStart: 10,
  },
});
