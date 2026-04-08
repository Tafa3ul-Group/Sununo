import { Colors } from "@/constants/theme";
import { View } from "react-native";
import Svg, { Circle, G, Path, SvgProps } from "react-native-svg";

// Solar Icon Registry - Unified Architecture v1.1

interface SolarIconProps extends SvgProps {
  size?: number | string;
}

export function SolarHomeSmileBoldDuotone({
  size = 24,
  color,
  ...props
}: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || Colors.primary}
        d="M2 12.204c0-2.289 0-3.433.52-4.381c.518-.949 1.467-1.537 3.364-2.715l2-1.241C9.889 2.622 10.892 2 12 2s2.11.622 4.116 1.867l2 1.241c1.897 1.178 2.846 1.766 3.365 2.715S22 9.915 22 12.203v1.522c0 3.9 0 5.851-1.172 7.063S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.212S2 17.626 2 13.725z"
        opacity={0.5}
      />
      <Path
        fill={color || Colors.primary}
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
        fill={color || Colors.primary}
        d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.8 25.8 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.4 4.4 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
        opacity={0.5}
      />
      <Path
        fill={color || Colors.primary}
        d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
      />
    </Svg>
  );
}

export function SolarHeartBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || Colors.primary}
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
        fill={color || Colors.primary}
        d="M3 8.71v8.128c0 1.043 0 1.565.283 1.958s.778.558 1.768.888l1.165.388c1.367.456 2.05.684 2.739.591L9 20.657v-14a3 3 0 0 1-.34.031c-.54.019-1.074-.16-2.141-.515c-1.398-.466-2.097-.699-2.629-.462a1.5 1.5 0 0 0-.497.358C3 6.5 3 7.236 3 8.71m18 6.58V7.163c0-1.043 0-1.565-.283-1.958s-.778-.558-1.768-.888l-1.165-.388c-1.367-.456-2.05-.684-2.739-.591L15 3.343v14q.17-.025.34-.031c.54-.019 1.074.16 2.141.515c1.398.466 2.097.699 2.629.462a1.5 1.5 0 0 0 .497-.358C21 17.5 21 16.764 21 15.29"
        opacity={0.5}
      />
      <Path
        fill={color || Colors.primary}
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
      <Path fill={color || "currentColor"} d="M12 8v8m-4-4h8" />
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
        d="M12 22s-10-4.477-10-10s4.477-10 10-10s10 4.477 10 10s-4.477 10-10 10Z"
        opacity="0.5"
      />
      <Path fill={color || "currentColor"} d="m9 9l6 6m0-6l-6 6" />
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
  info: "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
};

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
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M19 4h-1V2h-2v2H8V2H6v2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3ZM5 6h14a1 1 0 0 1 1 1v2H4V7a1 1 0 0 1 1-1Zm14 14H5a1 1 0 0 1-1-1V11h16v8a1 1 0 0 1-1 1Z"
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
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 0 1-8-8 7.9 7.9 0 0 1 .4-2.5h2.9a13 13 0 0 1 .7 2.5 13 13 0 0 1-.7 2.5H4.4a8 8 0 0 1 7.6 5.5Zm0-2a11.1 11.1 0 0 0 .9-2.5h-1.8a11.1 11.1 0 0 0 .9 2.5Zm0-12a11.1 11.1 0 0 0-.9 2.5h1.8A11.1 11.1 0 0 0 12 4Zm3.2 1.5a8 8 0 0 1 2.4 4h-2.9a13 13 0 0 0-.7-2.5 12.5 12.5 0 0 0 1.2-1.5Zm-6.4 0a12.5 12.5 0 0 0-1.2 1.5 13 13 0 0 0 .7 2.5H5.4a8 8 0 0 1 3-4Zm-.7 10a13 13 0 0 0 .7 2.5 12.5 12.5 0 0 1-1.2 1.5 8 8 0 0 1-3-4h2.9v1h.6Zm4.8 4a12.5 12.5 0 0 1 1.2-1.5 13 13 0 0 0-.7-2.5h2.9a8 8 0 0 1-3.4 4Z"
      />
    </Svg>
  );
}

export function SolarPhoneBold({ size = 24, color, ...props }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M18.3 22a15.2 15.2 0 0 1-7.2-2.1A14.9 14.9 0 0 1 5.9 15.1 15.2 15.2 0 0 1 2.3 8a4.3 4.3 0 0 1 1.3-3.1L5.9 3.1A2 2 0 0 1 8.7 3.1L10.5 5a2 2 0 0 1 0 2.8L9.2 9.1a1 1 0 0 0 0 1.4 10.6 10.6 0 0 0 4.3 4.3 1 1 0 0 0 1.4 0l1.3-1.3a2 2 0 0 1 2.8 0l1.9 1.9a2 2 0 0 1 0 2.8l-1.8 2.3a4.3 4.3 0 0 1-3.8 1.5Z"
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
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4Zm0 19.9c-4.2-1.2-7-5.4-7-9.9V6.4l7-3.1 7 3.1v4.6c0 4.5-2.8 8.7-7 9.9Z"
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
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        fill={color || "currentColor"}
        d="M15 16.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1 1 1 0 0 0 2 0v-9A3 3 0 0 0 14 2H4a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3 1 1 0 0 0-2 0ZM22.7 11.3l-4-4a1 1 0 0 0-1.4 1.4L18.6 10H8a1 1 0 0 0 0 2h10.6l-1.3 1.3a1 1 0 0 0 1.4 1.4l4-4a1 1 0 0 0 0-1.4Z"
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
  children,
}: {
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
        alignItems: "center",
      }}
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
};

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
