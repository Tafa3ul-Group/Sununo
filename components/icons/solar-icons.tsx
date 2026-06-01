import React from "react";
import { View } from "react-native";
import Svg, { Circle, G, Path, SvgProps } from "react-native-svg";
import * as Theme from "@/constants/theme";

// Solar Icon Registry - Unified Architecture v1.3 (Atomic Fix)

const SafeColors = (Theme.Colors as any) || { primary: "#2B66FF", secondary: "#22C55E", accent: "#F97316" };

interface SolarIconProps extends SvgProps {
  size?: number | string;
}

export function SolarFiltersBoldDuotone({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path fill={color || "currentColor"} d="M18 8A6 6 0 1 1 6 8a6 6 0 0 1 12 0" />
      <Path fill={color || "currentColor"} d="M13.58 13.79a6 6 0 0 1-7.16-3.58a6 6 0 1 0 7.16 3.58" opacity=".7" />
      <Path fill={color || "currentColor"} d="M13.58 13.79c.271.684.42 1.43.42 2.21a6 6 0 0 1-2 4.472a6 6 0 1 0 5.58-10.262a6.01 6.01 0 0 1-4 3.58" opacity=".4" />
    </Svg>
  );
}

export function SolarHomeSmileBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || SafeColors.primary}
        d="M2 12.204c0-2.289 0-3.433.52-4.381c.518-.949 1.467-1.537 3.364-2.715l2-1.241C9.889 2.622 10.892 2 12 2s2.11.622 4.116 1.867l2 1.241c1.897 1.178 2.846 1.766 3.365 2.715S22 9.915 22 12.203v1.522c0 3.9 0 5.851-1.172 7.063S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.212S2 17.626 2 13.725z"
        opacity={0.5}
      />
      <Path
        fill={color || SafeColors.primary}
        d="M9.447 15.398a.75.75 0 0 0-.894 1.205A5.77 5.77 0 0 0 12 17.75a5.77 5.77 0 0 0 3.447-1.147a.75.75 0 0 0-.894-1.206A4.27 4.27 0 0 1 12 16.25a4.27 4.27 0 0 1-2.553-.852"
      />
    </Svg>
  );
}

export function SolarBellBingBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || SafeColors.primary}
        d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.8 25.8 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.4 4.4 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
        opacity={0.5}
      />
      <Path
        fill={color || SafeColors.primary}
        d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
      />
    </Svg>
  );
}

export function SolarHeartBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || SafeColors.primary}
        d="M2 9.137C2 14 6.02 16.591 8.962 18.911C10 19.729 11 20.5 12 20.5s2-.77 3.038-1.59C17.981 16.592 22 14 22 9.138S16.5.825 12 5.501C7.5.825 2 4.274 2 9.137"
      />
    </Svg>
  );
}

export function SolarMapBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || SafeColors.primary}
        d="M3 8.71v8.128c0 1.043 0 1.565.283 1.958s.778.558 1.768.888l1.165.388c1.367.456 2.05.684 2.739.591L9 20.657v-14a3 3 0 0 1-.34.031c-.54.019-1.074-.16-2.141-.515c-1.398-.466-2.097-.699-2.629-.462a1.5 1.5 0 0 0-.497.358C3 6.5 3 7.236 3 8.71m18 6.58V7.163c0-1.043 0-1.565-.283-1.958s-.778-.558-1.768-.888l-1.165-.388c-1.367-.456-2.05-.684-2.739-.591L15 3.343v14q.17-.025.34-.031c.54-.019 1.074.16 2.141.515c1.398.466 2.097.699 2.629.462a1.5 1.5 0 0 0 .497-.358C21 17.5 21 16.764 21 15.29"
        opacity={0.5}
      />
      <Path
        fill={color || SafeColors.primary}
        d="M9.247 6.61q-.123.027-.247.047v14c.67-.104 1.269-.503 2.442-1.285l1.382-.922c.936-.624 1.404-.936 1.93-1.06q.12-.03.246-.047v-14c-.67.103-1.269.503-2.442 1.284l-1.382.922c-.936.624-1.404.936-1.93 1.06m8.235 11.218l.254.084z"
      />
    </Svg>
  );
}

export function SolarStarBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M9.153 5.408C10.42 3.136 11.053 2 12 2s1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182s.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.776c.292.94-.546 1.921-2.223 3.882l-.434.507c-.476.557-.715.836-.822 1.18c-.107.345-.071.717.001 1.46l.066.677c.253 2.617.38 3.925-.386 4.506s-1.918.051-4.22-1.009l-.597-.274c-.654-.302-.981-.452-1.328-.452s-.674.15-1.328.452l-.596.274c-2.303 1.06-3.455 1.59-4.22 1.01c-.767-.582-.64-1.89-.387-4.507l.066-.676c.072-.744.108-1.116 0-1.46c-.106-.345-.345-.624-.821-1.18l-.434-.508c-1.677-1.96-2.515-2.941-2.223-3.882S3.58 8.328 6.04 7.772l.636-.144c.699-.158 1.048-.237 1.329-.45s.46-.536.82-1.182z"
      />
    </Svg>
  );
}

export function SolarStarLinear({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeWidth="1.5"
        d="M9.153 5.408C10.42 3.136 11.053 2 12 2s1.58 1.136 2.847 3.408l.328.588c.36.646.54.969.82 1.182s.63.292 1.33.45l.636.144c2.46.557 3.689.835 3.982 1.776c.292.94-.546 1.921-2.223 3.882l-.434.507c-.476.557-.715.836-.822 1.18c-.107.345-.071.717.001 1.46l.066.677c.253 2.617.38 3.925-.386 4.506s-1.918.051-4.22-1.009l-.597-.274c-.654-.302-.981-.452-1.328-.452s-.674.15-1.328.452l-.596.274c-2.303 1.06-3.455 1.59-4.22 1.01c-.767-.582-.64-1.89-.387-4.507l.066-.676c.072-.744.108-1.116 0-1.46c-.106-.345-.345-.624-.821-1.18l-.434-.508c-1.677-1.96-2.515-2.941-2.223-3.882S3.58 8.328 6.04 7.772l.636-.144c.699-.158 1.048-.237 1.329-.45s.46-.536.82-1.182z"
      />
    </Svg>
  );
}

export function SolarBanknoteBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M21 16V8c0-2.828 0-4.243-.879-5.121S17.828 2 15 2H9C6.172 2 4.757 2 3.879 2.879C3 3.757 3 5.172 3 8v8c0 2.828 0 4.243.879 5.121C4.757 22 6.172 22 9 22h6c2.828 0 4.243 0 5.121-.879C21 20.243 21 18.828 21 16Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 16.5a4.5 4.5 0 1 0 0-9a4.5 4.5 0 0 0 0 9Z"
      />
      <Path fill={color || "currentColor"} d="M2 12h2m16 0h2" />
    </Svg>
  );
}

export function SolarMapPointBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 21c-3-2.5-8-7.397-8-12a8 8 0 0 1 16 0c0 4.603-5 9.5-8 12Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
      />
    </Svg>
  );
}

export function SolarChartBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M13 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v19a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-19Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M3 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-11Z"
      />
    </Svg>
  );
}

export function SolarBellBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 22a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22Z"
      />
      <Path
        fill={color || "currentColor"}
        d="M10 2a2 2 0 0 1 4 0h.5c2.485 0 4.5 2.015 4.5 4.5v2.382c0 .647.311 1.252.836 1.625l1.084.773A2.5 2.5 0 0 1 22 13.336V15.5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 15.5v-2.164a2.5 2.5 0 0 1 1.08-2.056l1.084-.773A2 2 0 0 0 5 8.882V6.5C5 4.015 7.015 2 9.5 2h.5Z"
        opacity="0.5"
      />
    </Svg>
  );
}

export function SolarMapPointLinear({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeWidth="1.5"
        d="M12 21c3.5-3.5 8-8.5 8-12c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 3.5 4.5 8.5 8 12Z"
      />
      <Circle
        cx="12"
        cy="9"
        r="3"
        stroke={color || "currentColor"}
        strokeWidth="1.5"
      />
    </Svg>
  );
}

export function SolarSettingsBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M2 12c0-3.771 0-5.657 1.172-6.828C4.343 4 6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172C22 6.343 22 8.229 22 12s0 5.657-1.172 6.828C19.657 20 17.771 20 14 20h-4c-3.771 0-5.657 0-6.828-1.172C2 17.657 2 15.771 2 12Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
      />
    </Svg>
  );
}

export function SolarTrashBinBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="M3 7h18M9 7V4h6v3M9 11v6m6-6v6" />
    </Svg>
  );
}

export function SolarAddSquareBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.536 1.464C22 4.93 22 7.286 22 12s0 7.071-1.464 8.536C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"
        opacity="0.5"
      />
      <Path
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 8v8m-4-4h8"
      />
    </Svg>
  );
}

export function SolarAltArrowLeftBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path fill={color || "currentColor"} d="M15 19l-7-7l7-7" />
    </Svg>
  );
}

