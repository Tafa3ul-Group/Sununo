import React, { useMemo } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Image as ExpoImage } from "expo-image";
import { ThemedText } from "@/components/themed-text";
import { HostContactCard } from "@/components/user/host-contact-card";
import { SecondaryButton } from "@/components/user/secondary-button";
import {
  SolarForbiddenCircleLineDuotone,
  SolarMoonBold,
  SolarStarBold,
  SolarSunBold,
  SolarWidgetBold,
} from "@/components/icons/solar-icons";
import { getImageSrc, getAvatarSrc } from "@/hooks/useImageSrc";
import { useFormatTime } from "@/hooks/useFormatTime";
import { useDirection } from "@/i18n";
import { Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Shape assets (shared with the single chalet page design) ──────────────────
const SHAPES = {
  blue: "M31.177 60L31.7712 59.9376C32.8672 59.232 36.7817 53.2436 37.8737 51.728C40.3267 52.6508 43.5285 53.5787 46.0539 54.4214C46.6842 54.6319 47.1961 54.5513 47.7421 54.1911C48.543 53.009 48.4848 46.1697 48.5932 44.2386C51.3936 43.3932 54.3204 42.7398 57.1026 41.877C57.8393 41.6485 58.032 41.2674 58.291 40.674C58.2268 39.2385 54.5572 33.6731 53.5736 31.9774C55.4164 29.9328 57.2973 27.9347 59.1442 25.8993C59.8909 25.0775 60.0555 24.7649 59.9852 23.7883C59.2746 22.6217 53.0717 19.9015 51.2751 18.9984C51.6967 16.1161 52.2507 13.4061 52.7466 10.5491C52.8831 9.75984 52.8288 9.24161 52.3531 8.62877C51.0242 7.87675 44.2954 9.10223 42.288 9.36357C41.2482 6.79897 40.2926 4.18695 39.2387 1.63228C38.8232 0.627833 38.5883 0.336505 37.697 1.49012e-06C36.2838 0.167544 31.3898 4.6203 29.8581 5.88326C28.2101 5.91851 22.5873 0.0391017 20.6823 0.560774C19.6525 1.92219 17.8438 8.34534 17.2316 10.3089C15.196 10.2469 8.20426 9.36458 7.01989 10.4574C6.33938 11.9432 8.50738 18.5541 9.06143 20.5286C6.98778 21.7352 1.51158 24.7799 0 26.128C1.22652 27.8168 5.83953 32.0045 7.64017 33.6889C1.56375 45.7068 1.28272 42.6296 13.4938 45.5763C13.8109 47.6571 13.9193 54.5019 15.3245 55.5511C16.7377 55.8748 22.9165 52.9707 24.7292 52.2229C26.837 54.8499 28.9869 57.4427 31.177 60Z",
  green:
    "M29.4165 59.9929C32.7707 60.1573 33.8516 57.4154 36.6494 56.5727C39.068 55.844 42.1373 57.9136 44.602 56.1435C46.9761 54.4385 47.1003 51.1778 49.39 49.5262C50.4402 48.7686 52.2285 48.273 53.3904 47.6556C57.9159 45.2507 55.39 40.9854 56.6649 37.1198C57.1904 35.527 59.1812 33.5316 59.751 31.5682C61.0163 27.2086 57.083 25.3948 56.3847 21.7944C55.9755 19.6849 56.7103 16.6837 55.7598 14.6214C54.353 11.5687 50.787 11.9068 48.8393 9.92411C46.9162 7.96647 46.7071 4.83632 44.0101 3.40727C41.8302 2.25218 38.8321 3.99511 36.9305 3.46716C34.6099 2.82303 33.5786 0.936956 30.7928 0.00846604C26.7125 -0.17205 26.2613 2.58433 22.9082 3.49519C20.8505 4.05394 17.7655 1.94318 15.3255 3.77446C12.937 5.5671 12.9572 8.61484 10.6792 10.3017C9.69816 11.028 7.80148 11.597 6.71476 12.167C2.02929 14.6248 4.47819 18.6917 3.31327 22.6894C2.84735 24.2881 0.782415 26.4167 0.259212 28.2376C-0.909281 32.3028 2.18416 34.1827 3.35303 37.3834C4.22685 39.776 3.04536 42.7163 4.19953 45.2418C5.67644 48.4732 9.28102 47.9739 11.2678 50.1348C13.0367 52.0591 13.2797 55.0582 15.8605 56.4423C18.0647 57.6243 21.3307 55.8827 23.1837 56.5279C25.7251 57.4128 26.4182 58.9797 29.4165 59.9929Z",
  pink: "M24.91 0C27.0701 0.496535 28.2561 2.03453 30.0498 3.51362C35.1705 -1.23292 35.9096 -1.06671 38.9761 5.08738C41.9346 4.27946 45.7444 1.47486 46.5131 6.62746C46.6677 7.66051 46.799 8.70829 46.9346 9.74344C48.7537 9.89914 52.4237 9.16486 53.3598 11.1426C53.9993 12.4912 53.04 15.3484 52.6631 16.7854C59.6389 19.5437 59.605 18.6621 55.8672 25.4811C61.2844 29.75 61.4707 30.2655 55.8651 34.5681C56.5555 35.8641 57.4534 37.0634 58.04 38.372C59.5097 41.6521 55.0243 42.4011 52.6673 43.2175C53.0972 44.7807 53.9633 47.5769 53.3365 49.159C52.4153 51.4797 48.9528 49.422 47.4915 50.2594C45.9053 51.3156 46.6508 54.0634 46.1806 55.3868C45.3272 57.7895 40.4479 55.4457 39.0375 54.8923C37.805 57.0342 37.6165 58.3597 35.6533 59.9987C33.1777 60.0576 32.0214 58.1703 29.9545 56.5334C24.3764 61.0275 24.6644 61.6187 20.9223 54.8587C13.1904 57.5559 14.6326 57.5833 12.985 50.1185C5.51574 50.5645 5.97528 49.9606 7.20145 43.127C0.683039 40.8252 0.0943126 40.8926 4.1625 34.6059C1.87533 32.5483 -2.41311 30.68 1.74191 27.341C2.54877 26.693 3.37257 26.0513 4.17731 25.399C0.168422 19.2702 0.651283 19.1881 7.18452 16.8422C6.26754 10.2295 5.00113 9.57512 13.0909 9.76237C14.2154 2.29752 14.046 2.80668 21.007 5.08316C22.3052 3.02339 22.3666 0.969926 24.91 0Z",
  red: "M26.0603 60C29.9658 59.4325 29.8391 57.154 32.7123 55.3719C34.9225 54.1301 37.5529 56.9614 39.3811 57.3718C44.9058 58.6116 45.0155 53.8851 45.7481 50.2915C46.6896 46.8466 51.9145 48.769 54.0192 47.2906C58.6446 44.0383 54.2219 40.5348 54.091 37.1548C54.015 35.1591 59.4109 33.2953 59.8817 30.686C60.7641 25.7794 56.4955 25.9343 54.2493 22.9543C53.2593 21.2225 55.2331 18.2886 55.4822 16.8143C56.5335 10.6114 50.9476 11.4512 47.0992 11.0554C44.5891 10.7957 44.7707 5.60846 43.789 4.02109C42.7863 2.40231 41.7835 2.19288 40.0292 1.73217C37.2468 2.50491 35.7226 3.96454 33.0732 4.97811C29.9193 4.0148 28.8406 -0.579781 24.7388 0.0610315C21.5701 0.0359016 20.8671 5.11424 19.5751 6.16131C15.2897 9.63133 12.864 2.85464 8.01704 8.83346C7.91359 10.2303 8.34847 15.4992 7.88615 16.2991C6.25008 19.1388 -0.948651 18.253 0.10477 23.4151C0.647314 26.0705 2.92303 27.662 4.08201 30.02L4.18968 30.2441C3.20803 32.4388 0.824638 34.7235 0.389759 36.803C-0.691106 41.9798 5.48587 41.5358 7.9347 43.7054C9.67633 45.2467 7.4935 50.3062 9.13168 52.2118C11.3251 55.9604 16.8983 52.3584 18.8236 53.1061C22.3723 54.4819 20.7087 58.6535 26.0603 60Z",
};
const SHAPE_KEYS = ["blue", "green", "pink", "red"] as const;
type ShapeKey = (typeof SHAPE_KEYS)[number];
const SHAPE_COLORS: Record<ShapeKey, string> = {
  blue: "#035DF9",
  green: "#15AB64",
  pink: "#EF79D7",
  red: "#F64200",
};

function SectionHeader({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <View
      style={[
        styles.sectionHeaderContainer,
        { alignItems: "flex-start", direction: isRTL ? "rtl" : "ltr" },
      ]}
    >
      <ThemedText
        style={[styles.sectionTitle, { textAlign: isRTL ? "right" : "left" }]}
      >
        {title}
      </ThemedText>
    </View>
  );
}

const pickLang = (val: any, isRTL: boolean): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return isRTL
    ? val.ar || val.nameAr || val.name || ""
    : val.en || val.nameEn || val.name || "";
};

