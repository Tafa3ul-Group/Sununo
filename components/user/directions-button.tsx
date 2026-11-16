import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SecondaryButton } from "@/components/user/secondary-button";
import { useDirection } from "@/i18n";

interface DirectionsButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * The green "get directions" button. Shared by the explore drawer, the chalet
 * page and the full chalet map so the action looks the same wherever the
 * customer finds it.
 */
export function DirectionsButton({ onPress, style }: DirectionsButtonProps) {
  const { isRTL } = useDirection();
  return (
    <SecondaryButton
      label={isRTL ? "اذهب للمسار" : "Get Directions"}
      isActive
      activeColor="#22C55E"
      activeTextColor="#FFFFFF"
      style={style}
      icon={
        <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
          <Path
            d="M13.3023 8.21378C13.3526 8.18866 13.4075 8.174 13.4637 8.17068C13.5198 8.16735 13.5761 8.17543 13.629 8.19443C13.682 8.21343 13.7305 8.24296 13.7718 8.28123C13.813 8.3195 13.846 8.36572 13.8689 8.41712L17.3631 16.2521C17.9189 17.4979 16.6839 18.7913 15.5281 18.1738L10.6081 15.5471C10.2248 15.3429 9.77476 15.3429 9.39226 15.5471L4.47226 18.1738C3.31642 18.7913 2.08142 17.4988 2.63726 16.2521L3.94726 13.3146C4.10441 12.9623 4.37891 12.6755 4.72392 12.5029L13.3023 8.21378Z"
            fill="white"
          />
          <Path
            opacity={0.5}
            d="M12.8251 7.0554C12.9213 7.00754 12.9953 6.9244 13.0316 6.82331C13.0679 6.72223 13.0638 6.61103 13.0201 6.5129L11.2276 2.49373C10.736 1.39123 9.26513 1.39123 8.77346 2.49373L5.4668 9.90873C5.43182 9.98715 5.42193 10.0745 5.43847 10.1587C5.45501 10.243 5.49717 10.32 5.55919 10.3794C5.62121 10.4388 5.70006 10.4776 5.78496 10.4904C5.86985 10.5033 5.95664 10.4896 6.03346 10.4512L12.8251 7.0554Z"
            fill="white"
          />
        </Svg>
      }
      iconPosition="left"
      onPress={onPress}
      height={52}
    />
  );
}