export function SolarAltArrowRightBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path fill={color || "currentColor"} d="M9 5l7 7l-7 7" />
    </Svg>
  );
}

export function SolarCheckCircleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="m9 12l2 2l4-4" />
    </Svg>
  );
}

export function SolarCloseCircleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"
        opacity="0.5"
      />
      <Path
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        d="m9.17 14.83l2.83-2.83m0 0l2.83-2.83M12 12l2.83 2.83M12 12L9.17 9.17"
      />
    </Svg>
  );
}

export function SolarNotesBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <G opacity="0.5">
        <Path
          fill={color || "currentColor"}
          d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.536 1.464C22 4.93 22 7.286 22 12s0 7.071-1.464 8.536C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"
        />
      </G>
      <Path
        fill={color || "currentColor"}
        d="M8 8h8M8 12h8M8 16h5"
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SolarUsersGroupBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 14c-4.418 0-8 2-8 5v1h16v-1c0-3-3.582-5-8-5Z"
      />
    </Svg>
  );
}

export function SolarAltArrowRightLinear({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 5l7 7l-7 7"
      />
    </Svg>
  );
}

export function SolarMagnifierBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="11.5"
        cy="11.5"
        r="9.5"
        fill={color || "currentColor"}
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="m18.5 18.5l3 3"
        stroke={color || "currentColor"}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SolarEyeBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5ZM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5s5 2.24 5 5s-2.24 5-5 5Z"
        opacity="0.5"
      />
      <Circle cx="12" cy="12" r="3" fill={color || "currentColor"} />
    </Svg>
  );
}

export function SolarUserBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="6"
        r="4"
        fill={color || "currentColor"}
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="M20 21a8 8 0 0 0-16 0h16Z" />
    </Svg>
  );
}

export function SolarGalleryBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M21 16V8c0-2.828 0-4.243-.879-5.121S17.828 2 15 2H9C6.172 2 4.757 2 3.879 2.879C3 3.757 3 5.172 3 8v8c0 2.828 0 4.243.879 5.121C4.757 22 6.172 22 9 22h6c2.828 0 4.243 0 5.121-.879C21 20.243 21 18.828 21 16Z"
        opacity="0.5"
      />
      <Circle cx="8.5" cy="8.5" r="2.5" fill={color || "currentColor"} />
      <Path
        fill={color || "currentColor"}
        d="m3 16l5-5l3.5 3.5l4-4l5.5 5.5V16c0 2.828 0 4.243-.879 5.121C16.828 22 15.414 22 12.586 22H11.414c-2.828 0-4.243 0-5.121-.879C5.414 20.243 5.414 18.828 5.414 16h-.414l-2 2Z"
      />
    </Svg>
  );
}

export function SolarCalendarMinimalisticBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M19 4H5C3.895 4 3 4.895 3 6v14c0 1.105.895 2 2 2h14c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="M16 2v4M8 2v4M3 9h18" />
    </Svg>
  );
}

export function SolarClockCircleLinear({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color || "currentColor"}
        strokeWidth="1.5"
      />
      <Path
        stroke={color || "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3"
      />
    </Svg>
  );
}

export function SolarLockBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        fillRule="evenodd"
        d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm3 8V7a3 3 0 1 0-6 0v3h6Z"
        clipRule="evenodd"
      />
    </Svg>
  );
}

export function SolarShopBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M22 10a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2m-3 0a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2m-3 0a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2m-3 0a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2m0 0V20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10"
      />
    </Svg>
  );
}

export function SolarCardBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M22 9V8a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1h20Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M22 12v4a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-4h20Zm-15 4h2a1 1 0 1 0 0-2H7a1 1 0 1 0 0 2Z"
      />
    </Svg>
  );
}

export function SolarAddCircleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill={color || "currentColor"}
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 7v10m-5-5h10"
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SolarAltArrowDownLinear({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m19 9l-7 7l-7-7"
      />
    </Svg>
  );
}

export function SolarAltArrowLeftLinear({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15 19l-7-7l7-7"
      />
    </Svg>
  );
}

export function SolarSunBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12" cy="12" r="5" fill={color || "currentColor"} />
      <Path
        fill={color || "currentColor"}
        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4"
        stroke={color || "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SolarMoonBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M21 12.7A9 9 0 1 1 11.3 3a7 7 0 0 0 9.7 9.7Z"
      />
    </Svg>
  );
}

export function SolarWaterBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 22a8 8 0 0 1-8-8c0-4.418 3.582-10 8-12 4.418 2 8 7.582 8 12a8 8 0 0 1-8 8Z"
      />
    </Svg>
  );
}

export function SolarWifiBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 6c-3.1 0-6 1.2-8.1 3.2a1 1 0 1 0 1.4 1.4c1.7-1.6 4-2.6 6.7-2.6s5 .9 6.7 2.6a1 1 0 0 0 1.4-1.4C18 7.2 15.1 6 12 6Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 2C7.3 2 3.1 3.9 0 6.9a1 1 0 0 0 1.4 1.4C4.1 5.7 7.9 4 12 4s7.9 1.7 10.6 4.3a1 1 0 0 0 1.4-1.4C20.9 3.9 16.7 2 12 2Z"
        opacity="0.3"
      />
    </Svg>
  );
}

export function SolarWindBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M21 7.5A3.5 3.5 0 0 0 17.5 4H5a1 1 0 0 0 0 2h12.5a1.5 1.5 0 0 1 0 3H12a1 1 0 0 0 0 2h5.5A3.5 3.5 0 0 0 21 7.5Z"
      />
      <Path
        fill={color || "currentColor"}
        d="M19 16.5A3.5 3.5 0 0 1 15.5 20H3a1 1 0 0 1 0-2h12.5a1.5 1.5 0 0 0 0-3H10a1 1 0 0 1 0-2h5.5A3.5 3.5 0 0 1 19 16.5Z"
        opacity="0.5"
      />
    </Svg>
  );
}

export function SolarKeyBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M14.5 11c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5-1.1-2.5-2.5-2.5Z"
      />
      <Path
        fill={color || "currentColor"}
        d="M14.5 9a4.5 4.5 0 0 0-4.4 3.5L3.4 19.3a1 1 0 0 0 1.2 1.2l2.3-1.1 2.2 2.2a1 1 0 0 0 1.4-1.4l-1.5-1.5 2.1-1c1 .9 2.5 1.3 3.8 1.1 2.5-.3 4.5-2.5 4.5-5a4.5 4.5 0 0 0-4.5-4.5Z"
        opacity="0.5"
      />
    </Svg>
  );
}

export function SolarForbiddenBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10Zm0-18a8 8 0 0 0-6.1 13.2l11.3-11.3A8 8 0 0 0 12 4Zm6.1 2.8L6.8 18.1A8 8 0 0 0 18 12a8 8 0 0 0 .1-5.2Z"
      />
    </Svg>
  );
}

export function SolarForbiddenCircleLineDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <G fill="none" stroke={color || "currentColor"} strokeWidth="1.5">
        <Path strokeLinecap="round" d="m18.5 5.5l-13 13" opacity="0.5" />
        <Circle cx="12" cy="12" r="10" />
      </G>
    </Svg>
  );
}


export function SolarShieldCheckBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M10.5 14.5l-2-2a1.003 1.003 0 0 1 1.42-1.42l.58.59 3.58-3.59a1.003 1.003 0 0 1 1.42 1.42l-5 5Z"
      />
    </Svg>
  );
}

export function SolarClockCircleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        fill={color || "currentColor"}
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 7a1 1 0 0 0-1 1v4a1 1 0 0 0 .3.7l2 2a1 1 0 0 0 1.4-1.4L13 11.6V8a1 1 0 0 0-1-1Z"
      />
    </Svg>
  );
}

export function SolarMenuDotsBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12" cy="12" r="2" fill={color || "currentColor"} />
      <Circle cx="12" cy="5" r="2" fill={color || "currentColor"} />
      <Circle cx="12" cy="19" r="2" fill={color || "currentColor"} />
    </Svg>
  );
}

export function SolarHome2Bold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2L2 12h3v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h3L12 2Z"
      />
    </Svg>
  );
}

export function SolarCameraBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 18a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M9 2L7 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3l-2-2H9Zm3 15a4 4 0 1 1 0-8a4 4 0 0 1 0 8Z"
      />
    </Svg>
  );
}

export function SolarUsersGroupRoundedBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z"
        opacity="0.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 14c-4.418 0-8 2-8 5v1h16v-1c0-3-3.582-5-8-5Z"
      />
    </Svg>
  );
}

export function SolarCalendarAddBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        fillRule="evenodd"
        d="M8 3a1 1 0 0 1 1 1v1h6V4a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h1V4a1 1 0 0 1 1-1Zm9 10a1 1 0 1 0-2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2v-2Z"
        clipRule="evenodd"
      />
    </Svg>
  );
}