export interface ChaletDetailsBodyProps {
  /** Full chalet detail object (shifts, chaletFeatures, description, owner...). */
  chalet: any;
  /** Map area content (interactive Mapbox on the page, static image in the drawer). */
  mapNode?: React.ReactNode;
  /** Show the "Get directions" button — only in the explore drawer, never on the page. */
  showRouteButton?: boolean;
  onRoutePress?: () => void;
  /** Navigate to the full facilities list (shown when there are more than 8). */
  onSeeAllFacilities?: () => void;
  style?: ViewStyle;
}

/**
 * Single source of truth for the chalet detail layout. Rendered on the single
 * chalet page and inside the explore drawer so both stay visually identical.
 */
export function ChaletDetailsBody({
  chalet,
  mapNode,
  showRouteButton = false,
  onRoutePress,
  onSeeAllFacilities,
  style,
}: ChaletDetailsBodyProps) {
  const { isRTL, textAlign } = useDirection();
  const { formatShiftTime } = useFormatTime();

  const name = pickLang(chalet?.name, isRTL);
  const location =
    pickLang(chalet?.region?.name, isRTL) || pickLang(chalet?.city, isRTL);
  const description = pickLang(chalet?.description, isRTL);
  const rating = chalet?.averageRating || chalet?.rating || 0;
  const shifts: any[] = chalet?.shifts || [];

  const facilities = useMemo(() => {
    const apiFeatures = chalet?.chaletFeatures || chalet?.amenities || [];
    return apiFeatures.map((item: any, idx: number) => {
      const feature = item.feature || item;
      const shapeKey = SHAPE_KEYS[idx % SHAPE_KEYS.length];
      return {
        label: pickLang(feature.name, isRTL),
        iconUrl: feature.icon ? getImageSrc(feature.icon) : null,
        shapeColor: SHAPE_COLORS[shapeKey],
        shapePath: SHAPES[shapeKey],
      };
    });
  }, [chalet?.chaletFeatures, chalet?.amenities, isRTL]);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Title + rating */}
      <View
        style={{
          flexDirection: "row",
          direction: isRTL ? "rtl" : "ltr",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          marginBottom: 20,
        }}
      >
        <View style={{ flex: 1 }}>
          <ThemedText
            style={[styles.mainTitle, { textAlign: isRTL ? "left" : "right" }]}
            numberOfLines={2}
          >
            {name}
          </ThemedText>
          <ThemedText
            style={[
              styles.locationSub,
              { textAlign: isRTL ? "left" : "right", marginTop: 4 },
            ]}
          >
            {location}
          </ThemedText>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginStart: 12,
          }}
        >
          <SolarStarBold size={14} color="#035DF9" />
          <ThemedText style={styles.ratingVal}>
            {Number(rating || 0).toFixed(1)}
          </ThemedText>
        </View>
      </View>

      {/* Basic specifications */}
      <SectionHeader
        title={isRTL ? "المواصفات الأساسية" : "Basic Specifications"}
        isRTL={isRTL}
      />
      <View
        style={[
          styles.specsRow,
          { flexDirection: "row", direction: isRTL ? "rtl" : "ltr" },
        ]}
      >
        {[
          `${chalet?.area || 0} ${isRTL ? "م" : "m"}`,
          `${isRTL ? "حمام" : "Bathroom"} ${chalet?.bathrooms || 0}`,
          `${chalet?.bedrooms || 0} ${isRTL ? "غرف" : "Rooms"}`,
        ].map((label, i) => (
          <View key={i} style={styles.specTag}>
            <ThemedText style={styles.specText}>{label}</ThemedText>
          </View>
        ))}
      </View>

      {/* Get directions (drawer only) — full width */}
      {showRouteButton && (
        <View style={{ marginTop: 16, flexDirection: "row" }}>
          <SecondaryButton
            label={isRTL ? "اذهب للمسار" : "Get Directions"}
            isActive
            activeColor="#22C55E"
            activeTextColor="#FFFFFF"
            style={{ flex: 1 }}
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
            iconPosition={isRTL ? "left" : "right"}
            onPress={onRoutePress}
            height={52}
          />
        </View>
      )}

      {/* Available shifts */}
      <SectionHeader
        title={isRTL ? "الفترات المتوفرة" : "Available Periods"}
        isRTL={isRTL}
      />
      <View style={styles.shiftsGrid}>
        {shifts.length > 0 ? (
          shifts.map((shift: any, index: number) => {
            const validPrices =
              shift.pricing
                ?.map((p: any) => Number(p.price))
                .filter((p: number) => p > 1) || [];
            const minPrice =
              validPrices.length > 0
                ? Math.min(...validPrices).toLocaleString()
                : null;
            const nameEn = shift.name?.en?.toLowerCase() || "";
            const nameAr = shift.name?.ar || "";
            const isOvernight =
              shift.type === "OVERNIGHT" ||
              nameEn.includes("overnight") ||
              nameEn.includes("night") ||
              nameAr.includes("مبيت");
            const isMorning =
              !isOvernight &&
              (shift.type === "MORNING" ||
                nameEn.includes("morning") ||
                nameAr.includes("صباح"));
            return (
              <View
                key={shift.id || index}
                style={[
                  styles.shiftCard,
                  { flexDirection: "row", direction: isRTL ? "rtl" : "ltr" },
                ]}
              >
                <View style={styles.shiftIconCircle}>
                  {isMorning ? (
                    <SolarSunBold size={22} color="#FBBF24" />
                  ) : isOvernight ? (
                    <ExpoImage
                      source={require("@/assets/shifts/sleep.svg")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  ) : (
                    <SolarMoonBold size={22} color="#6366F1" />
                  )}
                </View>
                <View style={[styles.shiftInfo, { alignItems: "flex-start" }]}>
                  <ThemedText
                    style={[styles.shiftName, { textAlign: isRTL ? "right" : "left" }]}
                  >
                    {pickLang(shift.name, isRTL)}
                  </ThemedText>
                  <ThemedText
                    style={[styles.shiftTime, { textAlign: isRTL ? "right" : "left" }]}
                  >
                    {formatShiftTime(shift.startTime)} -{" "}
                    {formatShiftTime(shift.endTime)}
                  </ThemedText>
                </View>
                {minPrice && (
                  <ThemedText
                    style={[styles.shiftPrice, { textAlign: isRTL ? "right" : "left" }]}
                  >
                    {minPrice} {isRTL ? "د.ع" : "IQD"}
                  </ThemedText>
                )}
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.closedChaletBox,
              { direction: isRTL ? "rtl" : "ltr" },
            ]}
          >
            <SolarForbiddenCircleLineDuotone size={24} color="#EF4444" />
            <ThemedText style={styles.closedChaletText}>
              {isRTL
                ? "عذراً، لا تتوفر أي فترات حجز حالياً في هذا الشاليه."
                : "Sorry, no booking periods are currently available."}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Facilities */}
      {facilities.length > 0 && (
        <>
          <View
            style={[
              styles.facilitiesHeader,
              { flexDirection: "row", direction: isRTL ? "rtl" : "ltr" },
            ]}
          >
            <SectionHeader
              title={isRTL ? "المرافق" : "Facilities"}
              isRTL={isRTL}
            />
            {facilities.length > 8 && (
              <TouchableOpacity onPress={onSeeAllFacilities}>
                <ThemedText style={styles.viewAllText}>
                  {isRTL ? "عرض الكل" : "See all"}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <View
            style={[
              styles.facilitiesGrid,
              { direction: isRTL ? "rtl" : "ltr" },
            ]}
          >
            {facilities.slice(0, 8).map((f: any, i: number) => (
              <View key={i} style={styles.facilityCell}>
                <View style={styles.shapeCont}>
                  <Svg height={55} width={55} viewBox="0 0 60 60">
                    <Path d={f.shapePath} fill={f.shapeColor} />
                  </Svg>
                  <View style={styles.iconInShape}>
                    {f.iconUrl ? (
                      <ExpoImage
                        source={f.iconUrl}
                        style={styles.facilityIcon}
                        contentFit="contain"
                      />
                    ) : (
                      <SolarWidgetBold size={22} color="white" />
                    )}
                  </View>
                </View>
                <ThemedText style={styles.facilityLabelText}>
                  {f.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Overview — only when the owner actually wrote one */}
      {description ? (
        <>
          <SectionHeader
            title={isRTL ? "نظرة عامة" : "Overview"}
            isRTL={isRTL}
          />
          <View style={styles.descriptionContainer}>
            <ThemedText
              style={[
                styles.descriptionText,
                { textAlign, writingDirection: isRTL ? "rtl" : "ltr" },
              ]}
            >
              {description}
            </ThemedText>
          </View>
        </>
      ) : null}

      {/* Location */}
      <SectionHeader title={isRTL ? "الموقع" : "Location"} isRTL={isRTL} />
      <View style={styles.mapCardFlat}>
        <View style={styles.mapInner}>{mapNode}</View>
        <View style={styles.mapLocLabel}>
          <ThemedText style={styles.mapLocText}>{location}</ThemedText>
        </View>
      </View>

      {/* Host — owner photo takes priority, fall back to the default avatar */}
      <HostContactCard
        name={chalet?.owner?.name || (isRTL ? "المضيف" : "Host")}
        phone={chalet?.owner?.phone}
        avatar={getAvatarSrc(chalet?.owner?.image)}
        isRTL={isRTL}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  sectionHeaderContainer: {
    justifyContent: "center",
    marginBottom: 5,
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Alexandria-Medium",
    marginVertical: 15,
    lineHeight: 28,
  },
  mainTitle: { fontSize: 22, fontFamily: "LamaSans-Black", lineHeight: 32 },
  locationSub: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "LamaSans-Regular",
    lineHeight: 20,
  },
  ratingVal: { fontSize: 18, fontFamily: "LamaSans-Black", lineHeight: 26 },
  specsRow: { flexWrap: "wrap", gap: 8 },
  specTag: {
    backgroundColor: "#F3F7FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexShrink: 1,
  },
  specText: { fontSize: 13, fontFamily: "LamaSans-Bold", flexShrink: 1 },
  shiftsGrid: { gap: 12, marginBottom: 10 },
  shiftCard: {
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    flexWrap: "nowrap",
  },
  shiftIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftInfo: { flex: 1, marginHorizontal: 12, minWidth: 0 },
  shiftName: {
    fontFamily: "Alexandria-Medium",
    fontSize: 15,
    color: "#1E293B",
    flexShrink: 1,
    lineHeight: 24,
  },
  shiftTime: {
    fontFamily: "Alexandria-Medium",
    fontSize: 12,
    color: "#64748B",
    flexShrink: 1,
    lineHeight: 20,
  },
  shiftPrice: {
    fontFamily: "Alexandria-Medium",
    fontSize: 14,
    color: "#1E293B",
    flexShrink: 0,
    lineHeight: 22,
  },
  closedChaletBox: {
    backgroundColor: "#FFF5F5",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#FFE3E3",
  },
  closedChaletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Alexandria-Medium",
    color: "#EF4444",
    lineHeight: 22,
  },
  facilitiesHeader: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: { fontSize: 13, color: "#6B7280", fontFamily: "LamaSans-Bold" },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  facilityCell: {
    width: "23%",
    alignItems: "center",
    marginBottom: 18,
    minWidth: 0,
  },
  shapeCont: {
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInShape: { position: "absolute" },
  facilityIcon: { width: 26, height: 26 },
  facilityLabelText: {
    fontSize: 12,
    fontFamily: "Alexandria-Medium",
    marginTop: 6,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
    lineHeight: 18,
  },
  descriptionContainer: { width: "100%" },
  descriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 5,
    width: "100%",
    fontFamily: "LamaSans-Regular",
  },
  mapCardFlat: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  mapInner: { height: 220, borderRadius: 24, overflow: "hidden" },
  mapLocLabel: { paddingVertical: 12, alignItems: "center" },
  mapLocText: { fontSize: 16, fontFamily: "LamaSans-Black", lineHeight: 24 },
});