const SHAPE_PATHS = {
  red: "M26.0603 60C29.9658 59.4325 29.8391 57.154 32.7123 55.3719C34.9225 54.1301 37.5529 56.9614 39.3811 57.3718C44.9058 58.6116 45.0155 53.8851 45.7481 50.2915C46.6896 46.8466 51.9145 48.769 54.0192 47.2906C58.6446 44.0383 54.2219 40.5348 54.091 37.1548C54.015 35.1591 59.4109 33.2953 59.8817 30.686C60.7641 25.7794 56.4955 25.9343 54.2493 22.9543C53.2593 21.2225 55.2331 18.2886 55.4822 16.8143C56.5335 10.6114 50.9476 11.4512 47.0992 11.0554C44.5891 10.7957 44.7707 5.60846 43.789 4.02109C42.7863 2.40231 41.7835 2.19288 40.0292 1.73217C37.2468 2.50491 35.7226 3.96454 33.0732 4.97811C29.9193 4.0148 28.8406 -0.579781 24.7388 0.0610315C21.5701 0.0359016 20.8671 5.11424 19.5751 6.16131C15.2897 9.63133 12.864 2.85464 8.01704 8.83346C7.91359 10.2303 8.34847 15.4992 7.88615 16.2991C6.25008 19.1388 -0.948651 18.253 0.10477 23.4151C0.647314 26.0705 2.92303 27.662 4.08201 30.02L4.18968 30.2441C3.20803 32.4388 0.824638 34.7235 0.389759 36.803C-0.691106 41.9798 5.48587 41.5358 7.9347 43.7054C9.67633 45.2467 7.4935 50.3062 9.13168 52.2118C11.3251 55.9604 16.8983 52.3584 18.8236 53.1061C22.3723 54.4819 20.7087 58.6535 26.0603 60Z",
  blue: "M31.177 60L31.7712 59.9376C32.8672 59.232 36.7817 53.2436 37.8737 51.728C40.3267 52.6508 43.5285 53.5787 46.0539 54.4214C46.6842 54.6319 47.1961 54.5513 47.7421 54.1911C48.543 53.009 48.4848 46.1697 48.5932 44.2386C51.3936 43.3932 54.3204 42.7398 57.1026 41.877C57.8393 41.6485 58.032 41.2674 58.291 40.674C58.2268 39.2385 54.5572 33.6731 53.5736 31.9774C55.4164 29.9328 57.2973 27.9347 59.1442 25.8993C59.8909 25.0775 60.0555 24.7649 59.9852 23.7883C59.2746 22.6217 53.0717 19.9015 51.2751 18.9984C51.6967 16.1161 52.2507 13.4061 52.7466 10.5491C52.8831 9.75984 52.8288 9.24161 52.3531 8.62877C51.0242 7.87675 44.2954 9.10223 42.288 9.36357C41.2482 6.79897 40.2926 4.18695 39.2387 1.63228C38.8232 0.627833 38.5883 0.336505 37.697 1.49012e-06C36.2838 0.167544 31.3898 4.6203 29.8581 5.88326C28.2101 5.91851 22.5873 0.0391017 20.6823 0.560774C19.6525 1.92219 17.8438 8.34534 17.2316 10.3089C15.196 10.2469 8.20426 9.36458 7.01989 10.4574C6.33938 11.9432 8.50738 18.5541 9.06143 20.5286C6.98778 21.7352 1.51158 24.7799 0 26.128C1.22652 27.8168 5.83953 32.0045 7.64017 33.6889C1.56375 45.7068 1.28272 42.6296 13.4938 45.5763C13.8109 47.6571 13.9193 54.5019 15.3245 55.5511C16.7377 55.8748 22.9165 52.9707 24.7292 52.2229C26.837 54.8499 28.9869 57.4427 31.177 60Z",
  green:
    "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
  pink: "M24.91 0C27.0701 0.496535 28.2561 2.03453 30.0498 3.51362C35.1705 -1.23292 35.9096 -1.06671 38.9761 5.08738C41.9346 4.27946 45.7444 1.47486 46.5131 6.62746C46.6677 7.66051 46.799 8.70829 46.9346 9.74344C48.7537 9.89914 52.4237 9.16486 53.3598 11.1426C53.9993 12.4912 53.04 15.3484 52.6631 16.7854C59.6389 19.5437 59.605 18.6621 55.8672 25.4811C61.2844 29.75 61.4707 30.2655 55.8651 34.5681C56.5555 35.8641 57.4534 37.0634 58.04 38.372C59.5097 41.6521 55.0243 42.4011 52.6673 43.2175C53.0972 44.7807 53.9633 47.5769 53.3365 49.159C52.4153 51.4797 48.9528 49.422 47.4915 50.2594C45.9053 51.3156 46.6508 54.0634 46.1806 55.3868C45.3272 57.7895 40.4479 55.4457 39.0375 54.8923C37.805 57.0342 37.6165 58.3597 35.6533 59.9987C33.1777 60.0576 32.0214 58.1703 29.9545 56.5334C24.3764 61.0275 24.6644 61.6187 20.9223 54.8587C13.1904 57.5559 14.6326 57.5833 12.985 50.1185C5.51574 50.5645 5.97528 49.9606 7.20145 43.127C0.683039 40.8252 0.0943126 40.8926 4.1625 34.6059C1.87533 32.5483 -2.41311 30.68 1.74191 27.341C2.54877 26.693 3.37257 26.0513 4.17731 25.399C0.168422 19.2702 0.651283 19.1881 7.18452 16.8422C6.26754 10.2295 5.00113 9.57512 13.0909 9.76237C14.2154 2.29752 14.046 2.80668 21.007 5.08316C22.3052 3.02339 22.3666 0.969926 24.91 0Z",
  info: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z" };

export function SolarDangerCircleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color || "currentColor"}
        strokeWidth="1.5"
      />
      <Path
        stroke={color || "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M12 8v4m0 4h.01"
      />
    </Svg>
  );
}

export function SolarChatLineLinear({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.127L3 21l4.873-1c1.236.64 2.64 1 4.127 1z"
      />
    </Svg>
  );
}

export function SolarAddBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1"
      />
    </Svg>
  );
}

export function SolarMinusBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M5 12a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1"
      />
    </Svg>
  );
}

export function SolarFilterBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M3 5a1 1 0 0 1 1-1h16a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1m4 7a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1m3 7a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1"
      />
    </Svg>
  );
}

export function SolarBedBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M21 10.75V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v3.75c-1.105 0-2 .895-2 2v6c0 .552.448 1 1 1h1.036l.464 2.321a1 1 0 0 0 1.96-.392L5.132 19h13.736l-.368 1.929a1 1 0 1 0 1.96.392L19.928 19H21a1 1 0 0 0 1-1v-6c0-1.105-.895-2-2-2ZM7 8.5h3a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5Zm10 0a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5h3Z"
      />
    </Svg>
  );
}

export function SolarWalletBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M19 8h-1V7a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3Zm-1 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1-7h-8a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Z"
      />
    </Svg>
  );
}

export function SolarCalendarBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        opacity="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.0002 4.1465C11.0002 5.8845 9.58522 7.2935 7.84022 7.2935C7.52222 7.2935 6.79722 7.2205 6.44472 6.9275L6.00372 7.3665C5.74422 7.625 5.81422 7.701 5.92972 7.826C5.97772 7.8785 6.03372 7.939 6.07722 8.0255C6.07722 8.0255 6.44472 8.5375 6.07722 9.05C5.85672 9.3425 5.23922 9.752 4.53422 9.05L4.38722 9.196C4.38722 9.196 4.82772 9.7085 4.46072 10.221C4.24022 10.5135 3.65222 10.806 3.13772 10.294L2.62372 10.806C2.27072 11.1575 1.83972 10.9525 1.66872 10.806L1.22722 10.367C0.815723 9.957 1.05572 9.513 1.22722 9.342L5.04822 5.537C5.04822 5.537 4.68072 4.952 4.68072 4.147C4.68072 2.409 6.09572 1 7.84072 1C9.58572 1 11.0002 2.409 11.0002 4.1465Z"
        fill={color || "white"}
      />
      <Path
        d="M8.94228 4.14683C8.94162 4.43848 8.82516 4.71793 8.61851 4.92374C8.41186 5.12955 8.13193 5.24486 7.84028 5.24433C7.54863 5.24486 7.2687 5.12955 7.06205 4.92374C6.8554 4.71793 6.73894 4.43848 6.73828 4.14683C6.73854 4.00238 6.76726 3.85939 6.82278 3.72603C6.8783 3.59267 6.95955 3.47156 7.06188 3.3696C7.16421 3.26764 7.28562 3.18683 7.41918 3.1318C7.55274 3.07676 7.69583 3.04857 7.84028 3.04883C7.98474 3.04857 8.12783 3.07676 8.26139 3.1318C8.39494 3.18683 8.51636 3.26764 8.61869 3.3696C8.72102 3.47156 8.80226 3.59267 8.85778 3.72603C8.91331 3.85939 8.94202 4.00238 8.94228 4.14683Z"
        fill={color || "white"}
      />
    </Svg>
  );
}

export function SolarGlobalBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        d="M8.50042 6C9.04409 5.99991 9.57291 5.8226 10.0067 5.49494C10.4406 5.16727 10.7558 4.70712 10.9046 4.18422C11.0533 3.66131 11.0276 3.10415 10.8313 2.59718C10.635 2.0902 10.2787 1.66105 9.81654 1.37474C9.35437 1.08844 8.81147 0.960602 8.27011 1.0106C7.72875 1.06059 7.21844 1.28569 6.81652 1.65179C6.4146 2.01789 6.14297 2.50503 6.0428 3.03939C5.94263 3.57374 6.01939 4.12619 6.26142 4.613C6.30705 4.70143 6.31896 4.80344 6.29492 4.9L6.14592 5.4565C6.13117 5.5116 6.13118 5.56961 6.14595 5.62471C6.16072 5.6798 6.18972 5.73004 6.23006 5.77037C6.27039 5.8107 6.32063 5.83971 6.37572 5.85448C6.43082 5.86925 6.48883 5.86926 6.54392 5.8545L7.10042 5.7055C7.19699 5.68147 7.29899 5.69338 7.38742 5.739C7.73329 5.9108 8.11425 6.00013 8.50042 6Z"
        fill={color || "white"}
      />
      <Path
        d="M7.27793 7.77403L7.05043 8.01403C7.05043 8.01403 6.50893 8.58353 5.03143 7.02802C3.55393 5.47252 4.09543 4.90302 4.09543 4.90302L4.23893 4.75152C4.59193 4.37952 4.62543 3.78252 4.31693 3.34652L3.68693 2.45502C3.30493 1.91502 2.56743 1.84402 2.12993 2.30452L1.34543 3.13002C1.12893 3.35852 0.983928 3.65402 1.00143 3.98252C1.04643 4.82252 1.40543 6.62903 3.40743 8.73753C5.53093 10.9725 7.52343 11.0615 8.33793 10.981C8.59593 10.956 8.81993 10.8165 9.00043 10.6265L9.71043 9.87853C10.1904 9.37353 10.0554 8.50853 9.44143 8.15553L8.48643 7.60553C8.08343 7.37403 7.59293 7.44203 7.27793 7.77353"
        fill={color || "white"}
        fillOpacity="0.5"
      />
    </Svg>
  );
}

export function SolarPhoneBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        opacity="0.5"
        d="M6.00012 1.5C4.84512 1.5 4.11512 2.7935 2.65612 5.381L2.47412 5.703C1.26162 7.853 0.65512 8.928 1.20312 9.714C1.75112 10.5 3.10712 10.5 5.81812 10.5H6.18212C8.89312 10.5 10.2491 10.5 10.7971 9.714C11.3451 8.928 10.7386 7.853 9.52612 5.703L9.34412 5.3805C7.88512 2.7935 7.15562 1.5 6.00012 1.5Z"
        fill={color || "white"}
      />
      <Path
        d="M6 3.625C6.09946 3.625 6.19484 3.66451 6.26516 3.73483C6.33549 3.80516 6.375 3.90054 6.375 4V6.5C6.375 6.59946 6.33549 6.69484 6.26516 6.76516C6.19484 6.83549 6.09946 6.875 6 6.875C5.90054 6.875 5.80516 6.83549 5.73484 6.76516C5.66451 6.69484 5.625 6.59946 5.625 6.5V4C5.625 3.90054 5.66451 3.80516 5.73484 3.73483C5.80516 3.66451 5.90054 3.625 6 3.625ZM6 8.5C6.13261 8.5 6.25979 8.44732 6.35355 8.35355C6.44732 8.25979 6.5 8.13261 6.5 8C6.5 7.86739 6.44732 7.74021 6.35355 7.64645C6.25979 7.55268 6.13261 7.5 6 7.5C5.86739 7.5 5.74021 7.55268 5.64645 7.64645C5.55268 7.74021 5.5 7.86739 5.5 8C5.5 8.13261 5.55268 8.25979 5.64645 8.35355C5.74021 8.44732 5.86739 8.5 6 8.5Z"
        fill={color || "white"}
      />
    </Svg>
  );
}

export function SolarShieldBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        d="M9.92839 7.90181C9.23403 8.2209 8.11912 8.59126 6.99221 8.59126C6.3642 8.59265 5.7426 8.46492 5.16603 8.21599C4.98384 8.13963 4.8153 8.05945 4.66857 7.98963L4.55566 7.93563C4.37675 7.85163 4.24203 7.79326 4.12312 7.76108C3.62548 7.62964 3.11612 7.54742 2.60239 7.51563C2.38016 7.50109 2.15743 7.49563 1.93475 7.49926L1.92712 7.49981H1.92548L1.90039 7.5009C2.19529 8.30566 2.72057 9.0058 3.41072 9.51402C4.10088 10.0222 4.92538 10.316 5.7814 10.3588C6.63742 10.4015 7.48709 10.1913 8.22445 9.75443C8.96181 9.3175 9.55478 8.67318 9.92839 7.90181ZM2.2053 3.84417L2.45021 4.05799L2.45785 4.06399C2.46439 4.07017 2.47585 4.07963 2.49221 4.09236C2.52421 4.11781 2.5733 4.15417 2.63948 4.20145C2.82644 4.32898 3.022 4.44344 3.22475 4.54399C3.73421 4.79599 4.46075 5.04581 5.33675 5.04581C5.9133 5.04581 6.35239 4.90399 6.72439 4.73763C6.8733 4.67108 7.00639 4.6029 7.14112 4.53363L7.25894 4.47363C7.42585 4.38908 7.60803 4.30072 7.79348 4.24617C8.26556 4.10675 8.75061 4.01574 9.24112 3.97454C9.4247 3.95922 9.60893 3.95321 9.79312 3.95654L9.82748 3.95763L9.83784 3.95817H9.84275L9.85803 3.95926C9.48689 3.25796 8.93155 2.67112 8.25177 2.26188C7.57199 1.85265 6.79349 1.63651 6.00003 1.63672C5.22887 1.63654 4.47143 1.84072 3.80485 2.22849C3.13827 2.61625 2.58635 3.17373 2.2053 3.84417Z"
        fill={color || "white"}
      />
      <Path
        opacity="0.5"
        d="M10.2798 6.85673C10.4158 6.17405 10.3874 5.46879 10.1969 4.79928L9.79433 4.77418H9.78997L9.7687 4.77309L9.67597 4.77255C9.59197 4.77255 9.46651 4.77582 9.30779 4.78891C8.99033 4.81509 8.54088 4.87891 8.02433 5.03055C7.91851 5.06164 7.79579 5.11782 7.62888 5.20291L7.5247 5.25582C7.38833 5.32618 7.2296 5.40746 7.05888 5.48382C6.61542 5.68237 6.0607 5.86291 5.33688 5.86291C4.30433 5.86291 3.45342 5.56891 2.86215 5.27655C2.62274 5.15869 2.3923 5.02341 2.1727 4.87182C2.09113 4.8153 2.0118 4.75562 1.93488 4.69291L1.92015 4.68037L1.91579 4.67655L1.91415 4.67491H1.9136C1.9136 4.67491 1.91306 4.67437 2.17761 4.37109L1.91306 4.67437L1.85742 4.62528C1.63834 5.29039 1.5813 5.99821 1.69106 6.68982L1.89288 6.68164H1.89779L1.90979 6.68109L1.95288 6.68C1.98997 6.67891 2.04197 6.67855 2.10888 6.67891C2.24142 6.67946 2.4296 6.68437 2.65597 6.69909C3.10651 6.72855 3.71633 6.8 4.33924 6.97073C4.53342 7.02418 4.72597 7.11037 4.90542 7.19491L5.03088 7.25491C5.17542 7.32364 5.31997 7.39291 5.48088 7.46C5.9577 7.66748 6.47233 7.7739 6.99233 7.77255C8.1607 7.77255 9.35524 7.30073 9.89415 7.00455L10.2525 6.80818L10.2798 6.85673Z"
        fill={color || "white"}
      />
    </Svg>
  );
}

export function SolarLogoutBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        opacity="0.5"
        d="M6 10C4.93913 10 3.92172 9.57857 3.17157 8.82843C2.42143 8.07828 2 7.06087 2 6C2 4.93913 2.42143 3.92172 3.17157 3.17157C3.92172 2.42143 4.93913 2 6 2V10Z"
        fill={color || "white"}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.235 4.23467C8.16477 4.30498 8.12533 4.40029 8.12533 4.49967C8.12533 4.59905 8.16477 4.69436 8.235 4.76467L9.095 5.62467H5C4.90054 5.62467 4.80516 5.66418 4.73484 5.73451C4.66451 5.80483 4.625 5.90021 4.625 5.99967C4.625 6.09913 4.66451 6.19451 4.73484 6.26483C4.80516 6.33516 4.90054 6.37467 5 6.37467H9.095L8.235 7.23467C8.19816 7.269 8.16861 7.3104 8.14811 7.3564C8.12761 7.4024 8.11659 7.45206 8.1157 7.50241C8.11482 7.55276 8.12408 7.60277 8.14294 7.64947C8.1618 7.69616 8.18987 7.73858 8.22548 7.77419C8.26109 7.8098 8.30351 7.83787 8.3502 7.85673C8.3969 7.87559 8.44691 7.88485 8.49726 7.88397C8.54761 7.88308 8.59727 7.87206 8.64327 7.85156C8.68927 7.83106 8.73067 7.80151 8.765 7.76467L10.265 6.26467C10.3352 6.19436 10.3747 6.09905 10.3747 5.99967C10.3747 5.90029 10.3352 5.80498 10.265 5.73467L8.765 4.23467C8.69469 4.16444 8.59938 4.125 8.5 4.125C8.40062 4.125 8.30531 4.16444 8.235 4.23467Z"
        fill={color || "white"}
      />
    </Svg>
  );
}

export function SolarReviewsHeartBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        d="M3.75001 5.554C3.75001 6.2385 4.40951 6.9565 5.01451 7.471L5.01564 7.47196C5.42638 7.82132 5.63234 7.9965 6.00001 7.9965C6.36801 7.9965 6.57401 7.8215 6.98551 7.471C7.59051 6.956 8.25001 6.2385 8.25001 5.554C8.25001 4.2155 7.01251 3.716 6.00001 4.75C4.98751 3.716 3.75001 4.2155 3.75001 5.554Z"
        fill={color || "white"}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 6C11 8.7615 8.76151 11 6.00001 11C5.20001 11 4.44401 10.812 3.77401 10.478C3.59707 10.3863 3.3927 10.3627 3.19951 10.4115L2.08651 10.7095C1.97634 10.7389 1.86038 10.7388 1.75027 10.7092C1.64016 10.6796 1.53976 10.6216 1.45916 10.5409C1.37857 10.4603 1.3206 10.3599 1.29108 10.2497C1.26157 10.1396 1.26154 10.0236 1.29101 9.9135L1.58851 8.8005C1.63703 8.60741 1.6132 8.40323 1.52151 8.2265C1.17732 7.53483 0.998782 6.77257 1.00001 6C1.00001 3.2385 3.23851 1 6.00001 1C8.76151 1 11 3.2385 11 6ZM5.01451 7.471C4.40951 6.9565 3.75001 6.2385 3.75001 5.554C3.75001 4.2155 4.98751 3.716 6.00001 4.75C7.01251 3.716 8.25001 4.2155 8.25001 5.554C8.25001 6.2385 7.59051 6.956 6.98551 7.471C6.57401 7.8215 6.36801 7.9965 6.00001 7.9965C5.63234 7.9965 5.42638 7.82132 5.01564 7.47196L5.01451 7.471Z"
        fill={color || "white"}
        fillOpacity="0.5"
      />
    </Svg>
  );
}

export function SolarUserBlockBoldDuotone({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path fill={color || "currentColor"} d="M12 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8" />
      <Path
        fill={color || "currentColor"}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.5 15.75a2.75 2.75 0 0 0-2.383 4.123l3.756-3.756a2.74 2.74 0 0 0-1.373-.367m2.42 1.442l-3.728 3.728a2.75 2.75 0 0 0 3.728-3.728M12.25 18.5a4.25 4.25 0 1 1 8.5 0a4.25 4.25 0 0 1-8.5 0"
      />
      <Path
        fill={color || "currentColor"}
        d="M17.996 14.521a4.25 4.25 0 0 0-3.979 7.429Q13.107 22 12 22c-8 0-8-2.015-8-4.5S7.582 13 12 13c2.387 0 4.53.588 5.996 1.521"
        opacity="0.4"
      />
    </Svg>
  );
}

export function SolarPenBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M19.4 1.9L22.1 4.6a2.1 2.1 0 0 1 0 3L19.3 11.4 12.6 4.7 16.4 1.9a2.1 2.1 0 0 1 3 0ZM11.2 6.1L4.5 12.8 1 20a1 1 0 0 0 1.2 1.2l7.2-3.5 6.7-6.7-4.7-4.9Z"
      />
    </Svg>
  );
}

export function ProfileShape({
  size = 44,
  type = "red",
  children }: {
  size?: number;
  type?: keyof typeof SHAPE_PATHS;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center" }}
    >
      <View style={{ position: "absolute", width: size, height: size }}>
        <Svg width="100%" height="100%" viewBox="0 0 60 60">
          <Path
            d={SHAPE_PATHS[type]}
            fill={
              type === "red"
                ? "#F64200"
                : type === "blue"
                  ? "#035DF9"
                  : type === "green"
                    ? "#15AB64"
                    : type === "pink"
                      ? "#EF79D7"
                      : "#A1A1A1"
            }
          />
        </Svg>
      </View>
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        {children}
      </View>
    </View>
  );
}

export function SolarCameraAddBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.46 10.5V19C3.46 20.92 4.027 21.478 5.948 21.523C6.286 21.531 6.628 21.532 6.969 21.532H13"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.5 16V10.5C21.5 8.58 20.933 8.022 19.012 7.977C18.674 7.969 18.332 7.968 17.991 7.968H16.892C15.82 7.968 14.85 7.385 14.352 6.44L13.627 5.062C13.129 4.117 12.159 3.534 11.087 3.534H8.892C7.82 3.534 6.85 4.117 6.352 5.062L5.627 6.44C5.129 7.385 4.159 7.968 3.087 7.968H6C4.08 7.968 3.513 8.526 3.468 10.447C3.46 10.785 3.46 11.127 3.46 11.468"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 18V22"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.5 20H16.5"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarHomeBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9.16016 21.0001V12.0001L12.0002 9.00012L14.8402 12.0001V21.0001"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12L12 2L22 12V21C22 21.5523 21.5523 22 21 22H3C2.44772 22 2 21.5523 2 21V12Z"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarAltArrowDownBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarAltArrowUpBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M19.9201 15.05L13.4001 8.53005C12.6301 7.76005 11.3701 7.76005 10.6001 8.53005L4.08008 15.05"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarRefreshBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.3036 19 6.34267"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 6H19V2"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarInfoCircleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color || "#111827"}
        strokeWidth="1.5"
      />
      <Path
        d="M12 11V16"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 8H12.01"
        stroke={color || "#111827"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function SolarHourglassBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 12L19 5H5L12 12ZM12 12L5 19H19L12 12Z"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 2H19"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 22H19"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarAltArrowRightLowBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M9 19L15 12L9 5"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarLightbulbBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 21C14.7614 21 17 18.7614 17 16C17 14.3333 16 13 15 12C14 11 14 10 14 9C14 7.89543 13.1046 7 12 7C10.8954 7 10 7.89543 10 9C10 10 10 11 9 12C8 13 7 14.3333 7 16C7 18.7614 9.23858 21 12 21Z"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 21H14"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 2V4"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8L6 9"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 8L18 9"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarCloseBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 6L6 18"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6L18 18"
        stroke={color || "#111827"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SolarWidgetBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M3 10V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm0 10v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm11-10V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1Zm0 10v-6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1Z"
        opacity="0.5"
      />
    </Svg>
  );
}

export function SolarFireBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2c0 0-4.5 4.5-4.5 8.5a4.5 4.5 0 0 0 9 0c0-4-4.5-8.5-4.5-8.5Z"
      />
      <Path
        fill={color || "currentColor"}
        d="M12 22C7.582 22 4 18.418 4 14c0-4.418 8-12 8-12s8 7.582 8 12c0 4.418-3.582 8-8 8Z"
        opacity="0.5"
      />
    </Svg>
  );
}

export function SolarTreeBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2L4 12h3v6h10v-6h3L12 2Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="M10 18h4v4h-4z" />
    </Svg>
  );
}

export function SolarExIcon({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 27 17" fill="none" {...props}>
      <Path
        d="M0 16.3342C2.99573 15.595 6.40062 12.1931 8.87516 10.3499C10.7539 8.95056 12.5344 7.38786 14.3058 5.85133C15.4503 4.82162 19.3351 1.01248 20.5624 0.694205L20.6631 0.77428C20.0331 2.22304 14.0786 6.36758 12.7559 7.86821C11.9412 8.79263 7.05325 13.2599 7.16689 14.3823C8.4238 14.2945 20.3323 4.32336 22.0845 3.05699C22.8235 2.52284 25.1521 0.00923939 26.0467 0C25.8574 0.789872 23.2059 2.65758 22.4706 3.29904C20.984 4.59612 19.5563 5.88203 18.1625 7.28613C15.947 9.51811 13.851 11.1722 12.8732 14.3075C17.2857 12.4915 22.1018 7.57582 25.5124 4.21528C25.6825 4.04772 26.0097 3.8791 26.2404 3.85331L26.2836 3.96158C25.6618 5.40745 23.6597 6.68258 22.4926 7.82798C20.8697 9.42081 19.4171 10.9377 17.8686 12.5976C16.584 13.9747 15.835 14.5322 14.6548 16.1655C17.1806 14.0611 19.7304 11.9904 22.3426 9.9975C23.6692 8.98521 25.5394 7.29498 27 6.61685C26.3425 7.94963 24.3386 10.0783 23.3023 11.287C22.466 12.2624 20.8583 14.7933 20.0165 15.4373C20.7405 13.701 23.3785 10.5202 24.6847 9.04787L24.3797 8.92814C22.5227 10.2836 20.7462 11.839 18.9151 13.2C17.789 14.0368 14.9222 16.7536 13.7398 17L13.6411 16.9076C14.0857 15.7752 16.6737 13.1961 17.661 12.3097L17.6004 11.9123C16.9492 12.4276 16.274 12.9107 15.5771 13.36C14.9133 13.7883 13.7034 14.5621 12.9276 14.3859C11.7642 13.343 15.6221 9.27202 16.3942 8.42632L16.5078 7.99092C16.4879 8.0041 16.468 8.017 16.4482 8.03038C14.9312 9.05922 8.00045 15.1758 6.80779 14.882C6.77373 14.8736 6.7407 14.8611 6.70711 14.8507C6.35217 14.031 8.37052 11.9017 8.9202 11.2266L8.66679 10.9995C7.57776 11.9989 1.29986 17.3668 0 16.3342Z"
        fill={color || "currentColor"}
      />
    </Svg>
  );
}

export function SolarCodeBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M14.2 4.2a1 1 0 0 1 .6 1.3l-4 13a1 1 0 0 1-1.9-.6l4-13a1 1 0 0 1 1.3-.7ZM5.7 8.3a1 1 0 0 0-1.4 1.4L7.6 13l-3.3 3.3a1 1 0 1 0 1.4 1.4l4-4a1 1 0 0 0 0-1.4l-4-4Zm12.6 0a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 1 0 1.4-1.4L16.4 13l3.3-3.3a1 1 0 0 0 0-1.4Z"
      />
    </Svg>
  );
}

export function SolarBookmarkSquareMinimalisticBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M3.464 20.536C4.93 22 7.286 22 12 22s7.071 0 8.535-1.464C22 19.07 22 16.714 22 12s0-7.071-1.465-8.536C19.072 2 16.714 2 12 2S4.929 2 3.464 3.464C2 4.93 2 7.286 2 12s0 7.071 1.464 8.536"
        opacity={0.5}
      />
      <Path
        fill={color || "currentColor"}
        d="M7.765 9.898a22 22 0 0 1-.015-1.09v-6.74C8.906 2 10.3 2 12 2s3.094 0 4.25.069v6.739c0 .496 0 .836-.015 1.09c-.015.262-.043.343-.05.358a.75.75 0 0 1-.862.425c-.016-.004-.097-.032-.315-.18a21 21 0 0 1-.872-.653l-.067-.052c-.37-.285-.659-.507-.973-.644a2.75 2.75 0 0 0-2.192 0c-.314.137-.603.359-.973.644l-.067.052c-.393.303-.663.51-.873.653c-.217.148-.298.176-.314.18a.75.75 0 0 1-.862-.425c-.007-.015-.035-.096-.05-.358"
      />
    </Svg>
  );
}

export function Solar4kBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M11 16H9v-2H7v-2h2V9a1 1 0 0 1 1-1h1V6H9a3 3 0 0 0-3 3v3H4v2h2v2a1 1 0 0 0 1 1h4v-1Zm11-4v4c0 1.1-.9 2-2 2h-4v-2h3.3l-2.7-2.7a1 1 0 0 1-1.4 0L14 11.3V14c0 1.1-.9 2-2 2h-1v-2h1v-4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2Z"
      />
    </Svg>
  );
}

const IconMap: Record<string, React.FC<SolarIconProps>> = {
  "bookmark-square-minimalistic-bold-duotone": SolarBookmarkSquareMinimalisticBoldDuotone,
  "home-smile-bold-duotone": SolarHomeSmileBoldDuotone,
  "bell-bing-bold-duotone": SolarBellBingBoldDuotone,
  "heart-bold": SolarHeartBold,
  "map-bold-duotone": SolarMapBoldDuotone,
  "star-bold": SolarStarBold,
  "banknote-bold": SolarBanknoteBold,
  "map-point-bold": SolarMapPointBold,
  "chart-bold": SolarChartBold,
  "bell-bold": SolarBellBold,
  "map-point-linear": SolarMapPointLinear,
  "settings-bold": SolarSettingsBold,
  "trash-bin-bold": SolarTrashBinBold,
  "add-square-bold": SolarAddSquareBold,
  "alt-arrow-left-bold": SolarAltArrowLeftBold,
  "alt-arrow-right-bold": SolarAltArrowRightBold,
  "check-circle-bold": SolarCheckCircleBold,
  "close-circle-bold": SolarCloseCircleBold,
  "notes-bold-duotone": SolarNotesBoldDuotone,
  "users-group-bold": SolarUsersGroupBold,
  "alt-arrow-right-linear": SolarAltArrowRightLinear,
  "magnifier-bold": SolarMagnifierBold,
  "user-bold": SolarUserBold,
  "gallery-bold": SolarGalleryBold,
  "calendar-minimalistic-bold": SolarCalendarMinimalisticBold,
  "clock-circle-linear": SolarClockCircleLinear,
  "lock-bold": SolarLockBold,
  "shop-bold": SolarShopBold,
  "card-bold": SolarCardBold,
  "add-circle-bold": SolarAddCircleBold,
  "alt-arrow-down-linear": SolarAltArrowDownLinear,
  "alt-arrow-left-linear": SolarAltArrowLeftLinear,
  "sun-bold": SolarSunBold,
  "moon-bold": SolarMoonBold,
  "water-bold": SolarWaterBold,
  "wifi-bold": SolarWifiBold,
  "wind-bold": SolarWindBold,
  "key-bold": SolarKeyBold,
  "forbidden-bold": SolarForbiddenBold,
  "forbidden-circle-line-duotone": SolarForbiddenCircleLineDuotone,
  "shield-check-bold": SolarShieldCheckBold,
  "clock-circle-bold": SolarClockCircleBold,
  "menu-dots-bold": SolarMenuDotsBold,
  "home-2-bold": SolarHome2Bold,
  "camera-bold": SolarCameraBold,
  "users-group-rounded-bold": SolarUsersGroupRoundedBold,
  "calendar-add-bold": SolarCalendarAddBold,
  "danger-circle-bold": SolarDangerCircleBold,
  "chat-line-linear": SolarChatLineLinear,
  "add-bold": SolarAddBold,
  "minus-bold": SolarMinusBold,
  "filter-bold": SolarFilterBold,
  "bed-bold": SolarBedBold,
  "wallet-bold": SolarWalletBold,
  "calendar-bold": SolarCalendarBold,
  "global-bold": SolarGlobalBold,
  "phone-bold": SolarPhoneBold,
  "shield-bold": SolarShieldBold,
  "logout-bold": SolarLogoutBold,
  "pen-bold": SolarPenBold,
  "widget-bold": SolarWidgetBold,
  "fire-bold": SolarFireBold,
  "tree-bold": SolarTreeBold,
  "ex-icon": SolarExIcon,
  "code-bold": SolarCodeBold,
  "4k-bold": Solar4kBold,
  "camera-add-bold": SolarCameraAddBold,
  "home-bold": SolarHomeBold,
  "alt-arrow-down-bold": SolarAltArrowDownBold,
  "alt-arrow-up-bold": SolarAltArrowUpBold,
  "refresh-bold": SolarRefreshBold,
  "info-circle-bold": SolarInfoCircleBold,
  "hourglass-bold": SolarHourglassBold,
  "alt-arrow-right-low-bold": SolarAltArrowRightLowBold,
  "lightbulb-bold": SolarLightbulbBold,
  "close-bold": SolarCloseBold,
  "wheel-bold": SolarWheelBold,
  "square-share-line-bold-duotone": SolarSquareShareLineBoldDuotone,
  "danger-triangle-bold": SolarDangerTriangleBold,
  "notebook-bold": SolarNotebookBold,
  "shield-warning-bold": SolarShieldWarningBold,
  "smart-home-bold": SolarSmartHomeBold,
  "chalet-rules-bold": SolarChaletRulesBold };

export function SolarWheelBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
      <Path
        fill={color || SafeColors.primary}
        fillRule="evenodd"
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10m5.954-9.25h-3.049a3 3 0 0 1-.803 1.39l1.524 2.64a6 6 0 0 0 2.328-4.03m-3.626 4.782l-1.525-2.64a3 3 0 0 1-1.606 0l-1.525 2.64A6 6 0 0 0 12 18c.825 0 1.612-.167 2.328-.468m-5.954-.751l1.524-2.64a3 3 0 0 1-.804-1.391H6.046a6 6 0 0 0 2.328 4.03m9.58-5.531h-3.049a3 3 0 0 0-.803-1.39l1.524-2.64a6 6 0 0 1 2.328 4.03m-3.626-4.782A6 6 0 0 0 12 6c-.825 0-1.612.167-2.328.468l1.525 2.64a3 3 0 0 1 1.606 0zM9.898 9.86L8.374 7.22a6 6 0 0 0-2.328 4.03h3.049c.138-.535.42-1.013.803-1.39"
        clipRule="evenodd"
      />
    </Svg>
  );
}

export function SolarSquareShareLineBoldDuotone({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...props}>
      <Path
        fill={color || SafeColors.primary}
        d="M3.464 3.464C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536"
        opacity=".5"
      />
      <Path
        fill={color || SafeColors.primary}
        fillRule="evenodd"
        d="M16.47 1.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l3.72-3.72H14c-1.552 0-2.467.757-2.788 1.08l-.19.191l-.193.191c-.322.32-1.079 1.236-1.079 2.788v3a.75.75 0 0 1-1.5 0v-3c0-2.084 1.027-3.36 1.521-3.851l.19-.189l.188-.189C10.64 7.277 11.916 6.25 14 6.25h6.19l-3.72-3.72a.75.75 0 0 1 0-1.06"
        clipRule="evenodd"
      />
    </Svg>
  );
}

export type IconName = keyof typeof IconMap;

export function SolarIcon({
  name,
  ...props
}: SolarIconProps & { name: string }) {
  const Icon = IconMap[name];
  if (!Icon) {
    return null;
  }
  return <Icon {...props} />;
}

export function SolarDangerTriangleBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "#FFFFFF"}
        fillRule="evenodd"
        d="M12 3c-.5 0-.96.26-1.21.68l-8.5 14.5c-.26.44-.27.99-.01 1.44s.74.73 1.25.73h17.01c.5 0 .99-.28 1.25-.73s.25-1 .01-1.44L13.25 3.68c-.29-.42-.75-.68-1.25-.68zm-1 6a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0V9zm1 10a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z"
        clipRule="evenodd"
      />
    </Svg>
  );
}
export function SolarTrashBinMinimalisticLinear({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20.5 6H3.5M20.5 6L18.724 19.3179C18.625 20.0619 18.016 20.6139 17.268 20.6139H6.732C5.984 20.6139 5.375 20.0619 5.276 19.3179L3.5 6M20.5 6L18.5 6V4.5C18.5 3.395 17.605 2.5 16.5 2.5H7.5C6.395 2.5 5.5 3.395 5.5 4.5V6M9.5 11V15M14.5 11V15"
        stroke={color || "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
export function SolarInboxLinear({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        stroke={color || "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M20 12L4 12"
      />
      <Path
        stroke={color || "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M15 16L9 16"
      />
      <Path
        stroke={color || "currentColor"}
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M3.17 7.43a2 2 0 0 1 1.97-1.43h13.72a2 2 0 0 1 1.97 1.43l1.83 6.42A4 4 0 0 1 18.8 19H5.2a4 4 0 0 1-3.86-5.15l1.83-6.42z"
      />
    </Svg>
  );
}export function SolarNotebookBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M20 12c0-4.714 0-7.071-1.464-8.536C17.07 2 14.714 2 10 2s-7.071 0-8.536 1.464C0 4.93 0 7.286 0 12s0 7.071 1.464 8.536C2.93 22 5.286 22 10 22s7.071 0 8.536-1.465C20 19.072 20 16.714 20 12Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="M5 8h10M5 12h10M5 16h6" />
    </Svg>
  );
}

export function SolarShieldWarningBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="M12 7v6m0 3.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Z" stroke={color || "currentColor"} strokeWidth="1.5" />
    </Svg>
  );
}

export function SolarSmartHomeBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2L2 12h3v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8h3L12 2Z"
        opacity="0.5"
      />
      <Circle cx="12" cy="13" r="3" fill={color || "currentColor"} />
    </Svg>
  );
}

export function SolarProfileEdit({ size = 22, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none" {...props}>
      <Path
        opacity={0.15}
        d="M10.9997 20.1663C16.0623 20.1663 20.1663 16.0623 20.1663 10.9997C20.1663 5.93706 16.0623 1.83301 10.9997 1.83301C5.93706 1.83301 1.83301 5.93706 1.83301 10.9997C1.83301 16.0623 5.93706 20.1663 10.9997 20.1663Z"
        fill={color || SafeColors.primary}
      />
      <Path
        d="M12.7653 13.1102C12.9898 12.9351 13.1933 12.7316 13.6013 12.3237L18.6796 7.24537C18.8024 7.12254 18.7465 6.91079 18.5824 6.85395C17.7887 6.57543 17.068 6.1214 16.4741 5.5257C15.8781 4.93187 15.4237 4.2112 15.1449 3.41737C15.089 3.25237 14.8773 3.19737 14.7544 3.3202L9.67608 8.39854C9.26817 8.80554 9.06467 9.00995 8.88958 9.23454C8.6825 9.49907 8.50513 9.78557 8.36067 10.0889C8.23875 10.3455 8.14708 10.6196 7.96558 11.166L7.73 11.8718L7.35508 12.9956L7.00492 14.048C6.96118 14.1797 6.95494 14.3211 6.9869 14.4562C7.01886 14.5913 7.08776 14.7149 7.18589 14.8132C7.28403 14.9114 7.40754 14.9804 7.54264 15.0125C7.67773 15.0446 7.81909 15.0385 7.95092 14.9949L9.00508 14.6438L10.1271 14.2698L10.8329 14.0342C11.3802 13.8518 11.6533 13.761 11.91 13.6382C12.2143 13.4934 12.4994 13.3174 12.7653 13.1102ZM20.27 5.65587C20.7906 5.13536 21.0832 4.42935 21.0833 3.69315C21.0833 2.95695 20.791 2.25088 20.2705 1.73024C19.7499 1.20961 19.0439 0.917078 18.3077 0.916992C17.5715 0.916906 16.8655 1.20928 16.3448 1.72979L16.1808 1.89295C16.103 1.96949 16.0452 2.06388 16.0123 2.16789C15.9793 2.2719 15.9724 2.38238 15.9919 2.4897C16.0167 2.6272 16.0625 2.82887 16.1459 3.06995C16.3704 3.71348 16.7384 4.29747 17.2221 4.7777C17.702 5.26123 18.2857 5.62924 18.9289 5.85387C19.17 5.93637 19.3717 5.98312 19.5092 6.00787C19.7292 6.04729 19.9492 5.97579 20.1068 5.81812L20.27 5.65587Z"
        fill={color || SafeColors.primary}
      />
    </Svg>
  );
}

export function SolarChaletRulesBold({ size = 24, color, ...props }: SolarIconProps) {
  const fillColor = color || SafeColors.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 23 24" fill="none" {...props}>
      <Path d="M12.9744 10.3088L11.7087 11.5757C12.3245 12.1915 13.1597 12.5362 14.0305 12.5362C14.9014 12.5362 15.7366 12.1903 16.3524 11.5745L15.0855 10.3088C14.9469 10.4474 14.7823 10.5574 14.6012 10.6324C14.4201 10.7075 14.226 10.7461 14.0299 10.7461C13.8339 10.7461 13.6398 10.7075 13.4586 10.6324C13.2775 10.5574 13.113 10.4474 12.9744 10.3088Z" fill={fillColor} opacity={0.5}/>
      <Path d="M15.0855 10.3088L16.3524 11.5745C16.9682 10.9587 17.3129 10.1235 17.3129 9.25264C17.3129 8.38178 16.967 7.54659 16.3512 6.93078L15.0855 8.19768C15.2241 8.33629 15.3341 8.50084 15.4091 8.68196C15.4842 8.86307 15.5228 9.05719 15.5228 9.25323C15.5228 9.44928 15.4842 9.6434 15.4091 9.82451C15.3341 10.0056 15.2241 10.1702 15.0855 10.3088Z" fill={fillColor} opacity={0.5}/>
      <Path d="M11.7087 6.93198L12.9744 8.19768C13.113 8.05904 13.2775 7.94906 13.4586 7.87403C13.6398 7.799 13.8339 7.76038 14.0299 7.76038C14.226 7.76038 14.4201 7.799 14.6012 7.87403C14.7823 7.94906 14.9469 8.05904 15.0855 8.19768L16.3512 6.93078C15.7354 6.31501 14.9002 5.97026 14.0293 5.97026C13.1585 5.97026 12.3245 6.3162 11.7087 6.93198Z" fill={fillColor} opacity={0.5}/>
      <Path d="M12.9744 10.3088C12.8357 10.1702 12.7258 10.0056 12.6507 9.82451C12.5757 9.6434 12.5371 9.44928 12.5371 9.25323C12.5371 9.05719 12.5757 8.86307 12.6507 8.68196C12.7258 8.50084 12.8357 8.33629 12.9744 8.19768L11.7087 6.93198C11.0929 7.54778 10.747 8.38297 10.747 9.25383C10.747 10.1247 11.0929 10.9599 11.7087 11.5757L12.9744 10.3088Z" fill={fillColor} opacity={0.5}/>
      <Path d="M6.43449 17.6869L5.17475 18.9598L6.6231 20.3932L7.25959 19.7562L7.88877 19.127L6.43449 17.6869Z" fill={fillColor} opacity={0.5}/>
      <Path fillRule="evenodd" clipRule="evenodd" d="M5.77895 21.2381L6.6231 20.3932L7.25959 19.7562L7.88877 19.127L10.2113 16.8045C10.788 16.2278 11.6024 16.0833 12.3045 16.2624C13.5431 16.5825 14.8437 16.5735 16.0777 16.2363C17.3118 15.8991 18.4363 15.2454 19.3399 14.3399C20.1738 13.5106 20.7945 12.4917 21.1489 11.3703L22.8564 11.9136C22.4148 13.3081 21.6426 14.574 20.6056 15.6057C19.4818 16.7308 18.0838 17.5443 16.5498 17.9633C15.0157 18.3824 13.3989 18.3937 11.8591 17.9962C11.68 17.9508 11.5439 18.0057 11.477 18.0714L8.52529 21.0231L7.04465 22.5038C6.76235 22.7862 6.42013 23.0004 6.04333 23.1326C5.66652 23.2649 5.26479 23.3108 4.86788 23.2668L2.37348 22.9897C1.90541 22.9384 1.46957 22.7294 1.13643 22.3951L0.888065 22.1467C0.554921 21.8136 0.344766 21.3778 0.293421 20.9097L0.0163982 18.4153C-0.0276061 18.0184 0.0170365 17.6166 0.14932 17.2398C0.281604 16.863 0.496947 16.5208 0.779405 16.2385L5.21296 11.8061C5.27983 11.7393 5.33237 11.6032 5.28699 11.424C4.88961 9.88419 4.90112 8.26727 5.32039 6.73324C5.73966 5.1992 6.55096 3.8012 7.67631 2.67753C9.39092 0.963125 11.7163 0 14.141 0C16.5656 0 18.891 0.963125 20.6056 2.67753C21.7046 3.77123 22.505 5.12824 22.9305 6.61913C22.9655 6.73298 22.9774 6.85267 22.9656 6.97118C22.9537 7.0897 22.9184 7.20467 22.8616 7.30935C22.8048 7.41404 22.7277 7.50635 22.6348 7.58087C22.5418 7.65539 22.435 7.71062 22.3205 7.74334C22.206 7.77606 22.0861 7.78561 21.9678 7.77143C21.8495 7.75724 21.7353 7.71961 21.6318 7.66073C21.5282 7.60186 21.4375 7.52292 21.3648 7.42854C21.2922 7.33416 21.2391 7.22624 21.2086 7.11109C20.867 5.91266 20.2236 4.82194 19.3399 3.94323C18.6572 3.26043 17.8467 2.71879 16.9547 2.34926C16.0626 1.97972 15.1065 1.78952 14.141 1.78952C13.1754 1.78952 12.2193 1.97972 11.3273 2.34926C10.4352 2.71879 9.62472 3.26043 8.94202 3.94323C8.03676 4.84701 7.38447 5.97158 7.04749 7.20559C6.71051 8.43959 6.70171 9.74021 7.02197 10.9787C7.20227 11.6808 7.0566 12.4975 6.47986 13.0742L2.04511 17.5042C1.9525 17.5966 1.88307 17.7098 1.83966 17.8333C1.79626 17.9567 1.78118 18.0882 1.79555 18.2183L2.07258 20.7115C2.07948 20.7754 2.10885 20.8351 2.15377 20.881L2.40214 21.1294C2.44761 21.1745 2.50808 21.2031 2.57169 21.2106L5.0649 21.4876C5.19492 21.502 5.32651 21.4869 5.44991 21.4435C5.57331 21.4001 5.68656 21.3307 5.77895 21.2381ZM21.1489 11.3703C21.1844 11.2582 21.2417 11.1542 21.3174 11.0642C21.3931 10.9742 21.4858 10.9 21.5902 10.8458C21.6946 10.7917 21.8087 10.7586 21.9258 10.7485C22.043 10.7384 22.161 10.7515 22.2731 10.787C22.3853 10.8225 22.4893 10.8798 22.5793 10.9555C22.6693 11.0312 22.7435 11.1239 22.7976 11.2283C22.8518 11.3327 22.8849 11.4467 22.895 11.5639C22.905 11.6811 22.892 11.7991 22.8564 11.9112L21.1489 11.3703Z" fill={fillColor}/>
      <Path d="M6.43449 17.6869C6.35141 17.6019 6.25224 17.5343 6.14277 17.488C6.03329 17.4417 5.9157 17.4177 5.79685 17.4173C5.67799 17.417 5.56025 17.4403 5.45049 17.4859C5.34073 17.5315 5.24115 17.5985 5.15754 17.6829C5.07393 17.7674 5.00798 17.8677 4.96352 17.9779C4.91907 18.0881 4.897 18.2061 4.8986 18.325C4.9002 18.4438 4.92544 18.5611 4.97285 18.6701C5.02027 18.7791 5.0889 18.8776 5.17475 18.9598L6.43449 17.6869Z" fill={fillColor} opacity={0.5}/>
    </Svg>
  );
}

export function SolarDocumentAddBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M3 10c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14z"
        opacity={0.5}
      />
      <Path
        fill={color || "currentColor"}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.25 9A.75.75 0 0 1 8 8.25h6.5a.75.75 0 0 1 0 1.5H8A.75.75 0 0 1 7.25 9m0 4a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75m0 4a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75"
      />
    </Svg>
  );
}

export function SolarMapPointWaveBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M19.717 20.362C21.143 19.585 22 18.587 22 17.5c0-1.152-.963-2.204-2.546-3C17.623 13.58 14.962 13 12 13s-5.623.58-7.454 1.5C2.963 15.296 2 16.348 2 17.5s.963 2.204 2.546 3C6.377 21.42 9.038 22 12 22c3.107 0 5.882-.637 7.717-1.638"
        opacity={0.5}
      />
      <Path
        fill={color || "currentColor"}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 8.515C5 4.917 8.134 2 12 2s7 2.917 7 6.515c0 3.57-2.234 7.735-5.72 9.225a3.28 3.28 0 0 1-2.56 0C7.234 16.25 5 12.084 5 8.515M12 11a2 2 0 1 0 0-4a2 2 0 0 0 0 4"
      />
    </Svg>
  );
}

export function SolarSortByTimeBold({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <G fill="none">
        <Path
          stroke={color || "currentColor"}
          strokeWidth={1.5}
          strokeLinecap="round"
          d="M10 7H2M8 12H2M10 17H2"
        />
        <Circle cx={17} cy={12} r={5} stroke={color || "currentColor"} strokeWidth={1.5} />
        <Path
          stroke={color || "currentColor"}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 10v1.846L18 13"
        />
      </G>
    </Svg>
  );
}

export function SolarPostsCarouselBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M5.5 16V8a3 3 0 0 0-3-3a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5a3 3 0 0 0 3-3m13-8v8a3 3 0 0 0 3 3a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5a3 3 0 0 0-3 3"
        opacity={0.5}
      />
      <Path
        fill={color || "currentColor"}
        d="M11.5 19c-1.886 0-2.828 0-3.414-.586S7.5 16.886 7.5 15V9c0-1.886 0-2.828.586-3.414S9.614 5 11.5 5h1c1.886 0 2.828 0 3.414.586S16.5 7.114 16.5 9v6c0 1.886 0 2.828-.586 3.414S14.386 19 12.5 19z"
      />
    </Svg>
  );
}

export function SolarHomeBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        fillRule="evenodd"
        clipRule="evenodd"
        d="m21.532 11.586l-.782-.626v10.29H22a.75.75 0 0 1 0 1.5H2a.75.75 0 1 1 0-1.5h1.25V10.96l-.781.626a.75.75 0 1 1-.937-1.172l8.125-6.5a3.75 3.75 0 0 1 4.686 0l8.125 6.5a.75.75 0 1 1-.936 1.172M12 6.75a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 0 0 0-5.5"
      />
      <Path
        fill={color || "currentColor"}
        d="M12.05 13.25c.664 0 1.237 0 1.696.062c.492.066.963.215 1.345.597s.531.853.597 1.345c.058.43.062.96.062 1.573v4.423h-7.5v-4.3c0-.664 0-1.237.062-1.696c.066-.492.215-.963.597-1.345s.854-.531 1.345-.597c.459-.062 1.032-.062 1.697-.062z"
        opacity={0.5}
      />
    </Svg>
  );
}
